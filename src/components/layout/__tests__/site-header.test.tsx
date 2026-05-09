import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("next/image", () => ({ default: (props: Record<string, unknown>) => <img {...props} /> }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: Record<string, unknown>) => <a href={href as string} {...rest}>{children as React.ReactNode}</a> }));

import { SiteHeader } from "../site-header";

describe("SiteHeader", () => {
  it("renders the archive name", async () => {
    render(await SiteHeader());
    expect(screen.getByText("CULTCODEX")).toBeInTheDocument();
  });

  it("renders primary navigation links", async () => {
    render(await SiteHeader());
    expect(screen.getByRole("link", { name: /archive/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /signals/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /collections/i })).toBeInTheDocument();
  });
});
