import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fallbackTitleFromMessage,
  sanitizeTitle,
  usableChatTitle,
} from "./title.ts";

describe("sanitizeTitle", () => {
  it("keeps apostrophes and strips wrapping quotes", () => {
    assert.equal(sanitizeTitle(`  "User's API design"  `), "User's API design");
  });

  it("uses the first line and drops a Title prefix", () => {
    assert.equal(
      sanitizeTitle("Title: Budget planning\n\nThis chat is about budgets."),
      "Budget planning",
    );
  });

  it("strips a markdown heading", () => {
    assert.equal(sanitizeTitle("# Release checklist"), "Release checklist");
  });

  it("caps long titles on a word boundary", () => {
    const title = sanitizeTitle(
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen",
    );
    assert.ok(title.length <= 80);
    assert.equal(title.endsWith(" "), false);
    assert.match(title, /^one two/);
  });
});

describe("usableChatTitle", () => {
  it("rejects the default title and punctuation-only text", () => {
    assert.equal(usableChatTitle("New Chat"), "");
    assert.equal(usableChatTitle("..."), "");
  });
});

describe("fallbackTitleFromMessage", () => {
  it("uses the first six words of the user message", () => {
    assert.equal(
      fallbackTitleFromMessage("Help me   draft a migration plan for the billing service today please extra"),
      "Help me draft a migration plan",
    );
  });

  it("returns nothing when the message is empty or only the default title", () => {
    assert.equal(fallbackTitleFromMessage("   "), "");
    assert.equal(fallbackTitleFromMessage("New Chat"), "");
  });
});
