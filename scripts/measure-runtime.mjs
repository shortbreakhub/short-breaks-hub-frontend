// Cold Chromium contexts, uncompressed local assets, external requests blocked.
// API details use production prerender fixtures; never generates affiliate clicks.
import { chromium } from "playwright";
import sharp from "sharp";
import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = process.cwd(),
  dist = resolve(root, "dist"),
  label = process.argv[2] || "after";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    let p = resolve(
      dist,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!p.startsWith(dist + "/") && p !== dist) throw Error("bad path");
    try {
      if ((await stat(p)).isDirectory()) p = resolve(p, "index.html");
    } catch {
      p = resolve(dist, "app-shell.html");
    }
    const body = await readFile(p);
    res.writeHead(200, {
      "Content-Type": types[extname(p)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const report = { label, pages: [], images: [] };
try {
  for (const [name, route, width, height, dpr] of [
    ["home-desktop", "/", 1440, 900, 1],
    ["home-mobile", "/", 390, 844, 2],
    ["europe", "/europe", 1440, 900, 1],
    ["china", "/browse/china", 1440, 900, 1],
    [
      "shanghai",
      "/itinerary/4-days-shanghai-where-the-future-never-waits",
      1440,
      900,
      1,
    ],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
    });
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (url.pathname.includes("/itineraries/region/")) {
        const region = url.pathname.split("/").at(-1);
        const html = await readFile(
          resolve(dist, region, "index.html"),
          "utf8",
        );
        const data = JSON.parse(
          html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1],
        );
        return route.fulfill({ json: data.countries });
      }
      if (url.pathname.includes("/itineraries/browse/")) {
        const country = url.pathname
          .split("/")
          .at(-1)
          .toLowerCase()
          .replaceAll(" ", "-");
        const html = await readFile(
          resolve(dist, "browse", country, "index.html"),
          "utf8",
        );
        return route.fulfill({
          json: JSON.parse(
            html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1],
          ).items,
        });
      }
      if (
        url.pathname.includes("/itineraries/") &&
        !url.pathname.includes("/slug/") &&
        !url.pathname.endsWith("/favorites/count") &&
        !url.pathname.endsWith("/comments")
      ) {
        const region = url.pathname.split("/").at(-1);
        try {
          const html = await readFile(
            resolve(dist, region, "index.html"),
            "utf8",
          );
          return route.fulfill({
            json: JSON.parse(
              html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1],
            ).itineraries,
          });
        } catch {}
      }
      if (url.pathname.includes("/itineraries/slug/")) {
        const slug = url.pathname.split("/").at(-1);
        try {
          const s = await readFile(
            resolve(dist, "itinerary", slug, "index.html"),
            "utf8",
          );
          const data = JSON.parse(
            s.match(/type="application\/json">([\s\S]*?)<\/script>/)[1],
          ).detail;
          return route.fulfill({ json: data });
        } catch {}
      }
      if (url.pathname.endsWith("/favorites/count"))
        return route.fulfill({ json: { count: 0 } });
      if (url.pathname.endsWith("/comments"))
        return route.fulfill({ json: { content: [] } });
      if (url.hostname === "v6.exchangerate-api.com")
        return route.fulfill({ json: { conversion_rates: { USD: 1 } } });
      return route.abort();
    });
    const page = await context.newPage();
    const requests = new Map(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      const url = new URL(r.url());
      if (url.origin === origin)
        requests.set(url.pathname, resolve(dist, "." + url.pathname));
    });
    await page.goto(origin + route, { waitUntil: "networkidle" });
    const summarize = async () => {
      const assets = [];
      for (const [url, p] of requests) {
        try {
          let file = p;
          if ((await stat(p)).isDirectory()) file = resolve(p, "index.html");
          assets.push({ url, bytes: (await stat(file)).size });
        } catch {}
      }
      return { total: assets.reduce((a, v) => a + v.bytes, 0), assets };
    };
    const initial = await summarize();
    if (errors.length) throw Error(`${name}: ${errors.join("; ")}`);
    if (
      name.startsWith("home") &&
      initial.assets.some((asset) =>
        /loading-animation|WeatherPage|GoogleMap|loadItineraryImage/.test(
          asset.url,
        ),
      )
    )
      throw Error("Homepage fetched a deferred feature");
    const images = await page
      .locator("img")
      .evaluateAll((imgs) =>
        imgs.map((img) => ({
          src: img.currentSrc,
          width: img.clientWidth,
          height: img.clientHeight,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          loading: img.loading,
        })),
      );
    if (name.startsWith("home"))
      await page.screenshot({ path: `/tmp/issue34-${label}-${name}.png` });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const scrolled = await summarize();
    report.pages.push({
      name,
      route,
      width,
      height,
      dpr,
      initial,
      scrolled,
      images,
      errors,
    });
    console.log(
      name,
      "initial",
      initial.total,
      "scrolled",
      scrolled.total,
      "JS",
      initial.assets
        .filter((a) => a.url.endsWith(".js"))
        .reduce((a, v) => a + v.bytes, 0),
      "errors",
      errors,
    );
    if (name === "home-desktop") {
      const documentRequests = () =>
        [...requests.keys()].filter((url) => !url.startsWith("/assets/"))
          .length;
      const beforeNavigation = documentRequests();
      await page.locator('a[href="/europe"]').first().click();
      await page.locator('a[href="/browse/france"]').first().waitFor();
      await page.locator('a[href="/browse/france"]').first().click();
      const itinerary = page.locator('a[href^="/itinerary/"]').first();
      await itinerary.waitFor();
      await itinerary.click();
      await page.locator("h1").waitFor();
      await page.waitForLoadState("networkidle");
      if (!page.url().includes("/itinerary/"))
        throw Error("SPA itinerary navigation failed");
      if (documentRequests() !== beforeNavigation)
        throw Error("SPA transitions unexpectedly fetched documents");
      if (errors.length) throw Error(errors.join("; "));
      report.spaNavigation = {
        route: new URL(page.url()).pathname,
        errors: [...errors],
        documentRequests: documentRequests(),
      };
      console.log(
        "SPA home → Europe → France → official itinerary passed",
        report.spaNavigation,
      );
    }
    await context.close();
  }
  report.secondaryRoutes = [];
  for (const [route, selector] of [
    ["/login", "input[type=password]"],
    ["/register", "input[type=password]"],
    ["/community-itineraries/region", "#explore h2"],
    ["/live-weather", "input"],
  ]) {
    const context = await browser.newContext();
    await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin + route, {waitUntil: "networkidle"});
    await page.locator(selector).first().waitFor();
    if (errors.length) throw Error(`${route}: ${errors.join("; ")}`);
    report.secondaryRoutes.push({route, errors});
    console.log("Lazy route smoke passed", route);
    await context.close();
  }
  for (const name of [
    "hero-bg.jpg",
    "logo-icon.png",
    "southeast.jpg",
    "eastasia.jpg",
    "europe.jpg",
    "americas.jpg",
    "anz.jpg",
    "northAfrica.jpg",
    "europe-banner.jpg",
    "france.jpg",
    "loading-animation.json",
  ]) {
    const p = resolve(root, "src/assets", name);
    const bytes = (await stat(p)).size;
    const meta = name.endsWith(".json") ? {} : await sharp(p).metadata();
    report.images.push({ name, bytes, width: meta.width, height: meta.height });
  }
  await writeFile(
    `/tmp/issue34-${label}-runtime.json`,
    JSON.stringify(report, null, 2),
  );
  console.log("source sizes", report.images);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
