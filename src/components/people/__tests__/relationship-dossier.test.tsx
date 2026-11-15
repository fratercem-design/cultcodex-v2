import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelationshipDossier } from "../relationship-dossier";
import type { DossierBeat, RelationshipDossierEntry } from "@/lib/queries/relationships";

function beat(i: number): DossierBeat {
  return {
    id: `b${i}`,
    headline: `Beat ${i}`,
    details: null,
    relationType: "friend",
    isTurn: false,
    occurredAt: null,
    episode: null,
    confidence: null,
  };
}

function entry(i: number, beatCount: number): RelationshipDossierEntry {
  return {
    counterpart: { id: `p${i}`, slug: `person-${i}`, displayName: `Person ${i}`, avatarUrl: null },
    currentState: "friend",
    beats: Array.from({ length: beatCount }, (_, b) => beat(i * 100 + b)),
  };
}

const renderDossier = (entries: RelationshipDossierEntry[]) =>
  render(<RelationshipDossier entries={entries} personName="Psyche" personSlug="psyche" />);

describe("RelationshipDossier progressive disclosure", () => {
  it("renders nothing without entries", () => {
    const { container } = renderDossier([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows short timelines in full, with no disclosure", () => {
    const { container } = renderDossier([entry(1, 4)]);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByText("Beat 100")).toBeVisible();
  });

  it("folds all but the three most recent beats of a long timeline", () => {
    const { container } = renderDossier([entry(1, 8)]);
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText(/Show 5 earlier beats/)).toBeInTheDocument();
    // Earliest beat is inside the closed <details>; the latest three are not.
    expect(details).toContainElement(screen.getByText("Beat 100"));
    for (const n of [105, 106, 107]) {
      expect(details).not.toContainElement(screen.getByText(`Beat ${n}`));
    }
  });

  it("folds relationships beyond the busiest four", () => {
    const entries = Array.from({ length: 7 }, (_, i) => entry(i + 1, 1));
    renderDossier(entries);
    expect(screen.getByText(/Show 3 more relationships/)).toBeInTheDocument();
    const folded = screen.getByText("Person 7").closest("details");
    expect(folded).not.toBeNull();
    expect(screen.getByText("Person 1").closest("details")).toBeNull();
  });

  it("does not fold a single leftover relationship", () => {
    renderDossier(Array.from({ length: 5 }, (_, i) => entry(i + 1, 1)));
    expect(screen.queryByText(/more relationship/)).toBeNull();
  });
});
