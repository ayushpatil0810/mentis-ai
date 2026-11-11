import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickDefaultModelId } from "./model-preference.ts";
import { chatReasoningLevel } from "../ai/chat-reasoning.ts";

describe("pickDefaultModelId", () => {
  it("prefers a small model over the newest reasoning model", () => {
    assert.equal(
      pickDefaultModelId([
        "openai/gpt-5",
        "openai/o3",
        "openai/gpt-4o-mini",
        "openai/gpt-4o",
      ]),
      "openai/gpt-4o-mini",
    );
  });

  it("skips reasoning models when no small model is listed", () => {
    assert.equal(
      pickDefaultModelId(["openai/gpt-5", "openai/gpt-4o"]),
      "openai/gpt-4o",
    );
  });
});

describe("chatReasoningLevel", () => {
  it("caps models that think by default", () => {
    assert.equal(chatReasoningLevel("openai", "gpt-5"), "low");
    assert.equal(chatReasoningLevel("openai", "o3"), "low");
    assert.equal(chatReasoningLevel("gemini", "gemini-2.5-flash"), "none");
    assert.equal(chatReasoningLevel("gemini", "gemini-3-pro"), "none");
    assert.equal(chatReasoningLevel("gemini", "gemini-2.5-pro"), undefined);
  });

  it("leaves fast chat models alone", () => {
    assert.equal(chatReasoningLevel("openai", "gpt-4o-mini"), undefined);
    assert.equal(chatReasoningLevel("anthropic", "claude-haiku-4.5"), undefined);
  });
});
