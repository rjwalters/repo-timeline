import { CommitData } from "../types";
import { getCurrentIndex } from "../utils/timelineHelpers";
import { CommitInfo } from "./timeline/CommitInfo";
import { PlaybackControls } from "./timeline/PlaybackControls";

export type PlaybackSpeed = 1 | 60 | 300 | 1800;
export type PlaybackDirection = "forward" | "reverse";

interface TimelineScrubberProps {
	commits: CommitData[];
	currentTime: number; // Current timestamp in ms
	onTimeChange: (time: number) => void;
	timeRange: { start: number; end: number }; // Time range in ms
	isPlaying: boolean;
	onPlayPause: () => void;
	playbackSpeed: PlaybackSpeed;
	onSpeedChange: (speed: PlaybackSpeed) => void;
	playbackDirection: PlaybackDirection;
	onDirectionChange: (direction: PlaybackDirection) => void;
}

export function TimelineScrubber({
	commits,
	currentTime,
	onTimeChange,
	timeRange,
	isPlaying,
	onPlayPause,
	playbackSpeed,
	onSpeedChange,
	playbackDirection,
	onDirectionChange,
}: TimelineScrubberProps) {
	const currentIndex = getCurrentIndex(commits, currentTime);

	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Convert slider value (0-100) to timestamp
		const percentage = Number.parseFloat(e.target.value);
		const newTime =
			timeRange.start + (timeRange.end - timeRange.start) * (percentage / 100);
		onTimeChange(newTime);
	};

	const handlePrevious = () => {
		if (currentIndex > 0) {
			// Jump to 3 seconds before the PR to see the transition animation
			const targetTime = commits[currentIndex - 1].date.getTime();
			const offsetTime = targetTime - 3000; // 3 seconds before
			// Make sure we don't go before the start of the timeline
			onTimeChange(Math.max(timeRange.start, offsetTime));
		}
	};

	const handleNext = () => {
		if (currentIndex < commits.length - 1) {
			// Jump to 3 seconds before the PR to see the transition animation
			const targetTime = commits[currentIndex + 1].date.getTime();
			const offsetTime = targetTime - 3000; // 3 seconds before
			// Make sure we don't go before the start of the timeline
			onTimeChange(Math.max(timeRange.start, offsetTime));
		}
	};

	const handleSkipToStart = () => {
		onTimeChange(timeRange.start);
	};

	const handleSkipToEnd = () => {
		onTimeChange(timeRange.end);
	};

	const currentCommit = commits[currentIndex];

	if (!currentCommit) return null;

	return (
		<div className="w-full bg-gray-900 bg-opacity-95 text-white p-4 border-t border-gray-700 backdrop-blur-sm">
			<div className="max-w-7xl mx-auto">
				{/* Commit info */}
				<CommitInfo
					commit={currentCommit}
					currentTime={currentTime}
					isPlaying={isPlaying}
				/>

				{/* Video-style controls */}
				<div className="flex items-center gap-3 mb-3">
					<PlaybackControls
						isPlaying={isPlaying}
						onPlayPause={onPlayPause}
						playbackSpeed={playbackSpeed}
						onSpeedChange={onSpeedChange}
						playbackDirection={playbackDirection}
						onDirectionChange={onDirectionChange}
						currentIndex={currentIndex}
						totalCommits={commits.length}
						onSkipToStart={handleSkipToStart}
						onPrevious={handlePrevious}
						onNext={handleNext}
						onSkipToEnd={handleSkipToEnd}
					/>

					{/* Slider with PR markers */}
					<div className="flex-1 flex items-center gap-4 ml-4">
						<div className="flex-1 relative">
							{/* PR Markers - positioned based on timestamp */}
							<div className="absolute inset-0 pointer-events-none flex items-center">
								{commits.map((commit, index) => {
									// Calculate position based on time
									const totalTime = timeRange.end - timeRange.start;
									const commitTime = commit.date.getTime() - timeRange.start;
									const position = (commitTime / totalTime) * 100;
									return (
										<div
											key={index}
											className="absolute w-0.5 h-4 bg-gray-500"
											style={{
												left: `${position}%`,
												transform: "translateX(-50%)",
											}}
										/>
									);
								})}
							</div>
							{/* Slider - uses percentage (0-100) */}
							<input
								type="range"
								min={0}
								max={100}
								step={0.1}
								value={
									((currentTime - timeRange.start) /
										(timeRange.end - timeRange.start)) *
									100
								}
								onChange={handleSliderChange}
								className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider relative z-10"
							/>
						</div>
					</div>
				</div>

				{/* File statistics */}
				<div className="flex gap-6 text-sm text-gray-300">
					<div>
						<span className="text-gray-400">Files:</span>{" "}
						{currentCommit.files.length}
					</div>
					<div>
						<span className="text-gray-400">Commit:</span> {currentIndex + 1} of{" "}
						{commits.length}
					</div>
					<div>
						<span className="text-gray-400">Hash:</span>{" "}
						<span className="font-mono">
							{currentCommit.hash.substring(0, 7)}
						</span>
					</div>
					{isPlaying && (
						<div className="text-blue-400">
							▶ Playing {playbackDirection} at {playbackSpeed}x
						</div>
					)}
				</div>
			</div>

			<style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
		</div>
	);
}
