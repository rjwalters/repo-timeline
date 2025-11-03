import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function RepoInput() {
	const navigate = useNavigate();
	const [input, setInput] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Parse the input - accept formats like:
		// - "owner/repo"
		// - "https://github.com/owner/repo"
		// - "https://github.com/owner/repo/pull/123" (extract owner/repo)
		let repoPath = input.trim();

		// Extract from GitHub URL
		const githubUrlMatch = repoPath.match(/github\.com\/([^/]+\/[^/]+)/i);
		if (githubUrlMatch) {
			repoPath = githubUrlMatch[1];
		}

		// Remove trailing slashes and .git
		repoPath = repoPath.replace(/\.git$/, "").replace(/\/$/, "");

		// Validate format: should be "owner/repo"
		if (!/^[^/]+\/[^/]+$/.test(repoPath)) {
			setError('Invalid format. Please enter "owner/repo" or a GitHub URL.');
			return;
		}

		// Navigate to the repo route
		navigate(`/${repoPath}`);
	};

	return (
		<div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
			<div className="max-w-2xl w-full px-8">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-4">Repo Timeline Visualizer</h1>
					<p className="text-gray-400 text-lg">
						Visualize how a GitHub repository evolved through pull requests
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="repo-input"
							className="block text-sm font-medium mb-2"
						>
							GitHub Repository
						</label>
						<input
							id="repo-input"
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="owner/repo (e.g., facebook/react)"
							className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
						/>
						{error && <p className="mt-2 text-sm text-red-400">{error}</p>}
					</div>

					<button
						type="submit"
						className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
						disabled={!input.trim()}
					>
						Visualize Repository
					</button>
				</form>

				<div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
					<h3 className="text-sm font-semibold mb-2">Examples:</h3>
					<ul className="text-sm text-gray-400 space-y-1">
						<li>• rjwalters/bucket-brigade</li>
						<li>• facebook/react</li>
						<li>• microsoft/vscode</li>
					</ul>
				</div>

				<div className="mt-6 text-center text-xs text-gray-500">
					<p>This tool fetches public repository data from GitHub's API.</p>
					<p className="mt-1">Rate limit: 60 requests/hour (unauthenticated)</p>
				</div>
			</div>
		</div>
	);
}
