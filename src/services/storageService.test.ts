import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CommitData } from "../types";
import { StorageService } from "./storageService";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	const mockStorage = {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
		key: (index: number) => {
			const keys = Object.keys(store);
			return keys[index] || null;
		},
		get length() {
			return Object.keys(store).length;
		},
	};

	// Make Object.keys() work on localStorage
	return new Proxy(mockStorage, {
		get(target, prop) {
			if (prop in target) {
				return target[prop as keyof typeof target];
			}
			return undefined;
		},
		ownKeys() {
			return Object.keys(store);
		},
		getOwnPropertyDescriptor(target, prop) {
			if (prop in target) {
				return {
					enumerable: false, // Methods shouldn't be enumerable
					configurable: true,
					writable: true,
				};
			}
			return {
				enumerable: true,
				configurable: true,
			};
		},
	});
})();

// Override global localStorage
Object.defineProperty(globalThis, "localStorage", {
	value: localStorageMock,
	writable: true,
});

describe("StorageService", () => {
	const mockCommits: CommitData[] = [
		{
			hash: "abc123",
			message: "Initial commit",
			author: "Test Author",
			date: new Date("2024-01-01T10:00:00Z"),
			files: [
				{
					id: "src/index.ts",
					path: "src/index.ts",
					name: "index.ts",
					size: 100,
					type: "file",
				},
			],
			edges: [
				{
					source: "src",
					target: "src/index.ts",
					type: "parent",
				},
			],
		},
		{
			hash: "def456",
			message: "Add feature",
			author: "Another Author",
			date: new Date("2024-01-02T15:30:00Z"),
			files: [
				{
					id: "src/feature.ts",
					path: "src/feature.ts",
					name: "feature.ts",
					size: 200,
					type: "file",
				},
			],
			edges: [
				{
					source: "src",
					target: "src/feature.ts",
					type: "parent",
				},
			],
		},
	];

	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	describe("saveCommits", () => {
		it("should save commits to localStorage", () => {
			const result = StorageService.saveCommits("facebook/react", mockCommits);

			expect(result).toBe(true);

			const stored = localStorage.getItem("github-timeline:facebook/react");
			expect(stored).toBeTruthy();
		});

		it("should serialize data correctly", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const stored = localStorage.getItem("github-timeline:test/repo");
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed.repoKey).toBe("test/repo");
			expect(parsed.commits).toHaveLength(2);
			expect(parsed.version).toBe(1);
			expect(parsed.lastUpdated).toBeGreaterThan(0);
		});

		it("should convert Date objects to ISO strings", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const stored = localStorage.getItem("github-timeline:test/repo");
			const parsed = JSON.parse(stored!);

			// Dates should be stored as strings
			expect(typeof parsed.commits[0].date).toBe("string");
			expect(parsed.commits[0].date).toBe("2024-01-01T10:00:00.000Z");
			expect(parsed.commits[1].date).toBe("2024-01-02T15:30:00.000Z");
		});

		it("should include version number", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const stored = localStorage.getItem("github-timeline:test/repo");
			const parsed = JSON.parse(stored!);

			expect(parsed.version).toBe(1);
		});

		it("should include timestamp", () => {
			const beforeSave = Date.now();
			StorageService.saveCommits("test/repo", mockCommits);
			const afterSave = Date.now();

			const stored = localStorage.getItem("github-timeline:test/repo");
			const parsed = JSON.parse(stored!);

			expect(parsed.lastUpdated).toBeGreaterThanOrEqual(beforeSave);
			expect(parsed.lastUpdated).toBeLessThanOrEqual(afterSave);
		});

		it("should handle empty commits array", () => {
			const result = StorageService.saveCommits("test/repo", []);

			expect(result).toBe(true);

			const stored = localStorage.getItem("github-timeline:test/repo");
			const parsed = JSON.parse(stored!);
			expect(parsed.commits).toHaveLength(0);
		});

		it("should return false on localStorage error", () => {
			// Mock implementation by replacing function
			const originalSetItem = localStorage.setItem.bind(localStorage);
			localStorageMock.setItem = () => {
				throw new Error("Storage error");
			};

			const result = StorageService.saveCommits("test/repo", mockCommits);

			expect(result).toBe(false);

			// Restore
			localStorageMock.setItem = originalSetItem;
		});

		it("should handle QuotaExceededError", () => {
			// Mock implementation by replacing function
			const originalSetItem = localStorage.setItem.bind(localStorage);
			localStorageMock.setItem = () => {
				const error = new Error("Quota exceeded");
				error.name = "QuotaExceededError";
				throw error;
			};

			const result = StorageService.saveCommits("test/repo", mockCommits);

			expect(result).toBe(false);

			// Restore
			localStorageMock.setItem = originalSetItem;
		});

		it("should overwrite existing data for same repo", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const newCommits: CommitData[] = [
				{
					...mockCommits[0],
					message: "Updated commit",
				},
			];

			StorageService.saveCommits("test/repo", newCommits);

			const loaded = StorageService.loadCommits("test/repo");
			expect(loaded).toHaveLength(1);
			expect(loaded?.[0].message).toBe("Updated commit");
		});
	});

	describe("loadCommits", () => {
		it("should load saved commits", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded).toHaveLength(2);
			expect(loaded?.[0].hash).toBe("abc123");
			expect(loaded?.[1].hash).toBe("def456");
		});

		it("should return null for non-existent cache", () => {
			const loaded = StorageService.loadCommits("nonexistent/repo");

			expect(loaded).toBeNull();
		});

		it("should convert ISO strings back to Date objects", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded?.[0].date).toBeInstanceOf(Date);
			expect(loaded?.[0].date.toISOString()).toBe("2024-01-01T10:00:00.000Z");
			expect(loaded?.[1].date).toBeInstanceOf(Date);
			expect(loaded?.[1].date.toISOString()).toBe("2024-01-02T15:30:00.000Z");
		});

		it("should return null and clear cache for version mismatch", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			// Manually modify the version
			const stored = localStorage.getItem("github-timeline:test/repo");
			const data = JSON.parse(stored!);
			data.version = 0; // Old version
			localStorage.setItem("github-timeline:test/repo", JSON.stringify(data));

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeNull();

			// Cache should be cleared
			const stillExists = localStorage.getItem("github-timeline:test/repo");
			expect(stillExists).toBeNull();
		});

		it("should return null and clear cache for expired data", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			// Manually set lastUpdated to 25 hours ago
			const stored = localStorage.getItem("github-timeline:test/repo");
			const data = JSON.parse(stored!);
			data.lastUpdated = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
			localStorage.setItem("github-timeline:test/repo", JSON.stringify(data));

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeNull();

			// Cache should be cleared
			const stillExists = localStorage.getItem("github-timeline:test/repo");
			expect(stillExists).toBeNull();
		});

		it("should load cache that is not expired", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			// Manually set lastUpdated to 1 hour ago
			const stored = localStorage.getItem("github-timeline:test/repo");
			const data = JSON.parse(stored!);
			data.lastUpdated = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
			localStorage.setItem("github-timeline:test/repo", JSON.stringify(data));

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded).toHaveLength(2);
		});

		it("should return null on parse error", () => {
			localStorage.setItem("github-timeline:test/repo", "invalid json");

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeNull();
		});

		it("should handle localStorage getItem error gracefully", () => {
			const originalGetItem = localStorage.getItem.bind(localStorage);
			localStorageMock.getItem = () => {
				throw new Error("Storage error");
			};

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeNull();

			// Restore
			localStorageMock.getItem = originalGetItem;
		});
	});

	describe("clearCache", () => {
		it("should clear cache for specific repo", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			StorageService.clearCache("test/repo");

			const loaded = StorageService.loadCommits("test/repo");
			expect(loaded).toBeNull();
		});

		it("should not affect other repos", () => {
			StorageService.saveCommits("repo1", mockCommits);
			StorageService.saveCommits("repo2", mockCommits);

			StorageService.clearCache("repo1");

			const loaded1 = StorageService.loadCommits("repo1");
			const loaded2 = StorageService.loadCommits("repo2");

			expect(loaded1).toBeNull();
			expect(loaded2).toBeTruthy();
		});

		it("should handle clearing non-existent cache gracefully", () => {
			expect(() => {
				StorageService.clearCache("nonexistent/repo");
			}).not.toThrow();
		});

		it("should handle removeItem error gracefully", () => {
			const originalRemoveItem = localStorage.removeItem.bind(localStorage);
			localStorageMock.removeItem = () => {
				throw new Error("Storage error");
			};

			expect(() => {
				StorageService.clearCache("test/repo");
			}).not.toThrow();

			// Restore
			localStorageMock.removeItem = originalRemoveItem;
		});
	});

	describe("clearAllCaches", () => {
		it("should clear all repo timeline caches", () => {
			StorageService.saveCommits("repo1", mockCommits);
			StorageService.saveCommits("repo2", mockCommits);
			StorageService.saveCommits("repo3", mockCommits);

			StorageService.clearAllCaches();

			expect(StorageService.loadCommits("repo1")).toBeNull();
			expect(StorageService.loadCommits("repo2")).toBeNull();
			expect(StorageService.loadCommits("repo3")).toBeNull();
		});

		it("should not clear non-github-timeline items", () => {
			localStorage.setItem("other-app-data", "should not be deleted");
			StorageService.saveCommits("repo1", mockCommits);

			StorageService.clearAllCaches();

			expect(localStorage.getItem("other-app-data")).toBe(
				"should not be deleted",
			);
			expect(StorageService.loadCommits("repo1")).toBeNull();
		});

		it("should handle empty localStorage", () => {
			expect(() => {
				StorageService.clearAllCaches();
			}).not.toThrow();
		});

		it("should handle errors gracefully", () => {
			StorageService.saveCommits("repo1", mockCommits);

			const originalRemoveItem = localStorage.removeItem.bind(localStorage);
			localStorageMock.removeItem = () => {
				throw new Error("Storage error");
			};

			expect(() => {
				StorageService.clearAllCaches();
			}).not.toThrow();

			// Restore
			localStorageMock.removeItem = originalRemoveItem;
		});
	});

	describe("getCacheInfo", () => {
		it("should return exists: false for non-existent cache", () => {
			const info = StorageService.getCacheInfo("nonexistent/repo");

			expect(info.exists).toBe(false);
			expect(info.age).toBeUndefined();
			expect(info.commitCount).toBeUndefined();
		});

		it("should return cache metadata for existing cache", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const info = StorageService.getCacheInfo("test/repo");

			expect(info.exists).toBe(true);
			expect(info.age).toBeDefined();
			expect(info.age).toBeGreaterThanOrEqual(0);
			expect(info.age).toBeLessThan(1000); // Should be very recent
			expect(info.commitCount).toBe(2);
		});

		it("should calculate age correctly", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			// Manually set lastUpdated to 2 hours ago
			const stored = localStorage.getItem("github-timeline:test/repo");
			const data = JSON.parse(stored!);
			const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
			data.lastUpdated = twoHoursAgo;
			localStorage.setItem("github-timeline:test/repo", JSON.stringify(data));

			const info = StorageService.getCacheInfo("test/repo");

			expect(info.age).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000 - 100); // Allow small margin
			expect(info.age).toBeLessThanOrEqual(2 * 60 * 60 * 1000 + 100);
		});

		it("should handle parse error gracefully", () => {
			localStorage.setItem("github-timeline:test/repo", "invalid json");

			const info = StorageService.getCacheInfo("test/repo");

			expect(info.exists).toBe(false);
		});
	});

	describe("getStorageStats", () => {
		it("should return zero stats for empty storage", () => {
			const stats = StorageService.getStorageStats();

			expect(stats.totalCaches).toBe(0);
			expect(stats.estimatedSize).toBe(0);
		});

		it("should count cached repos", () => {
			StorageService.saveCommits("repo1", mockCommits);
			StorageService.saveCommits("repo2", mockCommits);

			const stats = StorageService.getStorageStats();

			expect(stats.totalCaches).toBe(2);
		});

		it("should estimate storage size", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const stats = StorageService.getStorageStats();

			expect(stats.estimatedSize).toBeGreaterThan(0);
			// Size should be reasonable for 2 commits
			expect(stats.estimatedSize).toBeLessThan(100000); // Less than 100KB
		});

		it("should not count non-github-timeline items", () => {
			localStorage.setItem("other-app-data", "some data");
			StorageService.saveCommits("repo1", mockCommits);

			const stats = StorageService.getStorageStats();

			expect(stats.totalCaches).toBe(1);
		});

		it("should handle errors gracefully", () => {
			vi.spyOn(Object, "keys").mockImplementation(() => {
				throw new Error("Error");
			});

			const stats = StorageService.getStorageStats();

			expect(stats.totalCaches).toBe(0);
			expect(stats.estimatedSize).toBe(0);
		});
	});

	describe("storage key generation", () => {
		it("should generate correct storage keys", () => {
			StorageService.saveCommits("facebook/react", mockCommits);
			StorageService.saveCommits("microsoft/vscode", mockCommits);

			const reactKey = localStorage.getItem("github-timeline:facebook/react");
			const vscodeKey = localStorage.getItem(
				"github-timeline:microsoft/vscode",
			);

			expect(reactKey).toBeTruthy();
			expect(vscodeKey).toBeTruthy();
		});

		it("should handle special characters in repo names", () => {
			StorageService.saveCommits("repo/with-dash", mockCommits);
			StorageService.saveCommits("repo/with_underscore", mockCommits);

			const loaded1 = StorageService.loadCommits("repo/with-dash");
			const loaded2 = StorageService.loadCommits("repo/with_underscore");

			expect(loaded1).toBeTruthy();
			expect(loaded2).toBeTruthy();
		});
	});

	describe("data integrity", () => {
		it("should preserve file node properties", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded?.[0].files[0]).toMatchObject({
				id: "src/index.ts",
				path: "src/index.ts",
				name: "index.ts",
				size: 100,
				type: "file",
			});
		});

		it("should preserve edge properties", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded?.[0].edges[0]).toMatchObject({
				source: "src",
				target: "src/index.ts",
				type: "parent",
			});
		});

		it("should preserve commit metadata", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded?.[0]).toMatchObject({
				hash: "abc123",
				message: "Initial commit",
				author: "Test Author",
			});
		});

		it("should handle commits with many files", () => {
			const manyFiles: CommitData = {
				hash: "xyz789",
				message: "Big commit",
				author: "Test",
				date: new Date(),
				files: Array.from({ length: 100 }, (_, i) => ({
					id: `file${i}.ts`,
					path: `file${i}.ts`,
					name: `file${i}.ts`,
					size: i * 10,
					type: "file" as const,
				})),
				edges: [],
			};

			StorageService.saveCommits("test/repo", [manyFiles]);

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded?.[0].files).toHaveLength(100);
		});
	});

	describe("cache expiry", () => {
		it("should accept cache within 24 hours", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			// Set to 23 hours ago (within expiry)
			const stored = localStorage.getItem("github-timeline:test/repo");
			const data = JSON.parse(stored!);
			data.lastUpdated = Date.now() - 23 * 60 * 60 * 1000;
			localStorage.setItem("github-timeline:test/repo", JSON.stringify(data));

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
		});

		it("should reject cache older than 24 hours", () => {
			StorageService.saveCommits("test/repo", mockCommits);

			// Set to 25 hours ago (expired)
			const stored = localStorage.getItem("github-timeline:test/repo");
			const data = JSON.parse(stored!);
			data.lastUpdated = Date.now() - 25 * 60 * 60 * 1000;
			localStorage.setItem("github-timeline:test/repo", JSON.stringify(data));

			const loaded = StorageService.loadCommits("test/repo");

			expect(loaded).toBeNull();
		});
	});
});
