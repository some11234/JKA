/* ==========================================================================
   kit.js — the shared look of every visa spread.

   The style is borrowed (not copied) from the Apple Wallet state IDs: one
   bold hero subject, grainy stippled gradients, pastel hazy skies with
   layered landscapes, foreground flowers framing the corners, and faint
   security-print linework behind it all. Each spread in this folder is a
   module that builds its own SVG from these pieces, so all nine read as one
   family.

   Canvas: one SPREAD is 2080 × 1572 user units — two 1040 × 1572 pages side
   by side, the spine at x = 1040. build-visas.js renders each half as its own
   page image. Text never goes in the art (the quotes, captions and seal are
   live HTML on the page), so nothing here needs a font.

   Keep the gutter (x ≈ 960–1120) free of anything that matters: the page
   shading darkens it, and the two halves are seen on separate sheets.
   ========================================================================== */

'use strict';

const W = 2080;
const H = 1572;
const PAGE = 1040;
const SPINE = 1040;

// The palette the Wallet cards share: pastel skies, saturated blue-violet
// accents, warm coral/apricot highlights, soft yellow-greens.
const C = {
  ink: '#1F2E86',        // deep blue — linework, darkest accents
  blue: '#3A4FC9',       // Wallet title blue
  violet: '#5B5FD6',
  periwinkle: '#8E97E8',
  lavender: '#CBC7EC',
  lilac: '#B79AD9',
  mauve: '#B9A3C6',
  rose: '#E98A9A',
  coral: '#F07F6F',
  apricot: '#F4B183',
  peach: '#F6D3C2',
  cream: '#FBF1E6',
  butter: '#F6DE8A',
  gold: '#E9B44C',
  sage: '#A9C79A',
  meadow: '#CFD98C',
  pine: '#2F6E5E',
  teal: '#3E8A8A',
  sky: '#BFD5F2',
  mist: '#E8E6F4',
};

let uid = 0;
function id(prefix) { uid += 1; return (prefix || 'k') + uid; }

function n(v) { return Math.round(v * 10) / 10; }

// --- gradients ------------------------------------------------------------

