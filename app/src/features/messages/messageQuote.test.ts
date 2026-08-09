import { describe, expect, it } from "vitest";
import { createQuotedReply, messageExcerpt } from "./messageQuote";

describe("durable message reply context", () => {
  it("removes an existing quote before making a compact excerpt", () => {
    expect(messageExcerpt("> old reply\n\n**Actual** message")).toBe("Actual message");
  });

  it("persists sender context through the existing Markdown content field", () => {
    expect(createQuotedReply({ id: "m1", senderId: "u1", senderName: "Nova", content: "Meet in the lobby" }, "On my way")).toBe("> **Nova:** Meet in the lobby\n\nOn my way");
  });
});
