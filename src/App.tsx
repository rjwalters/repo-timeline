import { RepoTimeline } from "./components/RepoTimeline";
import "./index.css";

function App() {
	// For now, use a demo path - in production, this could come from:
	// - User input
	// - URL parameter
	// - File system API
	// - Backend API
	const repoPath = "/demo/repo";

	return (
		<div className="w-screen h-screen">
			<RepoTimeline repoPath={repoPath} />
		</div>
	);
}

export default App;
