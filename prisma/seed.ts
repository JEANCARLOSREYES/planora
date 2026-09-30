import { seedWorkspace } from "../src/lib/server/seed";
import { db } from "../src/lib/db";

try {
  const workspace = await seedWorkspace();
  console.log(`Ready: ${workspace.name}. Existing data is preserved.`);
} catch (error) {
  console.error("Could not seed the workspace:", error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
