// tests/setup.js
import { test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Set up error logging
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`Console error: ${msg.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    console.log(`Page error: ${error.message}`);
  });
});
