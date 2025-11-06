import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubPR, GitHubPRFile } from "../types/github";
import { GitHubApiService } from "./githubApiService";

describe("GitHubApiService", () => {
	let service: GitHubApiService;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		global.fetch = fetchMock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should parse repoPath correctly", () => {
			service = new GitHubApiService("facebook/react");
			expect(service).toBeDefined();
		});

		it("should accept optional token", () => {
			service = new GitHubApiService("facebook/react", "test-token");
			expect(service).toBeDefined();
		});

		it("should accept optional workerUrl", () => {
			service = new GitHubApiService(
				"facebook/react",
				undefined,
				"https://worker.dev",
			);
			expect(service).toBeDefined();
		});
	});

	describe("getRateLimitInfo", () => {
		it("should return null initially", () => {
			service = new GitHubApiService("facebook/react");
			expect(service.getRateLimitInfo()).toBeNull();
		});

		it("should return rate limit info after API call", async () => {
			service = new GitHubApiService("facebook/react");

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ default_branch: "main" }),
				headers: new Headers({
					"X-RateLimit-Remaining": "50",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			// Trigger an API call
			await service["fetchRepoInfo"]();

			const rateLimit = service.getRateLimitInfo();
			expect(rateLimit).toEqual({
				remaining: 50,
				limit: 60,
				resetTime: new Date(1640000000 * 1000),
			});
		});
	});

	describe("fetchMergedPRs", () => {
		beforeEach(() => {
			service = new GitHubApiService("test/repo");
		});

		it("should fetch merged PRs successfully", async () => {
			const mockPRs: GitHubPR[] = [
				{
					number: 1,
					title: "Test PR",
					user: { login: "testuser" },
					merged_at: "2024-01-01T00:00:00Z",
					merge_commit_sha: "abc123",
					files: [],
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockPRs,
				headers: new Headers({
					"X-RateLimit-Remaining": "60",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			const prs = await service.fetchMergedPRs();

			expect(prs).toEqual(mockPRs);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://api.github.com/repos/test/repo/pulls?state=closed&per_page=100&page=1&sort=created&direction=asc",
				expect.objectContaining({
					headers: expect.objectContaining({
						Accept: "application/vnd.github.v3+json",
					}),
				}),
			);
		});

		it("should filter out non-merged PRs", async () => {
			const mockPRs: GitHubPR[] = [
				{
					number: 1,
					title: "Merged PR",
					user: { login: "testuser" },
					merged_at: "2024-01-01T00:00:00Z",
					merge_commit_sha: "abc123",
					files: [],
				},
				{
					number: 2,
					title: "Closed but not merged",
					user: { login: "testuser" },
					merged_at: null,
					merge_commit_sha: null,
					files: [],
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockPRs,
				headers: new Headers({
					"X-RateLimit-Remaining": "60",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			const prs = await service.fetchMergedPRs();

			expect(prs).toHaveLength(1);
			expect(prs[0].merged_at).not.toBeNull();
		});

		it("should handle pagination", async () => {
			const page1: GitHubPR[] = Array(100)
				.fill(null)
				.map((_, i) => ({
					number: i + 1,
					title: `PR ${i + 1}`,
					user: { login: "testuser" },
					merged_at: "2024-01-01T00:00:00Z",
					merge_commit_sha: `sha${i + 1}`,
					files: [],
				}));

			const page2: GitHubPR[] = [
				{
					number: 101,
					title: "PR 101",
					user: { login: "testuser" },
					merged_at: "2024-01-01T00:00:00Z",
					merge_commit_sha: "sha101",
					files: [],
				},
			];

			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => page1,
					headers: new Headers({
						"X-RateLimit-Remaining": "60",
						"X-RateLimit-Limit": "60",
						"X-RateLimit-Reset": "1640000000",
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => page2,
					headers: new Headers({
						"X-RateLimit-Remaining": "59",
						"X-RateLimit-Limit": "60",
						"X-RateLimit-Reset": "1640000000",
					}),
				});

			const prs = await service.fetchMergedPRs();

			expect(prs).toHaveLength(101);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it("should call onProgress callback", async () => {
			const onProgress = vi.fn();
			const mockPRs: GitHubPR[] = [
				{
					number: 1,
					title: "Test PR",
					user: { login: "testuser" },
					merged_at: "2024-01-01T00:00:00Z",
					merge_commit_sha: "abc123",
					files: [],
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockPRs,
				headers: new Headers({
					"X-RateLimit-Remaining": "60",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			await service.fetchMergedPRs(onProgress);

			expect(onProgress).toHaveBeenCalled();
			expect(onProgress).toHaveBeenCalledWith(
				expect.objectContaining({
					loaded: 0,
					total: -1,
					percentage: 0,
					message: "Fetching pull requests...",
				}),
			);
		});
	});

	describe("fetchPRFiles", () => {
		beforeEach(() => {
			service = new GitHubApiService("test/repo");
		});

		it("should fetch PR files successfully", async () => {
			const mockFiles: GitHubPRFile[] = [
				{
					filename: "test.ts",
					status: "added",
					additions: 10,
					deletions: 0,
					changes: 10,
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFiles,
				headers: new Headers({
					"X-RateLimit-Remaining": "60",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			const files = await service.fetchPRFiles(1);

			expect(files).toEqual(mockFiles);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://api.github.com/repos/test/repo/pulls/1/files?per_page=100&page=1",
				expect.any(Object),
			);
		});

		it("should handle pagination for large PRs", async () => {
			const page1 = Array(100)
				.fill(null)
				.map((_, i) => ({
					filename: `file${i}.ts`,
					status: "modified",
					additions: 1,
					deletions: 0,
					changes: 1,
				}));

			const page2 = [
				{
					filename: "file100.ts",
					status: "added",
					additions: 5,
					deletions: 0,
					changes: 5,
				},
			];

			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => page1,
					headers: new Headers({
						"X-RateLimit-Remaining": "60",
						"X-RateLimit-Limit": "60",
						"X-RateLimit-Reset": "1640000000",
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => page2,
					headers: new Headers({
						"X-RateLimit-Remaining": "59",
						"X-RateLimit-Limit": "60",
						"X-RateLimit-Reset": "1640000000",
					}),
				});

			const files = await service.fetchPRFiles(1);

			expect(files).toHaveLength(101);
		});
	});

	describe("error handling", () => {
		beforeEach(() => {
			service = new GitHubApiService("test/repo");
		});

		it("should handle 404 errors with helpful message", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
				headers: new Headers(),
			});

			await expect(service.fetchMergedPRs()).rejects.toThrow(
				/Unable to access repository/,
			);
		});

		it("should handle rate limit errors", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 403,
				statusText: "Forbidden",
				headers: new Headers({
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			await expect(service.fetchMergedPRs()).rejects.toThrow(
				/rate limit exceeded/,
			);
		});

		it("should handle general API errors", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				headers: new Headers(),
			});

			await expect(service.fetchMergedPRs()).rejects.toThrow(
				/GitHub API error: 500/,
			);
		});
	});

	describe("authentication", () => {
		it("should include Bearer token in requests when provided", async () => {
			service = new GitHubApiService("test/repo", "test-token");

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
				headers: new Headers({
					"X-RateLimit-Remaining": "5000",
					"X-RateLimit-Limit": "5000",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			await service.fetchMergedPRs();

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: "Bearer test-token",
					}),
				}),
			);
		});

		it("should not include Authorization header when no token", async () => {
			service = new GitHubApiService("test/repo");

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
				headers: new Headers({
					"X-RateLimit-Remaining": "60",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			await service.fetchMergedPRs();

			const callArgs = fetchMock.mock.calls[0];
			const headers = callArgs[1].headers;
			expect(headers.Authorization).toBeUndefined();
		});
	});

	describe("worker integration", () => {
		it("should use worker when workerUrl is provided", () => {
			service = new GitHubApiService(
				"test/repo",
				undefined,
				"https://worker.dev",
			);
			expect(service["shouldUseWorker"]()).toBe(true);
		});

		it("should not use worker when workerUrl is not provided", () => {
			service = new GitHubApiService("test/repo");
			expect(service["shouldUseWorker"]()).toBe(false);
		});

		it("should throw error when fetchMetadata called without worker", async () => {
			service = new GitHubApiService("test/repo");
			await expect(service.fetchMetadata()).rejects.toThrow(
				/Worker URL not configured/,
			);
		});

		it("should throw error when fetchCacheStatus called without worker", async () => {
			service = new GitHubApiService("test/repo");
			await expect(service.fetchCacheStatus()).rejects.toThrow(
				/Worker URL required/,
			);
		});

		it("should throw error when fetchRepoSummary called without worker", async () => {
			service = new GitHubApiService("test/repo");
			await expect(service.fetchRepoSummary()).rejects.toThrow(
				/Worker URL required/,
			);
		});

		it("should throw error when fetchSinglePR called without worker", async () => {
			service = new GitHubApiService("test/repo");
			await expect(service.fetchSinglePR(1)).rejects.toThrow(
				/Worker URL required/,
			);
		});

		it("should throw error when loadMoreCommits called without worker", async () => {
			service = new GitHubApiService("test/repo");
			await expect(service.loadMoreCommits(0, 40)).rejects.toThrow(
				/loadMoreCommits requires worker/,
			);
		});
	});

	describe("buildTimelineFromPRs", () => {
		beforeEach(() => {
			service = new GitHubApiService("test/repo");
		});

		it("should call buildTimelineFromPRsIncremental and return commits", async () => {
			const mockPR: any = {
				number: 1,
				title: "Test PR",
				user: { login: "testuser" },
				merged_at: "2024-01-01T00:00:00Z",
				merge_commit_sha: "abc123",
				files: [],
			};

			// Mock the PRs fetch with at least one PR
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => [mockPR],
				headers: new Headers({
					"X-RateLimit-Remaining": "60",
					"X-RateLimit-Limit": "60",
					"X-RateLimit-Reset": "1640000000",
				}),
			});

			const commits = await service.buildTimelineFromPRs();

			expect(Array.isArray(commits)).toBe(true);
		});
	});
});
