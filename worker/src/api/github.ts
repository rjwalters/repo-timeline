/**
 * GitHub API interaction functions
 * Handles fetching PR data, files, and metadata from GitHub REST API
 */

import type { PRFile, PullRequest } from "../types";

/**
 * Fetch repository metadata including default branch
 */
export async function fetchRepoInfo(
	token: string,
	owner: string,
	repo: string,
): Promise<{ default_branch: string }> {
	const url = `https://api.github.com/repos/${owner}/${repo}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!response.ok) {
		if (response.status === 404) {
			throw new Error(
				`Unable to access repository: ${owner}/${repo}. ` +
					`This repository may be private or doesn't exist. ` +
					`GitHub returns 404 for both private repos and non-existent repos.`,
			);
		}
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}

/**
 * Get total commit count for a branch by parsing Link header
 * This is efficient - only makes 1 API call with per_page=1
 */
export async function fetchCommitCount(
	token: string,
	owner: string,
	repo: string,
	branch: string,
): Promise<number> {
	// Request just 1 commit to get Link header with pagination info
	const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=1&page=1`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!response.ok) {
		if (response.status === 404) {
			throw new Error(
				`Unable to access repository: ${owner}/${repo} or branch ${branch}. ` +
					`The repository may be private, doesn't exist, or the branch name is incorrect. ` +
					`GitHub returns 404 for both private repos and non-existent repos.`,
			);
		}
		if (response.status === 403) {
			throw new Error("GitHub API rate limit exceeded");
		}
		throw new Error(`GitHub API error: ${response.status}`);
	}

	// Parse Link header to get last page number
	// Example: Link: <https://api.github.com/repositories/123/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/123/commits?per_page=1&page=117>; rel="last"
	const linkHeader = response.headers.get("Link");

	if (!linkHeader) {
		// No Link header means there's only 1 page (1 commit total)
		const commits = await response.json();
		return commits.length;
	}

	// Parse the "last" link to get total page count
	const lastLinkMatch = linkHeader.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/);

	if (lastLinkMatch) {
		const lastPage = parseInt(lastLinkMatch[1], 10);
		// Since we requested 1 per page, last page number = total commits
		return lastPage;
	}

	// Fallback: no "last" link means we're on the last page
	const commits = await response.json();
	return commits.length;
}

/**
 * Fetch commits from default branch
 */
export async function fetchCommits(
	token: string,
	owner: string,
	repo: string,
	branch: string,
	sinceCommit?: string,
	maxPages: number = 10,
	startPage: number = 1,
): Promise<any[]> {
	const allCommits: any[] = [];
	let page = startPage;
	const perPage = 100;

	console.log(`Fetching commits from ${owner}/${repo}@${branch} starting at page ${startPage}`);

	while (page < startPage + maxPages) {
		const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}&page=${page}`;

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "Repo-Timeline-Worker",
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Repository ${owner}/${repo} or branch ${branch} not found`);
			}
			if (response.status === 403) {
				throw new Error("GitHub API rate limit exceeded");
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const commits: any[] = await response.json();

		if (commits.length === 0) {
			break;
		}

		// If we have a sinceCommit, stop when we reach it
		if (sinceCommit) {
			const sinceIndex = commits.findIndex((c) => c.sha === sinceCommit);
			if (sinceIndex >= 0) {
				allCommits.push(...commits.slice(0, sinceIndex));
				break;
			}
		}

		allCommits.push(...commits);

		// If we got fewer commits than requested, we're done
		if (commits.length < perPage) {
			break;
		}

		page++;
	}

	console.log(`Fetched ${allCommits.length} commits from ${owner}/${repo}@${branch}`);
	return allCommits;
}

/**
 * Fetch oldest commits from a repository using GitHub's Link header pagination
 * This is the ONLY reliable way to get the actual oldest commits from a repository
 *
 * Strategy:
 * 1. Make a HEAD request to page 1 to get the Link header
 * 2. Parse the "last" page number from the Link header
 * 3. Fetch that last page directly to get the oldest commits
 * 4. Return up to maxCommitsToReturn oldest commits in chronological order
 *
 * @param maxCommitsToReturn - How many of the oldest commits to return (default: 100)
 */
