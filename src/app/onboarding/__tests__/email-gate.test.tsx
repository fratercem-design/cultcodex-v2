import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmailGate } from "../email-gate";

/**
 * The gate is now the required first step of onboarding. These pin the two
 * things that would silently undo that: that it actually captures before
 * sending anyone to sign in, and that it never claims the person is signed in
 * when they are not.
 */
function begin(name = "Test Traveler", email = "gate@example.test") {
  fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: /begin initiation/i }));
}

describe("EmailGate", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requires both a name and an email before anything is sent", () => {
    render(<EmailGate />);
    expect(screen.getByPlaceholderText("your@email.com")).toBeRequired();
    expect(screen.getByPlaceholderText("Your name")).toBeRequired();

    begin("   ", "gate@example.test");
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/both required to begin/i);
  });

  it("captures the lead with an onboarding-gate source", async () => {
    render(<EmailGate />);
    begin();

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, opts] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/initiate");
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      name: "Test Traveler",
      email: "gate@example.test",
      source: "gate:onboarding",
    });
  });

  it("sends them to sign in with the callback preserved, after capturing", async () => {
    render(<EmailGate callbackUrl="/onboarding" />);
    begin();

    await screen.findByText(/You are an Initiate/i);
    expect(screen.getByRole("link", { name: /sign in and finish/i })).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fonboarding"
    );
  });

  it("does not pretend the visitor is signed in", async () => {
    render(<EmailGate />);
    expect(screen.getByText(/you are not signed\s+in yet/i)).toBeInTheDocument();

    begin();
    await screen.findByText(/You are an Initiate/i);
    expect(screen.getByText(/needs you signed in/i)).toBeInTheDocument();
  });

  it("offers a way out that is not signing up", async () => {
    render(<EmailGate />);
    begin();
    await screen.findByText(/You are an Initiate/i);
    expect(screen.getByRole("link", { name: /just let me read/i })).toHaveAttribute(
      "href",
      "/start-here"
    );
  });

  it("keeps the form usable when capture fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({ error: "Too many requests." }) }))
    );
    render(<EmailGate />);
    begin();

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests.");
    expect(screen.getByRole("button", { name: /begin initiation/i })).toBeEnabled();
  });
});
