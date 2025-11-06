import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoadProgress } from "../types";
import { RepoStatusBanner } from "./RepoStatusBanner";

describe("RepoStatusBanner", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	const defaultGithub = {
		estimatedTotalPRs: 100,
		hasMoreThan100PRs: true,
		firstMergedPR: { number: 1, merged_at: "2024-01-01T00:00:00Z" },
	};

	const defaultCache = {
		exists: true,
		cachedCommits: 50,
		ageSeconds: 300,
		lastCommitSha: "abc123",
		defaultBranch: "main",
		firstCommit: { sha: "first123", date: "2024-01-01T00:00:00Z" },
		lastCommit: { sha: "last456", date: "2024-12-31T23:59:59Z" },
	};

	const defaultProps = {
		github: defaultGithub,
		cache: defaultCache,
		recommendation: "ready" as const,
		isVisible: true,
		onVisibilityChange: vi.fn(),
	};

	it("should render with ready status", () => {
		render(<RepoStatusBanner {...defaultProps} recommendation="ready" />);

		expect(screen.getByText("Ready to visualize")).toBeInTheDocument();
		expect(screen.getByText("✓")).toBeInTheDocument();
	});

	it("should render with partial status", () => {
		render(<RepoStatusBanner {...defaultProps} recommendation="partial" />);

		expect(
			screen.getByText("Partially cached - visualizing available data"),
		).toBeInTheDocument();
		expect(screen.getByText("⚡")).toBeInTheDocument();
	});

	it("should render with fetching status", () => {
		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="fetching"
				backgroundLoading={true}
			/>,
		);

		expect(
			screen.getByText("Collecting data in background..."),
		).toBeInTheDocument();
		expect(screen.getByText("⏳")).toBeInTheDocument();
	});

	it("should display GitHub PR count", () => {
		render(<RepoStatusBanner {...defaultProps} />);

		expect(screen.getByText(/~100 PRs/)).toBeInTheDocument();
	});

	it("should display first merged PR number", () => {
		render(<RepoStatusBanner {...defaultProps} />);

		expect(screen.getByText(/\(from #1\)/)).toBeInTheDocument();
	});

	it("should display cached commit count", () => {
		render(<RepoStatusBanner {...defaultProps} />);

		expect(screen.getByText(/50 commits/)).toBeInTheDocument();
	});

	it("should display cache percentage", () => {
		render(<RepoStatusBanner {...defaultProps} />);

		// 50 cached / 100 total = 50%
		expect(screen.getByText(/\(50%\)/)).toBeInTheDocument();
	});

	it("should display cache age in minutes", () => {
		render(<RepoStatusBanner {...defaultProps} />);

		// 300 seconds = 5 minutes
		expect(screen.getByText(/5m ago/)).toBeInTheDocument();
	});

	it("should display commit date range", () => {
		render(<RepoStatusBanner {...defaultProps} />);

		// Just check that dates are displayed (exact format depends on locale/timezone)
		const dateText = screen.getByText(/2023|2024/);
		expect(dateText).toBeInTheDocument();
	});

	it("should display load progress when backgroundLoading", () => {
		const loadProgress: LoadProgress = {
			loaded: 25,
			total: 100,
			percentage: 25,
			message: "Loading PRs...",
		};

		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="fetching"
				backgroundLoading={true}
				loadProgress={loadProgress}
			/>,
		);

		expect(screen.getByText(/\(25\/100 PRs - 25%\)/)).toBeInTheDocument();
	});

	it("should display unknown total when loadProgress.total is -1", () => {
		const loadProgress: LoadProgress = {
			loaded: 25,
			total: -1,
			percentage: 0,
			message: "Loading PRs...",
		};

		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="fetching"
				backgroundLoading={true}
				loadProgress={loadProgress}
			/>,
		);

		expect(screen.getByText(/\(25\/\? PRs/)).toBeInTheDocument();
	});

	it("should render Clear button when onClearCache provided and cache exists", () => {
		const onClearCache = vi.fn();
		render(<RepoStatusBanner {...defaultProps} onClearCache={onClearCache} />);

		const clearButton = screen.getByRole("button", { name: /clear/i });
		expect(clearButton).toBeInTheDocument();
	});

	it("should not render Clear button when cache does not exist", () => {
		const onClearCache = vi.fn();
		render(
			<RepoStatusBanner
				{...defaultProps}
				cache={{ ...defaultCache, exists: false }}
				onClearCache={onClearCache}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /clear/i }),
		).not.toBeInTheDocument();
	});

	it("should call onClearCache when Clear button clicked", () => {
		const onClearCache = vi.fn();
		render(<RepoStatusBanner {...defaultProps} onClearCache={onClearCache} />);

		const clearButton = screen.getByRole("button", { name: /clear/i });
		clearButton.click();

		expect(onClearCache).toHaveBeenCalledTimes(1);
	});

	it("should render custom toggle button", () => {
		const toggleButton = <button data-testid="custom-toggle">Toggle</button>;
		render(<RepoStatusBanner {...defaultProps} toggleButton={toggleButton} />);

		expect(screen.getByTestId("custom-toggle")).toBeInTheDocument();
	});

	it("should apply visible class when isVisible is true", () => {
		const { container } = render(
			<RepoStatusBanner {...defaultProps} isVisible={true} />,
		);

		const banner = container.firstChild as HTMLElement;
		expect(banner.className).toContain("translate-y-0");
	});

	it("should apply hidden class when isVisible is false", () => {
		const { container } = render(
			<RepoStatusBanner {...defaultProps} isVisible={false} />,
		);

		const banner = container.firstChild as HTMLElement;
		expect(banner.className).toContain("translate-y-full");
	});

	it("should auto-hide after 3 seconds when ready and not loading", () => {
		const onVisibilityChange = vi.fn();
		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="ready"
				backgroundLoading={false}
				isVisible={true}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		// Fast-forward 3 seconds
		vi.advanceTimersByTime(3000);

		expect(onVisibilityChange).toHaveBeenCalledWith(false);
	});

	it("should not auto-hide when status is partial", () => {
		const onVisibilityChange = vi.fn();
		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="partial"
				isVisible={true}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		vi.advanceTimersByTime(3000);

		expect(onVisibilityChange).not.toHaveBeenCalledWith(false);
	});

	it("should not auto-hide when backgroundLoading is true", () => {
		const onVisibilityChange = vi.fn();
		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="ready"
				backgroundLoading={true}
				isVisible={true}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		vi.advanceTimersByTime(3000);

		expect(onVisibilityChange).not.toHaveBeenCalledWith(false);
	});

	it("should show banner when status changes to non-ready", () => {
		const onVisibilityChange = vi.fn();
		render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="fetching"
				backgroundLoading={true}
				isVisible={false}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		expect(onVisibilityChange).toHaveBeenCalledWith(true);
	});

	it("should override fetching status when not actually loading", () => {
		const { container } = render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="fetching"
				backgroundLoading={false}
			/>,
		);

		// Should display ready status instead
		expect(screen.getByText("Ready to visualize")).toBeInTheDocument();
		const bannerDiv = container.querySelector(".py-2");
		expect(bannerDiv?.className).toContain("bg-green-900");
	});

	it("should apply correct colors for ready status", () => {
		const { container } = render(
			<RepoStatusBanner {...defaultProps} recommendation="ready" />,
		);

		const bannerDiv = container.querySelector(".py-2");
		expect(bannerDiv?.className).toContain("bg-green-900");
		expect(bannerDiv?.className).toContain("border-green-600");
		expect(bannerDiv?.className).toContain("text-green-200");
	});

	it("should apply correct colors for partial status", () => {
		const { container } = render(
			<RepoStatusBanner {...defaultProps} recommendation="partial" />,
		);

		const bannerDiv = container.querySelector(".py-2");
		expect(bannerDiv?.className).toContain("bg-yellow-900");
		expect(bannerDiv?.className).toContain("border-yellow-600");
		expect(bannerDiv?.className).toContain("text-yellow-200");
	});

	it("should apply correct colors for fetching status", () => {
		const { container } = render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="fetching"
				backgroundLoading={true}
			/>,
		);

		const bannerDiv = container.querySelector(".py-2");
		expect(bannerDiv?.className).toContain("bg-blue-900");
		expect(bannerDiv?.className).toContain("border-blue-600");
		expect(bannerDiv?.className).toContain("text-blue-200");
	});

	it("should handle missing first merged PR", () => {
		render(
			<RepoStatusBanner
				{...defaultProps}
				github={{ ...defaultGithub, firstMergedPR: null }}
			/>,
		);

		expect(screen.queryByText(/from #/)).not.toBeInTheDocument();
	});

	it("should handle missing cache age", () => {
		render(
			<RepoStatusBanner
				{...defaultProps}
				cache={{ ...defaultCache, ageSeconds: null }}
			/>,
		);

		expect(screen.queryByText(/m ago/)).not.toBeInTheDocument();
	});

	it("should handle missing commit date range", () => {
		render(
			<RepoStatusBanner
				{...defaultProps}
				cache={{ ...defaultCache, firstCommit: null, lastCommit: null }}
			/>,
		);

		// When no commit dates, they just won't appear - check main content still renders
		expect(screen.getByText("Ready to visualize")).toBeInTheDocument();
	});

	it("should not display percentage when no cached commits", () => {
		render(
			<RepoStatusBanner
				{...defaultProps}
				cache={{ ...defaultCache, cachedCommits: 0, exists: false }}
			/>,
		);

		expect(screen.queryByText(/\(0%\)/)).not.toBeInTheDocument();
	});

	it("should clean up timer on unmount", () => {
		const onVisibilityChange = vi.fn();
		const { unmount } = render(
			<RepoStatusBanner
				{...defaultProps}
				recommendation="ready"
				backgroundLoading={false}
				isVisible={true}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		unmount();
		vi.advanceTimersByTime(3000);

		expect(onVisibilityChange).not.toHaveBeenCalled();
	});
});
