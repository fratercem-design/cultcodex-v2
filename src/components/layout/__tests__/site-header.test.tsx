import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "../site-header";

describe("SiteHeader", () => {
  it("renders the archive name", () => {
    render(<SiteHeader />);
    expect(screen.getByText("CULTCODEX")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /episodes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /people/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lore/i })).toBeInTheDocument();
  });
});
