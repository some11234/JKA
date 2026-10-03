#!/usr/bin/env node
/* ==========================================================================
   build-visas.js — renders the passport's visa pages from paintings.

   Each visa spread is a public-domain American painting, listed with its
   source and crop in tools/visas/spreads.js and graded into the passport's
   shared look by tools/visas/grade.js. This fetches each painting (once, into
   tools/visas/.masters/, which git ignores), grades it, and cuts it at the
   spine into two page images:

       assets/passport/web/visa-01.webp … visa-18.webp   (920 × 1391 each)

   The quotes, captions, credits, page numbers and seal are NOT in these
   images: they are live text laid over them by js/passport.js (from
   js/passport-data.js), so they can be edited without a rebuild.

       npm install --no-save @resvg/resvg-js@2 sharp@0.33 \
           @expo-google-fonts/libre-caslon-text
       node tools/build-visas.js                 # every spread
       node tools/build-visas.js 3               # just the third spread (pages 5–6)
       node tools/build-visas.js --preview DIR   # also write whole-spread JPEGs

   If a museum's server refuses the download, save the painting by hand as
   tools/visas/.masters/<slug>.jpg (the error says which) and run it again.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const { gradeSpread, W, H, PAGE } = require('./visas/grade');
const SPREADS = require('./visas/spreads');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'passport', 'web');
const CACHE = path.join(__dirname, 'visas', '.masters');
// Pages are graded at 1040 × 1572 and saved at 920 wide: still ~2× for the
// largest the page is ever shown (about 710 CSS px tall on a laptop).
const OUT_W = 920;
const QUALITY = 80;
const UA = 'josephkerby.com passport build (https://josephkerby.com)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The page text, read the way the browser reads it, to check the two lists agree.
function pageText() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'passport-data.js'), 'utf8'), ctx);
  return ctx.window.PASSPORT_VISAS || [];
}

async function master(spread) {
  fs.mkdirSync(CACHE, { recursive: true });
  const have = fs.readdirSync(CACHE).find((f) => f.startsWith(spread.slug + '.') && !f.endsWith('.part'));
  if (have) return path.join(CACHE, have);
  for (const url of spread.sources) {
    const ext = ((url.match(/\.(jpe?g|png|tiff?|webp)(?:$|[?#])/i) || [])[1] || 'jpg').toLowerCase();
    const file = path.join(CACHE, `${spread.slug}.${ext}`);
    const part = file + '.part';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        execFileSync('curl', ['-sS', '-fL', '-A', UA, '-o', part, url], { stdio: ['ignore', 'ignore', 'pipe'] });
        const m = await sharp(part, { limitInputPixels: 1e9 }).metadata();
        fs.renameSync(part, file);
        console.log(`  fetched ${spread.slug}: ${m.width}×${m.height} from ${new URL(url).host}`);
        return file;
      } catch (e) {
        fs.rmSync(part, { force: true });
        if (attempt < 2) await sleep(3000 * 2 ** attempt);
      }
    }
  }
  throw new Error(`Couldn't fetch the painting for "${spread.slug}". Save it by hand as\n` +
    `  ${path.relative(ROOT, CACHE)}/${spread.slug}.jpg\nfrom one of:\n  ${spread.sources.join('\n  ')}`);
}

async function main() {
  const args = process.argv.slice(2);
  let preview = null, only = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preview') preview = args[++i];
    else only = parseInt(args[i], 10);
  }
  if (preview) fs.mkdirSync(preview, { recursive: true });

  const text = pageText();
  if (text.length !== SPREADS.length) {
    console.warn(`warning: spreads.js lists ${SPREADS.length} paintings but passport-data.js has ${text.length} spreads`);
  }

  for (let i = 0; i < SPREADS.length; i++) {
    if (only && only !== i + 1) continue;
    const s = SPREADS[i];
    console.log(`${i + 1}. ${(text[i] && text[i].title) || s.slug}`);
    const img = await gradeSpread(await master(s), Object.assign({ crop: s.crop }, s.grade));
    for (const half of [0, 1]) {
      const page = i * 2 + 1 + half;
      const file = path.join(OUT, `visa-${String(page).padStart(2, '0')}.webp`);
      await img.clone().extract({ left: half * PAGE, top: 0, width: PAGE, height: H })
        .resize(OUT_W, null, { kernel: 'lanczos3' })
        .webp({ quality: QUALITY, effort: 6, smartSubsample: true }).toFile(file);
      console.log(`  ${path.relative(ROOT, file).padEnd(36)} ${(fs.statSync(file).size / 1024).toFixed(0).padStart(4)} KB`);
    }
    if (preview) {
      await img.clone().resize(W / 1.3 | 0).jpeg({ quality: 86 })
        .toFile(path.join(preview, `${String(i + 1).padStart(2, '0')}-${s.slug}.jpg`));
    }
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
