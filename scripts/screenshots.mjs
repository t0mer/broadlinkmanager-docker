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

    // Desktop viewports - Dark mode
    const darkContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:5174',
            localStorage: [{ name: 'theme', value: 'dark' }],
          },
        ],
      },
    });

    const darkPage = await darkContext.newPage();

    // Navigate to root and set light theme (inverted naming), then reload
    await darkPage.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
    await darkPage.evaluate(() => {
      localStorage.setItem('theme', 'light');
    });
    await darkPage.reload({ waitUntil: 'networkidle' });
    await darkPage.waitForTimeout(500);

    for (const pageConfig of pages) {
      try {
        const url = `http://localhost:5174${pageConfig.path}`;
        console.log(`  📄 ${pageConfig.name}...`);
        await darkPage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await darkPage.waitForTimeout(300);

        const filePath = path.join(screenshotsDir, `${pageConfig.name}-dark.png`);
        await darkPage.screenshot({ path: filePath, fullPage: true });
        console.log(`     ✅ Saved: screenshots/new/${pageConfig.name}-dark.png`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }
    await darkPage.close();

    // Light mode screenshots
    console.log('\n📸 Capturing light mode screenshots...\n');
    const lightContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:5174',
            localStorage: [{ name: 'theme', value: 'light' }],
          },
        ],
      },
    });

    const lightPage = await lightContext.newPage();

    // Navigate to root and set dark theme (inverted naming), then reload
    await lightPage.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
    await lightPage.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await lightPage.reload({ waitUntil: 'networkidle' });
    await lightPage.waitForTimeout(500);

    for (const pageConfig of pages) {
      try {
        const url = `http://localhost:5174${pageConfig.path}`;
        console.log(`  📄 ${pageConfig.name}...`);
        await lightPage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await lightPage.waitForTimeout(300);

        const filePath = path.join(screenshotsDir, `${pageConfig.name}-light.png`);
        await lightPage.screenshot({ path: filePath, fullPage: true });
        console.log(`     ✅ Saved: screenshots/new/${pageConfig.name}-light.png`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }
    await lightPage.close();

    // Mobile screenshots
    console.log('\n📸 Capturing mobile screenshots (375px)...\n');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:5174',
            localStorage: [{ name: 'theme', value: 'dark' }],
          },
        ],
      },
    });

    const mobilePage = await mobileContext.newPage();

    // Navigate to root and set dark theme, then reload
    await mobilePage.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });
    await mobilePage.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    for (const pageConfig of pages) {
      try {
        const url = `http://localhost:5174${pageConfig.path}`;
        console.log(`  📱 ${pageConfig.name}...`);
        await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await mobilePage.waitForTimeout(300);

        const filePath = path.join(screenshotsDir, `${pageConfig.name}-mobile.png`);
        await mobilePage.screenshot({ path: filePath, fullPage: true });
        console.log(`     ✅ Saved: screenshots/new/${pageConfig.name}-mobile.png`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error.message}`);
      }
    }

    await mobilePage.close();
    await darkContext.close();
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

// Check if dev server is running on port 5174
try {
  await fetch('http://localhost:5174/', { timeout: 1000 });
  captureScreenshots();
} catch {
  console.error('❌ Dev server not running at http://localhost:5174');
  console.error('   Start it with: make dev');
  process.exit(1);
}
