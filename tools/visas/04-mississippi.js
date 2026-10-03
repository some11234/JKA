/* Visa pages 7–8 — the Mississippi, heart of America.
   A wide golden-hour river runs across both pages under a low sun that hangs
   over the water just left of the spine, its glitter path running down the
   river. Left: the near bank — a great spreading cottonwood, a blue silo and a
   red gambrel barn, a lane with a split-rail fence, round hay bales and
   rolling contour-ploughed fields of gold and green; patchwork farmland on the
   far bank. Right: the hero — a white sternwheel steamboat, "wedding cake"
   decks of balustrades and gingerbread trim, a glass pilothouse, two tall
   black stacks with feathered crowns trailing soft smoke, the landing stage
   raised at the bow, and a big red paddlewheel churning the water. Purple
   coneflowers and black-eyed Susans frame the bottom corners. Light comes from
   the sun: left-page things are lit on their right, the boat on its bow
   (left). Quote (live text, see js/passport-data.js): Eisenhower, "Whatever
   America hopes to bring to pass in the world must first come to pass in the
   heart of America." */

'use strict';

module.exports = {
  pages: [7, 8],
  svg(k) {
    const { n, rng } = k;
    const parts = [];

    // ---- helpers ---------------------------------------------------------------------
    const stopsXml = (stops) => stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    // userSpaceOnUse gradients (coordinates in the referencing element's space).
    function lgU(gid, x1, y1, x2, y2, stops) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsXml(stops)}</linearGradient>`;
    }
    function rgU(gid, cx, cy, r, stops) {
      return `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}">${stopsXml(stops)}</radialGradient>`;
    }
    // Catmull-Rom through points → cubic Béziers (open path, no Z).
    function smooth(p) {
      let d = `M${n(p[0][0])} ${n(p[0][1])}`;
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
      }
      return d;
    }
    // A band from a smooth top edge down past the bottom of the spread.
    function band(top) { return smooth(top) + `L${n(top[top.length - 1][0])} ${k.H + 20}L${n(top[0][0])} ${k.H + 20}Z`; }
    // Sample a Catmull-Rom curve through points.
    function sample(p, per) {
      const out = [];
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        for (let j = 0; j < per; j++) {
          const t = j / per, t2 = t * t, t3 = t2 * t;
          out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
        }
      }
      out.push(p[p.length - 1]);
      return out;
    }
    // A tapered limb along a curve, width w0 → w1.
    function taper(p, w0, w1) {
      const s = sample(p, 8);
      const L = [], R = [];
      for (let i = 0; i < s.length; i++) {
        const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)];
        let tx = b[0] - a[0], ty = b[1] - a[1];
        const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
        const w = (w0 + (w1 - w0) * (i / (s.length - 1))) / 2;
        L.push([s[i][0] - ty * w, s[i][1] + tx * w]);
        R.push([s[i][0] + ty * w, s[i][1] - tx * w]);
      }
      const pts = L.concat(R.reverse());
      return 'M' + pts.map((q) => n(q[0]) + ' ' + n(q[1])).join('L') + 'Z';
    }
    // A scalloped, cloud-edged blob — the illustrator's leaf mass.
    function scallop(cx, cy, rx, ry, count, seed, bulge, jit) {
      const r = rng(seed);
      bulge = bulge == null ? 0.38 : bulge; jit = jit == null ? 0.12 : jit;
      const a0 = r() * Math.PI * 2;
      const pts = [];
      for (let i = 0; i < count; i++) {
        const a = a0 + ((i + (r() - 0.5) * 0.5) / count) * Math.PI * 2;
        const f = 1 - jit + r() * jit * 2;
        pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
      }
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      for (let i = 0; i < count; i++) {
        const p = pts[i], q = pts[(i + 1) % count];
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        let ox = mx - cx, oy = my - cy;
        const ol = Math.hypot(ox, oy) || 1; ox /= ol; oy /= ol;
        const b = Math.hypot(q[0] - p[0], q[1] - p[1]) * bulge * (0.75 + r() * 0.55);
        d += `Q${n(mx + ox * b)} ${n(my + oy * b)} ${n(q[0])} ${n(q[1])}`;
      }
      return d + 'Z';
    }

    const HZ = 902;                      // far edge of the river
    const SX = 852, SY = 668, SR = 74;   // the sun, over the water left of the spine

    // ---- sky, security print, glory ------------------------------------------------
    parts.push(k.sky([[0, '#D8D3EF'], [0.16, '#E3D2EA'], [0.32, '#F0D2D8'], [0.44, '#F8D4C4'], [0.54, '#FBD9B3'], [0.58, '#FCE0B4'], [1, '#FBE2BE']]));
    parts.push(k.microtext('Heartland', { y0: 40, y1: 900, opacity: 0.055 }));
    parts.push(k.guilloche({ y0: 120, y1: 860, lines: 22, opacity: 0.06, amp: 15, period: 720, phase: 2.1 }));
    {
      const glow = k.id('glow');
      parts.push({
        defs: rgU(glow, SX, SY, 760, [[0, '#FFF7E2', 1], [0.16, '#FEEBC8', 0.8], [0.45, '#FADDBE', 0.35], [1, '#F6D6C4', 0]]),
        svg: `<circle cx="${SX}" cy="${SY}" r="760" fill="url(#${glow})"/>` +
          k.sunburst(SX, SY, 110, 1500, 60, '#FFFFFF', 0.15) +
          k.rosette(SX, SY, 250, { opacity: 0.075, rings: 8, lobes: 32 }),
      });
    }

    // Golden-hour cloud streaks: lavender above, lit apricot-gold beneath.
    {
      const rc = rng(515);
      let s = '';
      const streaks = [
        [40, 520, 430, 24], [250, 566, 300, 16], [520, 452, 260, 14], [600, 760, 260, 14], [80, 690, 260, 15],
        [1170, 520, 300, 18], [1560, 470, 420, 24], [1700, 600, 360, 18], [1880, 700, 260, 14], [1360, 640, 220, 12],
      ];
      for (const [x, y, w, h] of streaks) {
        const near = Math.max(0, 1 - Math.hypot(x + w / 2 - SX, y - SY) / 700);
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${k.mix('#E7D3EC', '#FFE6C6', near)}" fill-opacity="${n(0.7 + rc() * 0.2)}"/>`;
        s += `<rect x="${n(x + w * 0.12)}" y="${n(y + h * 0.5)}" width="${n(w * 0.76)}" height="${n(h * 0.5)}" rx="${n(h * 0.25)}" fill="${k.mix('#F4BFA6', '#FFD08E', near)}" fill-opacity="0.55"/>`;
      }
      s += k.bird(560, 600, 15, '#6E67B0') + k.bird(604, 578, 10, '#6E67B0') + k.bird(1110, 440, 12, '#6E67B0') + k.bird(1960, 560, 13, '#6E67B0') + k.bird(2000, 584, 9, '#6E67B0');
      parts.push({ svg: s });
    }

    // American white pelicans gliding in a loose line over the river.
    {
      function pelican(x, y, s, up) {
        const wy = up ? -30 : -8;
        let g = '';
        g += `<path d="M8 -2C22 ${wy - 8} 50 ${wy - 14} 82 ${wy}C60 ${wy + 2} 38 ${wy + 8} 20 4Z" fill="#E2DEF2"/>`;
        g += `<path d="M82 ${wy}C70 ${wy - 6} 58 ${wy - 8} 48 ${wy - 6}L44 ${wy + 4}C56 ${wy + 2} 70 ${wy + 1} 82 ${wy}Z" fill="#2A2860"/>`;
        g += '<path d="M-44 2C-28 -10 6 -13 32 -7C40 -5 44 -2 46 1C30 8 0 10 -24 8C-34 7 -42 5 -44 2Z" fill="#FFFFFF"/>';
        g += '<path d="M-24 8C0 10 30 8 46 1C30 12 -2 14 -24 8Z" fill="#CFC9EC"/>';
        g += '<circle cx="40" cy="-6" r="7" fill="#FFFFFF"/><circle cx="42" cy="-8" r="1.6" fill="#26245E"/>';
        g += '<path d="M44 -8L82 -2L80 1L44 -1Z" fill="#F2A64A"/><path d="M46 -1L78 1Q64 8 48 4Z" fill="#E9884A"/>';
        g += '<path d="M-44 2L-56 -2L-54 7Z" fill="#ECE8F6"/>';
        g += `<path d="M4 0C-12 ${wy - 12} -44 ${wy - 22} -84 ${wy - 10}C-62 ${wy - 2} -36 ${wy + 8} -14 8Z" fill="#F4F2FB"/>`;
        g += `<path d="M-84 ${wy - 10}C-70 ${wy - 16} -58 ${wy - 17} -48 ${wy - 16}L-44 ${wy - 6}C-56 ${wy - 6} -70 ${wy - 6} -84 ${wy - 10}Z" fill="#2A2860"/>`;
        g += `<path d="M-44 ${wy - 6}C-30 ${wy - 2} -20 ${wy + 4} -14 8" fill="none" stroke="#2A2860" stroke-width="3" stroke-opacity="0.8"/>`;
        g += `<path d="M2 0C-14 ${wy - 8} -40 ${wy - 16} -64 ${wy - 10}" stroke="#FFE2C2" stroke-width="2.4" fill="none" stroke-opacity="0.8"/>`;
        return `<g transform="translate(${n(x)} ${n(y)}) scale(${s})">${g}</g>`;
      }
      parts.push({ svg: pelican(470, 560, 0.62, true) + pelican(560, 592, 0.56, false) + pelican(640, 616, 0.5, true) });
    }

    // The sun disc.
    {
      const sd = k.id('sun');
      parts.push({
        defs: k.linear(sd, 90, [[0, '#FFFCF2'], [0.55, '#FFF1CF'], [1, '#FFD99A']]),
        svg: `<circle cx="${SX}" cy="${SY}" r="${SR + 22}" fill="#FFF3DA" fill-opacity="0.45"/><circle cx="${SX}" cy="${SY}" r="${SR}" fill="url(#${sd})"/>`,
      });
    }

    // ---- far bank: bluffs, patchwork farmland, wooded shore -------------------------
    {
      const far = k.id('far');
      parts.push({
        defs: k.linear(far, 90, [[0, '#C7B3D9'], [1, '#E9CDD6']]),
        svg: `<path d="${k.ridge({ y: 884, amp: 8, seed: 14, step: 24, bottom: HZ + 10, peaks: [[160, 120, 380, 1.3], [520, 50, 220], [1380, 70, 300, 1.2], [1720, 110, 300, 1.3], [2060, 140, 300]] })}" fill="url(#${far})"/>`,
      });
      parts.push(k.haze(800, 110, '#FCE3C9', 0.6));

      // Patchwork farmland rolling down to the far bank (left page).
      const fg = k.id('farm'), fc = k.id('farmc');
      const top = [[-30, 842], [140, 826], [330, 838], [520, 858], [700, 880], [860, 900]];
      let s = `<clipPath id="${fc}"><path d="${band(top)}"/></clipPath>`;
      s += `<path d="${band(top)}" fill="url(#${fg})"/>`;
      let g = `<g clip-path="url(#${fc})">`;
      const cols = ['#E8D09A', '#C9CFA0', '#E9C38E', '#BFC79E', '#EED8A6', '#D4C99A'];
      for (let i = 0; i < 6; i++) {
        const off = 6 + i * 11;
        g += `<path d="${smooth(top.map((p) => [p[0], p[1] + off]))}" fill="none" stroke="${cols[i]}" stroke-width="9" stroke-opacity="0.8"/>`;
      }
      // field boundaries running down the slope, and hedgerow clumps
      const rf = rng(321);
      let hedge = '';
      for (let x = 20; x < 760; x += 60 + rf() * 60) {
        g += `<path d="M${n(x)} 820L${n(x + 40 + rf() * 30)} 910" stroke="#C3A6BC" stroke-width="2" stroke-opacity="0.45"/>`;
        for (let j = 0; j < 3; j++) hedge += `<circle cx="${n(x + 6 + j * 9 + rf() * 6)}" cy="${n(838 + (x / 760) * 46 + rf() * 8)}" r="${n(4 + rf() * 4)}"/>`;
      }
      g += `<g fill="#A99BBF" fill-opacity="0.75">${hedge}</g>`;
      // a far farmstead: tiny barn and silo
      g += `<rect x="604" y="852" width="20" height="16" fill="#C9878E"/><path d="M602 853L614 842L626 853Z" fill="#9C8CB8"/><rect x="590" y="836" width="8" height="32" fill="#B9B6DA"/><path d="M590 836Q594 830 598 836Z" fill="#D9D6EC"/>`;
      g += `</g>`;
      s += g;
      s += `<path d="${band(top)}" fill="#FBE6D3" fill-opacity="0.32"/>`;
      parts.push({ defs: k.linear(fg, 90, [[0, '#E6CDA7'], [1, '#D7C0A8']]), svg: s });

      // Wooded far shore: a row of soft round crowns along the whole river.
      const mid = k.id('mid');
      const r = rng(77);
      let d = '';
      for (let x = 640; x < k.W + 30; x += 12 + r() * 14) {
        const rad = 7 + r() * 10 + (x > 1400 ? 3 : 0);
        d += `M${n(x - rad)} ${HZ + 2}a${n(rad)} ${n(rad * 0.9)} 0 0 1 ${n(rad * 2)} 0Z`;
      }
      parts.push({
        defs: k.linear(mid, 90, [[0, '#B4A2CF'], [1, '#CDB6D2']]),
        svg: `<path d="${d}" fill="url(#${mid})"/><path d="M600 ${HZ + 3}L${k.W + 20} ${HZ + 3}V${HZ - 3}H600Z" fill="url(#${mid})"/>`,
      });
    }

    // ---- the river -------------------------------------------------------------------
    {
      const river = k.id('river'), warm = k.id('rwarm'), glow = k.id('rglow');
      parts.push({
        defs: lgU(river, 0, HZ, 0, k.H, [[0, '#F4D0B6'], [0.07, '#E1C0D2'], [0.22, '#B5A8DE'], [0.5, '#8187D4'], [1, '#4F56BA']]) +
          lgU(warm, 0, HZ, 0, HZ + 120, [[0, '#FFE2BE', 0.7], [1, '#FFE2BE', 0]]) +
          k.radial(glow, '50%', '0%', '100%', [[0, '#FFE6B4', 0.9], [0.4, '#FCCB98', 0.4], [1, '#F8B98E', 0]]),
        svg: `<rect x="-20" y="${HZ - 2}" width="${k.W + 40}" height="${k.H - HZ + 30}" fill="url(#${river})"/>` +
          `<rect x="-20" y="${HZ}" width="${k.W + 40}" height="120" fill="url(#${warm})"/>` +
          `<rect x="${SX - 210}" y="${HZ}" width="420" height="420" fill="url(#${glow})"/>`,
      });
      const r = rng(4242);
      // Sky streaks mirrored in the water: long soft horizontal bands.
      let mir = '';
      for (let i = 0; i < 26; i++) {
        const t = r();
        const y = HZ + 8 + 230 * t * t;
        const x = -20 + r() * (k.W + 40), L = 120 + r() * 320;
        mir += `<rect x="${n(x)}" y="${n(y)}" width="${n(L)}" height="${n(3 + t * 5)}" rx="2" fill="${r() < 0.5 ? '#FBE0CB' : '#E9D6EE'}" fill-opacity="${n(0.35 + r() * 0.3)}"/>`;
      }
      // Ripples: lighter dashes and deeper troughs, widening toward us.
      let rip = '', deep = '';
      for (let i = 0; i < 560; i++) {
        const t = r();
        const y = HZ + 6 + (k.H - HZ) * t * t;
        const x = -20 + r() * (k.W + 40);
        const L = 10 + 80 * t + r() * 40 * t;
        if (r() < 0.55) rip += `M${n(x)} ${n(y)}h${n(L)}`;
        else deep += `M${n(x)} ${n(y)}q${n(L / 2)} ${n(2 + t * 3)} ${n(L)} 0`;
      }
      // Glitter path under the sun.
      let glit = '';
      for (let y = HZ + 4; y < 1330; y += 5 + (y - HZ) * 0.025) {
        const spread = 26 + (y - HZ) * 0.42;
        const count = 2 + Math.floor(r() * 3);
        for (let i = 0; i < count; i++) {
          const cx = SX + (r() - 0.5) * 2 * spread * (0.3 + 0.7 * r());
          const w = 8 + r() * (18 + (y - HZ) * 0.15);
          glit += `M${n(cx - w / 2)} ${n(y)}h${n(w)}`;
        }
      }
      parts.push({
        svg: mir +
          `<path d="${rip}" stroke="#E2DCF8" stroke-width="2.8" stroke-opacity="0.34" stroke-linecap="round"/>` +
          `<path d="${deep}" stroke="#3E46A6" stroke-width="2.6" stroke-opacity="0.24" fill="none" stroke-linecap="round"/>` +
          `<path d="${glit}" stroke="#FFF0CC" stroke-width="3.4" stroke-opacity="0.85" stroke-linecap="round"/>`,
      });
    }

    // ---- left page: the near bank ----------------------------------------------------
    const crest = [[-20, 1030], [200, 1022], [420, 1032], [620, 1050], [760, 1072], [860, 1104], [930, 1156], [985, 1240], [1030, 1370], [1070, 1600]];
    const land = k.id('land');
    {
      const lg = k.id('lg'), sand = k.id('sand');
      // A sandbar along the river edge of the bank: wider toward us, a darker
      // wet line where it meets the water, a few ripples lapping it.
      const beach = [[600, 1052], [760, 1080], [880, 1124], [968, 1196], [1030, 1300], [1080, 1440], [1110, 1600]];
      const wet = beach.map((p) => [p[0] + 3, p[1] + 3]);
      let lap = '';
      for (let i = 1; i < 3; i++) lap += smooth(beach.slice(1).map((p) => [p[0] + 6 + i * 9, p[1] + i * 7]));
      parts.push({
        defs: `<clipPath id="${land}"><path d="${band(crest)}"/></clipPath>` +
          lgU(lg, 0, 1020, 0, 1200, [[0, '#D8D49A'], [1, '#B6C88C']]) +
          lgU(sand, 0, 1050, 0, 1600, [[0, '#F6DDB6'], [1, '#E2B894']]),
        svg: `<path d="${smooth(wet)}L1110 1620L-20 1620L-20 1060Z" fill="#9C86B8" fill-opacity="0.55"/>` +
          `<path d="${smooth(beach)}L1110 1620L-20 1620L-20 1060Z" fill="url(#${sand})"/>` +
          `<path d="${lap}" fill="none" stroke="#FFF4E4" stroke-width="2.4" stroke-opacity="0.4" stroke-dasharray="60 24 18 30" stroke-linecap="round"/>` +
          `<path d="${band(crest)}" fill="url(#${lg})"/>` +
          `<path d="${smooth(crest.slice(3))}" fill="none" stroke="#7E9C6A" stroke-width="4" stroke-opacity="0.5"/>`,
      });
    }

    // Rolling fields, clipped to the land.
    const H2 = [[-20, 1150], [180, 1128], [420, 1146], [650, 1196], [860, 1266], [1000, 1350], [1060, 1400]];
    const H3 = [[-20, 1336], [260, 1296], [560, 1318], [820, 1398], [1060, 1500]];
    const H4 = [[-20, 1478], [300, 1452], [640, 1478], [1060, 1580]];
    {
      const g1 = k.id('h1'), g2 = k.id('h2'), g3 = k.id('h3'), g4 = k.id('h4');
      let s = `<g clip-path="url(#${land})">`;
      // H1 — the knoll the farm stands on: meadow with mown contour lines.
      let rows = '';
      for (let i = 1; i < 9; i++) rows += smooth(crest.slice(0, 7).map((p) => [p[0], p[1] + i * 13 + i * i * 0.6]));
      s += `<path d="${rows}" fill="none" stroke="#9FB67E" stroke-width="3" stroke-opacity="0.45"/>`;
      // H2 — gold hay field, mowing stripes following the contour.
      s += `<path d="${band(H2)}" fill="url(#${g2})"/>`;
      rows = '';
      for (let i = 1; i < 12; i++) {
        const off = i * 9 + i * i * 1.4;
        rows += smooth(H2.map((p) => [p[0], p[1] + off]));
      }
      s += `<path d="${rows}" fill="none" stroke="#D29A4C" stroke-width="5" stroke-opacity="0.32"/>`;
      s += `<path d="${smooth(H2)}" fill="none" stroke="#FFE7B0" stroke-width="5" stroke-opacity="0.75"/>`;
      // H3 — green crop rows curving over the hill.
      s += `<path d="${band(H3)}" fill="url(#${g3})"/>`;
      rows = '';
      for (let i = 1; i < 16; i++) {
        const off = i * 8 + i * i * 0.9;
        rows += smooth(H3.map((p) => [p[0], p[1] + off]));
      }
      s += `<path d="${rows}" fill="none" stroke="#5E8E66" stroke-width="5" stroke-opacity="0.38"/>`;
      s += `<path d="${smooth(H3)}" fill="none" stroke="#E2E6A6" stroke-width="5" stroke-opacity="0.7"/>`;
      // H4 — the near wheat: gold with fine stalk strokes.
      s += `<path d="${band(H4)}" fill="url(#${g4})"/>`;
      const r = rng(818);
      let st = '';
      for (let i = 0; i < 380; i++) {
        const x = -20 + r() * 1060, y = 1470 + r() * 120;
        const L = 16 + r() * 24;
        st += `M${n(x)} ${n(y)}q${n(2 - r() * 4)} ${n(-L / 2)} ${n(3 - r() * 6)} ${n(-L)}`;
      }
      s += `<path d="${st}" fill="none" stroke="#C98E3E" stroke-width="2.6" stroke-opacity="0.5" stroke-linecap="round"/>`;
      s += `<path d="${smooth(H4)}" fill="none" stroke="#FFE3A6" stroke-width="5" stroke-opacity="0.7"/>`;
      s += `</g>`;
      parts.push({
        defs: k.linear(g1, 90, [[0, '#D8D49A'], [1, '#B6C88C']]) +
          lgU(g2, 0, 1130, 0, 1400, [[0, '#F7D98E'], [1, '#EAB566']]) +
          lgU(g3, 0, 1290, 0, 1520, [[0, '#BFD08C'], [1, '#8CB07A']]) +
          lgU(g4, 0, 1450, 0, 1572, [[0, '#F4C977'], [1, '#E3A15A']]),
        svg: s,
      });
    }

    // The farm lane, winding down from the barn doors, and a split-rail fence.
    {
      const lane = k.id('lane');
      let s = `<g clip-path="url(#${land})">`;
      s += `<path d="M548 1108C560 1150 610 1190 640 1240C676 1300 690 1380 700 1460C706 1520 704 1560 700 1600L800 1600C800 1540 796 1470 780 1400C760 1310 712 1240 676 1190C650 1154 600 1130 582 1108Z" fill="url(#${lane})"/>`;
      s += `<path d="M566 1112C590 1150 640 1200 668 1250C700 1310 720 1400 728 1480" fill="none" stroke="#C9A78E" stroke-width="4" stroke-opacity="0.35"/>`;
      // fence posts along the right of the lane, growing toward us
      const pts = [[606, 1124, 0.42], [646, 1150, 0.5], [690, 1186, 0.6], [736, 1234, 0.72], [782, 1296, 0.86], [824, 1372, 1.02], [860, 1466, 1.22], [888, 1580, 1.45]];
      let posts = '', rail1 = [], rail2 = [];
      for (const [x, y, sc] of pts) {
        const h = 64 * sc, w = 7 * sc;
        posts += `<rect x="${n(x - w / 2)}" y="${n(y - h)}" width="${n(w)}" height="${n(h)}" rx="${n(w * 0.3)}"/>`;
        rail1.push([x, y - h * 0.82]);
        rail2.push([x, y - h * 0.42]);
      }
      s += `<path d="${smooth(rail1)}${smooth(rail2)}" fill="none" stroke="#7C5C6E" stroke-width="5" stroke-linecap="round"/>`;
      s += `<g fill="#6B4E66">${posts}</g>`;
      s += `<path d="${smooth(rail1.map((p) => [p[0], p[1] - 2]))}" fill="none" stroke="#F4C69A" stroke-width="2" stroke-opacity="0.7"/>`;
      s += `</g>`;
      parts.push({ defs: lgU(lane, 0, 1110, 0, 1572, [[0, '#EFD6B2'], [1, '#E3BC94']]), svg: s });
    }

    // Round hay bales on the gold field, lit on the right, shadows to the left.
    {
      const hb = k.id('hb'), face = k.id('face');
      let s = '';
      const bales = [[290, 1176, 24], [380, 1196, 28], [800, 1262, 30], [880, 1300, 34], [760, 1330, 38]];
      for (const [x, y, r] of bales) {
        s += `<ellipse cx="${n(x - r * 0.9)}" cy="${n(y + r * 0.96)}" rx="${n(r * 1.6)}" ry="${n(r * 0.26)}" fill="#7A5E8E" fill-opacity="0.26"/>`;
        s += `<path d="M${n(x - r * 0.95)} ${n(y + r)}V${n(y - r * 0.55)}Q${n(x - r * 0.95)} ${n(y - r * 1.02)} ${n(x - r * 0.3)} ${n(y - r)}H${n(x + r * 0.5)}V${n(y + r)}Z" fill="url(#${hb})"/>`;
        s += `<path d="M${n(x - r * 0.8)} ${n(y - r * 0.2)}H${n(x + r * 0.4)}M${n(x - r * 0.85)} ${n(y + r * 0.35)}H${n(x + r * 0.4)}" stroke="#B9813E" stroke-width="2" stroke-opacity="0.45"/>`;
        s += `<ellipse cx="${n(x + r * 0.5)}" cy="${n(y)}" rx="${n(r * 0.6)}" ry="${n(r)}" fill="url(#${face})"/>`;
        s += `<path d="M${n(x + r * 0.5)} ${n(y - r * 0.6)}a${n(r * 0.36)} ${n(r * 0.6)} 0 1 1 -0.1 0M${n(x + r * 0.5)} ${n(y - r * 0.28)}a${n(r * 0.17)} ${n(r * 0.28)} 0 1 1 -0.1 0" fill="none" stroke="#C88A3C" stroke-width="2" stroke-opacity="0.55"/>`;
      }
      parts.push({
        defs: k.linear(hb, 90, [[0, '#EDBE6C'], [1, '#C48A45']]) + k.radial(face, '45%', '40%', '65%', [[0, '#FFEBB4'], [1, '#EDB863']]),
        svg: s,
      });
    }

    // ---- silo and barn -------------------------------------------------------------
    {
      const siloG = k.id('silo'), domeG = k.id('dome'), redF = k.id('redf'), redS = k.id('reds'), roofF = k.id('rooff'), roofS = k.id('roofs');
      let s = '';
      // Yard.
      s += `<ellipse cx="590" cy="1110" rx="260" ry="26" fill="#B2C688"/>`;
      // Shadows cast to the left, away from the sun.
      s += `<path d="M440 1108L270 1124L300 1140L660 1132L660 1108Z" fill="#6E5A9A" fill-opacity="0.16"/>`;
      // Silo (behind-left of the barn): a blue Harvestore cylinder with a pale dome.
      const sx0 = 364, sx1 = 438, stop = 712, sb = 1102;
      s += `<rect x="${sx0}" y="${stop}" width="${sx1 - sx0}" height="${sb - stop}" fill="url(#${siloG})"/>`;
      let ribs = '';
      for (let y = stop + 30; y < sb; y += 30) ribs += `M${sx0} ${y}q${(sx1 - sx0) / 2} 6 ${sx1 - sx0} 0`;
      s += `<path d="${ribs}" fill="none" stroke="#1E2A82" stroke-width="2.4" stroke-opacity="0.45"/>`;
      s += `<path d="M${sx1 - 16} ${stop + 8}V${sb - 6}" stroke="#B4C0FF" stroke-width="6" stroke-opacity="0.45"/>`;
      s += `<path d="M${sx1 - 4} ${stop + 4}V${sb - 4}" stroke="#FFC9A0" stroke-width="3" stroke-opacity="0.55"/>`;
      s += `<path d="M${sx0 + 10} ${stop + 20}V${sb}" stroke="#2A2F6E" stroke-width="3" stroke-opacity="0.5"/>`;
      s += `<path d="M${sx0 - 3} ${stop}Q${(sx0 + sx1) / 2} ${stop - 58} ${sx1 + 3} ${stop}Z" fill="url(#${domeG})"/>`;
      s += `<rect x="${(sx0 + sx1) / 2 - 6}" y="${stop - 54}" width="12" height="9" rx="3" fill="#8F95C9"/>`;
      // Barn: gable end facing us, the long side receding right into the light.
      const L = 446, R = 664, base = 1112, eave = 980, brk = 906, peak = 852, bx = 22;
      const cx = (L + R) / 2;
      const gable = `M${L} ${base}V${eave}L${L + bx} ${brk}L${cx} ${peak}L${R - bx} ${brk}L${R} ${eave}V${base}Z`;
      const SRx = 780, sEave = 994, sBase = 1102, sBrk = 928, sPeak = 880;
      s += `<path d="M${R} ${eave}L${SRx} ${sEave}L${SRx} ${sBase}L${R} ${base}Z" fill="url(#${redS})"/>`;
      // Side windows, catching the sun.
      for (let i = 0; i < 3; i++) {
        const wx = R + 22 + i * 36, wy = eave + 42 + i * 2;
        s += `<path d="M${wx} ${wy}l20 2.5v24l-20 -2.5Z" fill="#FFE2B0"/><path d="M${wx} ${wy}l20 2.5v24l-20 -2.5ZM${wx + 10} ${wy + 1}v24" fill="none" stroke="#FFF6EA" stroke-width="2.6"/>`;
      }
      let sid = '';
      for (let x = R + 12; x < SRx; x += 12) sid += `M${x} ${n(eave + (x - R) * (sEave - eave) / (SRx - R))}V${n(base - (x - R) * (base - sBase) / (SRx - R))}`;
      s += `<path d="${sid}" stroke="#B0414E" stroke-width="2" stroke-opacity="0.3"/>`;
      s += `<path d="M${R} ${base - 4}L${SRx} ${sBase - 3}" stroke="#7A2C47" stroke-width="5" stroke-opacity="0.35"/>`;
      // Side roof planes (lower and upper slopes), lit warm on the ridge.
      s += `<path d="M${R} ${eave}L${R - bx} ${brk}L${SRx - 18} ${sBrk}L${SRx + 6} ${sEave + 2}Z" fill="url(#${roofS})"/>`;
      s += `<path d="M${R - bx} ${brk}L${cx} ${peak}L${SRx - 100} ${sPeak}L${SRx - 18} ${sBrk}Z" fill="url(#${roofS})" fill-opacity="0.9"/>`;
      s += `<path d="M${R - bx} ${brk}L${SRx - 18} ${sBrk}" stroke="#2F3586" stroke-width="3" stroke-opacity="0.4"/>`;
      s += `<path d="M${cx} ${peak}L${SRx - 100} ${sPeak}" stroke="#FFE3C0" stroke-width="4" stroke-opacity="0.75"/>`;
      s += `<path d="M${R} ${eave}L${SRx + 6} ${sEave + 2}" stroke="#FFD2A8" stroke-width="3" stroke-opacity="0.6"/>`;
      // Gable front with board siding.
      s += `<clipPath id="${redF}c"><path d="${gable}"/></clipPath>`;
      s += `<path d="${gable}" fill="url(#${redF})"/>`;
      let fsid = '';
      for (let x = L + 12; x < R; x += 12) fsid += `M${x} ${base}V${peak}`;
      s += `<path d="${fsid}" stroke="#8E3048" stroke-width="2" stroke-opacity="0.28" clip-path="url(#${redF}c)"/>`;
      s += `<path d="M${L} ${base}H${R}V${base - 60}H${L}Z" fill="#6B2A54" fill-opacity="0.12" clip-path="url(#${redF}c)"/>`;
      // Roof edge at the gable (dark fascia) and white trim.
      s += `<path d="M${L - 10} ${eave + 6}L${L + bx - 2} ${brk - 2}L${cx} ${peak - 8}L${R - bx + 2} ${brk - 2}L${R + 10} ${eave + 6}" fill="none" stroke="url(#${roofF})" stroke-width="15" stroke-linejoin="round"/>`;
      s += `<path d="M${L} ${eave + 13}L${L + bx + 4} ${brk + 6}L${cx} ${peak + 6}L${R - bx - 4} ${brk + 6}L${R} ${eave + 13}" fill="none" stroke="#FFF6EE" stroke-width="5" stroke-linejoin="round"/>`;
      s += `<path d="M${L + 2} ${eave + 13}V${base}M${R - 2} ${eave + 13}V${base}" stroke="#FFF6EE" stroke-width="5"/>`;
      // Big doors with white X-bracing; hayloft door above.
      const dL = cx - 56, dR = cx + 56, dT = 1000;
      s += `<rect x="${dL}" y="${dT}" width="${dR - dL}" height="${base - dT}" fill="#B23F4B"/>`;
      s += `<path d="M${dL} ${dT}H${dR}V${base}H${dL}ZM${cx} ${dT}V${base}M${dL} ${dT}L${cx} ${base}M${cx} ${dT}L${dL} ${base}M${cx} ${dT}L${dR} ${base}M${dR} ${dT}L${cx} ${base}" fill="none" stroke="#FFF6EE" stroke-width="5"/>`;
      s += `<path d="M${dL - 8} ${dT - 8}H${dR + 8}" stroke="#4B4F9E" stroke-width="5" stroke-linecap="round"/>`;
      const hL = cx - 24, hR = cx + 24, hT = 910, hB = 964;
      s += `<rect x="${hL}" y="${hT}" width="48" height="${hB - hT}" fill="#7A2C47"/>`;
      s += `<path d="M${hL} ${hT}H${hR}V${hB}H${hL}ZM${hL} ${hT}L${hR} ${hB}M${hR} ${hT}L${hL} ${hB}" fill="none" stroke="#FFF6EE" stroke-width="4"/>`;
      // Hay hood at the peak.
      s += `<path d="M${cx - 28} ${peak + 32}L${cx} ${peak + 4}L${cx + 28} ${peak + 32}L${cx + 28} ${peak + 42}L${cx} ${peak + 15}L${cx - 28} ${peak + 42}Z" fill="#3E4392"/>`;
      // Cupola on the ridge, with a weathervane.
      const cpx = cx + 60, cpy = peak + 5;
      s += `<path d="M${cpx - 16} ${cpy}V${cpy - 30}H${cpx + 20}V${cpy + 4}Z" fill="#F5E9E4"/><path d="M${cpx - 3} ${cpy - 26}h11v16h-11Z" fill="#7A6AA6"/>`;
      s += `<path d="M${cpx - 24} ${cpy - 28}L${cpx + 2} ${cpy - 48}L${cpx + 28} ${cpy - 28}Z" fill="#3E4392"/>`;
      s += `<path d="M${cpx + 2} ${cpy - 48}V${cpy - 78}M${cpx - 12} ${cpy - 68}h28" stroke="#2A2F6E" stroke-width="3"/><path d="M${cpx + 16} ${cpy - 68}l-8 -6v12Z" fill="#2A2F6E"/>`;
      // Sun-catching edge on the gable's right side.
      s += `<path d="M${R - 3} ${eave + 16}V${base}" stroke="#FFB08A" stroke-width="5" stroke-opacity="0.6"/>`;
      parts.push({
        defs: k.linear(siloG, 0, [[0, '#26318E'], [0.55, '#3C4CC0'], [0.82, '#6C7EE6'], [1, '#4A58C4']]) +
          k.linear(domeG, 0, [[0, '#B7B8DF'], [0.7, '#F4F2FB'], [1, '#E9DCEB']]) +
          k.linear(redF, 90, [[0, '#C84A55'], [0.7, '#D25856'], [1, '#B6434F']]) +
          k.linear(redS, 0, [[0, '#E56A5A'], [1, '#F7A276']]) +
          k.linear(roofF, 0, [[0, '#2E3488'], [1, '#4B52B0']]) +
          k.linear(roofS, 90, [[0, '#6068C6'], [1, '#9093DA']]),
        svg: s,
      });
    }

    // Grass tufts along the bank edge, and young willows where it turns toward us.
    {
      const r = rng(97);
      let g = '', lit = '';
      const edge = sample([[800, 1084], [860, 1106], [910, 1140], [950, 1206], [982, 1300], [1012, 1420]], 7);
      edge.forEach(([x, y], i) => {
        if (i % 2) return;
        const h = 14 + r() * 16 + (y - 1050) * 0.08;
        for (let j = 0; j < 5; j++) {
          const bx = x - 8 + j * 4 + r() * 3, lean = (r() - 0.5) * h * 0.8;
          g += `M${n(bx)} ${n(y + 4)}q${n(lean * 0.3)} ${n(-h * 0.6)} ${n(lean)} ${n(-h)}`;
          if (j === 3) lit += `M${n(bx)} ${n(y + 2)}q${n(lean * 0.3)} ${n(-h * 0.6)} ${n(lean)} ${n(-h)}`;
        }
      });
      // willows: a slim trunk and a few soft, drooping crowns, lit from the upper left (the sun)
      function willow(x, y, h, seed) {
        const rr = rng(seed);
        const gid = k.id('wil');
        const defs = lgU(gid, x - h * 0.4, y - h, x + h * 0.4, y - h * 0.3, [[0, '#B9C886'], [0.45, '#7DA06E'], [1, '#3E6A60']]);
        let t = `<path d="${taper([[x, y], [x + h * 0.04, y - h * 0.45], [x - h * 0.02, y - h * 0.8]], h * 0.07, h * 0.025)}" fill="#6E5C80"/>`;
        const blobs = [[0, -0.78, 0.36, 0.3], [-0.24, -0.6, 0.28, 0.26], [0.24, -0.58, 0.3, 0.27], [0.02, -0.5, 0.3, 0.22]];
        blobs.forEach(([bx, by, rx, ry], i) => {
          t += `<path d="${scallop(x + bx * h, y + by * h, rx * h, ry * h, 9, seed + i * 3, 0.45, 0.14)}" fill="url(#${gid})"/>`;
        });
        // drooping strands
        let dr = '';
        for (let i = 0; i < 9; i++) {
          const sx = x + (rr() - 0.5) * h * 0.7, sy = y - h * (0.5 + rr() * 0.2);
          dr += `M${n(sx)} ${n(sy)}q${n((rr() - 0.5) * 6)} ${n(h * 0.14)} ${n((rr() - 0.5) * 10)} ${n(h * 0.22)}`;
        }
        t += `<path d="${dr}" fill="none" stroke="#3E6A60" stroke-width="3" stroke-linecap="round" stroke-opacity="0.6"/>`;
        t += `<path d="${scallop(x - h * 0.08, y - h * 0.84, h * 0.18, h * 0.1, 7, seed + 40, 0.5, 0.1)}" fill="#F1DC9E" fill-opacity="0.6"/>`;
        return { defs, svg: t };
      }
      const w1 = willow(930, 1176, 150, 4100), w2 = willow(888, 1126, 104, 4200);
      parts.push({
        defs: w1.defs + w2.defs,
        svg: w2.svg + `<path d="${g}" fill="none" stroke="#5E8A62" stroke-width="2.6" stroke-linecap="round"/>` +
          `<path d="${lit}" fill="none" stroke="#E9D48E" stroke-width="2" stroke-linecap="round" stroke-opacity="0.8"/>` + w1.svg,
      });
    }

    // ---- the cottonwood, framing the left edge -------------------------------------
    {
      const bark = k.id('bark'), barkL = k.id('barkl'), gD = k.id('crownd'), gM = k.id('crownm');
      const tx = 112, ty = 1112;
      let s = '';
      // Trunk: a broad flared base forking into heavy limbs.
      const trunk = `M${tx - 74} ${ty + 6}C${tx - 48} ${ty - 10} ${tx - 42} ${ty - 60} ${tx - 42} ${ty - 120}C${tx - 42} ${ty - 180} ${tx - 52} ${ty - 230} ${tx - 50} ${ty - 262}L${tx + 24} ${ty - 270}C${tx + 36} ${ty - 220} ${tx + 38} ${ty - 160} ${tx + 42} ${ty - 110}C${tx + 46} ${ty - 50} ${tx + 58} ${ty - 10} ${tx + 88} ${ty + 6}Z`;
      const limbs = [
        [[[tx - 18, ty - 220], [tx - 70, ty - 350], [tx - 160, ty - 455], [tx - 240, ty - 530]], 62, 20],
        [[[tx - 2, ty - 230], [tx + 18, ty - 400], [tx + 8, ty - 540], [tx - 6, ty - 640]], 56, 18],
        [[[tx + 10, ty - 222], [tx + 84, ty - 340], [tx + 162, ty - 428], [tx + 210, ty - 510]], 50, 16],
        [[[tx + 14, ty - 440], [tx + 70, ty - 520], [tx + 104, ty - 590], [tx + 112, ty - 640]], 28, 12],
        [[[tx - 110, ty - 420], [tx - 130, ty - 510], [tx - 120, ty - 600]], 24, 8],
        [[[tx + 150, ty - 410], [tx + 220, ty - 420], [tx + 270, ty - 460]], 20, 8],
      ];
      let wood = `<path d="${trunk}"/>`;
      for (const [p, w0, w1] of limbs) wood += `<path d="${taper(p, w0, w1)}"/><circle cx="${p[0][0]}" cy="${p[0][1]}" r="${n(w0 / 2)}"/><circle cx="${p[p.length - 1][0]}" cy="${p[p.length - 1][1]}" r="${n(w1 / 2)}"/>`;
      let tr = `<clipPath id="${bark}c"><path d="${trunk}"/></clipPath>`;
      const rb = rng(31);
      let fur = '';
      for (let i = 0; i < 17; i++) {
        const x = tx - 54 + i * 7 + rb() * 4;
        fur += `M${n(x)} ${ty + 4}q${n(-4 + rb() * 8)} -60 ${n(-2 + rb() * 4)} -120q${n(-4 + rb() * 8)} -60 ${n(-6 + rb() * 6)} -150`;
      }
      tr += `<path d="${fur}" fill="none" stroke="#3E345E" stroke-width="2.6" stroke-opacity="0.45" clip-path="url(#${bark}c)"/>`;
      tr += `<path d="M${tx + 24} ${ty - 266}C${tx + 36} ${ty - 210} ${tx + 38} ${ty - 160} ${tx + 42} ${ty - 110}C${tx + 46} ${ty - 50} ${tx + 58} ${ty - 10} ${tx + 84} ${ty + 4}" fill="none" stroke="url(#${barkL})" stroke-width="10" stroke-opacity="0.8" clip-path="url(#${bark}c)"/>`;
      tr += `<path d="M${tx - 64} ${ty - 290}H${tx + 44}V${ty - 214}Q${tx - 10} ${ty - 196} ${tx - 64} ${ty - 226}Z" fill="#2E2A5E" fill-opacity="0.38" clip-path="url(#${bark}c)"/>`;
      s += `<ellipse cx="${tx - 70}" cy="${ty + 8}" rx="180" ry="16" fill="#5E4E8A" fill-opacity="0.22"/>`;

      // Crown: broad, slightly flat-topped clumps at the limb ends. One shared
      // gradient for the dark body and one for the lit lobes, so the crown
      // shades as a single form: deep blue-green at the lower left, warm
      // yellow-green to gold toward the sun at the upper right.
      // [dx, cy, rx, ry, layer, rim-lit 0..1]
      const masses = [
        [-130, 560, 130, 78, 0, 0], [40, 430, 136, 78, 0, 0.6], [200, 476, 112, 70, 0, 0.9],
        [-40, 650, 146, 84, 1, 0], [130, 570, 140, 84, 1, 0.5], [262, 612, 92, 64, 1, 1], [100, 376, 96, 54, 1, 0.9], [-176, 700, 100, 66, 1, 0],
        [-96, 790, 124, 62, 2, 0], [74, 748, 128, 66, 2, 0.4], [214, 728, 86, 52, 2, 1],
      ];
      const rl = rng(1903);
      const back = [], front = [];
      masses.forEach(([dx, cy, rx, ry, layer, lit], i) => {
        const cx = tx + dx;
        let m = `<path d="${scallop(cx, cy, rx, ry, 12 + (i % 3), 700 + i * 13, 0.42, 0.1)}" fill="url(#${gD})"/>`;
        // lit lobe toward the upper right, and a crescent of shadow underneath
        m += `<path d="${scallop(cx + rx * 0.14, cy - ry * 0.2, rx * 0.78, ry * 0.66, 10 + (i % 2), 760 + i * 11, 0.45, 0.12)}" fill="url(#${gM})" fill-opacity="${layer === 0 ? 0.75 : 0.92}"/>`;
        m += `<path d="${scallop(cx - rx * 0.1, cy + ry * 0.52, rx * 0.7, ry * 0.3, 9, 900 + i * 7, 0.4, 0.1)}" fill="#152C48" fill-opacity="0.32"/>`;
        if (lit > 0) m += `<path d="${scallop(cx + rx * 0.42, cy - ry * 0.4, rx * 0.34 * (0.6 + lit * 0.4), ry * 0.26, 8, 820 + i * 5, 0.5, 0.12)}" fill="#F4DC9C" fill-opacity="${n(0.16 + lit * 0.26)}"/>`;
        // leaf flecks: light on the lit upper-right rim, dark low in the clump
        let lf = '', df = '';
        for (let j = 0; j < 22; j++) {
          const lt = j < 12;
          const a = lt ? -1.9 + rl() * 1.8 : 0.6 + rl() * 2.0;
          const d = 0.55 + rl() * 0.4;
          const lx = cx + Math.cos(a) * rx * d, ly = cy + Math.sin(a) * ry * d;
          const s2 = 2.6 + rl() * 2.6;
          const e = `M${n(lx - s2)} ${n(ly)}q${n(s2)} ${n(-s2 * 1.1)} ${n(s2 * 2)} 0q${n(-s2)} ${n(s2 * 0.6)} ${n(-s2 * 2)} 0Z`;
          if (lt) lf += e; else df += e;
        }
        m += `<path d="${lf}" fill="#F6E3A8" fill-opacity="${n(0.18 + lit * 0.3)}"/><path d="${df}" fill="#132A44" fill-opacity="0.3"/>`;
        (layer === 0 ? back : front).push(m);
      });
      s += back.join('');
      s += `<g fill="url(#${bark})">${wood}</g>` + tr;
      s += `<path d="${smooth([[tx + 120, ty - 640], [tx + 160, ty - 700], [tx + 150, ty - 760]])}${smooth([[tx - 150, ty - 470], [tx - 200, ty - 470], [tx - 250, ty - 500]])}" fill="none" stroke="#4E4472" stroke-width="6" stroke-linecap="round"/>`;
      s += front.join('');
      parts.push({
        defs: lgU(gD, tx - 300, 880, tx + 340, 320, [[0, '#18304E'], [0.45, '#24485A'], [0.8, '#3A6A60'], [1, '#5A8A66']]) +
          lgU(gM, tx - 280, 860, tx + 360, 330, [[0, '#2F5C5A'], [0.35, '#55845F'], [0.65, '#8AAE70'], [0.85, '#BFC67E'], [1, '#E8CF8C']]) +
          k.linear(bark, 0, [[0, '#4C4170'], [0.55, '#7C6A8C'], [0.85, '#B39696'], [1, '#E7B28C']]) +
          k.linear(barkL, 90, [[0, '#FFD3A6', 0.2], [1, '#FFC79A', 1]]),
        svg: s,
      });
    }

    // ---- right page: the steamboat --------------------------------------------------
    const WL = 1274;                      // waterline
    const BOW = 1182, STERN = 1786;       // hull ends
    const WR = 132, WX = 1912, WY = WL - 72; // paddlewheel
    const MD = WL - 52;                   // main deck (top of the guards)
    const BS = 1086, BU = 1100;           // boiler-deck slab top / underside
    const HS = 952, HU = 968;             // hurricane-deck slab top / underside
    const TX0 = 1420, TX1 = 1740, TT = 858, TU = 870; // texas cabin, its roof slab
    const P0 = 1452, P1 = 1566, PT = 772;  // pilothouse
    const ST1 = 1326, ST2 = 1400, STOP = 440; // stacks (near, far)

    // Froth: a scalloped mound of foam with a lavender shadow beneath.
    function froth(cx, cy, rx, ry, seed, op) {
      return `<path d="${scallop(cx, cy + ry * 0.3, rx, ry, 12, seed, 0.6, 0.22)}" fill="#A9A3DE" fill-opacity="${n(op * 0.75)}"/>` +
        `<path d="${scallop(cx, cy, rx * 0.9, ry * 0.8, 12, seed + 1, 0.6, 0.22)}" fill="url(#frothG)" fill-opacity="${n(op)}"/>` +
        `<path d="${scallop(cx - rx * 0.18, cy - ry * 0.3, rx * 0.5, ry * 0.3, 8, seed + 2, 0.6, 0.2)}" fill="#FFFFFF" fill-opacity="${n(op * 0.8)}"/>`;
    }

    // Reflection of the boat, compressed and broken by ripples (drawn under the boat).
    {
      const rm = k.id('rmask'), fade = k.id('rfade');
      const r = rng(66);
      let dashes = '';
      for (let y = WL + 2; y < WL + 300; y += 5 + r() * 2) {
        const t = (y - WL) / 300;
        let x = BOW - 60 + r() * 40;
        while (x < WX + WR + 40) {
          const L = 24 + r() * 110 * (1 - t * 0.5);
          if (r() < 0.82 - t * 0.35) dashes += `<rect x="${n(x)}" y="${n(y)}" width="${n(L)}" height="${n(3.2 + r() * 1.6)}" rx="1.6"/>`;
          x += L + 4 + r() * 22 * (0.5 + t);
        }
      }
      let sil = '';
      sil += `<rect x="${BOW + 20}" y="${MD - 4}" width="${STERN - BOW - 20}" height="${WL - MD + 4}" fill="#F2EEFA"/>`;
      sil += `<rect x="${BOW + 50}" y="${BU}" width="${STERN - BOW - 50}" height="${MD - BU}" fill="#6E68B6"/>`;
      sil += `<rect x="${BOW + 36}" y="${HS}" width="${STERN - BOW - 20}" height="${BU - HS}" fill="#F4EFFA"/>`;
      sil += `<rect x="${TX0}" y="${TT}" width="${TX1 - TX0}" height="${HS - TT}" fill="#F4EFFA"/>`;
      sil += `<rect x="${P0}" y="${PT}" width="${P1 - P0}" height="${TT - PT}" fill="#F7EAD8"/>`;
      sil += `<rect x="${ST1 - 25}" y="${STOP}" width="50" height="${HS - STOP}" fill="#262A66"/><rect x="${ST2 - 23}" y="${STOP + 8}" width="46" height="${HS - STOP}" fill="#2E3270"/>`;
      sil += `<circle cx="${WX}" cy="${WY}" r="${WR}" fill="#D2525A"/>`;
      parts.push({
        defs: lgU(fade, 0, WL, 0, WL + 290, [[0, '#FFFFFF', 0.9], [0.45, '#FFFFFF', 0.45], [1, '#FFFFFF', 0]]) +
          `<mask id="${rm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${k.W}" height="${k.H}"><g fill="url(#${fade})">${dashes}</g></mask>`,
        svg: `<g mask="url(#${rm})" opacity="0.75"><g transform="translate(0 ${WL}) scale(1 -0.6) translate(0 ${-WL})">${sil}</g></g>`,
      });
    }

    const B = { defs: k.linear('frothG', 90, [[0, '#FFFFFF'], [0.6, '#F4F0FC'], [1, '#D6D0F0']]), svg: '' };
    {
      const id = (p) => k.id(p);
      const hullG = id('hull'), hullS = id('hulls'), wallG = id('wall'), wallR = id('wallr'), slabG = id('slab'), inG = id('inner'),
        stackG = id('stack'), stackF = id('stackf'), winG = id('win'), winW = id('winw'), bucketG = id('bucket'), wheelSh = id('wsh'),
        pilotG = id('pilot'), smokeG = id('smoke'), goldG = id('gold'), baleG = id('bale'), shadeG = id('shade'), boatClip = id('bclip'),
        wheelClip = id('wclip'), glassG = id('glass');
      B.defs += lgU(hullG, BOW, 0, STERN, 0, [[0, '#FFF6EC'], [0.4, '#FAF6FA'], [1, '#E4DEF2']]) +
        lgU(hullS, 0, MD + 12, 0, WL, [[0, '#B4ABDA'], [0.3, '#E5DFF3'], [1, '#CFC7EA']]) +
        lgU(wallG, BOW, 0, STERN, 0, [[0, '#FFF0E0'], [0.35, '#FBF5F4'], [1, '#E2DAF0']]) +
        lgU(wallR, BOW, 0, STERN, 0, [[0, '#F3E1DA'], [0.4, '#ECE3EE'], [1, '#D3CAE6']]) +
        k.linear(slabG, 90, [[0, '#FFFEFA'], [0.5, '#F4EFF8'], [1, '#CEC6E6']]) +
        lgU(inG, 0, BU, 0, MD, [[0, '#2F2A78'], [1, '#5A52A2']]) +
        k.linear(stackG, 0, [[0, '#5A5EAE'], [0.1, '#8B8ED6'], [0.22, '#3A3F8A'], [0.55, '#1E2358'], [0.85, '#161A46'], [1, '#2C3170']]) +
        k.linear(stackF, 0, [[0, '#3E4290'], [0.2, '#5C60A8'], [0.5, '#262A62'], [1, '#1C2052']]) +
        k.linear(winG, 90, [[0, '#3A3C8C'], [0.6, '#5A58A8'], [1, '#7E78BC']]) +
        k.linear(winW, 90, [[0, '#FFD9A0'], [0.45, '#F2B48E'], [1, '#7E78BC']]) +
        k.linear(bucketG, 90, [[0, '#F47E66'], [0.5, '#DE4F4E'], [1, '#B23446']]) +
        k.radial(wheelSh, '30%', '28%', '85%', [[0.45, '#1A1650', 0], [1, '#1A1650', 0.42]]) +
        k.linear(pilotG, 0, [[0, '#FFF3E4'], [1, '#E2DCF2']]) +
        k.linear(goldG, 0, [[0, '#FFE6A0'], [0.5, '#F1BE58'], [1, '#C98A2E']]) +
        k.radial(smokeG, '36%', '66%', '72%', [[0, '#FFF2E0'], [0.45, '#EEE2EE'], [1, '#B6ABD6']]) +
        k.linear(baleG, 90, [[0, '#FFF8EE'], [1, '#E3D6E2']]) +
        k.linear(glassG, 90, [[0, '#FFE2AE'], [0.5, '#F7C496'], [1, '#B79BC8']]) +
        lgU(shadeG, BOW - 40, 0, STERN + 40, 0, [[0, '#FFB27A', 0.16], [0.3, '#FFFFFF', 0], [0.7, '#6F66B8', 0.06], [1, '#5E56A8', 0.2]]);
      let s = '';
      const balusters = (x0, x1, y0, y1, step) => { let d = ''; for (let x = x0; x <= x1; x += step) d += `M${n(x)} ${y0}V${y1}`; return d; };

      // --- smoke drifting aft from the crowns (behind everything else on the boat) ---
      {
        const plume = [[1326, 420, 18], [1348, 400, 25], [1386, 382, 32], [1440, 370, 40], [1512, 364, 47], [1594, 366, 52], [1680, 372, 55], [1768, 380, 54], [1854, 390, 51], [1934, 400, 47], [2010, 410, 43], [2080, 418, 40]];
        let sm = '';
        // a thinner plume from the far stack joins it
        [[1392, 428, 15], [1414, 410, 21], [1450, 394, 27]].forEach(([x, y, r], i) => {
          sm += `<path d="${scallop(x, y, r * 1.05, r * 0.85, 8, 3300 + i * 3, 0.5, 0.14)}" fill="url(#${smokeG})" fill-opacity="0.8"/>`;
        });
        plume.forEach(([x, y, r], i) => {
          const op = Math.max(0.3, 0.97 - i * 0.06);
          sm += `<path d="${scallop(x + r * 0.14, y - r * 0.12, r * 1.08, r * 0.84, 9, 3000 + i * 7, 0.5, 0.14)}" fill="#A396C8" fill-opacity="${n(op * 0.45)}"/>`;
          sm += `<path d="${scallop(x, y, r * 1.05, r * 0.8, 9, 3001 + i * 7, 0.5, 0.14)}" fill="url(#${smokeG})" fill-opacity="${n(op)}"/>`;
          sm += `<path d="${scallop(x - r * 0.2, y + r * 0.26, r * 0.78, r * 0.4, 9, 3002 + i * 7, 0.5, 0.14)}" fill="#FFF0DA" fill-opacity="${n(op * 0.32)}"/>`;
        });
        s += sm;
      }

      // --- paddlewheel (behind the stern timbers) ---
      let wheel = '';
      wheel += `<circle cx="${WX}" cy="${WY}" r="${WR}" fill="#3B2A62" fill-opacity="0.3"/>`;
      const NB = 16;
      // far flange, seen through the near one
      let far = '';
      for (let i = 0; i < NB; i++) {
        const a = ((i + 0.5) / NB) * Math.PI * 2;
        far += `M${n(WX + 12)} ${n(WY - 7)}L${n(WX + 12 + Math.cos(a) * WR * 0.97)} ${n(WY - 7 + Math.sin(a) * WR * 0.97)}`;
      }
      wheel += `<path d="${far}" stroke="#7E2A3E" stroke-width="4" stroke-opacity="0.7"/>`;
      wheel += `<circle cx="${WX + 12}" cy="${WY - 7}" r="${n(WR * 0.95)}" fill="none" stroke="#7E2A3E" stroke-width="5" stroke-opacity="0.7"/>`;
      // buckets: planks seen a little from the side (near edge + far edge)
      for (let i = 0; i < NB; i++) {
        const a = ((i + 0.5) / NB) * Math.PI * 2;
        const c = Math.cos(a), sn = Math.sin(a);
        const r0 = WR * 0.6, r1 = WR * 1.05, hw = 8.5;
        const p = (r, off) => [WX + c * r - sn * off, WY + sn * r + c * off];
        const a0 = p(r0, -hw), a1 = p(r1, -hw), a2 = p(r1, hw), a3 = p(r0, hw);
        wheel += `<path d="M${n(a1[0])} ${n(a1[1])}L${n(a1[0] + 12)} ${n(a1[1] - 7)}L${n(a2[0] + 12)} ${n(a2[1] - 7)}L${n(a2[0])} ${n(a2[1])}Z" fill="#952C40"/>`;
        wheel += `<path d="M${n(a0[0])} ${n(a0[1])}L${n(a1[0])} ${n(a1[1])}L${n(a2[0])} ${n(a2[1])}L${n(a3[0])} ${n(a3[1])}Z" fill="url(#${bucketG})"/>`;
        wheel += `<path d="M${n(a0[0])} ${n(a0[1])}L${n(a1[0])} ${n(a1[1])}" stroke="#FFB59A" stroke-width="2.4" stroke-opacity="${n(0.35 + 0.45 * Math.max(0, -c))}"/>`;
      }
      // near arms, rims and hub
      let arms = '';
      for (let i = 0; i < NB; i++) {
        const a = ((i + 0.5) / NB) * Math.PI * 2;
        arms += `M${n(WX + Math.cos(a) * 20)} ${n(WY + Math.sin(a) * 20)}L${n(WX + Math.cos(a) * WR * 0.98)} ${n(WY + Math.sin(a) * WR * 0.98)}`;
      }
      wheel += `<path d="${arms}" stroke="#A3303E" stroke-width="6.5"/>`;
      wheel += `<path d="${arms}" stroke="#FF9C82" stroke-width="1.6" stroke-opacity="0.5" transform="translate(-1.5 -1.5)"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${n(WR * 0.6)}" fill="none" stroke="#B5343F" stroke-width="8"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${n(WR * 0.82)}" fill="none" stroke="#B5343F" stroke-width="3.5" stroke-opacity="0.8"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${n(WR * 1.0)}" fill="none" stroke="#C23B44" stroke-width="5.5"/>`;
      wheel += `<path d="M${n(WX - WR * 0.99)} ${WY}A${WR * 0.99} ${WR * 0.99} 0 0 1 ${WX} ${n(WY - WR * 0.99)}" fill="none" stroke="#FFB49A" stroke-width="2.4" stroke-opacity="0.7"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="${WR + 8}" fill="url(#${wheelSh})"/>`;
      wheel += `<circle cx="${WX}" cy="${WY}" r="26" fill="#2A2766"/><circle cx="${WX}" cy="${WY}" r="15" fill="url(#${goldG})"/><circle cx="${WX - 4}" cy="${WY - 4}" r="4" fill="#FFF3C8"/>`;
      // water streaming off the rising buckets (right side), clipped at the waterline
      const rw = rng(4040);
      let falls = '';
      for (let i = 0; i < 10; i++) {
        const a = -0.95 + i * 0.19;
        const x0 = WX + Math.cos(a) * WR * (0.98 + rw() * 0.06), y0 = WY + Math.sin(a) * WR;
        falls += `M${n(x0)} ${n(y0)}q${n(4 + rw() * 8)} ${n((WL - y0) * 0.5)} ${n(4 + rw() * 12)} ${n(WL - y0 + 6)}`;
      }
      wheel += `<path d="${falls}" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-opacity="0.6" stroke-linecap="round"/>`;
      B.defs += `<clipPath id="${wheelClip}"><rect x="${WX - WR - 40}" y="${WY - WR - 40}" width="${WR * 2 + 80}" height="${WL + 6 - (WY - WR - 40)}"/></clipPath>`;
      s += `<g clip-path="url(#${wheelClip})">${wheel}</g>`;
      // Cylinder timber (near side) from the stern to the wheel shaft, and the pitman arm.
      s += `<path d="M${STERN - 30} ${WY - 34}L${WX + 34} ${WY - 14}L${WX + 34} ${WY + 2}L${STERN - 30} ${WY - 16}Z" fill="#EDE7F6"/>`;
      s += `<path d="M${STERN - 30} ${WY - 34}L${WX + 34} ${WY - 14}" stroke="#FFFFFF" stroke-width="2.4"/>`;
      s += `<path d="M${STERN - 30} ${WY - 16}L${WX + 34} ${WY + 2}" stroke="#9C92C8" stroke-width="2"/>`;
      s += `<path d="M${STERN - 20} ${WY + 8}L${WX - 24} ${WY + 16}" stroke="#2A2766" stroke-width="10" stroke-linecap="round"/>`;
      s += `<circle cx="${WX - 24}" cy="${WY + 16}" r="8" fill="url(#${goldG})"/>`;

      // --- hull: guard, red rub rail, shadowed side, boot-top ---
      const hull = `M${BOW} ${MD - 14}Q${BOW + 80} ${MD - 2} ${BOW + 200} ${MD}H${STERN}V${WL}H${BOW + 70}Q${BOW + 24} ${WL - 24} ${BOW} ${MD - 14}Z`;
      s += `<path d="${hull}" fill="url(#${hullS})"/>`;
      s += `<path d="M${BOW} ${MD - 14}Q${BOW + 80} ${MD - 2} ${BOW + 200} ${MD}H${STERN}V${MD + 14}H${BOW + 200}Q${BOW + 76} ${MD + 12} ${BOW + 4} ${MD - 2}Z" fill="url(#${hullG})"/>`;
      s += `<path d="M${BOW + 6} ${MD - 1}Q${BOW + 80} ${MD + 12} ${BOW + 200} ${MD + 14}H${STERN}" fill="none" stroke="#D9524B" stroke-width="6"/>`;
      s += `<path d="M${BOW} ${MD - 14}Q${BOW + 80} ${MD - 2} ${BOW + 200} ${MD}H${STERN}" fill="none" stroke="#FFE1C2" stroke-width="2.5"/>`;
      s += `<path d="M${BOW + 54} ${WL - 12}H${STERN}V${WL + 2}H${BOW + 66}Z" fill="#2A2F7A"/>`;
      s += `<path d="M${BOW + 60} ${WL - 14}H${STERN}" stroke="#7E86D8" stroke-width="2" stroke-opacity="0.6"/>`;

      // --- main deck (open forward with cotton bales; engine-room cabin aft) ---
      s += `<rect x="${BOW + 50}" y="${BU}" width="${STERN - BOW - 50}" height="${MD - BU}" fill="url(#${inG})"/>`;
      s += `<rect x="1520" y="${BU + 8}" width="${STERN - 1520}" height="${MD - BU - 8}" fill="url(#${wallR})"/>`;
      for (let x = 1536; x < STERN - 20; x += 34) s += `<path d="M${x} ${MD - 18}V${BU + 38}a8 8 0 0 1 16 0V${MD - 18}Z" fill="url(#${winG})"/>`;
      // Cotton bales stacked forward.
      const rb = rng(1850);
      for (let row = 0; row < 3; row++) {
        const cnt = [6, 5, 3][row];
        for (let i = 0; i < cnt; i++) {
          const bx = 1284 + i * 42 + row * 21 + (row === 2 ? 21 : 0), by = MD - 36 - row * 32;
          s += `<rect x="${bx}" y="${by}" width="40" height="33" rx="6" fill="url(#${baleG})"/><path d="M${bx + 12} ${by + 1}v31M${bx + 28} ${by + 1}v31" stroke="#A996BC" stroke-width="2.2"/><path d="M${bx + 3} ${by + 4}h${rb() < 0.5 ? 14 : 22}" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.8"/>`;
        }
      }
      // Grand staircase rising from the bow to the boiler deck.
      let stair = '';
      for (let i = 0; i < 9; i++) stair += `M${BOW + 72 + i * 10} ${MD - 6 - i * 13}h22`;
      s += `<path d="M${BOW + 62} ${MD - 2}L${BOW + 160} ${BU + 2}L${BOW + 182} ${BU + 2}L${BOW + 88} ${MD - 2}Z" fill="#E9E2F4"/>`;
      s += `<path d="${stair}" stroke="#B6ACD8" stroke-width="3"/>`;
      s += `<path d="M${BOW + 58} ${MD - 34}L${BOW + 160} ${BU - 30}" stroke="#FFFDF8" stroke-width="4"/><path d="${(() => { let d = ''; for (let i = 0; i < 8; i++) d += `M${n(BOW + 66 + i * 13)} ${n(MD - 34 - i * 12.2)}V${n(MD - 6 - i * 12.6)}`; return d; })()}" stroke="#FFFDF8" stroke-width="2"/>`;
      // Posts and gingerbread arches along the main deck.
      let posts = '', scal = '';
      for (let x = BOW + 56; x <= STERN; x += 56) {
        posts += `<rect x="${x - 3}" y="${BU}" width="6" height="${MD - BU}" fill="#FFFDF8"/>`;
        if (x + 56 <= STERN + 2) scal += `M${x} ${BU + 4}Q${x + 28} ${BU + 28} ${x + 56} ${BU + 4}`;
      }
      s += posts + `<path d="${scal}" fill="none" stroke="#FFFDF8" stroke-width="4"/>`;
      s += `<path d="M${BOW + 54} ${MD - 26}H${STERN}" stroke="#FFFDF8" stroke-width="3.5"/>`;

      // --- boiler deck: slab, saloon cabin with tall arched windows, promenade ---
      s += `<rect x="${BOW + 30}" y="${BS}" width="${STERN - BOW - 20}" height="${BU - BS}" fill="url(#${slabG})"/>`;
      s += `<rect x="${BOW + 30}" y="${BU}" width="${STERN - BOW - 20}" height="6" fill="#2E2A70" fill-opacity="0.4"/>`;
      s += `<path d="M${BOW + 30} ${BS}H${STERN + 10}" stroke="#FFE2C2" stroke-width="3"/><path d="M${BOW + 34} ${BS + 8}H${STERN + 6}" stroke="#E0605A" stroke-width="2.4" stroke-opacity="0.85"/>`;
      s += `<rect x="${BOW + 96}" y="${HU}" width="${STERN - BOW - 108}" height="${BS - HU}" fill="url(#${wallR})"/>`;
      for (let x = BOW + 108; x < STERN - 28; x += 30) {
        const warm = x < 1470;
        s += `<path d="M${x} ${BS - 8}V${HU + 28}A8 8 0 0 1 ${x + 16} ${HU + 28}V${BS - 8}Z" fill="url(#${warm ? winW : winG})"/>`;
        s += `<path d="M${x + 8} ${HU + 24}V${BS - 8}M${x} ${HU + 58}h16" stroke="#F7EEF7" stroke-width="1.6" stroke-opacity="0.6"/>`;
      }
      s += `<rect x="${BOW + 96}" y="${HU}" width="${STERN - BOW - 108}" height="12" fill="#3B3682" fill-opacity="0.22"/>`;
      // balustrade
      s += `<path d="${balusters(BOW + 46, STERN + 6, BS - 34, BS, 7)}" stroke="#FFFDF8" stroke-width="2.4"/>`;
      s += `<path d="M${BOW + 44} ${BS - 35}H${STERN + 8}" stroke="#FFFDF8" stroke-width="5"/><path d="M${BOW + 44} ${BS - 38}H${STERN + 8}" stroke="#FFE2C2" stroke-width="1.6" stroke-opacity="0.8"/>`;
      // posts with curved brackets (gingerbread) under the hurricane deck
      let bp = '', br = '';
      for (let x = BOW + 44; x <= STERN + 8; x += 62) {
        bp += `<rect x="${x - 3}" y="${HU}" width="6" height="${BS - HU}" fill="#FFFDF8"/>`;
        br += `M${x - 28} ${HU + 3}Q${x - 5} ${HU + 3} ${x - 3} ${HU + 28}M${x + 28} ${HU + 3}Q${x + 5} ${HU + 3} ${x + 3} ${HU + 28}`;
      }
      let drops = '';
      for (let x = BOW + 50; x < STERN + 4; x += 10) drops += `M${x} ${HU}v${(x / 10) % 2 < 1 ? 7 : 4}`;
      s += bp + `<path d="${br}" fill="none" stroke="#FFFDF8" stroke-width="3.4"/><path d="${drops}" stroke="#FFFDF8" stroke-width="3" stroke-linecap="round"/>`;
      // life rings hung on the rail
      for (const x of [1388, 1574, 1698]) {
        s += `<circle cx="${x}" cy="${BS - 15}" r="13" fill="none" stroke="#FFFFFF" stroke-width="7"/><circle cx="${x}" cy="${BS - 15}" r="13" fill="none" stroke="#E0504A" stroke-width="7" stroke-dasharray="10.2 10.2"/>`;
      }

      // --- hurricane deck slab ---
      s += `<rect x="${BOW + 44}" y="${HS}" width="${STERN - BOW - 20}" height="${HU - HS}" fill="url(#${slabG})"/>`;
      s += `<rect x="${BOW + 44}" y="${HU}" width="${STERN - BOW - 20}" height="5" fill="#2E2A70" fill-opacity="0.32"/>`;
      s += `<path d="M${BOW + 44} ${HS}H${STERN + 24}" stroke="#FFE2C2" stroke-width="3"/><path d="M${BOW + 48} ${HS + 9}H${STERN + 20}" stroke="#E0605A" stroke-width="2.4" stroke-opacity="0.85"/>`;
      s += `<path d="${balusters(BOW + 60, STERN + 14, HS - 24, HS, 8)}" stroke="#FFFDF8" stroke-width="2"/><path d="M${BOW + 58} ${HS - 25}H${STERN + 16}" stroke="#FFFDF8" stroke-width="4"/>`;

      // --- texas cabin and its roof ---
      s += `<rect x="${TX0}" y="${TU}" width="${TX1 - TX0}" height="${HS - TU}" fill="url(#${wallG})"/>`;
      for (let x = TX0 + 16; x < TX1 - 16; x += 26) s += `<rect x="${x}" y="${TU + 18}" width="13" height="32" rx="2" fill="url(#${x < 1540 ? winW : winG})"/>`;
      s += `<rect x="${TX0}" y="${TU}" width="${TX1 - TX0}" height="8" fill="#3B3682" fill-opacity="0.2"/>`;
      s += `<rect x="${TX0 - 18}" y="${TT}" width="${TX1 - TX0 + 36}" height="${TU - TT}" fill="url(#${slabG})"/>`;
      s += `<path d="M${TX0 - 18} ${TT}H${TX1 + 18}" stroke="#FFE2C2" stroke-width="2.6"/>`;
      s += `<path d="${balusters(TX0 - 10, TX1 + 10, TT - 18, TT, 8)}" stroke="#FFFDF8" stroke-width="1.8"/><path d="M${TX0 - 12} ${TT - 19}H${TX1 + 12}" stroke="#FFFDF8" stroke-width="3.4"/>`;

      // --- pilothouse: glass all round, bracketed eaves, cresting and a gilded finial ---
      s += `<rect x="${P0}" y="${PT}" width="${P1 - P0}" height="${TT - PT}" fill="url(#${pilotG})"/>`;
      for (let i = 0; i < 4; i++) {
        const wx = P0 + 10 + i * 25;
        s += `<rect x="${n(wx)}" y="${PT + 16}" width="19" height="48" rx="2" fill="url(#${glassG})"/>`;
        s += `<rect x="${n(wx)}" y="${PT + 16}" width="19" height="48" rx="2" fill="#5E54A6" fill-opacity="${n(0.05 + i * 0.12)}"/>`;
      }
      s += `<path d="M${P0 + 13} ${PT + 20}l9 0l-9 18Z" fill="#FFFFFF" fill-opacity="0.5"/>`;
      s += `<rect x="${P0}" y="${PT + 70}" width="${P1 - P0}" height="4" fill="#C9BFE2"/>`;
      s += `<path d="M${P0 - 20} ${PT + 2}Q${(P0 + P1) / 2} ${PT - 22} ${P1 + 20} ${PT + 2}V${PT + 10}H${P0 - 20}Z" fill="#FFFDF8"/>`;
      s += `<path d="M${P0 - 20} ${PT + 2}Q${(P0 + P1) / 2} ${PT - 22} ${P1 + 20} ${PT + 2}" fill="none" stroke="#FFD9B0" stroke-width="2.4"/>`;
      s += `<path d="M${P0 - 20} ${PT + 10}H${P1 + 20}" stroke="#3B3682" stroke-width="3" stroke-opacity="0.35"/>`;
      let fringe = '';
      for (let x = P0 - 16; x < P1 + 18; x += 8) fringe += `M${x} ${PT + 10}v6`;
      s += `<path d="${fringe}" stroke="#FFFDF8" stroke-width="3" stroke-linecap="round"/>`;
      let crestP = '';
      for (let x = P0 - 4; x <= P1 + 4; x += 12) {
        const yy = PT - 2 - 20 * (1 - ((x - (P0 + P1) / 2) / ((P1 - P0) / 2 + 20)) ** 2) * 0.62;
        crestP += `M${x} ${n(yy)}l-3 -7l3 -5l3 5Z`;
      }
      s += `<path d="${crestP}" fill="url(#${goldG})"/>`;
      const fx = (P0 + P1) / 2;
      s += `<path d="M${fx - 3} ${PT - 12}L${fx - 2} ${PT - 44}H${fx + 2}L${fx + 3} ${PT - 12}Z" fill="#D9A040"/><path d="M${fx - 9} ${PT - 14}H${fx + 9}" stroke="#D9A040" stroke-width="4" stroke-linecap="round"/><circle cx="${fx}" cy="${PT - 50}" r="8" fill="url(#${goldG})"/><circle cx="${fx - 2.5}" cy="${PT - 53}" r="2.6" fill="#FFF6D8"/>`;
      s += `<path d="M${fx} ${PT - 58}V${PT - 74}" stroke="url(#${goldG})" stroke-width="2.4"/>`;

      // --- the ship's bell, forward on the hurricane roof ---
      {
        const bx = 1272, by = HS;
        s += `<path d="M${bx - 20} ${by}L${bx - 6} ${by - 52}H${bx + 6}L${bx + 20} ${by}" fill="none" stroke="#FFFDF8" stroke-width="4"/><path d="M${bx - 10} ${by - 52}H${bx + 10}" stroke="#2A2F6E" stroke-width="4"/>`;
        s += `<path d="M${bx - 12} ${by - 22}Q${bx - 11} ${by - 48} ${bx} ${by - 48}Q${bx + 11} ${by - 48} ${bx + 12} ${by - 22}L${bx + 15} ${by - 18}H${bx - 15}Z" fill="url(#${goldG})"/>`;
        s += `<path d="M${bx - 6} ${by - 26}Q${bx - 6} ${by - 42} ${bx - 1} ${by - 44}" stroke="#FFF3C8" stroke-width="2" fill="none"/>`;
      }

      // --- stacks with feathered crowns ---
      function stack(x, top, w, far) {
        const grad = far ? stackF : stackG;
        let g = '';
        const bot = HS + 2;
        const cb = top + 78;         // crown base (where the flare begins)
        const cw = w * 2.0;          // crown width at the lip
        g += `<rect x="${n(x - w / 2)}" y="${cb - 4}" width="${w}" height="${bot - cb + 4}" fill="url(#${grad})"/>`;
        let cr = `M${n(x - w / 2)} ${cb}C${n(x - w / 2)} ${top + 52} ${n(x - cw / 2)} ${top + 42} ${n(x - cw / 2)} ${top + 18}`;
        const F = 9;
        for (let i = 0; i < F; i++) {
          const u0 = i / F, u1 = (i + 1) / F, um = (u0 + u1) / 2;
          const x0 = x - cw / 2 + cw * u0, x1 = x - cw / 2 + cw * u1, xm = x - cw / 2 + cw * um;
          const lean = (um - 0.5) * 18;
          const tipY = top - 4 + Math.abs(um - 0.5) * 24;
          cr += `Q${n(x0 + (x1 - x0) * 0.1 + lean * 0.3)} ${n(top + 2)} ${n(xm + lean)} ${n(tipY)}Q${n(x1 - (x1 - x0) * 0.1 + lean * 0.3)} ${n(top + 2)} ${n(x1)} ${top + 16}`;
        }
        cr += `C${n(x + cw / 2)} ${top + 42} ${n(x + w / 2)} ${top + 52} ${n(x + w / 2)} ${cb}Z`;
        g += `<path d="${cr}" fill="url(#${grad})"/>`;
        g += `<path d="M${n(x - cw / 2 + 2)} ${top + 19}H${n(x + cw / 2 - 2)}" stroke="url(#${goldG})" stroke-width="4"/>`;
        g += `<rect x="${n(x - w / 2 - 3)}" y="${cb - 2}" width="${w + 6}" height="10" fill="url(#${goldG})"/>`;
        g += `<rect x="${n(x - w / 2 - 2)}" y="${bot - 96}" width="${w + 4}" height="8" fill="url(#${goldG})"/>`;
        if (!far) {
          g += `<path d="M${n(x - w / 2 + 10)} ${cb + 14}V${bot - 106}" stroke="#B9BCF4" stroke-width="4.5" stroke-opacity="0.45"/>`;
          g += `<path d="M${n(x - w / 2 + 2)} ${cb + 10}V${bot - 4}" stroke="#FFC79A" stroke-width="2.8" stroke-opacity="0.6"/>`;
          g += `<path d="M${n(x - cw / 2 + 4)} ${top + 26}C${n(x - cw / 2 + 4)} ${top + 46} ${n(x - w / 2 + 2)} ${top + 54} ${n(x - w / 2 + 3)} ${cb - 4}" fill="none" stroke="#FFC79A" stroke-width="2.4" stroke-opacity="0.6"/>`;
        }
        return g;
      }
      s += `<path d="M${ST1} 660L${BOW + 70} ${HS}M${ST2} 670L${TX0 + 40} ${TT}M${ST1} 660L${ST1 - 110} ${HS}" stroke="#3A3F7A" stroke-width="1.6" stroke-opacity="0.45"/>`;
      s += stack(ST2, STOP + 8, 46, true);
      s += stack(ST1, STOP, 50, false);
      s += `<path d="M${ST1 + 20} 600L${ST2 - 18} 606" stroke="#1E2460" stroke-width="5"/>`;
      s += k.star((ST1 + ST2) / 2 + 2, 603, 16, '#F1BE58');

      // --- stern flag and bow jackstaff ---
      const fpx = STERN - 6, fpy = HS;
      s += `<path d="M${fpx} ${fpy}V${fpy - 156}" stroke="#2A2F6E" stroke-width="4"/><circle cx="${fpx}" cy="${fpy - 158}" r="4" fill="url(#${goldG})"/>`;
      {
        let fl = '';
        const fw = 88, fh = 56, sh = fh / 7;
        for (let i = 0; i < 7; i++) fl += `<path d="M${fpx} ${n(fpy - 152 + i * sh)}c${n(fw * 0.25)} ${n(-6)} ${n(fw * 0.5)} ${n(6)} ${n(fw * 0.75)} 0s${n(fw * 0.2)} ${n(-4)} ${n(fw * 0.25)} 0v${n(sh)}c${n(-fw * 0.05)} ${n(-4)} ${n(-fw * 0.25)} ${n(4)} ${n(-fw * 0.25)} 0s${n(-fw * 0.5)} ${n(-6)} ${n(-fw * 0.75)} 0Z" fill="${i % 2 ? '#FFFFFF' : '#D9524B'}"/>`;
        fl += `<path d="M${fpx} ${fpy - 152}c${n(fw * 0.2)} -5 ${n(fw * 0.32)} 3 ${n(fw * 0.4)} 1v${n(sh * 4)}c${n(-fw * 0.08)} 2 ${n(-fw * 0.2)} -6 ${n(-fw * 0.4)} -1Z" fill="#2E3A9C"/>`;
        let stars = '';
        for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 4; c2++) stars += `<circle cx="${n(fpx + 5 + c2 * 8.4)}" cy="${n(fpy - 146 + r2 * 7.5 - c2 * 0.6)}" r="1.4"/>`;
        fl += `<g fill="#FFFFFF">${stars}</g>`;
        s += fl;
      }
      s += `<path d="M${BOW + 8} ${MD - 16}L${BOW + 4} ${MD - 124}" stroke="#2A2F6E" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M${BOW + 4} ${MD - 124}L${BOW - 40} ${MD - 116}L${BOW + 5} ${MD - 104}Z" fill="#D9524B"/>`;

      // --- the landing stage, raised at the bow on its derrick ---
      {
        const mx = BOW + 56, mTop = 906;
        const P = [BOW + 46, MD - 10], T = [1142, 1068];
        const dx = T[0] - P[0], dy = T[1] - P[1], len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
        const off = (p, d) => [p[0] + nx * d, p[1] + ny * d];
        const a = off(P, -7), b = off(T, -7), c = off(T, 7), d = off(P, 7);
        s += `<path d="M${mx} ${MD}V${mTop}" stroke="#2A2F6E" stroke-width="7"/><path d="M${mx - 18} ${mTop + 14}H${mx + 14}" stroke="#2A2F6E" stroke-width="4"/>`;
        s += `<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}L${n(c[0])} ${n(c[1])}L${n(d[0])} ${n(d[1])}Z" fill="#F7F2FA"/>`;
        s += `<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}" stroke="#B9AED8" stroke-width="3"/>`;
        const r1 = off(P, 24), r2 = off(T, 24);
        let rail = `M${n(r1[0])} ${n(r1[1])}L${n(r2[0])} ${n(r2[1])}`;
        for (let i = 0; i <= 8; i++) { const t = i / 8; const q = [P[0] + dx * t, P[1] + dy * t]; const q1 = off(q, 7), q2 = off(q, 24); rail += `M${n(q1[0])} ${n(q1[1])}L${n(q2[0])} ${n(q2[1])}`; }
        s += `<path d="${rail}" stroke="#FFFDF8" stroke-width="2.4"/>`;
        s += `<path d="M${mx} ${mTop + 4}L${n(T[0] + 4)} ${n(T[1] - 18)}M${mx} ${mTop + 4}L${n(P[0] + dx * 0.55)} ${n(P[1] + dy * 0.55 - 20)}" stroke="#4A4A86" stroke-width="2" stroke-opacity="0.8"/>`;
      }

      // Rim light on the bow side of each tier (the sun is to the left).
      s += `<path d="M${BOW + 52} ${BU + 2}V${MD - 4}" stroke="#FFD2A6" stroke-width="4" stroke-opacity="0.7"/>`;
      s += `<path d="M${BOW + 98} ${HU + 2}V${BS - 2}M${TX0 + 2} ${TU + 2}V${HS - 2}M${P0 + 2} ${PT + 12}V${TT}" stroke="#FFD2A6" stroke-width="4" stroke-opacity="0.75"/>`;

      // Light falloff across the whole superstructure: warm at the bow, cool aft.
      B.defs += `<clipPath id="${boatClip}"><path d="${hull}"/><rect x="${BOW + 30}" y="${HS}" width="${STERN - BOW}" height="${MD - HS}"/><rect x="${TX0 - 18}" y="${TT}" width="${TX1 - TX0 + 36}" height="${HS - TT}"/><rect x="${P0 - 20}" y="${PT - 20}" width="${P1 - P0 + 40}" height="${TT - PT + 20}"/></clipPath>`;
      s += `<rect x="${BOW - 40}" y="${PT - 30}" width="${STERN - BOW + 80}" height="${WL - PT + 30}" fill="url(#${shadeG})" clip-path="url(#${boatClip})"/>`;

      // --- water: bow wave, wake and the wheel's churn ---
      const r = rng(909);
      let foam = '';
      // bow wave curling off the stem, and the wake spreading back toward us
      foam += `<path d="${taper([[BOW + 30, WL + 2], [BOW + 140, WL + 26], [BOW + 300, WL + 56]], 9, 1)}" fill="#FFFFFF" fill-opacity="0.55"/>`;
      foam += `<path d="${taper([[BOW + 160, WL + 8], [BOW + 300, WL + 30], [BOW + 470, WL + 52]], 6, 1)}" fill="#FFFFFF" fill-opacity="0.35"/>`;
      foam += froth(BOW + 46, WL - 2, 44, 14, 610, 0.95);
      foam += froth(BOW + 2, WL + 10, 30, 10, 620, 0.8);
      // the churn at the wheel: a frothy mound along the waterline
      const churn = [[WX - 150, WL - 2, 38, 16], [WX - 96, WL - 6, 46, 22], [WX - 36, WL - 10, 52, 26], [WX + 28, WL - 8, 54, 26], [WX + 92, WL - 6, 50, 24], [WX + 150, WL - 2, 44, 18], [WX - 60, WL + 14, 60, 18], [WX + 60, WL + 16, 64, 18], [WX + 140, WL + 20, 40, 12]];
      churn.forEach(([x, y, rx, ry], i) => { foam += froth(x, y, rx, ry, 640 + i * 5, 0.95); });
      // spray thrown up by the rising buckets
      for (let i = 0; i < 34; i++) {
        const a = -1.25 + r() * 1.35, d = WR + 6 + r() * 52;
        foam += `<circle cx="${n(WX + Math.cos(a) * d)}" cy="${n(WY + Math.sin(a) * d * 0.9)}" r="${n(1.8 + r() * 4)}" fill="#FFFFFF" fill-opacity="${n(0.5 + r() * 0.45)}"/>`;
      }
      foam += `<path d="M${WX + WR + 4} ${WY - 40}q26 10 38 44M${WX + WR + 14} ${WY - 80}q30 18 40 62" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.55" stroke-linecap="round"/>`;
      // a foamy wake trailing aft
      let trail = '';
      for (let i = 0; i < 18; i++) {
        const y = WL + 24 + i * 8, x = WX - 70 + r() * 130;
        trail += `M${n(x)} ${n(y)}h${n(50 + r() * 110)}`;
      }
      foam += `<path d="${trail}" stroke="#F4F0FF" stroke-width="4.5" stroke-opacity="0.42" stroke-linecap="round"/>`;
      s += foam;
      B.svg = s;
    }
    parts.push(B);

    // ---- foreground: coneflowers and black-eyed Susans ------------------------------
    function cone(x, y, R, seed) {
      const rr = rng(seed);
      const pg = k.id('pet'), cg = k.id('cone');
      const defs = k.linear(pg, 90, [[0, '#7E48A8'], [0.45, '#C07ACB'], [1, '#EDB8DC']]) +
        k.radial(cg, '38%', '30%', '72%', [[0, '#F7AE62'], [0.55, '#C9682E'], [1, '#6E352C']]);
      let back = '', front = '';
      const P = 13;
      for (let i = 0; i < P; i++) {
        const a = (i / P) * Math.PI * 2 + rr() * 0.2;
        const bx = x + Math.cos(a) * R * 0.32, by = y + Math.sin(a) * R * 0.14;
        // Petals droop: the tip goes outward and down.
        const L = R * (0.95 + rr() * 0.15);
        const tx = bx + Math.cos(a) * L * 0.78, ty = by + Math.sin(a) * L * 0.3 + L * 0.62;
        const px = -(ty - by), py = tx - bx, pl = Math.hypot(px, py) || 1;
        const w = R * 0.16;
        const ux = (px / pl) * w, uy = (py / pl) * w;
        const d = `M${n(bx - ux * 0.5)} ${n(by - uy * 0.5)}Q${n((bx + tx) / 2 - ux)} ${n((by + ty) / 2 - uy)} ${n(tx - ux * 0.35)} ${n(ty - uy * 0.35)}L${n(tx)} ${n(ty + 3)}L${n(tx + ux * 0.35)} ${n(ty + uy * 0.35)}Q${n((bx + tx) / 2 + ux)} ${n((by + ty) / 2 + uy)} ${n(bx + ux * 0.5)} ${n(by + uy * 0.5)}Z`;
        const p = `<path d="${d}" fill="url(#${pg})"/><path d="M${n(bx)} ${n(by)}Q${n((bx + tx) / 2)} ${n((by + ty) / 2)} ${n(tx)} ${n(ty)}" stroke="#8A4FA8" stroke-width="1.6" stroke-opacity="0.35" fill="none"/>`;
        if (Math.sin(a) < 0) back += p; else front += p;
      }
      const c = `<path d="M${n(x - R * 0.36)} ${n(y + R * 0.05)}Q${n(x - R * 0.36)} ${n(y - R * 0.55)} ${n(x)} ${n(y - R * 0.55)}Q${n(x + R * 0.36)} ${n(y - R * 0.55)} ${n(x + R * 0.36)} ${n(y + R * 0.05)}Q${n(x)} ${n(y + R * 0.2)} ${n(x - R * 0.36)} ${n(y + R * 0.05)}Z" fill="url(#${cg})"/>`;
      let spikes = '';
      for (let i = 0; i < 34; i++) {
        const u = rr() * 2 - 1, v = rr();
        spikes += `<circle cx="${n(x + u * R * 0.3 * (1 - v * 0.4))}" cy="${n(y - R * 0.48 * v + R * 0.04)}" r="${n(R * 0.035)}" fill="${rr() < 0.5 ? '#FFC67A' : '#5A2A2A'}" fill-opacity="0.75"/>`;
      }
      return { defs, svg: back + front + c + spikes };
    }
    function susan(x, y, R, seed) {
      const rr = rng(seed);
      const pg = k.id('sus'), cg = k.id('eye');
      const defs = k.linear(pg, 90, [[0, '#E0902A'], [0.5, '#F6BE3E'], [1, '#FFE07A']]) +
        k.radial(cg, '35%', '30%', '70%', [[0, '#7A4A62'], [1, '#2A1A36']]);
      let s = '';
      const P = 14;
      for (let i = 0; i < P; i++) {
        const a = (i / P) * Math.PI * 2 + rr() * 0.15;
        const L = R * (0.9 + rr() * 0.15);
        const tx = x + Math.cos(a) * L, ty = y + Math.sin(a) * L * 0.62 + L * 0.18;
        const ang = Math.atan2(ty - y, tx - x) * 57.3;
        const len = Math.hypot(tx - x, ty - y);
        s += `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M0 -${n(R * 0.1)}Q${n(len * 0.55)} -${n(R * 0.2)} ${n(len)} -${n(R * 0.05)}L${n(len - 4)} 0L${n(len)} ${n(R * 0.06)}Q${n(len * 0.55)} ${n(R * 0.2)} 0 ${n(R * 0.1)}Z" fill="url(#${pg})"/>`;
        s += `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})" d="M${n(R * 0.2)} 0L${n(len * 0.8)} 0" stroke="#C97A22" stroke-width="1.6" stroke-opacity="0.35"/>`;
      }
      s += `<ellipse cx="${n(x)}" cy="${n(y - R * 0.06)}" rx="${n(R * 0.3)}" ry="${n(R * 0.26)}" fill="url(#${cg})"/>`;
      s += `<ellipse cx="${n(x - R * 0.08)}" cy="${n(y - R * 0.14)}" rx="${n(R * 0.1)}" ry="${n(R * 0.06)}" fill="#C98AA8" fill-opacity="0.45"/>`;
      return { defs, svg: s };
    }
    // A lance leaf with a midrib, its upper half catching the light.
    function leaf(x, y, L, ang, dark, light) {
      const t = `translate(${n(x)} ${n(y)}) rotate(${n(ang)})`;
      const w = L * 0.17;
      return `<g transform="${t}"><path d="M0 0C${n(L * 0.25)} ${n(-w * 1.3)} ${n(L * 0.7)} ${n(-w)} ${n(L)} 0C${n(L * 0.7)} ${n(w)} ${n(L * 0.25)} ${n(w * 1.3)} 0 0Z" fill="${dark}"/>` +
        `<path d="M0 0C${n(L * 0.25)} ${n(-w * 1.3)} ${n(L * 0.7)} ${n(-w)} ${n(L)} 0Z" fill="${light}" fill-opacity="0.75"/>` +
        `<path d="M${n(L * 0.04)} 0L${n(L * 0.9)} 0" stroke="#173E3A" stroke-width="1.8" stroke-opacity="0.45"/></g>`;
    }
    // A corner bouquet: a mound of leaves and grasses, stems, then the heads.
    // spots: [x from the corner's edge, y, radius, 'c' coneflower | 's' Susan | 'b' bud]
    function meadowCorner(corner, seed, spots, reach, mound) {
      const rr = rng(seed);
      const left = corner === 'bl';
      const X = (x) => (left ? x : k.W - x);
      let defs = '', back = '', mid = '', blooms = '';
      // grasses
      let grass = '';
      for (let i = 0; i < 46; i++) {
        const lx = -20 + rr() * reach;
        const x = X(lx), h = 50 + rr() * mound * 1.1 * Math.max(0.25, 1 - lx / (reach + 60));
        grass += `M${n(x)} ${k.H + 10}q${n((rr() - 0.5) * 30)} ${n(-h * 0.6)} ${n((rr() - 0.2) * 50 * (left ? 1 : -1))} ${n(-h)}`;
      }
      back += `<path d="${grass}" fill="none" stroke="#5E9468" stroke-width="3.6" stroke-linecap="round" stroke-opacity="0.85"/>`;
      // stems first, so the leaf mound overlaps their feet
      const heads = spots.slice().sort((a, b) => a[1] - b[1]);
      heads.forEach((p) => {
        const x = X(p[0]), y = p[1];
        back += `<path d="M${n(x)} ${n(y + 8)}Q${n(x + (rr() - 0.5) * 24)} ${n((y + k.H) / 2)} ${n(x + (rr() - 0.5) * 40)} ${k.H + 20}" stroke="#2F6650" stroke-width="5.5" fill="none"/>`;
      });
      // leaf mound: long lance leaves fanning up and out from the corner
      for (let i = 0; i < 34; i++) {
        const lx = -20 + Math.pow(rr(), 1.3) * reach;
        const hgt = mound * Math.max(0.2, 1 - lx / reach) * (0.5 + rr() * 0.6);
        const x = X(lx), y = k.H + 20 - hgt * 0.5;
        const L = 90 + rr() * 80;
        const ang = left ? -100 + rr() * 85 : -80 - rr() * 85;
        const dk = rr() < 0.5 ? '#2C6152' : '#3A7560';
        mid += leaf(x, y, L, ang, dk, rr() < 0.5 ? '#6FA27A' : '#8DB27E');
      }
      heads.forEach((p, i) => {
        const x = X(p[0]), y = p[1];
        // a pair of stem leaves under each head
        const s1 = left ? 1 : -1;
        mid += leaf(x, y + p[2] * 1.4, p[2] * 1.1, -30 * s1 - (left ? 0 : 180) + (left ? 0 : 0), '#2C6152', '#7FAE7E');
        const f = p[3] === 'c' ? cone(x, y, p[2], seed + i * 7) : p[3] === 's' ? susan(x, y, p[2], seed + i * 7) : null;
        if (f) { defs += f.defs; blooms += f.svg; } else {
          blooms += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(p[2] * 0.32)}" ry="${n(p[2] * 0.42)}" fill="#7E9A5A"/><path d="M${n(x - p[2] * 0.22)} ${n(y - p[2] * 0.18)}q${n(p[2] * 0.22)} ${n(-p[2] * 0.44)} ${n(p[2] * 0.44)} 0" fill="#C07ACB"/><path d="M${n(x - p[2] * 0.3)} ${n(y + p[2] * 0.1)}q${n(p[2] * 0.3)} ${n(p[2] * 0.3)} ${n(p[2] * 0.6)} 0" fill="#4E7A54"/>`;
        }
      });
      return { defs, svg: back + mid + blooms };
    }
    parts.push(meadowCorner('bl', 61,
      [[70, 1236, 66, 'c'], [214, 1300, 78, 'c'], [370, 1372, 60, 's'], [110, 1396, 72, 's'], [292, 1478, 82, 'c'], [476, 1490, 56, 's'], [36, 1520, 66, 's'], [170, 1548, 62, 's'], [420, 1262, 30, 'b'], [262, 1168, 46, 's'], [560, 1560, 50, 'c'], [150, 1150, 26, 'b']],
      560, 330));

    // Bottom-right: a grassy spit with cattails, coneflowers and Susans below the wheel.
    {
      const bg = k.id('bank');
      const top = [[1700, 1600], [1790, 1470], [1900, 1410], [2010, 1388], [2110, 1382]];
      let s = `<path d="${smooth(top)}L2110 1600Z" fill="url(#${bg})"/>`;
      s += `<path d="${smooth(top.map((p) => [p[0], p[1] - 4]))}" fill="none" stroke="#E9CCA4" stroke-width="6"/>`;
      const r = rng(5150);
      for (let i = 0; i < 6; i++) {
        const x = 1880 + i * 34 + r() * 10, y = 1430 - i * 4, h = 84 + r() * 30;
        const lean = (r() - 0.6) * 18;
        s += `<path d="M${n(x)} ${n(y)}Q${n(x + lean * 0.3)} ${n(y - h * 0.5)} ${n(x + lean)} ${n(y - h)}" stroke="#4E7A5E" stroke-width="4" fill="none"/>`;
        s += `<rect x="${n(x + lean * 0.8 - 7)}" y="${n(y - h * 0.86)}" width="14" height="${n(h * 0.26)}" rx="7" fill="#7A4A52" transform="rotate(${n(lean * 0.25)} ${n(x + lean * 0.8)} ${n(y - h * 0.73)})"/>`;
        s += `<path d="M${n(x)} ${n(y)}q${n(-20 + r() * 40)} ${n(-h * 0.4)} ${n(-30 + r() * 60)} ${n(-h * 0.7)}" stroke="#6F9A6A" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      }
      parts.push({ defs: k.linear(bg, 90, [[0, '#B9CC8A'], [1, '#8FB27E']]), svg: s });
    }
    parts.push(meadowCorner('br', 97,
      [[70, 1392, 62, 's'], [200, 1436, 74, 'c'], [330, 1500, 58, 's'], [96, 1520, 76, 'c'], [250, 1560, 56, 's'], [390, 1452, 32, 'b'], [20, 1470, 40, 'b']],
      420, 240));

    return k.spread(parts, { grain: 0.6 });
  },
};
