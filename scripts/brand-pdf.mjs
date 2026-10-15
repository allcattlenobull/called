// Renders the internal /brand page to docs/Called-Brand-Guide.pdf.
// Usage: VITE_SHOW_BRAND=1 BASE_PATH=/ npx vite build --outDir .brand-build && node scripts/brand-pdf.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const out = process.argv[2] || 'Called-Brand-Guide.pdf';
const server = spawn('npx', ['vite', 'preview', '--outDir', '.brand-build', '--port', '4180', '--strictPort', '--base', '/'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
await page.emulateMedia({ media: 'print', colorScheme: 'light', reducedMotion: 'reduce' });
await page.goto('http://localhost:4180/brand', { waitUntil: 'networkidle' });
const keep = page.getByRole('button', { name: 'Keep going' });
if (await keep.isVisible().catch(() => false)) await keep.click();
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true });
await browser.close();
server.kill();
console.log(`Wrote ${out}`);
