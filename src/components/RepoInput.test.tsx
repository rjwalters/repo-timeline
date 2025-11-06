import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RepoInput } from "./RepoInput";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

describe("RepoInput", () => {
	beforeEach(() => {
		mockNavigate.mockClear();
	});

	const renderComponent = () => {
		return render(
			<BrowserRouter>
				<RepoInput />
			</BrowserRouter>,
		);
	};

	it("should render with default value", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(
			/owner\/repo/i,
		) as HTMLInputElement;
		expect(input.value).toBe("facebook/react");
	});

	it("should render title and description", () => {
		renderComponent();

		expect(screen.getByText("Repo Timeline Visualizer")).toBeInTheDocument();
		expect(
			screen.getByText(/Visualize how a GitHub repository evolved/i),
		).toBeInTheDocument();
	});

	it("should update input value when typing", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(
			/owner\/repo/i,
		) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "test/repo" } });

		expect(input.value).toBe("test/repo");
	});

	it("should navigate on valid submission", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "facebook/react" } });
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should handle GitHub URL format", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, {
			target: { value: "https://github.com/facebook/react" },
		});
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should handle GitHub URL with pull request", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, {
			target: { value: "https://github.com/facebook/react/pull/123" },
		});
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should remove .git extension", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "facebook/react.git" } });
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should remove trailing slashes", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "facebook/react/" } });
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should show error for invalid format", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "invalid" } });
		fireEvent.click(button);

		expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("should show error for empty owner", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "/repo" } });
		fireEvent.click(button);

		expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("should show error for missing repo name", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "owner/" } });
		fireEvent.click(button);

		expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("should clear error on valid submission", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		// First, trigger an error
		fireEvent.change(input, { target: { value: "invalid" } });
		fireEvent.click(button);
		expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();

		// Then, submit valid input
		fireEvent.change(input, { target: { value: "facebook/react" } });
		fireEvent.click(button);

		expect(screen.queryByText(/Invalid format/i)).not.toBeInTheDocument();
	});

	it("should disable button when input is empty", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		}) as HTMLButtonElement;

		fireEvent.change(input, { target: { value: "" } });

		expect(button.disabled).toBe(true);
	});

	it("should disable button when input is only whitespace", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		}) as HTMLButtonElement;

		fireEvent.change(input, { target: { value: "   " } });

		expect(button.disabled).toBe(true);
	});

	it("should enable button when input has value", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		}) as HTMLButtonElement;

		fireEvent.change(input, { target: { value: "test/repo" } });

		expect(button.disabled).toBe(false);
	});

	it("should render GitHub link", () => {
		renderComponent();

		const link = screen.getByLabelText(/view source on github/i);
		expect(link).toHaveAttribute(
			"href",
			"https://github.com/rjwalters/github-timeline",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("should render example repositories", () => {
		renderComponent();

		expect(screen.getByText(/rjwalters\/bucket-brigade/)).toBeInTheDocument();
		expect(screen.getByText(/microsoft\/vscode/)).toBeInTheDocument();
	});

	it("should render Cloudflare Workers info", () => {
		renderComponent();

		expect(
			screen.getByText(/Powered by Cloudflare Workers/i),
		).toBeInTheDocument();
		expect(screen.getByText(/Data is cached globally/i)).toBeInTheDocument();
	});

	it("should handle form submission via Enter key", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);

		fireEvent.change(input, { target: { value: "test/repo" } });
		fireEvent.submit(input.closest("form")!);

		expect(mockNavigate).toHaveBeenCalledWith("/test/repo");
	});

	it("should trim whitespace from input", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "  facebook/react  " } });
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should handle case-insensitive GitHub URL matching", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, {
			target: { value: "https://GITHUB.COM/facebook/react" },
		});
		fireEvent.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/facebook/react");
	});

	it("should handle multiple slashes in repo path", () => {
		renderComponent();

		const input = screen.getByPlaceholderText(/owner\/repo/i);
		const button = screen.getByRole("button", {
			name: /visualize repository/i,
		});

		fireEvent.change(input, { target: { value: "owner/repo/extra" } });
		fireEvent.click(button);

		// Should fail validation because it has too many slashes
		expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
