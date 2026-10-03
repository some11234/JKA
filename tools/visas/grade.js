/* ==========================================================================
   grade.js — turns a painting into a passport visa spread.

   Every spread is a real public-domain painting, so the work here is to make
   nine paintings by different hands read as one printed book, in the soft
   palette of the Apple Wallet state IDs, without losing the brushwork:

     1. crop    trim the unpainted canvas edge, then cut the spread's 2080×1572
                (two 1040×1572 pages, spine at x = 1040) out of the painting
     2. levels  stretch the range, partly per channel, to lift old varnish
     3. tone    lift the blacks to an ink blue and cap the whites at paper, so
                the painting sits on the page like a print rather than a photo
     4. palette pull every colour part-way toward one shared gradient map
                (indigo → periwinkle → mauve → apricot → cream)
     5. haze    a little highlight bloom, and a fade toward pale sky at the top
                where the quotation runs
     6. print   faint security linework (wavy microtext, guilloche), a gentle
                iridescent sheen, paper colour, grain and mottle

   All randomness is seeded, so a build is reproducible.
   ========================================================================== */

'use strict';

const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const W = 2080;
const H = 1572;
const PAGE = 1040;

// Shared defaults; a spread overrides any of these in spreads.js.
const DEFAULTS = {
  crop: { inset: 0.015, w: 1, x: 0.5, y: 0.5 },   // see cropBox()
  neutral: 0.45,      // 0 = shared levels only, 1 = full per-channel (kills casts, and sunsets)
  black: 0.2,         // darkest value, as a fraction of white: ink, not black
  white: 0.975,       // brightest value: paper
  contrast: 0.92,
  gamma: 0.92,        // < 1 opens up the shadows
  sat: 0.74,          // chroma kept
  map: 0.5,           // how far colours move toward the palette
  stops: [[0, '#28306E'], [0.28, '#5257A0'], [0.52, '#A985AE'], [0.76, '#EDB79C'], [1, '#FCF3E6']],
  bloom: 0.16,        // strength of the highlight glow
  bloomAt: 0.68,      // luminance where it starts
  fade: 0.42,         // how far the top edge fades toward fadeColor…
  fadeTo: 0.24,       // …over this fraction of the height
  fadeColor: '#F6EDEA',
  // Soft pale patches under the live type, so it reads over a busy painting:
  // x, y = centre (fractions of the spread), r = radius (fraction of the
  // width), a = strength. Defaults sit under the seal and the caption.
  spots: [{ x: 0.912, y: 0.876, r: 0.16, a: 0.34 }, { x: 0.14, y: 0.895, r: 0.2, a: 0.2 }],
  // The real passport's pages run from dawn pink at the top to blue at the
  // bottom; this lays the same wash over every painting (soft light).
  wash: [[0, '#F7B4C2'], [0.45, '#F3D2C8'], [1, '#93ACE4']],
  washAmount: 0.4,
  paper: '#FBF6EE',
  grain: 0.022,
  mottle: 0.03,
  micro: 0.035,       // opacity of the microtext rows
  guilloche: 0.03,    // opacity of the guilloche lines
  ink: '#2B3A8F',
  sheen: 0.05,
  seed: 7,
};

const FONTS = [
  '@expo-google-fonts/libre-caslon-text/700Bold/LibreCaslonText_700Bold.ttf',
].map((f) => require.resolve(f));

const hex = (c) => { const v = parseInt(c.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
const toLin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const toSrgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// The gradient map as a 1024-step lookup table, interpolated in linear light.
function palette(stops) {
  const out = new Float32Array(1024 * 3);
  const st = stops.map(([o, c]) => [o, hex(c).map(toLin)]);
  for (let i = 0; i < 1024; i++) {
    const t = i / 1023;
    let k = 0;
    while (k < st.length - 2 && t > st[k + 1][0]) k++;
    const [o0, c0] = st[k], [o1, c1] = st[k + 1];
    const u = clamp((t - o0) / (o1 - o0));
    for (let j = 0; j < 3; j++) out[i * 3 + j] = toSrgb(c0[j] + (c1[j] - c0[j]) * u);
  }
  return out;
}

// The W3C soft-light blend of one channel: base v, blend s.
function softLight(v, s) {
  return s < 0.5
    ? v - (1 - 2 * s) * v * (1 - v)
    : v + (2 * s - 1) * ((v < 0.25 ? ((16 * v - 12) * v + 4) * v : Math.sqrt(v)) - v);
}

function percentile(hist, total, p) {
  let acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * p) return i / 255; }
  return 1;
}

