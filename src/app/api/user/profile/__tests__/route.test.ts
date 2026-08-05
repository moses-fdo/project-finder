import { resolveCurrentUserId } from "../route";
import { prisma } from "@/lib/prisma";

async function runTests() {
  console.log("Running profile route resolver regression tests...");

  // Mock user for database testing
  const testEmail = `test-resolver-${Date.now()}@example.com`;
  const dbUser = await prisma.user.create({
    data: {
      name: "Resolver Test User",
      email: testEmail,
      department: "Computer Science",
      year: 3,
    },
  });

  try {
    // 1. Valid positive integer session ID matching DB user
    const res1 = await resolveCurrentUserId({ id: dbUser.id, email: testEmail });
    console.assert(res1 === dbUser.id, `Test 1 Failed: Expected ${dbUser.id}, got ${res1}`);

    // 2. Invalid string session ID with valid email fallback
    const res2 = await resolveCurrentUserId({ id: "invalid-string-id", email: testEmail });
    console.assert(res2 === dbUser.id, `Test 2 Failed: Expected ${dbUser.id}, got ${res2}`);

    // 3. Fractional session ID with valid email fallback
    const res3 = await resolveCurrentUserId({ id: 12.34, email: testEmail });
    console.assert(res3 === dbUser.id, `Test 3 Failed: Expected ${dbUser.id}, got ${res3}`);

    // 4. Negative session ID with valid email fallback
    const res4 = await resolveCurrentUserId({ id: -42, email: testEmail });
    console.assert(res4 === dbUser.id, `Test 4 Failed: Expected ${dbUser.id}, got ${res4}`);

    // 5. Nonexistent positive integer ID with valid email fallback
    const res5 = await resolveCurrentUserId({ id: 99999999, email: testEmail });
    console.assert(res5 === dbUser.id, `Test 5 Failed: Expected ${dbUser.id}, got ${res5}`);

    // 6. Nonexistent session ID and nonexistent email
    const res6 = await resolveCurrentUserId({ id: "invalid", email: "nonexistent-email-xyz@example.com" });
    console.assert(res6 === null, `Test 6 Failed: Expected null, got ${res6}`);

    console.log("All profile route resolver regression tests passed successfully!");
  } finally {
    await prisma.user.delete({ where: { id: dbUser.id } }).catch(() => {});
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
