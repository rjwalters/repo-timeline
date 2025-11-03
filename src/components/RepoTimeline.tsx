import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaybackTimer } from "../hooks/usePlaybackTimer";
import type { RepoTimelineProps } from "../lib/types";
import type { RateLimitInfo } from "../services/githubApiService";
import { GitService, LoadProgress } from "../services/gitService";
import { CommitData, FileEdge, FileNode } from "../types";
import { getCurrentIndex } from "../utils/timelineHelpers";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { RateLimitDisplay } from "./RateLimitDisplay";
import { RepoGraph3D } from "./RepoGraph3D";
import {
	PlaybackDirection,
	PlaybackSpeed,
	TimelineScrubber,
} from "./TimelineScrubber";

// TEST MODE: Set to true to bypass loading and show test scene
const TEST_MODE = false;

export function RepoTimeline({
	repoPath,
	workerUrl,
	onBack,
	showControls = true,
	autoPlay = false,
	playbackSpeed: initialPlaybackSpeed = 60,
	playbackDirection: initialPlaybackDirection = "forward",
	onError,
}: RepoTimelineProps) {
	const [commits, setCommits] = useState<CommitData[]>([]);
	const [currentTime, setCurrentTime] = useState<number>(0); // Timestamp in ms
	const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({
		start: 0,
		end: Date.now(),
	});
	const [_totalPRs, setTotalPRs] = useState<number>(0);
	const [loading, setLoading] = useState(TEST_MODE ? false : true);
	const [backgroundLoading, setBackgroundLoading] = useState(false);
	const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
	const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
	const [isPlaying, setIsPlaying] = useState(autoPlay);
	const [playbackSpeed, setPlaybackSpeed] =
		useState<PlaybackSpeed>(initialPlaybackSpeed);
	const [playbackDirection, setPlaybackDirection] = useState<PlaybackDirection>(
		initialPlaybackDirection,
	);
	const [fromCache, setFromCache] = useState(false);
	const [rateLimitedCache, setRateLimitedCache] = useState(false);
	const gitServiceRef = useRef<GitService | null>(null);

	const currentIndex = getCurrentIndex(commits, currentTime);

	// Use playback timer hook for automatic time advancement
	usePlaybackTimer({
		isPlaying,
		playbackSpeed,
		playbackDirection,
		timeRange,
		hasCommits: commits.length > 0,
		onTimeChange: setCurrentTime,
		onPlayingChange: setIsPlaying,
	});

	// Load metadata first to get time range
	useEffect(() => {
		const loadMetadata = async () => {
			try {
				const gitService = new GitService(repoPath, undefined, workerUrl);
				const metadata = await gitService.getMetadata();

				setTotalPRs(metadata.prs.length);
				setTimeRange(metadata.timeRange);
				setCurrentTime(metadata.timeRange.start);

				console.log(
					`Loaded metadata: ${metadata.prs.length} PRs, time range: ${new Date(metadata.timeRange.start).toLocaleDateString()} - ${new Date(metadata.timeRange.end).toLocaleDateString()}`,
				);
			} catch (err) {
				console.error("Error loading metadata:", err);
				// Don't block - continue to load commits
			}
		};

		loadMetadata();
	}, [repoPath, workerUrl]);

	const loadCommits = useCallback(
		async (forceRefresh = false) => {
			const gitService = new GitService(
				repoPath,
				undefined, // No token needed - using worker
				workerUrl,
			);
			gitServiceRef.current = gitService;

			// Check if data was from cache
			const cacheInfo = gitService.getCacheInfo();
			const hasCache = cacheInfo.exists && !forceRefresh;

			if (hasCache) {
				// Load from cache immediately - no loading state
				setLoading(true);
				setLoadProgress(null);
				try {
					const commitsData = await gitService.getCommitHistory((progress) => {
						setLoadProgress(progress);
					}, forceRefresh);
					setCommits(commitsData);
					// currentTime is already set from metadata
					setFromCache(true);
					setRateLimitedCache(false); // Clear rate limit flag when loading normally
					setLoading(false);
					setError(null);
					setRateLimit(gitService.getRateLimitInfo());
				} catch (err) {
					console.error("Error loading commits:", err);
					const error =
						err instanceof Error ? err : new Error("Failed to load repository");
					setError(error.message);
					setLoading(false);
					setRateLimitedCache(false);
					setRateLimit(gitService.getRateLimitInfo());
					if (onError) {
						onError(error);
					}
				}
			} else {
				// Incremental loading - show visualization as data arrives
				setLoading(false);
				setBackgroundLoading(true);
				setLoadProgress(null);
				setCommits([]);
				// currentTime is already set from metadata
				setFromCache(false);

				try {
					await gitService.getCommitHistory(
						(progress) => {
							setLoadProgress(progress);
						},
						forceRefresh,
						(commit) => {
							// Add commit incrementally
							setCommits((prev) => [...prev, commit]);
						},
					);
				} catch (err) {
					console.error("Error loading commits:", err);

					// If we hit an error (like rate limiting), try to load from cache
					if (cacheInfo.exists) {
						console.log("Falling back to cached data due to error");
						try {
							const cachedCommits = await gitService.getCommitHistory(
								undefined, // no progress updates needed
								false, // don't force refresh
							);
							setCommits(cachedCommits);
							setFromCache(true);
							setRateLimitedCache(true); // Mark that we're using stale cache due to rate limit
							setError(null); // Clear error since we have cached data
							// Show a warning instead of error
							console.warn(
								"Using cached data due to API error:",
								err instanceof Error ? err.message : "Unknown error",
							);
						} catch (_cacheErr) {
							// If cache also fails, show the original error
							setError(
								err instanceof Error
									? err.message
									: "Failed to load repository",
							);
							setRateLimitedCache(false);
						}
					} else {
						// No cache available, show error
						setError(
							err instanceof Error ? err.message : "Failed to load repository",
						);
						setRateLimitedCache(false);
					}
					setRateLimit(gitService.getRateLimitInfo());
				} finally {
					setBackgroundLoading(false);
					setLoadProgress(null);
				}
			}
		},
		[repoPath, workerUrl, onError],
	);

	useEffect(() => {
		loadCommits();
	}, [loadCommits]);

	const handlePlayPause = () => {
		setIsPlaying(!isPlaying);
	};

	const handleNodeClick = (node: FileNode) => {
		setSelectedNode(node);
		console.log("Selected node:", node);
	};

	if (loading) {
		return <LoadingState loadProgress={loadProgress} fromCache={fromCache} />;
	}

	// Show error state
	if (error) {
		return (
			<ErrorState
				error={error}
				repoPath={repoPath}
				rateLimit={rateLimit}
				onBack={onBack}
				onRetry={() => loadCommits(true)}
			/>
		);
	}

	// Show initial loading only if we have no data yet and no error
	if (commits.length === 0 && !backgroundLoading && !error) {
		return <EmptyState repoPath={repoPath} />;
	}

	// TEST DATA: Hardcoded test data to debug edge rendering
	const testNodes: FileNode[] = [
		{
			id: "src",
			path: "src",
			name: "src",
			size: 0,
			type: "directory",
			x: 0,
			y: 0,
			z: 0,
		},
		{
			id: "src/main.ts",
			path: "src/main.ts",
			name: "main.ts",
			size: 1000,
			type: "file",
			x: 30,
			y: 0,
			z: 0,
		},
		{
			id: "src/utils",
			path: "src/utils",
			name: "utils",
			size: 0,
			type: "directory",
			x: 0,
			y: 30,
			z: 0,
		},
		{
			id: "src/utils/helper.ts",
			path: "src/utils/helper.ts",
			name: "helper.ts",
			size: 500,
			type: "file",
			x: 30,
			y: 30,
			z: 0,
		},
	];

	const testEdges: FileEdge[] = [
		{ source: "src", target: "src/main.ts", type: "parent" },
		{ source: "src", target: "src/utils", type: "parent" },
		{ source: "src/utils", target: "src/utils/helper.ts", type: "parent" },
	];

	// Show empty state while waiting for first commit
	const currentCommit =
		commits.length > 0
			? commits[currentIndex]
			: {
					hash: "",
					message: "Loading...",
					author: "",
					date: new Date(),
					files: [],
					edges: [],
				};

	const displayNodes = TEST_MODE ? testNodes : currentCommit.files;
	const displayEdges = TEST_MODE ? testEdges : currentCommit.edges;

	return (
		<div className="w-full h-full relative">
			{/* 3D Visualization */}
			<div className="w-full h-full">
				<RepoGraph3D
					nodes={displayNodes}
					edges={displayEdges}
					onNodeClick={handleNodeClick}
				/>
			</div>

			{/* Timeline Controls */}
			{showControls && (
				<TimelineScrubber
					commits={commits}
					currentTime={currentTime}
					onTimeChange={setCurrentTime}
					timeRange={timeRange}
					isPlaying={isPlaying}
					onPlayPause={handlePlayPause}
					playbackSpeed={playbackSpeed}
					onSpeedChange={setPlaybackSpeed}
					playbackDirection={playbackDirection}
					onDirectionChange={setPlaybackDirection}
				/>
			)}

			{/* Node Info Panel */}
			{selectedNode && (
				<div className="absolute top-4 right-4 bg-gray-900 bg-opacity-90 text-white p-4 rounded-lg border border-gray-700 max-w-sm">
					<div className="text-sm font-semibold mb-2">Selected File</div>
					<div className="space-y-1 text-sm">
						<div>
							<span className="text-gray-400">Path:</span> {selectedNode.path}
						</div>
						<div>
							<span className="text-gray-400">Type:</span> {selectedNode.type}
						</div>
						<div>
							<span className="text-gray-400">Size:</span> {selectedNode.size}{" "}
							bytes
						</div>
					</div>
					<button
						onClick={() => setSelectedNode(null)}
						className="mt-3 text-xs text-gray-400 hover:text-white"
					>
						Close
					</button>
				</div>
			)}

			{/* Header */}
			<div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 text-white p-4 rounded-lg border border-gray-700">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-bold mb-1">Repo Timeline Visualizer</h1>
						<div className="text-sm text-gray-400">{repoPath}</div>
						<div className="flex items-center gap-3 mt-2">
							{rateLimitedCache && (
								<div className="text-xs text-yellow-400 bg-yellow-900 bg-opacity-20 px-2 py-1 rounded border border-yellow-600">
									⚠ Using cached data (API rate limited)
								</div>
							)}
							{fromCache && !backgroundLoading && !rateLimitedCache && (
								<div className="text-xs text-blue-400">
									📦 Loaded from cache
								</div>
							)}
							{backgroundLoading && loadProgress && (
								<div className="text-xs text-yellow-400 flex items-center gap-2">
									<Loader2 size={12} className="animate-spin" />
									{loadProgress.message || "Loading PRs..."} ({commits.length}{" "}
									loaded)
								</div>
							)}
							{rateLimit && (
								<RateLimitDisplay
									remaining={rateLimit.remaining}
									limit={rateLimit.limit}
									resetTime={rateLimit.resetTime}
								/>
							)}
						</div>
					</div>
					<div className="flex gap-2">
						{onBack && (
							<button
								onClick={onBack}
								className="p-2 hover:bg-gray-800 rounded transition-colors"
								title="Back to repo selection"
							>
								<ArrowLeft size={20} />
							</button>
						)}
						<button
							onClick={() => loadCommits(true)}
							className="p-2 hover:bg-gray-800 rounded transition-colors"
							title="Refresh data"
						>
							<RefreshCw size={20} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
