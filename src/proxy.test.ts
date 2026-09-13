import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("canonical host proxy", () => {
  it.each([
    "https://www.cultcodex.me/episodes/example?from=test",
    "https://cultcodex.xyz/episodes/example?from=test",
    "https://www.cultcodex.xyz/episodes/example?from=test",
  ])("permanently redirects %s to the apex .me host", (source) => {
    const response = proxy(new NextRequest(source));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://cultcodex.me/episodes/example?from=test",
    );
  });

  it("passes the canonical host through", () => {
    const response = proxy(new NextRequest("https://cultcodex.me/episodes/example"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
