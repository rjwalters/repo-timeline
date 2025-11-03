import type { GitHubPRFile } from "../services/githubApiService";

/**
 * Tracks cumulative file state across multiple PR changes
 * Maintains a map of file paths to their current sizes
 */
export class FileStateTracker {
	private fileState = new Map<string, number>();

	/**
	 * Update file state based on PR file changes
	 */
	updateFromPRFiles(prFiles: GitHubPRFile[]): void {
		for (const file of prFiles) {
			if (file.status === "removed") {
				this.fileState.delete(file.filename);
			} else if (file.status === "renamed" && file.previous_filename) {
				// Handle renames - preserve old size and apply delta
				const oldSize = this.fileState.get(file.previous_filename) || 0;
				this.fileState.delete(file.previous_filename);
				this.fileState.set(
					file.filename,
					oldSize + file.additions - file.deletions,
				);
			} else {
				// Added or modified - apply delta to current size
				const currentSize = this.fileState.get(file.filename) || 0;
				this.fileState.set(
					file.filename,
					currentSize + file.additions - file.deletions,
				);
			}
		}
	}

	/**
	 * Get current file state as an array of [path, size] tuples
	 */
	getFileState(): Array<[string, number]> {
		return Array.from(this.fileState.entries());
	}

	/**
	 * Get file data suitable for building file tree
	 */
	getFileData(): Array<{ path: string; size: number }> {
		return this.getFileState().map(([path, size]) => ({
			path,
			size: Math.max(0, size), // Ensure non-negative sizes
		}));
	}

	/**
	 * Clear all tracked state
	 */
	clear(): void {
		this.fileState.clear();
	}
}
