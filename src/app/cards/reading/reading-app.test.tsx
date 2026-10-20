import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReadingApp } from "./reading-app";

describe("ReadingApp spread", () => {
  it("lays out one tarot back per card in the chosen spread", () => {
    const { container } = render(<ReadingApp signedIn={false} />);
    const backs = () => [...container.querySelectorAll("img.rd-back")];
    expect(backs()).toHaveLength(1);
    expect(backs()[0].getAttribute("src")).toBe("/cards/backs/tarot.webp");

    fireEvent.click(screen.getByText("TRANSMISSION"));
    expect(backs()).toHaveLength(3);
  });
});
