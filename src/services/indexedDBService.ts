import type { CommitData } from "../types";

interface CachedRepoData {
	repoKey: string;
	commits: CommitData[];
	lastUpdated: number;
	version: number;
}

const DB_NAME = "github-timeline";
const DB_VERSION = 1;
const STORE_NAME = "repositories";
const CACHE_VERSION = 2; // Match localStorage version
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * IndexedDB-based storage service for commit data
 * Provides much higher storage capacity than localStorage (50MB-1GB+ vs 5-10MB)
 */
export class IndexedDBService {
	private static dbPromise: Promise<IDBDatabase> | null = null;

	/**
	 * Initialize and get database connection
	 */
	private static async getDB(): Promise<IDBDatabase> {
		if (this.dbPromise) {
			return this.dbPromise;
		}

		this.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(new Error("Failed to open IndexedDB"));
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, {
						keyPath: "repoKey",
					});
					// Create index on lastUpdated for cleanup queries
					store.createIndex("lastUpdated", "lastUpdated", { unique: false });
				}
			};
		});

		return this.dbPromise;
	}

	/**
	 * Save commit data to IndexedDB
	 */
	static async saveCommits(
		repoKey: string,
		commits: CommitData[],
	): Promise<boolean> {
		try {
			const db = await this.getDB();

			const data: CachedRepoData = {
				repoKey,
				commits,
				lastUpdated: Date.now(),
				version: CACHE_VERSION,
			};

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([STORE_NAME], "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.put(data);

				request.onsuccess = () => {
					resolve(true);
				};

				request.onerror = () => {
					console.error("Failed to save to IndexedDB:", request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error("Failed to save to IndexedDB:", error);
			// Handle quota exceeded by clearing old entries
			if (
				error instanceof DOMException &&
				error.name === "QuotaExceededError"
			) {
				await this.clearOldestCache();
			}
			return false;
		}
	}

	/**
	 * Load commit data from IndexedDB
	 */
	static async loadCommits(repoKey: string): Promise<CommitData[] | null> {
		try {
			const db = await this.getDB();

			return new Promise((resolve) => {
				const transaction = db.transaction([STORE_NAME], "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.get(repoKey);

				request.onsuccess = () => {
					const data = request.result as CachedRepoData | undefined;

					if (!data) {
						resolve(null);
						return;
					}

					// Validate cache version
					if (data.version !== CACHE_VERSION) {
						this.clearCache(repoKey);
						resolve(null);
						return;
					}

					// Check if cache is expired
					if (Date.now() - data.lastUpdated > CACHE_EXPIRY_MS) {
						this.clearCache(repoKey);
						resolve(null);
						return;
					}

					// Deserialize Date objects
					const commits = data.commits.map((commit) => ({
						...commit,
						date: new Date(commit.date),
					}));

					resolve(commits);
				};

				request.onerror = () => {
					console.error("Failed to load from IndexedDB:", request.error);
					resolve(null);
				};
			});
		} catch (error) {
			console.error("Failed to load from IndexedDB:", error);
			return null;
		}
	}

	/**
	 * Clear cache for a specific repo
	 */
	static async clearCache(repoKey: string): Promise<void> {
		try {
			const db = await this.getDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([STORE_NAME], "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.delete(repoKey);

				request.onsuccess = () => {
					resolve();
				};

				request.onerror = () => {
					console.error("Failed to clear cache:", request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error("Failed to clear cache:", error);
		}
	}

	/**
	 * Clear all repo timeline caches
	 */
	static async clearAllCaches(): Promise<void> {
		try {
			const db = await this.getDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([STORE_NAME], "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.clear();

				request.onsuccess = () => {
					resolve();
				};

				request.onerror = () => {
					console.error("Failed to clear all caches:", request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error("Failed to clear all caches:", error);
		}
	}

	/**
	 * Get cache metadata
	 */
	static async getCacheInfo(repoKey: string): Promise<{
		exists: boolean;
		age?: number;
		commitCount?: number;
	}> {
		try {
			const db = await this.getDB();

			return new Promise((resolve) => {
				const transaction = db.transaction([STORE_NAME], "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.get(repoKey);

				request.onsuccess = () => {
					const data = request.result as CachedRepoData | undefined;

					if (!data) {
						resolve({ exists: false });
						return;
					}

					resolve({
						exists: true,
						age: Date.now() - data.lastUpdated,
						commitCount: data.commits.length,
					});
				};

				request.onerror = () => {
					console.error("Failed to get cache info:", request.error);
					resolve({ exists: false });
				};
			});
		} catch (error) {
			console.error("Failed to get cache info:", error);
			return { exists: false };
		}
	}

	/**
	 * Clear oldest cache when quota is exceeded
	 */
	private static async clearOldestCache(): Promise<void> {
		try {
			const db = await this.getDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([STORE_NAME], "readwrite");
				const store = transaction.objectStore(STORE_NAME);
				const index = store.index("lastUpdated");
				const request = index.openCursor(); // Opens cursor in ascending order (oldest first)

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest).result;
					if (cursor) {
						// Delete the oldest entry
						cursor.delete();
						resolve();
					} else {
						resolve();
					}
				};

				request.onerror = () => {
					console.error("Failed to clear oldest cache:", request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error("Failed to clear oldest cache:", error);
		}
	}

	/**
	 * Get storage usage statistics
	 */
	static async getStorageStats(): Promise<{
		totalCaches: number;
		estimatedSize: number;
	}> {
		try {
			const db = await this.getDB();

			return new Promise((resolve) => {
				const transaction = db.transaction([STORE_NAME], "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const request = store.count();

				request.onsuccess = async () => {
					const totalCaches = request.result;

					// Estimate size (rough approximation)
					// IndexedDB doesn't provide exact size, but we can use Storage API if available
					let estimatedSize = 0;
					if ("storage" in navigator && "estimate" in navigator.storage) {
						const estimate = await navigator.storage.estimate();
						estimatedSize = estimate.usage || 0;
					}

					resolve({
						totalCaches,
						estimatedSize,
					});
				};

				request.onerror = () => {
					console.error("Failed to get storage stats:", request.error);
					resolve({ totalCaches: 0, estimatedSize: 0 });
				};
			});
		} catch (error) {
			console.error("Failed to get storage stats:", error);
			return { totalCaches: 0, estimatedSize: 0 };
		}
	}
}
