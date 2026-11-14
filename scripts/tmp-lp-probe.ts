import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"] });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", locale: "lv-LV" });
  const page = await ctx.newPage();
  await page.goto("https://www.liepajniekiem.lv/sludinajumi/transports/pardod-transports/automasinas/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("article.listing-item", { timeout: 40000 });
  const info = await page.evaluate(`(() => {
    const arts = [...document.querySelectorAll('article.listing-item')];
    return arts.slice(0, 5).map(a => {
      const foot = a.querySelector('footer')?.innerText?.replace(/\\s+/g,' ').trim() ?? '';
      const h2 = a.querySelector('h2')?.innerText?.trim() ?? '';
      const p = a.querySelector('.listing-body p')?.innerText?.replace(/\\s+/g,' ').trim().slice(0, 120) ?? '';
      const date = a.querySelector('span.date')?.innerText?.trim() ?? '';
      return { h2, date, foot, p };
    });
  })()`);
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(String(e).slice(0,300)); process.exit(1); });
