#!/usr/bin/env node
/* ==========================================================================
   build-visas.js — renders the passport's visa pages.

   Each module in tools/visas/ (other than kit.js) draws one SPREAD — two facing
   visa pages — as SVG, using the shared look in kit.js. This renders every
   spread and cuts it at the spine into two page images:

       assets/passport/web/visa-01.webp … visa-18.webp   (920 × 1391 each)

   The quotes, captions, page numbers and seal are NOT in these images: they
   are live text laid over them by js/passport.js (from js/passport-data.js),
   so they stay sharp at any size and can be edited without a rebuild. (The
   art does carry some lettering of its own — calligraphy on the Constitution,
   security microtext — drawn with the fonts below.)

       npm install --no-save @resvg/resvg-js@2 sharp@0.33 \
           @expo-google-fonts/pinyon-script @expo-google-fonts/libre-caslon-text
       node tools/build-visas.js                 # every spread
       node tools/build-visas.js 03              # just visa pages 3–4's spread
       node tools/build-visas.js --preview DIR   # also write whole-spread PNGs

   Output is deterministic: the art uses seeded randomness only.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');
const kit = require('./visas/kit');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'visas');
const OUT = path.join(ROOT, 'assets', 'passport', 'web');
// Pages are drawn at 1040 × 1572 and saved at 920 wide: still ~2× for the
// largest the page is ever shown (about 710 CSS px tall on a laptop), and the
// downscale softens the grain just enough to halve the file.
const OUT_W = 920;
const QUALITY = 80;

// Lettering in the art (calligraphy, security microtext) uses two open-licensed
// Google Fonts, installed from npm alongside the renderer (see the header).
const FONTS = [
  '@expo-google-fonts/pinyon-script/400Regular/PinyonScript_400Regular.ttf',
  '@expo-google-fonts/libre-caslon-text/400Regular/LibreCaslonText_400Regular.ttf',
  '@expo-google-fonts/libre-caslon-text/400Regular_Italic/LibreCaslonText_400Regular_Italic.ttf',
  '@expo-google-fonts/libre-caslon-text/700Bold/LibreCaslonText_700Bold.ttf',
].map((f) => require.resolve(f));

function render(svg, viewBox, width, height) {
  const sized = svg.replace(/<svg([^>]*?)viewBox="[^"]*"([^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/,
    `<svg$1viewBox="${viewBox}"$2width="${width}"$3height="${height}"`);
  const r = new Resvg(sized, {
    fitTo: { mode: 'original' },
    font: { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'Libre Caslon Text' },
  });
  return r.render().asPng();
}

async function main() {
  const args = process.argv.slice(2);
  let preview = null, only = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preview') preview = args[++i];
    else only = args[i].padStart(2, '0');
  }
  if (preview) fs.mkdirSync(preview, { recursive: true });

  const files = fs.readdirSync(SRC).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
  for (const f of files) {
    if (only && !f.startsWith(only)) continue;
    const mod = require(path.join(SRC, f));
    const svg = mod.svg(kit);
    const [left, right] = mod.pages;
    for (const [half, page] of [[0, left], [1, right]]) {
      const png = render(svg, `${half * kit.PAGE} 0 ${kit.PAGE} ${kit.H}`, kit.PAGE, kit.H);
      const file = path.join(OUT, `visa-${String(page).padStart(2, '0')}.webp`);
      await sharp(png).resize(OUT_W, null, { kernel: 'lanczos3' })
        .webp({ quality: QUALITY, effort: 6, smartSubsample: true }).toFile(file);
      console.log(`  ${path.relative(ROOT, file).padEnd(36)} ${(fs.statSync(file).size / 1024).toFixed(0).padStart(4)} KB`);
    }
    if (preview) {
      const png = render(svg, `0 0 ${kit.W} ${kit.H}`, kit.W / 2, kit.H / 2);
      fs.writeFileSync(path.join(preview, f.replace(/\.js$/, '.png')), png);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