// Linear gradient across a box, by angle in degrees (0 = left→right, 90 =
// top→bottom). stops: [[offset 0..1, colour, opacity?], ...]
function linear(gid, angle, stops) {
  const a = (angle * Math.PI) / 180;
  const x = Math.cos(a) / 2, y = Math.sin(a) / 2;
  return `<linearGradient id="${gid}" x1="${n((0.5 - x) * 100)}%" y1="${n((0.5 - y) * 100)}%" x2="${n((0.5 + x) * 100)}%" y2="${n((0.5 + y) * 100)}%">${
    stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
}

function radial(gid, cx, cy, r, stops, extra) {
  return `<radialGradient id="${gid}" cx="${cx}" cy="${cy}" r="${r}"${extra || ''}>${
    stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`;
}

// --- filters ----------------------------------------------------------------

// The Wallet grain: fine fractal noise blended soft-light over whatever it is
// applied to, clipped to that thing's own shape. Applied once to each page's
// whole illustration group, it turns every flat gradient into a stippled one.
// strength 0..1 controls how far the noise pushes the colours.
function grainFilter(fid, opts) {
  const o = Object.assign({ freq: 0.95, strength: 0.55, seed: 7 }, opts || {});
  const slope = 1 + o.strength * 2.2, icpt = (1 - slope) / 2;
  return `<filter id="${fid}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${o.freq}" numOctaves="2" seed="${o.seed}" stitchTiles="stitch" result="noise"/>
  <feColorMatrix in="noise" type="saturate" values="0" result="mono"/>
  <feComponentTransfer in="mono" result="grit">
    <feFuncR type="linear" slope="${n(slope * 10) / 10}" intercept="${n(icpt * 100) / 100}"/>
    <feFuncG type="linear" slope="${n(slope * 10) / 10}" intercept="${n(icpt * 100) / 100}"/>
    <feFuncB type="linear" slope="${n(slope * 10) / 10}" intercept="${n(icpt * 100) / 100}"/>
  </feComponentTransfer>
  <feBlend in="grit" in2="SourceGraphic" mode="soft-light" result="textured"/>
  <feComposite in="textured" in2="SourceGraphic" operator="in"/>
</filter>`;
}

// A softer, larger-scale mottling for skies and big fields (paper tooth).
function mottleFilter(fid, opts) {
  const o = Object.assign({ freq: 0.012, strength: 0.18, seed: 3 }, opts || {});
  return `<filter id="${fid}" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${o.freq}" numOctaves="3" seed="${o.seed}" result="noise"/>
  <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.35" result="light"/>
  <feComposite in="light" in2="SourceGraphic" operator="in" result="lit"/>
  <feComponentTransfer in="lit" result="soft"><feFuncA type="linear" slope="${o.strength}"/></feComponentTransfer>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="soft"/></feMerge>
</filter>`;
}

// --- backgrounds --------------------------------------------------------------

// Full-spread sky: a vertical gradient, top → horizon.
function sky(stops) {
  const g = id('sky');
  return { defs: linear(g, 90, stops), svg: `<rect width="${W}" height="${H}" fill="url(#${g})"/>` };
}

// Security-print linework: families of interfering sine waves across the
// whole spread, faint. Deterministic. Keep opacity low (0.06–0.14).
function guilloche(o) {
  o = Object.assign({ color: C.ink, opacity: 0.1, lines: 26, y0: 0, y1: H, amp: 22, period: 520, width: 1.2, phase: 0, x0: 0, x1: W }, o || {});
  let d = '';
  for (let i = 0; i < o.lines; i++) {
    const t = o.lines === 1 ? 0 : i / (o.lines - 1);
    const base = o.y0 + (o.y1 - o.y0) * t;
    const ph = o.phase + i * 0.38;
    let seg = '';
    for (let x = o.x0; x <= o.x1; x += 16) {
      const y = base + o.amp * Math.sin((x / o.period) * Math.PI * 2 + ph) + o.amp * 0.45 * Math.sin((x / (o.period * 0.37)) * Math.PI * 2 - ph * 1.7);
      seg += (x === o.x0 ? 'M' : 'L') + n(x) + ' ' + n(y);
    }
    d += seg;
  }
  return `<path d="${d}" fill="none" stroke="${o.color}" stroke-width="${o.width}" stroke-opacity="${o.opacity}"/>`;
}

// Concentric rosette (guilloche medallion), e.g. behind a hero subject.
function rosette(cx, cy, r, o) {
  o = Object.assign({ color: C.ink, opacity: 0.12, rings: 9, lobes: 24, width: 1.1 }, o || {});
  let d = '';
  for (let k = 0; k < o.rings; k++) {
    const rr = r * (0.35 + 0.65 * (k / Math.max(1, o.rings - 1)));
    const amp = rr * 0.06;
    for (let s = 0; s <= 720; s++) {
      const a = (s / 720) * Math.PI * 2;
      const rad = rr + amp * Math.sin(a * o.lobes + k * 0.6);
      d += (s === 0 ? 'M' : 'L') + n(cx + rad * Math.cos(a)) + ' ' + n(cy + rad * Math.sin(a));
    }
    d += 'Z';
  }
  return `<path d="${d}" fill="none" stroke="${o.color}" stroke-width="${o.width}" stroke-opacity="${o.opacity}"/>`;
}

// A hazy band that fades a layer into the distance (atmospheric perspective).
function haze(y, h, colour, opacity) {
  const g = id('haze');
  return {
    defs: linear(g, 90, [[0, colour, 0], [0.55, colour, opacity], [1, colour, 0]]),
    svg: `<rect x="0" y="${y}" width="${W}" height="${h}" fill="url(#${g})"/>`,
  };
}

// --- landscape -----------------------------------------------------------------

// Seeded pseudo-random, so every build is identical.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// A ridge line from x0 to x1 around baseline y, filled down to bottom.
function ridge(o) {
  o = Object.assign({ x0: -20, x1: W + 20, y: 1100, amp: 120, rough: 0.5, seed: 1, bottom: H + 10, step: 40 }, o || {});
  const r = rng(o.seed);
  let d = `M${o.x0} ${o.bottom}`;
  let y = o.y;
  const peaks = o.peaks || [];
  for (let x = o.x0; x <= o.x1; x += o.step) {
    let target = o.y;
    for (const p of peaks) {
      const dx = (x - p[0]) / p[2];
      target -= p[1] * Math.max(0, 1 - Math.abs(dx)) ** (p[3] || 1.4);
    }
    y = y + (target - y) * 0.6 + (r() - 0.5) * o.amp * o.rough;
    d += `L${n(x)} ${n(y)}`;
  }
  d += `L${o.x1} ${o.bottom}Z`;
  return d;
}

// Simple layered pine silhouette (point at top), centred on x, base at y.
function pine(x, y, h, fill, shade) {
  const w = h * 0.36;
  let d = '';
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers, t1 = (i + 1.25) / tiers;
    const yt = y - h + h * t0 * 0.92, yb = y - h + h * Math.min(1, t1) * 0.92;
    const hw = w * (0.25 + 0.75 * Math.min(1, t1)) / 2;
    d += `M${n(x)} ${n(yt)}L${n(x + hw)} ${n(yb)}L${n(x - hw)} ${n(yb)}Z`;
  }
  const trunk = `<rect x="${n(x - h * 0.025)}" y="${n(y - h * 0.08)}" width="${n(h * 0.05)}" height="${n(h * 0.08)}" fill="${shade || fill}"/>`;
  return `<path d="${d}" fill="${fill}"/>${trunk}`;
}

function pines(o) {
  o = Object.assign({ x0: 0, x1: W, y: 1200, h: 160, count: 24, fill: C.pine, shade: null, seed: 5, jitter: 0.35 }, o || {});
  const r = rng(o.seed);
  let s = '';
  for (let i = 0; i < o.count; i++) {
    const x = o.x0 + ((o.x1 - o.x0) * (i + r() * 0.8)) / o.count;
    const h = o.h * (1 - o.jitter / 2 + r() * o.jitter);
    s += pine(x, o.y + (r() - 0.5) * o.h * 0.15, h, o.fill, o.shade);
  }
  return s;
}

// Soft cumulus cloud from overlapping circles.
function cloud(x, y, s, fill, opacity) {
  const parts = [[0, 0, 1], [0.9, 0.12, 0.8], [-0.9, 0.18, 0.75], [0.35, -0.42, 0.8], [-0.4, -0.3, 0.7], [1.6, 0.32, 0.55], [-1.6, 0.36, 0.5]];
  return `<g fill="${fill}" fill-opacity="${opacity == null ? 0.85 : opacity}">${
    parts.map((p) => `<circle cx="${n(x + p[0] * s)}" cy="${n(y + p[1] * s)}" r="${n(p[2] * s)}"/>`).join('')
  }<rect x="${n(x - 1.9 * s)}" y="${n(y + 0.2 * s)}" width="${n(3.8 * s)}" height="${n(0.62 * s)}" rx="${n(0.3 * s)}"/></g>`;
}

// A distant bird (two-stroke "m"), for skies.
function bird(x, y, s, colour) {
  return `<path d="M${n(x - s)} ${n(y)}Q${n(x - s * 0.5)} ${n(y - s * 0.55)} ${n(x)} ${n(y)}Q${n(x + s * 0.5)} ${n(y - s * 0.55)} ${n(x + s)} ${n(y)}" fill="none" stroke="${colour}" stroke-width="${n(s * 0.16)}" stroke-linecap="round"/>`;
}

// Radiating rays (a "glory"), e.g. behind a hero.
function sunburst(cx, cy, r0, r1, rays, colour, opacity) {
  let d = '';
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / rays / 2;
    d += `M${n(cx + r0 * Math.cos(a0))} ${n(cy + r0 * Math.sin(a0))}L${n(cx + r1 * Math.cos(a0))} ${n(cy + r1 * Math.sin(a0))}L${n(cx + r1 * Math.cos(a1))} ${n(cy + r1 * Math.sin(a1))}L${n(cx + r0 * Math.cos(a1))} ${n(cy + r0 * Math.sin(a1))}Z`;
  }
  return `<path d="${d}" fill="${colour}" fill-opacity="${opacity}"/>`;
}

// Five-pointed star.
function star(cx, cy, r, fill) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.42 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += (i ? 'L' : 'M') + n(cx + rr * Math.cos(a)) + ' ' + n(cy + rr * Math.sin(a));
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}

// --- flowers -------------------------------------------------------------------

// A flower head: `petals` rounded petals around a centre, with a radial
// gradient so each petal shades darker toward its base. Returns {defs, svg}.
function flower(x, y, r, o) {
  o = Object.assign({ petals: 6, colour: C.lilac, deep: C.violet, centre: C.butter, rot: 0, roundness: 0.62, tilt: 1 }, o || {});
  const g = id('petal');
  const defs = radial(g, '50%', '100%', '100%', [[0, o.deep], [0.55, o.colour], [1, lighten(o.colour, 0.25)]]);
  let svg = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(o.rot)}) scale(1 ${o.tilt})">`;
  for (let i = 0; i < o.petals; i++) {
    const a = (i / o.petals) * 360;
    const pw = r * o.roundness;
    svg += `<path transform="rotate(${n(a)})" d="M0 0C${n(-pw)} ${n(-r * 0.35)} ${n(-pw * 0.9)} ${n(-r)} 0 ${n(-r)}C${n(pw * 0.9)} ${n(-r)} ${n(pw)} ${n(-r * 0.35)} 0 0Z" fill="url(#${g})"/>`;
  }
  svg += `<circle r="${n(r * 0.2)}" fill="${o.centre}"/><circle r="${n(r * 0.2)}" fill="${o.deep}" fill-opacity="0.25"/></g>`;
  return { defs, svg };
}

// A leafy stem with a few leaves, from (x,y) up to height h, leaning by lean.
function stem(x, y, h, o) {
  o = Object.assign({ colour: C.pine, light: C.sage, lean: 0.15, leaves: 3, width: 6, seed: 2 }, o || {});
  const r = rng(o.seed);
  const tx = x + h * o.lean;
  let svg = `<path d="M${n(x)} ${n(y)}Q${n(x + h * o.lean * 0.2)} ${n(y - h * 0.5)} ${n(tx)} ${n(y - h)}" fill="none" stroke="${o.colour}" stroke-width="${o.width}" stroke-linecap="round"/>`;
  for (let i = 0; i < o.leaves; i++) {
    const t = 0.25 + (i / o.leaves) * 0.6;
    const lx = x + (tx - x) * t, ly = y - h * t;
    const side = i % 2 ? 1 : -1;
    const L = h * (0.22 + r() * 0.08);
    svg += `<path d="M${n(lx)} ${n(ly)}Q${n(lx + side * L * 0.5)} ${n(ly - L * 0.6)} ${n(lx + side * L)} ${n(ly - L * 0.25)}Q${n(lx + side * L * 0.45)} ${n(ly - L * 0.05)} ${n(lx)} ${n(ly)}Z" fill="${i % 2 ? o.light : o.colour}"/>`;
  }
  return { svg, top: [tx, y - h] };
}

// A foreground cluster of flowers on stems, framing a corner. corner: 'bl' |
// 'br' (bottom-left/right). Returns {defs, svg}.
function cornerFlowers(corner, o) {
  o = Object.assign({ count: 7, size: 70, height: 360, colour: C.lilac, deep: C.violet, centre: C.butter, leaf: C.pine, leafLight: C.sage, petals: 6, seed: 9, spread: 380 }, o || {});
  const r = rng(o.seed);
  let defs = '', back = '', front = '';
  const left = corner === 'bl';
  for (let i = 0; i < o.count; i++) {
    const t = i / Math.max(1, o.count - 1);
    const x = left ? -30 + t * o.spread : W + 30 - t * o.spread;
    const y = H + 20;
    const h = o.height * (0.55 + r() * 0.5) * (1 - t * 0.35);
    const st = stem(x, y, h, { colour: o.leaf, light: o.leafLight, lean: (left ? 1 : -1) * (0.05 + r() * 0.2), seed: o.seed + i });
    back += st.svg;
    const f = flower(st.top[0], st.top[1], o.size * (0.7 + r() * 0.5), { petals: o.petals, colour: o.colour, deep: o.deep, centre: o.centre, rot: r() * 60, tilt: 0.75 + r() * 0.25 });
    defs += f.defs;
    front += f.svg;
  }
  return { defs, svg: back + front };
}

// --- colour --------------------------------------------------------------------

function hex(c) { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function toHex(a) { return '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function mix(a, b, t) { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); }
function lighten(c, t) { return mix(c, '#FFFFFF', t); }
function darken(c, t) { return mix(c, '#000000', t); }

// --- lettering -------------------------------------------------------------------
// Two faces are available to the renderer: 'Pinyon Script' (calligraphy) and
// 'Libre Caslon Text' (regular, italic, bold). Escape text with esc().

function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Security microtext, like the repeated state name behind the Wallet IDs:
// rows of tiny repeated caps across a band, tilted, very faint.
function microtext(text, o) {
  o = Object.assign({ x0: -200, y0: 0, x1: W + 200, y1: H, size: 17, gap: 34, angle: -12, colour: C.ink, opacity: 0.07, spacing: 2 }, o || {});
  const unit = esc(text.toUpperCase()) + ' \u00B7 ';
  const reps = Math.ceil((o.x1 - o.x0) / (o.size * 0.62 * (text.length + 3))) + 2;
  let rows = '';
  for (let y = o.y0, i = 0; y <= o.y1; y += o.gap, i++) {
    rows += `<text x="${o.x0 - (i % 3) * o.size * 2}" y="${y}">${unit.repeat(reps)}</text>`;
  }
  const cx = (o.x0 + o.x1) / 2, cy = (o.y0 + o.y1) / 2;
  return `<g transform="rotate(${o.angle} ${cx} ${cy})" font-family="Libre Caslon Text" font-size="${o.size}" letter-spacing="${o.spacing}" fill="${o.colour}" fill-opacity="${o.opacity}">${rows}</g>`;
}

// --- assembly --------------------------------------------------------------------

// Wrap a spread: shared filters, the art (grained as one piece), and a soft
// vignette at the page edges. `parts` is an array of {defs?, svg} or strings.
function spread(parts, o) {
  o = Object.assign({ grain: 0.55, background: null }, o || {});
  let defs = grainFilter('grain', { strength: o.grain }) + mottleFilter('mottle');
  let body = '';
  for (const p of parts) {
    if (!p) continue;
    if (typeof p === 'string') body += p;
    else { defs += p.defs || ''; body += p.svg || ''; }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${defs}</defs>
<g filter="url(#mottle)"><g filter="url(#grain)">${body}</g></g>
</svg>`;
}

module.exports = {
  W, H, PAGE, SPINE, C,
  id, n, rng,
  linear, radial, grainFilter, mottleFilter,
  sky, guilloche, rosette, haze,
  ridge, pine, pines, cloud, bird, sunburst, star,
  flower, stem, cornerFlowers,
  esc, microtext,
  mix, lighten, darken,
  spread,
};
