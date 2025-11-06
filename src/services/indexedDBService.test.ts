import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import type { CommitData } from "../types";
import { IndexedDBService } from "./indexedDBService";

describe("IndexedDBService", () => {
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

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		// Reset the database promise to force a fresh connection
		(IndexedDBService as any).dbPromise = null;
		// Clear all data
		await IndexedDBService.clearAllCaches();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		// Clean up after each test
		try {
			await IndexedDBService.clearAllCaches();
		} catch {
			// Ignore cleanup errors
		}
		// Reset the database promise
		(IndexedDBService as any).dbPromise = null;
	});

	describe("saveCommits", () => {
		it("should save commits to IndexedDB", async () => {
			const result = await IndexedDBService.saveCommits(
				"test/repo",
				mockCommits,
			);
			expect(result).toBe(true);
		});

		it("should overwrite existing data for same repo", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const newCommits: CommitData[] = [
				{
					...mockCommits[0],
					message: "Updated commit",
				},
			];

			await IndexedDBService.saveCommits("test/repo", newCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toHaveLength(1);
			expect(loaded?.[0].message).toBe("Updated commit");
		});

		it("should return false on database errors", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					// Suppress console errors in test
				});

			// Mock getDB to reject
			vi.spyOn(IndexedDBService as any, "getDB").mockRejectedValueOnce(
				new Error("Database error"),
			);

			const result = await IndexedDBService.saveCommits(
				"test/repo",
				mockCommits,
			);

			expect(result).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("loadCommits", () => {
		it("should load saved commits", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded).toHaveLength(2);
			expect(loaded?.[0].hash).toBe("abc123");
			expect(loaded?.[1].hash).toBe("def456");
		});

		it("should return null for non-existent cache", async () => {
			const loaded = await IndexedDBService.loadCommits("nonexistent/repo");

			expect(loaded).toBeNull();
		});

		it("should convert ISO strings back to Date objects", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded?.[0].date).toBeInstanceOf(Date);
			expect(loaded?.[0].date.toISOString()).toBe("2024-01-01T10:00:00.000Z");
			expect(loaded?.[1].date).toBeInstanceOf(Date);
			expect(loaded?.[1].date.toISOString()).toBe("2024-01-02T15:30:00.000Z");
		});

		it("should reject cache with wrong version", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			// Manually modify the version in the database
			const db = await (IndexedDBService as any).getDB();
			const transaction = db.transaction(["repositories"], "readwrite");
			const store = transaction.objectStore("repositories");
			const request = store.get("test/repo");

			await new Promise((resolve) => {
				request.onsuccess = () => {
					const data = request.result;
					data.version = 999; // Wrong version
					store.put(data);
					resolve(undefined);
				};
			});

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toBeNull();
		});

		it("should reject expired cache (older than 24 hours)", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			// Manually modify the lastUpdated timestamp to be 25 hours ago
			const db = await (IndexedDBService as any).getDB();
			const transaction = db.transaction(["repositories"], "readwrite");
			const store = transaction.objectStore("repositories");
			const request = store.get("test/repo");

			await new Promise((resolve) => {
				request.onsuccess = () => {
					const data = request.result;
					data.lastUpdated = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
					store.put(data);
					resolve(undefined);
				};
			});

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toBeNull();
		});

		it("should return null on database errors", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					// Suppress console errors in test
				});

			// Mock getDB to reject
			vi.spyOn(IndexedDBService as any, "getDB").mockRejectedValueOnce(
				new Error("Database error"),
			);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("clearCache", () => {
		it("should clear cache for specific repo", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			await IndexedDBService.clearCache("test/repo");

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toBeNull();
		});

		it("should not affect other repos", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);

			await IndexedDBService.clearCache("repo1");

			const loaded1 = await IndexedDBService.loadCommits("repo1");
			const loaded2 = await IndexedDBService.loadCommits("repo2");

			expect(loaded1).toBeNull();
			expect(loaded2).toBeTruthy();
		});

		it("should handle clear errors gracefully", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					// Suppress console errors in test
				});

			// Mock getDB to reject
			vi.spyOn(IndexedDBService as any, "getDB").mockRejectedValueOnce(
				new Error("Database error"),
			);

			// Should not throw
			await IndexedDBService.clearCache("test/repo");
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("clearAllCaches", () => {
		it("should clear all repo timeline caches", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);
			await IndexedDBService.saveCommits("repo3", mockCommits);

			await IndexedDBService.clearAllCaches();

			expect(await IndexedDBService.loadCommits("repo1")).toBeNull();
			expect(await IndexedDBService.loadCommits("repo2")).toBeNull();
			expect(await IndexedDBService.loadCommits("repo3")).toBeNull();
		});

		it("should handle clear all errors gracefully", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					// Suppress console errors in test
				});

			// Mock getDB to reject
			vi.spyOn(IndexedDBService as any, "getDB").mockRejectedValueOnce(
				new Error("Database error"),
			);

			// Should not throw
			await IndexedDBService.clearAllCaches();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("getCacheInfo", () => {
		it("should return exists: false for non-existent cache", async () => {
			const info = await IndexedDBService.getCacheInfo("nonexistent/repo");

			expect(info.exists).toBe(false);
			expect(info.age).toBeUndefined();
			expect(info.commitCount).toBeUndefined();
		});

		it("should return cache metadata for existing cache", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const info = await IndexedDBService.getCacheInfo("test/repo");

			expect(info.exists).toBe(true);
			expect(info.age).toBeDefined();
			expect(info.age).toBeGreaterThanOrEqual(0);
			expect(info.age).toBeLessThan(1000); // Should be very recent
			expect(info.commitCount).toBe(2);
		});

		it("should return false exists on database errors", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					// Suppress console errors in test
				});

			// Mock getDB to reject
			vi.spyOn(IndexedDBService as any, "getDB").mockRejectedValueOnce(
				new Error("Database error"),
			);

			const info = await IndexedDBService.getCacheInfo("test/repo");

			expect(info.exists).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("getStorageStats", () => {
		it("should return storage statistics", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);

			const stats = await IndexedDBService.getStorageStats();

			expect(stats.totalCaches).toBe(2);
			expect(stats.estimatedSize).toBeGreaterThanOrEqual(0);
		});

		it("should return zero stats when empty", async () => {
			const stats = await IndexedDBService.getStorageStats();

			expect(stats.totalCaches).toBe(0);
			expect(stats.estimatedSize).toBeGreaterThanOrEqual(0);
		});

		it("should return zero stats on database errors", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {
					// Suppress console errors in test
				});

			// Mock getDB to reject
			vi.spyOn(IndexedDBService as any, "getDB").mockRejectedValueOnce(
				new Error("Database error"),
			);

			const stats = await IndexedDBService.getStorageStats();

			expect(stats).toEqual({ totalCaches: 0, estimatedSize: 0 });
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("data integrity", () => {
		it("should preserve file node properties", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded?.[0].files[0]).toMatchObject({
				id: "src/index.ts",
				path: "src/index.ts",
				name: "index.ts",
				size: 100,
				type: "file",
			});
		});

		it("should preserve edge properties", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded?.[0].edges[0]).toMatchObject({
				source: "src",
				target: "src/index.ts",
				type: "parent",
			});
		});

		it("should preserve commit metadata", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded?.[0]).toMatchObject({
				hash: "abc123",
				message: "Initial commit",
				author: "Test Author",
			});
		});

		it("should handle commits with many files", async () => {
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

			await IndexedDBService.saveCommits("test/repo", [manyFiles]);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
			expect(loaded?.[0].files).toHaveLength(100);
		});
	});

	describe("storage key generation", () => {
		it("should handle special characters in repo names", async () => {
			await IndexedDBService.saveCommits("repo/with-dash", mockCommits);
			await IndexedDBService.saveCommits("repo/with_underscore", mockCommits);

			const loaded1 = await IndexedDBService.loadCommits("repo/with-dash");
			const loaded2 = await IndexedDBService.loadCommits(
				"repo/with_underscore",
			);

			expect(loaded1).toBeTruthy();
			expect(loaded2).toBeTruthy();
		});
	});

	describe("cache expiry", () => {
		it("should accept cache within 24 hours", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).toBeTruthy();
		});

		it("should provide age information", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const cacheInfo = await IndexedDBService.getCacheInfo("test/repo");
			expect(cacheInfo.exists).toBe(true);
			expect(cacheInfo.age).toBeDefined();
		});
	});
});
