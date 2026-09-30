import { describe, expect, it } from "vitest";
import {
  completionFields,
  descendantIds,
  validateParent,
  MAX_PAGE_DEPTH,
} from "@/lib/hierarchy";

const tree = [
  { id: "a", parentId: null },
  { id: "b", parentId: "a" },
  { id: "c", parentId: "b" },
  { id: "d", parentId: null },
];
describe("page hierarchy", () => {
  it("finds the complete deletion subtree without including unrelated pages", () => {
    expect(descendantIds(tree, "a")).toEqual(["b", "c"]);
  });
  it("rejects moving a page into itself or a descendant", () => {
    expect(() => validateParent(tree, "a", "a")).toThrow("itself");
    expect(() => validateParent(tree, "a", "c")).toThrow("children");
  });
  it("accepts moving to a sibling or the workspace root", () => {
    expect(() => validateParent(tree, "b", "d")).not.toThrow();
    expect(() => validateParent(tree, "b", null)).not.toThrow();
  });
  it("rejects stale destinations and over-deep subtrees", () => {
    expect(() => validateParent(tree, "b", "missing")).toThrow(
      "no longer exists",
    );
    const deep = Array.from({ length: MAX_PAGE_DEPTH }, (_, i) => ({
      id: String(i),
      parentId: i ? String(i - 1) : null,
    }));
    expect(() =>
      validateParent(deep, null, String(MAX_PAGE_DEPTH - 1)),
    ).toThrow("levels");
    expect(() =>
      validateParent(
        [...deep, { id: "x", parentId: null }, { id: "y", parentId: "x" }],
        "x",
        String(MAX_PAGE_DEPTH - 2),
      ),
    ).toThrow("levels");
  });
});
describe("task completion state", () => {
  it("sets completion time, preserves it on repeat completion, clears it on reopen", () => {
    const completed = completionFields("COMPLETED");
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(
      completionFields("COMPLETED", completed.completedAt).completedAt,
    ).toBe(completed.completedAt);
    expect(
      completionFields("IN_PROGRESS", completed.completedAt).completedAt,
    ).toBeNull();
  });
});
