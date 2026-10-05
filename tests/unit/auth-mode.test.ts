import { afterEach, expect, it, vi } from "vitest";
import { getAuthMode, isPasswordEndpoint } from "@/lib/auth-mode";
afterEach(() => vi.unstubAllEnvs());
it("keeps local password accounts and explicitly selects Google mode", () => {
  vi.stubEnv("AUTH_MODE", "");
  expect(getAuthMode()).toBe("password");
  vi.stubEnv("AUTH_MODE", "google");
  expect(getAuthMode()).toBe("google");
});
it("fails closed for a misspelled authentication mode", () => {
  vi.stubEnv("AUTH_MODE", "googl");
  expect(() => getAuthMode()).toThrow("AUTH_MODE");
});
it("covers password lifecycle endpoints without blocking sessions", () => {
  for (const path of [
    "/sign-up/email",
    "/sign-in/email",
    "/request-password-reset",
    "/reset-password",
    "/change-password",
    "/set-password",
    "/send-verification-email",
    "/verify-email",
  ])
    expect(isPasswordEndpoint(path)).toBe(true);
  for (const path of [
    "/sign-in/social",
    "/get-session",
    "/sign-out",
    "/delete-user",
  ])
    expect(isPasswordEndpoint(path)).toBe(false);
});
