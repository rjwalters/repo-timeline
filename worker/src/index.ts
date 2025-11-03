/**
 * Cloudflare Worker for Repo Timeline API
 *
 * Provides cached GitHub PR data with opportunistic background updates
 */

interface Env {
	DB: D1Database;
	GITHUB_TOKENS: string; // Comma-separated list of tokens
}

// Token rotation state (persisted in D1)
class TokenRotator {
	private tokens: string[];
	private currentIndex = 0;

	constructor(tokensString: string) {
		this.tokens = tokensString.split(',').map(t => t.trim()).filter(t => t.length > 0);
		if (this.tokens.length === 0) {
			throw new Error('No GitHub tokens configured');
		}
		console.log(`Initialized with ${this.tokens.length} GitHub token(s)`);
	}

	getNextToken(): string {
		const token = this.tokens[this.currentIndex];
		this.currentIndex = (this.currentIndex + 1) % this.tokens.length;
		return token;
	}

	getTokenCount(): number {
		return this.tokens.length;
	}
}

interface PRFile {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	previous_filename?: string;
}

interface PullRequest {
	number: number;
	title: string;
	user: { login: string };
	merged_at: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// CORS headers for browser requests
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		// Initialize token rotator
		const tokenRotator = new TokenRotator(env.GITHUB_TOKENS);

		// Health check endpoint
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({
				status: 'ok',
				tokens: tokenRotator.getTokenCount(),
			}), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// API endpoint: /api/repo/:owner/:repo
		const match = url.pathname.match(/^\/api\/repo\/([^\/]+)\/([^\/]+)$/);
		if (!match) {
			return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const [, owner, repo] = match;
		const fullName = `${owner}/${repo}`;

		try {
			// Get cached data immediately
			const cached = await getCachedData(env.DB, fullName);

			if (cached) {
				console.log(`Serving cached data for ${fullName} (${cached.prs.length} PRs)`);

				// Trigger background update if cache is old (> 1 hour)
				const cacheAge = Date.now() / 1000 - cached.lastUpdated;
				if (cacheAge > 3600) {
					console.log(`Cache is ${Math.round(cacheAge / 60)} minutes old, triggering background update`);
					ctx.waitUntil(updateRepoData(env.DB, tokenRotator.getNextToken(), owner, repo, cached.lastPrNumber));
				}

				return new Response(JSON.stringify(cached.prs), {
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
						'X-Cache': 'HIT',
						'X-Cache-Age': Math.round(cacheAge).toString(),
					},
				});
			}

			// No cache - fetch synchronously for first request
			console.log(`No cache for ${fullName}, fetching from GitHub`);
			const prs = await fetchAndCacheRepo(env.DB, tokenRotator.getNextToken(), owner, repo);

			return new Response(JSON.stringify(prs), {
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
					'X-Cache': 'MISS',
				},
			});
		} catch (error) {
			console.error('Error processing request:', error);
			return new Response(JSON.stringify({
				error: error instanceof Error ? error.message : 'Internal server error'
			}), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}
	},
};

/**
 * Get cached data from D1
 */
async function getCachedData(db: D1Database, fullName: string): Promise<{
	prs: any[],
	lastUpdated: number,
	lastPrNumber: number
} | null> {
	// Get repo metadata
	const repo = await db.prepare(
		'SELECT id, last_updated, last_pr_number FROM repos WHERE full_name = ?'
	).bind(fullName).first();

	if (!repo) {
		return null;
	}

	// Get all PRs with their files
	const prs = await db.prepare(`
		SELECT
			pr.pr_number,
			pr.title,
			pr.author,
			pr.merged_at,
			GROUP_CONCAT(
				json_object(
					'filename', f.filename,
					'status', f.status,
					'additions', f.additions,
					'deletions', f.deletions,
					'previous_filename', f.previous_filename
				)
			) as files
		FROM pull_requests pr
		LEFT JOIN pr_files f ON f.pr_id = pr.id
		WHERE pr.repo_id = ?
		GROUP BY pr.id
		ORDER BY pr.merged_at ASC
	`).bind(repo.id).all();

	if (!prs.results || prs.results.length === 0) {
		return null;
	}

	// Transform data to match GitHub API format
	const transformedPRs = prs.results.map((pr: any) => {
		const files = pr.files
			? pr.files.split(',').map((f: string) => JSON.parse(f))
			: [];

		return {
			number: pr.pr_number,
			title: pr.title,
			user: { login: pr.author },
			merged_at: new Date(pr.merged_at * 1000).toISOString(),
			files: files,
		};
	});

	return {
		prs: transformedPRs,
		lastUpdated: repo.last_updated,
		lastPrNumber: repo.last_pr_number,
	};
}

/**
 * Fetch repo data from GitHub and cache it
 */
async function fetchAndCacheRepo(
	db: D1Database,
	token: string,
	owner: string,
	repo: string
): Promise<any[]> {
	const fullName = `${owner}/${repo}`;

	// Fetch merged PRs from GitHub
	const prs = await fetchMergedPRs(token, owner, repo);

	if (prs.length === 0) {
		return [];
	}

	// Store in database
	await storeRepoData(db, owner, repo, prs);

	return prs;
}

/**
 * Update repo data in background (opportunistic)
 */
