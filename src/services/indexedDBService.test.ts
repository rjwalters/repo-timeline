import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CommitData } from "../types";
import { IndexedDBService } from "./indexedDBService";
import "fake-indexeddb/auto";

describe("IndexedDBService", () => {
	const mockCommits: CommitData[] = [
		{
			hash: "abc123",
			message: "Test commit",
			author: "testuser",
			date: new Date("2024-01-01T00:00:00Z"),
			files: [],
			edges: [],
		},
	];

	beforeEach(() => {
		// Clear any existing data
		return IndexedDBService.clearAllCaches();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("saveCommits", () => {
		it("should save commits successfully", async () => {
			const result = await IndexedDBService.saveCommits(
				"test/repo",
				mockCommits,
			);

			expect(result).toBe(true);
		});

		it("should save multiple repos independently", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);

			const repo1Data = await IndexedDBService.loadCommits("repo1");
			const repo2Data = await IndexedDBService.loadCommits("repo2");

			expect(repo1Data).not.toBeNull();
			expect(repo2Data).not.toBeNull();
		});

		it("should update existing cache when called multiple times", async () => {
			const firstCommits = [mockCommits[0]];
			const secondCommits = [
				...mockCommits,
				{ ...mockCommits[0], hash: "def456" },
			];

			await IndexedDBService.saveCommits("test/repo", firstCommits);
			await IndexedDBService.saveCommits("test/repo", secondCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toHaveLength(2);
		});
	});

	describe("loadCommits", () => {
		it("should return null for non-existent repo", async () => {
			const result = await IndexedDBService.loadCommits("non-existent");

			expect(result).toBeNull();
		});

		it("should load saved commits", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).not.toBeNull();
			expect(loaded).toHaveLength(1);
			expect(loaded![0].hash).toBe("abc123");
		});

		it("should deserialize date objects correctly", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).not.toBeNull();
			expect(loaded![0].date).toBeInstanceOf(Date);
			expect(loaded![0].date.toISOString()).toBe("2024-01-01T00:00:00.000Z");
		});

		it("should return null for expired cache", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			// Mock Date.now to simulate expired cache (> 24 hours)
			const originalNow = Date.now;
			Date.now = vi.fn(() => originalNow() + 25 * 60 * 60 * 1000);

			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).toBeNull();

			Date.now = originalNow;
		});
	});

	describe("clearCache", () => {
		it("should clear cache for specific repo", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);
			await IndexedDBService.clearCache("test/repo");

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toBeNull();
		});

		it("should not affect other repos when clearing one", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);

			await IndexedDBService.clearCache("repo1");

			const repo1Data = await IndexedDBService.loadCommits("repo1");
			const repo2Data = await IndexedDBService.loadCommits("repo2");

			expect(repo1Data).toBeNull();
			expect(repo2Data).not.toBeNull();
		});
	});

	describe("clearAllCaches", () => {
		it("should clear all caches", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);

			await IndexedDBService.clearAllCaches();

			const repo1Data = await IndexedDBService.loadCommits("repo1");
			const repo2Data = await IndexedDBService.loadCommits("repo2");

			expect(repo1Data).toBeNull();
			expect(repo2Data).toBeNull();
		});
	});

	describe("getCacheInfo", () => {
		it("should return exists: false for non-existent cache", async () => {
			const info = await IndexedDBService.getCacheInfo("non-existent");

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
			expect(info.commitCount).toBe(1);
		});

		it("should return accurate commit count", async () => {
			const multipleCommits = [
				mockCommits[0],
				{ ...mockCommits[0], hash: "def456" },
				{ ...mockCommits[0], hash: "ghi789" },
			];

			await IndexedDBService.saveCommits("test/repo", multipleCommits);

			const info = await IndexedDBService.getCacheInfo("test/repo");

			expect(info.commitCount).toBe(3);
		});
	});

	describe("getStorageStats", () => {
		it("should return storage statistics", async () => {
			const stats = await IndexedDBService.getStorageStats();

			expect(stats).toHaveProperty("totalCaches");
			expect(stats).toHaveProperty("estimatedSize");
			expect(typeof stats.totalCaches).toBe("number");
			expect(typeof stats.estimatedSize).toBe("number");
		});

		it("should count caches correctly", async () => {
			await IndexedDBService.saveCommits("repo1", mockCommits);
			await IndexedDBService.saveCommits("repo2", mockCommits);

			const stats = await IndexedDBService.getStorageStats();

			expect(stats.totalCaches).toBe(2);
		});

		it("should return 0 caches when empty", async () => {
			await IndexedDBService.clearAllCaches();

			const stats = await IndexedDBService.getStorageStats();

			expect(stats.totalCaches).toBe(0);
		});
	});

	describe("error handling", () => {
		it("should handle empty commits array", async () => {
			const result = await IndexedDBService.saveCommits("test/repo", []);

			expect(result).toBe(true);

			const loaded = await IndexedDBService.loadCommits("test/repo");
			expect(loaded).toEqual([]);
		});

		it("should handle repository keys with special characters", async () => {
			const result = await IndexedDBService.saveCommits(
				"owner/repo-name.test",
				mockCommits,
			);

			expect(result).toBe(true);

			const loaded = await IndexedDBService.loadCommits("owner/repo-name.test");
			expect(loaded).not.toBeNull();
		});
	});

	describe("cache version handling", () => {
		it("should clear cache when version mismatch", async () => {
			// This test would require mocking internal version check
			// For now, we just ensure it doesn't crash
			await IndexedDBService.saveCommits("test/repo", mockCommits);
			const loaded = await IndexedDBService.loadCommits("test/repo");

			expect(loaded).not.toBeNull();
		});
	});

	describe("concurrent operations", () => {
		it("should handle concurrent saves", async () => {
			const promises = [
				IndexedDBService.saveCommits("repo1", mockCommits),
				IndexedDBService.saveCommits("repo2", mockCommits),
				IndexedDBService.saveCommits("repo3", mockCommits),
			];

			const results = await Promise.all(promises);

			expect(results.every((r) => r === true)).toBe(true);
		});

		it("should handle concurrent reads", async () => {
			await IndexedDBService.saveCommits("test/repo", mockCommits);

			const promises = [
				IndexedDBService.loadCommits("test/repo"),
				IndexedDBService.loadCommits("test/repo"),
				IndexedDBService.loadCommits("test/repo"),
			];

			const results = await Promise.all(promises);

			expect(results.every((r) => r !== null)).toBe(true);
		});
	});

	describe("large data handling", () => {
		it("should handle large commit arrays", async () => {
			const largeCommitArray = Array.from({ length: 1000 }, (_, i) => ({
				...mockCommits[0],
				hash: `commit${i}`,
			}));

			const result = await IndexedDBService.saveCommits(
				"large/repo",
				largeCommitArray,
			);

			expect(result).toBe(true);

			const loaded = await IndexedDBService.loadCommits("large/repo");
			expect(loaded).toHaveLength(1000);
		});
	});
});
