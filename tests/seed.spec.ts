import { test, expect } from "@playwright/test";

// Fixed test user credentials
const TEST_EMAIL = "test@demo.com";
const TEST_PASSWORD = "TestPassword123!";

test.describe("Environment seed", () => {
  test("authenticate", async ({ page }) => {
    // First try to login to see if user exists
    await page.goto("http://localhost:3000/login");

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for authentication response
    await page.waitForLoadState("load", { timeout: 10000 });
    await page.waitForTimeout(3000); // Extra wait for authentication

    let currentUrl = page.url();
    console.log(`After login attempt, current URL: ${currentUrl}`);

    if (currentUrl.includes("/login")) {
      console.log(
        `🔄 User ${TEST_EMAIL} doesn't exist. Attempting to create account...`,
      );

      // Try to create the user via signup
      try {
        await page.goto("http://localhost:3000/signup", { timeout: 15000 });
        await page.waitForLoadState("load", { timeout: 10000 });

        // Check if we got redirected (means user might already exist)
        if (page.url().includes("/workflows")) {
          console.log("Redirected to workflows - user might already exist");
          return;
        }

        // Fill signup form if we're on signup page
        if (page.url().includes("/signup")) {
          await page.fill('input[name="email"]', TEST_EMAIL);
          await page.fill('input[name="password"]', TEST_PASSWORD);
          await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
          await page.click('button[type="submit"]');

          // Wait for signup completion
          await page.waitForLoadState("load", { timeout: 15000 });
          await page.waitForTimeout(3000);

          currentUrl = page.url();
          console.log(`After signup attempt, current URL: ${currentUrl}`);
        }
      } catch (signupError) {
        console.log(`⚠️ Signup flow had issues: ${signupError.message}`);
        // Continue anyway to final check
      }
    }

    // Final check - should be authenticated now
    currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      throw new Error(
        `❌ Authentication failed for ${TEST_EMAIL}. Please create user manually or check credentials.`,
      );
    }

    // Success!
    console.log(
      `✅ Authentication successful for ${TEST_EMAIL}, final URL: ${currentUrl}`,
    );
    await expect(page.locator("text=Workflows")).toBeVisible({ timeout: 5000 });
  });
});
