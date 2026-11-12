import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("sort=oldest&page=7"),
}));

import { SortFilterBar } from "../sort-filter-bar";

describe("SortFilterBar on a later page", () => {
  it("goes back to the first page when the filter changes, keeping the sort", () => {
    render(
      <SortFilterBar
        basePath="/episodes"
        sortOptions={[{ label: "Oldest", value: "oldest" }]}
        currentSort="oldest"
        filterLabel="Type"
        filterOptions={[{ label: "Short", value: "short" }]}
      />,
    );

    fireEvent.click(screen.getByText("Short"));

    expect(mockPush).toHaveBeenCalledWith("/episodes?sort=oldest&filter=short");
  });
});