async function updateRepoData(
	db: D1Database,
	token: string,
	owner: string,
	repo: string,
	lastPrNumber: number
): Promise<void> {
	try {
		console.log(`Background update for ${owner}/${repo} from PR #${lastPrNumber + 1}`);

		// Fetch only new PRs since last update
		const newPRs = await fetchMergedPRs(token, owner, repo, lastPrNumber + 1);

		if (newPRs.length > 0) {
			console.log(`Found ${newPRs.length} new PRs, updating cache`);
			await storeRepoData(db, owner, repo, newPRs, true);
		} else {
			console.log('No new PRs, cache is up to date');
			// Update timestamp anyway
			await db.prepare(
				'UPDATE repos SET last_updated = ? WHERE owner = ? AND name = ?'
			).bind(Math.floor(Date.now() / 1000), owner, repo).run();
		}
	} catch (error) {
		console.error('Error in background update:', error);
	}
}

/**
 * Fetch merged PRs from GitHub API
 */
async function fetchMergedPRs(
	token: string,
	owner: string,
	repo: string,
	sinceNumber?: number
): Promise<any[]> {
	const allPRs: any[] = [];
	let page = 1;
	const perPage = 100;

	while (true) {
		const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=${perPage}&page=${page}&sort=created&direction=asc`;

		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${token}`,
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'Repo-Timeline-Worker',
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Repository ${owner}/${repo} not found`);
			}
			if (response.status === 403) {
				throw new Error('GitHub API rate limit exceeded');
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const prs: PullRequest[] = await response.json();

		if (prs.length === 0) {
			break;
		}

		// Filter for merged PRs
		const mergedPRs = prs.filter(pr => pr.merged_at);

		// If we're doing incremental update, skip PRs we already have
		const newPRs = sinceNumber
			? mergedPRs.filter(pr => pr.number >= sinceNumber)
			: mergedPRs;

		// Fetch files for each PR
		for (const pr of newPRs) {
			const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files`;
			const filesResponse = await fetch(filesUrl, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'Repo-Timeline-Worker',
				},
			});

			if (filesResponse.ok) {
				const files: PRFile[] = await filesResponse.json();
				allPRs.push({ ...pr, files });
			} else {
				console.error(`Failed to fetch files for PR #${pr.number}`);
				allPRs.push({ ...pr, files: [] });
			}

			// Rate limit protection
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		// If we got fewer PRs than requested, we're done
		if (prs.length < perPage) {
			break;
		}

		page++;
	}

	return allPRs;
}

/**
 * Store repo data in D1
 */
async function storeRepoData(
	db: D1Database,
	owner: string,
	name: string,
	prs: any[],
	isUpdate = false
): Promise<void> {
	const fullName = `${owner}/${name}`;
	const now = Math.floor(Date.now() / 1000);

	// Start transaction
	const batch = [];

	// Insert or update repo
	if (isUpdate) {
		const lastPrNumber = Math.max(...prs.map(pr => pr.number));
		batch.push(
			db.prepare(
				'UPDATE repos SET last_updated = ?, last_pr_number = ? WHERE full_name = ?'
			).bind(now, lastPrNumber, fullName)
		);
	} else {
		batch.push(
			db.prepare(`
				INSERT INTO repos (owner, name, full_name, last_updated, last_pr_number, created_at)
				VALUES (?, ?, ?, ?, ?, ?)
				ON CONFLICT(full_name) DO UPDATE SET last_updated = ?, last_pr_number = ?
			`).bind(
				owner,
				name,
				fullName,
				now,
				prs.length > 0 ? Math.max(...prs.map(pr => pr.number)) : 0,
				now,
				now,
				prs.length > 0 ? Math.max(...prs.map(pr => pr.number)) : 0
			)
		);
	}

	// Get repo ID
	const repo = await db.prepare(
		'SELECT id FROM repos WHERE full_name = ?'
	).bind(fullName).first();

	if (!repo) {
		throw new Error('Failed to get repo ID');
	}

	// Insert PRs and their files
	for (const pr of prs) {
		// Insert PR
		batch.push(
			db.prepare(`
				INSERT INTO pull_requests (repo_id, pr_number, title, author, merged_at, created_at)
				VALUES (?, ?, ?, ?, ?, ?)
				ON CONFLICT(repo_id, pr_number) DO NOTHING
			`).bind(
				repo.id,
				pr.number,
				pr.title,
				pr.user.login,
				Math.floor(new Date(pr.merged_at).getTime() / 1000),
				now
			)
		);

		// Get PR ID
		const prRow = await db.prepare(
			'SELECT id FROM pull_requests WHERE repo_id = ? AND pr_number = ?'
		).bind(repo.id, pr.number).first();

		if (prRow && pr.files) {
			// Insert files
			for (const file of pr.files) {
				batch.push(
					db.prepare(`
						INSERT INTO pr_files (pr_id, filename, status, additions, deletions, previous_filename)
						VALUES (?, ?, ?, ?, ?, ?)
						ON CONFLICT DO NOTHING
					`).bind(
						prRow.id,
						file.filename,
						file.status,
						file.additions || 0,
						file.deletions || 0,
						file.previous_filename || null
					)
				);
			}
		}
	}

	// Execute batch
	await db.batch(batch);
	console.log(`Stored ${prs.length} PRs for ${fullName}`);
}
