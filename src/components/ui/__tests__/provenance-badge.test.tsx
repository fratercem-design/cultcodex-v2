import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProvenanceBadge } from "../provenance-badge";

describe("ProvenanceBadge", () => {
  it("shows TRANSCRIPT-BACKED when hasTranscript and hasSummary", () => {
    render(<ProvenanceBadge hasTranscript={true} hasSummary={true} />);
    expect(screen.getByText("TRANSCRIPT-BACKED")).toBeDefined();
  });

  it("shows INFERRED when no transcript but has summary", () => {
    render(<ProvenanceBadge hasTranscript={false} hasSummary={true} />);
    expect(screen.getByText("INFERRED")).toBeDefined();
  });

  it("shows NO SUMMARY when no summary", () => {
    render(<ProvenanceBadge hasTranscript={false} hasSummary={false} />);
    expect(screen.getByText("NO SUMMARY")).toBeDefined();
  });

  it("shows NO SUMMARY even with transcript if no summary", () => {
    render(<ProvenanceBadge hasTranscript={true} hasSummary={false} />);
    expect(screen.getByText("NO SUMMARY")).toBeDefined();
  });

  it("has cursor-help class for tooltip", () => {
    const { container } = render(<ProvenanceBadge hasTranscript={true} hasSummary={true} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("cursor-help");
  });
});
