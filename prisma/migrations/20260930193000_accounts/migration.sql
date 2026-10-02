-- Existing unowned workspaces are retained and never granted to registering users.
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false, "image" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
ALTER TABLE "Workspace" ADD COLUMN "ownerId" TEXT REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Workspace_ownerId_key" ON "Workspace"("ownerId");
CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY, "token" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  "ipAddress" TEXT, "userAgent" TEXT, "userId" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE TABLE "Account" (
  "id" TEXT NOT NULL PRIMARY KEY, "accountId" TEXT NOT NULL, "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT,
  "accessTokenExpiresAt" DATETIME, "refreshTokenExpiresAt" DATETIME, "scope" TEXT,
  "password" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE TABLE "Verification" (
  "id" TEXT NOT NULL PRIMARY KEY, "identifier" TEXT NOT NULL, "value" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE TABLE "RateLimit" (
  "id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL, "count" INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL
);
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
