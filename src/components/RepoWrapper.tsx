import { useNavigate, useParams } from "react-router-dom";
import { RepoTimeline } from "./RepoTimeline";

export function RepoWrapper() {
	const { owner, repo } = useParams<{ owner: string; repo: string }>();
	const navigate = useNavigate();

	// Validate that we have both params
	if (!owner || !repo) {
		navigate("/");
		return null;
	}

	const repoPath = `${owner}/${repo}`;

	return <RepoTimeline repoPath={repoPath} onBack={() => navigate("/")} />;
}
