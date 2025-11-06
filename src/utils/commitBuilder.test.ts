import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCommitFromFileState } from "./commitBuilder";
import { FileStateTracker } from "./fileStateTracker";

describe("commitBuilder", () => {
	let fileStateTracker: FileStateTracker;

	beforeEach(() => {
		fileStateTracker = new FileStateTracker();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("buildCommitFromFileState", () => {
		it("should build commit with empty file state", () => {
			const commit = buildCommitFromFileState(
				"abc123",
				"Initial commit",
				"testuser",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			expect(commit).toEqual({
				hash: "abc123",
				message: "Initial commit",
				author: "testuser",
				date: new Date("2024-01-01T00:00:00Z"),
				files: [],
				edges: [],
			});
		});

		it("should build commit with single file", () => {
			fileStateTracker.updateFromPRFiles([
				{
					filename: "README.md",
					status: "added",
					additions: 10,
					deletions: 0,
					changes: 10,
				},
			]);

			const commit = buildCommitFromFileState(
				"def456",
				"Add README",
				"author",
				"2024-01-02T00:00:00Z",
				fileStateTracker,
			);

			expect(commit.hash).toBe("def456");
			expect(commit.message).toBe("Add README");
			expect(commit.author).toBe("author");
			expect(commit.date).toEqual(new Date("2024-01-02T00:00:00Z"));
			expect(commit.files.length).toBeGreaterThan(0);
			expect(commit.edges.length).toBeGreaterThan(0);

			// Should have README.md file node
			const readmeNode = commit.files.find((f) => f.path === "README.md");
			expect(readmeNode).toBeDefined();
			expect(readmeNode?.type).toBe("file");
		});

		it("should build commit with nested file structure", () => {
			fileStateTracker.updateFromPRFiles([
				{
					filename: "src/index.ts",
					status: "added",
					additions: 20,
					deletions: 0,
					changes: 20,
				},
				{
					filename: "src/utils/helpers.ts",
					status: "added",
					additions: 15,
					deletions: 0,
					changes: 15,
				},
			]);

			const commit = buildCommitFromFileState(
				"ghi789",
				"Add source files",
				"dev",
				"2024-01-03T00:00:00Z",
				fileStateTracker,
			);

			expect(commit.files.length).toBeGreaterThan(2);

			// Should have directory nodes
			const srcDir = commit.files.find((f) => f.path === "src");
			expect(srcDir).toBeDefined();
			expect(srcDir?.type).toBe("directory");

			const utilsDir = commit.files.find((f) => f.path === "src/utils");
			expect(utilsDir).toBeDefined();
			expect(utilsDir?.type).toBe("directory");

			// Should have file nodes
			const indexFile = commit.files.find((f) => f.path === "src/index.ts");
			expect(indexFile).toBeDefined();
			expect(indexFile?.type).toBe("file");
		});

		it("should preserve file sizes from file state", () => {
			fileStateTracker.updateFromPRFiles([
				{
					filename: "large.txt",
					status: "added",
					additions: 1000,
					deletions: 0,
					changes: 1000,
				},
				{
					filename: "small.txt",
					status: "added",
					additions: 10,
					deletions: 0,
					changes: 10,
				},
			]);

			const commit = buildCommitFromFileState(
				"jkl012",
				"Add files",
				"user",
				"2024-01-04T00:00:00Z",
				fileStateTracker,
			);

			const largeFile = commit.files.find((f) => f.path === "large.txt");
			const smallFile = commit.files.find((f) => f.path === "small.txt");

			expect(largeFile?.size).toBe(1000);
			expect(smallFile?.size).toBe(10);
		});

		it("should handle file modifications", () => {
			// Add file
			fileStateTracker.updateFromPRFiles([
				{
					filename: "test.ts",
					status: "added",
					additions: 50,
					deletions: 0,
					changes: 50,
				},
			]);

			let commit = buildCommitFromFileState(
				"abc1",
				"Add test",
				"user",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			expect(commit.files.find((f) => f.path === "test.ts")?.size).toBe(50);

			// Modify file
			fileStateTracker.updateFromPRFiles([
				{
					filename: "test.ts",
					status: "modified",
					additions: 10,
					deletions: 5,
					changes: 15,
				},
			]);

			commit = buildCommitFromFileState(
				"abc2",
				"Modify test",
				"user",
				"2024-01-02T00:00:00Z",
				fileStateTracker,
			);

			expect(commit.files.find((f) => f.path === "test.ts")?.size).toBe(55); // 50 + 10 - 5
		});

		it("should handle file deletions", () => {
			// Add file
			fileStateTracker.updateFromPRFiles([
				{
					filename: "temp.ts",
					status: "added",
					additions: 30,
					deletions: 0,
					changes: 30,
				},
			]);

			let commit = buildCommitFromFileState(
				"del1",
				"Add temp",
				"user",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			expect(commit.files.find((f) => f.path === "temp.ts")).toBeDefined();

			// Delete file
			fileStateTracker.updateFromPRFiles([
				{
					filename: "temp.ts",
					status: "removed",
					additions: 0,
					deletions: 30,
					changes: 30,
				},
			]);

			commit = buildCommitFromFileState(
				"del2",
				"Delete temp",
				"user",
				"2024-01-02T00:00:00Z",
				fileStateTracker,
			);

			expect(commit.files.find((f) => f.path === "temp.ts")).toBeUndefined();
		});

		it("should handle file renames", () => {
			// Add file
			fileStateTracker.updateFromPRFiles([
				{
					filename: "old-name.ts",
					status: "added",
					additions: 40,
					deletions: 0,
					changes: 40,
				},
			]);

			// Rename file
			fileStateTracker.updateFromPRFiles([
				{
					filename: "new-name.ts",
					status: "renamed",
					additions: 0,
					deletions: 0,
					changes: 0,
					previous_filename: "old-name.ts",
				},
			]);

			const commit = buildCommitFromFileState(
				"ren1",
				"Rename file",
				"user",
				"2024-01-03T00:00:00Z",
				fileStateTracker,
			);

			expect(
				commit.files.find((f) => f.path === "old-name.ts"),
			).toBeUndefined();
			expect(commit.files.find((f) => f.path === "new-name.ts")).toBeDefined();
			expect(commit.files.find((f) => f.path === "new-name.ts")?.size).toBe(40);
		});

		it("should create edges between parent directories and files", () => {
			fileStateTracker.updateFromPRFiles([
				{
					filename: "src/components/Button.tsx",
					status: "added",
					additions: 100,
					deletions: 0,
					changes: 100,
				},
			]);

			const commit = buildCommitFromFileState(
				"edge1",
				"Add button",
				"user",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			// Should have edges: root->src, src->components, components->Button.tsx
			expect(commit.edges.length).toBeGreaterThanOrEqual(3);

			// All edges should be of type "parent"
			expect(commit.edges.every((e) => e.type === "parent")).toBe(true);
		});

		it("should handle complex multi-level directory structure", () => {
			fileStateTracker.updateFromPRFiles([
				{
					filename: "a/b/c/d/e/file.txt",
					status: "added",
					additions: 5,
					deletions: 0,
					changes: 5,
				},
			]);

			const commit = buildCommitFromFileState(
				"deep1",
				"Deep file",
				"user",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			// Should have directory nodes for each level
			expect(commit.files.find((f) => f.path === "a")).toBeDefined();
			expect(commit.files.find((f) => f.path === "a/b")).toBeDefined();
			expect(commit.files.find((f) => f.path === "a/b/c")).toBeDefined();
			expect(commit.files.find((f) => f.path === "a/b/c/d")).toBeDefined();
			expect(commit.files.find((f) => f.path === "a/b/c/d/e")).toBeDefined();
			expect(
				commit.files.find((f) => f.path === "a/b/c/d/e/file.txt"),
			).toBeDefined();
		});

		it("should handle multiple files in same directory without duplicating directory nodes", () => {
			fileStateTracker.updateFromPRFiles([
				{
					filename: "src/file1.ts",
					status: "added",
					additions: 10,
					deletions: 0,
					changes: 10,
				},
				{
					filename: "src/file2.ts",
					status: "added",
					additions: 20,
					deletions: 0,
					changes: 20,
				},
			]);

			const commit = buildCommitFromFileState(
				"multi1",
				"Add files",
				"user",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			// Should only have one "src" directory node
			const srcNodes = commit.files.filter((f) => f.path === "src");
			expect(srcNodes.length).toBe(1);
		});

		it("should warn about orphaned nodes via console", () => {
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
				/* suppress */
			});

			// This shouldn't create orphaned nodes with correct implementation
			fileStateTracker.updateFromPRFiles([
				{
					filename: "normal.ts",
					status: "added",
					additions: 10,
					deletions: 0,
					changes: 10,
				},
			]);

			buildCommitFromFileState(
				"test1",
				"Test",
				"user",
				"2024-01-01T00:00:00Z",
				fileStateTracker,
			);

			// Should not warn about orphaned nodes
			expect(consoleSpy).not.toHaveBeenCalledWith(
				expect.stringContaining("orphaned nodes"),
				expect.anything(),
			);

			consoleSpy.mockRestore();
		});
	});
});
