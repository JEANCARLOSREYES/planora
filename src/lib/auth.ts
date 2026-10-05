import { after } from "next/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "@/lib/db";
import { sendAccountEmail } from "@/lib/server/account-email";
import { localAuthSecret } from "@/lib/server/local-auth-secret";
import { getAuthMode, isPasswordEndpoint } from "@/lib/auth-mode";

// Lazily initialize so build-time route discovery needs no deployment secrets.
function createAuth() {
  const googleOnly = getAuthMode() === "google";
  if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_URL) {
    throw new Error(
      "Set BETTER_AUTH_URL explicitly before starting production accounts.",
    );
  }
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000";
  const hosted = !["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(baseURL).hostname,
  );
  const secret = process.env.BETTER_AUTH_SECRET;
  if (hosted && process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
    throw new Error(
      "Serverless accounts require the hosted database; local SQLite is not durable on this host.",
    );
  }
  if (
    hosted &&
    (new URL(baseURL).protocol !== "https:" || !secret || secret.length < 32)
  ) {
    throw new Error(
      "Hosted accounts require HTTPS and a strong BETTER_AUTH_SECRET.",
    );
  }
  if (
    googleOnly &&
    (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
  )
    throw new Error(
      "Google accounts require GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  if (
    hosted &&
    !googleOnly &&
    (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)
  )
    throw new Error(
      "Hosted password accounts require configured verification email delivery.",
    );
  return betterAuth({
    appName: "Planora",
    baseURL,
    secret: secret || localAuthSecret(),
    database: prismaAdapter(db, { provider: "sqlite", transaction: true }),
    trustedOrigins: [baseURL],
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (googleOnly && context.path === "/link-social")
          throw new APIError("FORBIDDEN", {
            message: "Additional account connections are not enabled.",
          });
        if (
          googleOnly &&
          context.path === "/sign-in/social" &&
          (context.body?.scopes?.some(
            (scope: string) => !["email", "profile", "openid"].includes(scope),
          ) ||
            Object.keys(context.body?.additionalParams ?? {}).length > 0)
        )
          throw new APIError("BAD_REQUEST", {
            message: "Only basic Google identity permissions are allowed.",
          });
        if (googleOnly && isPasswordEndpoint(context.path)) {
          throw new APIError("FORBIDDEN", {
            message: "Use Google sign-in for this Planora site.",
          });
        }
        if (
          !googleOnly &&
          context.path === "/delete-user" &&
          !context.body?.password
        ) {
          throw new APIError("BAD_REQUEST", {
            message: "Confirm your password to delete your account.",
          });
        }
      }),
    },
    socialProviders: googleOnly
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
            accessType: "online",
            includeGrantedScopes: false,
          },
        }
      : {},
    account: {
      encryptOAuthTokens: true,
      accountLinking: { enabled: false },
    },
    databaseHooks: {
      account: {
        // Identity tokens are needed only during Google validation, not afterward.
        create: {
          before: async (account) => ({ data: { ...account, idToken: null } }),
        },
        update: {
          before: async (account) => ({ data: { ...account, idToken: null } }),
        },
      },
      user: {
        create: {
          before: async (user) => {
            const name = user.name.trim();
            if (!name || name.length > 80)
              throw new APIError("BAD_REQUEST", {
                message: "Enter a name of 1 to 80 characters.",
              });
            return { data: { ...user, name } };
          },
        },
      },
    },
    emailAndPassword: {
      enabled: !googleOnly,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
      requireEmailVerification: hosted,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendAccountEmail(user.email, "Reset your Planora password", url);
      },
    },
    emailVerification: {
      sendOnSignUp: hosted && !googleOnly,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAccountEmail(user.email, "Verify your Planora email", url);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 5,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/sign-in/social": { window: 60, max: 10 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
      },
    },
    advanced: {
      useSecureCookies: new URL(baseURL).protocol === "https:",
      disableOriginCheck: false,
      disableCSRFCheck: false,
      backgroundTasks: {
        handler: (task) =>
          after(
            task.catch(() => {
              // Operational signal only: no email address, URL, or token in logs.
              console.error("Planora account background task failed.");
            }),
          ),
      },
    },
    user: {
      deleteUser: { enabled: true },
      validateUserInfo: ({ user }) => {
        if (googleOnly && !user.emailVerified)
          return {
            error: "email_not_verified",
            errorDescription: "Use a verified Google account.",
          };
      },
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
