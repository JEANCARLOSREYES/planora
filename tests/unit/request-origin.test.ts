import { describe, expect, it } from "vitest";
import { isSameOrigin } from "@/lib/request-origin";
describe("editor endpoint origin checks", () => {
  it("accepts the current hostname and port", () => {
    expect(isSameOrigin("http://127.0.0.1:3100", "127.0.0.1:3100")).toBe(true);
    expect(isSameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
  });
  it("rejects foreign, missing, malformed, and differently ported origins", () => {
    for (const origin of [
      null,
      "null",
      "https://example.com",
      "http://localhost:3001",
      "file://localhost:3000",
    ])
      expect(isSameOrigin(origin, "localhost:3000")).toBe(false);
  });
});
