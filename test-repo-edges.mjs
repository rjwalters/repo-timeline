// Test with actual repo structure
const files = [
	{ path: "package.json", size: 100 },
	{ path: "README.md", size: 50 },
	{ path: "src/index.ts", size: 200 },
	{ path: "src/utils/helper.ts", size: 150 },
	{ path: "demo/App.tsx", size: 300 },
	{ path: "worker/index.ts", size: 250 },
];

console.log("Input files:");
files.forEach(f => console.log(`  ${f.path}`));

const edges = [];
const directoriesAdded = new Set();

// Build parent-child relationships based on file paths
files.forEach((file) => {
	const pathParts = file.path.split("/");
	console.log(`\nProcessing: ${file.path}`);
	console.log(`  Path parts: [${pathParts.join(", ")}]`);
	console.log(`  pathParts.length: ${pathParts.length}`);

	if (pathParts.length > 1) {
		// Connect to parent directory
		const parentPath = pathParts.slice(0, -1).join("/");
		edges.push({
			source: parentPath,
			target: file.path,
			type: "parent",
		});
		console.log(`  ✓ Edge: ${parentPath} → ${file.path}`);

		// Also create edges for ALL directories in the path (including top-level)
		// Start from i=0 to include the first directory level
		console.log(`  Directory loop: i=0 to ${pathParts.length - 2}`);
		for (let i = 0; i < pathParts.length - 1; i++) {
			const dirPath = pathParts.slice(0, i + 1).join("/");
			const parentDirPath = i > 0 ? pathParts.slice(0, i).join("/") : "";

			// Avoid duplicate edges
			const edgeKey = `${parentDirPath || "/"}->${dirPath}`;
			console.log(`    i=${i}: dirPath="${dirPath}", parentDirPath="${parentDirPath}", edgeKey="${edgeKey}"`);

			if (!directoriesAdded.has(edgeKey)) {
				directoriesAdded.add(edgeKey);

				if (parentDirPath === "") {
					// Connect top-level directory to virtual root
					edges.push({
						source: "/",
						target: dirPath,
						type: "parent",
					});
					console.log(`    ✓✓✓ CREATED ROOT EDGE: / → ${dirPath}`);
				} else {
					// Connect directory to its parent
					edges.push({
						source: parentDirPath,
						target: dirPath,
						type: "parent",
					});
					console.log(`    ✓ Dir edge: ${parentDirPath} → ${dirPath}`);
				}
			} else {
				console.log(`    (skipped - duplicate)`);
			}
		}
	} else {
		// Root-level file - connect to virtual root
		edges.push({
			source: "/",
			target: file.path,
			type: "parent",
		});
		console.log(`  ✓ Root file edge: / → ${file.path}`);
	}
});

console.log("\n\n=== FINAL EDGES ===");
const rootEdges = edges.filter(e => e.source === "/");
console.log(`Total edges: ${edges.length}`);
console.log(`Root edges: ${rootEdges.length}`);
console.log("\nRoot edges:");
rootEdges.forEach(e => console.log(`  / → ${e.target}`));

const rootDirEdges = rootEdges.filter(e => !e.target.includes("."));
console.log(`\nRoot edges to DIRECTORIES (no dot in name): ${rootDirEdges.length}`);
rootDirEdges.forEach(e => console.log(`  / → ${e.target}`));
