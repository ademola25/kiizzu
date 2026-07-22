import pkg from '/Users/q/Desktop/demola/tenant-app/node_modules/playwright-core/index.js';
const { chromium, devices } = pkg;

const iphone = devices['iPhone 13'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...iphone });
const page = await ctx.newPage();

const shots = [
  ['/building', 'onb-building'],
  ['/pattern', 'onb-pattern'],
  ['/review', 'onb-review'],
  ['/celebrate', 'onb-celebrate'],
];

for (const [path, name] of shots) {
  await page.goto('http://localhost:8081' + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/ark-${name}.png` });
  console.log('shot', name);
}

await browser.close();
