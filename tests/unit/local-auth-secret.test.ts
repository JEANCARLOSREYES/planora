import { it, expect } from "vitest";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localAuthSecret } from "../../src/lib/server/local-auth-secret";

it("shares a persistent private key across independent callers", () => {
  const directory = mkdtempSync(join(tmpdir(), "planora-secret-"));
  try {
    const first = localAuthSecret(directory);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(localAuthSecret(directory)).toBe(first);
    expect(statSync(join(directory, ".planora-auth-secret")).mode & 0o777).toBe(
      0o600,
    );
    writeFileSync(join(directory, ".planora-auth-secret"), "invalid");
    expect(() => localAuthSecret(directory)).toThrow(
      "local authentication key is invalid",
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
