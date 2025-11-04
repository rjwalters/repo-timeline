-- Add commits table to support fetching commits from default branch
-- This replaces the PR-based approach for repositories

CREATE TABLE IF NOT EXISTS commits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id INTEGER NOT NULL,
  commit_sha TEXT NOT NULL,
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  committed_at INTEGER NOT NULL, -- Unix timestamp
  created_at INTEGER NOT NULL,
  FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
  UNIQUE(repo_id, commit_sha)
);

CREATE INDEX idx_commits_repo_id ON commits(repo_id);
CREATE INDEX idx_commits_committed_at ON commits(committed_at);
CREATE INDEX idx_commits_sha ON commits(commit_sha);

-- Commit Files table - stores file changes for each commit
CREATE TABLE IF NOT EXISTS commit_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commit_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  status TEXT NOT NULL, -- 'added', 'modified', 'removed', 'renamed'
  additions INTEGER NOT NULL DEFAULT 0,
  deletions INTEGER NOT NULL DEFAULT 0,
  previous_filename TEXT, -- For renamed files
  FOREIGN KEY (commit_id) REFERENCES commits(id) ON DELETE CASCADE
);

CREATE INDEX idx_commit_files_commit_id ON commit_files(commit_id);
CREATE INDEX idx_commit_files_filename ON commit_files(filename);

-- Update repos table to track last commit SHA instead of PR number
ALTER TABLE repos ADD COLUMN last_commit_sha TEXT;
ALTER TABLE repos ADD COLUMN default_branch TEXT DEFAULT 'main';
