import { describe, expect, it } from "vitest";
import { readablePostText } from "./postContent";

describe("readablePostText", () => {
  it("removes markdown hard-break backslashes", () => {
    const input = "Testing markdown\\\nThis was edited\\\n\\\n#valorant\\\n\\\nanother\\\nanother";
    expect(readablePostText(input)).toBe(
      "Testing markdown\nThis was edited\n\n#valorant\n\nanother\nanother",
    );
  });

  it("unwraps mention anchors to their label", () => {
    const input = 'Hey <a href="/profile/x" class="mention">@gamerpro</a>, check this';
    expect(readablePostText(input)).toBe("Hey @gamerpro, check this");
  });

  it("returns an empty string for empty content", () => {
    expect(readablePostText("")).toBe("");
    expect(readablePostText(null)).toBe("");
    expect(readablePostText(undefined)).toBe("");
  });
});
