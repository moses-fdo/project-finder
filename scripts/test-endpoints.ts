import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING INTEGRATION TESTS ===");

  try {
    // 1. Check if dev server is up
    console.log(`Checking if dev server is running at ${BASE_URL}...`);
    const homeRes = await fetch(`${BASE_URL}/login`);
    if (!homeRes.ok) {
      throw new Error(`Dev server is not reachable or returned error code: ${homeRes.status}`);
    }
    console.log("✓ Dev server is online.");

    // 2. Clean up old test user if exists
    const testEmail = "testuser@karunya.edu.in";
    console.log(`Cleaning up existing test user ${testEmail}...`);
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    console.log("✓ Cleaned up test user environment.");

    // 3. Test Signup API
    console.log("Testing Signup API (/api/auth/signup)...");
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: testEmail,
        password: "password123",
        department: "Computer Science",
        year: 3,
      }),
    });

    const signupData = await signupRes.json();
    if (!signupRes.ok) {
      throw new Error(`Signup failed: ${signupData.error || signupRes.statusText}`);
    }
    console.log("✓ Signup API responded successfully:", signupData.message);

    // 4. Retrieve OTP from DB
    console.log("Retrieving OTP code from database...");
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (!dbUser) {
      throw new Error("Failed to find signup user in database.");
    }
    if (!dbUser.otpCode) {
      throw new Error("Verification OTP code was not generated in the database.");
    }
    console.log(`✓ OTP retrieved successfully: ${dbUser.otpCode}`);

    // 5. Test Verify API
    console.log("Testing Verify API (/api/auth/verify)...");
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        code: dbUser.otpCode,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      throw new Error(`Verification failed: ${verifyData.error || verifyRes.statusText}`);
    }
    console.log("✓ Verify API responded successfully:", verifyData.message);

    // 6. Confirm user is verified in DB
    const verifiedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    if (!verifiedUser?.verified) {
      throw new Error("User status in DB was not updated to verified.");
    }
    console.log("✓ Verified user status in DB successfully.");

    // 7. Verify login/signup page availability
    console.log("Verifying pages availability...");
    const loginRes = await fetch(`${BASE_URL}/login`);
    console.log(`  /login -> status ${loginRes.status}`);
    if (loginRes.status !== 200) {
      throw new Error("/login page is not accessible.");
    }

    const signupPageRes = await fetch(`${BASE_URL}/signup`);
    console.log(`  /signup -> status ${signupPageRes.status}`);
    if (signupPageRes.status !== 200) {
      throw new Error("/signup page is not accessible.");
    }

    // Projects page should redirect to login if unauthorized
    const projectsRes = await fetch(`${BASE_URL}/projects`, { redirect: "manual" });
    console.log(`  /projects (unauthenticated) -> status ${projectsRes.status}`);
    if (projectsRes.status !== 307 && projectsRes.status !== 302 && projectsRes.status !== 200) {
      throw new Error(`/projects page returned unexpected status: ${projectsRes.status}`);
    }

    console.log("\n=================================");
    console.log("✓ ALL INTEGRATION TESTS PASSED!");
    console.log("=================================");
  } catch (error: any) {
    console.error("\n❌ TEST FAILURE:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
