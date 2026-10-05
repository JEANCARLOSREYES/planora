import { describe, it, expect } from "vitest";
import {
  defaultAppearance,
  parseAppearance,
} from "../../src/components/appearance";
describe("appearance preferences", () => {
  it("falls back safely for missing, corrupt, and invalid preferences", () => {
    for (const raw of [
      null,
      "broken",
      "null",
      "42",
      '{"palette":"evil","font":"unknown"}',
    ])
      expect(parseAppearance(raw)).toEqual(defaultAppearance);
  });
  it("restores supported preferences", () => {
    const value = {
      palette: "ocean",
      font: "serif",
      size: "large",
      motion: "reduced",
    };
    expect(parseAppearance(JSON.stringify(value))).toEqual(value);
  });
});
