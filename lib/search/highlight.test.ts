import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseHighlight } from "./highlight.ts";

describe("parseHighlight", () => {
  it("keeps plain titles as text", () => {
    assert.deepEqual(parseHighlight("Budget planning"), [
      { text: "Budget planning", highlighted: false },
    ]);
  });

  it("marks only the highlighted span", () => {
    assert.deepEqual(parseHighlight('Plan a <mark class="bg-yellow-500/20">budget</mark> review'), [
      { text: "Plan a ", highlighted: false },
      { text: "budget", highlighted: true },
      { text: " review", highlighted: false },
    ]);
  });

  it("leaves markup in the source as text", () => {
    assert.deepEqual(parseHighlight('<img src=x onerror="alert(1)">'), [
      { text: '<img src=x onerror="alert(1)">', highlighted: false },
    ]);
  });
});
