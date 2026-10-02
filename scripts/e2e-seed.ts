import { getAuth } from "../src/lib/auth";
import { seedWorkspace } from "../src/lib/server/seed";
import { db } from "../src/lib/db";

// Disposable test database only; never run this against a real user's database.
if (!process.env.DATABASE_URL?.includes("/.e2e/")) {
  throw new Error("E2E seeding requires the disposable .e2e database.");
}
const result = await getAuth().api.signUpEmail({
  body: {
    name: "Test planner",
    email: "planner@example.com",
    password: "Planora-test-passphrase-2026",
  },
});
await seedWorkspace(false, result.user.id);
await db.$disconnect();
