import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubPR, GitHubWorkerCommit } from "../types/github";
import { WorkerApiService } from "./workerApiService";

describe("WorkerApiService", () => {
	let service: WorkerApiService;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		global.fetch = fetchMock;
		service = new WorkerApiService("https://worker.dev", "test", "repo");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with correct parameters", () => {
			expect(service).toBeDefined();
		});
	});

	describe("fetchMetadata", () => {
		it("should fetch metadata successfully", async () => {
			const mockData = [
				{
					sha: "abc123",
					message: "Initial commit",
					author: "testuser",
					date: "2024-01-01T00:00:00Z",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await service.fetchMetadata();

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo/metadata",
			);
		});

		it("should handle errors with error response body", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: "Internal server error" }),
			});

			await expect(service.fetchMetadata()).rejects.toThrow(
				"Internal server error",
			);
		});

		it("should handle errors without error response body", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			});

			await expect(service.fetchMetadata()).rejects.toThrow("Unknown error");
		});
	});

	describe("fetchCacheStatus", () => {
		it("should fetch cache status successfully", async () => {
			const mockData = {
				cache: {
					exists: true,
					cachedCommits: 100,
					ageSeconds: 300,
					lastCommitSha: "abc123",
					defaultBranch: "main",
					firstCommit: { sha: "first", date: "2024-01-01T00:00:00Z" },
					lastCommit: { sha: "last", date: "2024-01-02T00:00:00Z" },
				},
				status: "ready" as const,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await service.fetchCacheStatus();

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo/cache",
			);
		});

		it("should handle error responses", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ error: "Cache not found" }),
			});

			await expect(service.fetchCacheStatus()).rejects.toThrow(
				"Cache not found",
			);
		});
	});

	describe("fetchRepoSummary", () => {
		it("should fetch repo summary successfully", async () => {
			const mockData = {
				github: {
					estimatedTotalPRs: 500,
					hasMoreThan100PRs: true,
					firstMergedPR: { number: 1, merged_at: "2024-01-01T00:00:00Z" },
				},
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await service.fetchRepoSummary();

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo/summary",
			);
		});

		it("should handle error responses", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: "Server error" }),
			});

			await expect(service.fetchRepoSummary()).rejects.toThrow("Server error");
		});
	});

	describe("fetchSinglePR", () => {
		it("should fetch single PR successfully", async () => {
			const mockPR: GitHubPR = {
				number: 123,
				title: "Test PR",
				user: { login: "testuser" },
				merged_at: "2024-01-01T00:00:00Z",
				merge_commit_sha: "abc123",
				files: [],
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockPR,
			});

			const result = await service.fetchSinglePR(123);

			expect(result).toEqual(mockPR);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo/pr/123",
			);
		});

		it("should return null for 404 responses", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ error: "Not found" }),
			});

			const result = await service.fetchSinglePR(999);

			expect(result).toBeNull();
		});

		it("should throw error for non-404 error responses", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: "Server error" }),
			});

			await expect(service.fetchSinglePR(123)).rejects.toThrow("Server error");
		});
	});

	describe("fetchMoreCommits", () => {
		it("should fetch more commits successfully", async () => {
			const mockCommit: GitHubWorkerCommit = {
				sha: "abc123",
				commit: {
					message: "Test commit",
					author: {
						name: "testuser",
						date: "2024-01-01T00:00:00Z",
					},
				},
				files: [
					{
						filename: "test.ts",
						status: "added",
						additions: 10,
						deletions: 0,
						changes: 10,
					},
				],
			};

			const mockData = {
				commits: [mockCommit],
				fetchedCount: 1,
				totalCached: 101,
				totalAvailable: 200,
				hasMore: true,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await service.fetchMoreCommits();

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo/fetch-more",
			);
		});

		it("should handle empty response with defaults", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const result = await service.fetchMoreCommits();

			expect(result).toEqual({
				commits: [],
				fetchedCount: 0,
				totalCached: 0,
				totalAvailable: 0,
				hasMore: false,
			});
		});

		it("should handle error responses", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: "Fetch failed" }),
			});

			await expect(service.fetchMoreCommits()).rejects.toThrow("Fetch failed");
		});
	});

	describe("fetchCommits", () => {
		it("should fetch commits with default pagination", async () => {
			const mockCommits: GitHubWorkerCommit[] = [
				{
					sha: "abc123",
					commit: {
						message: "Test commit",
						author: {
							name: "testuser",
							date: "2024-01-01T00:00:00Z",
						},
					},
					files: [],
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockCommits,
				headers: new Headers({
					"X-Total-Count": "100",
					"X-Has-More": "true",
					"X-Offset": "0",
					"X-Limit": "40",
				}),
			});

			const result = await service.fetchCommits();

			expect(result).toEqual({
				commits: mockCommits,
				totalCount: 100,
				hasMore: true,
				offset: 0,
				limit: 40,
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo?offset=0&limit=40",
			);
		});

		it("should fetch commits with custom pagination", async () => {
			const mockCommits: GitHubWorkerCommit[] = [];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockCommits,
				headers: new Headers({
					"X-Total-Count": "100",
					"X-Has-More": "false",
					"X-Offset": "80",
					"X-Limit": "20",
				}),
			});

			const result = await service.fetchCommits(80, 20);

			expect(result).toEqual({
				commits: mockCommits,
				totalCount: 100,
				hasMore: false,
				offset: 80,
				limit: 20,
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"https://worker.dev/api/repo/test/repo?offset=80&limit=20",
			);
		});

		it("should handle missing pagination headers with defaults", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
				headers: new Headers(),
			});

			const result = await service.fetchCommits();

			expect(result).toEqual({
				commits: [],
				totalCount: 0,
				hasMore: false,
				offset: 0,
				limit: 40,
			});
		});

		it("should handle error responses", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: "Bad request" }),
			});

			await expect(service.fetchCommits()).rejects.toThrow("Bad request");
		});
	});

	describe("error handling edge cases", () => {
		it("should handle network errors", async () => {
			fetchMock.mockRejectedValueOnce(new Error("Network error"));

			await expect(service.fetchMetadata()).rejects.toThrow("Network error");
		});

		it("should handle malformed JSON in error response", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => {
					throw new Error("Malformed JSON");
				},
			});

			await expect(service.fetchCacheStatus()).rejects.toThrow("Unknown error");
		});
	});
});
