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

const delivery = vi.hoisted(() => ({
  messages: [] as { to: string; subject: string; url: string }[],
}));
vi.mock("@/lib/server/account-email", () => ({
  sendAccountEmail: async (to: string, subject: string, url: string) => {
    delivery.messages.push({ to, subject, url });
  },
}));
// Execute background delivery immediately in handler tests. Next's production
// request lifecycle keeps these tasks alive after the HTTP response.
vi.mock("next/server", () => ({
  after: (task: Promise<unknown>) => {
    void task;
  },
}));
const directory = mkdtempSync(join(tmpdir(), "planora-auth-test-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db")}`;
process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
process.env.AUTH_MODE = "password";
delete process.env.VERCEL;
process.env.BETTER_AUTH_URL = "https://planora.example";
process.env.BETTER_AUTH_SECRET =
  "test-only-secret-not-for-production-0123456789";
process.env.RESEND_API_KEY = "mock-email-no-network";
process.env.AUTH_EMAIL_FROM = "Planora <noreply@planora.example>";
const { db } = await import("@/lib/db");
const { getAuth } = await import("@/lib/auth");
const password = "A-unique-test-passphrase-2026";
const email = "alice@example.com";
function call(
  path: string,
  body?: Record<string, unknown>,
  cookie?: string,
  origin = "https://planora.example",
) {
  return getAuth().handler(
    new Request(`https://planora.example/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Origin: origin,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        "x-forwarded-for": "192.0.2.1",
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
beforeAll(async () => {
  const sqlite = new Database(join(directory, "test.db"));
  sqlite.pragma("foreign_keys = ON");
  for (const migration of readdirSync("prisma/migrations")
    .filter((name) => /^\d/.test(name))
    .sort()) {
    sqlite.exec(
      readFileSync(
        join("prisma/migrations", migration, "migration.sql"),
        "utf8",
      ),
    );
  }
  sqlite.close();
});
beforeEach(async () => {
  await db.rateLimit.deleteMany();
});
afterAll(async () => {
  await db.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});

describe.sequential("Real hosted authentication handler", () => {
  it("rejects weak passwords and invalid names on the server", async () => {
    expect(
      (
        await call("/sign-up/email", {
          name: "Alice",
          email,
          password: "short",
        })
      ).status,
    ).toBe(400);
    expect(
      (await call("/sign-up/email", { name: " ", email, password })).status,
    ).toBe(400);
    expect(await db.user.count()).toBe(0);
  });
  it("hashes passwords and blocks login until email verification", async () => {
    const registered = await call("/sign-up/email", {
      name: "Alice",
      email,
      password,
      callbackURL: "/login",
    });
    expect(registered.status).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const account = await db.account.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(account.password).toBeTruthy();
    expect(account.password).not.toBe(password);
    expect(user.emailVerified).toBe(false);
    expect((await call("/sign-in/email", { email, password })).status).toBe(
      403,
    );
    const verification = delivery.messages.find((message) =>
      message.subject.includes("Verify"),
    )!;
    const verified = await getAuth().handler(new Request(verification.url));
    expect(verified.status).toBe(302);
    expect(
      (await db.user.findUniqueOrThrow({ where: { email } })).emailVerified,
    ).toBe(true);
  });
  it("uses secure HTTP-only cookies, rejects wrong passwords, and revokes logout sessions", async () => {
    expect(
      (await call("/sign-in/email", { email, password: "wrong-passphrase" }))
        .status,
    ).toBe(401);
    const login = await call("/sign-in/email", { email, password });
    expect(login.status).toBe(200);
    const headers = login.headers.getSetCookie().join(";").toLowerCase();
    expect(headers).toContain("httponly");
    expect(headers).toContain("secure");
    expect(headers).toContain("samesite=lax");
    const cookie = cookieFrom(login);
    expect(
      (await (await call("/get-session", undefined, cookie)).json()).user.email,
    ).toBe(email);
    expect((await call("/sign-out", {}, cookie)).status).toBe(200);
    expect(
      await (await call("/get-session", undefined, cookie)).json(),
    ).toBeNull();
  });
  it("rejects untrusted origins and excessive login attempts", async () => {
    expect(
      (
        await call(
          "/sign-in/email",
          { email, password },
          undefined,
          "https://attacker.example",
        )
      ).status,
    ).toBe(403);
    await db.rateLimit.deleteMany();
    const statuses = [];
    for (let index = 0; index < 7; index++)
      statuses.push(
        (await call("/sign-in/email", { email, password: "wrong-passphrase" }))
          .status,
      );
    expect(statuses).toContain(429);
  });
  it("revokes other devices without revoking the current device", async () => {
    const current = cookieFrom(
      await call("/sign-in/email", { email, password }),
    );
    const other = cookieFrom(await call("/sign-in/email", { email, password }));
    expect((await call("/revoke-other-sessions", {}, current)).status).toBe(
      200,
    );
    expect(
      await (await call("/get-session", undefined, other)).json(),
    ).toBeNull();
    expect(
      (await (await call("/get-session", undefined, current)).json()).user
        .email,
    ).toBe(email);
  });
  it("rejects expired sessions", async () => {
    const cookie = cookieFrom(
      await call("/sign-in/email", { email, password }),
    );
    const session = await (
      await call("/get-session", undefined, cookie)
    ).json();
    await db.session.update({
      where: { id: session.session.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(
      await (await call("/get-session", undefined, cookie)).json(),
    ).toBeNull();
  });
  it("resets a password once and invalidates existing sessions", async () => {
    const cookie = cookieFrom(
      await call("/sign-in/email", { email, password }),
    );
    const requested = await call("/request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    expect(requested.status).toBe(200);
    const message = delivery.messages.findLast((message) =>
      message.subject.includes("Reset"),
    )!;
    const link = await getAuth().handler(new Request(message.url));
    const token = new URL(link.headers.get("location")!).searchParams.get(
      "token",
    )!;
    const nextPassword = "Another-unique-test-passphrase-2026";
    expect(
      (await call("/reset-password", { token, newPassword: nextPassword }))
        .status,
    ).toBe(200);
    expect(
      (await call("/reset-password", { token, newPassword: password })).status,
    ).toBe(400);
    expect(
      await (await call("/get-session", undefined, cookie)).json(),
    ).toBeNull();
    expect((await call("/sign-in/email", { email, password })).status).toBe(
      401,
    );
    expect(
      (await call("/sign-in/email", { email, password: nextPassword })).status,
    ).toBe(200);
  });
  it("requires the correct password to delete an account and cascades its workspace only", async () => {
    const cookie = cookieFrom(
      await call("/sign-in/email", {
        email,
        password: "Another-unique-test-passphrase-2026",
      }),
    );
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    await db.workspace.create({ data: { ownerId: user.id, name: "Private" } });
    const legacy = await db.workspace.create({
      data: { name: "Untouched legacy" },
    });
    expect((await call("/delete-user", {}, cookie)).status).toBe(400);
    expect(
      (await call("/delete-user", { password: "incorrect" }, cookie)).status,
    ).toBe(400);
    expect(
      (
        await call(
          "/delete-user",
          { password: "Another-unique-test-passphrase-2026" },
          cookie,
        )
      ).status,
    ).toBe(200);
    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(
      await db.workspace.findUnique({ where: { ownerId: user.id } }),
    ).toBeNull();
    expect(
      await db.workspace.findUnique({ where: { id: legacy.id } }),
    ).not.toBeNull();
  });
});
