import type { CommitData } from "../types";

/**
 * Find the index of the commit at or before the given time
 * @param commits Array of commits sorted by date
 * @param time Timestamp in milliseconds
 * @returns Index of the current commit (0 if no commits or time is before first commit)
 */
export function getCurrentIndex(commits: CommitData[], time: number): number {
	if (commits.length === 0) return 0;
	// Find the latest commit that is <= current time
	for (let i = commits.length - 1; i >= 0; i--) {
		if (commits[i].date.getTime() <= time) {
			return i;
		}
	}
	return 0;
}

/**
 * Physics simulation settle time in seconds (time for force graph to stabilize)
 */
const ANIMATION_SETTLE_TIME = 3;

/**
 * Find the next commit that will be visible long enough to appreciate during playback
 * Skips commits that would flash by too quickly based on playback speed
 *
 * @param commits Array of commits sorted by date
 * @param currentIndex Current commit index
 * @param playbackSpeed Playback speed multiplier (e.g., 60 = 60 seconds of repo time per 1 second real time)
 * @param direction Direction of playback ('forward' or 'backward')
 * @returns Index of next visible commit, or currentIndex if no suitable commit found
 */
export function getNextVisibleCommitIndex(
	commits: CommitData[],
	currentIndex: number,
	playbackSpeed: number,
	direction: "forward" | "backward",
): number {
	if (commits.length === 0) return currentIndex;

	const increment = direction === "forward" ? 1 : -1;
	let candidateIndex = currentIndex + increment;

	// Boundary checks
	if (candidateIndex < 0 || candidateIndex >= commits.length) {
		return currentIndex;
	}

	// At slow speeds (1x), show every commit
	if (playbackSpeed <= 1) {
		return candidateIndex;
	}

	// Look ahead to find a commit that will be displayed long enough
	while (
		candidateIndex >= 0 &&
		candidateIndex < commits.length - 1
	) {
		const nextIndex = candidateIndex + increment;

		// Can't look further ahead
		if (nextIndex < 0 || nextIndex >= commits.length) {
			return candidateIndex;
		}

		// Calculate time difference between this commit and the next
		const currentCommitTime = commits[candidateIndex].date.getTime();
		const nextCommitTime = commits[nextIndex].date.getTime();
		const timeDiffMs = Math.abs(nextCommitTime - currentCommitTime);

		// Convert to real-time display duration
		const realTimeDisplaySeconds = timeDiffMs / 1000 / playbackSpeed;

		// If this commit will be displayed long enough, use it
		if (realTimeDisplaySeconds >= ANIMATION_SETTLE_TIME) {
			return candidateIndex;
		}

		// Otherwise, skip to next commit
		candidateIndex = nextIndex;
	}

	// Return the last valid candidate
	return candidateIndex;
}
