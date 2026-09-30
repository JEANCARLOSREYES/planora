import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync, spawn } from "node:child_process";

const directory = resolve(".e2e");
mkdirSync(directory, { recursive: true });
const database = resolve(directory, "workspace.db");
for (const suffix of ["", "-wal", "-shm", "-journal"])
  rmSync(`${database}${suffix}`, { force: true });
const env = {
  ...process.env,
  DATABASE_URL: `file:${database}`,
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  { env, stdio: "inherit" },
);
process.on("SIGINT", () => server.kill("SIGINT"));
process.on("SIGTERM", () => server.kill("SIGTERM"));
server.on("exit", (code) => process.exit(code ?? 0));
