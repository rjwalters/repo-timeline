import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { defineConfig } from "vite";

// Get git commit hash and build timestamp
const getGitHash = () => {
	try {
		return execSync("git rev-parse --short HEAD").toString().trim();
	} catch {
		return "unknown";
	}
};

const getBuildTime = () => {
	return new Date().toISOString();
};

// Demo app build configuration for GitHub Pages
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: "/github-timeline/",
	define: {
		__GIT_HASH__: JSON.stringify(getGitHash()),
		__BUILD_TIME__: JSON.stringify(getBuildTime()),
	},
	build: {
		outDir: "demo-dist",
	},
	// Point to demo entry file
	root: "./",
	publicDir: "public",
});
