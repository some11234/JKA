/* Visa pages 11–12 — the Western frontier.
   A cattle drive heading west into the sunset through Monument Valley.
   Left: three Texas Longhorns on the trail — a big speckled lead steer with
   his head swung toward us and the famous horns spread wide across the low
   sun, two more behind him, dust rising off the drive. Right: the cowboy on
   a bay quarter horse at a lope — hat, bandana, batwing chaps, a lasso loop
   swinging over his head. Red sandstone buttes (the Mittens, Merrick Butte)
   stand in hazy layers behind; saguaros; prickly pear in bloom and desert
   marigolds frame the bottom corners. Quote (live text, see
   js/passport-data.js): Theodore Roosevelt. */

'use strict';

module.exports = {
  pages: [11, 12],
  svg(k) {
    const { n, rng, mix } = k;
    const parts = [];
    const HZ = 1000; // horizon: foot of the far mesas

    // ---- helpers ------------------------------------------------------------------
    const st = (s) => s.map((x) => `<stop offset="${x[0]}" stop-color="${x[1]}"${x[2] != null ? ` stop-opacity="${x[2]}"` : ''}/>`).join('');
    // userSpaceOnUse gradients (coordinates in the referencing element's space,
    // so they work inside the local frames the animals are drawn in).
    function lgU(gid, x1, y1, x2, y2, s) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${st(s)}</linearGradient>`;
    }
    function rgU(gid, cx, cy, r, s, fx, fy) {
      return `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${fx != null ? ` fx="${n(fx)}" fy="${n(fy)}"` : ''}>${st(s)}</radialGradient>`;
    }
    function P(pts, open) { return 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + (open ? '' : 'Z'); }
    // Smooth path through points (Catmull-Rom → cubic Bézier). A point with a
    // third element of 1 is a sharp corner.
    function smooth(pts, closed = true, t = 1) {
      const m = pts.length;
      const g = (i) => (closed ? pts[(i + m) % m] : pts[Math.max(0, Math.min(m - 1, i))]);
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      const last = closed ? m : m - 1;
      for (let i = 0; i < last; i++) {
        const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
        const c1 = p1[2] === 1 ? p1 : [p1[0] + ((p2[0] - p0[0]) * t) / 6, p1[1] + ((p2[1] - p0[1]) * t) / 6];
        const c2 = p2[2] === 1 ? p2 : [p2[0] - ((p3[0] - p1[0]) * t) / 6, p2[1] - ((p3[1] - p1[1]) * t) / 6];
        d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
      }
      return d + (closed ? 'Z' : '');
    }
    // An organic limb: joints [[x,y],…] with half-widths [w,…] (or [wl, wr]
    // pairs for a different bulge on each side) → closed outline.
    function limbPts(j, w) {
      const L = [], R = [];
      for (let i = 0; i < j.length; i++) {
        const a = j[Math.max(0, i - 1)], b = j[Math.min(j.length - 1, i + 1)];
        let tx = b[0] - a[0], ty = b[1] - a[1];
        const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
        const wl = Array.isArray(w[i]) ? w[i][0] : w[i], wr = Array.isArray(w[i]) ? w[i][1] : w[i];
        L.push([j[i][0] - ty * wl, j[i][1] + tx * wl]);
        R.push([j[i][0] + ty * wr, j[i][1] - tx * wr]);
      }
      return L.concat(R.reverse());
    }
    function limb(j, w) { return smooth(limbPts(j, w), true); }
    const lerp = (a, b, t) => a + (b - a) * t;
    const lp = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

    // ---- sky ------------------------------------------------------------------------
    parts.push(k.sky([[0, '#D2C9EC'], [0.18, '#DDC9EA'], [0.36, '#EDC8DD'], [0.5, '#F6CACB'], [0.58, '#F9D2C2'], [0.635, '#FBDCC0'], [1, '#FBDCC0']]));
    parts.push(k.microtext('Westward', { y0: 30, y1: 980, opacity: 0.05 }));
    parts.push(k.guilloche({ y0: 120, y1: 900, lines: 22, opacity: 0.06, amp: 18, period: 640, phase: 2.1 }));

    // The low sun on the left page, behind the lead steer's horns.
    const SX = 520, SY = 872, SR = 150;
    {
      const glow = k.id('sglow'), disc = k.id('sdisc');
      parts.push({
        defs: k.radial(glow, '50%', '50%', '50%', [[0, '#FFF4E0', 0.95], [0.3, '#FDE2C6', 0.6], [1, '#F8CFC4', 0]]) +
          lgU(disc, 0, SY - SR, 0, SY + SR, [[0, '#FFF9EC'], [0.55, '#FFE8C2'], [1, '#FCC197']]),
        svg: `<circle cx="${SX}" cy="${SY}" r="${SR * 3.4}" fill="url(#${glow})"/>` +
          k.sunburst(SX, SY, SR + 30, 2000, 60, '#FFFFFF', 0.11) +
          `<circle cx="${SX}" cy="${SY}" r="${SR}" fill="url(#${disc})"/>`,
      });
    }
    // A guilloche rosette behind the rider, echoing his loop.
    parts.push(k.rosette(1520, 640, 330, { opacity: 0.075, rings: 9, lobes: 28 }));

    // Long sunset cloud streaks, lit apricot underneath.
    {
      const rc = rng(611);
      let s = '';
      const bands = [
        [40, 470, 360, 20, '#F7D6DC'], [560, 420, 300, 16, '#F2CCDA'], [700, 560, 260, 14, '#F6D0D2'],
        [-20, 600, 240, 14, '#F8D7D3'], [1180, 400, 340, 18, '#EFCBDD'], [1780, 470, 320, 20, '#F1CCDA'],
        [1640, 560, 260, 14, '#F6D2D3'], [1900, 340, 240, 14, '#ECC9DE'], [820, 330, 240, 12, '#EDCBDF'],
        [1240, 760, 300, 16, '#F8D8D0'], [1900, 700, 220, 14, '#F8D9CE'],
      ];
      for (const [x, y, w, h, col] of bands) {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${col}" fill-opacity="${n(0.6 + rc() * 0.3)}"/>`;
        s += `<rect x="${n(x + w * 0.12)}" y="${n(y + h * 0.55)}" width="${n(w * 0.7)}" height="${n(h * 0.45)}" rx="${n(h * 0.22)}" fill="#FBD9BF" fill-opacity="0.7"/>`;
      }
      parts.push({ svg: s });
    }

    // ---- far mesas along the horizon ---------------------------------------------------
    {
      const g1 = k.id('farm'), g2 = k.id('farm2');
      // flat-topped mesas: [x0, x1, topY, wallSlope]
      const mesa = (x0, x1, y, sl) => `M${x0 - sl * 2} ${HZ + 4}L${x0} ${y + 6}L${x0 + 8} ${y}H${x1 - 8}L${x1} ${y + 6}L${x1 + sl * 2} ${HZ + 4}Z`;
      let a = '';
      for (const m of [[-40, 260, 930, 14], [380, 560, 948, 10], [700, 1010, 936, 16], [1060, 1260, 950, 10], [1380, 1700, 926, 18], [1780, 2120, 944, 14]]) a += mesa(...m);
      let b = '';
      // a few distant spires and buttes (the Totem Pole country)
      for (const [x, w, y] of [[620, 22, 905], [648, 14, 918], [1300, 30, 900], [1338, 16, 912], [1860, 60, 880], [140, 70, 890]]) {
        b += `M${x - w * 0.9} ${HZ}L${x - w * 0.5} ${y + 30}L${x - w * 0.5} ${y}H${x + w * 0.5}L${x + w * 0.5} ${y + 30}L${x + w * 0.9} ${HZ}Z`;
      }
      parts.push({
        defs: k.linear(g1, 90, [[0, '#D8B5D0'], [1, '#E9C9D3']]) + k.linear(g2, 90, [[0, '#CFA9CB'], [1, '#E4C2D0']]),
        svg: `<path d="${b}" fill="url(#${g2})"/><path d="${a}" fill="url(#${g1})"/>`,
      });
      parts.push(k.haze(HZ - 60, 110, '#FBE0CC', 0.6));
    }

    // ---- the buttes ----------------------------------------------------------------------
    // A Monument Valley butte: sheer De Chelly sandstone walls under a pale
    // caprock, standing on a long apron of Organ Rock shale (the talus) that
    // sweeps down to the valley floor. Lit by the low sun on the left: an
    // apricot side wall, a coral face fluted by vertical joints, and a crisp
    // violet shadow plane on the right. depth 0 (near) … 1 (far) fades it into
    // the haze.
    function butte(o) {
      const r = rng(o.seed);
      const hz = '#F8DACF';
      const d = o.depth || 0;
      const col = (c) => mix(c, hz, d);
      const LIT = col('#F8BC8E'), FACE = col('#E68768'), MIDC = col('#D2736A'), SHADE = col('#A06E9C'), DEEP = col('#835E97');
      const TAL = col('#DC8670'), TALL = col('#F2B08C'), TALS = col('#A8729C');
      const { foot, base } = o;
      let defs = '', s = '';
      // -- talus apron with spurs
      const cx = o.x + o.w / 2, tl = o.x - o.talus, tr = o.x + o.w + o.talus;
      const xL = Math.min(o.x, o.thumb ? o.thumb.x : o.x), xR = Math.max(o.x + o.w, o.thumb ? o.thumb.x + o.thumb.w : 0);
      const gT = k.id('tal');
      defs += lgU(gT, tl, 0, tr, 0, [[0, TALL], [0.3, TAL], [0.7, mix(TAL, TALS, 0.55)], [1, TALS]]);
      const apron = `M${n(tl - 30)} ${base}C${n(tl + o.talus * 0.35)} ${n(base - 8)} ${n(xL - o.talus * 0.25)} ${n(foot + (base - foot) * 0.35)} ${n(xL + 2)} ${foot - 4}H${n(xR - 2)}C${n(xR + o.talus * 0.25)} ${n(foot + (base - foot) * 0.35)} ${n(tr - o.talus * 0.35)} ${n(base - 8)} ${n(tr + 30)} ${base}Z`;
      s += `<path d="${apron}" fill="url(#${gT})"/>`;
      let spurL = '', spurD = '';
      const nsp = Math.round((xR - xL) / 34);
      for (let i = 0; i <= nsp; i++) {
        const sx = xL + ((xR - xL) * (i + (r() - 0.5) * 0.5)) / nsp;
        const out = (sx - cx) / ((xR - xL) / 2);
        const ex = sx + out * o.talus * (0.7 + r() * 0.3), ey = base - 6 - r() * (base - foot) * 0.25;
        const wb = 10 + r() * 16;
        spurL += `M${n(sx)} ${foot}L${n(ex - wb)} ${n(ey)}L${n(ex)} ${n(ey + 3)}Z`;
        spurD += `M${n(sx + 2)} ${foot}L${n(ex + 2)} ${n(ey + 3)}L${n(ex + wb * 1.2)} ${n(ey - 2)}Z`;
      }
      s += `<path d="${spurD}" fill="${TALS}" fill-opacity="0.38"/><path d="${spurL}" fill="${TALL}" fill-opacity="0.45"/>`;
      // a ledge of harder rock where the apron meets the cliff
      s += `<path d="M${n(xL - 14)} ${foot + 6}Q${n(cx)} ${foot + 16} ${n(xR + 14)} ${foot + 6}" stroke="${col('#F6C7A2')}" stroke-width="4" stroke-opacity="0.5" fill="none"/>`;

      // -- cliffs (the main block, and the Mitten's thumb if any)
      const blocks = [{ x: o.x, w: o.w, top: o.top, notch: o.notch }];
      if (o.thumb) blocks.push({ x: o.thumb.x, w: o.thumb.w, top: o.thumb.top, thumb: true });
      for (const b of blocks) {
        const h = foot - b.top;
        // top edge
        const topPts = [];
        const steps = Math.max(2, Math.round(b.w / 34));
        for (let i = 0; i <= steps; i++) {
          const tx = b.x + (b.w * i) / steps;
          let ty = b.top + (r() - 0.5) * 5;
          if (b.thumb) ty = b.top + Math.pow(Math.abs(i / steps - 0.45) * 2, 2) * b.w * 0.35;
          if (b.notch && Math.abs(i / steps - 0.66) < 0.12) ty += 16;
          topPts.push([tx, ty]);
        }
        const topAt = (xx) => {
          for (let i = 0; i < topPts.length - 1; i++) {
            if (xx <= topPts[i + 1][0]) return lerp(topPts[i][1], topPts[i + 1][1], Math.max(0, (xx - topPts[i][0]) / (topPts[i + 1][0] - topPts[i][0])));
          }
          return topPts[topPts.length - 1][1];
        };
        // walls: stepped, near vertical, flaring slightly at the foot
        const lw = [[b.x, topAt(b.x) + 6], [b.x - 2, b.top + h * 0.28], [b.x + b.w * 0.03, b.top + h * 0.3], [b.x + b.w * 0.02, b.top + h * 0.62], [b.x - b.w * 0.03, b.top + h * 0.66], [b.x - b.w * 0.05, foot]];
        const rw = [[b.x + b.w, topAt(b.x + b.w) + 6], [b.x + b.w + 2, b.top + h * 0.4], [b.x + b.w - b.w * 0.03, b.top + h * 0.43], [b.x + b.w + b.w * 0.01, b.top + h * 0.75], [b.x + b.w + b.w * 0.05, foot]];
        const outline = P(topPts.concat(rw.slice(1)).concat([[b.x + b.w * 0.5, foot + 2]]).concat(lw.slice(1).reverse()));
        const clip = k.id('cl');
        defs += `<clipPath id="${clip}"><path d="${outline}"/></clipPath>`;
        const gF = k.id('face');
        defs += lgU(gF, 0, b.top, 0, foot, [[0, mix(FACE, LIT, 0.25)], [0.5, FACE], [1, mix(FACE, MIDC, 0.6)]]);
        let c = `<path d="${outline}" fill="url(#${gF})"/>`;
        // lit side wall: a crisp plane on the left with a jagged inner edge
        const litW = b.w * (b.thumb ? 0.3 : 0.16);
        let jag = [];
        for (let y = b.top - 10, i = 0; y <= foot + 10; y += h / 7, i++) jag.push([b.x + litW * (0.75 + (i % 2) * 0.3 + (r() - 0.5) * 0.3), y]);
        c += `<path d="${P([[b.x - 30, b.top - 20]].concat(jag).concat([[b.x - 30, foot + 20]]))}" fill="${LIT}"/>`;
        // shadow plane on the right
        const shW = b.w * (b.thumb ? 0.38 : 0.34);
        jag = [];
        for (let y = b.top - 10, i = 0; y <= foot + 10; y += h / 6, i++) jag.push([b.x + b.w - shW * (0.8 + (i % 2) * 0.25 + (r() - 0.5) * 0.3), y]);
        const gS = k.id('shd');
        defs += lgU(gS, 0, b.top, 0, foot, [[0, SHADE], [1, DEEP]]);
        c += `<path d="${P([[b.x + b.w + 30, b.top - 20]].concat(jag).concat([[b.x + b.w + 30, foot + 20]]))}" fill="url(#${gS})"/>`;
        // fluting: vertical joints, tapering at both ends
        let fl = '', fd = '';
        const nfl = Math.round(b.w / 11);
        for (let i = 0; i < nfl; i++) {
          const fx = b.x + 4 + r() * (b.w - 8), fw = 2 + r() * 5;
          const y0 = b.top + 14 + r() * h * 0.3, y1 = Math.min(foot, y0 + h * (0.3 + r() * 0.6));
          const path = `M${n(fx)} ${n(y0)}Q${n(fx + fw)} ${n((y0 + y1) / 2)} ${n(fx)} ${n(y1)}Q${n(fx - fw * 0.3)} ${n((y0 + y1) / 2)} ${n(fx)} ${n(y0)}Z`;
          if (r() < 0.5) fl += path; else fd += path;
        }
        c += `<path d="${fd}" fill="${col('#6B4485')}" fill-opacity="0.22"/><path d="${fl}" fill="${col('#FFE1C4')}" fill-opacity="0.28"/>`;
        // the caprock: a paler band with a ragged lower edge
        const capH = Math.min(22, h * 0.07);
        let cap = topPts.map((p) => [p[0], p[1] - 4]);
        const capLow = [];
        for (let i = steps; i >= 0; i--) capLow.push([b.x + (b.w * i) / steps, topAt(b.x + (b.w * i) / steps) + capH * (0.7 + r() * 0.6)]);
        c += `<path d="${P([[b.x - 10, topAt(b.x) - 4]].concat(cap).concat([[b.x + b.w + 10, topAt(b.x + b.w) - 4]]).concat(capLow))}" fill="${col('#F9CDA6')}" fill-opacity="0.9"/>`;
        c += `<path d="${P(capLow.map((p) => [p[0], p[1] + 2]), true)}" stroke="${col('#9A5F86')}" stroke-width="2" stroke-opacity="0.3" fill="none"/>`;
        // shade under the caprock on the shadow side
        // desert-varnish streaks hanging from the rim
        let varn = '';
        for (let i = 0; i < b.w / 8; i++) {
          const vx = b.x + 4 + r() * (b.w - 8), L = h * (0.1 + r() * 0.45);
          varn += `M${n(vx)} ${n(topAt(vx) + capH)}v${n(L)}`;
        }
        c += `<path d="${varn}" stroke="${col('#6F3F70')}" stroke-width="2" stroke-opacity="0.2" stroke-linecap="round"/>`;
        // a soft haze toward the foot
        const gH = k.id('bh');
        defs += lgU(gH, 0, b.top, 0, foot, [[0, hz, 0], [0.65, hz, 0], [1, hz, 0.35]]);
        c += `<rect x="${b.x - 40}" y="${b.top - 20}" width="${b.w + 80}" height="${h + 40}" fill="url(#${gH})"/>`;
        s += `<g clip-path="url(#${clip})">${c}</g>`;
        // sunlit rim along the caprock and the left wall
        s += `<path d="${P(topPts, true)}" stroke="${col('#FFE6C8')}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
        s += `<path d="${P(lw, true)}" stroke="${col('#FFDDB8')}" stroke-width="2.5" stroke-opacity="0.8" fill="none"/>`;
      }
      return { defs, svg: s };
    }
    // left page: West Mitten (its thumb on the left) and a mesa at the edge;
    // right page: Merrick Butte behind the horse's head, East Mitten (thumb right)
    parts.push(butte({ x: 780, w: 200, top: 752, foot: 900, base: HZ + 26, talus: 120, seed: 33, depth: 0.44 }));
    parts.push(butte({ x: 1190, w: 270, top: 690, foot: 880, base: HZ + 26, talus: 170, seed: 35, depth: 0.34, notch: 1 }));
    parts.push(butte({ x: 160, w: 180, top: 630, foot: 870, base: HZ + 26, talus: 160, seed: 31, depth: 0.26, thumb: { x: 100, w: 38, top: 652 } }));
    parts.push(butte({ x: 1660, w: 190, top: 600, foot: 862, base: HZ + 26, talus: 170, seed: 37, depth: 0.18, thumb: { x: 1882, w: 40, top: 640 } }));
    parts.push(k.haze(HZ - 90, 150, '#FBDCC8', 0.5));

    // ---- valley floor ----------------------------------------------------------------------
    {
      const g = k.id('floor');
      let s = `<path d="M-10 ${HZ}H2090V1582H-10Z" fill="url(#${g})"/>`;
      // low sandy swells crossing the plain, lit tops, violet lee sides
      const swell = (y, amp, seed, fill, rim) => {
        const r = rng(seed);
        const pts = [];
        for (let x = -40; x <= 2120; x += 120) pts.push([x, y + Math.sin(x / 260 + seed) * amp + (r() - 0.5) * amp * 0.6]);
        const d = smooth(pts, false) + 'L2120 1600L-40 1600Z';
        return `<path d="${d}" fill="${fill}"/><path d="${smooth(pts, false)}" stroke="${rim}" stroke-width="3" stroke-opacity="0.55" fill="none"/>`;
      };
      s += swell(1060, 10, 3, '#EEB99E', '#FCE0C6');
      s += swell(1140, 16, 5, '#E9A88E', '#FAD5BA');
      s += swell(1250, 22, 7, '#E39C84', '#F8CDB2');
      s += swell(1390, 26, 9, '#DA8F7E', '#F3C1A8');
      parts.push({ defs: k.linear(g, 90, [[0, '#F3CDBA'], [0.4, '#EDB79D'], [1, '#E3A086']]), svg: s });
      // a far haze on the plain
      parts.push(k.haze(HZ - 20, 120, '#FCE3CF', 0.5));

      // sagebrush scattered over the floor: silvery clumps, lit on the sun side,
      // each with a long violet shadow thrown to the right
      const r = rng(4040);
      let back = '', mid = '', lit = '', shad = '', twig = '';
      for (let i = 0; i < 120; i++) {
        const y = HZ + 12 + Math.pow(r(), 1.6) * 540;
        const x = r() * 2080;
        const sc = 0.22 + ((y - HZ) / 540) * 1.15;
        const w = (16 + r() * 14) * sc, h = (10 + r() * 6) * sc;
        shad += `<ellipse cx="${n(x + w * 1.3)}" cy="${n(y)}" rx="${n(w * 1.5)}" ry="${n(h * 0.22)}"/>`;
        const bumps = 4 + Math.floor(r() * 3);
        for (let j = 0; j < bumps; j++) {
          const t = j / (bumps - 1);
          const bx = x - w + t * 2 * w, by = y - h * 0.35 - Math.sin(t * Math.PI) * h * 0.6 + (r() - 0.5) * h * 0.2;
          const br = h * (0.42 + Math.sin(t * Math.PI) * 0.3);
          back += `<circle cx="${n(bx)}" cy="${n(by)}" r="${n(br)}"/>`;
          if (t < 0.7) mid += `<circle cx="${n(bx - br * 0.2)}" cy="${n(by - br * 0.25)}" r="${n(br * 0.62)}"/>`;
          if (t < 0.45) lit += `<circle cx="${n(bx - br * 0.35)}" cy="${n(by - br * 0.4)}" r="${n(br * 0.3)}"/>`;
        }
        if (sc > 0.7) twig += `M${n(x - w * 0.3)} ${n(y)}l${n(-w * 0.1)} ${n(-h * 0.4)}M${n(x + w * 0.2)} ${n(y)}l${n(w * 0.12)} ${n(-h * 0.45)}`;
      }
      parts.push({ svg: `<g fill="#9670A2" fill-opacity="0.3">${shad}</g><path d="${twig}" stroke="#7A5E86" stroke-width="2"/><g fill="#9C93AE">${back}</g><g fill="#B7B6B4">${mid}</g><g fill="#E6DCC6" fill-opacity="0.85">${lit}</g>` });
    }

    // ---- the longhorns -------------------------------------------------------------------
    // A Texas Longhorn steer, body in profile walking left, head swung round
    // toward us so the horns spread their full width. Local frame in cm: origin
    // on the ground under the girth, y up negative. o.c = coat palette
    // [light, mid, shade, deep]; o.patch = colour of the speckled patches.
    function longhorn(o) {
      const r = rng(o.seed);
      const g = (nm) => k.id(nm);
      const [CL, CM, CD, CDD] = o.c;
      const RIM = '#FFD6B0', VIO = '#3B2763';
      let defs = '', s = '';
      const gBody = g('lb'), gAO = g('lao');
      defs += rgU(gBody, -60, -140, 170, [[0, CL], [0.35, CM], [0.75, CD], [1, CDD]], -80, -140);
      defs += lgU(gAO, 0, -146, 0, -64, [[0, VIO, 0], [0.55, VIO, 0.08], [1, VIO, 0.45]]);
      function hoof(c, pq, far) {
        const ang = (Math.atan2(c[1] - pq[1], c[0] - pq[0]) * 180) / Math.PI - 90;
        const f = far ? '#221C3E' : '#3A3150';
        return `<g transform="translate(${n(c[0])} ${n(c[1])}) rotate(${n(ang)})">` +
          `<path d="M-4 -1L4 -1L4.6 6.4Q1 7.4 -0.6 6.6L-1 3L-1.6 6.8Q-5 7.6 -7 6.6Z" fill="${f}"/>` +
          `<path d="M3.6 -3.4l2.4 1.6" stroke="${f}" stroke-width="1.8" stroke-linecap="round"/>` +
          `<path d="M-4 0L-6.4 6" stroke="${far ? '#4A4270' : '#9086BA'}" stroke-width="0.9" stroke-opacity="0.8"/></g>`;
      }
      function leg(j, w, far) {
        const gl = g('llg');
        const a = j[0], b = j[j.length - 1];
        const top = far ? mix(CD, VIO, 0.2) : CM, low = far ? mix(CDD, VIO, 0.3) : mix(CM, CD, 0.55);
        defs += lgU(gl, a[0], a[1], b[0], b[1], [[0, top], [0.6, low], [1, mix(low, CDD, 0.4)]]);
        return `<path d="${limb(j, w)}" fill="url(#${gl})"/>` + hoof(j[j.length - 1], j[j.length - 2], far);
      }
      const st = o.stride || 0; // swaps the walking pair
      const fF = st ? [[-50, -92], [-50, -72], [-56, -56], [-60, -44], [-66, -32], [-70, -20], [-73, -12]] : [[-50, -92], [-48, -72], [-46, -56], [-44, -45], [-38, -33], [-33, -22], [-29, -16]];
      const fH = st ? [[62, -108], [62, -86], [72, -70], [80, -56], [84, -44], [86, -28], [88, -12], [89, -6]] : [[62, -108], [60, -86], [62, -70], [66, -56], [66, -46], [62, -30], [58, -14], [56, -7]];
      s += leg(fH, [16, 13.6, [9.4, 9.8], [7, 7.6], [6, 8], 4.4, [4.8, 5.6], 4], true);
      s += leg(fF, [13, 11.4, 8, [6.6, 5.8], 4.4, [5, 5.4], 4], true);
      // tail with its switch
      const sw = st ? 4 : -3;
      s += `<path d="M88 -136C96 -128 98 -110 ${98 + sw * 0.5} -90C${98 + sw} -74 ${99 + sw} -60 ${100 + sw} -50" stroke="${CD}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
      s += `<path d="${smooth([[100 + sw, -54], [104 + sw, -44], [103 + sw, -32], [100 + sw, -26, 1], [97 + sw, -32], [96 + sw, -44]])}" fill="${o.switchC || CDD}"/>`;
      // body
      const body = [[-84, -108], [-90, -120], [-98, -130], [-104, -140], [-90, -147], [-68, -151], [-42, -146], [0, -141], [40, -142], [62, -147], [80, -142], [90, -136], [96, -123], [94, -107], [88, -92], [80, -80], [64, -73], [40, -64], [10, -58], [-24, -59], [-48, -63], [-64, -68], [-77, -76], [-87, -90]];
      const bodyD = smooth(body);
      const clip = g('lcl');
      defs += `<clipPath id="${clip}"><path d="${bodyD}"/></clipPath>`;
      s += `<path d="${bodyD}" fill="url(#${gBody})"/>`;
      let ov = '';
      if (o.patch) {
        // speckled patches (the classic longhorn colour-sided pattern)
        for (const [px, py, pr] of o.patches) {
          const pts = [];
          const ph1 = r() * 6, ph2 = r() * 6;
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const rr = pr * (0.85 + 0.22 * Math.sin(a * 3 + ph1) + 0.12 * Math.sin(a * 5 + ph2));
            pts.push([px + Math.cos(a) * rr * 1.3, py + Math.sin(a) * rr]);
          }
          ov += `<path d="${smooth(pts)}" fill="${o.patch}"/>`;
          for (let i = 0; i < 3; i++) {
            const a = r() * Math.PI * 2, d = pr * (1.2 + r() * 0.3), rr = pr * (0.18 + r() * 0.16);
            ov += `<ellipse cx="${n(px + Math.cos(a) * d * 1.3)}" cy="${n(py + Math.sin(a) * d)}" rx="${n(rr * 1.3)}" ry="${n(rr)}" fill="${o.patch}"/>`;
          }
          let sp = '';
          for (let i = 0; i < 22; i++) {
            const a = r() * Math.PI * 2, d = pr * (1.05 + r() * 0.7);
            sp += `<circle cx="${n(px + Math.cos(a) * d * 1.25)}" cy="${n(py + Math.sin(a) * d)}" r="${n(0.6 + r() * 1.3)}"/>`;
          }
          ov += `<g fill="${o.patch}" fill-opacity="0.85">${sp}</g>`;
        }
      }
      // light planes: shoulder, top of the back, hip; shadow planes: belly, behind the shoulder, rump
      ov += `<path d="${smooth([[-66, -148], [-74, -132], [-82, -114], [-84, -100], [-74, -104], [-66, -122], [-58, -140]])}" fill="#FFFFFF" fill-opacity="0.16"/>`;
      ov += `<path d="${smooth([[-40, -145], [0, -140], [40, -141], [62, -146], [78, -140], [60, -134], [20, -132], [-30, -136]])}" fill="#FFFFFF" fill-opacity="0.14"/>`;
      ov += `<path d="${smooth([[-52, -88], [-20, -84], [20, -82], [56, -88], [70, -84], [64, -64], [-50, -60]])}" fill="${VIO}" fill-opacity="0.3"/>`;
      ov += `<path d="${smooth([[-48, -146], [-52, -126], [-54, -104], [-56, -84], [-62, -84], [-60, -110], [-56, -132]])}" fill="${VIO}" fill-opacity="0.16"/>`;
      ov += `<path d="${smooth([[86, -138], [96, -122], [92, -100], [84, -86], [78, -94], [84, -112], [82, -128]])}" fill="${VIO}" fill-opacity="0.26"/>`;
      ov += `<path d="${smooth([[56, -144], [50, -124], [52, -100], [60, -80], [54, -84], [46, -104], [48, -128]])}" fill="${VIO}" fill-opacity="0.14"/>`;
      // ribs, faintly
      ov += `<path d="M-14 -116C-12 -104 -12 -92 -14 -80M-4 -118C-2 -106 -2 -94 -4 -82M6 -118C8 -106 8 -94 6 -82" stroke="${VIO}" stroke-width="1.2" stroke-opacity="0.12" fill="none"/>`;
      s += `<g clip-path="url(#${clip})">${ov}<path d="${bodyD}" fill="url(#${gAO})"/></g>`;
      // dewlap folds, rims
      s += `<path d="M-88 -96C-84 -88 -80 -82 -74 -78M-94 -110C-90 -100 -86 -94 -82 -90" stroke="${CDD}" stroke-width="1.1" stroke-opacity="0.3" fill="none"/>`;
      s += `<path d="M-68 -151C-42 -146 0 -141 40 -142C52 -142 62 -147 80 -142" stroke="${RIM}" stroke-width="1.3" stroke-opacity="0.6" fill="none"/>`;
      s += `<path d="M-84 -108C-86 -98 -84 -88 -78 -80" stroke="${RIM}" stroke-width="1.6" stroke-opacity="0.75" fill="none"/>`;
      // near legs
      const nF = st ? [[-60, -96], [-58, -74], [-54, -58], [-50, -46], [-44, -34], [-40, -22], [-37, -16]] : [[-60, -96], [-60, -74], [-64, -58], [-67, -46], [-70, -32], [-72, -16], [-73, -7]];
      const nH = st ? [[70, -112], [70, -88], [70, -72], [72, -58], [72, -48], [68, -32], [64, -18], [62, -11]] : [[70, -112], [72, -88], [80, -72], [88, -58], [92, -47], [93, -30], [94, -14], [95, -6]];
      const nHW = [18, 15, [10.4, 10.8], [7.8, 8.4], [6.4, 8.6], 4.8, [5.2, 6], 4.4], nFW = [14.5, 12.6, 8.8, [7.2, 6.2], 4.8, [5.4, 5.8], 4.4];
      s += leg(nH, nHW);
      s += `<path d="${smooth(limbPts(nH, nHW).slice(2, 6), false)}" stroke="${RIM}" stroke-width="1.1" stroke-opacity="0.5" fill="none"/>`;
      s += leg(nF, nFW);
      s += `<path d="${smooth(limbPts(nF, nFW).slice(1, 6), false)}" stroke="${RIM}" stroke-width="1.2" stroke-opacity="0.65" fill="none"/>`;

      // the head, frontal: origin at the middle of the forehead
      {
        const HXo = o.headAt || [-106, -134];
        const xc = o.xc || 1, hsc = o.headScale || 1;
        const tilt = o.tilt || 0;
        let h = '';
        const gH = g('lhd'), gHn = g('lhn'), gHnD = g('lhnd');
        defs += lgU(gH, -16, 0, 16, 0, [[0, mix(CL, '#FFFFFF', 0.2)], [0.45, CL], [1, CD]]);
        // horns: centreline + half-widths, mirrored; the far (right-hand) one a touch shorter
        const hornC = [[11, -1], [24, -4.6], [40, -6.6], [56, -6.4], [70, -9.6], [80, -16.6], [86, -27], [88, -34]];
        const hornW = [4.6, 4, 3.4, 2.9, 2.4, 1.8, 1.1, 0.3];
        defs += lgU(gHn, 10, 0, 88, 0, [[0, '#F7ECD8'], [0.45, '#EDD9BA'], [0.72, '#D9B892'], [0.86, '#6D5A86'], [1, '#2E2756']]);
        defs += lgU(gHnD, 10, 0, 88, 0, [[0, '#E6D3C0'], [0.45, '#D2B9A2'], [0.72, '#B9977E'], [0.86, '#55467A'], [1, '#221C45']]);
        const spread = o.spread || 1;
        const horn = (side, sc, fill) => {
          const pts = hornC.map(([x, y]) => [side * x * sc, y * (0.8 + 0.2 * sc)]);
          let out = `<path d="${limb(pts, hornW)}" fill="url(#${fill})" ${side < 0 ? '' : ''}/>`;
          // a light ridge along the top, shadow beneath, growth rings near the base
          const top = limbPts(pts, hornW).slice(0, pts.length);
          const bot = limbPts(pts, hornW).slice(pts.length).reverse();
          out += `<path d="${smooth(side < 0 ? bot.slice(1, 6) : top.slice(1, 6), false)}" stroke="#FFF8EC" stroke-width="1.2" stroke-opacity="0.8" fill="none"/>`;
          out += `<path d="${smooth(side < 0 ? top.slice(0, 6) : bot.slice(0, 6), false)}" stroke="#9A7CA6" stroke-width="1.4" stroke-opacity="0.45" fill="none"/>`;
          let rings = '';
          for (let i = 0; i < 4; i++) {
            const p = lp(pts[0], pts[1], 0.3 + i * 0.22), w = 4.3 - i * 0.2;
            rings += `M${n(p[0] + side * 0.6)} ${n(p[1] - w)}q${n(side * 1.4)} ${n(w)} 0 ${n(2 * w)}`;
          }
          out += `<path d="${rings}" stroke="#A88C78" stroke-width="0.7" stroke-opacity="0.55" fill="none"/>`;
          return out;
        };
        // horn widths need the mirrored side to keep the same handedness
        h += horn(1, 0.9 * spread, gHnD);
        h += horn(-1, 1.0 * spread, gHn);
        // ears, out sideways under the horns
        for (const side of [-1, 1]) {
          const ex = side * 14, ey = 9;
          h += `<path d="M${ex} ${ey - 3}C${ex + side * 8} ${ey - 6} ${ex + side * 17} ${ey - 3} ${ex + side * 20} ${ey + 1}C${ex + side * 15} ${ey + 5} ${ex + side * 7} ${ey + 5} ${ex} ${ey + 3}Z" fill="${side < 0 ? CL : CM}"/>`;
          h += `<path d="M${ex + side * 2} ${ey - 1}C${ex + side * 8} ${ey - 3} ${ex + side * 14} ${ey - 1} ${ex + side * 17} ${ey + 1}C${ex + side * 12} ${ey + 3} ${ex + side * 6} ${ey + 3} ${ex + side * 2} ${ey + 2}Z" fill="#D9939A" fill-opacity="0.75"/>`;
        }
        // face
        const face = [[0, -6], [8, -4.4], [14, 0.4], [13.6, 8], [13.8, 14], [11.4, 22], [9, 31], [7.6, 39], [8.6, 46], [7.6, 52], [0, 54.4], [-7.6, 52], [-8.6, 46], [-7.6, 39], [-9, 31], [-11.4, 22], [-13.8, 14], [-13.6, 8], [-14, 0.4], [-8, -4.4]];
        const faceD = smooth(face);
        const fclip = g('fcl');
        defs += `<clipPath id="${fclip}"><path d="${faceD}"/></clipPath>`;
        h += `<path d="${faceD}" fill="url(#${gH})"/>`;
        let fo = '';
        if (o.face === 'eye') fo += `<path d="${smooth([[4, -2], [16, 2], [16, 22], [8, 26], [2, 18], [1, 6]])}" fill="${o.facePatch}"/>`;
        if (o.face === 'blaze') fo += `<path d="${smooth([[-6, -3], [0, -5], [6, -3], [5, 8], [2.6, 20], [3, 34], [0, 40], [-3, 34], [-2.6, 20], [-5, 8]])}" fill="${o.facePatch}"/>`;
        // shade down the right side of the face, light down the bridge
        fo += `<path d="${smooth([[6, -2], [14, 2], [14, 20], [9, 34], [8, 46], [6, 54], [3, 40], [6, 20]])}" fill="${VIO}" fill-opacity="0.22"/>`;
        fo += `<path d="${smooth([[-4, 4], [-1, 2], [1, 14], [0.6, 34], [-0.6, 40], [-2, 34], [-3, 14]])}" fill="#FFFFFF" fill-opacity="0.3"/>`;
        // muzzle
        fo += `<path d="${smooth([[-8.4, 42], [0, 40.4], [8.4, 42], [8.8, 49], [6, 54], [0, 55], [-6, 54], [-8.8, 49]])}" fill="${o.muzzle || '#C9A0A8'}"/>`;
        s;
        h += `<g clip-path="url(#${fclip})">${fo}</g>`;
        h += `<path d="M-5.6 47.4C-4.6 45.6 -2.6 45.6 -2.2 47.8C-3 49.4 -4.8 49.4 -5.6 47.4ZM5.6 47.4C4.6 45.6 2.6 45.6 2.2 47.8C3 49.4 4.8 49.4 5.6 47.4Z" fill="#2A2044"/>`;
        h += `<path d="M-4 52.4Q0 53.6 4 52.4" stroke="#6E4E6A" stroke-width="0.9" fill="none"/>`;
        // poll tuft (curly), brow, eyes
        h += `<path d="M-9 -3C-6 -8 -2 -9 0 -6C2 -9 7 -8 9 -3C5 -1 -5 -1 -9 -3Z" fill="${mix(CL, '#FFFFFF', 0.25)}"/>`;
        h += `<path d="M-6 -4.6q2 -2 4 0M1 -4.6q2 -2 4 0" stroke="${CD}" stroke-width="0.8" stroke-opacity="0.5" fill="none"/>`;
        for (const side of [-1, 1]) {
          const ex = side * 10.6, ey = 15;
          h += `<path d="M${ex - 2.8} ${ey}C${ex - 1.6} ${ey - 2.2} ${ex + 1.6} ${ey - 2.2} ${ex + 2.8} ${ey}C${ex + 1.6} ${ey + 2} ${ex - 1.6} ${ey + 2} ${ex - 2.8} ${ey}Z" fill="#1E1630"/>`;
          h += `<circle cx="${ex - side * 0.6}" cy="${ey - 0.7}" r="0.75" fill="#FFFFFF"/>`;
          h += `<path d="M${ex - 3.4} ${ey - 2.6}Q${ex} ${ey - 4.6} ${ex + 3.4} ${ey - 2.6}" stroke="${CDD}" stroke-width="0.9" stroke-opacity="0.45" fill="none"/>`;
        }
        h += `<path d="M-13.6 8C-13.8 14 -12 22 -9 31C-7.8 37 -8.6 44 -8.6 46" stroke="${RIM}" stroke-width="1.2" stroke-opacity="0.75" fill="none"/>`;
        s += `<g transform="translate(${HXo[0]} ${HXo[1]}) scale(${n(hsc / xc * 1000) / 1000} ${hsc}) rotate(${tilt})">${h}</g>`;
      }
      return { defs, svg: `<g transform="translate(${o.x} ${o.y}) scale(${n(o.s * (o.xc || 1) * 1000) / 1000} ${o.s})">${s}</g>` };
    }
    // the drive's dust, rising behind the herd and drifting east
    const dustF = k.id('dustblur');
    parts.push({ defs: `<filter id="${dustF}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>` });
    function dust(cx, cy, w, h, seed, op, col) {
      const r = rng(seed);
      let c = '';
      for (let i = 0; i < 14; i++) {
        const x = cx + (r() - 0.5) * w, y = cy + (r() - 0.6) * h, rr = h * (0.25 + r() * 0.35);
        c += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rr)}"/>`;
      }
      return `<g filter="url(#${dustF})" fill="${col || '#FBE2C8'}" fill-opacity="${op}">${c}</g>`;
    }
    // dust hanging over the trail behind the herd, drifting east toward the rider
    parts.push({ svg: dust(1010, 1040, 600, 190, 5, 0.62) + dust(880, 1110, 360, 120, 6, 0.5, '#F6CDB6') + dust(1180, 1100, 260, 120, 12, 0.5) });
    // the herd strung out ahead, tiny in the haze toward the sunset
    for (const [x, y, sc, sd] of [[46, 1030, 0.3, 21], [118, 1036, 0.36, 22], [214, 1028, 0.27, 23]]) {
      parts.push(longhorn({ x, y, s: sc, seed: sd, c: ['#C9A9C6', '#A88AB6', '#8A70A6', '#6E5A96'], muzzle: '#5A4A80', stride: sd % 2, spread: 0.95, tilt: 0 }));
    }
    parts.push(k.haze(990, 70, '#FBDCCA', 0.45));
    parts.push({ svg: dust(160, 1040, 280, 50, 13, 0.45) + dust(420, 1080, 300, 70, 11, 0.4) });
    // the second steer: cream, speckled red
    parts.push(`<path d="M150 1162Q330 1150 560 1158Q330 1176 150 1162Z" fill="#8A6AA0" fill-opacity="0.28"/>`);
    parts.push(longhorn({ x: 266, y: 1160, s: 1.36, xc: 0.9, seed: 4, c: ['#FFF4E8', '#F1DACA', '#C8AEC6', '#937DB0'], patch: '#C9614D', patches: [[-18, -108, 18], [46, -114, 15], [78, -92, 9]], face: 'eye', facePatch: '#C9614D', muzzle: '#D8A9AE', stride: 0, spread: 1, tilt: -4 }));
    parts.push({ svg: dust(600, 1150, 320, 90, 8, 0.45) });
    // the lead steer: mahogany red, white-sided, a blaze — head on the setting sun
    parts.push(`<path d="M560 1354Q760 1336 1000 1342Q800 1368 560 1354Z" fill="#7E5E9E" fill-opacity="0.32"/>`);
    parts.push(longhorn({
      x: 740, y: 1352, s: 3.0, xc: 0.7, headScale: 1.06, seed: 9, c: ['#F09A72', '#BA5A40', '#7C3747', '#4E2752'], patch: '#F6EADF',
      patches: [[-6, -98, 17], [44, -106, 13], [72, -86, 8]], face: 'blaze', facePatch: '#F8EEE4', muzzle: '#3E2E52', switchC: '#2E2448', stride: 1, spread: 1.1, tilt: 0,
    }));

    // ---- the cowboy ------------------------------------------------------------------------
    // Drawn in a local frame in centimetres: origin on the ground under the
    // girth, facing left (west, into the sun), y up negative; placed at HX, HY
    // and scaled by HS. A bay quarter horse at the lope — deep chest, heavy
    // hindquarters, black points: near (left) fore folded high, far fore
    // reaching to land, near hind driving off behind, far hind swinging under.
    // The rider sits deep in a western saddle on a Navajo blanket: shotgun
    // chaps, vest, bandana, a cattleman-crease hat; near hand on the reins and
    // the rope coils, his far arm high, swinging the loop.
    const HX = 1530, HY = 1312, HS = 2.62;
    {
      let defs = '', s = '';
      const g = (name) => k.id(name);
      const COAT_L = '#DC8A5E', COAT = '#A85A40', COAT_D = '#76394A', COAT_DD = '#4A2A55';
      const PT = '#2C2552', RIM = '#FFCB9E', SHEEN = '#F5A97F', VIO = '#3B2763';
      const gBody = g('hb'), gAO = g('hao'), gHead = g('hh'), gMane = g('hm');
      defs += rgU(gBody, -40, -150, 170, [[0, COAT_L], [0.3, COAT], [0.7, COAT_D], [1, COAT_DD]], -60, -150);
      defs += lgU(gAO, 0, -150, 0, -74, [[0, VIO, 0], [0.5, VIO, 0.08], [1, VIO, 0.5]]);
      defs += lgU(gMane, -100, -200, -20, -150, [[0, '#3C3370'], [1, '#241E48']]);

      function leg(j, w, far, pointsFrom) {
        const gl = g('lg');
        const a = j[0], b = j[j.length - 1];
        const coat = far ? mix(COAT_D, VIO, 0.3) : COAT, coatL = far ? COAT_D : mix(COAT, COAT_L, 0.55);
        const pt = far ? '#211B40' : PT;
        defs += lgU(gl, a[0], a[1], b[0], b[1], [[0, coatL], [pointsFrom * 0.75, coat], [pointsFrom, mix(coat, pt, 0.75)], [pointsFrom + 0.07, pt], [1, pt]]);
        let o = `<path d="${limb(j, w)}" fill="url(#${gl})"/>`;
        const c = j[j.length - 1], pq = j[j.length - 2];
        const ang = (Math.atan2(c[1] - pq[1], c[0] - pq[0]) * 180) / Math.PI - 90;
        o += `<g transform="translate(${n(c[0])} ${n(c[1])}) rotate(${n(ang)})">` +
          `<path d="M-4.8 -1.2L4.6 -1.2L5.2 7.8Q0 9.6 -8.2 8.6Z" fill="${far ? '#1C1734' : '#3A3150'}"/>` +
          `<path d="M-4.6 -0.2L-7.6 8" stroke="${far ? '#463E6C' : '#9086BA'}" stroke-width="1.1" stroke-opacity="0.8" fill="none"/>` +
          `<path d="M-5.2 -1.6Q0 -3.4 5 -1.6" stroke="${pt}" stroke-width="2.4" fill="none"/></g>`;
        return o;
      }
      function legRim(j, w, from, to, op) {
        const pts = limbPts(j, w).slice(0, j.length).slice(from, to);
        return `<path d="${smooth(pts, false)}" stroke="${RIM}" stroke-width="1.4" stroke-opacity="${op || 0.75}" fill="none" stroke-linecap="round"/>`;
      }

      // far legs
      const farFore = [[-46, -106], [-44, -84], [-52, -68], [-59, -56], [-62, -50], [-68, -40], [-75, -31], [-80, -24], [-83, -19]];
      const farForeW = [14, 12.5, 8.8, 6.4, [7, 5.8], 4.8, [5.2, 6.6], 4.2, 4.2];
      const farHind = [[54, -122], [52, -94], [58, -80], [64, -70], [67, -63], [62, -54], [56, -45], [51, -40], [46, -36]];
      const farHindW = [18, 14, [9.5, 10], [7, 8], [6, 9], 4.8, [5.2, 6.4], 4, 4];
      s += leg(farHind, farHindW, true, 0.52) + leg(farFore, farForeW, true, 0.48);

      // tail, streaming behind in locks
      {
        const gt = g('tl');
        defs += lgU(gt, 84, -146, 150, -80, [[0, '#3C3370'], [0.6, '#2A2350'], [1, '#3D3674']]);
        let t = '';
        const locks = [[0, 0, 1], [4, 6, 0.92], [-3, 8, 0.85], [6, 14, 0.8], [1, 18, 0.7]];
        for (const [dx, dy, sc] of locks) {
          t += `<path d="M84 -147C${98 + dx} ${-152 + dy} ${118 + dx} ${-140 + dy} ${n(128 + dx * sc)} ${n(-124 + dy)}C${n(138 + dx)} ${n(-110 + dy)} ${n(146 + dx)} ${n(-100 + dy * 0.6)} ${n(154 + dx * 1.2)} ${n(-86 + dy * 0.5)}C${n(142 + dx)} ${n(-94 + dy * 0.6)} ${n(132 + dx)} ${n(-100 + dy)} ${n(122 + dx)} ${n(-106 + dy * 0.8)}C${110 + dx * 0.5} ${n(-114 + dy * 0.6)} 96 -120 88 -124Z" fill="url(#${gt})" fill-opacity="${n(0.75 + sc * 0.25)}"/>`;
        }
        let str = '';
        for (let i = 0; i < 9; i++) str += `M${88 + i * 1.6} ${-144 + i * 2.6}C${104 + i * 1.6} ${-144 + i * 3.6} ${120 + i} ${-128 + i * 3} ${140 + i * 1.8} ${-100 + i * 1.6}`;
        t += `<path d="${str}" stroke="#7A70B2" stroke-width="0.9" stroke-opacity="0.55" fill="none" stroke-linecap="round"/>`;
        t += `<path d="M86 -147C102 -152 120 -140 130 -124" stroke="#B0A2D8" stroke-width="1.3" stroke-opacity="0.6" fill="none"/>`;
        s += t;
      }

      // body
      const body = [[-74, -112], [-81, -127], [-90, -145], [-99, -164], [-104, -180], [-99, -196], [-86, -200], [-68, -190], [-48, -172], [-30, -156], [-14, -151], [6, -146], [30, -148], [54, -154], [74, -151], [88, -142], [96, -127], [95, -110], [88, -96], [78, -84], [60, -81], [48, -84], [28, -78], [4, -75], [-24, -76], [-42, -80], [-58, -86], [-70, -98]];
      const bodyD = smooth(body);
      const bodyClip = g('bclip');
      defs += `<clipPath id="${bodyClip}"><path d="${bodyD}"/></clipPath>`;
      s += `<path d="${bodyD}" fill="url(#${gBody})"/>`;
      {
        let b = '';
        // crisp light planes: neck crest, shoulder, top of the barrel, croup
        b += `<path d="${smooth([[-96, -194], [-80, -192], [-62, -180], [-46, -166], [-50, -158], [-66, -168], [-84, -180]])}" fill="${SHEEN}" fill-opacity="0.32"/>`;
        b += `<path d="${smooth([[-34, -152], [-44, -140], [-58, -124], [-70, -112], [-72, -102], [-62, -106], [-50, -118], [-40, -132], [-30, -146]])}" fill="${SHEEN}" fill-opacity="0.38"/>`;
        b += `<path d="${smooth([[-12, -149], [20, -144], [50, -150], [70, -148], [84, -138], [76, -132], [56, -140], [26, -136], [-4, -140]])}" fill="${SHEEN}" fill-opacity="0.28"/>`;
        b += `<path d="${smooth([[48, -150], [64, -146], [74, -134], [72, -118], [62, -110], [56, -122], [52, -136]])}" fill="${SHEEN}" fill-opacity="0.3"/>`;
        // shadow planes: under the barrel, behind the elbow, under the neck, back of the quarters
        b += `<path d="${smooth([[-44, -100], [-20, -96], [10, -95], [36, -99], [52, -96], [60, -76], [-40, -70]])}" fill="${VIO}" fill-opacity="0.32"/>`;
        b += `<path d="${smooth([[-30, -150], [-34, -132], [-38, -112], [-40, -96], [-46, -92], [-46, -110], [-40, -134]])}" fill="${VIO}" fill-opacity="0.22"/>`;
        b += `<path d="${smooth([[-104, -176], [-94, -160], [-84, -140], [-76, -122], [-82, -122], [-92, -142], [-102, -160]])}" fill="${VIO}" fill-opacity="0.25"/>`;
        b += `<path d="${smooth([[86, -142], [94, -126], [92, -104], [84, -90], [78, -96], [84, -112], [84, -128]])}" fill="${VIO}" fill-opacity="0.3"/>`;
        // the flank crease where the stifle meets the barrel
        b += `<path d="${smooth([[50, -146], [46, -128], [44, -108], [48, -86], [42, -92], [40, -112], [42, -132]])}" fill="${VIO}" fill-opacity="0.2"/>`;
        s += `<g clip-path="url(#${bodyClip})">${b}<path d="${bodyD}" fill="url(#${gAO})"/></g>`;
      }
      // anatomy lines and rims
      s += `<path d="M-44 -98C-40 -92 -36 -88 -30 -84M88 -138C86 -124 84 -110 78 -96M12 -120C16 -110 16 -100 12 -90M22 -122C26 -112 26 -100 22 -90" stroke="${COAT_DD}" stroke-width="1.2" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-73 -110C-79 -122 -87 -138 -96 -156C-100 -166 -103 -174 -104 -180" stroke="${RIM}" stroke-width="2" stroke-opacity="0.85" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-72 -100C-66 -92 -58 -86 -50 -83" stroke="${RIM}" stroke-width="1.2" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-14 -151C6 -146 30 -148 54 -154C66 -156 78 -152 88 -142" stroke="${RIM}" stroke-width="1.2" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-96 -170C-86 -152 -78 -136 -72 -120" stroke="${COAT_DD}" stroke-width="1.1" stroke-opacity="0.3" fill="none"/>`;

      // near legs
      const nearHind = [[64, -124], [64, -94], [73, -79], [84, -66], [92, -53], [97, -42], [102, -30], [106, -20], [110, -12], [113, -7]];
      const nearHindW = [22, 17, [12.5, 13], [8.6, 9.6], [6.2, 9.8], [5.2, 6.4], 4.9, [5.3, 6.6], 4.1, 4.3];
      const nearFore = [[-50, -106], [-47, -88], [-56, -80], [-68, -76], [-78, -74], [-81, -70], [-78, -62], [-73, -52], [-68, -46], [-61, -43]];
      const nearForeW = [14, 12.5, 9.6, 7.2, [7.4, 6], [7, 5.6], 4.8, [5.2, 6.4], 4.2, 4.2];
      s += leg(nearHind, nearHindW, false, 0.56) + legRim(nearHind, nearHindW, 2, 7, 0.6);
      s += `<path d="M68 -104C76 -90 86 -74 94 -58" stroke="${COAT_DD}" stroke-width="1.3" stroke-opacity="0.3" fill="none"/>`;
      s += `<path d="${smooth([[66, -112], [76, -100], [84, -84], [80, -82], [70, -96]])}" fill="${SHEEN}" fill-opacity="0.3"/>`;
      s += leg(nearFore, nearForeW, false, 0.5) + legRim(nearFore, nearForeW, 1, 6, 0.85);
      s += `<path d="${smooth([[-48, -96], [-58, -86], [-70, -80], [-66, -78], [-54, -82]])}" fill="${SHEEN}" fill-opacity="0.45"/>`;
      s += `<path d="M-56 -76C-64 -72 -72 -70 -78 -68" stroke="${VIO}" stroke-width="2" stroke-opacity="0.25" fill="none" stroke-linecap="round"/>`;

      // saddle blanket (a Navajo weave), breast collar, cinch, fender, saddle
      {
        const gB = g('blk');
        defs += lgU(gB, -26, 0, 40, 0, [[0, '#F6E8D6'], [1, '#DCC6CC']]);
        let b = `<path d="M-28 -153L-29 -114Q-29 -110 -25 -110H39Q43 -110 43 -114L42 -151Z" fill="url(#${gB})"/>`;
        b += `<path d="M-29 -121H43M-29 -116.5H43" stroke="#D9574F" stroke-width="2"/><path d="M-29 -125H43" stroke="#3A4FC9" stroke-width="1.6"/>`;
        let dia = '';
        for (let x = -24; x < 42; x += 11) dia += `M${x} -135l4.5 -4.5l4.5 4.5l-4.5 4.5Z`;
        b += `<path d="${dia}" fill="#D9574F"/><path d="${dia}" fill="none" stroke="#3A4FC9" stroke-width="0.8" transform="translate(0 0)" stroke-opacity="0.7"/>`;
        let tas = '';
        for (let x = -26; x <= 40; x += 3.6) tas += `M${n(x)} -110v3.6`;
        b += `<path d="${tas}" stroke="#EBD8C6" stroke-width="1.1"/>`;
        b += `<path d="M-28 -153L-29 -114Q-29 -110 -25 -110" stroke="#FFF4E6" stroke-width="1" fill="none"/>`;
        s += b;
        // cinch
        s += `<path d="M-14 -124L-19 -77" stroke="#563640" stroke-width="5.4"/><path d="M-15.6 -124L-20.4 -78" stroke="#C69A6A" stroke-width="0.9" stroke-opacity="0.6"/>`;
        s += `<rect x="-20" y="-106" width="7" height="6" rx="1.5" fill="none" stroke="#E8DCC0" stroke-width="1.4" transform="rotate(6 -16 -103)"/>`;
        s += `<path d="M30 -122L32 -86" stroke="#563640" stroke-width="4"/>`;
        // breast collar
        s += `<path d="M-24 -142C-40 -128 -58 -117 -73 -111" stroke="#6B3F38" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M-24 -143.6C-40 -129.6 -58 -118.6 -73 -112.6" stroke="#E7AA7C" stroke-width="1" stroke-opacity="0.7" fill="none"/>`;
        s += `<circle cx="-48" cy="-125.6" r="2.8" fill="#E8E2EE"/><circle cx="-48.7" cy="-126.3" r="1" fill="#FFFFFF"/>`;
        // the saddle: tooled skirt, swell and horn, seat, cantle
        const gS = g('sad');
        defs += lgU(gS, -20, -172, 40, -118, [[0, '#E6A874'], [0.5, '#BC7149'], [1, '#7E4640']]);
        let sd = `<path d="M-21 -152L-21 -128Q-21 -121 -14 -121H32Q38 -121 38 -128V-152Z" fill="url(#${gS})"/>`;
        sd += `<path d="M-18 -149V-129Q-18 -124 -13 -124H31Q35 -124 35 -129V-149" stroke="#FFD2A2" stroke-width="0.7" stroke-dasharray="1.6 1.3" stroke-opacity="0.8" fill="none"/>`;
        sd += `<path d="M-6 -140c3 -3 7 -3 9 0c2 3 6 3 8 0M14 -134c3 -3 7 -3 9 0" stroke="#7E4640" stroke-width="0.8" stroke-opacity="0.5" fill="none"/>`;
        sd += `<path d="M-24 -151C-23 -159 -20 -164 -14 -166L-12 -158C-2 -153 12 -152 24 -158C26 -164 30 -167 35 -167C39 -163 39 -156 37 -150Z" fill="url(#${gS})"/>`;
        sd += `<path d="M-15 -166L-14.6 -172.6L-9.4 -172.6L-9 -165Z" fill="#8E5240"/><ellipse cx="-12" cy="-173.4" rx="5.4" ry="2" fill="#D49866"/><ellipse cx="-12.6" cy="-174" rx="3" ry="0.8" fill="#F6C99A"/>`;
        sd += `<path d="M-23 -151C-22 -158 -19 -163 -14 -165.6" stroke="#FFD2A2" stroke-width="1.2" stroke-opacity="0.8" fill="none"/>`;
        sd += `<path d="M24 -158C26 -164 30 -167 35 -167" stroke="#FFD2A2" stroke-width="1.2" stroke-opacity="0.8" fill="none"/>`;
        s += sd;
      }

      // mane: locks streaming back off the crest
      {
        const r = rng(77);
        const crest = [[-97, -200], [-86, -201], [-68, -191], [-48, -173], [-32, -158]];
        const at = (t) => { const sg = Math.min(3, Math.floor(t * 4)); return lp(crest[sg], crest[sg + 1], t * 4 - sg); };
        let dark = '', mid = '', hl = '';
        for (let i = 0; i < 16; i++) {
          const t = i / 15;
          const p = at(Math.max(0, t - 0.05)), q = at(Math.min(1, t + 0.06));
          const L = 16 + Math.sin(t * Math.PI) * 12 + r() * 6;
          const lift = -4 + r() * 6;
          const tip = [p[0] + L * 0.92, p[1] + L * 0.38 + lift];
          const m1 = [p[0] + L * 0.45, p[1] - 3 + lift * 0.3], m2 = [p[0] + L * 0.55, p[1] + L * 0.3 + 3];
          const lock = smooth([[p[0] - 2, p[1] - 1.5], m1, [tip[0], tip[1], 1], m2, [q[0] + 1, q[1] + 6]], true, 0.9);
          if (i % 2) mid += lock; else dark += lock;
          hl += `M${n(p[0] + 2)} ${n(p[1] - 0.5)}Q${n(m1[0] + 2)} ${n(m1[1])} ${n(tip[0] - 4)} ${n(tip[1] - 2)}`;
        }
        s += `<path d="${dark}" fill="url(#${gMane})"/><path d="${mid}" fill="#3E3577"/>`;
        s += `<path d="${hl}" stroke="#968CCC" stroke-width="1" stroke-opacity="0.7" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M-97 -201C-88 -203 -76 -197 -64 -188" stroke="#C2B4E6" stroke-width="1.2" stroke-opacity="0.6" fill="none" stroke-linecap="round"/>`;
      }

      // head, in its own frame: origin at the poll, u along the face toward
      // the muzzle, v toward the jaw. Carried about 40° below level.
      const ha = (40 * Math.PI) / 180;
      const AX = [-Math.cos(ha), Math.sin(ha)], PV = [Math.cos(ha), Math.sin(ha)], PO = [-97, -197];
      const H = (u, v) => [PO[0] + AX[0] * u + PV[0] * v, PO[1] + AX[1] * u + PV[1] * v];
      {
        defs += lgU(gHead, 0, 0, 56, 0, [[0, COAT], [0.45, mix(COAT, COAT_L, 0.6)], [1, COAT_L]]);
        const gJ = g('jw');
        defs += rgU(gJ, 13, 16, 15, [[0, SHEEN, 0.6], [1, SHEEN, 0]]);
        let h = '';
        h += `<path d="M2 -1C-2 -8 -4 -14 -2 -19C2 -14 6 -8 7 -2Z" fill="${COAT_D}"/>`;
        const head = [[-2, -2], [10, -3], [20, -2.6], [34, -1.2], [46, 1], [54, 3.5], [57.6, 8.5], [56.6, 13.4], [52, 15.4], [53, 18.4], [48, 20.6], [38, 19.2], [28, 22.4], [17, 26.6], [6, 25.2], [-1, 18.4], [-5, 9]];
        h += `<path d="${smooth(head)}" fill="url(#${gHead})"/>`;
        h += `<ellipse cx="13" cy="16" rx="13" ry="9" fill="url(#${gJ})"/>`;
        h += `<path d="M2 23C8 13 16 9.6 24 11.6C28.4 13.4 30.4 18 30 21.6" stroke="${COAT_DD}" stroke-width="1.2" stroke-opacity="0.45" fill="none"/>`;
        h += `<path d="${smooth([[24, 12], [36, 11], [44, 12], [44, 18], [36, 19], [28, 21]])}" fill="${VIO}" fill-opacity="0.18"/>`;
        // dark muzzle, nostril, mouth
        h += `<path d="M44 0.6C48 2 54 3 56.6 7C58 11 56.6 14 52 15.4C53 18.4 48 20.6 44 19.8C42 14 42 6 44 0.6Z" fill="${PT}" fill-opacity="0.82"/>`;
        h += `<path d="M49 6.5C51 5.5 53.5 6.4 53.8 8.4C52.6 9.6 50.6 9.4 49.4 8.6" fill="#140F2C"/>`;
        h += `<path d="M52 15.3L46 15.8" stroke="#140F2C" stroke-width="0.9"/>`;
        h += `<path d="M45 1.2C49 2.4 53 3.6 55.8 6.8" stroke="${RIM}" stroke-width="1" stroke-opacity="0.85" fill="none"/>`;
        // face rim light, bony ridge, eye
        h += `<path d="M-1 -2.4C14 -3.2 30 -1.6 44 0.6" stroke="${RIM}" stroke-width="1.5" stroke-opacity="0.9" fill="none" stroke-linecap="round"/>`;
        h += `<path d="M22 4C30 5 38 6 44 6" stroke="${SHEEN}" stroke-width="2.2" stroke-opacity="0.45" fill="none" stroke-linecap="round"/>`;
        h += `<path d="M13.6 5.6C15.4 3.2 19.8 3.2 21.4 5.8C19.8 8.4 15.4 8.4 13.6 5.6Z" fill="#1A1430"/><circle cx="17.6" cy="5" r="0.9" fill="#FFFFFF"/>`;
        h += `<path d="M12.6 3.6C16 1.2 20.4 1.8 22.6 4.6" stroke="${COAT_DD}" stroke-width="1" stroke-opacity="0.6" fill="none"/>`;
        // a white star and strip
        h += `<path d="M10 -1.6C14 -2.4 18 -2 20 -1.4C24 -0.8 34 0 40 0.8L40 2.4C34 1.8 24 1.2 20 1.4C16 1.8 12 1.6 10 -1.6Z" fill="#F6EEE8" fill-opacity="0.9"/>`;
        // bridle
        h += `<path d="M4 -1L1 22" stroke="#4A2E36" stroke-width="2.2" fill="none"/><path d="M4 -1L1 22" stroke="#C98A5E" stroke-width="0.7" stroke-opacity="0.7"/>`;
        h += `<path d="M3 10C14 8 30 10 47 13.5" stroke="#4A2E36" stroke-width="1.9" fill="none"/>`;
        h += `<circle cx="3" cy="10.4" r="2.3" fill="#E8E2EE"/><circle cx="2.6" cy="9.9" r="0.8" fill="#FFFFFF"/>`;
        h += `<circle cx="47.5" cy="14" r="1.9" fill="none" stroke="#E8E2EE" stroke-width="1"/><path d="M47.5 15.6L45 22" stroke="#C8C2DA" stroke-width="1.3"/>`;
        // near ear, forelock
        h += `<path d="M1 -1.5C-3 -9 -4 -16 -0.5 -21C4 -16 9 -9 9 -2Z" fill="${COAT}"/><path d="M1.6 -3C0 -9 0 -14 0.8 -17.5C3 -13 5.4 -8 6.4 -3.4Z" fill="${COAT_DD}" fill-opacity="0.75"/>`;
        h += `<path d="M-0.5 -21C-4 -16 -3 -9 1 -1.5" stroke="${RIM}" stroke-width="0.9" stroke-opacity="0.75" fill="none"/>`;
        h += `<path d="M2 -2C8 -7 15 -5 19 2C15 -0.4 11 1 9 4.4C7 1 4.4 0 2 -2Z" fill="#2E2756"/>`;
        s += `<g transform="matrix(${n(AX[0] * 1000) / 1000} ${n(AX[1] * 1000) / 1000} ${n(PV[0] * 1000) / 1000} ${n(PV[1] * 1000) / 1000} ${PO[0]} ${PO[1]})">${h}</g>`;
      }
      const BIT = H(47.5, 14);

      // --- the rider
      const SKIN = '#EBA983', SKIN_D = '#B26C70', SHIRT = '#4F68D0', SHIRT_L = '#90A6F0', SHIRT_D = '#2F3C95';
      const GLOVE = '#D09A66', GLOVE_D = '#8A5848';
      const gSh2 = g('shirt'), gCh = g('chaps'), gHat = g('hat'), gVest = g('vest'), gFen = g('fen');
      defs += lgU(gSh2, -14, 0, 22, 0, [[0, SHIRT_L], [0.4, SHIRT], [1, SHIRT_D]]);
      defs += lgU(gCh, -26, -150, 14, -96, [[0, '#EDB27C'], [0.45, '#C47D52'], [1, '#814744']]);
      defs += lgU(gHat, -24, -252, 22, -232, [[0, '#E9B888'], [0.5, '#B77C59'], [1, '#6E4248']]);
      defs += lgU(gVest, -10, 0, 22, 0, [[0, '#8C5258'], [0.5, '#6A3B4A'], [1, '#43294A']]);
      defs += lgU(gFen, -20, 0, 14, 0, [[0, '#C98758'], [1, '#7E4640']]);
      // the rope
      const LC = [-6, -304], LRX = 60, LRY = 15, LROT = -7;
      const loop = (a0, a1) => {
        let d = '';
        for (let i = 0; i <= 40; i++) {
          const a = a0 + ((a1 - a0) * i) / 40;
          const x = LRX * Math.cos(a), y = LRY * Math.sin(a);
          const c = Math.cos((LROT * Math.PI) / 180), sn = Math.sin((LROT * Math.PI) / 180);
          d += (i ? 'L' : 'M') + n(LC[0] + x * c - y * sn) + ' ' + n(LC[1] + x * sn + y * c);
        }
        return d;
      };
      const ROPE = '#F8E9C8', ROPE_D = '#B98A6A';
      s += `<path d="${loop(Math.PI, Math.PI * 2)}" stroke="${ROPE_D}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += `<path d="${loop(Math.PI, Math.PI * 2)}" stroke="${ROPE}" stroke-width="1" stroke-opacity="0.7" fill="none" transform="translate(0 -0.6)"/>`;
      // motion arcs trailing the swing
      {
        const arc = (scale, a0, a1, op, dy) => `<path d="${loop(a0, a1)}" transform="translate(${n(LC[0] * (1 - scale))} ${n(LC[1] * (1 - scale) + dy)}) scale(${scale})" stroke="#FFFFFF" stroke-width="${n(1.2 / scale)}" stroke-opacity="${op}" fill="none" stroke-linecap="round"/>`;
        s += arc(1.12, 0.3, 1.3, 0.55, 3) + arc(1.22, 0.5, 1.1, 0.35, 5) + arc(1.12, Math.PI + 0.4, Math.PI + 1.2, 0.4, -2);
      }

      // far (right) arm, raised
      const fArm = [[8, -201], [16, -212], [21, -224], [19, -238], [15, -250], [13, -255]];
      const fArmW = [6.2, 5.8, 5.2, 4.6, 4, 3.4];
      s += `<path d="${limb(fArm, fArmW)}" fill="${SHIRT_D}"/>`;
      s += `<path d="M14 -214C17 -218 20 -220 22 -222M17 -232C19 -234 21 -235 22 -236" stroke="#1F2870" stroke-width="0.9" stroke-opacity="0.6" fill="none"/>`;
      s += `<path d="${smooth(limbPts(fArm, fArmW).slice(1, 6), false)}" stroke="${SHIRT_L}" stroke-width="1.2" stroke-opacity="0.55" fill="none"/>`;
      s += `<path d="M8.6 -255.4C8 -260 11 -264.6 15.6 -264C19.4 -263 20 -258.6 18 -255.6C16.6 -253.4 13 -252.6 10.8 -253.4Z" fill="${GLOVE}"/><path d="M11 -262.6C13.6 -263.6 16.6 -263 18 -261" stroke="#F4C694" stroke-width="0.8" fill="none"/>`;
      // spoke: two strands from the fist to the honda
      const hon = [LC[0] + 36, LC[1] + 12];
      s += `<path d="M14 -262L${n(hon[0])} ${n(hon[1])}M16.4 -261L${n(hon[0] + 6)} ${n(hon[1] - 2)}" stroke="${ROPE}" stroke-width="1.5" stroke-linecap="round"/>`;

      // torso: shirt under a leather vest
      const torso = [[-6, -152], [-9, -170], [-10.4, -186], [-8.6, -198], [-2, -205.5], [8, -206.5], [16, -201], [20.4, -187], [21.6, -168], [22, -152]];
      s += `<path d="${smooth(torso)}" fill="url(#${gSh2})"/>`;
      const vest = [[-3, -153], [-6, -168], [-6.6, -184], [-4, -196], [2, -203], [9, -204.6], [16, -200], [20.4, -187], [21.6, -168], [22, -153]];
      s += `<path d="${smooth(vest)}" fill="url(#${gVest})"/>`;
      s += `<path d="M-3 -153C-6 -164 -6.6 -180 -4 -196" stroke="#D99A8A" stroke-width="1" stroke-opacity="0.7" fill="none"/>`;
      s += `<path d="M5 -194C6 -182 6 -168 4 -156" stroke="#2E1C3A" stroke-width="0.9" stroke-opacity="0.5" fill="none"/>`;
      s += `<circle cx="-4.6" cy="-176" r="0.9" fill="#E8D7A8"/><circle cx="-5" cy="-166" r="0.9" fill="#E8D7A8"/>`;
      s += `<path d="M-9 -194C-10.6 -182 -10.4 -168 -7.4 -155" stroke="${SHIRT_L}" stroke-width="1.6" stroke-opacity="0.85" fill="none"/>`;
      // belt and buckle
      s += `<path d="M-7 -156.4L22.4 -154.6L22.4 -150.6L-7 -151.6Z" fill="#3E2734"/><rect x="-8.4" y="-157.6" width="5.6" height="7" rx="1.2" fill="#ECDCAE"/><rect x="-7.4" y="-156.4" width="3.6" height="4.6" rx="0.8" fill="#C9B07A"/>`;
      // neck and bandana
      s += `<path d="M-6 -206L-4 -214L5 -215L6.4 -205Z" fill="${SKIN_D}"/>`;
      s += `<path d="M-9.6 -206.6C-4 -210 4 -210 8.6 -206.4L5.6 -201C1 -203.4 -4 -203.4 -8.4 -201Z" fill="#C8434A"/>`;
      s += `<path d="M-9.6 -205.4L-15.6 -190.6L-2.6 -200.4Z" fill="#E8594F"/><path d="M-9.6 -205.4L-15.6 -190.6" stroke="#FF9E86" stroke-width="0.9" stroke-opacity="0.85"/>`;
      s += `<g fill="#FFE9DA" fill-opacity="0.9"><circle cx="-10.4" cy="-197" r="0.7"/><circle cx="-8" cy="-200.6" r="0.6"/><circle cx="-12.6" cy="-193.6" r="0.6"/><circle cx="-6" cy="-198.4" r="0.5"/><circle cx="-1" cy="-207" r="0.6"/><circle cx="4" cy="-207" r="0.6"/></g>`;
      // head in profile: brow, nose, lips, chin; ear; eye in the brim's shade
      const face = [[6.4, -214], [9.2, -221], [8.6, -229], [5, -233.4], [-4, -234.4], [-9.6, -232], [-10.8, -228.6], [-11, -226.6], [-11.8, -225.6], [-14.4, -221], [-12.4, -219.8], [-12.6, -218.4, 1], [-11.6, -217.4], [-12.2, -216.4], [-11.8, -214], [-9.8, -211.8], [-4, -212.4], [1.4, -213.6]];
      s += `<path d="${smooth(face, true, 0.85)}" fill="${SKIN}"/>`;
      s += `<path d="${smooth([[1, -233], [7, -230], [8.6, -224], [7, -217], [3, -213.4], [0, -214], [3, -219], [3.6, -226]])}" fill="${SKIN_D}" fill-opacity="0.5"/>`;
      s += `<path d="M-9.4 -212.4C-5 -212.6 -1 -213 2 -214.4" stroke="#8C5466" stroke-width="1" stroke-opacity="0.6" fill="none"/>`;
      s += `<path d="M-10 -216.6C-8 -214.6 -5 -213.6 -2 -213.8" stroke="#A86070" stroke-width="2.2" stroke-opacity="0.22" fill="none"/>`;
      s += `<path d="M1.6 -226.4C3.8 -226.4 4.6 -224 4.2 -222C3.8 -220.4 2.4 -220 1.4 -220.6" fill="${SKIN_D}"/><path d="M2.2 -224.8Q3.4 -223.4 2.4 -222" stroke="#8C5466" stroke-width="0.6" fill="none"/>`;
      s += `<path d="M-9 -227.2Q-7.4 -228.2 -5.4 -227.4" stroke="#2A1E36" stroke-width="1.1" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M-10.4 -229.4Q-7.8 -230.6 -4.6 -229.6" stroke="#5A3442" stroke-width="0.9" stroke-linecap="round" fill="none"/>`;
      s += `<path d="M-12.6 -221.6L-11 -220.6" stroke="${SKIN_D}" stroke-width="0.8" fill="none"/>`;
      s += `<path d="M-11 -226.6C-11.8 -225.6 -13.6 -222.6 -14.4 -221" stroke="#FFD6B6" stroke-width="0.9" stroke-opacity="0.9" fill="none"/>`;
      s += `<path d="M-11.8 -214C-11.6 -216 -12 -217.6 -11.6 -217.4" stroke="#FFD6B6" stroke-width="0.7" stroke-opacity="0.7" fill="none"/>`;
      s += `<path d="M7 -230C8.6 -226 8.4 -220 6.4 -215" stroke="#5A3442" stroke-width="1.6" stroke-opacity="0.35" fill="none"/>`;
      // hat: cattleman crease, brim curled up at both ends
      s += `<path d="M-9.6 -235.6C-9.6 -244 -7.4 -250.4 -2.4 -251.4C0.6 -249.4 4 -249.4 7 -251.4C11.4 -250.4 12.6 -244 11.6 -235.6Z" fill="url(#${gHat})"/>`;
      s += `<path d="M-2.4 -251.4C-1.4 -246.4 4 -246.4 7 -251.4" stroke="#6E4248" stroke-width="1" stroke-opacity="0.6" fill="none"/>`;
      s += `<path d="M2.4 -248.6L2.6 -239" stroke="#6E4248" stroke-width="0.9" stroke-opacity="0.35" fill="none"/>`;
      s += `<path d="M-9.8 -238.6H11.8V-235.4H-9.8Z" fill="#2C2552"/><path d="M-9.8 -238.6H11.8" stroke="#6F68B0" stroke-width="0.6" stroke-opacity="0.8"/>`;
      s += `<path d="M-27 -239.6C-21 -234.4 -8 -233.8 2 -234.2C12 -234.6 21 -235.2 26 -241.6C25.4 -235.4 18.4 -231.6 4 -231.4C-10.6 -231.2 -22.6 -232 -27 -239.6Z" fill="url(#${gHat})"/>`;
      s += `<path d="M-27 -239.6C-21 -234.4 -8 -233.8 2 -234.2C12 -234.6 21 -235.2 26 -241.6" stroke="#F6D2A8" stroke-width="0.9" stroke-opacity="0.9" fill="none"/>`;
      s += `<path d="M-9 -243C-8.4 -247 -6.8 -249.8 -3.2 -250.6" stroke="#F6D2A8" stroke-width="1" stroke-opacity="0.85" fill="none"/>`;
      s += `<path d="M-11 -231.2C-6 -229.4 0 -229.4 7 -230.6" stroke="${SKIN_D}" stroke-width="2" stroke-opacity="0.45" fill="none"/>`;

      // near leg: the fender behind it, shotgun chaps with fringe, boot in the stirrup
      s += `<path d="${smooth([[-2, -150, 1], [14, -150, 1], [6, -126], [-4, -100], [-6, -92, 1], [-24, -92, 1], [-20, -112], [-10, -134]])}" fill="url(#${gFen})"/>`;
      s += `<path d="M-6 -92C-4 -100 0 -112 6 -126" stroke="#F0B888" stroke-width="0.8" stroke-opacity="0.5" fill="none"/>`;
      const nLeg = [[13, -152], [2, -144], [-10, -136], [-18.4, -128], [-20, -118], [-18.6, -104], [-16.8, -93]];
      const nLegW = [9.4, 8.6, 7.6, [6.6, 7.6], [6, 6.4], 5.6, 5.4];
      s += `<path d="${limb(nLeg, nLegW)}" fill="url(#${gCh})"/>`;
      {
        const back = limbPts(nLeg, nLegW).slice(nLeg.length).reverse();
        let fr = '';
        for (let i = 0; i < 26; i++) {
          const t = i / 25;
          const idx = Math.min(back.length - 2, Math.floor(t * (back.length - 1)));
          const p = lp(back[idx], back[idx + 1], t * (back.length - 1) - idx);
          const a = nLeg[Math.min(nLeg.length - 1, idx + 1)], b2 = nLeg[idx];
          let tx = a[0] - b2[0], ty = a[1] - b2[1];
          const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
          fr += `M${n(p[0])} ${n(p[1])}l${n(ty * 4.6 + tx * 1.6)} ${n(-tx * 4.6 + ty * 1.6)}`;
        }
        s += `<path d="${fr}" stroke="#8A4C46" stroke-width="1.1" stroke-linecap="round"/>`;
        s += `<path d="${smooth(back, false)}" stroke="#6E3A40" stroke-width="1" stroke-opacity="0.6" fill="none"/>`;
        const front = limbPts(nLeg, nLegW).slice(1, nLeg.length);
        s += `<path d="${smooth(front, false)}" stroke="#FFD6AA" stroke-width="1.3" stroke-opacity="0.85" fill="none"/>`;
      }
      s += `<path d="M-14 -124C-13 -116 -13 -106 -14 -96" stroke="#7D4543" stroke-width="0.9" stroke-opacity="0.45" fill="none"/>`;
      s += `<path d="M-8 -140C-12 -136 -15 -132 -17 -128" stroke="#7D4543" stroke-width="0.9" stroke-opacity="0.4" fill="none"/>`;
      s += `<circle cx="1" cy="-145" r="1.7" fill="#ECE4F0"/><circle cx="-12" cy="-133" r="1.7" fill="#ECE4F0"/>`;
      // jeans hem, boot, stirrup, spur
      s += `<path d="M-22 -94L-11.6 -94L-11 -89L-22.6 -89Z" fill="#3F4FA8"/>`;
      s += `<path d="M-22.6 -89.4L-22 -84C-26 -83.6 -31 -82.6 -34.6 -80.2C-33.6 -78.6 -26 -78.2 -19 -78.2L-9.4 -78.2L-9 -82L-11 -89.4Z" fill="#5A3236"/>`;
      s += `<path d="M-34 -80.4C-29 -82.4 -25 -83 -22 -84" stroke="#D29470" stroke-width="0.9" stroke-opacity="0.85" fill="none"/>`;
      s += `<path d="M-13 -78.4L-9 -78.4L-9.4 -75.8L-13 -75.8Z" fill="#3A2028"/>`;
      s += `<path d="M-25.6 -88L-28.6 -76.2H-15.4L-17.4 -88" stroke="#6E4630" stroke-width="2.2" fill="none" stroke-linejoin="round"/><path d="M-28.6 -76.2H-15.4" stroke="#D29A70" stroke-width="1" stroke-opacity="0.8"/>`;
      s += `<path d="M-9.4 -81.6L-5 -82.6" stroke="#CFC8E0" stroke-width="1"/><circle cx="-3.4" cy="-82.8" r="2" fill="none" stroke="#CFC8E0" stroke-width="0.9" stroke-dasharray="0.8 0.6"/>`;

      // near (left) arm on the reins, the coils of rope in the same fist
      const nArm = [[2, -199], [-1, -188], [-4, -176], [-11, -168], [-18, -164], [-21, -163]];
      const nArmW = [6.4, 5.8, 5, 4.4, 4, 3.8];
      s += `<path d="${limb(nArm, nArmW)}" fill="url(#${gSh2})"/>`;
      s += `<path d="${smooth(limbPts(nArm, nArmW).slice(0, 6), false)}" stroke="${SHIRT_L}" stroke-width="1.3" stroke-opacity="0.85" fill="none"/>`;
      s += `<path d="M-3 -180C-1 -178 1 -177 3 -177M-6 -172C-4 -170 -2 -169 0 -169" stroke="${SHIRT_D}" stroke-width="0.8" stroke-opacity="0.6" fill="none"/>`;
      let coils = '';
      for (let i = 0; i < 4; i++) coils += `<ellipse cx="${n(-27 + i * 1.6)}" cy="${n(-146 + i * 1.2)}" rx="${n(7 + i * 0.6)}" ry="${n(15 + i * 0.6)}" transform="rotate(${-8 + i * 4} ${n(-27 + i * 1.6)} ${n(-146 + i * 1.2)})"/>`;
      s += `<g fill="none" stroke="${ROPE_D}" stroke-width="2.1">${coils}</g><g fill="none" stroke="${ROPE}" stroke-width="0.9" transform="translate(-0.4 -0.5)">${coils}</g>`;
      s += `<path d="M${n(BIT[0])} ${n(BIT[1])}C${n(BIT[0] + 22)} ${n(BIT[1] + 16)} -42 -152 -25 -163" stroke="#4A2E36" stroke-width="1.4" fill="none"/>`;
      s += `<path d="M-28.4 -166.4C-29.4 -162 -27 -158 -22 -158C-18 -158.6 -16.6 -162.6 -18.4 -166C-20.4 -168.4 -26 -168.6 -28.4 -166.4Z" fill="${GLOVE}"/><path d="M-27.6 -166C-25 -167.8 -21 -167.6 -19 -166" stroke="#F4C694" stroke-width="0.8" fill="none"/><path d="M-27 -161.4H-19.6" stroke="${GLOVE_D}" stroke-width="0.7" stroke-opacity="0.6"/>`;
      // near half of the loop, in front
      s += `<path d="${loop(0, Math.PI)}" stroke="${ROPE_D}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      s += `<path d="${loop(0.15, Math.PI - 0.2)}" stroke="${ROPE}" stroke-width="1.3" fill="none" stroke-linecap="round" transform="translate(0 -0.6)"/>`;
      s += `<circle cx="${n(hon[0] + 3)}" cy="${n(hon[1] - 1)}" r="2.3" fill="${ROPE}"/><circle cx="${n(hon[0] + 3)}" cy="${n(hon[1] - 1)}" r="2.3" fill="none" stroke="${ROPE_D}" stroke-width="0.6"/>`;

      // ground shadow thrown right by the low sun, and dust kicked up behind
      let sh = `<path d="M${HX - 260} ${HY + 4}Q${HX} ${HY - 10} ${HX + 420} ${HY - 2}Q${HX + 200} ${HY + 22} ${HX - 260} ${HY + 4}Z" fill="#7E5E9E" fill-opacity="0.32"/>`;
      parts.push({ defs, svg: sh + `<g transform="translate(${HX} ${HY}) scale(${HS})">${s}</g>` });
    }

    return k.spread(parts, { grain: 0.6 });
  },
};
