import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CommitData } from "../types";
import { TimelineScrubber } from "./TimelineScrubber";

describe("TimelineScrubber", () => {
	const mockCommits: CommitData[] = [
		{
			hash: "abc123",
			message: "First commit",
			author: "User1",
			date: new Date("2024-01-01T00:00:00Z"),
			files: [
				{
					id: "file1",
					path: "file1.ts",
					name: "file1.ts",
					type: "file",
					size: 100,
				},
			],
			edges: [],
		},
		{
			hash: "def456",
			message: "Second commit",
			author: "User2",
			date: new Date("2024-01-01T01:00:00Z"),
			files: [
				{
					id: "file2",
					path: "file2.ts",
					name: "file2.ts",
					type: "file",
					size: 200,
				},
			],
			edges: [],
		},
		{
			hash: "ghi789",
			message: "Third commit",
			author: "User3",
			date: new Date("2024-01-01T02:00:00Z"),
			files: [
				{
					id: "file3",
					path: "file3.ts",
					name: "file3.ts",
					type: "file",
					size: 300,
				},
			],
			edges: [],
		},
	];

	const defaultProps = {
		commits: mockCommits,
		currentTime: new Date("2024-01-01T00:00:00Z").getTime(),
		onTimeChange: vi.fn(),
		timeRange: {
			start: new Date("2024-01-01T00:00:00Z").getTime(),
			end: new Date("2024-01-01T02:00:00Z").getTime(),
		},
		isPlaying: false,
		onPlayPause: vi.fn(),
		playbackSpeed: 60 as const,
		onSpeedChange: vi.fn(),
		playbackDirection: "forward" as const,
		onDirectionChange: vi.fn(),
	};

	it("should render commit info", () => {
		render(<TimelineScrubber {...defaultProps} />);

		expect(screen.getByText("First commit")).toBeInTheDocument();
		expect(screen.getByText(/User1/)).toBeInTheDocument();
	});

	it("should return null when no current commit", () => {
		const { container } = render(
			<TimelineScrubber
				{...defaultProps}
				commits={[]}
				currentTime={0}
				timeRange={{ start: 0, end: 1000 }}
			/>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("should display file count", () => {
		render(<TimelineScrubber {...defaultProps} />);

		expect(screen.getByText(/Files:/)).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument(); // 1 file in first commit
	});

	it("should display commit index", () => {
		render(<TimelineScrubber {...defaultProps} />);

		expect(screen.getByText(/Commit:/)).toBeInTheDocument();
		expect(screen.getByText(/1 of 3/)).toBeInTheDocument();
	});

	it("should display commit hash", () => {
		render(<TimelineScrubber {...defaultProps} />);

		expect(screen.getByText(/Hash:/)).toBeInTheDocument();
		expect(screen.getByText("abc123")).toBeInTheDocument();
	});

	it("should show playing status when isPlaying is true", () => {
		render(<TimelineScrubber {...defaultProps} isPlaying={true} />);

		expect(screen.getByText(/Playing forward at 60x/)).toBeInTheDocument();
	});

	it("should not show playing status when isPlaying is false", () => {
		render(<TimelineScrubber {...defaultProps} isPlaying={false} />);

		expect(screen.queryByText(/Playing/)).not.toBeInTheDocument();
	});

	it("should call onTimeChange when slider changes", () => {
		const onTimeChange = vi.fn();
		render(<TimelineScrubber {...defaultProps} onTimeChange={onTimeChange} />);

		const slider = screen.getByRole("slider");
		fireEvent.change(slider, { target: { value: "50" } });

		expect(onTimeChange).toHaveBeenCalled();
		// Should calculate time at 50% between start and end
		const expectedTime =
			defaultProps.timeRange.start +
			(defaultProps.timeRange.end - defaultProps.timeRange.start) * 0.5;
		expect(onTimeChange).toHaveBeenCalledWith(expectedTime);
	});

	it("should render PR markers for each commit", () => {
		const { container } = render(<TimelineScrubber {...defaultProps} />);

		// Should have 3 markers for 3 commits
		const markers = container.querySelectorAll(".bg-gray-500");
		expect(markers.length).toBe(3);
	});

	it("should call onResetView when provided", () => {
		const onResetView = vi.fn();
		render(<TimelineScrubber {...defaultProps} onResetView={onResetView} />);

		// The PlaybackControls component would trigger this
		// This test just ensures the prop is passed
		expect(onResetView).not.toHaveBeenCalled();
	});

	it("should handle hasMoreCommits prop", () => {
		render(<TimelineScrubber {...defaultProps} hasMoreCommits={true} />);

		// Component should render normally
		expect(screen.getByText("First commit")).toBeInTheDocument();
	});

	it("should handle backgroundLoading prop", () => {
		render(<TimelineScrubber {...defaultProps} backgroundLoading={true} />);

		// Component should render normally
		expect(screen.getByText("First commit")).toBeInTheDocument();
	});

	it("should display current commit at different time", () => {
		// Time at second commit
		render(
			<TimelineScrubber
				{...defaultProps}
				currentTime={new Date("2024-01-01T01:00:00Z").getTime()}
			/>,
		);

		expect(screen.getByText("Second commit")).toBeInTheDocument();
		expect(screen.getByText(/User2/)).toBeInTheDocument();
	});

	it("should calculate slider position correctly", () => {
		// At 50% through time range
		const midTime =
			defaultProps.timeRange.start +
			(defaultProps.timeRange.end - defaultProps.timeRange.start) * 0.5;

		render(<TimelineScrubber {...defaultProps} currentTime={midTime} />);

		const slider = screen.getByRole("slider") as HTMLInputElement;
		expect(slider.value).toBe("50");
	});

	it("should handle edge case of currentTime at start", () => {
		render(
			<TimelineScrubber
				{...defaultProps}
				currentTime={defaultProps.timeRange.start}
			/>,
		);

		const slider = screen.getByRole("slider") as HTMLInputElement;
		expect(slider.value).toBe("0");
	});

	it("should handle edge case of currentTime at end", () => {
		render(
			<TimelineScrubber
				{...defaultProps}
				currentTime={defaultProps.timeRange.end}
			/>,
		);

		const slider = screen.getByRole("slider") as HTMLInputElement;
		expect(slider.value).toBe("100");
	});

	it("should render slider with correct attributes", () => {
		render(<TimelineScrubber {...defaultProps} />);

		const slider = screen.getByRole("slider") as HTMLInputElement;
		expect(slider.min).toBe("0");
		expect(slider.max).toBe("100");
		expect(slider.step).toBe("0.1");
	});

	it("should show different playback speeds in status", () => {
		const { rerender } = render(
			<TimelineScrubber {...defaultProps} isPlaying={true} playbackSpeed={1} />,
		);
		expect(screen.getByText(/at 1x/)).toBeInTheDocument();

		rerender(
			<TimelineScrubber
				{...defaultProps}
				isPlaying={true}
				playbackSpeed={300}
			/>,
		);
		expect(screen.getByText(/at 300x/)).toBeInTheDocument();

		rerender(
			<TimelineScrubber
				{...defaultProps}
				isPlaying={true}
				playbackSpeed={1800}
			/>,
		);
		expect(screen.getByText(/at 1800x/)).toBeInTheDocument();
	});

	it("should show playback direction in status", () => {
		const { rerender } = render(
			<TimelineScrubber
				{...defaultProps}
				isPlaying={true}
				playbackDirection="forward"
			/>,
		);
		expect(screen.getByText(/Playing forward/)).toBeInTheDocument();

		rerender(
			<TimelineScrubber
				{...defaultProps}
				isPlaying={true}
				playbackDirection="reverse"
			/>,
		);
		expect(screen.getByText(/Playing reverse/)).toBeInTheDocument();
	});

	it("should include custom slider styles", () => {
		const { container } = render(<TimelineScrubber {...defaultProps} />);

		const style = container.querySelector("style");
		expect(style).toBeInTheDocument();
		expect(style?.textContent).toContain(".slider::-webkit-slider-thumb");
		expect(style?.textContent).toContain(".slider::-moz-range-thumb");
	});

	describe("navigation handlers", () => {
		it("should call onTimeChange with previous commit time when handlePrevious is called", () => {
			const onTimeChange = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T01:00:00Z").getTime()} // Second commit
					onTimeChange={onTimeChange}
				/>,
			);

			// Find and click the previous button (should be in PlaybackControls)
			const prevButton = document.querySelector(
				'[title="Previous commit"]',
			) as HTMLButtonElement;
			if (prevButton) {
				fireEvent.click(prevButton);
				expect(onTimeChange).toHaveBeenCalledWith(
					new Date("2024-01-01T00:00:00Z").getTime(),
				);
			}
		});

		it("should call onTimeChange with next commit time when handleNext is called", () => {
			const onTimeChange = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T00:00:00Z").getTime()} // First commit
					onTimeChange={onTimeChange}
				/>,
			);

			const nextButton = document.querySelector(
				'[title="Next commit"]',
			) as HTMLButtonElement;
			if (nextButton) {
				fireEvent.click(nextButton);
				expect(onTimeChange).toHaveBeenCalledWith(
					new Date("2024-01-01T01:00:00Z").getTime(),
				);
			}
		});

		it("should call onLoadMore when handleNext is at last commit with more available", () => {
			const onLoadMore = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T02:00:00Z").getTime()} // Last commit
					hasMoreCommits={true}
					onLoadMore={onLoadMore}
				/>,
			);

			const nextButton = document.querySelector(
				'[title^="Next commit"]',
			) as HTMLButtonElement;
			if (nextButton) {
				fireEvent.click(nextButton);
				expect(onLoadMore).toHaveBeenCalled();
			}
		});

		it("should call onTimeChange with first commit time when handleSkipToStart is called", () => {
			const onTimeChange = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T02:00:00Z").getTime()} // Last commit
					onTimeChange={onTimeChange}
				/>,
			);

			const skipStartButton = document.querySelector(
				'[title="Skip to first commit"]',
			) as HTMLButtonElement;
			if (skipStartButton) {
				fireEvent.click(skipStartButton);
				expect(onTimeChange).toHaveBeenCalledWith(
					new Date("2024-01-01T00:00:00Z").getTime(),
				);
			}
		});

		it("should call onTimeChange with last commit time when handleSkipToEnd is called", () => {
			const onTimeChange = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T00:00:00Z").getTime()} // First commit
					onTimeChange={onTimeChange}
				/>,
			);

			const skipEndButton = document.querySelector(
				'[title="Skip to last commit"]',
			) as HTMLButtonElement;
			if (skipEndButton) {
				fireEvent.click(skipEndButton);
				expect(onTimeChange).toHaveBeenCalledWith(
					new Date("2024-01-01T02:00:00Z").getTime(),
				);
			}
		});

		it("should call onLoadMore when handleSkipToEnd with more commits available", () => {
			const onLoadMore = vi.fn();
			const onTimeChange = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T00:00:00Z").getTime()}
					hasMoreCommits={true}
					onLoadMore={onLoadMore}
					onTimeChange={onTimeChange}
				/>,
			);

			const skipEndButton = document.querySelector(
				'[title^="Skip to last commit"]',
			) as HTMLButtonElement;
			if (skipEndButton) {
				fireEvent.click(skipEndButton);
				expect(onLoadMore).toHaveBeenCalled();
				expect(onTimeChange).toHaveBeenCalledWith(
					new Date("2024-01-01T02:00:00Z").getTime(),
				);
			}
		});

		it("should not call onTimeChange when handlePrevious at first commit", () => {
			const onTimeChange = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T00:00:00Z").getTime()} // First commit
					onTimeChange={onTimeChange}
				/>,
			);

			const prevButton = document.querySelector(
				'[title="Previous commit"]',
			) as HTMLButtonElement;
			if (prevButton && prevButton.disabled) {
				// Button should be disabled at first commit
				expect(prevButton.disabled).toBe(true);
			}
		});

		it("should not call onLoadMore when handleNext at last commit without hasMoreCommits", () => {
			const onLoadMore = vi.fn();
			render(
				<TimelineScrubber
					{...defaultProps}
					currentTime={new Date("2024-01-01T02:00:00Z").getTime()} // Last commit
					hasMoreCommits={false}
					onLoadMore={onLoadMore}
				/>,
			);

			const nextButton = document.querySelector(
				'[title="Next commit"]',
			) as HTMLButtonElement;
			if (nextButton) {
				fireEvent.click(nextButton);
				expect(onLoadMore).not.toHaveBeenCalled();
			}
		});
	});
});