// crop: inset trims each edge by that fraction of the painting first (frame
// shadows, bare canvas); w is the share of the remaining width to keep (the
// height follows from the spread's ratio, and w shrinks if the painting is too
// short); x and y place the crop within the slack, 0 = left/top, 1 = right/bottom.
function cropBox(meta, c) {
  const iw = Math.round(meta.width * (1 - 2 * c.inset)), ih = Math.round(meta.height * (1 - 2 * c.inset));
  let cw = Math.round(iw * c.w), ch = Math.round(cw * H / W);
  if (ch > ih) { ch = ih; cw = Math.round(ch * W / H); }
  return {
    left: Math.round(meta.width * c.inset) + Math.round((iw - cw) * c.x),
    top: Math.round(meta.height * c.inset) + Math.round((ih - ch) * c.y),
    width: cw,
    height: ch,
  };
}

// Security print, drawn in black and used as a mask: rows of microtext on
// gently wavy baselines, and two bands of guilloche linework.
function linework(o) {
  const r = rng(o.seed + 11);
  const unit = 'UNITED STATES OF AMERICA · ';
  let defs = '', rows = '';
  for (let y = 70, i = 0; y < H + 40; y += 30, i++) {
    const ph = r() * 6.283, amp = 7 + r() * 5;
    let d = '';
    for (let x = -120; x <= W + 120; x += 20) {
      d += (x === -120 ? 'M' : 'L') + x + ' ' + (y + amp * Math.sin(x / 260 + ph) + 4 * Math.sin(x / 97 - ph)).toFixed(1);
    }
    defs += `<path id="r${i}" d="${d}"/>`;
    rows += `<text font-size="11" letter-spacing="2.6"><textPath href="#r${i}" startOffset="${-(i % 4) * 41}">${unit.repeat(24)}</textPath></text>`;
  }
  let lines = '';
  for (const [y0, y1, ph0] of [[0.05, 0.36, 0], [0.58, 0.98, 1]]) {
    let d = '';
    for (let l = 0; l < 22; l++) {
      const base = H * (y0 + (y1 - y0) * (l / 21)), ph = l * 0.33 + ph0;
      for (let x = 0; x <= W; x += 14) {
        const y = base + 26 * Math.sin((x / 610) * 6.283 + ph) + 11 * Math.sin((x / 233) * 6.283 - ph * 1.6);
        d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1);
      }
    }
    lines += `<path d="${d}" fill="none" stroke="#000" stroke-width="1.1" stroke-opacity="${o.micro > 0 ? o.guilloche / o.micro : 0}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>` +
    `<g font-family="Libre Caslon Text" font-weight="700" fill="#000">${rows}</g>${lines}</svg>`;
  return new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'Libre Caslon Text' },
  }).render().pixels;
}

