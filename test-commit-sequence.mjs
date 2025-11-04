// Simulate the file state tracker processing commits
import { readFileSync } from 'fs';

// Simulate FileStateTracker
class FileStateTracker {
	constructor() {
		this.fileState = new Map();
	}

	updateFromPRFiles(prFiles) {
		for (const file of prFiles) {
			if (file.status === "removed") {
				this.fileState.delete(file.filename);
			} else if (file.status === "renamed" && file.previous_filename) {
				const oldSize = this.fileState.get(file.previous_filename) || 0;
				this.fileState.delete(file.previous_filename);
				this.fileState.set(
					file.filename,
					oldSize + file.additions - file.deletions,
				);
			} else {
				const currentSize = this.fileState.get(file.filename) || 0;
				this.fileState.set(
					file.filename,
					currentSize + file.additions - file.deletions,
				);
			}
		}
	}

	getFileData() {
		return Array.from(this.fileState.entries()).map(([path, size]) => ({
			path,
			size: Math.max(0, size),
		}));
	}
}

// Load commit data from worker
const response = await fetch('https://repo-timeline-api.personal-account-251.workers.dev/api/repo/anthropics/anthropic-sdk-python');
const commits = await response.json();

console.log(`Testing first 7 commits from ${commits.length} total\n`);

const tracker = new FileStateTracker();

for (let i = 0; i < Math.min(7, commits.length); i++) {
	const commit = commits[i];

	console.log(`\n======== COMMIT ${i}: ${commit.sha.substring(0, 7)} ========`);
	console.log(`Message: ${commit.commit.message.split('\n')[0]}`);
	console.log(`Files in commit: ${commit.files?.length || 0}`);

	// Update tracker
	if (commit.files && commit.files.length > 0) {
		tracker.updateFromPRFiles(commit.files);
	}

	// Get current file state
	const fileData = tracker.getFileData();
	console.log(`Files in tracker after processing: ${fileData.length}`);

	if (fileData.length > 0) {
		console.log(`Sample files: ${fileData.slice(0, 3).map(f => f.path).join(', ')}`);

		// Check for directories
		const topLevelDirs = new Set();
		for (const file of fileData) {
			const parts = file.path.split('/');
			if (parts.length > 1) {
				topLevelDirs.add(parts[0]);
			}
		}
		console.log(`Top-level directories: ${Array.from(topLevelDirs).join(', ')}`);
		console.log(`Root node SHOULD be created: ${fileData.length > 0 ? 'YES' : 'NO'}`);
		console.log(`Root edges should connect to: ${Array.from(topLevelDirs).join(', ')}`);
	} else {
		console.log(`NO FILES - Root node should NOT be created`);
	}
}
