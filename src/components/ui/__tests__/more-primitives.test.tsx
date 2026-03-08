import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";
import { MetaRow } from "../meta-row";
import { EmptyState } from "../empty-state";

describe("StatusBadge", () => {
  it("renders label text", () => {
    render(<StatusBadge label="Published" variant="green" />);
    expect(screen.getByText("Published")).toBeInTheDocument();
  });
});

describe("MetaRow", () => {
  it("renders label and value", () => {
    render(<MetaRow label="Air Date" value="2024-01-15" />);
    expect(screen.getByText("Air Date")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState message="No episodes found" />);
    expect(screen.getByText("No episodes found")).toBeInTheDocument();
  });
});
