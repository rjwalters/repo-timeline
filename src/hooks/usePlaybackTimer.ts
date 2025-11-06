import { useEffect, useRef } from "react";
import type { PlaybackDirection, PlaybackSpeed } from "../lib/types";

interface UsePlaybackTimerOptions {
	isPlaying: boolean;
	playbackSpeed: PlaybackSpeed;
	playbackDirection: PlaybackDirection;
	timeRange: { start: number; end: number };
	hasCommits: boolean;
	onTimeChange: (updater: (prevTime: number) => number) => void;
	onPlayingChange: (isPlaying: boolean) => void;
}

/**
 * Custom hook to manage playback timer for timeline scrubbing
 * Handles automatic time advancement based on playback speed and direction
 */
export function usePlaybackTimer({
	isPlaying,
	playbackSpeed,
	playbackDirection,
	timeRange,
	hasCommits,
	onTimeChange,
	onPlayingChange,
}: UsePlaybackTimerOptions) {
	const timerRef = useRef<number | null>(null);

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
			// At 1x: real time - 1 second of repo time per 1 second of real time
			// Update every 100ms means we advance 100ms of repo time at 1x
			// At higher speeds, multiply accordingly
			const timeIncrement = updateInterval * playbackSpeed;

			let tickCount = 0;
			timerRef.current = setInterval(() => {
				tickCount++;
				if (tickCount <= 10) {
					console.log(
						`[PLAYBACK] Tick ${tickCount}, incrementing by ${timeIncrement}ms`,
					);
				}

				onTimeChange((prevTime) => {
					if (tickCount <= 10) {
						console.log(
							`[PLAYBACK] prevTime: ${new Date(prevTime).toISOString()}`,
						);
					}
					let nextTime: number;

					if (playbackDirection === "forward") {
						nextTime = prevTime + timeIncrement;
						if (nextTime >= timeRange.end) {
							// Stop at end
							console.log("[PLAYBACK] Reached end, stopping playback");
							onPlayingChange(false);
							return timeRange.end;
						}
					} else {
						nextTime = prevTime - timeIncrement;
						if (nextTime <= timeRange.start) {
							// Stop at beginning
							console.log("[PLAYBACK] Reached beginning, stopping playback");
							onPlayingChange(false);
							return timeRange.start;
						}
					}

					if (tickCount <= 10) {
						console.log(
							`[PLAYBACK] nextTime: ${new Date(nextTime).toISOString()}`,
						);
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
		timeRange.start,
		timeRange.end,
		onTimeChange,
		onPlayingChange,
	]);
}
