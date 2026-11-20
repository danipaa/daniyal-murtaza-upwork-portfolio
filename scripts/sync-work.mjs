#!/usr/bin/env node
/* ------------------------------------------------------------------
   PORTFOLIO - work sync
   Scans ../work (one folder = one category), and for every new file:
     - picks a bright, representative thumbnail (never a black frame)
     - makes a small silent hover-preview loop
     - makes a compressed full version for the player
   then updates src/data/work.json. Already-processed files are skipped,
   and titles/clients edited in work.json are preserved.
   Run:  node scripts/sync-work.mjs
------------------------------------------------------------------- */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Reads the same work folders as the Daxator Studios site, so one folder feeds both.
// Override with: WORK_DIR="D:/some/other/work" npm run sync
const WORK = process.env.WORK_DIR
  ? path.resolve(process.env.WORK_DIR)
  : path.resolve(ROOT, "..", "..", "Daxator Studio Website", "work");
const OUT = path.join(ROOT, "public", "media");
const DATA = path.join(ROOT, "src", "data", "work.json");
const BUDGET = Number(process.env.BUDGET_SEC || 0);
const started = Date.now();

const VIDEO = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);
const IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const PREVIEW_LEN = 6;
const QUALITY = 2; // bump to re-encode everything at new settings

const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const stripOrder = (s) => s.replace(/^\d+[\s._-]+/, "");

function cleanTitle(file) {
  let t = path.basename(file, path.extname(file));
  t = t.replace(/[_]+/g, " ").replace(/\([^)]*\)/g, " ").replace(/-/g, " ");
  t = t.replace(/\b(mp4|mov|final|finale|sfx|with\s*sfx|withsfxfinal|no music|full hd|hd|4k|full|trim|render|v\d+|ver\d+|\d{4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2})\b/gi, " ");
  t = t.replace(/\s+\d+\s*$/g, " ").replace(/\s+/g, " ").trim();
  return t.replace(/\b[a-z]/g, (c) => c.toUpperCase()) || path.basename(file, path.extname(file));
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || "").slice(-400)}`);
  return r.stdout;
}

function probe(file) {
  const j = JSON.parse(run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries",
    "stream=width,height:stream_tags=rotate:format=duration", "-of", "json", file]));
  const s = j.streams[0];
  let w = s.width, h = s.height;
  const rot = Math.abs(Number(s.tags?.rotate || 0));
  if (rot === 90 || rot === 270) [w, h] = [h, w];
  return { w, h, duration: Number(j.format?.duration || 0) };
}

const fit = (long) => `scale='if(gt(iw,ih),min(${long},iw),-2)':'if(gt(iw,ih),-2,min(${long},ih))'`;

function bestStart(file, duration) {
  const max = Math.max(0, duration - PREVIEW_LEN - 0.5);
  const cands = [0.15, 0.3, 0.45, 0.6].map((f) => Math.min(duration * f, max));
  let best = cands[0], bestSize = -1;
  for (const t of cands) {
    const tmp = path.join(os.tmpdir(), `dx-cand-${process.pid}.jpg`);
    try {
      run("ffmpeg", ["-y", "-v", "error", "-ss", t.toFixed(2), "-i", file, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "5", tmp]);
      const size = fs.statSync(tmp).size;
      if (size > bestSize) { bestSize = size; best = t; }
    } catch { /* skip */ }
  }
  return Number(best.toFixed(2));
}

function load() {
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); } catch { return { categories: [], items: [] }; }
}
function save(db) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
}

const db = load();
const bySource = new Map(db.items.map((i) => [i.source, i]));
const cats = fs.readdirSync(WORK, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
db.categories = cats.map((name) => ({ slug: slug(stripOrder(name)), name: stripOrder(name) }));

const seen = new Set();
let added = 0, stoppedEarly = false;

outer:
for (const catDir of cats) {
  const cat = slug(stripOrder(catDir));
  const files = fs.readdirSync(path.join(WORK, catDir)).sort();
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const isVideo = VIDEO.has(ext), isImage = IMAGE.has(ext);
    if (!isVideo && !isImage) continue;
    const source = `${catDir}/${f}`;
    seen.add(source);
    const id = `${cat}-${slug(path.basename(f, ext))}`;
    const dir = path.join(OUT, cat);
    const rel = (n) => `/media/${cat}/${n}`;
    const prev = bySource.get(source);
    const want = isVideo ? ["poster", "preview", "full"] : ["poster", "full"];
    if (prev && prev.q === QUALITY && want.every((k) => prev[k] && fs.existsSync(path.join(ROOT, "public", prev[k])))) continue;

    if (BUDGET && (Date.now() - started) / 1000 > BUDGET) { stoppedEarly = true; break outer; }
    fs.mkdirSync(dir, { recursive: true });
    const src = path.join(WORK, catDir, f);
    console.log(`processing  ${source}`);
    try {
      const { w, h, duration } = probe(src);
      const item = {
        id, source, title: prev?.title || cleanTitle(f), client: prev?.client || "",
        category: cat, type: isVideo ? "video" : "image", w, h, q: QUALITY,
        orientation: h > w * 1.1 ? "portrait" : w > h * 1.1 ? "landscape" : "square",
      };
      if (isVideo) {
        const start = bestStart(src, duration);
        const len = Math.min(PREVIEW_LEN, duration);
        run("ffmpeg", ["-y", "-v", "error", "-ss", String(start), "-i", src, "-frames:v", "1", "-vf", fit(1600), "-q:v", "3", path.join(dir, `${id}.jpg`)]);
        run("ffmpeg", ["-y", "-v", "error", "-ss", String(start), "-t", String(len), "-i", src, "-an", "-vf", `${fit(960)},fps=24`,
          "-c:v", "libx264", "-preset", "fast", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dir, `${id}-preview.mp4`)]);
        run("ffmpeg", ["-y", "-v", "error", "-i", src, "-vf", fit(1920), "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
          "-maxrate", duration > 120 ? "2800k" : "5000k", "-bufsize", duration > 120 ? "5600k" : "10000k", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", path.join(dir, `${id}.mp4`)]);
        Object.assign(item, { duration: Math.round(duration), start, poster: rel(`${id}.jpg`), preview: rel(`${id}-preview.mp4`), full: rel(`${id}.mp4`) });
      } else {
        run("ffmpeg", ["-y", "-v", "error", "-i", src, "-vf", fit(1400), "-q:v", "3", path.join(dir, `${id}-thumb.jpg`)]);
        run("ffmpeg", ["-y", "-v", "error", "-i", src, "-vf", fit(2200), "-q:v", "3", path.join(dir, `${id}.jpg`)]);
        Object.assign(item, { poster: rel(`${id}-thumb.jpg`), full: rel(`${id}.jpg`) });
      }
      if (prev) Object.assign(prev, item, { featured: prev.featured, hidden: prev.hidden });
      else { db.items.push(item); bySource.set(source, item); }
      added++;
      save(db);
    } catch (e) {
      console.log(`  FAILED ${source}: ${e.message}`);
    }
  }
}

if (!stoppedEarly) {
  const before = db.items.length;
  db.items = db.items.filter((i) => seen.has(i.source));
  if (before !== db.items.length) console.log(`removed ${before - db.items.length} item(s) whose source file is gone`);
}
const order = new Map(db.categories.map((c, i) => [c.slug, i]));
db.items.sort((a, b) => (order.get(a.category) - order.get(b.category)) || a.source.localeCompare(b.source));
save(db);
console.log(stoppedEarly ? `PAUSED (time budget) - ${added} processed this run, run again to continue` : `DONE - ${added} new, ${db.items.length} total`);
