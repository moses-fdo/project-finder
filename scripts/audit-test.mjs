import { chromium } from "playwright";

async function runAudit() {
  console.log("🚀 Starting Playwright Browser Automated Feature Audit...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const pageErrors = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  try {
    // 1. Landing Page
    console.log("📍 [1/4] Visiting http://localhost:3000 ...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    const title = await page.title();
    console.log(`   ✓ Page title: "${title}"`);

    // 2. Projects Page
    console.log("📍 [2/4] Visiting http://localhost:3000/projects ...");
    await page.goto("http://localhost:3000/projects", { waitUntil: "networkidle" });
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("tech");
      console.log("   ✓ Searched for 'tech' in Projects search bar.");
    }

    // 3. Login Page
    console.log("📍 [3/4] Visiting http://localhost:3000/login ...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill("test@karunya.edu.in");
      console.log("   ✓ Filled login email input.");
    }

    // 4. Signup Page
    console.log("📍 [4/4] Visiting http://localhost:3000/signup ...");
    await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    if (await nameInput.count() > 0) {
      console.log("   ✓ Signup form fields rendered.");
    }

    console.log("\n📊 Audit Summary:");
    console.log(`   - Console Errors Captured: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, idx) => console.log(`     ${idx + 1}. ${err}`));
    }
    console.log(`   - Page Uncaught Errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      pageErrors.forEach((err, idx) => console.log(`     ${idx + 1}. ${err}`));
    }
    console.log("\n✨ Playwright Feature Audit completed successfully!");
  } catch (error) {
    console.error("❌ Audit Error:", error);
  } finally {
    await browser.close();
  }
}

runAudit();
