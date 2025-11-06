import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RateLimitDisplay } from "./RateLimitDisplay";

describe("RateLimitDisplay", () => {
	it("should return null when remaining is null", () => {
		const { container } = render(
			<RateLimitDisplay remaining={null} limit={100} resetTime={null} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("should return null when limit is null", () => {
		const { container } = render(
			<RateLimitDisplay remaining={50} limit={null} resetTime={null} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("should return null when both are null", () => {
		const { container } = render(
			<RateLimitDisplay remaining={null} limit={null} resetTime={null} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("should display rate limit info when available", () => {
		render(<RateLimitDisplay remaining={50} limit={100} resetTime={null} />);

		expect(screen.getByText("API: 50/100")).toBeInTheDocument();
	});

	it("should show green check icon when remaining is above 20%", () => {
		const { container } = render(
			<RateLimitDisplay remaining={50} limit={100} resetTime={null} />,
		);

		const icon = container.querySelector(".text-green-400");
		expect(icon).toBeInTheDocument();
	});

	it("should show yellow alert icon when remaining is below 20% but above 5%", () => {
		const { container } = render(
			<RateLimitDisplay remaining={15} limit={100} resetTime={null} />,
		);

		const icon = container.querySelector(".text-yellow-400");
		expect(icon).toBeInTheDocument();
	});

	it("should show red alert icon when remaining is below 5%", () => {
		const { container } = render(
			<RateLimitDisplay remaining={4} limit={100} resetTime={null} />,
		);

		const icon = container.querySelector(".text-red-400");
		expect(icon).toBeInTheDocument();
	});

	it("should apply red text color when very low (< 5%)", () => {
		render(<RateLimitDisplay remaining={4} limit={100} resetTime={null} />);

		const text = screen.getByText("API: 4/100");
		expect(text).toHaveClass("text-red-400");
	});

	it("should apply yellow text color when low (< 20%)", () => {
		render(<RateLimitDisplay remaining={15} limit={100} resetTime={null} />);

		const text = screen.getByText("API: 15/100");
		expect(text).toHaveClass("text-yellow-400");
	});

	it("should apply gray text color when normal", () => {
		render(<RateLimitDisplay remaining={80} limit={100} resetTime={null} />);

		const textDiv = screen.getByText("API: 80/100");
		expect(textDiv).toHaveClass("text-gray-400");
	});

	it("should show reset time when remaining is less than half and resetTime is provided", () => {
		const resetTime = new Date("2024-01-01T12:00:00Z");
		render(
			<RateLimitDisplay remaining={40} limit={100} resetTime={resetTime} />,
		);

		expect(screen.getByText(/resets/, { exact: false })).toBeInTheDocument();
	});

	it("should not show reset time when remaining is more than half", () => {
		const resetTime = new Date("2024-01-01T12:00:00Z");
		render(
			<RateLimitDisplay remaining={60} limit={100} resetTime={resetTime} />,
		);

		expect(
			screen.queryByText(/resets/, { exact: false }),
		).not.toBeInTheDocument();
	});

	it("should not show reset time when resetTime is null", () => {
		render(<RateLimitDisplay remaining={40} limit={100} resetTime={null} />);

		expect(
			screen.queryByText(/resets/, { exact: false }),
		).not.toBeInTheDocument();
	});

	it("should handle edge case of 0 remaining", () => {
		render(<RateLimitDisplay remaining={0} limit={100} resetTime={null} />);

		expect(screen.getByText("API: 0/100")).toBeInTheDocument();
		// Should show red (0% < 5%)
		const text = screen.getByText("API: 0/100");
		expect(text).toHaveClass("text-red-400");
	});

	it("should handle edge case of full limit", () => {
		render(<RateLimitDisplay remaining={100} limit={100} resetTime={null} />);

		expect(screen.getByText("API: 100/100")).toBeInTheDocument();
		// Should show green (100% > 20%)
		const text = screen.getByText("API: 100/100");
		expect(text).toHaveClass("text-gray-400");
	});

	it("should handle edge case of exactly 20% remaining", () => {
		render(<RateLimitDisplay remaining={20} limit={100} resetTime={null} />);

		expect(screen.getByText("API: 20/100")).toBeInTheDocument();
		// Exactly 20% should not be considered low
		const text = screen.getByText("API: 20/100");
		expect(text).toHaveClass("text-gray-400");
	});

	it("should handle edge case of exactly 5% remaining", () => {
		render(<RateLimitDisplay remaining={5} limit={100} resetTime={null} />);

		expect(screen.getByText("API: 5/100")).toBeInTheDocument();
		// Exactly 5% should not be considered very low, but is low
		const text = screen.getByText("API: 5/100");
		expect(text).toHaveClass("text-yellow-400");
	});

	it("should format reset time using toLocaleTimeString", () => {
		const resetTime = new Date("2024-01-01T14:30:00Z");
		render(
			<RateLimitDisplay remaining={30} limit={100} resetTime={resetTime} />,
		);

		// Just check that it includes "resets" text, exact format depends on locale
		const resetText = screen.getByText(/resets/);
		expect(resetText).toBeInTheDocument();
	});
});
