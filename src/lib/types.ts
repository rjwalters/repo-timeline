/**
 * Public API types for the repo-timeline package
 */

export type PlaybackSpeed = 1 | 60 | 300 | 1800;

export type PlaybackDirection = "forward" | "reverse";

export interface RepoTimelineProps {
	/** GitHub repository path in "owner/repo" format */
	repoPath: string;

	/** Optional GitHub personal access token for higher rate limits (5,000 req/hour vs 60 req/hour) */
	githubToken?: string;

	/** Optional Cloudflare Worker URL for cached data */
	workerUrl?: string;

	/** Optional callback for error handling */
	onError?: (error: Error) => void;

	/** Show timeline controls (default: true) */
	showControls?: boolean;

	/** Start playing automatically (default: false) */
	autoPlay?: boolean;

	/** Initial playback speed (default: 60) */
	playbackSpeed?: PlaybackSpeed;

	/** Initial playback direction (default: "forward") */
	playbackDirection?: PlaybackDirection;

	/** Optional callback when user clicks back button */
	onBack?: () => void;
}