export async function fetchOldestCommits(
	token: string,
	owner: string,
	repo: string,
	branch: string,
	maxCommitsToReturn: number = 100,
): Promise<any[]> {
	const perPage = 100;

	console.log(`[fetchOldestCommits] CALLED for ${owner}/${repo}@${branch} - max: ${maxCommitsToReturn}`);

	// Step 1: Get the Link header to find the last page number
	const headUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}&page=1`;

	const headResponse = await fetch(headUrl, {
		method: "HEAD",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!headResponse.ok) {
		if (headResponse.status === 404) {
			throw new Error(`Repository ${owner}/${repo} or branch ${branch} not found`);
		}
		if (headResponse.status === 403) {
			throw new Error("GitHub API rate limit exceeded");
		}
		throw new Error(`GitHub API error: ${headResponse.status}`);
	}

	// Step 2: Parse the Link header to get the last page number
	const linkHeader = headResponse.headers.get("Link");

	if (!linkHeader) {
		// No Link header means there's only 1 page total
		console.log("No Link header found - fetching page 1 (only page)");
		const response = await fetch(headUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "Repo-Timeline-Worker",
			},
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const commits = await response.json();
		// Reverse to get oldest first
		const result = [...commits].reverse().slice(0, maxCommitsToReturn);
		console.log(`Returning ${result.length} oldest commits from single page`);
		return result;
	}

	// Parse the "last" link to get the final page number
	// Example: <https://api.github.com/repositories/123/commits?per_page=100&page=38>; rel="last"
	const lastLinkMatch = linkHeader.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/);

	if (!lastLinkMatch) {
		console.log("No 'last' link found - fetching page 1");
		// Fallback to page 1
		const response = await fetch(headUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "Repo-Timeline-Worker",
			},
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const commits = await response.json();
		const result = [...commits].reverse().slice(0, maxCommitsToReturn);
		console.log(`Returning ${result.length} oldest commits from page 1`);
		return result;
	}

	const lastPage = Number.parseInt(lastLinkMatch[1], 10);
	console.log(`Found last page: ${lastPage}`);

	// Step 3: Fetch the last page to get the oldest commits
	const lastPageUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}&page=${lastPage}`;

	const lastPageResponse = await fetch(lastPageUrl, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!lastPageResponse.ok) {
		throw new Error(`GitHub API error: ${lastPageResponse.status}`);
	}

	let lastPageCommits: any[] = await lastPageResponse.json();

	// GitHub API quirk: Sometimes the Link header reports a last page that's empty
	// (e.g., elide-dev/elide reports page 3761 but it's empty, actual last page is 38)
	// When this happens, get the actual commit count and calculate the correct last page
	if (lastPageCommits.length === 0) {
		console.log(`Last page ${lastPage} is empty - getting accurate commit count`);

		// Get the actual commit count using the efficient count API
		const actualCount = await fetchCommitCount(token, owner, repo, branch);
		console.log(`Actual commit count: ${actualCount}`);

		// Calculate the correct last page
		const actualLastPage = Math.ceil(actualCount / perPage);
		console.log(`Calculated actual last page: ${actualLastPage} (was ${lastPage})`);

		if (actualLastPage === lastPage) {
			// If they're the same, the page really is empty - no commits
			console.log("Calculated page matches Link header - no commits in repository");
			return [];
		}

		// Fetch the correct last page
		const correctLastPageUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}&page=${actualLastPage}`;

		console.log(`Fetching correct last page: ${actualLastPage}`);

		const correctLastPageResponse = await fetch(correctLastPageUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "Repo-Timeline-Worker",
			},
		});

		if (!correctLastPageResponse.ok) {
			throw new Error(`GitHub API error fetching page ${actualLastPage}: ${correctLastPageResponse.status}`);
		}

		lastPageCommits = await correctLastPageResponse.json();

		if (lastPageCommits.length === 0) {
			console.log(`Calculated last page ${actualLastPage} is also empty - no commits`);
			return [];
		}

		console.log(`Successfully fetched ${lastPageCommits.length} commits from calculated page ${actualLastPage}`);
	}

	// Step 4: The last page contains the oldest commits in reverse chronological order
	// Reverse them to get chronological order (oldest first)
	const oldestCommitsReversed = [...lastPageCommits].reverse();

	// Return up to maxCommitsToReturn oldest commits
	const result = oldestCommitsReversed.slice(0, maxCommitsToReturn);

	console.log(`Returning ${result.length} oldest commits`);
	return result;
}

/**
 * Fetch files for a specific commit
 */
export async function fetchCommitFiles(
	token: string,
	owner: string,
	repo: string,
	commitSha: string,
): Promise<any> {
	const url = `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}

