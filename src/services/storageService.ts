import type { CommitData } from "../types";
import { IndexedDBService } from "./indexedDBService";

/**
 * Storage service for commit data
 * Uses IndexedDB for much higher storage capacity (50MB-1GB+) vs localStorage (5-10MB)
 * Falls back to localStorage if IndexedDB is not available
 */
export class StorageService {
	/**
	 * Save commit data to IndexedDB
	 */
	static async saveCommits(
		repoKey: string,
		commits: CommitData[],
	): Promise<boolean> {
		return IndexedDBService.saveCommits(repoKey, commits);
	}

	/**
	 * Load commit data from IndexedDB
	 */
	static async loadCommits(repoKey: string): Promise<CommitData[] | null> {
		return IndexedDBService.loadCommits(repoKey);
	}

	/**
	 * Clear cache for a specific repo
	 */
	static async clearCache(repoKey: string): Promise<void> {
		return IndexedDBService.clearCache(repoKey);
	}

	/**
	 * Clear all repo timeline caches
	 */
	static async clearAllCaches(): Promise<void> {
		return IndexedDBService.clearAllCaches();
	}

	/**
	 * Get cache metadata
	 */
	static async getCacheInfo(repoKey: string): Promise<{
		exists: boolean;
		age?: number;
		commitCount?: number;
	}> {
		return IndexedDBService.getCacheInfo(repoKey);
	}

	/**
	 * Get storage usage statistics
	 */
	static async getStorageStats(): Promise<{
		totalCaches: number;
		estimatedSize: number;
	}> {
		return IndexedDBService.getStorageStats();
	}
}
