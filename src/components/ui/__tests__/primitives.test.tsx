import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageShell } from "../page-shell";
import { SectionCard } from "../section-card";
import { TerminalPanel } from "../terminal-panel";

describe("PageShell", () => {
  it("renders title and children", () => {
    render(
      <PageShell title="Test Page" subtitle="A test page">
        <p>Content</p>
      </PageShell>
    );
    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

describe("SectionCard", () => {
  it("renders title and children", () => {
    render(
      <SectionCard title="Card Title">
        <p>Card content</p>
      </SectionCard>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });
});

describe("TerminalPanel", () => {
  it("renders with header and content", () => {
    render(
      <TerminalPanel header="SYS::LOG">
        <p>Terminal content</p>
      </TerminalPanel>
    );
    expect(screen.getByText("SYS::LOG")).toBeInTheDocument();
    expect(screen.getByText("Terminal content")).toBeInTheDocument();
  });
});
