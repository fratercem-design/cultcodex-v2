import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SortFilterBar } from "../sort-filter-bar";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "A → Z", value: "az" },
];

describe("SortFilterBar", () => {
  it("renders sort buttons", () => {
    render(
      <SortFilterBar
        basePath="/episodes"
        sortOptions={SORT_OPTIONS}
        currentSort="newest"
      />,
    );
    expect(screen.getByText("Newest")).toBeInTheDocument();
    expect(screen.getByText("Oldest")).toBeInTheDocument();
    expect(screen.getByText("A → Z")).toBeInTheDocument();
  });

  it("highlights the active sort option", () => {
    render(
      <SortFilterBar
        basePath="/episodes"
        sortOptions={SORT_OPTIONS}
        currentSort="oldest"
      />,
    );
    const oldestBtn = screen.getByText("Oldest");
    expect(oldestBtn.className).toContain("text-accent-gold-text");
  });

  it("renders filter options when provided", () => {
    const filters = [
      { label: "Host", value: "host" },
      { label: "Guest", value: "guest" },
    ];
    render(
      <SortFilterBar
        basePath="/people"
        sortOptions={SORT_OPTIONS}
        currentSort="newest"
        filterLabel="Type"
        filterOptions={filters}
        currentFilter="host"
      />,
    );
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("does not render filter section when no filter options given", () => {
    render(
      <SortFilterBar
        basePath="/episodes"
        sortOptions={SORT_OPTIONS}
        currentSort="newest"
      />,
    );
    expect(screen.queryByText("All")).not.toBeInTheDocument();
  });
});
