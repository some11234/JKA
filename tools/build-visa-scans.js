#!/usr/bin/env node
/* ==========================================================================
   build-visa-scans.js — the visa pages from scans of a real US passport.

   The alternative to build-visas.js (the painted pages): this fills the
   eighteen visa pages with flat scans of a real Next Generation US passport
   (2021–), pages 8–25, by Gabe Classon, released under CC0 — "The Little
   Blue Book", https://classon.onrender.com/posts/passport. He asks for
   credit and a link back, which the passport page carries. The artwork
   itself is a US government work.

   Each scan is one open spread with a little of the book's edge around it.
   This crops the two pages out of it, either side of the spine, at the
   passport page's 1040 × 1572 proportions, and writes the same files the
   painted build does:

       assets/passport/web/visa-01.webp … visa-18.webp   (920 × 1391 each)

   so the two builds can be swapped by running one or the other. The scans
   have the quotes and page numbers printed on them, so with these pages
   js/passport-data.js sets PASSPORT_VISA_PRINTED = true and the page
   doesn't lay its own text over them.

       npm install --no-save sharp@0.33
       node tools/build-visa-scans.js

   Scans are downloaded once into tools/visas/.masters/ (gitignored).
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'passport', 'web');
const CACHE = path.join(__dirname, 'visas', '.masters');
const OUT_W = 920;
const QUALITY = 82;
const PAGE_RATIO = 1040 / 1572;   // width / height of one passport page
const UA = 'josephkerby.com passport build (https://josephkerby.com)';

// Where the paper's top and bottom edges sit in a 2112 × 1486 scan
// (measured once; the scans are all framed alike).
const FRAME = { top: 22, bottom: 1470 };

// The spine drifts a little from scan to scan (1063–1079 px): find it as
// the darkest column of the gutter's shadow near the middle.
async function findSpine(src, s) {
  const x0 = Math.round(900 * s), w = Math.round(320 * s);
  const { data } = await sharp(src).extract({ left: x0, top: Math.round(300 * s), width: w, height: Math.round(1000 * s) })
    .greyscale().resize(w, 1, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let best = 0;
  for (let i = 1; i < data.length; i++) if (data[i] < data[best]) best = i;
  return x0 + best;
}

async function scan(a) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `scan-${a}-${a + 1}.jpg`);
  if (!fs.existsSync(file)) {
    const url = `https://classon.onrender.com/static/passport/new/New%20${a}%20${a + 1}.jpg`;
    execFileSync('curl', ['-sS', '-fL', '--retry', '3', '-A', UA, '-o', file, url]);
    console.log(`  fetched pages ${a}–${a + 1}`);
  }
  return file;
}

async function main() {
  for (let i = 0; i < 9; i++) {
    const a = 8 + i * 2;   // the real passport's page numbers: 8–9 … 24–25
    const src = await scan(a);
    const meta = await sharp(src).metadata();
    const s = meta.width / 2112;   // in case a scan comes at another size
    const top = Math.round(FRAME.top * s), height = Math.round((FRAME.bottom - FRAME.top) * s);
    const width = Math.round(height * PAGE_RATIO), spine = await findSpine(src, s);
    for (const [half, left] of [[0, spine - width], [1, spine]]) {
      const page = i * 2 + 1 + half;
      const file = path.join(OUT, `visa-${String(page).padStart(2, '0')}.webp`);
      await sharp(src).extract({ left, top, width, height })
        .resize(OUT_W, Math.round(OUT_W / PAGE_RATIO), { fit: 'fill', kernel: 'lanczos3' })
        .webp({ quality: QUALITY, effort: 6 }).toFile(file);
      console.log(`  ${path.relative(ROOT, file).padEnd(36)} ${(fs.statSync(file).size / 1024).toFixed(0).padStart(4)} KB  (passport p. ${a + half})`);
    }
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
