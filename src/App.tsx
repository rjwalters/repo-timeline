import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RepoInput } from "./components/RepoInput";
import { RepoWrapper } from "./components/RepoWrapper";
import "./index.css";

function App() {
	return (
		<BrowserRouter basename="/repo-timeline">
			<div className="w-screen h-screen">
				<Routes>
					<Route path="/" element={<RepoInput />} />
					<Route path="/:owner/:repo" element={<RepoWrapper />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}

export default App;
