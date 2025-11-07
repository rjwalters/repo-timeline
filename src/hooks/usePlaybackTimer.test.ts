import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaybackDirection, PlaybackSpeed } from "../lib/types";
import { usePlaybackTimer } from "./usePlaybackTimer";

describe("usePlaybackTimer", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("initialization", () => {
		it("should not start timer when isPlaying is false", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: false,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(1000);

			expect(onTimeChange).not.toHaveBeenCalled();
			expect(onPlayingChange).not.toHaveBeenCalled();
		});

		it("should not start timer when hasCommits is false", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: false,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(1000);

			expect(onTimeChange).not.toHaveBeenCalled();
			expect(onPlayingChange).not.toHaveBeenCalled();
		});

		it("should start timer when isPlaying and hasCommits are both true", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
		});
	});

	describe("forward playback", () => {
		it("should advance time forward at 1x speed", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 1,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
			// At 1x speed, 100ms real time = 100ms repo time
			const updater = onTimeChange.mock.calls[0][0];
			expect(updater(1000)).toBe(1100); // 1000 + 100
		});

		it("should advance time forward at 60x speed", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 100000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
			// At 60x speed, 100ms real time = 6000ms repo time
			const updater = onTimeChange.mock.calls[0][0];
			expect(updater(1000)).toBe(7000); // 1000 + 6000
		});

		it("should advance time forward at 300x speed", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 300,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 100000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
			// At 300x speed, 100ms real time = 30000ms repo time
			const updater = onTimeChange.mock.calls[0][0];
			expect(updater(1000)).toBe(31000); // 1000 + 30000
		});

		it("should advance time forward at 1800x speed", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 1800,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 200000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
			// At 1800x speed, 100ms real time = 180000ms repo time
			const updater = onTimeChange.mock.calls[0][0];
			expect(updater(1000)).toBe(181000); // 1000 + 180000
		});

		it("should call onTimeChange multiple times for continuous playback", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 100000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(500); // 5 updates (100ms interval)

			expect(onTimeChange).toHaveBeenCalledTimes(5);
		});

		it("should stop at end of time range", () => {
			const onTimeChange = vi.fn((updater) => {
				// Simulate the actual behavior: return the result of calling updater
				return updater(9500);
			});
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			// Should stop when reaching end (9500 + 6000 >= 10000)
			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(9500);
			expect(result).toBe(10000); // Clamped to end
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});

		it("should clamp to exact end value when overshooting", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 1800,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(5000);
			// 5000 + 180000 would be way past 10000, should clamp to 10000
			expect(result).toBe(10000);
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});
	});

	describe("reverse playback", () => {
		it("should move time backward at 1x speed", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 1,
					playbackDirection: "reverse",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
			const updater = onTimeChange.mock.calls[0][0];
			expect(updater(5000)).toBe(4900); // 5000 - 100
		});

		it("should move time backward at 60x speed", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "reverse",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			expect(onTimeChange).toHaveBeenCalled();
			const updater = onTimeChange.mock.calls[0][0];
			expect(updater(10000)).toBe(4000); // 10000 - 6000
		});

		it("should stop at start of time range", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "reverse",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(500); // 500 - 6000 would be negative
			expect(result).toBe(0); // Clamped to start
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});

		it("should clamp to exact start value when undershooting", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 1800,
					playbackDirection: "reverse",
					timeRange: { start: 1000, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(5000);
			// 5000 - 180000 would be way below 1000, should clamp to 1000
			expect(result).toBe(1000);
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});

		it("should handle multiple backward steps", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "reverse",
					timeRange: { start: 0, end: 100000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(300); // 3 updates

			expect(onTimeChange).toHaveBeenCalledTimes(3);
		});
	});

	describe("cleanup", () => {
		it("should clear interval on unmount", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();
			const clearIntervalSpy = vi.spyOn(global, "clearInterval");

			const { unmount } = renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			unmount();

			expect(clearIntervalSpy).toHaveBeenCalled();
		});

		it("should clear interval when isPlaying changes to false", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();
			const clearIntervalSpy = vi.spyOn(global, "clearInterval");

			const { rerender } = renderHook(
				({ isPlaying }) =>
					usePlaybackTimer({
						isPlaying,
						playbackSpeed: 60,
						playbackDirection: "forward",
						timeRange: { start: 0, end: 10000 },
						hasCommits: true,
					commits: [],
						onTimeChange,
						onPlayingChange,
					}),
				{
					initialProps: { isPlaying: true },
				},
			);

			// First render should set up interval
			vi.advanceTimersByTime(100);
			expect(onTimeChange).toHaveBeenCalled();

			// Change to not playing
			rerender({ isPlaying: false });

			expect(clearIntervalSpy).toHaveBeenCalled();

			// Reset mock
			onTimeChange.mockClear();

			// Advancing time should not trigger updates anymore
			vi.advanceTimersByTime(1000);
			expect(onTimeChange).not.toHaveBeenCalled();
		});

		it("should restart timer when playback parameters change", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			const { rerender } = renderHook(
				({ speed }: { speed: PlaybackSpeed }) =>
					usePlaybackTimer({
						isPlaying: true,
						playbackSpeed: speed,
						playbackDirection: "forward",
						timeRange: { start: 0, end: 100000 },
						hasCommits: true,
					commits: [],
						onTimeChange,
						onPlayingChange,
					}),
				{
					initialProps: { speed: 60 as PlaybackSpeed },
				},
			);

			vi.advanceTimersByTime(100);
			const firstUpdater = onTimeChange.mock.calls[0][0];
			expect(firstUpdater(1000)).toBe(7000); // 1000 + 6000 at 60x

			onTimeChange.mockClear();

			// Change speed
			rerender({ speed: 300 as PlaybackSpeed });

			vi.advanceTimersByTime(100);
			const secondUpdater = onTimeChange.mock.calls[0][0];
			expect(secondUpdater(1000)).toBe(31000); // 1000 + 30000 at 300x
		});
	});

	describe("edge cases", () => {
		it("should handle time range with same start and end", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 5000, end: 5000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(5000);
			// Already at end, should stop
			expect(result).toBe(5000);
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});

		it("should handle very small time ranges", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 1,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 50 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(0);
			// 0 + 100 > 50, should clamp
			expect(result).toBe(50);
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});

		it("should handle negative time range start", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "reverse",
					timeRange: { start: -1000, end: 10000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			vi.advanceTimersByTime(100);

			const updater = onTimeChange.mock.calls[0][0];
			const result = updater(0);
			// 0 - 6000 < -1000, should clamp to -1000
			expect(result).toBe(-1000);
			expect(onPlayingChange).toHaveBeenCalledWith(false);
		});

		it("should update every 100ms consistently", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			renderHook(() =>
				usePlaybackTimer({
					isPlaying: true,
					playbackSpeed: 60,
					playbackDirection: "forward",
					timeRange: { start: 0, end: 100000 },
					hasCommits: true,
					commits: [],
					onTimeChange,
					onPlayingChange,
				}),
			);

			// Advance by exactly 1000ms (should be 10 updates)
			vi.advanceTimersByTime(1000);

			expect(onTimeChange).toHaveBeenCalledTimes(10);
		});

		it("should handle direction change", () => {
			const onTimeChange = vi.fn();
			const onPlayingChange = vi.fn();

			const { rerender } = renderHook(
				({ direction }: { direction: PlaybackDirection }) =>
					usePlaybackTimer({
						isPlaying: true,
						playbackSpeed: 60,
						playbackDirection: direction,
						timeRange: { start: 0, end: 100000 },
						hasCommits: true,
					commits: [],
						onTimeChange,
						onPlayingChange,
					}),
				{
					initialProps: { direction: "forward" as PlaybackDirection },
				},
			);

			vi.advanceTimersByTime(100);
			const forwardUpdater = onTimeChange.mock.calls[0][0];
			expect(forwardUpdater(5000)).toBe(11000); // Forward: 5000 + 6000

			onTimeChange.mockClear();

			// Change direction
			rerender({ direction: "reverse" as PlaybackDirection });

			vi.advanceTimersByTime(100);
			const reverseUpdater = onTimeChange.mock.calls[0][0];
			// At 50000, going reverse by 6000 = 44000 (stays within range)
			expect(reverseUpdater(50000)).toBe(44000); // Reverse: 50000 - 6000
		});
	});
});