// Returns a sharp instance holding the finished 2080×1572 spread (raw RGB).
async function gradeSpread(src, opts = {}) {
  const o = Object.assign({}, DEFAULTS, opts, { crop: Object.assign({}, DEFAULTS.crop, opts.crop || {}) });
  const meta = await sharp(src, { limitInputPixels: 1e9 }).metadata();
  const box = cropBox(meta, o.crop);
  if (box.width < W * 0.85) {
    console.warn(`  warning: crop is only ${box.width}px wide (spread is ${W}); the art will be soft`);
  }
  const data = await sharp(src, { limitInputPixels: 1e9 }).extract(box).resize(W, H, { kernel: 'lanczos3' })
    .removeAlpha().toColourspace('srgb').raw().toBuffer();
  const N = W * H;

  // 2. Levels.
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)], histY = new Uint32Array(256);
  for (let p = 0; p < N; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    hist[0][r]++; hist[1][g]++; hist[2][b]++;
    histY[Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)]++;
  }
  const lo = hist.map((h) => percentile(h, N, 0.004)), hi = hist.map((h) => percentile(h, N, 0.996));
  const loY = percentile(histY, N, 0.004), hiY = percentile(histY, N, 0.996);

  // 3–4. Tone and palette.
  const map = palette(o.stops);
  const out = new Float32Array(N * 3);
  const lum = new Float32Array(N);
  const c = [0, 0, 0];
  for (let p = 0; p < N; p++) {
    for (let j = 0; j < 3; j++) {
      const v = data[p * 3 + j] / 255;
      const a = (v - loY) / Math.max(hiY - loY, 1e-3), b = (v - lo[j]) / Math.max(hi[j] - lo[j], 1e-3);
      c[j] = clamp(a + (b - a) * o.neutral);
    }
    const Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const t = clamp(0.5 + (Math.pow(Y, o.gamma) - 0.5) * o.contrast);
    const Yt = o.black + (o.white - o.black) * t;
    // Chroma rides on the new luminance additively: scaling it by Yt/Y
    // would blow faint casts in the shadows up into saturated blues.
    const k = Y > 1e-4 ? Math.min(Yt / Y, 1.25) : 1;
    const m = Math.min(1023, Math.max(0, Math.round(Yt * 1023))) * 3;
    for (let j = 0; j < 3; j++) {
      const v = Yt + (c[j] - Y) * k * o.sat;
      out[p * 3 + j] = clamp(v + (map[m + j] - v) * o.map);
    }
    lum[p] = Yt;
  }

  // 5. Bloom: the highlights, blurred and screened back over the image.
  if (o.bloom > 0) {
    const hl = Buffer.alloc(N * 3);
    for (let p = 0; p < N; p++) {
      const w = smooth(o.bloomAt, 1, lum[p]);
      for (let j = 0; j < 3; j++) hl[p * 3 + j] = Math.round(out[p * 3 + j] * w * 255);
    }
    const bl = await sharp(hl, { raw: { width: W, height: H, channels: 3 } }).blur(38).raw().toBuffer();
    for (let i = 0; i < N * 3; i++) {
      const b = (bl[i] / 255) * o.bloom;
      out[i] = 1 - (1 - out[i]) * (1 - b);
    }
  }

  // 6. Print.
  const ink = hex(o.ink), paper = hex(o.paper), fadeC = hex(o.fadeColor);
  const mask = linework(o);
  const r = rng(o.seed);
  const mw = Math.ceil(W / 24), mh = Math.ceil(H / 24);
  const seedNoise = Buffer.alloc(mw * mh);
  for (let i = 0; i < seedNoise.length; i++) seedNoise[i] = Math.round(r() * 255);
  const mottle = await sharp(seedNoise, { raw: { width: mw, height: mh, channels: 1 } })
    .resize(W, H, { kernel: 'cubic' }).blur(6).raw().toBuffer();

  const spots = o.spots.map((sp) => ({ x: sp.x * W, y: sp.y * H, r2: (sp.r * W) ** 2, a: sp.a }));
  const washRow = palette(o.wash.map(([at, col]) => [at, col]));
  const res = Buffer.alloc(N * 3);
  const sh = [0, 0, 0];
  for (let y = 0; y < H; y++) {
    const fy = y / H;
    const fade = o.fade * (1 - smooth(0, o.fadeTo, fy));
    const wr = Math.min(1023, Math.round(fy * 1023)) * 3;
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      let lift = fade;
      for (const sp of spots) {
        const dx = x - sp.x, dy = y - sp.y;
        const d2 = (dx * dx + dy * dy) / sp.r2;
        if (d2 < 1) lift = 1 - (1 - lift) * (1 - sp.a * (1 - smooth(0.15, 1, Math.sqrt(d2))));
      }
      // The sheen: a slow rainbow along the diagonal, as on a holographic card.
      const d = (x / W) * 0.8 + fy * 0.6;
      sh[0] = 0.5 + 0.5 * Math.sin(d * 6.283 + 0.3);
      sh[1] = 0.5 + 0.5 * Math.sin(d * 6.283 + 2.4);
      sh[2] = 0.5 + 0.5 * Math.sin(d * 6.283 + 4.3);
      const a = (mask[p * 4 + 3] / 255) * o.micro;
      const g = (r() - 0.5) * 2 * o.grain + (mottle[p] / 255 - 0.5) * 2 * o.mottle;
      for (let j = 0; j < 3; j++) {
        let v = out[p * 3 + j];
        v += (fadeC[j] - v) * lift;
        v += (softLight(v, washRow[wr + j]) - v) * o.washAmount;
        const s = sh[j];
        v += (softLight(v, s) - v) * o.sheen;
        v *= 1 - a * (1 - ink[j]);
        v = v * paper[j] + g;
        res[p * 3 + j] = Math.round(clamp(v) * 255);
      }
    }
  }
  return sharp(res, { raw: { width: W, height: H, channels: 3 } });
}

module.exports = { W, H, PAGE, DEFAULTS, gradeSpread, cropBox };
