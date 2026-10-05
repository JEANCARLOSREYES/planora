import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

vi.mock("next/server", () => ({
  after: (task: Promise<unknown>) => {
    void task;
  },
}));
const directory = mkdtempSync(join(tmpdir(), "planora-google-test-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db")}`;
process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
delete process.env.VERCEL;
process.env.AUTH_MODE = "google";
process.env.BETTER_AUTH_URL = "https://planora.example";
process.env.BETTER_AUTH_SECRET =
  "test-only-google-secret-not-production-0123456789";
process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test-only-client-secret";
process.env.RESEND_API_KEY = "";
process.env.AUTH_EMAIL_FROM = "";
const { db } = await import("@/lib/db");
const { getAuth } = await import("@/lib/auth");
const keys = await generateKeyPair("RS256");
const jwk = {
  ...(await exportJWK(keys.publicKey)),
  kid: "test-key",
  alg: "RS256",
  use: "sig",
};

function call(path: string, body?: Record<string, unknown>, cookie?: string) {
  return getAuth().handler(
    new Request(`https://planora.example/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Origin: "https://planora.example",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}
function cookieFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
}
async function login(
  verified = true,
  audience = process.env.GOOGLE_CLIENT_ID!,
) {
  const token = await new SignJWT({
    email: "google-user@example.com",
    email_verified: verified,
    name: "Google Test",
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer("https://accounts.google.com")
    .setAudience(audience)
    .setSubject("test-google-user")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(keys.privateKey);
  return {
    token,
    response: await call("/sign-in/social", {
      provider: "google",
      idToken: { token, accessToken: "test-access-token" },
    }),
  };
}
beforeAll(() => {
  const sqlite = new Database(join(directory, "test.db"));
  sqlite.pragma("foreign_keys = ON");
  for (const migration of readdirSync("prisma/migrations")
    .filter((name) => /^\d/.test(name))
    .sort())
    sqlite.exec(
      readFileSync(
        join("prisma/migrations", migration, "migration.sql"),
        "utf8",
      ),
    );
  sqlite.close();
  // Real signature validation against a test key; never contact Google in CI.
  vi.stubGlobal("fetch", async (input: string | Request | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url !== "https://www.googleapis.com/oauth2/v3/certs")
      throw new Error("Unexpected network request in Google auth test");
    return Response.json({ keys: [jwk] });
  });
});
beforeEach(async () => {
  await db.rateLimit.deleteMany();
});
afterAll(async () => {
  vi.unstubAllGlobals();
  await db.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});

describe.sequential("Google-only authentication", () => {
  it("blocks password signup, login, reset and verification APIs", async () => {
    for (const path of [
      "/sign-up/email",
      "/sign-in/email",
      "/request-password-reset",
      "/reset-password",
      "/send-verification-email",
    ])
      expect(
        (
          await call(path, {
            name: "Test",
            email: "test@example.com",
            password: "test-passphrase-2026",
            newPassword: "test-passphrase-2026",
            token: "fake",
          })
        ).ok,
      ).toBe(false);
    expect(await db.user.count()).toBe(0);
  });
  it("uses only identity scopes, PKCE and the exact production callback", async () => {
    const response = await call("/sign-in/social", {
      provider: "google",
      callbackURL: "/workspace",
      newUserCallbackURL: "/workspace/onboarding",
    });
    expect(response.status).toBe(200);
    const url = new URL((await response.json()).url);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://planora.example/api/auth/callback/google",
    );
    expect(new Set(url.searchParams.get("scope")!.split(" "))).toEqual(
      new Set(["email", "profile", "openid"]),
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("access_type")).toBe("online");
    expect(url.searchParams.has("include_granted_scopes")).toBe(false);
    expect(
      (
        await call("/sign-in/social", {
          provider: "google",
          scopes: ["https://www.googleapis.com/auth/drive"],
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("/sign-in/social", {
          provider: "google",
          additionalParams: { include_granted_scopes: "true" },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("/sign-in/social", {
          provider: "google",
          callbackURL: "https://attacker.example",
        })
      ).status,
    ).toBe(403);
  });
  it("rejects incorrectly issued and unverified Google identities", async () => {
    expect((await login(true, "wrong-client")).response.ok).toBe(false);
    expect((await login(false)).response.ok).toBe(false);
    expect(await db.user.count()).toBe(0);
  });
  it("creates a verified account, encrypts tokens, and enforces fresh-session deletion", async () => {
    const { token, response } = await login();
    expect(response.status).toBe(200);
    const cookie = cookieFrom(response);
    const user = await db.user.findUniqueOrThrow({
      where: { email: "google-user@example.com" },
    });
    expect(user.emailVerified).toBe(true);
    const account = await db.account.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(account.password).toBeNull();
    expect(account.idToken).toBeNull();
    expect(account.idToken).not.toBe(token);
    expect(account.accessToken).not.toBe("test-access-token");
    const session = await db.session.findFirstOrThrow({
      where: { userId: user.id },
    });
    await db.session.update({
      where: { id: session.id },
      data: { createdAt: new Date(Date.now() - 6 * 60 * 1000) },
    });
    expect((await call("/delete-user", {}, cookie)).status).toBe(400);
    expect(await db.user.count()).toBe(1);
    await db.session.update({
      where: { id: session.id },
      data: { createdAt: new Date() },
    });
    await db.workspace.create({ data: { ownerId: user.id, name: "Private" } });
    expect((await call("/delete-user", {}, cookie)).status).toBe(200);
    expect(await db.workspace.count()).toBe(0);
    expect(await db.user.count()).toBe(0);
  });
});
