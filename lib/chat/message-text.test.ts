import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMessageText } from "./message-text.ts";

describe("getMessageText", () => {
  it("uses only text parts when parts are present", () => {
    assert.equal(
      getMessageText({
        parts: [
          { type: "reasoning", text: "thinking out loud" },
          { type: "text", text: "The answer" },
        ],
      }),
      "The answer",
    );
  });

  it("falls back to stored content", () => {
    assert.equal(getMessageText({ content: "Saved reply" }), "Saved reply");
  });
});
