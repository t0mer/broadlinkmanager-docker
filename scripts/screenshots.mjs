#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'screenshots', 'new');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const pages = [
  { path: '/', name: 'devices' },
  { path: '/saved', name: 'saved-codes' },
  { path: '/generator', name: 'rf-generator' },
  { path: '/livolo', name: 'livolo' },
  { path: '/energenie', name: 'energenie' },
  { path: '/repeats', name: 'repeats' },
  { path: '/convert', name: 'convert' },
  { path: '/about', name: 'about' },
];

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('📸 Capturing desktop screenshots (1280px)...\n');

    // Desktop viewports
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      colorScheme: 'dark',
    });
    const desktopPage = await desktopContext.newPage();

    for (const pageConfig of pages) {
      try {
        const url = `http://localhost:5174${pageConfig.path}`;
        console.log(`  📄 ${pageConfig.name}...`);
        await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await desktopPage.waitForTimeout(500);

        const filePath = path.join(screenshotsDir, `${pageConfig.name}-dark.png`);
        await desktopPage.screenshot({ path: filePath, fullPage: true });
        console.log(`     ✅ Saved: screenshots/new/${pageConfig.name}-dark.png`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }

    // Light mode screenshots
    console.log('\n📸 Capturing light mode screenshots...\n');
    const lightContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      colorScheme: 'light',
    });
    const lightPage = await lightContext.newPage();

    for (const pageConfig of pages) {
      try {
        const url = `http://localhost:5174${pageConfig.path}`;
        console.log(`  📄 ${pageConfig.name}...`);
        await lightPage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await lightPage.waitForTimeout(500);

        const filePath = path.join(screenshotsDir, `${pageConfig.name}-light.png`);
        await lightPage.screenshot({ path: filePath, fullPage: true });
        console.log(`     ✅ Saved: screenshots/new/${pageConfig.name}-light.png`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }

    // Mobile screenshots
    console.log('\n📸 Capturing mobile screenshots (375px)...\n');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      colorScheme: 'dark',
    });
    const mobilePage = await mobileContext.newPage();

    for (const pageConfig of pages) {
      try {
        const url = `http://localhost:5174${pageConfig.path}`;
        console.log(`  📱 ${pageConfig.name}...`);
        await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await mobilePage.waitForTimeout(500);

        const filePath = path.join(screenshotsDir, `${pageConfig.name}-mobile.png`);
        await mobilePage.screenshot({ path: filePath, fullPage: true });
        console.log(`     ✅ Saved: screenshots/new/${pageConfig.name}-mobile.png`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }

    await desktopContext.close();
    await lightContext.close();
    await mobileContext.close();

    console.log('\n✅ All screenshots captured successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Check if dev server is running
try {
  await fetch('http://localhost:5174/', { timeout: 1000 });
  captureScreenshots();
} catch {
  console.error('❌ Dev server not running at http://localhost:5174');
  console.error('   Start it with: make dev');
  process.exit(1);
}
