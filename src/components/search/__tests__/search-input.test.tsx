import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { SearchInput } from "../search-input";

describe("SearchInput", () => {
  it("renders with placeholder text", () => {
    render(<SearchInput />);
    expect(
      screen.getByPlaceholderText(/search episodes/i),
    ).toBeInTheDocument();
  });

  it("renders with default value", () => {
    render(<SearchInput defaultValue="psyche" />);
    const input = screen.getByPlaceholderText(/search episodes/i);
    expect(input).toHaveValue("psyche");
  });

  it("renders a search button", () => {
    render(<SearchInput />);
    expect(
      screen.getByRole("button", { name: /search/i }),
    ).toBeInTheDocument();
  });
});
