import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "../site-footer";

describe("SiteFooter", () => {
  it("renders archive identity", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/cult of psyche/i)).toBeInTheDocument();
  });
});
