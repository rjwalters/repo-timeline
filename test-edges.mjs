// Test buildEdges logic
const files = [
	{ path: "README.md", size: 100 },
	{ path: "src/index.ts", size: 200 },
	{ path: "src/components/Button.tsx", size: 300 },
];

const edges = [];
const directoriesAdded = new Set();

files.forEach((file) => {
	const pathParts = file.path.split("/");
	console.log(`\nProcessing: ${file.path}, parts:`, pathParts);

	if (pathParts.length > 1) {
		// Connect to parent directory
		const parentPath = pathParts.slice(0, -1).join("/");
		edges.push({
			source: parentPath,
			target: file.path,
			type: "parent",
		});
		console.log(`  Edge: ${parentPath} → ${file.path}`);

		// Also create edges for ALL directories in the path (including top-level)
		for (let i = 0; i < pathParts.length - 1; i++) {
			const dirPath = pathParts.slice(0, i + 1).join("/");
			const parentDirPath = i > 0 ? pathParts.slice(0, i).join("/") : "";

			// Avoid duplicate edges
			const edgeKey = `${parentDirPath || "/"}->${dirPath}`;
			console.log(`  i=${i}: dirPath="${dirPath}", parentDirPath="${parentDirPath}", edgeKey="${edgeKey}"`);

			if (!directoriesAdded.has(edgeKey)) {
				directoriesAdded.add(edgeKey);

				if (parentDirPath === "") {
					// Connect top-level directory to virtual root
					edges.push({
						source: "/",
						target: dirPath,
						type: "parent",
					});
					console.log(`  Edge: / → ${dirPath}`);
				} else {
					// Connect directory to its parent
					edges.push({
						source: parentDirPath,
						target: dirPath,
						type: "parent",
					});
					console.log(`  Edge: ${parentDirPath} → ${dirPath}`);
				}
			} else {
				console.log(`  Skipped (duplicate)`);
			}
		}
	} else {
		// Root-level file - connect to virtual root
		edges.push({
			source: "/",
			target: file.path,
			type: "parent",
		});
		console.log(`  Edge: / → ${file.path}`);
	}
});

console.log("\n\nFinal edges:");
edges.forEach((e) => console.log(`  ${e.source} → ${e.target}`));
