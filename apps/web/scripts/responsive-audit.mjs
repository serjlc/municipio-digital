/*
 * Layout overflow audit: renders every route at several viewport widths
 * and fails if the page ever scrolls horizontally (scroll inside a chart
 * or table container is fine; the page itself must never move).
 *
 * Not part of CI to keep it dependency-free. To run it:
 *
 *   pnpm build && pnpm start        # or: PORT=3000 pnpm start
 *   npx -y playwright install chromium
 *   node apps/web/scripts/responsive-audit.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const ROUTES = ["/", "/demografia", "/turismo", "/contratos-menores", "/deuda", "/presupuestos", "/boja", "/clima", "/mapa", "/datos", "/transparencia", "/diseno"];
const WIDTHS = [320, 375, 414, 768, 1024, 1440];

const browser = await chromium.launch();
const page = await browser.newPage();
let failures = 0;

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) {
      failures++;
      console.log(`FAIL ${route} @${width}px -> la página desborda ${overflow}px`);
    }
  }
}

console.log(failures === 0 ? "AUDIT CLEAN" : `${failures} combinaciones con desbordamiento`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
