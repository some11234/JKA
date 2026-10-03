/* Visa pages 17–18 — Tranquility Base, the Moon, July 20, 1969.
   Left: the lunar horizon at Tranquility Base, low sun from the left. The
   Apollo 11 lunar module "Eagle" stands on its four splayed legs — crinkled
   gold-foil descent stage, the angular silver-and-black ascent stage with its
   triangular windows, RCS thruster quads and antennas, the ladder down the
   front leg — and casts its long shadow to the right. The flag stands on its
   pole at the left; a crisp bootprint is pressed into the dust in the
   foreground. Right: Earth rising over the lunar mountains — the Americas
   under swirling cloud, a soft blue atmosphere, the night side falling away
   into the violet sky. Lunar rocks and crater rims frame the bottom corners
   in place of flowers. Quote (live text, see js/passport-data.js): Neil
   Armstrong.

   The LM, its legs and its shadow are modelled in 3-D (metres) and projected
   with a simple perspective camera, so the octagonal descent stage, the
   splayed legs and the footpads foreshorten correctly; everything else is
   drawn flat. */

'use strict';

module.exports = {
  pages: [17, 18],
  svg(k) {
    const { n, rng, mix } = k;
    const W = k.W, H = k.H;
    const D2R = Math.PI / 180;
    const parts = [];

    // ---- small helpers ------------------------------------------------------------------
    const stopsXml = (stops) => stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    function lgU(gid, x1, y1, x2, y2, stops) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsXml(stops)}</linearGradient>`;
    }
    function rgU(gid, cx, cy, r, stops, fx, fy) {
      return `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${fx != null ? ` fx="${n(fx)}" fy="${n(fy)}"` : ''}>${stopsXml(stops)}</radialGradient>`;
    }
    const poly = (pts) => 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z';
    const pline = (pts) => 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L');
    // Catmull-Rom through points → cubic Béziers.
    function smooth(pts, closed) {
      const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
      let d = `M${n(P[1][0])} ${n(P[1][1])}`;
      for (let i = 1; i < P.length - 2; i++) {
        const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
        d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
      }
      return d + (closed ? 'Z' : '');
    }
    function ramp(stops, v) {
      v = Math.max(0, Math.min(1, v));
      for (let i = 1; i < stops.length; i++) {
        if (v <= stops[i][0]) {
          const a = stops[i - 1], b = stops[i];
          return mix(a[1], b[1], (v - a[0]) / (b[0] - a[0] || 1));
        }
      }
      return stops[stops.length - 1][1];
    }
    // Filled ribbon along a screen polyline with per-point half-widths.
    function ribbon(pts, ws) {
      if (pts.length < 2) return '';
      const L = [], R = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
        L.push([pts[i][0] - dy * ws[i], pts[i][1] + dx * ws[i]]);
        R.push([pts[i][0] + dy * ws[i], pts[i][1] - dx * ws[i]]);
      }
      return smooth(L.concat(R.reverse()), true);
    }
    // A crescent: the part of ellipse (cx,cy,rx,ry) NOT covered by the same
    // ellipse shifted by dx (dx > 0 → crescent on the left, < 0 → right).
    function crescent(cx, cy, rx, ry, dx) {
      const a = Math.abs(dx);
      if (a >= 2 * rx) return `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)}Z`;
      const xi = cx + dx / 2, yi = ry * Math.sqrt(1 - (a / (2 * rx)) ** 2);
      if (dx > 0) return `M${n(xi)} ${n(cy - yi)}A${n(rx)} ${n(ry)} 0 1 0 ${n(xi)} ${n(cy + yi)}A${n(rx)} ${n(ry)} 0 0 1 ${n(xi)} ${n(cy - yi)}Z`;
      return `M${n(xi)} ${n(cy - yi)}A${n(rx)} ${n(ry)} 0 1 1 ${n(xi)} ${n(cy + yi)}A${n(rx)} ${n(ry)} 0 0 0 ${n(xi)} ${n(cy - yi)}Z`;
    }
    function hull(points) {
      const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    // A stipple tile: fine dots, for the Wallet's grainy shadows.
    const stip = k.id('stip'), stipL = k.id('stipL');
    {
      const rs = rng(4711);
      let dots = '', dotsL = '';
      for (let i = 0; i < 260; i++) dots += `<circle cx="${n(rs() * 90)}" cy="${n(rs() * 90)}" r="${n(0.7 + rs() * 1.1)}"/>`;
      for (let i = 0; i < 200; i++) dotsL += `<circle cx="${n(rs() * 90)}" cy="${n(rs() * 90)}" r="${n(0.6 + rs() * 0.9)}"/>`;
      parts.push({
        defs: `<pattern id="${stip}" width="90" height="90" patternUnits="userSpaceOnUse"><g fill="#2A2470">${dots}</g></pattern>` +
          `<pattern id="${stipL}" width="90" height="90" patternUnits="userSpaceOnUse"><g fill="#FFF6F0">${dotsL}</g></pattern>`,
      });
    }
    const blur = (sd) => { const f = k.id('blur'); return { id: f, def: `<filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sd}"/></filter>` }; };

    // ---- sky -----------------------------------------------------------------------------
    // Pale lavender along the top (the quote sits there), deepening to indigo
    // and violet toward the lunar horizon.
    const HZ = 1092; // the lunar horizon (bases of the far mountains)
    parts.push(k.sky([[0, '#EDE8F8'], [0.08, '#E5DFF6'], [0.16, '#D6CFF1'], [0.24, '#BDB5EA'], [0.34, '#958CD9'], [0.45, '#6F66C3'], [0.56, '#5850AE'], [0.64, '#4B4399'], [0.7, '#4A4095'], [1, '#4A4095']]));
    // The sun is off the page to the left: a warm glow on that side of the sky.
    const sunG = k.id('sun');
    parts.push({
      defs: rgU(sunG, -140, 560, 900, [[0, '#FFE9DA', 0.85], [0.22, '#F8CFC8', 0.5], [0.5, '#C9A2D4', 0.2], [1, '#8E84D0', 0]]),
      svg: `<rect width="${W}" height="${H}" fill="url(#${sunG})"/>`,
    });

    // Earth's position (right page).
    const EX = 1592, EY = 726, ER = 352;
    const eGlow = k.id('eglow');
    parts.push({
      defs: rgU(eGlow, EX, EY, ER * 1.9, [[0, '#C4D2FA', 0.65], [0.5, '#B7C3F4', 0.5], [0.6, '#A8AFEC', 0.28], [0.8, '#958FDE', 0.1], [1, '#8C84D6', 0]]),
      svg: `<circle cx="${EX}" cy="${EY}" r="${n(ER * 1.9)}" fill="url(#${eGlow})"/>`,
    });

    // ---- security print -------------------------------------------------------------------
    {
      const cTop = k.id('ctop'), cLow = k.id('clow');
      parts.push({
        defs: `<clipPath id="${cTop}"><rect width="${W}" height="560"/></clipPath><clipPath id="${cLow}"><rect y="560" width="${W}" height="${HZ - 560}"/></clipPath>`,
        svg: `<g clip-path="url(#${cTop})">${k.microtext('Tranquility Base', { y0: 34, y1: 1080, opacity: 0.05 })}</g>` +
          `<g clip-path="url(#${cLow})">${k.microtext('Tranquility Base', { y0: 34, y1: 1080, opacity: 0.06, colour: '#E9E4FF' })}</g>`,
      });
      parts.push(k.guilloche({ y0: 120, y1: 980, lines: 24, opacity: 0.13, amp: 16, period: 720, phase: 2.1, color: '#8F87DA' }));
    }

    // ---- stars ----------------------------------------------------------------------------
    {
      const rs = rng(1969);
      let dots = '', faint = '', spark = '';
      for (let i = 0; i < 520; i++) {
        const x = rs() * W, y = 250 + Math.pow(rs(), 0.75) * (HZ - 250);
        const dEarth = Math.hypot(x - EX, y - EY);
        if (dEarth < ER + 6) continue;
        const depth = (y - 250) / (HZ - 250); // darker sky lower down → more, brighter stars
        if (rs() > 0.25 + depth) continue;
        const r = 0.9 + rs() * rs() * 2.6;
        const op = n(0.35 + depth * 0.45 + rs() * 0.2);
        dots += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${rs() < 0.2 ? '#FFE9C8' : '#FFFFFF'}" fill-opacity="${op}"/>`;
      }
      for (let i = 0; i < 60; i++) {
        const x = rs() * W, y = 40 + rs() * 260;
        faint += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.9 + rs() * 1.2)}" fill="#FFFFFF" fill-opacity="${n(0.4 + rs() * 0.3)}"/>`;
      }
      const sparkle = (x, y, r, col, op) => `<path d="M${n(x)} ${n(y - r)}Q${n(x + r * 0.12)} ${n(y - r * 0.12)} ${n(x + r)} ${n(y)}Q${n(x + r * 0.12)} ${n(y + r * 0.12)} ${n(x)} ${n(y + r)}Q${n(x - r * 0.12)} ${n(y + r * 0.12)} ${n(x - r)} ${n(y)}Q${n(x - r * 0.12)} ${n(y - r * 0.12)} ${n(x)} ${n(y - r)}Z" fill="${col}" fill-opacity="${op}"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 0.16)}" fill="#FFFFFF"/>`;
      for (const [x, y, r] of [[300, 520, 15], [770, 410, 11], [880, 700, 9], [120, 790, 8], [1180, 470, 12], [1330, 300 + 90, 7], [2010, 520, 13], [1930, 960, 9], [1190, 900, 8], [520, 640, 7], [1060, 620, 9], [2040, 300, 7]]) {
        spark += sparkle(x, y, r, '#FFF6E4', 0.9);
      }
      parts.push({ svg: faint + dots + spark });
    }

    // ---- glory behind Earth ----------------------------------------------------------------
    parts.push({
      svg: k.sunburst(EX, EY, ER + 30, 1100, 64, '#E2DDFB', 0.05) +
        k.rosette(EX, EY, 540, { color: '#DCD7FA', opacity: 0.11, rings: 9, lobes: 40, width: 1.2 }),
    });

    // ==== EARTH ================================================================================
    {
      const lat0 = 21 * D2R, lon0 = -74 * D2R;
      const sph = (lon, lat) => {
        const la = lat * D2R, lo = lon * D2R - lon0;
        return [Math.cos(la) * Math.sin(lo),
          Math.cos(lat0) * Math.sin(la) - Math.sin(lat0) * Math.cos(la) * Math.cos(lo),
          Math.sin(lat0) * Math.sin(la) + Math.cos(lat0) * Math.cos(la) * Math.cos(lo)];
      };
      const ep = (v) => {
        let [x, y, z] = v;
        if (z < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; }
        return [EX + ER * x, EY - ER * y];
      };
      // Densify a lon/lat ring and project it (hidden parts pressed onto the limb).
      const ring = (ll) => {
        const out = [];
        for (let i = 0; i < ll.length; i++) {
          const a = ll[i], b = ll[(i + 1) % ll.length];
          const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5));
          for (let s = 0; s < steps; s++) out.push(ep(sph(a[0] + (b[0] - a[0]) * s / steps, a[1] + (b[1] - a[1]) * s / steps)));
        }
        return out;
      };
      const land = (ll) => smooth(ring(ll), true);

      const NA = [[-168, 65.6], [-164, 67.5], [-163, 69.5], [-157, 71.2], [-150, 70.5], [-143, 70], [-136, 69.2], [-129, 70], [-122, 69.4], [-115, 68.6], [-108, 68.2], [-100, 67.8], [-95, 68.8], [-90, 68.4], [-87, 66.6], [-88, 64.2], [-91, 62.8], [-94.2, 59], [-92.5, 57], [-88.5, 56], [-85, 55.2], [-82.4, 53], [-80, 51.4], [-79, 54.6], [-77.5, 57.5], [-78, 60.5], [-77.5, 62.4], [-73, 62], [-69.5, 59.5], [-65, 60.2], [-61.5, 56], [-57.5, 52.2], [-60, 50.2], [-66.5, 50], [-64.3, 48.9], [-64.8, 47], [-61, 45.6], [-63.5, 44.6], [-66, 43.8], [-70, 43.7], [-70.6, 42.6], [-70, 41.7], [-71.5, 41.4], [-74, 40.6], [-74.2, 39.5], [-75.6, 38], [-75.8, 36], [-76.5, 34.7], [-78.5, 33.8], [-80.5, 32], [-81.3, 30.5], [-80.6, 28.5], [-80.1, 26.5], [-80.4, 25.2], [-81.2, 25.3], [-81.8, 26.7], [-82.7, 28.2], [-83.6, 29.9], [-85.3, 29.8], [-87.5, 30.3], [-89.4, 30.1], [-89.2, 29.1], [-90.5, 29.1], [-93.5, 29.7], [-95.5, 28.7], [-97.3, 27.4], [-97.4, 25.5], [-97.8, 22.5], [-97.3, 21], [-96.3, 19.2], [-94.6, 18.2], [-92, 18.6], [-90.6, 19.8], [-90.4, 21.2], [-88, 21.5], [-86.8, 21.1], [-87.5, 19], [-88.2, 17.4], [-88.5, 15.9], [-86, 15.9], [-84, 15.6], [-83.2, 14.5], [-83.6, 12], [-83.7, 10.8], [-82.2, 9.1], [-80, 9.4], [-78.5, 9.3], [-77.4, 8.7],
        [-75.6, 10.4], [-74.2, 11.2], [-72.2, 11.9], [-70.2, 11.6], [-68.3, 10.6], [-66, 10.6], [-64, 10.6], [-62, 10.7], [-61, 9.8], [-60, 8.5], [-58.4, 7], [-57.2, 6], [-55, 5.9], [-53, 5.6], [-51.6, 4.2], [-50, 1.8], [-50, -0.5], [-48.5, -1.2], [-46, -1.1], [-44.3, -2.5], [-41.7, -2.9], [-39, -3.7], [-37.2, -4.9], [-35.3, -5.3], [-34.8, -7.5], [-35.1, -9], [-37.1, -11], [-38.5, -13], [-39, -15.5], [-39.3, -17.8], [-39.7, -19.5], [-40.9, -22], [-42, -22.9], [-44.6, -23.3], [-47, -24.5], [-48.5, -26], [-48.6, -28.3], [-50.2, -30.6], [-51.2, -31.8], [-52.7, -33.4], [-53.5, -34.2], [-54.9, -34.9], [-56.8, -34.5], [-58.4, -34], [-57.2, -35.6], [-56.7, -36.4], [-57.6, -38.2], [-59.8, -38.8], [-62.2, -38.8], [-62.3, -40.5], [-65, -41], [-64.5, -42.6], [-65.4, -44.9], [-67.5, -46], [-65.9, -47.8], [-67.5, -49.5], [-69, -51.6], [-68.4, -52.4], [-68.6, -54.8], [-70, -55.2], [-72, -54], [-74.5, -52], [-75.4, -48.5], [-74.8, -46.6], [-73.7, -45.4], [-74, -43.5], [-73.5, -41.8], [-73.7, -39], [-73.2, -37.2], [-72.2, -35], [-71.5, -32.4], [-71.4, -30], [-71.3, -28], [-70.6, -26], [-70.5, -23.5], [-70.2, -20.5], [-70.4, -18.4], [-71.4, -17.6], [-73.5, -16.4], [-75.4, -15], [-76.3, -13.5], [-77.3, -12], [-78.7, -9], [-79.8, -7.2], [-81.2, -5.9], [-81.3, -4.5], [-80.3, -3.4], [-80, -2.2], [-80.9, -1], [-80.1, 0.5], [-78.9, 1.5], [-78.6, 2.7], [-77.3, 3.9], [-77.4, 6.5], [-77.9, 7.4], [-79.5, 8.6],
        [-80.5, 7.4], [-82, 8.2], [-83.6, 8.5], [-85.7, 9.9], [-85.8, 11.1], [-87.2, 12.6], [-88.9, 13.3], [-91.3, 13.9], [-94.1, 16], [-95.9, 15.7], [-97.8, 16], [-99.7, 16.8], [-101.6, 17.6], [-103.4, 18.3], [-105, 19.4], [-105.6, 20.5], [-105.3, 21.6], [-106.1, 23], [-107.8, 24.6], [-109.3, 25.6], [-110.2, 27.3], [-112.2, 29.3], [-113.1, 30.8], [-114.8, 31.7], [-114.7, 30.2], [-113.4, 28.6], [-112.2, 27.1], [-111.5, 26], [-110.6, 24.3], [-109.4, 23.2], [-109.9, 22.9], [-111.4, 24.4], [-112.2, 24.8], [-112.8, 26.8], [-114.2, 27.7], [-114.1, 28.6], [-115.6, 29.8], [-116.7, 31.6], [-117.1, 32.6], [-118.4, 33.8], [-119.5, 34.4], [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.6], [-124.4, 40.4], [-124.1, 41.8], [-124.5, 42.8], [-124, 44.5], [-123.9, 46.3], [-124.6, 48.3], [-125.8, 49.4], [-127.9, 50.5], [-128, 51.9], [-130.4, 54.2], [-132.8, 56.5], [-135, 58], [-137.8, 59], [-139.9, 59.7], [-142.7, 60.1], [-145.4, 60.3], [-148, 60.5], [-151.4, 59.2], [-153.9, 57.3], [-156.4, 56], [-158.8, 55.4], [-161.9, 55], [-164.8, 54.4], [-161.5, 55.8], [-158.6, 57.1], [-157.5, 58.5], [-159.9, 58.6], [-161.9, 59.2], [-162.6, 60.4], [-164.9, 60.9], [-165.2, 62.2], [-164.4, 63.2], [-161.4, 63.6], [-160.9, 64.6], [-163.8, 64.4], [-166.5, 64.7]];
      const GREEN = [[-73, 78.3], [-66, 80.8], [-60, 82], [-45, 82.8], [-30, 83.4], [-21, 82.3], [-18, 80], [-19, 77], [-19, 74.5], [-22, 72.3], [-22.5, 70.3], [-26, 68.6], [-32, 68], [-37, 66], [-40.5, 64.8], [-42, 62.5], [-43.5, 60], [-46, 60.8], [-48.5, 61.5], [-50.5, 63.5], [-52, 65.4], [-53.5, 67.5], [-52.8, 69.5], [-54.5, 70.8], [-55, 72.8], [-57.5, 74.5], [-61, 76.1], [-66, 76.4], [-71, 77.5]];
      const BAFFIN = [[-61.9, 66.6], [-65.5, 62.9], [-68.5, 62.6], [-71.5, 63.7], [-77, 65.4], [-73.5, 68.2], [-77.5, 69.8], [-85, 71.2], [-89, 73], [-80, 73.6], [-76, 72.5], [-71, 70.6], [-67.5, 69.5], [-63, 67.5]];
      const ARCTIC = [[-125, 72], [-118, 71], [-108, 70], [-100, 71.5], [-96, 73], [-90, 74.5], [-82, 76], [-78, 79], [-70, 82.5], [-90, 83], [-110, 79], [-122, 76.5]];
      const CUBA = [[-84.9, 21.9], [-83, 23], [-80.5, 23.1], [-77.5, 21.9], [-75.6, 21.1], [-74.2, 20.2], [-75.7, 19.9], [-77.7, 19.8], [-78.4, 20.9], [-80.5, 21.8], [-82.5, 22.1], [-84.4, 21.6]];
      const HISP = [[-74.4, 19.8], [-72.8, 19.9], [-70, 19.7], [-68.4, 18.6], [-70, 18.2], [-71.4, 17.6], [-72.8, 18.2], [-74.4, 18.4]];
      const AFRICA = [[-17.5, 14.7], [-16.8, 12], [-15, 10.9], [-13.3, 9.3], [-11.5, 7], [-7.5, 4.4], [-4, 5.2], [-1, 5], [1.5, 6.1], [4.5, 6.3], [6, 4.3], [8.6, 4.5], [9.6, 3], [9.5, 0.5], [9.2, -1.5], [11.8, -4.8], [12.3, -6], [13.4, -9.5], [13.7, -12], [11.8, -16.5], [11.8, -18], [13.5, -21], [14.5, -23], [15.2, -27], [16.5, -29], [18.4, -32.5], [18.5, -34.3], [20, -34.8], [25.6, -34], [28, -33], [32.4, -28.5], [35.5, -24], [40.5, -11], [41.6, -1.5], [51.2, 11.8], [43.3, 11.8], [38.4, 18.2], [32.6, 29.9], [32.3, 31.3], [25, 31.6], [19.5, 30.3], [11.5, 33.1], [10.2, 36.8], [3, 36.8], [-1.5, 35.1], [-5.9, 35.8], [-9.6, 30.4], [-9.9, 28.7], [-13.2, 27.6], [-16.5, 22.3], [-17.1, 20.9], [-16.2, 19], [-16.5, 16.2]];
      const EUROPE = [[-9.4, 43.1], [-8.8, 41.9], [-9.5, 38.8], [-8.9, 37], [-6.4, 36.9], [-5.4, 36], [-2.1, 36.7], [-0.3, 38.4], [3.2, 41.9], [3.1, 43.1], [6.2, 43.1], [9, 44.4], [12, 44], [18, 40], [25, 38], [30, 45], [30, 55], [24, 57], [30, 60.5], [30, 70], [25, 71], [15, 68.5], [10.5, 64], [5, 62], [5.5, 58.5], [8, 58], [8.6, 56.7], [8.6, 53.9], [4.2, 51.9], [1.6, 50.9], [-1.6, 49.6], [-4.5, 48.4], [-1.8, 46.5], [-1.4, 43.4]];
      const GB = [[-5.7, 50.1], [1.4, 51.3], [1.7, 52.7], [0.1, 53.5], [-1.6, 55.6], [-2, 57.6], [-3.3, 58.6], [-5, 58.6], [-6.2, 56.8], [-4.8, 54.8], [-3, 53.4], [-4.6, 53.3], [-5.2, 51.7], [-3.4, 51.4]];
      const IRL = [[-10.2, 51.6], [-6.2, 52.2], [-6, 53.9], [-5.7, 54.7], [-7.3, 55.3], [-10, 54.2], [-10.3, 52.1]];
      const lands = [NA, GREEN, BAFFIN, ARCTIC, CUBA, HISP, AFRICA, EUROPE, GB, IRL];

      // biomes, clipped to the land
      const biomes = [
        ['#5F9A80', [[-150, 62], [-130, 64], [-110, 62], [-95, 58], [-82, 53], [-66, 56], [-60, 51], [-72, 46], [-88, 47.5], [-100, 52], [-118, 56], [-135, 59]]],
        ['#D6DB8E', [[-114, 52], [-99, 51], [-95, 43], [-97, 33], [-101, 30], [-105, 35], [-109, 43]]],
        ['#E9C08B', [[-121, 37], [-113, 39], [-105, 36.5], [-102, 30.5], [-103.5, 24.5], [-108.5, 23.5], [-112.5, 28], [-116, 31], [-119.5, 34]]],
        ['#79B48C', [[-95, 46], [-80, 46], [-73, 42], [-79, 33], [-86, 30], [-95, 32]]],
        ['#6EAE8A', [[-101, 21.5], [-92, 17], [-84, 12], [-77.5, 8], [-86, 14.5], [-96, 17.5]]],
        ['#4E9A7E', [[-78.5, 3], [-66, 6], [-52, 2], [-46, -4], [-48, -12], [-60, -14], [-72, -11], [-77.5, -4]]],
        ['#BFCB8A', [[-56, -12], [-40, -7], [-39, -20], [-49, -25], [-58, -19]]],
        ['#DCC39C', [[-80.5, 1], [-76, -10], [-70.5, -19], [-70.6, -34], [-72.5, -45], [-74.5, -51], [-70.5, -51], [-68.4, -36], [-66.5, -23], [-69.5, -15], [-76.5, -4], [-77.5, 5]]],
        ['#E0C99A', [[-70, -37], [-58, -34], [-62, -41], [-67.5, -50], [-72, -47]]],
        ['#E5BC84', [[-17, 19.5], [32, 19.5], [32, 31.5], [-10, 31]]],
        ['#F3F1FA', [[-170, 66], [-140, 67.5], [-110, 66], [-90, 65.5], [-80, 62.5], [-62, 60], [-58, 70], [-80, 85], [-160, 85]]],
      ];

      const ocean = k.id('ocean'), landClip = k.id('landc'), disc = k.id('disc'), night = k.id('night'), day = k.id('day'), limb = k.id('limb');
      const rimG = k.id('rim'), haloG = k.id('halo');
      const bl = blur(13), bc = blur(1.4), bh = blur(7);
      const S = (() => { const v = [-0.8, 0.26, 0.46]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
      // sub-solar point on the disc (for the day-side gradient)
      const ssx = EX + ER * S[0] * 0.78, ssy = EY - ER * S[1] * 0.78;
      let defs = '';
      defs += rgU(ocean, ssx, ssy, ER * 1.9, [[0, '#A7DDF6'], [0.22, '#7BB9EE'], [0.48, '#5288E2'], [0.75, '#3F5FCF'], [1, '#3442A8']]);
      defs += `<clipPath id="${disc}"><circle cx="${EX}" cy="${EY}" r="${ER}"/></clipPath>`;
      defs += `<clipPath id="${landClip}">${lands.map((l) => `<path d="${land(l)}"/>`).join('')}</clipPath>`;
      defs += rgU(day, ssx, ssy, ER * 2.0, [[0, '#FFFFFF', 0.22], [0.25, '#FFFFFF', 0.04], [0.5, '#2A2C7A', 0], [0.8, '#23246A', 0.16], [1, '#1E1F5E', 0.3]]);
      defs += rgU(limb, EX, EY, ER, [[0, '#CFEAFF', 0], [0.8, '#CFEAFF', 0], [0.94, '#D8EEFF', 0.28], [1, '#EAF6FF', 0.62]]);
      defs += lgU(rimG, EX - ER, EY - ER * 0.3, EX + ER * 0.6, EY + ER * 0.2, [[0, '#F2FAFF', 0.95], [0.45, '#CDE6FF', 0.75], [0.75, '#A9C0F4', 0.25], [1, '#9AA6EC', 0.05]]);
      defs += lgU(haloG, EX - ER, EY - ER * 0.3, EX + ER * 0.6, EY + ER * 0.2, [[0, '#BFE0FF', 0.9], [0.5, '#A9C8FA', 0.55], [0.8, '#9AA8EE', 0.18], [1, '#8F96E4', 0.05]]);
      defs += bl.def + bc.def + bh.def;

      let s = '';
      // outer halo (behind the disc)
      s += `<circle cx="${EX}" cy="${EY}" r="${ER + 10}" fill="none" stroke="url(#${haloG})" stroke-width="22" filter="url(#${bh.id})"/>`;
      s += `<circle cx="${EX}" cy="${EY}" r="${ER}" fill="url(#${ocean})"/>`;
      let e = '';
      // ocean texture: faint current lines
      {
        const ro = rng(77);
        let cur = '';
        for (let i = 0; i < 26; i++) {
          const lat = -55 + ro() * 110, lon = -170 + ro() * 160, len = 10 + ro() * 25;
          const pts = [];
          for (let t = 0; t <= 1; t += 0.1) { const v = sph(lon + len * t, lat + 3 * Math.sin(t * 3 + i)); if (v[2] > 0.05) pts.push(ep(v)); }
          if (pts.length > 2) cur += `<path d="${smooth(pts)}" stroke="#BFE4FF" stroke-opacity="0.18" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
        }
        e += cur;
      }
      // land with biomes
      e += `<g fill="#9DC79A">${lands.map((l) => `<path d="${land(l)}"/>`).join('')}</g>`;
      e += `<g clip-path="url(#${landClip})">${biomes.map((b) => `<path d="${land(b[1])}" fill="${b[0]}" fill-opacity="0.9" filter="url(#${bc.id})"/>`).join('')}</g>`;
      // coast light: a thin pale line along the coasts (shallows)
      e += `<g fill="none" stroke="#D7F1FF" stroke-opacity="0.45" stroke-width="3">${lands.map((l) => `<path d="${land(l)}"/>`).join('')}</g>`;
      // mountain spines (Rockies, Andes)
      {
        const spine = (ll, w) => { const pts = ll.map((p) => sph(p[0], p[1])).filter((v) => v[2] > 0.05).map(ep); return `<path d="${smooth(pts)}" stroke="#8E7FA8" stroke-opacity="0.35" stroke-width="${w}" fill="none" stroke-linecap="round"/>`; };
        e += spine([[-150, 62], [-135, 59], [-124, 53], [-116, 47], [-110, 41], [-106, 36], [-105, 31]], 5);
        e += spine([[-78, 3], [-78.5, -5], [-75, -12], [-69.5, -19], [-69.5, -28], [-70.5, -36], [-72, -45]], 4.5);
      }

      // clouds
      {
        const rc = rng(2024);
        const ribbons = []; // [screenPts, widths]
        const add = (ll, w0, taper) => {
          // split at the limb
          let seg = [], ws = [];
          const flush = () => { if (seg.length > 2) ribbons.push([seg, ws]); seg = []; ws = []; };
          ll.forEach((p, i) => {
            const v = sph(p[0], p[1]);
            if (v[2] < 0.04) { flush(); return; }
            const t = i / (ll.length - 1);
            const tap = taper ? Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.55) : 1;
            seg.push(ep(v));
            ws.push(Math.max(0.6, w0 * tap * (0.35 + 0.65 * Math.sqrt(v[2])) * (p[2] || 1)));
          });
          flush();
        };
        // cyclones: comma spirals
        const spiral = (lonc, latc, hemi, size, turns, w) => {
          for (let arm = 0; arm < 2; arm++) {
            const pts = [];
            const N = 60;
            for (let i = 0; i <= N; i++) {
              const t = i / N, th = arm * Math.PI + t * turns * Math.PI * 2;
              const r = size * (0.08 + t);
              pts.push([lonc + (r * Math.cos(th)) / Math.cos(latc * D2R), latc + hemi * r * Math.sin(th) * 0.8, 1 - 0.4 * t]);
            }
            add(pts, w * (arm ? 0.7 : 1), true);
          }
        };
        spiral(-36, 50, 1, 11, 1.25, 9);
        spiral(-142, 46, 1, 10, 1.2, 8);
        spiral(-28, -47, -1, 11, 1.2, 8);
        spiral(-112, -44, -1, 10, 1.2, 8);
        spiral(-58, 36, 1, 6, 1.1, 6);
        // fronts trailing south-west from the northern lows, north-west from the southern
        add([[-30, 50], [-38, 44], [-46, 38], [-55, 32], [-64, 27], [-72, 24]].map((p) => [p[0], p[1], 1]), 7, true);
        add([[-136, 46], [-140, 40], [-146, 34], [-152, 28], [-160, 24]], 6, true);
        add([[-22, -46], [-28, -40], [-34, -34], [-40, -29], [-46, -25]], 6, true);
        add([[-106, -44], [-112, -38], [-118, -33], [-126, -29]], 5.5, true);
        // the roaring forties and the northern storm track: long thin streaks
        for (let i = 0; i < 16; i++) {
          const lat = (i % 2 ? -1 : 1) * (40 + rc() * 16), lon = -180 + rc() * 190, len = 18 + rc() * 30;
          const pts = [];
          for (let t = 0; t <= 1.0001; t += 0.08) pts.push([lon + len * t, lat + 2.2 * Math.sin(t * 4 + i) * (lat > 0 ? 1 : -1)]);
          add(pts, 3 + rc() * 3, true);
        }
        // ITCZ: a broken string of thunderstorm puffs near the equator
        let puffs = '';
        for (let lon = -180; lon < 15; lon += 3 + rc() * 5) {
          const lat = 6 + (rc() - 0.5) * 7, rr = 1.2 + rc() * 2.6;
          const v = sph(lon, lat);
          if (v[2] < 0.08) continue;
          const pts = [];
          for (let a = 0; a < 12; a++) pts.push(ep(sph(lon + (rr * Math.cos(a / 12 * Math.PI * 2)) / Math.cos(lat * D2R), lat + rr * Math.sin(a / 12 * Math.PI * 2))));
          puffs += `<path d="${smooth(pts, true)}"/>`;
        }
        // trade-wind cumulus: small scattered flecks
        let flecks = '';
        for (let i = 0; i < 140; i++) {
          const lat = (rc() < 0.5 ? 1 : -1) * (10 + rc() * 22), lon = -180 + rc() * 190;
          const v = sph(lon, lat);
          if (v[2] < 0.1) continue;
          const p = ep(v), w = (3 + rc() * 7) * Math.sqrt(v[2]);
          flecks += `<ellipse cx="${n(p[0])}" cy="${n(p[1])}" rx="${n(w)}" ry="${n(w * 0.45)}" transform="rotate(${n(-15 + rc() * 30)} ${n(p[0])} ${n(p[1])})"/>`;
        }
        // polar cloud and ice cap
        let polar = '';
        {
          const pts = [];
          for (let lon = -180; lon <= 180; lon += 6) pts.push([lon, 73 + 3 * Math.sin(lon * D2R * 5)]);
          polar = `<path d="${land(pts.concat([[180, 90], [-180, 90]]))}"/>`;
        }
        const rib = ribbons.map(([p, w]) => ribbon(p, w)).join('');
        e += `<g fill="#2D3B9E" fill-opacity="0.22" transform="translate(5 4)" filter="url(#${bc.id})"><path d="${rib}"/>${puffs}</g>`;
        e += `<g fill="#FFFFFF" fill-opacity="0.92" filter="url(#${bc.id})"><path d="${rib}"/>${puffs}${flecks}${polar}</g>`;
        // cloud tops: faint lavender undersides for volume
        e += `<g fill="#B9B8EE" fill-opacity="0.35" transform="translate(2 2.5)"><path d="${rib}" transform="scale(1)"/></g>`;
        e += `<g fill="#FFFFFF" fill-opacity="0.85"><path d="${rib}"/></g>`;
      }
      // limb haze, day-side shading
      e += `<circle cx="${EX}" cy="${EY}" r="${ER}" fill="url(#${limb})"/>`;
      e += `<circle cx="${EX}" cy="${EY}" r="${ER}" fill="url(#${day})"/>`;
      // the night side: the terminator is a great circle ⟂ S
      {
        const e1 = (() => { const v = [-S[1], S[0], 0]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
        let e2 = [S[1] * e1[2] - S[2] * e1[1], S[2] * e1[0] - S[0] * e1[2], S[0] * e1[1] - S[1] * e1[0]];
        if (e2[2] < 0) e2 = e2.map((c) => -c);
        const term = [];
        for (let i = 0; i <= 60; i++) {
          const t = (i / 60) * Math.PI;
          const v = [0, 1, 2].map((j) => Math.cos(t) * e1[j] + Math.sin(t) * e2[j]);
          term.push([EX + ER * v[0], EY - ER * v[1]]);
        }
        // close round the night-side limb (from the end of the terminator back to its start)
        const a0 = Math.atan2(-(term[60][1] - EY), term[60][0] - EX), a1 = Math.atan2(-(term[0][1] - EY), term[0][0] - EX);
        // the anti-solar direction tells which way round
        const anti = Math.atan2(-S[1], -S[0]);
        let da = a1 - a0;
        const norm = (x) => Math.atan2(Math.sin(x), Math.cos(x));
        // choose the arc through the anti-solar point
        const mid1 = a0 + norm(da) / 2;
        if (Math.cos(mid1 - anti) < 0) da = norm(da) + (norm(da) > 0 ? -2 * Math.PI : 2 * Math.PI); else da = norm(da);
        const arc = [];
        for (let i = 1; i < 40; i++) { const a = a0 + (da * i) / 40; arc.push([EX + (ER + 30) * Math.cos(a), EY - (ER + 30) * Math.sin(a)]); }
        const nightPath = poly(term.concat(arc));
        defs += lgU(night, EX + ER * S[0] * 0.3, EY - ER * S[1] * 0.3, EX - ER * S[0], EY + ER * S[1], [[0, '#2A2878', 0.7], [0.5, '#221F66', 0.86], [1, '#1D1A5A', 0.92]]);
        e += `<path d="${nightPath}" fill="url(#${night})" filter="url(#${bl.id})"/>`;
        // a few city lights on the night side (faint, warm)
        const rl = rng(311);
        let lights = '';
        const cities = [[-74, 40.7], [-71, 42.4], [-77, 38.9], [-75.2, 40], [-80.2, 25.8], [-84.4, 33.7], [-87.6, 41.9], [-79.4, 43.7], [-73.6, 45.5], [-43.2, -22.9], [-46.6, -23.5], [-58.4, -34.6], [-38.5, -13], [-34.9, -8], [-3.7, 40.4], [-9.1, 38.7], [2.3, 48.9], [-0.1, 51.5], [-6.8, 33.6], [-17.4, 14.7], [3.4, 6.5], [-0.2, 5.6], [-66.9, 10.5], [-74.1, 4.7], [-60, -3.1]];
        for (const c of cities) {
          const v = sph(c[0], c[1]);
          if (v[2] < 0.05) continue;
          const lit = v[0] * S[0] + v[1] * S[1] + v[2] * S[2];
          if (lit > -0.05) continue;
          const p = ep(v);
          lights += `<circle cx="${n(p[0] + (rl() - 0.5) * 2)}" cy="${n(p[1])}" r="${n(1.6 + rl() * 1.6)}"/>`;
        }
        e += `<g fill="#FFD9A0" fill-opacity="0.75">${lights}</g>`;
      }
      s += `<g clip-path="url(#${disc})">${e}</g>`;
      // crisp atmosphere rim on the lit limb
      s += `<circle cx="${EX}" cy="${EY}" r="${ER - 1}" fill="none" stroke="url(#${rimG})" stroke-width="5"/>`;
      parts.push({ defs, svg: s });
    }

    // ==== LUNAR LANDSCAPE ======================================================================
    // A dome-shaped lunar hill with a lit left flank and a shaded right flank.
    function hill(xc, base, h, w, seed, col) {
      const r = rng(seed);
      const pts = [];
      const asym = 0.15 + r() * 0.25;
      const bumps = [[r() * 0.6 - 0.3, 0.06 + r() * 0.06, 0.25], [r() * 0.6 - 0.3, 0.04 + r() * 0.05, 0.18]];
      const prof = (t) => {
        const tt = t < 0 ? t / (1 + asym) : t / (1 - asym * 0.3);
        let v = Math.pow(Math.max(0, 1 - tt * tt), 1.5);
        for (const b of bumps) v += b[1] * Math.max(0, 1 - ((t - b[0]) / b[2]) ** 2);
        return v;
      };
      for (let t = -1; t <= 1.0001; t += 0.05) pts.push([xc + t * w, base - h * prof(t)]);
      const top = pts.reduce((m, p) => (p[1] < m[1] ? p : m), pts[0]);
      let s = `<path d="${smooth([[xc - w, base + 30], ...pts, [xc + w, base + 30]])}Z" fill="${col.base}"/>`;
      // lit sliver on the left flank
      const leftF = pts.filter((p) => p[0] <= top[0]);
      if (leftF.length > 2) {
        const inner = leftF.slice().reverse().map((p, i) => [p[0] + w * 0.12 * Math.sin((i / leftF.length) * Math.PI), p[1] + h * 0.12]);
        s += `<path d="${smooth(leftF.concat(inner))}Z" fill="${col.lit}" fill-opacity="0.55"/>`;
      }
      // shaded right flank
      const rightF = pts.filter((p) => p[0] >= top[0]);
      const sh = rightF.concat([[xc + w, base + 30], [top[0] + w * 0.22, base + 30], [top[0] + w * 0.12, base - h * 0.35], [top[0] + w * 0.02, top[1] + h * 0.15]]);
      s += `<path d="${smooth(sh, true)}" fill="${col.shade}"/>`;
      s += `<path d="${smooth(sh, true)}" fill="url(#${stip})" fill-opacity="0.12"/>`;
      return s;
    }
    // far mountains
    {
      const far = { base: '#A9A0D8', lit: '#D7C8E6', shade: '#8178C0' };
      const mid = { base: '#B6ADDD', lit: '#E4D4E7', shade: '#8C83C6' };
      let s = '';
      for (const [x, h, w, seed] of [[40, 62, 260, 1], [330, 40, 230, 2], [690, 74, 300, 3], [1000, 46, 220, 4], [1260, 88, 260, 5], [1520, 112, 300, 6], [1840, 82, 280, 7], [2080, 60, 220, 8]]) s += hill(x, HZ + 4, h, w, seed, far);
      const hz = k.haze(HZ - 70, 110, '#B9AEE3', 0.55);
      parts.push({ svg: s });
      parts.push(hz);
      let m = '';
      for (const [x, h, w, seed] of [[180, 34, 240, 11], [520, 26, 200, 12], [1180, 30, 230, 13], [1420, 44, 210, 14], [1730, 38, 260, 15], [2010, 30, 200, 16]]) m += hill(x, HZ + 14, h, w, seed, mid);
      parts.push({ svg: m });
    }
    // the plain
    const groundG = k.id('ground'), warmG = k.id('warm');
    parts.push({
      defs: lgU(groundG, 0, HZ, 0, H, [[0, '#BDB4DE'], [0.12, '#C9C0E2'], [0.4, '#D8CFE7'], [1, '#E9E0EC']]) +
        rgU(warmG, -100, 1250, 1200, [[0, '#FBE3D6', 0.55], [0.5, '#F4D6D6', 0.22], [1, '#F0D4DA', 0]]),
      svg: `<path d="M0 ${HZ + 8}Q520 ${HZ - 2} 1040 ${HZ + 6}T2080 ${HZ + 4}V${H}H0Z" fill="url(#${groundG})"/>` +
        `<rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#${warmG})"/>`,
    });

    // craters on the plain, in perspective (smaller and flatter toward the horizon)
    function crater(cx, cy, rx, ry, o) {
      o = Object.assign({ rim: '#EEE4EE', rimSh: '#9B92CB', floor: '#C8BFE0', shadow: '#7A70B8', lip: '#FFF6F4', depth: 0.42, op: 1 }, o || {});
      let s = '';
      s += `<ellipse cx="${n(cx - rx * 0.04)}" cy="${n(cy - ry * 0.06)}" rx="${n(rx * 1.22)}" ry="${n(ry * 1.32)}" fill="${o.rim}" fill-opacity="${n(0.75 * o.op)}"/>`;
      s += `<path d="${crescent(cx, cy, rx * 1.22, ry * 1.32, -rx * 0.5)}" fill="${o.rimSh}" fill-opacity="${n(0.4 * o.op)}"/>`;
      s += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${o.floor}" fill-opacity="${o.op}"/>`;
      s += `<path d="${crescent(cx, cy, rx, ry, rx * o.depth * 2)}" fill="${o.shadow}" fill-opacity="${n(0.8 * o.op)}"/>`;
      s += `<path d="${crescent(cx, cy, rx, ry, rx * o.depth * 2)}" fill="url(#${stip})" fill-opacity="${n(0.18 * o.op)}"/>`;
      s += `<path d="${crescent(cx, cy, rx, ry, -rx * 0.18)}" fill="${o.lip}" fill-opacity="${n(0.55 * o.op)}"/>`;
      return s;
    }
    const persp = (y) => Math.max(0.02, (y - (HZ - 6)) / (H - HZ)); // 0 at horizon → 1 at bottom
    {
      const rc = rng(5151);
      let s = '';
      const list = [];
      for (let i = 0; i < 70; i++) {
        const y = HZ + 10 + Math.pow(rc(), 1.6) * (H - HZ - 10);
        const x = rc() * W;
        const p = persp(y);
        const rx = (8 + rc() * 42) * (0.25 + p * 1.6);
        list.push([x, y, rx, rx * (0.12 + 0.3 * p)]);
      }
      // a couple of named-size craters
      list.push([1500, 1158, 210, 26]);
      list.push([760, 1135, 120, 14]);
      list.push([300, 1175, 90, 16]);
      list.sort((a, b) => a[1] - b[1]);
      for (const c of list) {
        // keep clear of the LM's feet and the caption corner
        if (c[0] < 760 && c[1] > 1370) continue;
        s += crater(c[0], c[1], c[2], c[3], { op: c[1] > 1300 ? 0.75 : 1 });
      }
      // pebbles
      let peb = '';
      for (let i = 0; i < 260; i++) {
        const y = HZ + 14 + Math.pow(rc(), 1.3) * (H - HZ - 14), x = rc() * W;
        const p = persp(y), r = (1.5 + rc() * 4) * (0.3 + p * 1.4);
        peb += `<ellipse cx="${n(x + r * 0.9)}" cy="${n(y + r * 0.25)}" rx="${n(r * 1.6)}" ry="${n(r * 0.42)}" fill="#7A70B8" fill-opacity="0.32"/>`;
        peb += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r)}" ry="${n(r * 0.62)}" fill="#A79ED2"/><ellipse cx="${n(x - r * 0.25)}" cy="${n(y - r * 0.2)}" rx="${n(r * 0.55)}" ry="${n(r * 0.32)}" fill="#F6EDF1" fill-opacity="0.85"/>`;
      }
      // regolith ripples: faint light/dark dashes
      let rip = '';
      for (let i = 0; i < 160; i++) {
        const y = HZ + 20 + Math.pow(rc(), 1.2) * (H - HZ - 20), x = rc() * W, p = persp(y);
        rip += `M${n(x)} ${n(y)}q${n(20 * p + 6)} ${n(-2 * p)} ${n(40 * p + 12)} 0`;
      }
      parts.push({ svg: s + `<path d="${rip}" stroke="#FFF7F4" stroke-opacity="0.35" stroke-width="2" fill="none" stroke-linecap="round"/>` + peb });
    }

    // ==== THE LUNAR MODULE ====================================================================
    // Object space: metres, x to the right, y up, z toward the viewer; origin on
    // the ground under the centre of the descent stage.
    const CAM = { D: 17, E: 2.3, F: 74 * 17, cx: 612, hy: 1105 };
    const YAW = 14 * D2R, cyw = Math.cos(YAW), syw = Math.sin(YAW);
    const rot = (p) => [p[0] * cyw + p[2] * syw, p[1], -p[0] * syw + p[2] * cyw];
    const pr = (p) => { const r = rot(p); const d = CAM.D - r[2]; return [CAM.cx + (CAM.F * r[0]) / d, CAM.hy - (CAM.F * (r[1] - CAM.E)) / d]; };
    const scaleAt = (p) => CAM.F / (CAM.D - rot(p)[2]);
    const CAMPOS = [-CAM.D * syw, CAM.E, CAM.D * cyw];
    const Lv = (() => { const v = [-0.62, 0.62, 0.48]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const norm3 = (a) => { const m = Math.hypot(...a) || 1; return mul(a, 1 / m); };
    const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const lum = (nrm) => 0.2 + 0.8 * Math.max(0, dot(norm3(nrm), Lv));
    const visible = (center, nrm) => dot(sub(CAMPOS, center), nrm) > 0;
    // ground shadow of a point
    const shadowOf = (p) => [p[0] - (p[1] * Lv[0]) / Lv[1], 0, p[2] - (p[1] * Lv[2]) / Lv[1]];

    const GOLD = [[0, '#6E4A6E'], [0.25, '#A8644E'], [0.45, '#D88E48'], [0.65, '#EDB45A'], [0.82, '#F7D47C'], [1, '#FFF0BC']];
    const SILVER = [[0, '#4C4B90'], [0.3, '#7F7DBB'], [0.55, '#B5B2DD'], [0.78, '#DCD9F1'], [1, '#FAF8FF']];
    const BLACK = [[0, '#1C1D55'], [0.5, '#2D2F6E'], [0.8, '#40438A'], [1, '#5A5EA6']];
    const DARK = '#1F2060';

    let lmDefs = '';
    // A planar face, filled with a gentle gradient of its material.
    function face(pts3, mat, nrm, o) {
      o = o || {};
      const p2 = pts3.map(pr);
      const v = (o.v != null ? o.v : lum(nrm)) + (o.dv || 0);
      const g = k.id('f');
      const xs = p2.map((p) => p[0]), ys = p2.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      lmDefs += lgU(g, x0, y0, o.horiz ? x1 : x0 + (x1 - x0) * 0.3, o.horiz ? y0 : y1, [[0, ramp(mat, v + (o.top != null ? o.top : 0.08))], [1, ramp(mat, v - (o.bot != null ? o.bot : 0.1))]]);
      return `<path d="${poly(p2)}" fill="url(#${g})"/>`;
    }
    // Crinkled foil: the face is cut into jittered triangles of varying tone.
    function foil(quad3, mat, nrm, seed, nx, ny, o) {
      o = o || {};
      const r = rng(seed);
      const v0 = lum(nrm) + (o.dv || 0);
      const [A, B, Cq, Dq] = quad3; // A top-left, B top-right, C bottom-right, D bottom-left
      const P = (s, t) => { const top = add3(mul(A, 1 - s), mul(B, s)), bot = add3(mul(Dq, 1 - s), mul(Cq, s)); return add3(mul(top, 1 - t), mul(bot, t)); };
      const grid = [];
      for (let j = 0; j <= ny; j++) {
        grid.push([]);
        for (let i = 0; i <= nx; i++) {
          let s = i / nx, t = j / ny;
          if (i > 0 && i < nx) s += (r() - 0.5) * 0.7 / nx;
          if (j > 0 && j < ny) t += (r() - 0.5) * 0.7 / ny;
          grid[j].push(pr(P(s, t)));
        }
      }
      let out = '', hi = '';
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
          const t = j / ny;
          const flip = r() < 0.5;
          const tris = flip ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
          for (const tri of tris) {
            const v = v0 + (r() - 0.5) * (o.spread || 0.34) + (0.05 - t * 0.12);
            out += `<path d="${poly(tri)}" fill="${ramp(mat, v)}" stroke="${ramp(mat, v)}" stroke-width="0.6"/>`;
          }
          if (r() < 0.45) hi += `M${n(a[0])} ${n(a[1])}L${n(c[0])} ${n(c[1])}`;
        }
      }
      out += `<path d="${hi}" stroke="${o.hiCol || '#FFF6D2'}" stroke-opacity="${o.hiOp || 0.35}" stroke-width="1.3" fill="none"/>`;
      return out;
    }
    // A strut (cylinder) between two 3-D points, shaded across its width.
    function strut(a, b, rad, mat, o) {
      o = o || {};
      const pa = pr(a), pb = pr(b);
      const ra = rad * scaleAt(a), rb = rad * scaleAt(b);
      let dx = pb[0] - pa[0], dy = pb[1] - pa[1];
      const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      const nx = -dy, ny = dx;
      const q = [[pa[0] + nx * ra, pa[1] + ny * ra], [pb[0] + nx * rb, pb[1] + ny * rb], [pb[0] - nx * rb, pb[1] - ny * rb], [pa[0] - nx * ra, pa[1] - ny * ra]];
      const g = k.id('st');
      // which side faces the light (screen-space, light from upper left)
      const lightSide = nx * -0.8 + ny * -0.6 > 0 ? 1 : -1;
      const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2, rr = (ra + rb) / 2;
      const v = o.v != null ? o.v : 0.62;
      lmDefs += lgU(g, mx + nx * rr * lightSide, my + ny * rr * lightSide, mx - nx * rr * lightSide, my - ny * rr * lightSide,
        [[0, ramp(mat, v + 0.3)], [0.3, ramp(mat, v + 0.12)], [0.65, ramp(mat, v - 0.15)], [1, ramp(mat, v - 0.32)]]);
      let s = `<path d="${poly(q)}" fill="url(#${g})"/>`;
      if (o.hi !== false) s += `<path d="M${n(pa[0] + nx * ra * lightSide * 0.45)} ${n(pa[1] + ny * ra * lightSide * 0.45)}L${n(pb[0] + nx * rb * lightSide * 0.45)} ${n(pb[1] + ny * rb * lightSide * 0.45)}" stroke="#FFFFFF" stroke-opacity="${o.hiOp || 0.45}" stroke-width="${n(Math.max(1, rr * 0.35))}" stroke-linecap="round"/>`;
      return s;
    }
    // A horizontal circle (y = const) as projected points.
    const hcircle = (c, r, N) => { const out = []; for (let i = 0; i < (N || 32); i++) { const a = (i / (N || 32)) * Math.PI * 2; out.push(pr([c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)])); } return out; };
    // A disc of radius r around centre c facing nrm, as projected points.
    const disc3 = (c, nrm, r, N) => {
      const nn = norm3(nrm);
      const e1 = norm3(Math.abs(nn[1]) < 0.9 ? cross3(nn, [0, 1, 0]) : cross3(nn, [1, 0, 0]));
      const e2 = cross3(nn, e1);
      const out = [];
      for (let i = 0; i < (N || 28); i++) { const a = (i / (N || 28)) * Math.PI * 2; out.push(pr(add3(c, add3(mul(e1, r * Math.cos(a)), mul(e2, r * Math.sin(a)))))); }
      return out;
    };

    // geometry
    const RV = 2.1 / Math.cos(22.5 * D2R);
    const oct = []; for (let i = 0; i < 8; i++) { const a = (22.5 + 45 * i) * D2R; oct.push([RV * Math.cos(a), RV * Math.sin(a)]); }
    const DS0 = 1.38, DS1 = 3.05; // descent stage bottom / top
    const legs = [
      { u: [0, 1], name: 'front' }, { u: [-1, 0], name: 'left' }, { u: [1, 0], name: 'right' }, { u: [0, -1], name: 'back' },
    ].map((L) => {
      const u = [L.u[0], 0, L.u[1]], t = [-L.u[1], 0, L.u[0]];
      return Object.assign(L, {
        u3: u, t3: t,
        top: add3(mul(u, 2.22), [0, 2.92, 0]),
        joint: add3(mul(u, 4.25), [0, 0.34, 0]),
        pad: add3(mul(u, 4.25), [0, 0, 0]),
      });
    });
    const along = (L, f) => add3(mul(L.joint, 1 - f), mul(L.top, f));

    let lmBack = '', lmStage = '', lmAscent = '', lmFront = '', lmShadow = '';

    // ---- shadow on the ground ----
    {
      const sp = (p) => pr(shadowOf(p));
      const pts = [];
      for (const v of oct) for (const y of [DS0, DS1]) pts.push(sp([v[0], y, v[1]]));
      let sh = `<path d="${poly(hull(pts))}"/>`;
      const asc = [];
      for (const x of [-1.95, 1.95]) for (const y of [3.05, 4.4, 5.2]) for (const z of [-2.0, 1.25]) asc.push(sp([x * (y > 5 ? 0.78 : 1), y, z]));
      asc.push(sp([0, 6.05, -0.35]), sp([-0.45, 6.05, -0.35]), sp([0.45, 6.05, -0.35]));
      sh += `<path d="${poly(hull(asc))}"/>`;
      let lines = '';
      for (const L of legs) {
        const a = pr(L.pad), b = sp(L.top);
        lines += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
        for (const sgn of [-1, 1]) { const c = sp(add3(add3(mul(L.u3, 2.1), mul(L.t3, sgn * 0.9)), [0, DS0, 0])); const j = sp(along(L, 0.3)); lines += `M${n(j[0])} ${n(j[1])}L${n(c[0])} ${n(c[1])}`; }
      }
      // antennas
      const rr = sp([0.98, 6.0, 0.95]), sb = sp([-1.72, 6.05, -1.35]);
      sh += `<ellipse cx="${n(rr[0])}" cy="${n(rr[1])}" rx="22" ry="7"/><ellipse cx="${n(sb[0])}" cy="${n(sb[1])}" rx="24" ry="8"/>`;
      const v1 = sp([-1.15, 6.55, -2.1]), v0 = sp([-0.55, 5.2, -1.8]);
      lines += `M${n(v0[0])} ${n(v0[1])}L${n(v1[0])} ${n(v1[1])}`;
      const padSh = legs.map((L) => { const c = pr(L.pad); const s = scaleAt(L.pad); return `<ellipse cx="${n(c[0] + s * 0.25)}" cy="${n(c[1] + 1)}" rx="${n(s * 0.62)}" ry="${n(s * 0.14)}"/>`; }).join('');
      lmShadow = `<g fill="#40388C" stroke="#40388C" opacity="0.34">${sh}<path d="${lines}" stroke-width="9" stroke-linecap="round" fill="none"/>${padSh}</g>`;
    }

    // ---- a leg: struts, footpad, probe ----
    function footpad(L, front) {
      const c = L.pad, sc = scaleAt(c);
      const bot = hcircle([c[0], 0.03, c[2]], 0.47, 36), rimTop = hcircle([c[0], 0.13, c[2]], 0.47, 36), cone = hcircle([c[0], 0.3, c[2]], 0.13, 24);
      const idx = (arr, f) => arr.reduce((bi, p, i) => (f(p, arr[bi]) ? i : bi), 0);
      const li = idx(rimTop, (p, q) => p[0] < q[0]), ri = idx(rimTop, (p, q) => p[0] > q[0]);
      // front arc = the half of the circle with larger y (nearer)
      const frontArc = (arr) => { const out = []; let i = li; while (i !== ri) { out.push(arr[i]); i = (i + 1) % arr.length; } out.push(arr[ri]); return out; };
      const backArc = (arr) => { const out = []; let i = ri; while (i !== li) { out.push(arr[i]); i = (i + 1) % arr.length; } out.push(arr[li]); return out; };
      // decide which arc is in front by its mean y
      const fa = frontArc(rimTop), ba = backArc(rimTop);
      const isFront = fa.reduce((s, p) => s + p[1], 0) / fa.length > ba.reduce((s, p) => s + p[1], 0) / ba.length;
      const nearTop = isFront ? fa : ba;
      const nearBot = (isFront ? frontArc : backArc)(bot);
      const g = k.id('pad'), gt = k.id('padt');
      const x0 = rimTop[li][0], x1 = rimTop[ri][0];
      lmDefs += lgU(g, x0, 0, x1, 0, [[0, '#FFF0C4'], [0.3, '#EFC06A'], [0.7, '#C98450'], [1, '#8C5A6A']]);
      lmDefs += lgU(gt, x0, 0, x1, 0, [[0, '#FFF7DC'], [0.45, '#F3D08A'], [1, '#B27A5E']]);
      let s = '';
      // dust mound around the pad
      s += `<ellipse cx="${n(c[0] === 0 ? pr(c)[0] : pr(c)[0])}" cy="${n(pr(c)[1] + 2)}" rx="${n(sc * 0.62)}" ry="${n(sc * 0.13)}" fill="#E9DFEC"/>`;
      s += `<path d="${poly(nearTop.concat(nearBot.slice().reverse()))}" fill="url(#${g})"/>`;
      s += `<path d="${poly(rimTop)}" fill="url(#${gt})"/>`;
      // the shallow cone up to the ball joint
      const ci = idx(cone, (p, q) => p[0] < q[0]), cj = idx(cone, (p, q) => p[0] > q[0]);
      s += `<path d="M${n(rimTop[li][0] + (x1 - x0) * 0.1)} ${n(rimTop[li][1])}L${n(cone[ci][0])} ${n(cone[ci][1])}L${n(cone[cj][0])} ${n(cone[cj][1])}L${n(rimTop[ri][0] - (x1 - x0) * 0.1)} ${n(rimTop[ri][1])}Z" fill="#E8B866" fill-opacity="0.85"/>`;
      s += `<path d="M${n(rimTop[li][0] + (x1 - x0) * 0.1)} ${n(rimTop[li][1])}L${n(cone[ci][0])} ${n(cone[ci][1])}" stroke="#FFF4D0" stroke-width="2" stroke-opacity="0.8"/>`;
      s += `<path d="${pline(nearTop)}" stroke="#FFF7DE" stroke-width="2" fill="none" stroke-opacity="0.8"/>`;
      // foil crinkles on the rim
      const rr = rng(c[0] * 100 + c[2] * 10 + 7);
      let cr = '';
      for (let i = 0; i < 9; i++) { const t = 0.12 + rr() * 0.76; const a = nearTop[Math.floor(t * (nearTop.length - 1))], b = nearBot[Math.floor(t * (nearBot.length - 1))]; cr += `M${n(a[0])} ${n(a[1] + 1)}L${n(b[0] + (rr() - 0.5) * 3)} ${n(b[1] - 1)}`; }
      s += `<path d="${cr}" stroke="#8C5A5E" stroke-opacity="0.35" stroke-width="1.4"/>`;
      // contact probe (not on the front leg), bent over on the ground
      if (!front) {
        const out = L.u3;
        const p0 = pr(add3(c, add3(mul(out, 0.2), [0, 0.04, 0]))), p1 = pr(add3(c, add3(mul(out, 0.75), [0, 0.02, 0.15]))), p2 = pr(add3(c, add3(mul(out, 1.55), [0, 0.0, 0.5])));
        s = `<path d="M${n(p0[0])} ${n(p0[1])}Q${n(p1[0])} ${n(p1[1] + 3)} ${n(p2[0])} ${n(p2[1])}" stroke="#8B86BE" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M${n(p0[0])} ${n(p0[1] - 1)}Q${n(p1[0])} ${n(p1[1] + 2)} ${n(p2[0])} ${n(p2[1] - 1)}" stroke="#F4F0FF" stroke-width="1.2" fill="none" stroke-opacity="0.7"/>` + s;
      }
      return s;
    }
    function legStruts(L, part) {
      let s = '';
      const lowC = (sgn) => add3(add3(mul(L.u3, 2.12), mul(L.t3, sgn * 0.88)), [0, DS0 + 0.04, 0]);
      const j30 = along(L, 0.3), j55 = along(L, 0.56);
      if (part === 'back2') {
        // secondary struts that lie behind (−z side for side legs)
        for (const sgn of [-1, 1]) { const c = lowC(sgn); if (c[2] < -0.1) s += strut(j30, c, 0.05, SILVER, { v: 0.55 }); }
        return s;
      }
      if (part === 'all-back') {
        for (const sgn of [-1, 1]) s += strut(j30, lowC(sgn), 0.05, SILVER, { v: 0.45 });
        s += strut(j55, add3(mul(L.u3, 2.12), [0, DS0, 0]), 0.045, SILVER, { v: 0.45 });
        s += strut(L.joint, j55, 0.07, SILVER, { v: 0.5 }) + strut(j55, L.top, 0.105, GOLD, { v: 0.5 });
        return s;
      }
      // front parts
      for (const sgn of [-1, 1]) { const c = lowC(sgn); if (c[2] >= -0.1 || L.name === 'front') s += strut(j30, c, 0.05, SILVER, { v: 0.62 }); }
      s += strut(j55, add3(mul(L.u3, 2.12), [0, DS0, 0]), 0.045, SILVER, { v: 0.6 });
      s += strut(L.joint, j55, 0.072, SILVER, { v: 0.7, hiOp: 0.7 });
      s += strut(j55, L.top, 0.11, GOLD, { v: L.name === 'right' ? 0.5 : 0.72 });
      // collar where the piston enters the cylinder
      const cp = pr(j55), cs = scaleAt(j55);
      s += `<circle cx="${n(cp[0])}" cy="${n(cp[1])}" r="${n(cs * 0.13)}" fill="#B7B3DD"/><circle cx="${n(cp[0] - cs * 0.03)}" cy="${n(cp[1] - cs * 0.03)}" r="${n(cs * 0.06)}" fill="#F7F4FF"/>`;
      // the upper outrigger joint
      const tp = pr(L.top), ts = scaleAt(L.top);
      s += `<circle cx="${n(tp[0])}" cy="${n(tp[1])}" r="${n(ts * 0.13)}" fill="${DARK}" fill-opacity="0.8"/>`;
      return s;
    }

    // rear leg (behind everything)
    {
      const L = legs[3];
      lmBack += footpad(L, false) + legStruts(L, 'all-back');
      for (const L2 of [legs[1], legs[2]]) lmBack += legStruts(L2, 'back2');
    }

    // descent engine bell
    {
      const top = hcircle([0, DS0 + 0.02, 0], 0.42, 32), bot = hcircle([0, 0.78, 0], 0.72, 32);
      const xs = bot.map((p) => p[0]);
      const li = xs.indexOf(Math.min(...xs)), ri = xs.indexOf(Math.max(...xs));
      const tx = top.map((p) => p[0]);
      const tli = tx.indexOf(Math.min(...tx)), tri = tx.indexOf(Math.max(...tx));
      const g = k.id('bell');
      lmDefs += lgU(g, bot[li][0], 0, bot[ri][0], 0, [[0, '#D9D4EE'], [0.35, '#9A96C8'], [0.75, '#55538F'], [1, '#34336E']]);
      // nearer half of the exit rim
      const arc = []; for (let i = li; ; i = (i + 1) % bot.length) { arc.push(bot[i]); if (i === ri) break; }
      const near = arc.reduce((s, p) => s + p[1], 0) / arc.length > (bot[li][1] + bot[ri][1]) / 2 ? arc : (() => { const a2 = []; for (let i = ri; ; i = (i + 1) % bot.length) { a2.push(bot[i]); if (i === li) break; } return a2.reverse(); })();
      lmStage += `<path d="M${n(top[tli][0])} ${n(top[tli][1])}L${n(bot[li][0])} ${n(bot[li][1])}${near.map((p) => `L${n(p[0])} ${n(p[1])}`).join('')}L${n(bot[ri][0])} ${n(bot[ri][1])}L${n(top[tri][0])} ${n(top[tri][1])}Z" fill="url(#${g})"/>`;
      lmStage += `<path d="${pline(near)}" stroke="#F3F0FF" stroke-width="2.4" fill="none" stroke-opacity="0.7"/>`;
    }

    // ---- ascent stage (drawn before the descent stage: the stage's near top edge overlaps its foot) ----
    {
      let s = '';
      const box = (x0, x1, y0, y1, z0, z1, mat, o) => {
        o = o || {};
        let out = '';
        // left face
        const lf = [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]];
        if (visible([x0, (y0 + y1) / 2, (z0 + z1) / 2], [-1, 0, 0]) && !o.noLeft) out += o.foilLeft ? foil(lf, mat, [-1, 0, 0], o.seed || 3, o.nx || 4, o.ny || 3, o) : face(lf, mat, [-1, 0, 0]);
        const rf = [[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]];
        if (visible([x1, (y0 + y1) / 2, (z0 + z1) / 2], [1, 0, 0]) && !o.noRight) out += face(rf, mat, [1, 0, 0]);
        const ff = [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]];
        if (!o.noFront) out += o.foilFront ? foil(ff, mat, [0, 0, 1], (o.seed || 3) + 1, o.nx || 4, o.ny || 3, o) : face(ff, mat, [0, 0, 1], o);
        return out;
      };
      // VHF antennas and the S-band steerable dish (behind / above the body)
      const rod = (a, b, w, col) => { const pa = pr(a), pb = pr(b); return `<path d="M${n(pa[0])} ${n(pa[1])}L${n(pb[0])} ${n(pb[1])}" stroke="${col || '#C9C5EA'}" stroke-width="${w}" stroke-linecap="round"/>`; };
      s += rod([-0.55, 5.1, -1.8], [-1.2, 6.62, -2.1], 2.6) + rod([0.55, 5.1, -1.85], [1.18, 6.45, -2.1], 2.4);
      { const p = pr([-1.2, 6.62, -2.1]); s += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="2.6" fill="#E9E6FA"/>`; }
      // aft equipment bay + midsection
      s += box(-1.42, 1.42, 3.3, 4.95, -2.85, -1.9, SILVER, { v: 0.5, noFront: true });
      s += box(-1.5, 1.5, 3.12, 5.18, -1.95, 0.24, SILVER, { dv: -0.02 });
      // the midsection's upper chamfer (shoulder) on the left, rising to the roof
      s += face([[-1.5, 5.18, -1.95], [-1.5, 5.18, 0.24], [-1.1, 5.5, 0.24], [-1.1, 5.5, -1.95]], SILVER, [-0.62, 0.78, 0], { dv: 0.05 });
      // S-band dish on its boom (upper left, rear)
      {
        const base = [-1.15, 5.3, -1.2], hub = [-1.62, 5.92, -1.25];
        s += strut(base, hub, 0.05, SILVER, { v: 0.6 });
        const dn = [-0.5, 0.55, 0.67], c = [-1.74, 6.05, -1.22];
        const dpts = disc3(c, dn, 0.36, 32);
        const g = k.id('dish');
        const xs = dpts.map((p) => p[0]), ys = dpts.map((p) => p[1]);
        lmDefs += lgU(g, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), [[0, '#FFFFFF'], [0.5, '#D6D3EE'], [1, '#8D8AC4']]);
        s += `<path d="${poly(dpts)}" fill="url(#${g})"/>`;
        s += `<path d="${poly(disc3(add3(c, mul(norm3(dn), 0.04)), dn, 0.27, 28))}" fill="#9F9BD0" fill-opacity="0.55"/>`;
        s += rod(c, add3(c, mul(norm3(dn), 0.3)), 2.4, '#5B5A9C');
        const tip = pr(add3(c, mul(norm3(dn), 0.3)));
        s += `<circle cx="${n(tip[0])}" cy="${n(tip[1])}" r="3" fill="#F2EFFF"/>`;
      }
      // docking tunnel on the roof
      {
        const c = [0, 0, -0.35];
        const pl = pr([c[0] - 0.44, 5.95, c[2]]), prr = pr([c[0] + 0.44, 5.95, c[2]]), bl = pr([c[0] - 0.44, 5.3, c[2]]), br = pr([c[0] + 0.44, 5.3, c[2]]);
        const g = k.id('tun');
        lmDefs += lgU(g, pl[0], 0, prr[0], 0, [[0, '#F6F3FF'], [0.35, '#D2CFEC'], [0.8, '#8C89C2'], [1, '#6B69A8']]);
        s += `<path d="M${n(bl[0])} ${n(bl[1])}L${n(pl[0])} ${n(pl[1])}Q${n((pl[0] + prr[0]) / 2)} ${n(pl[1] + 9)} ${n(prr[0])} ${n(prr[1])}L${n(br[0])} ${n(br[1])}Z" fill="url(#${g})"/>`;
        const ll = pr([c[0] - 0.5, 6.05, c[2]]), lr = pr([c[0] + 0.5, 6.05, c[2]]);
        s += `<path d="M${n(ll[0])} ${n(ll[1])}Q${n((ll[0] + lr[0]) / 2)} ${n(ll[1] + 9)} ${n(lr[0])} ${n(lr[1])}L${n(lr[0])} ${n(lr[1] + 7)}Q${n((ll[0] + lr[0]) / 2)} ${n(ll[1] + 16)} ${n(ll[0])} ${n(ll[1] + 7)}Z" fill="#E4E1F6"/>`;
        s += `<path d="M${n(ll[0])} ${n(ll[1] + 7)}Q${n((ll[0] + lr[0]) / 2)} ${n(ll[1] + 16)} ${n(lr[0])} ${n(lr[1] + 7)}" stroke="#6C6AA8" stroke-width="1.6" fill="none"/>`;
      }
      // the cabin: a prism, front face at z = 1.25 with chamfered upper corners
      const ZF = 1.25, ZB = 0.24;
      const hexF = [[-1.15, 3.12], [1.15, 3.12], [1.15, 4.9], [0.78, 5.45], [-0.78, 5.45], [-1.15, 4.9]];
      // roof (we see only its front edge from below) and left chamfer
      s += face([[-1.15, 4.9, ZB], [-1.15, 4.9, ZF], [-0.78, 5.45, ZF], [-0.78, 5.45, ZB]], SILVER, [-0.83, 0.56, 0], { dv: 0.06 });
      s += face([[-1.15, 5.0, ZB], [-1.15, 5.0, ZF], [-1.15, 3.12, ZF], [-1.15, 3.12, ZB]].map((p, i) => (i < 2 ? [p[0], 4.9, p[2]] : p)), SILVER, [-1, 0, 0], { dv: 0.02 });
      // cheeks: the ascent-propellant tank fairings, low on each side
      for (const sgn of [-1, 1]) {
        const x0 = sgn < 0 ? -1.98 : 1.5, x1 = sgn < 0 ? -1.5 : 1.98;
        s += box(x0, x1, 3.14, 4.28, -1.5, 0.12, SILVER, { dv: sgn < 0 ? 0.04 : -0.12, noRight: sgn < 0 });
        // rounded top edge
        const a = pr([x0, 4.28, 0.12]), b = pr([x1, 4.28, 0.12]);
        s += `<path d="M${n(a[0])} ${n(a[1] + 1)}L${n(b[0])} ${n(b[1] + 1)}" stroke="#FFFFFF" stroke-opacity="${sgn < 0 ? 0.7 : 0.35}" stroke-width="2.5"/>`;
      }
      // front face
      s += face(hexF.map((p) => [p[0], p[1], ZF]), SILVER, [0, 0, 1], { dv: 0.02 });
      // vertical light on the face's left edge, shade on the right
      {
        const a = pr([-1.15, 3.14, ZF]), b = pr([-1.15, 4.9, ZF]);
        s += `<path d="M${n(a[0] + 2)} ${n(a[1])}L${n(b[0] + 2)} ${n(b[1])}" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.75"/>`;
        const c = pr([1.15, 3.14, ZF]), d = pr([1.15, 4.9, ZF]), e = pr([0.78, 5.45, ZF]);
        s += `<path d="M${n(c[0] - 1)} ${n(c[1])}L${n(d[0] - 1)} ${n(d[1])}L${n(e[0] - 1)} ${n(e[1])}" stroke="#4E4D92" stroke-width="3" stroke-opacity="0.5" fill="none"/>`;
      }
      const F = (x, y) => pr([x, y, ZF + 0.005]);
      const fpoly = (pts) => poly(pts.map((p) => F(p[0], p[1])));
      // black thermal blanket: the window "mask" and the band under the hatch
      {
        const mask = [[-1.15, 4.88], [-0.78, 5.43], [0.78, 5.43], [1.15, 4.88], [0.5, 4.24], [-0.5, 4.24]];
        const g = k.id('mask');
        const p0 = F(-1.15, 5.4), p1 = F(1.15, 4.3);
        lmDefs += lgU(g, p0[0], p0[1], p1[0], p1[1], [[0, '#4B4F96'], [0.45, '#2C2F6C'], [1, '#1E2058']]);
        s += `<path d="${fpoly(mask)}" fill="url(#${g})"/>`;
        // crinkle sheen on the blanket
        const rb = rng(88);
        let cr = '';
        for (let i = 0; i < 22; i++) { const x = -1 + rb() * 2, y = 4.35 + rb() * 0.95; if (Math.abs(x) > 1.12 - (y - 4.3) * 0.5 && y > 4.88) continue; const a = F(x, y), b = F(x + (rb() - 0.5) * 0.25, y + 0.1 + rb() * 0.15); cr += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`; }
        s += `<path d="${cr}" stroke="#8D92DA" stroke-opacity="0.45" stroke-width="1.3"/>`;
        s += `<path d="${fpoly([[-1.15, 3.12], [1.15, 3.12], [1.15, 3.24], [-1.15, 3.24]])}" fill="#2B2E6C"/>`;
        // triangular windows: top edge, near-vertical inner edge, raked outer edge
        for (const sgn of [-1, 1]) {
          const tri = [[sgn * 0.92, 5.1], [sgn * 0.13, 5.1], [sgn * 0.19, 4.43]];
          const gw = k.id('win');
          const a = F(sgn * 0.92, 5.1), b = F(sgn * 0.16, 4.45);
          lmDefs += lgU(gw, a[0], a[1], b[0], b[1], [[0, '#7E8BE0'], [0.35, '#3A45A2'], [1, '#161850']]);
          s += `<path d="${fpoly(tri)}" fill="url(#${gw})" stroke="#C9C6EA" stroke-width="2.4" stroke-linejoin="round"/>`;
          // reflection streak
          const r1 = F(sgn * 0.7, 5.06), r2 = F(sgn * 0.5, 5.06), r3 = F(sgn * 0.24, 4.62), r4 = F(sgn * 0.22, 4.75);
          s += `<path d="${poly([r1, r2, r4, r3].map((p, i) => (i === 3 ? [p[0], p[1]] : p)))}" fill="#E7EBFF" fill-opacity="0.28"/>`;
        }
        // centre post between the windows
        s += `<path d="${fpoly([[-0.05, 5.12], [0.05, 5.12], [0.08, 4.4], [-0.08, 4.4]])}" fill="#3B3F86"/>`;
      }
      // forward hatch
      {
        s += `<path d="${fpoly([[-0.46, 3.26], [0.46, 3.26], [0.46, 4.14], [-0.46, 4.14]])}" fill="#8986C0"/>`;
        const g = k.id('hatch');
        const a = F(-0.4, 4.1), b = F(0.4, 3.3);
        lmDefs += lgU(g, a[0], a[1], b[0], b[1], [[0, '#F4F2FD'], [0.5, '#C9C6E6'], [1, '#9895CB']]);
        s += `<path d="${fpoly([[-0.4, 3.31], [0.4, 3.31], [0.4, 4.09], [-0.4, 4.09]])}" fill="url(#${g})"/>`;
        s += `<path d="${fpoly([[-0.3, 3.4], [0.3, 3.4], [0.3, 4.0], [-0.3, 4.0]])}" fill="none" stroke="#7B78B5" stroke-width="1.6" stroke-opacity="0.6"/>`;
        const h1 = F(0.2, 3.62), h2 = F(0.2, 3.82);
        s += `<path d="M${n(h1[0])} ${n(h1[1])}L${n(h2[0])} ${n(h2[1])}" stroke="#3F3E82" stroke-width="3.2" stroke-linecap="round"/>`;
      }
      // panel seams on the silver
      {
        let seams = '';
        for (const [a, b] of [[[-1.15, 4.3], [-0.55, 4.3]], [[0.55, 4.3], [1.15, 4.3]], [[-0.78, 3.24], [-0.78, 4.24]], [[0.78, 3.24], [0.78, 4.24]]]) {
          const p = F(a[0], a[1]), q = F(b[0], b[1]);
          seams += `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`;
        }
        s += `<path d="${seams}" stroke="#6E6CAA" stroke-width="1.3" stroke-opacity="0.45"/>`;
        // a few rivets
        const rv = rng(5);
        let dots = '';
        for (let i = 0; i < 20; i++) { const x = (rv() < 0.5 ? -1 : 1) * (0.55 + rv() * 0.55), y = 3.35 + rv() * 0.85; const p = F(x, y); dots += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="1.2"/>`; }
        s += `<g fill="#6E6CAA" fill-opacity="0.4">${dots}</g>`;
      }
      // rendezvous radar (front, upper right)
      {
        s += strut([0.62, 5.42, 0.8], [0.88, 5.86, 0.86], 0.05, SILVER, { v: 0.55 });
        const dn = [0.35, 0.45, 0.82], c = [0.98, 6.0, 0.95];
        const d = disc3(c, dn, 0.3, 28);
        const g = k.id('rr');
        const xs = d.map((p) => p[0]), ys = d.map((p) => p[1]);
        lmDefs += lgU(g, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), [[0, '#FFFFFF'], [0.55, '#D2CFEA'], [1, '#7E7BB8']]);
        s += `<path d="${poly(d)}" fill="url(#${g})"/>`;
        s += `<path d="${poly(disc3(add3(c, mul(norm3(dn), 0.03)), dn, 0.21, 24))}" fill="#A9A5D6" fill-opacity="0.5"/>`;
        const tip = add3(c, mul(norm3(dn), 0.26));
        s += rod(c, tip, 2.2, '#4F4E92');
        const tp = pr(tip);
        s += `<circle cx="${n(tp[0])}" cy="${n(tp[1])}" r="2.6" fill="#F2EFFF"/>`;
      }
      // RCS thruster quads on short booms at the corners
      const quad = (c, sgn, front) => {
        let q = '';
        q += strut([sgn * 1.5, c[1] - 0.05, c[2]], c, 0.045, SILVER, { v: 0.5, hi: false });
        const cone = (a, b, r0, r1, v) => {
          const pa = pr(a), pb = pr(b), sa = scaleAt(a), sb = scaleAt(b);
          let dx = pb[0] - pa[0], dy = pb[1] - pa[1];
          const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
          const nx = -dy, ny = dx;
          let o = `<path d="${poly([[pa[0] + nx * r0 * sa, pa[1] + ny * r0 * sa], [pb[0] + nx * r1 * sb, pb[1] + ny * r1 * sb], [pb[0] - nx * r1 * sb, pb[1] - ny * r1 * sb], [pa[0] - nx * r0 * sa, pa[1] - ny * r0 * sa]])}" fill="${ramp(SILVER, v)}"/>`;
          o += `<ellipse cx="${n(pb[0])}" cy="${n(pb[1])}" rx="${n(r1 * sb * (Math.abs(ny) > 0.7 ? 1 : 0.35))}" ry="${n(r1 * sb * (Math.abs(ny) > 0.7 ? 0.35 : 1))}" fill="#2A2B66"/>`;
          return o;
        };
        q += cone(add3(c, [0, 0.08, 0]), add3(c, [0, 0.36, 0]), 0.04, 0.085, 0.75);
        q += cone(add3(c, [0, -0.08, 0]), add3(c, [0, -0.36, 0]), 0.04, 0.085, 0.55);
        q += cone(add3(c, [sgn * 0.08, 0, 0]), add3(c, [sgn * 0.36, 0, 0]), 0.04, 0.085, sgn < 0 ? 0.8 : 0.45);
        const p = pr(c), sc = scaleAt(c);
        q += `<rect x="${n(p[0] - sc * 0.11)}" y="${n(p[1] - sc * 0.11)}" width="${n(sc * 0.22)}" height="${n(sc * 0.22)}" rx="2" fill="${ramp(SILVER, sgn < 0 ? 0.85 : 0.55)}"/>`;
        if (front) {
          const f = pr(add3(c, [0, 0, 0.3]));
          q += `<circle cx="${n(f[0])}" cy="${n(f[1])}" r="${n(sc * 0.09)}" fill="${ramp(SILVER, 0.7)}"/><circle cx="${n(f[0])}" cy="${n(f[1])}" r="${n(sc * 0.06)}" fill="#2A2B66"/>`;
        }
        return q;
      };
      s = quad([-2.0, 4.62, -1.85], -1, false) + s; // rear-left, partly behind the body
      s += quad([-2.0, 4.62, 0.15], -1, true) + quad([2.0, 4.62, 0.15], 1, true);
      // base of the ascent stage: gold blanket band on the deck
      s += foil([[-1.55, 3.2, 1.3], [1.55, 3.2, 1.3], [1.55, 3.05, 1.3], [-1.55, 3.05, 1.3]], GOLD, [0, 0, 1], 41, 8, 1, { spread: 0.3 });
      lmAscent = s;
    }

    // ---- descent stage ----
    {
      let s = '';
      const faces = [];
      for (let i = 0; i < 8; i++) {
        const a = oct[i], b = oct[(i + 1) % 8];
        const na = (45 + 45 * i) * D2R, nrm = [Math.cos(na), 0, Math.sin(na)];
        const ctr = [(a[0] + b[0]) / 2, (DS0 + DS1) / 2, (a[1] + b[1]) / 2];
        if (!visible(ctr, nrm)) continue;
        // order corners: top-left, top-right, bottom-right, bottom-left in screen
        let A = [a[0], DS1, a[1]], B = [b[0], DS1, b[1]];
        if (pr(A)[0] > pr(B)[0]) [A, B] = [B, A];
        faces.push({ i, nrm, quad: [A, B, [B[0], DS0, B[2]], [A[0], DS0, A[2]]] });
      }
      for (const f of faces) {
        const bright = lum(f.nrm);
        s += foil(f.quad, GOLD, f.nrm, 100 + f.i, 6, 4, { spread: 0.36, hiOp: 0.25 + bright * 0.3 });
        // black skirt along the bottom and a dark seam at the top
        const [A, B, Cq, Dq] = f.quad;
        const lo = (p, y) => [p[0], y, p[2]];
        s += face([lo(A, DS0 + 0.24), lo(B, DS0 + 0.24), Cq, Dq], BLACK, f.nrm, { dv: 0.1 });
        s += face([A, B, lo(B, DS1 - 0.08), lo(A, DS1 - 0.08)], SILVER, f.nrm, { dv: 0.1 });
        const ea = pr(A), eb = pr(B);
        s += `<path d="M${n(ea[0])} ${n(ea[1])}L${n(eb[0])} ${n(eb[1])}" stroke="#FFF8E8" stroke-width="2" stroke-opacity="0.75"/>`;
        // vertical edge highlight on lit corners
        const e1 = pr(Dq), e0 = pr(A);
        if (bright > 0.5) s += `<path d="M${n(e0[0] + 1)} ${n(e0[1])}L${n(e1[0] + 1)} ${n(e1[1])}" stroke="#FFF6D6" stroke-width="2.2" stroke-opacity="0.8"/>`;
        // MESA on the front-left quadrant face: a stowed silver equipment bay
        if (f.i === 2) {
          const P = (s0, t0) => { const top = add3(mul(A, 1 - s0), mul(B, s0)), bot = add3(mul(Dq, 1 - s0), mul(Cq, s0)); return add3(mul(top, 1 - t0), mul(bot, t0)); };
          const m = [P(0.5, 0.12), P(0.9, 0.12), P(0.9, 0.72), P(0.5, 0.72)];
          s += face(m, SILVER, f.nrm, { dv: 0.05 });
          let ribs = '';
          for (let t = 0.22; t < 0.7; t += 0.1) { const p = pr(P(0.52, t)), q = pr(P(0.88, t)); ribs += `M${n(p[0])} ${n(p[1])}L${n(q[0])} ${n(q[1])}`; }
          s += `<path d="${ribs}" stroke="#7472B0" stroke-width="1.4" stroke-opacity="0.5"/>`;
        }
      }
      // the shaded right face gets a violet wash
      lmStage += s;
    }

    // ---- side legs, front leg with ladder, porch ----
    {
      let s = '';
      for (const L of [legs[1], legs[2]]) s += legStruts(L, 'front');
      for (const L of [legs[1], legs[2]]) s += footpad(L, false);
      // front leg
      const Lf = legs[0];
      s += legStruts(Lf, 'front');
      // ladder on the front strut
      {
        const rail = (sgn) => [[sgn * 0.27, 2.86, 2.36], [sgn * 0.27, 0.92, 3.86]];
        let lad = '';
        for (const sgn of [-1, 1]) { const [a, b] = rail(sgn); lad += strut(a, b, 0.035, SILVER, { v: sgn < 0 ? 0.8 : 0.55, hi: false }); }
        let rungs = '';
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          const a = pr([-0.27, 2.86 + (0.92 - 2.86) * t, 2.36 + (3.86 - 2.36) * t]), b = pr([0.27, 2.86 + (0.92 - 2.86) * t, 2.36 + (3.86 - 2.36) * t]);
          rungs += `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;
        }
        lad += `<path d="${rungs}" stroke="#3E3C82" stroke-width="5" stroke-opacity="0.35" transform="translate(1.5 2.5)"/>`;
        lad += `<path d="${rungs}" stroke="#E6E3F7" stroke-width="3.6"/>`;
        s += lad;
      }
      // porch
      {
        s += face([[-0.52, 3.05, 2.1], [0.52, 3.05, 2.1], [0.52, 2.98, 2.72], [-0.52, 2.98, 2.72]], SILVER, [0, -1, 0], { v: 0.4 });
        s += face([[-0.52, 3.05, 2.72], [0.52, 3.05, 2.72], [0.52, 2.96, 2.72], [-0.52, 2.96, 2.72]], SILVER, [0, 0, 1], { v: 0.85 });
        const rail = (sgn) => strut([sgn * 0.52, 3.05, 2.62], [sgn * 0.52, 3.85, 2.42], 0.022, SILVER, { v: 0.8, hi: false }) + strut([sgn * 0.52, 3.85, 2.42], [sgn * 0.52, 3.85, 1.35], 0.022, SILVER, { v: 0.8, hi: false });
        s += rail(-1) + rail(1);
      }
      s += footpad(Lf, true);
      lmFront = s;
    }

    parts.push({ svg: lmShadow });

    // ---- footprints: a trail from the ladder out toward the flag and the camera ----
    {
      const rf = rng(717);
      let fp = '';
      const fprint = (x, y, s, ang) => `<g transform="translate(${n(x)} ${n(y)}) scale(1 0.42) rotate(${n(ang)})"><ellipse rx="${n(s * 0.42)}" ry="${n(s)}" fill="#A69CD0" fill-opacity="0.75"/><ellipse cx="${n(s * 0.08)}" cy="${n(-s * 0.05)}" rx="${n(s * 0.32)}" ry="${n(s * 0.86)}" fill="#C2B9DF"/></g>`;
      const pathPts = [[650, 1322], [600, 1338], [540, 1342], [470, 1340], [400, 1336], [330, 1338], [262, 1350], [200, 1356]];
      pathPts.forEach((p, i) => { fp += fprint(p[0] + (i % 2 ? 5 : -5), p[1] + (i % 2 ? 6 : -6), 15 + i * 0.6, 75 + (rf() - 0.5) * 20); });
      const pathPts2 = [[700, 1318], [760, 1330], [820, 1338], [880, 1352]];
      pathPts2.forEach((p, i) => { fp += fprint(p[0] + (i % 2 ? 4 : -4), p[1] + (i % 2 ? 5 : -5), 15 + i, 100 + (rf() - 0.5) * 20); });
      parts.push({ svg: fp });
    }

    parts.push({ defs: lmDefs, svg: lmBack + lmAscent + lmStage + lmFront });

    // ==== THE FLAG ============================================================================
    {
      // 3-D placement: nearer than the LM, out to its left.
      const base = [-5.9, 0, 3.1];
      const sc = scaleAt(base), b = pr(base);
      const poleH = 3.25 * sc, fw = 1.62 * sc, fh = 1.0 * sc;
      const px = b[0], py = b[1];
      const topY = py - poleH;
      let s = '';
      // shadow of pole and flag on the ground
      const tipS = pr(shadowOf([base[0], 3.25, base[2]]));
      const flagS0 = pr(shadowOf([base[0], 3.2, base[2]])), flagS1 = pr(shadowOf([base[0] + 1.6, 3.2, base[2] - 0.2])), flagS2 = pr(shadowOf([base[0] + 1.6, 2.2, base[2] - 0.2])), flagS3 = pr(shadowOf([base[0], 2.2, base[2]]));
      s += `<g fill="#40388C" stroke="#40388C" opacity="0.32"><path d="M${n(px)} ${n(py)}L${n(tipS[0])} ${n(tipS[1])}" stroke-width="5" fill="none"/><path d="${poly([flagS0, flagS1, flagS2, flagS3])}"/></g>`;
      // dust kicked up at the base
      s += `<ellipse cx="${n(px + 4)}" cy="${n(py + 2)}" rx="22" ry="5" fill="#B4AAD8"/>`;
      // the cloth, hung from the crossbar with the famous ripples
      const fx = px + 4, fy = topY + 10;
      const warp = (u, v) => {
        const wave = Math.sin(u * Math.PI * 2 * 2.1 + 0.6) * (0.4 + 0.6 * v) * 7 + Math.sin(u * Math.PI * 2 * 4.3) * v * 2.5;
        return [fx + u * fw - (1 - Math.cos(u * Math.PI * 2 * 2.1 + 0.6)) * 1.5 * v, fy + v * fh + wave * 0.9 + u * 6];
      };
      const band = (u0, u1, v0, v1) => {
        const pts = [];
        for (let i = 0; i <= 16; i++) pts.push(warp(u0 + ((u1 - u0) * i) / 16, v0));
        for (let i = 16; i >= 0; i--) pts.push(warp(u0 + ((u1 - u0) * i) / 16, v1));
        return poly(pts);
      };
      let cloth = '';
      for (let i = 0; i < 13; i++) cloth += `<path d="${band(0, 1, i / 13, (i + 1) / 13)}" fill="${i % 2 ? '#FFF7F0' : '#E5484A'}"/>`;
      cloth += `<path d="${band(0, 0.4, 0, 7 / 13)}" fill="#2F3D9E"/>`;
      // 50 stars: 9 rows alternating 6 and 5
      let stars = '';
      for (let r = 0; r < 9; r++) {
        const cnt = r % 2 ? 5 : 6;
        for (let c = 0; c < cnt; c++) {
          const u = (0.4 * (c + (r % 2 ? 1 : 0.5))) / 6, v = ((7 / 13) * (r + 0.85)) / 10;
          const p = warp(u, v);
          stars += k.star(p[0], p[1], fh * 0.022, '#FFFFFF');
        }
      }
      cloth += stars;
      // ripple shading: dark troughs and light crests
      const clothOutline = band(0, 1, 0, 1);
      const shadeG = k.id('fshade');
      const xs0 = fx, xs1 = fx + fw;
      const st = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const c = Math.cos(u * Math.PI * 2 * 2.1 + 0.6);
        st.push([u, c > 0 ? '#FFFFFF' : '#2B2470', Math.abs(c) * (c > 0 ? 0.3 : 0.32)]);
      }
      lmDefs += ''; // (flag defs pushed below)
      const clipF = k.id('fclip');
      s += `<path d="M${n(px)} ${n(py)}V${n(topY - 6)}" stroke="#8B86BE" stroke-width="6.5" stroke-linecap="round"/><path d="M${n(px - 1.5)} ${n(py)}V${n(topY - 6)}" stroke="#F6F3FF" stroke-width="2.4" stroke-linecap="round"/>`;
      s += `<g clip-path="url(#${clipF})">${cloth}<rect x="${n(xs0 - 10)}" y="${n(fy - 20)}" width="${n(fw + 30)}" height="${n(fh + 60)}" fill="url(#${shadeG})"/></g>`;
      // crossbar
      s += `<path d="M${n(px)} ${n(fy - 2)}L${n(fx + fw + 2)} ${n(fy + 4)}" stroke="#8B86BE" stroke-width="4.5" stroke-linecap="round"/><path d="M${n(px)} ${n(fy - 3.5)}L${n(fx + fw + 2)} ${n(fy + 2.5)}" stroke="#F6F3FF" stroke-width="1.6" stroke-linecap="round"/>`;
      s += `<circle cx="${n(px)}" cy="${n(topY - 8)}" r="5" fill="#F3F0FF"/>`;
      parts.push({
        defs: lgU(shadeG, xs0, 0, xs1, 0, st) + `<clipPath id="${clipF}"><path d="${clothOutline}"/></clipPath>`,
        svg: s,
      });
    }

    // ==== FOREGROUND: rocks, crater rims, the bootprint ========================================
    // A faceted lunar rock with a lit top-left, shaded right, cast shadow.
    function rock(x, y, s, seed, o) {
      o = Object.assign({ lit: '#F1E6EC', mid: '#C2B9DE', shade: '#8C83C4', deep: '#6D64AE', sh: 0.32 }, o || {});
      const r = rng(seed);
      const N = 9;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = Math.PI + (i / (N - 1)) * Math.PI; // upper half, left → right
        const rr = s * (0.75 + r() * 0.4);
        pts.push([x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * (0.75 + r() * 0.2)]);
      }
      const bottom = [[x + s * 1.3, y + s * 0.08], [x + s * 0.4, y + s * 0.2], [x - s * 0.6, y + s * 0.16], [x - s * 1.3, y + s * 0.04]];
      const outline = pts.concat(bottom);
      let out = '';
      // cast shadow to the right
      out += `<path d="${smooth([[x - s * 0.6, y + s * 0.15], [x + s * 0.6, y - s * 0.15], [x + s * 2.6, y - s * 0.05], [x + s * 2.8, y + s * 0.12], [x + s * 1.2, y + s * 0.26]], true)}" fill="#3F378A" fill-opacity="${o.sh}"/>`;
      out += `<path d="${poly(outline)}" fill="${o.mid}" stroke="${o.mid}" stroke-width="1" stroke-linejoin="round"/>`;
      // facets: a ridge from the top vertex down
      const topI = pts.reduce((bi, p, i) => (p[1] < pts[bi][1] ? i : bi), 0);
      const ridgeBot = [x + s * (0.15 + r() * 0.3), y + s * 0.2];
      const rightFacet = pts.slice(topI).concat([[x + s * 1.3, y + s * 0.08], ridgeBot]);
      out += `<path d="${poly(rightFacet)}" fill="${o.shade}"/>`;
      out += `<path d="${poly(rightFacet)}" fill="url(#${stip})" fill-opacity="0.22"/>`;
      // the lit top-left plane
      const litFacet = pts.slice(0, topI + 1).concat([[x + s * 0.05, y - s * 0.25], [x - s * 0.7, y - s * 0.05]]);
      out += `<path d="${poly(litFacet)}" fill="${o.lit}"/>`;
      // crisp highlight along the lit edge and a dark contact line at the base
      out += `<path d="${pline(pts.slice(0, topI + 1))}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="${n(Math.max(1.2, s * 0.04))}" fill="none" stroke-linejoin="round"/>`;
      out += `<path d="M${n(x - s * 1.25)} ${n(y + s * 0.06)}Q${n(x)} ${n(y + s * 0.28)} ${n(x + s * 1.3)} ${n(y + s * 0.08)}" stroke="${o.deep}" stroke-width="${n(Math.max(1.5, s * 0.06))}" fill="none" stroke-opacity="0.6"/>`;
      // a couple of fine cracks / pits
      out += `<path d="M${n(x - s * 0.3)} ${n(y - s * 0.5)}l${n(s * 0.18)} ${n(s * 0.22)}l${n(-s * 0.06)} ${n(s * 0.2)}" stroke="${o.deep}" stroke-opacity="0.35" stroke-width="${n(Math.max(1, s * 0.03))}" fill="none"/>`;
      for (let i = 0; i < 4; i++) out += `<circle cx="${n(x + (r() - 0.6) * s * 1.4)}" cy="${n(y - r() * s * 0.5)}" r="${n(s * (0.03 + r() * 0.03))}" fill="${o.deep}" fill-opacity="0.35"/>`;
      return out;
    }
    {
      let s = '';
      // bottom-left: a crater rim breaking the corner, rocks along the edge (kept light for the caption)
      s += crater(120, 1585, 330, 70, { op: 0.6, rim: '#F3EAF0', floor: '#D3CAE5', shadow: '#A198CF' });
      s += rock(40, 1268, 46, 11, { sh: 0.25 }) + rock(232, 1372, 20, 12, { sh: 0.2 }) + rock(-6, 1392, 34, 13, { sh: 0.2 }) + rock(60, 1342, 14, 14, { sh: 0.2 });
      // bottom-right of the right page: a big boulder field around (but not over) the seal
      s += crater(1395, 1520, 300, 78, { op: 1 });
      s += rock(2010, 1240, 70, 21) + rock(1880, 1262, 30, 22) + rock(1720, 1300, 22, 23) + rock(2050, 1530, 60, 24, { sh: 0.22 }) + rock(1680, 1555, 36, 25, { sh: 0.22 }) + rock(1185, 1312, 26, 26) + rock(1290, 1238, 16, 27);
      parts.push({ svg: s });
    }

    // the bootprint
    {
      const bx = 832, by = 1452;
      // sole outline in a local frame (toe up, heel down), metres-ish ×100
      const sole = [[0, -150], [34, -142], [56, -118], [62, -84], [56, -44], [46, -6], [40, 30], [42, 70], [46, 104], [38, 132], [14, 150], [-14, 152], [-36, 136], [-44, 104], [-42, 66], [-40, 30], [-46, -8], [-58, -50], [-62, -92], [-54, -126], [-30, -146]];
      const T = `translate(${bx} ${by}) scale(1 0.6) rotate(-24)`;
      const out = sole.map((p) => [p[0] * 1.12, p[1] * 1.08]);
      const g = k.id('print');
      let s = '';
      // raised dust lip around the print
      s += `<path d="${smooth(out.map((p) => [p[0] * 1.14, p[1] * 1.06]), true)}" fill="#F6EEF2" fill-opacity="0.9"/>`;
      s += `<path d="${smooth(out.map((p) => [p[0] * 1.14 + 8, p[1] * 1.06 + 4]), true)}" fill="#9F96CD" fill-opacity="0.35"/>`;
      s += `<path d="${smooth(out, true)}" fill="url(#${g})"/>`;
      // tread: ribs across the sole, each a ridge (lit edge + shadowed edge)
      const clip = k.id('pclip');
      let ribs = '', ribsD = '';
      for (let yv = -132; yv <= 140; yv += 15) {
        if (yv > 0 && yv < 30) continue; // the instep
        const bow = yv < 0 ? -6 : 4;
        ribs += `M-80 ${yv}Q0 ${yv + bow} 80 ${yv}`;
        ribsD += `M-80 ${yv + 5}Q0 ${yv + 5 + bow} 80 ${yv + 5}`;
      }
      s += `<g clip-path="url(#${clip})"><path d="${ribsD}" stroke="#5D53A6" stroke-opacity="0.55" stroke-width="5" fill="none"/><path d="${ribs}" stroke="#F4ECF4" stroke-opacity="0.85" stroke-width="3.6" fill="none"/>` +
        `<path d="${crescent(-8, 0, 72, 168, 34)}" fill="#3E3590" fill-opacity="0.3"/></g>`;
      // shadowed left inner wall, bright right inner wall
      s += `<path d="${smooth(out, true)}" fill="none" stroke="#4D4499" stroke-opacity="0.5" stroke-width="5" transform="translate(4 2)"/>`;
      s += `<path d="${smooth(out.slice(0, 8))}" fill="none" stroke="#FFF8F6" stroke-opacity="0.9" stroke-width="3"/>`;
      parts.push({
        defs: lgU(g, -70, 0, 70, 0, [[0, '#8E84C4'], [0.45, '#B8AFDA'], [1, '#D9D0E8']]) + `<clipPath id="${clip}"><path d="${smooth(out, true)}"/></clipPath>`,
        svg: `<g transform="${T}">${s}</g>`,
      });
    }

    return k.spread(parts, { grain: 0.6 });
  },
};