/**
 * Fetch a single PR from GitHub
 */
export async function fetchSinglePR(
	token: string,
	owner: string,
	repo: string,
	prNumber: number,
): Promise<PullRequest | null> {
	const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}

/**
 * Fetch files for a specific PR
 */
export async function fetchPRFiles(
	token: string,
	owner: string,
	repo: string,
	prNumber: number,
): Promise<PRFile[]> {
	const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "Repo-Timeline-Worker",
		},
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status}`);
	}

	return await response.json();
}

/**
 * Fetch all merged PRs metadata only (no files) - fast!
 */
export async function fetchAllMergedPRsMetadata(
	token: string,
	owner: string,
	repo: string,
): Promise<any[]> {
	const allPRs: any[] = [];
	let page = 1;
	const perPage = 100;
	const maxPages = 50; // Cloudflare Workers subrequest limit

	console.log(`Fetching metadata for ${owner}/${repo}`);

	while (page <= maxPages) {
		const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=${perPage}&page=${page}&sort=created&direction=asc`;

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "Repo-Timeline-Worker",
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Repository ${owner}/${repo} not found`);
			}
			if (response.status === 403) {
				throw new Error("GitHub API rate limit exceeded");
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const prs: PullRequest[] = await response.json();

		if (prs.length === 0) {
			break;
		}

		// Filter for merged PRs and transform to simple format
		const mergedPRs = prs
			.filter((pr) => pr.merged_at)
			.map((pr) => ({
				number: pr.number,
				title: pr.title,
				user: { login: pr.user.login },
				merged_at: pr.merged_at,
				merge_commit_sha: pr.merge_commit_sha,
			}));

		allPRs.push(...mergedPRs);

		// If we got fewer PRs than requested, we're done
		if (prs.length < perPage) {
			break;
		}

		page++;
	}

	console.log(`Fetched ${allPRs.length} PRs metadata for ${owner}/${repo}`);
	return allPRs;
}

/**
 * Fetch merged PRs from GitHub API (with files)
 */
export async function fetchMergedPRs(
	token: string,
	owner: string,
	repo: string,
	sinceNumber?: number,
	maxPages: number = 10, // Fetch up to 1000 PRs (100 per page)
): Promise<any[]> {
	const allPRs: any[] = [];
	let page = 1;
	const perPage = 100;

	while (page <= maxPages) {
		const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=${perPage}&page=${page}&sort=created&direction=asc`;

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "Repo-Timeline-Worker",
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Repository ${owner}/${repo} not found`);
			}
			if (response.status === 403) {
				throw new Error("GitHub API rate limit exceeded");
			}
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const prs: PullRequest[] = await response.json();

		if (prs.length === 0) {
			break;
		}

		// Filter for merged PRs
		const mergedPRs = prs.filter((pr) => pr.merged_at);

		// If we're doing incremental update, skip PRs we already have
		const newPRs = sinceNumber
			? mergedPRs.filter((pr) => pr.number >= sinceNumber)
			: mergedPRs;

		// Limit total PRs to avoid subrequest limit (50 per worker invocation)
		const prLimit = 45; // Leave room for other requests (PR list + up to 45 file requests)
		const prsToFetch =
			allPRs.length + newPRs.length > prLimit
				? newPRs.slice(0, prLimit - allPRs.length)
				: newPRs;

		// Fetch files for each PR
		for (const pr of prsToFetch) {
			const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files`;
			const filesResponse = await fetch(filesUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "Repo-Timeline-Worker",
				},
			});

			if (filesResponse.ok) {
				const files: PRFile[] = await filesResponse.json();
				allPRs.push({ ...pr, files });
			} else {
				console.error(`Failed to fetch files for PR #${pr.number}`);
				allPRs.push({ ...pr, files: [] });
			}
		}

		// If we hit the PR limit, stop fetching more pages
		if (allPRs.length >= prLimit) {
			console.log(`Hit PR limit of ${prLimit}, stopping pagination`);
			break;
		}

		// If we got fewer PRs than requested, we're done
		if (prs.length < perPage) {
			break;
		}

		page++;
	}

	return allPRs;
}
