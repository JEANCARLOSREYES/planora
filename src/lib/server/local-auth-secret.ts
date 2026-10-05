import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Local preview only. All server bundles and restarts must sign with the same
// private key. Hosted deployments must provide BETTER_AUTH_SECRET instead.
export function localAuthSecret(directory = process.cwd()) {
  const path = resolve(directory, ".planora-auth-secret");
  try {
    writeFileSync(path, randomBytes(32).toString("hex"), {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const secret = readFileSync(path, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(secret)) {
    throw new Error(
      "The local authentication key is invalid. Configure BETTER_AUTH_SECRET.",
    );
  }
  return secret;
}
