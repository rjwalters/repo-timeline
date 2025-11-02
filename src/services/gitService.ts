import { CommitData, FileEdge, FileNode } from "../types";

interface RawCommitData {
	hash: string;
	message: string;
	author: string;
	date: string;
	files: RawFileData[];
}

interface RawFileData {
	path: string;
	size?: number;
	type?: string;
}

export class GitService {
	private repoPath: string;

	constructor(repoPath: string) {
		this.repoPath = repoPath;
	}

	async getCommitHistory(): Promise<CommitData[]> {
		// This will be implemented to fetch git history
		// For now, we'll use the browser's ability to call a backend API
		// or use a demo/mock implementation
		try {
			const response = await fetch(
				`/api/commits?path=${encodeURIComponent(this.repoPath)}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch commits");
			}
			const data = await response.json();
			return this.parseCommits(data);
		} catch (error) {
			console.error("Error fetching commits:", error);
			// Return demo data for development
			return this.getDemoData();
		}
	}

	private parseCommits(data: RawCommitData[]): CommitData[] {
		return data.map((commit) => ({
			hash: commit.hash,
			message: commit.message,
			author: commit.author,
			date: new Date(commit.date),
			files: this.buildFileTree(commit.files),
			edges: this.buildEdges(commit.files),
		}));
	}

	private buildFileTree(files: RawFileData[]): FileNode[] {
		const nodes: FileNode[] = [];
		const pathMap = new Map<string, FileNode>();

		// First pass: create all nodes
		files.forEach((file) => {
			const node: FileNode = {
				id: file.path,
				path: file.path,
				name: file.path.split("/").pop() || file.path,
				size: file.size || 100,
				type: (file.type as "file" | "directory") || "file",
			};
			nodes.push(node);
			pathMap.set(file.path, node);
		});

		return nodes;
	}

	private buildEdges(files: RawFileData[]): FileEdge[] {
		const edges: FileEdge[] = [];

		// Build parent-child relationships based on file paths
		files.forEach((file) => {
			const pathParts = file.path.split("/");
			if (pathParts.length > 1) {
				// Connect to parent directory
				const parentPath = pathParts.slice(0, -1).join("/");
				edges.push({
					source: parentPath || "root",
					target: file.path,
					type: "parent",
				});
			}
		});

		return edges;
	}

	private getDemoData(): CommitData[] {
		// Demo data showing a simple project evolution
		const commits: CommitData[] = [
			{
				hash: "abc123",
				message: "Initial commit",
				author: "Developer",
				date: new Date("2024-01-01"),
				files: [
					{
						id: "README.md",
						path: "README.md",
						name: "README.md",
						size: 50,
						type: "file",
					},
					{ id: "src", path: "src", name: "src", size: 0, type: "directory" },
					{
						id: "src/index.ts",
						path: "src/index.ts",
						name: "index.ts",
						size: 100,
						type: "file",
					},
				],
				edges: [{ source: "src", target: "src/index.ts", type: "parent" }],
			},
			{
				hash: "def456",
				message: "Add components",
				author: "Developer",
				date: new Date("2024-01-02"),
				files: [
					{
						id: "README.md",
						path: "README.md",
						name: "README.md",
						size: 50,
						type: "file",
					},
					{ id: "src", path: "src", name: "src", size: 0, type: "directory" },
					{
						id: "src/index.ts",
						path: "src/index.ts",
						name: "index.ts",
						size: 150,
						type: "file",
					},
					{
						id: "src/components",
						path: "src/components",
						name: "components",
						size: 0,
						type: "directory",
					},
					{
						id: "src/components/App.tsx",
						path: "src/components/App.tsx",
						name: "App.tsx",
						size: 200,
						type: "file",
					},
					{
						id: "src/components/Header.tsx",
						path: "src/components/Header.tsx",
						name: "Header.tsx",
						size: 80,
						type: "file",
					},
				],
				edges: [
					{ source: "src", target: "src/index.ts", type: "parent" },
					{ source: "src", target: "src/components", type: "parent" },
					{
						source: "src/components",
						target: "src/components/App.tsx",
						type: "parent",
					},
					{
						source: "src/components",
						target: "src/components/Header.tsx",
						type: "parent",
					},
				],
			},
			{
				hash: "ghi789",
				message: "Add styles and utils",
				author: "Developer",
				date: new Date("2024-01-03"),
				files: [
					{
						id: "README.md",
						path: "README.md",
						name: "README.md",
						size: 80,
						type: "file",
					},
					{ id: "src", path: "src", name: "src", size: 0, type: "directory" },
					{
						id: "src/index.ts",
						path: "src/index.ts",
						name: "index.ts",
						size: 150,
						type: "file",
					},
					{
						id: "src/components",
						path: "src/components",
						name: "components",
						size: 0,
						type: "directory",
					},
					{
						id: "src/components/App.tsx",
						path: "src/components/App.tsx",
						name: "App.tsx",
						size: 250,
						type: "file",
					},
					{
						id: "src/components/Header.tsx",
						path: "src/components/Header.tsx",
						name: "Header.tsx",
						size: 120,
						type: "file",
					},
					{
						id: "src/styles",
						path: "src/styles",
						name: "styles",
						size: 0,
						type: "directory",
					},
					{
						id: "src/styles/main.css",
						path: "src/styles/main.css",
						name: "main.css",
						size: 150,
						type: "file",
					},
					{
						id: "src/utils",
						path: "src/utils",
						name: "utils",
						size: 0,
						type: "directory",
					},
					{
						id: "src/utils/helpers.ts",
						path: "src/utils/helpers.ts",
						name: "helpers.ts",
						size: 100,
						type: "file",
					},
				],
				edges: [
					{ source: "src", target: "src/index.ts", type: "parent" },
					{ source: "src", target: "src/components", type: "parent" },
					{ source: "src", target: "src/styles", type: "parent" },
					{ source: "src", target: "src/utils", type: "parent" },
					{
						source: "src/components",
						target: "src/components/App.tsx",
						type: "parent",
					},
					{
						source: "src/components",
						target: "src/components/Header.tsx",
						type: "parent",
					},
					{
						source: "src/styles",
						target: "src/styles/main.css",
						type: "parent",
					},
					{
						source: "src/utils",
						target: "src/utils/helpers.ts",
						type: "parent",
					},
				],
			},
		];

		return commits;
	}
}
