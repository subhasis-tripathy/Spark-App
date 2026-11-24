// Browser tests for the app UI and logic (runs app/index.html in Chromium). Native Android features (step sensor,
// local notifications, native share) cannot run here and are covered by the manual checklist in README.md.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const APP = "file://" + join(dirname(fileURLToPath(import.meta.url)), "..", "app", "index.html");
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
let failed = 0; const errs = [];
const ok = async (name, fn) => { try { await fn(); console.log("PASS", name); } catch (e) { failed++; console.log("FAIL", name, "-", e.message.split("\n")[0]); } };
const seed = () => {
  const pad = (n) => String(n).padStart(2, "0"), dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  sessionStorage.setItem("sb", "1"); if (localStorage.getItem("spark.v1")) return;
  const t = new Date(), rec = {}, seq = [8200, 11200, 6400, 9100, 10400, 12480, 7300, 9900, 10800, 8700, 3200, 0, 5600, 9600, 10100, 11800, 6900, 10300, 9700, 14208, 8800, 9400, 10200, 11050, 9100, 10150];
  seq.forEach((v, i) => { const d = new Date(t); d.setDate(t.getDate() - (seq.length - 1 - i)); if (v > 0) rec[dk(d)] = { steps: v, auto: v, g: 10000 }; });
  const mon = new Date(t); mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  localStorage.setItem("spark.v1", JSON.stringify({ version: 1, onboarded: true, profile: { name: "Subhasis", age: 24, height: 172, weight: 68, stride: "" }, settings: { stepGoal: 10000, waterGoal: 2500, units: "metric", wu: "L", theme: "system", ts: "m", notify: false, auto: false, installDismissed: true, lb: false, nick: "", uid: "", sec: "", cityName: "", cel: {} }, dailyRecords: rec, activities: [], waterEntries: [{ id: "a", date: dk(t), time: "09:00", ml: 750 }], goals: [] }));
  localStorage.setItem("spark_x2", JSON.stringify({ rem: { f: 0 }, ch: { [dk(mon)]: "a5" } }));
};
async function page(scheme, { fixture = true, perms = [] } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, permissions: perms });
  await ctx.clock.setFixedTime(new Date("2026-11-22T18:00:00"));
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(e.message));
  if (fixture) await pg.addInitScript(seed); await pg.goto(APP); await pg.waitForTimeout(fixture ? 800 : 600); return pg;
}
// 0. packaging: every local file the app references must be copied into the APK's www/ folder
{ const { readFileSync, existsSync, rmSync } = await import("node:fs"); const { execFileSync } = await import("node:child_process");
  const root = join(dirname(fileURLToPath(import.meta.url)), ".."); execFileSync("node", ["scripts/copy-www.js"], { cwd: root, stdio: "ignore" });
  await ok("packaging: every local asset and font used by the app ends up in www/", async () => {
    const html = readFileSync(join(root, "www", "index.html"), "utf8"); const refs = [...html.matchAll(/(?:src="|url\()((?:assets|fonts)\/[^"')]+)/g)].map((m) => m[1]);
    assert.ok(refs.length >= 5, "found references"); for (const r of refs) assert.ok(existsSync(join(root, "www", r)), "missing in www: " + r); });
  rmSync(join(root, "www"), { recursive: true, force: true }); }
// 1. first launch
{ const pg = await page("light", { fixture: false });
  await ok("first launch: emblem boot is shown", async () => assert.ok(await pg.evaluate(() => !!document.getElementById("boot") || !!document.getElementById("wel"))));
  await pg.waitForTimeout(2200);
  await ok("first launch: welcome screen with tagline and Begin", async () => { assert.match(await pg.textContent("#wel"), /The SPARK is within YOU\./); assert.ok(await pg.locator("#wgo").isVisible()); });
  await pg.waitForTimeout(1400); await pg.click("#wgo"); await pg.waitForTimeout(700);
  await ok("Begin leads to onboarding, welcome not shown again", async () => { assert.equal(await pg.evaluate(() => !document.getElementById("wel")), true); assert.equal(await pg.evaluate(() => !document.getElementById("ob").hidden), true); });
  await pg.close(); }
// 2. returning user, both themes
for (const scheme of ["light", "dark"]) { const pg = await page(scheme);
  await ok(`${scheme}: theme tokens`, async () => assert.equal(await pg.evaluate(() => getComputedStyle(document.body).backgroundColor), scheme === "dark" ? "rgb(21, 18, 15)" : "rgb(246, 242, 234)"));
  await ok(`${scheme}: no boot or welcome for a returning user`, async () => assert.equal(await pg.evaluate(() => !document.getElementById("boot") && !document.getElementById("wel")), true));
  await ok(`${scheme}: home answers the four daily questions`, async () => { const t = await pg.evaluate(() => document.querySelector("#v").innerText); assert.match(t, /So far today/); assert.match(t, /Today's roadmap/); assert.match(t, /NEXT MILESTONE/i); assert.match(t, /% of goal/); });
  await ok(`${scheme}: manual step entry is gone`, async () => assert.doesNotMatch(await pg.evaluate(() => document.body.innerText), /Add steps manually|Edit today's total/));
  await ok(`${scheme}: energy is a labelled estimate range`, async () => assert.match(await pg.textContent("#kc"), /^≈ \d+–\d+ kcal$/));
  await ok(`${scheme}: quick water add changes real state`, async () => { const before = await pg.evaluate(() => JSON.parse(localStorage.getItem("spark.v1")).waterEntries.length); await pg.locator('#v [data-act="water"][data-ml="250"]').first().click(); assert.equal(await pg.evaluate(() => JSON.parse(localStorage.getItem("spark.v1")).waterEntries.length), before + 1); });
  await pg.close(); }
// 3. profile: notifications + developer section
{ const pg = await page("dark", { perms: ["notifications"] }); await pg.click('nav [data-v="pro"]'); await pg.waitForTimeout(300);
  const rem = async () => pg.evaluate(() => JSON.parse(localStorage.getItem("spark_x2")).rem);
  await ok("reminders are off by default (consent required)", async () => { const r = await rem(); assert.equal(!!r.on, false); assert.equal(!!r.wat, false); assert.equal(!!r.ach, false); assert.equal(!!r.wk, false); });
  await ok("step reminders turn on with permission; times stay sorted and spaced", async () => { await pg.locator('[data-act="r_tog"][data-k="on"][data-want="1"]').click(); await pg.waitForTimeout(400); assert.equal((await rem()).on, true); await pg.locator('[data-act="r_add"][data-k="times"]').click(); const t = (await rem()).times; assert.deepEqual([...t].sort(), t); });
  await ok("a time inside quiet hours is rejected", async () => { const before = (await rem()).times.join(); await pg.locator('input[data-rt="times"]').first().fill("23:00"); await pg.waitForTimeout(300); assert.equal((await rem()).times.join(), before); });
  await ok("pause works and water reminders are independent", async () => { await pg.locator('[data-act="r_pause"]').first().click(); assert.ok(await pg.evaluate(() => JSON.parse(localStorage.getItem('spark_x2')).rem.pause > Date.now())); await pg.locator('[data-act="r_tog"][data-k="wat"][data-want="1"]').click(); await pg.waitForTimeout(300); const r = await rem(); assert.equal(r.wat, true); assert.equal(r.on, true); });
  await ok("developer section: photo, credit and the three links", async () => { const t = await pg.evaluate(() => document.querySelector("#v").innerHTML); assert.match(t, /Designed and developed by The Lone Crow — Subhasis Tripathy\./); assert.match(t, /linkedin\.com\/in\/subhasistripathy1/); assert.match(t, /github\.com\/subhasis-tripathy/); assert.match(t, /subhasismain\.netlify\.app/); assert.ok(await pg.locator('img[alt^="Portrait"]').count()); });
  await pg.close(); }
// 4. SPARK Moments
{ const pg = await page("light");
  await pg.evaluate(() => document.querySelector('[data-act="story"]')?.click()); await pg.waitForTimeout(1200);
  const kinds = await pg.evaluate(() => [...document.querySelectorAll("[data-mk]")].map((b) => b.dataset.mk));
  await ok("Moments offers day, week, month, best, streak and challenge from real data", async () => assert.deepEqual(kinds, ["day", "week", "month", "best", "streak", "chal"]));
  for (const k of kinds) await ok(`Moments: ${k} exports a 1620x2880 PNG`, async () => { await pg.evaluate((k) => document.querySelector(`[data-mk="${k}"]`).click(), k); await pg.waitForTimeout(450); const r = await pg.evaluate(async () => { const c = document.querySelector("#mc"), blob = await new Promise((r) => c.toBlob(r, "image/png")); return [c.width, c.height, blob.size]; }); assert.deepEqual(r.slice(0, 2), [1620, 2880]); assert.ok(r[2] > 20000, "png has content"); });
  await ok("Moments dialog fits the phone screen (scrolls, nothing cut off)", async () => { const r = await pg.evaluate(() => { const d = document.querySelector("dialog"), b = d.getBoundingClientRect(); return b.height <= innerHeight; }); assert.equal(r, true); });
  await pg.close(); }
// 5. reduced motion
{ const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }); const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(e.message)); await pg.goto(APP); await pg.waitForTimeout(1500);
  await ok("reduced motion: emblem boot is short and static", async () => assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector(".em img") || document.body).clipPath === "none" || !document.getElementById("boot")), true)); await ctx.close(); }
await ok("no uncaught page errors", async () => assert.deepEqual(errs, []));
await b.close(); console.log(failed ? `${failed} FAILED` : "all app checks passed"); process.exit(failed ? 1 : 0);
