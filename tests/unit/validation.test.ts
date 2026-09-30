import { describe, expect, it } from "vitest";
import {
  contentSchema,
  extractText,
  pageCreateSchema,
  pageUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  dateSchema,
  safeLink,
} from "@/lib/validation";
import { templates, templateContent } from "@/lib/templates";

describe("page validation", () => {
  it("trims names and rejects empty or oversized titles", () => {
    expect(pageCreateSchema.parse({ title: "  My plan  " }).title).toBe(
      "My plan",
    );
    for (const title of ["", "   ", "x".repeat(161)])
      expect(pageCreateSchema.safeParse({ title }).success).toBe(false);
  });
  it("rejects unknown properties and unsupported covers", () => {
    expect(
      pageCreateSchema.safeParse({ title: "Test", workspaceId: "another" })
        .success,
    ).toBe(false);
    expect(
      pageUpdateSchema.safeParse({ cover: "https://example.com/untrusted.jpg" })
        .success,
    ).toBe(false);
  });
  it.each(templates)(
    "produces valid editable content for $name",
    (template) => {
      const document = templateContent(template.id);
      expect(contentSchema.safeParse(document).success).toBe(true);
      for (const section of template.sections)
        expect(extractText(document)).toContain(section);
    },
  );
});
describe("task validation", () => {
  it("provides useful defaults", () => {
    expect(taskCreateSchema.parse({ title: "Next step" })).toMatchObject({
      title: "Next step",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      dueDate: null,
      tags: [],
    });
  });
  it("normalizes tags and rejects invalid status changes", () => {
    expect(
      taskCreateSchema.parse({
        title: "Read",
        tags: [" Work ", "work", "UNIVERSITY"],
      }).tags,
    ).toEqual(["work", "university"]);
    expect(taskUpdateSchema.safeParse({ status: "ARCHIVED" }).success).toBe(
      false,
    );
    expect(taskUpdateSchema.safeParse({ status: "COMPLETED" }).success).toBe(
      true,
    );
    expect(taskUpdateSchema.parse({ status: "IN_PROGRESS" })).toEqual({
      status: "IN_PROGRESS",
    });
  });
  it("rejects impossible calendar dates while accepting leap days", () => {
    expect(dateSchema.safeParse("2025-02-29").success).toBe(false);
    expect(dateSchema.safeParse("2024-02-29").success).toBe(true);
    expect(dateSchema.safeParse("2026-04-31").success).toBe(false);
  });
});
describe("editor content safety", () => {
  it("rejects script links and unknown nodes", () => {
    expect(safeLink("javascript:alert(1)")).toBe(false);
    expect(safeLink("data:text/html,test")).toBe(false);
    expect(safeLink("https://example.com")).toBe(true);
    expect(
      contentSchema.safeParse({ type: "doc", content: [{ type: "iframe" }] })
        .success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        type: "doc",
        content: [
          {
            type: "text",
            text: "bad",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("limits size and nesting", () => {
    expect(
      contentSchema.safeParse({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "x".repeat(500_001) }],
          },
        ],
      }).success,
    ).toBe(false);
    let document: unknown = { type: "paragraph" };
    for (let i = 0; i < 35; i++)
      document = { type: "blockquote", content: [document] };
    expect(
      contentSchema.safeParse({ type: "doc", content: [document] }).success,
    ).toBe(false);
  });
});
