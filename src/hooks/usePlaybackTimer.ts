import { useEffect, useRef } from "react";
import type { PlaybackDirection, PlaybackSpeed } from "../lib/types";
import type { CommitData } from "../types";
import { getCurrentIndex, getNextVisibleCommitIndex } from "../utils/timelineHelpers";

interface UsePlaybackTimerOptions {
	isPlaying: boolean;
	playbackSpeed: PlaybackSpeed;
	playbackDirection: PlaybackDirection;
	timeRange: { start: number; end: number };
	hasCommits: boolean;
	commits: CommitData[];
	onTimeChange: (updater: (prevTime: number) => number) => void;
	onPlayingChange: (isPlaying: boolean) => void;
}

/**
 * Custom hook to manage playback timer for timeline scrubbing
 * Handles automatic time advancement based on playback speed and direction
 * Implements smart commit skipping to avoid rendering commits that flash by too quickly
 */
export function usePlaybackTimer({
	isPlaying,
	playbackSpeed,
	playbackDirection,
	timeRange,
	hasCommits,
	commits,
	onTimeChange,
	onPlayingChange,
}: UsePlaybackTimerOptions) {
	const timerRef = useRef<number | null>(null);
	const lastCommitIndexRef = useRef<number>(-1);

	useEffect(() => {
		console.log("[PLAYBACK] Effect triggered", { isPlaying, hasCommits });

		if (isPlaying && hasCommits) {
			console.log("[PLAYBACK] Starting playback", {
				playbackSpeed,
				playbackDirection,
				timeRange: {
					start: new Date(timeRange.start).toISOString(),
					end: new Date(timeRange.end).toISOString(),
					duration: timeRange.end - timeRange.start,
				},
				hasCommits,
			});
			// Update every 100ms for smooth playback
			const updateInterval = 100;
			// Time increment per update (in ms of repo time)
			const timeIncrement = updateInterval * playbackSpeed;

			let tickCount = 0;
			timerRef.current = setInterval(() => {
				tickCount++;

				onTimeChange((prevTime) => {
					const currentIndex = getCurrentIndex(commits, prevTime);

					// Check if we've moved to a new commit
					if (currentIndex !== lastCommitIndexRef.current) {
						// Find the next commit that will be visible long enough
						const nextVisibleIndex = getNextVisibleCommitIndex(
							commits,
							currentIndex,
							playbackSpeed,
							playbackDirection,
						);

						// If we're skipping commits, jump directly to the next visible one
						if (nextVisibleIndex !== currentIndex + (playbackDirection === "forward" ? 1 : -1)) {
							console.log(
								`[PLAYBACK] Skipping from commit ${currentIndex} to ${nextVisibleIndex} (speed: ${playbackSpeed}x)`,
							);
						}

						lastCommitIndexRef.current = nextVisibleIndex;

						// Jump to the timestamp of the next visible commit
						if (nextVisibleIndex >= 0 && nextVisibleIndex < commits.length) {
							const nextVisibleTime = commits[nextVisibleIndex].date.getTime();

							// Boundary checks
							if (playbackDirection === "forward" && nextVisibleTime >= timeRange.end) {
								console.log("[PLAYBACK] Reached end, stopping playback");
								onPlayingChange(false);
								return timeRange.end;
							}
							if (playbackDirection === "backward" && nextVisibleTime <= timeRange.start) {
								console.log("[PLAYBACK] Reached beginning, stopping playback");
								onPlayingChange(false);
								return timeRange.start;
							}

							if (tickCount <= 10) {
								console.log(
									`[PLAYBACK] Jumping to commit ${nextVisibleIndex}: ${new Date(nextVisibleTime).toISOString()}`,
								);
							}
							return nextVisibleTime;
						}
					}

					// Normal time advancement (smooth scrubbing within a commit)
					let nextTime: number;
					if (playbackDirection === "forward") {
						nextTime = prevTime + timeIncrement;
						if (nextTime >= timeRange.end) {
							console.log("[PLAYBACK] Reached end, stopping playback");
							onPlayingChange(false);
							return timeRange.end;
						}
					} else {
						nextTime = prevTime - timeIncrement;
						if (nextTime <= timeRange.start) {
							console.log("[PLAYBACK] Reached beginning, stopping playback");
							onPlayingChange(false);
							return timeRange.start;
						}
					}

					return nextTime;
				});
			}, updateInterval);

			return () => {
				if (timerRef.current) {
					clearInterval(timerRef.current);
				}
			};
		}
	}, [
		isPlaying,
		playbackSpeed,
		playbackDirection,
		hasCommits,
		commits,
		timeRange.start,
		timeRange.end,
		onTimeChange,
		onPlayingChange,
	]);
}
