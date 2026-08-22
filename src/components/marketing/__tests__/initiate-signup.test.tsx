import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InitiateSignup } from "../initiate-signup";

/**
 * The capture form is the surface where a visitor hands over an address and an
 * account gets made for them. These tests pin the two things that must not
 * regress quietly: that the account creation is disclosed *before* submit, and
 * that the post-submit state tells them the account now exists.
 */

function fillAndSubmit(name = "Test Traveler", email = "traveler@example.test") {
  fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: /send the gospel/i }));
}

describe("InitiateSignup", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true, downloadUrl: "/gospel-of-psyches-nightmares.pdf" }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("discloses that submitting creates an account, before the visitor submits", () => {
    render(<InitiateSignup />);
    expect(
      screen.getByText(/Submitting creates a Codex account keyed to your email/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/No password is set and you are not\s+signed in/i)).toBeInTheDocument();
  });

  it("posts name, email and source to /api/initiate", async () => {
    render(<InitiateSignup source="page:test" />);
    fillAndSubmit();

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, opts] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/initiate");
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      name: "Test Traveler",
      email: "traveler@example.test",
      source: "page:test",
    });
  });

  it("confirms the account exists after a successful submit", async () => {
    render(<InitiateSignup />);
    fillAndSubmit();

    await screen.findByText(/Three things just happened/i);
    expect(screen.getByText(/Your Codex account exists/i)).toBeInTheDocument();
    expect(screen.getByText("traveler@example.test")).toBeInTheDocument();
    // The gift link only appears when the API actually returned one.
    expect(screen.getByRole("link", { name: /download the gospel/i })).toHaveAttribute(
      "href",
      "/gospel-of-psyches-nightmares.pdf"
    );
    expect(screen.getByRole("link", { name: /claim the account/i })).toBeInTheDocument();
  });

  it("states the archive is not gated behind the account", async () => {
    render(<InitiateSignup />);
    fillAndSubmit();
    await screen.findByText(/Three things just happened/i);
    expect(screen.getByText(/you can read it signed out/i)).toBeInTheDocument();
  });

  it("surfaces the server's error and keeps the form usable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ error: "Too many requests." }) }))
    );
    render(<InitiateSignup />);
    fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests.");
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
  });

  // A truly empty field is stopped by the browser's own `required` validation
  // before any of our code runs. The JS guard exists for input that satisfies
  // `required` but is still nothing — whitespace — so that is what it is tested on.
  it("rejects a whitespace-only name without calling the API", () => {
    render(<InitiateSignup />);
    fillAndSubmit("   ", "traveler@example.test");

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /name and an email address are both required/i
    );
  });
});
