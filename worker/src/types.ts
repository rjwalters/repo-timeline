/**
 * Type definitions for the Repo Timeline Worker
 */

export interface Env {
	DB: D1Database;
	GITHUB_TOKENS: string; // Comma-separated list of tokens
}

export interface PRFile {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	previous_filename?: string;
}

export interface PullRequest {
	number: number;
	title: string;
	user: { login: string };
	merged_at: string;
	merge_commit_sha?: string;
}

export interface CachedRepo {
	prs: PullRequest[];
	lastUpdated: number;
	lastPrNumber: number;
}

// Commit types for the new commit-based approach
export interface CommitFile {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	previous_filename?: string;
}

export interface Commit {
	sha: string;
	commit: {
		message: string;
		author: {
			name: string;
			date: string;
		};
	};
	files?: CommitFile[];
}

export interface CachedCommits {
	commits: Commit[];
	lastUpdated: number;
	lastCommitSha: string | null;
	defaultBranch: string;
}
