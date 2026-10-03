/* Visa pages 1–2 — "We the People".
   Left: the Constitution's first page, a quill and an inkwell. Right: a bald
   eagle soaring in front of a pale glory. Roses — the national flower — frame
   the bottom corners. Quote (live text, see js/passport-data.js): the Preamble.

   This is the reference spread: the others follow its conventions — sky +
   microtext/guilloche + glory behind one big hero per page, hazy layered land,
   flowers framing the bottom corners, everything grained as one piece. */

'use strict';

module.exports = {
  pages: [1, 2],
  svg(k) {
    const { C, n, rng } = k;
    const parts = [];

    // ---- sky, security print, glory ------------------------------------------------
    parts.push(k.sky([[0, '#E4DEF3'], [0.42, '#F3DCD6'], [0.74, '#FBE8DA'], [1, '#F6E0CD']]));
    parts.push(k.microtext('We the People', { y0: 40, y1: 900, opacity: 0.055 }));
    parts.push(k.guilloche({ y0: 120, y1: 820, lines: 22, opacity: 0.07, amp: 16, period: 700 }));

    const glory = k.id('glory');
    parts.push({
      defs: k.radial(glory, '50%', '50%', '50%', [[0, '#FFF9EE', 1], [0.5, '#FDEBD8', 0.6], [1, '#F6DCCB', 0]]),
      svg: `<circle cx="1570" cy="700" r="560" fill="url(#${glory})"/>` +
        k.sunburst(1570, 700, 170, 700, 44, '#FFFFFF', 0.2) +
        k.rosette(1570, 700, 330, { opacity: 0.09, rings: 8, lobes: 32 }),
    });

    // ---- land: far ridge, haze, rolling meadow ---------------------------------------
    const far = k.id('far'), mid = k.id('mid'), near = k.id('near');
    parts.push({
      defs: k.linear(far, 90, [[0, '#C4B4DC'], [1, '#E2D2E4']]) +
        k.linear(mid, 90, [[0, '#B9C3E3'], [1, '#D8D7EA']]) +
        k.linear(near, 90, [[0, '#C8D79A'], [0.5, '#D8DD9C'], [1, '#B9CC8E']]),
      svg: `<path d="${k.ridge({ y: 1160, amp: 24, seed: 4, peaks: [[260, 130, 420], [1240, 70, 380], [1960, 160, 380]] })}" fill="url(#${far})"/>`,
    });
    parts.push(k.haze(1060, 260, '#FBEBDD', 0.8));
    parts.push({ svg: `<path d="${k.ridge({ y: 1250, amp: 16, seed: 12, step: 50, peaks: [[520, 70, 520], [1500, 50, 600]] })}" fill="url(#${mid})" fill-opacity="0.85"/>` });
    let meadow = `<path d="${k.ridge({ y: 1350, amp: 14, seed: 8, step: 60, peaks: [[800, 70, 700], [1800, 40, 500]] })}" fill="url(#${near})"/>`;
    // Grass streaks and a scatter of tiny wildflowers, Montana-card style.
    const rg = rng(31);
    let streaks = '';
    for (let i = 0; i < 140; i++) {
      const x = rg() * k.W, y = 1330 + rg() * 240, L = 18 + rg() * 30;
      streaks += `M${n(x)} ${n(y)}q${n(4 - rg() * 8)} ${n(-L * 0.5)} ${n(6 - rg() * 12)} ${n(-L)}`;
    }
    meadow += `<path d="${streaks}" stroke="#8FAE72" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.6"/>`;
    for (let i = 0; i < 70; i++) {
      const x = 200 + rg() * (k.W - 400), y = 1360 + rg() * 200;
      meadow += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(3 + rg() * 3)}" fill="${rg() < 0.5 ? '#B79AD9' : '#F2A3B0'}" fill-opacity="0.85"/>`;
    }
    parts.push({ svg: meadow });

    // ---- left page: the Constitution ------------------------------------------------
    const parch = k.id('parch'), burn = k.id('burn');
    const preamble = [
      'of the United States, in Order to form a more',
      'perfect Union, establish Justice, insure domestic',
      'Tranquility, provide for the common defence,',
      'promote the general Welfare, and secure the',
      'Blessings of Liberty to ourselves and our',
      'Posterity, do ordain and establish this',
      'Constitution for the United States of America.',
    ];
    let doc = '';
    const sheet = 'M0 0H600V700Q600 752 556 762Q500 774 456 800L0 800Z';
    doc += `<path d="${sheet}" fill="url(#${parch})"/><path d="${sheet}" fill="url(#${burn})"/>`;
    doc += `<path d="M456 800Q500 774 556 762Q600 752 600 700Q588 764 534 780Q492 790 456 800Z" fill="#E2B386"/>`;
    doc += `<text x="40" y="150" font-family="Pinyon Script" font-size="104" fill="#26245E" fill-opacity="0.88">We the People</text>`;
    doc += `<g font-family="Pinyon Script" font-size="30" fill="#2E2A66" fill-opacity="0.72">` +
      preamble.map((t, i) => `<text x="44" y="${222 + i * 46}">${k.esc(t)}</text>`).join('') + `</g>`;
    // The rest of the page: lines of script too small to read — just texture.
    const r = rng(1787);
    let lines = '';
    for (let i = 0; i < 9; i++) {
      const y = 568 + i * 22;
      let x = 44, d = '';
      const end = 556 - (i === 8 ? 260 : r() * 40);
      while (x < end) {
        const w = 10 + r() * 34;
        d += `M${n(x)} ${n(y)}c${n(w * 0.2)} -8 ${n(w * 0.5)} 6 ${n(w * 0.7)} -2s${n(w * 0.2)} 4 ${n(w * 0.3)} 0`;
        x += w + 7 + r() * 6;
      }
      lines += `<path d="${d}" fill="none" stroke="#3A3470" stroke-width="2.4" stroke-opacity="0.38" stroke-linecap="round"/>`;
    }
    doc += lines;
    parts.push({
      defs: k.linear(parch, 60, [[0, '#FFF7E9'], [0.6, '#F8E5CB'], [1, '#EECAA3']]) +
        k.radial(burn, '50%', '45%', '75%', [[0.62, '#C9874F', 0], [1, '#B8743F', 0.42]]),
      svg: `<g transform="translate(100 310) rotate(-5)">` +
        `<path d="M18 26H618V726Q618 778 574 788Q518 800 474 826L18 826Z" fill="#6E5A9A" fill-opacity="0.2"/>` +
        doc + `</g>`,
    });

    // Inkwell and quill, standing in front of the page's lower corner.
    const glass = k.id('glass'), vane = k.id('vane');
    let barbs = '';
    for (let i = 0; i < 52; i++) {
      const t = i / 51;
      const y = -70 - t * 540;
      const wl = 74 * Math.sin(Math.PI * Math.min(1, t * 1.12)) + 6;
      const wr = 56 * Math.sin(Math.PI * Math.min(1, t * 1.08)) + 4;
      barbs += `M0 ${n(y)}Q${n(-wl * 0.6)} ${n(y + 14)} ${n(-wl)} ${n(y + 36)}M0 ${n(y)}Q${n(wr * 0.6)} ${n(y + 12)} ${n(wr)} ${n(y + 32)}`;
    }
    let quill = '';
    quill += `<path d="M0 -50C-96 -180 -94 -440 -6 -640C-42 -440 -32 -210 0 -50Z" fill="url(#${vane})"/>`;
    quill += `<path d="M0 -50C84 -170 84 -420 8 -628C36 -420 28 -200 0 -50Z" fill="url(#${vane})" fill-opacity="0.9"/>`;
    quill += `<path d="${barbs}" fill="none" stroke="#7470BE" stroke-width="2" stroke-opacity="0.42"/>`;
    quill += `<path d="M0 70L0 -640" stroke="#625AA6" stroke-width="5" stroke-linecap="round"/>`;
    quill += `<path d="M-4 70L0 118L4 70Z" fill="#26245E"/>`;
    parts.push({
      defs: k.linear(glass, 0, [[0, '#24338F'], [0.42, '#4B5FD8'], [1, '#1A2570']]) +
        k.linear(vane, 0, [[0, '#B4B0E8'], [0.45, '#F6F3FF'], [1, '#CCC8F2']]),
      svg:
        `<g transform="translate(850 1200)">` +
          `<ellipse cx="0" cy="102" rx="150" ry="24" fill="#4E4278" fill-opacity="0.28"/>` +
          `<path d="M-124 96Q-144 18 -94 -24H94Q144 18 124 96Q0 120 -124 96Z" fill="url(#${glass})"/>` +
          `<rect x="-58" y="-70" width="116" height="52" rx="12" fill="#1A2570"/>` +
          `<ellipse cx="0" cy="-70" rx="58" ry="13" fill="#0F1650"/>` +
          `<path d="M-84 -6Q-104 34 -90 76" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-opacity="0.45" stroke-linecap="round"/>` +
          `<path d="M60 4Q88 30 86 70" fill="none" stroke="#9FB0FF" stroke-width="6" stroke-opacity="0.35" stroke-linecap="round"/>` +
        `</g>` +
        `<g transform="translate(862 1122) rotate(9)">${quill}</g>`,
    });

    // ---- right page: the eagle ---------------------------------------------------------
    // A bald eagle soaring toward the Constitution, wings raised in a shallow V.
    // Each wing is drawn horizontal in its own space (shoulder at 0,0, tip at
    // +x), then mirrored/raised into place.
    const wingG = k.id('wing'), handG = k.id('hand'), body = k.id('body'), head = k.id('head'), beak = k.id('beak'), tail = k.id('tail'), cov = k.id('cov');
    function wingShape() {
      let g = '';
      // Hand: seven primaries splaying from the wrist, outermost on top.
      const prim = [
        [292, -40, -14, 196, 25], [300, -22, -5, 214, 25], [306, -4, 4, 222, 24], [310, 14, 13, 214, 23],
        [312, 32, 22, 198, 22], [310, 50, 30, 178, 21], [304, 66, 38, 156, 20],
      ];
      // Draw the innermost first so outer feathers overlap them.
      for (let i = prim.length - 1; i >= 0; i--) {
        const [bx, by, deg, L, w] = prim[i];
        const a = deg * Math.PI / 180;
        const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
        const tx = bx + ux * L, ty = by + uy * L - 10; // tips curl up a touch
        g += `<path d="M${n(bx - px * w)} ${n(by - py * w)}` +
             `C${n(bx + ux * L * 0.55 - px * w * 0.9)} ${n(by + uy * L * 0.55 - py * w * 0.9)} ${n(tx - ux * 30 - px * w * 0.45)} ${n(ty - uy * 30 - py * w * 0.45)} ${n(tx)} ${n(ty)}` +
             `C${n(tx - ux * 24 + px * w * 0.5)} ${n(ty - uy * 24 + py * w * 0.5)} ${n(bx + ux * L * 0.5 + px * w)} ${n(by + uy * L * 0.5 + py * w)} ${n(bx + px * w)} ${n(by + py * w)}Z" fill="url(#${handG})"/>`;
        g += `<path d="M${n(bx)} ${n(by)}Q${n(bx + ux * L * 0.6)} ${n(by + uy * L * 0.6 - 4)} ${n(tx - ux * 14)} ${n(ty - uy * 14)}" stroke="#9AA2F2" stroke-width="2.5" stroke-opacity="0.45" fill="none"/>`;
      }
      // Arm: leading edge to the wrist, scalloped secondaries back to the body.
      let trail = '';
      for (let i = 0; i < 9; i++) {
        const x0 = 300 - i * 34, x1 = x0 - 34;
        const y0 = 74 + i * 5, y1 = 74 + (i + 1) * 5;
        trail += `Q${n((x0 + x1) / 2)} ${n(Math.max(y0, y1) + 34)} ${n(x1)} ${n(y1)}`;
      }
      g += `<path d="M-10 -6C80 -52 200 -66 300 -48L314 72${trail}L-10 110Z" fill="url(#${wingG})"/>`;
      // Coverts: a lighter band of overlapping scallops along the leading edge.
      g += `<path d="M-6 0C90 -44 200 -58 298 -40L300 6C200 -6 100 6 -6 40Z" fill="url(#${cov})"/>`;
      for (let row = 0; row < 3; row++) {
        let d = '';
        for (let i = 0; i < 10; i++) {
          const x = 14 + i * 29 + row * 8, y = -24 + row * 26 - i * 3 + (row ? i * 1.2 : 0);
          d += `M${n(x - 16)} ${n(y)}Q${n(x)} ${n(y + 24)} ${n(x + 16)} ${n(y)}`;
        }
        g += `<path d="${d}" fill="none" stroke="#B8BEF7" stroke-width="3.5" stroke-opacity="${0.55 - row * 0.15}" stroke-linecap="round"/>`;
      }
      // Long secondary feather lines.
      let lines = '';
      for (let i = 0; i < 8; i++) lines += `M${n(272 - i * 34)} ${n(40 + i * 3)}L${n(262 - i * 34)} ${n(92 + i * 5)}`;
      g += `<path d="${lines}" stroke="#1B2160" stroke-width="3" stroke-opacity="0.35"/>`;
      return g;
    }
    const ex = 1570, ey = 690, S = 1.06;
    const wings =
      `<g transform="translate(${ex + 52} ${ey - 120}) scale(${S}) rotate(-17)">${wingShape()}</g>` +
      `<g transform="translate(${ex - 52} ${ey - 120}) scale(${-S} ${S}) rotate(-17)">${wingShape()}</g>`;
    let eagle = wings;
    // Tail fan.
    eagle += `<path d="M${ex - 56} ${ey + 120}L${ex - 118} ${ey + 300}Q${ex} ${ey + 350} ${ex + 118} ${ey + 300}L${ex + 56} ${ey + 120}Z" fill="url(#${tail})"/>`;
    eagle += `<path d="M${ex - 76} ${ey + 300}L${ex - 28} ${ey + 150}M${ex - 26} ${ey + 322}L${ex - 9} ${ey + 152}M${ex + 26} ${ey + 322}L${ex + 9} ${ey + 152}M${ex + 76} ${ey + 300}L${ex + 28} ${ey + 150}" stroke="#ADA8E2" stroke-width="3.5" stroke-opacity="0.7"/>`;
    // Body.
    eagle += `<path d="M${ex - 66} ${ey - 150}C${ex - 120} ${ey - 50} ${ex - 104} ${ey + 110} ${ex - 40} ${ey + 176}Q${ex} ${ey + 196} ${ex + 40} ${ey + 176}C${ex + 104} ${ey + 110} ${ex + 120} ${ey - 50} ${ex + 66} ${ey - 150}Z" fill="url(#${body})"/>`;
    let breast = '';
    for (let i = 0; i < 7; i++) {
      const y = ey - 70 + i * 34;
      breast += `M${ex - 64 + i * 5} ${y}Q${ex - 32} ${y + 20} ${ex} ${y + 4}Q${ex + 32} ${y + 20} ${ex + 64 - i * 5} ${y}`;
    }
    eagle += `<path d="${breast}" fill="none" stroke="#8E96EE" stroke-width="3.5" stroke-opacity="0.4" stroke-linecap="round"/>`;
    // Legs and talons.
    eagle += `<path d="M${ex - 44} ${ey + 150}q-8 40 -36 62M${ex + 44} ${ey + 150}q8 40 36 62" stroke="${C.gold}" stroke-width="17" stroke-linecap="round" fill="none"/>`;
    eagle += `<path d="M${ex - 80} ${ey + 212}l-24 10M${ex - 80} ${ey + 212}l-12 25M${ex - 80} ${ey + 212}l6 25M${ex + 80} ${ey + 212}l24 10M${ex + 80} ${ey + 212}l12 25M${ex + 80} ${ey + 212}l-6 25" stroke="#26245E" stroke-width="6.5" stroke-linecap="round"/>`;
    // White head and neck ruff, turned toward the Constitution; hooked beak.
    eagle += `<path d="M${ex - 70} ${ey - 128}C${ex - 98} ${ey - 196} ${ex - 74} ${ey - 278} ${ex - 8} ${ey - 292}C${ex + 54} ${ey - 302} ${ex + 96} ${ey - 252} ${ex + 86} ${ey - 186}C${ex + 82} ${ey - 150} ${ex + 80} ${ey - 136} ${ex + 72} ${ey - 124}` +
      `L${ex + 52} ${ey - 110}L${ex + 30} ${ey - 126}L${ex + 8} ${ey - 106}L${ex - 16} ${ey - 124}L${ex - 40} ${ey - 104}L${ex - 54} ${ey - 126}Z" fill="url(#${head})"/>`;
    eagle += `<path d="M${ex - 54} ${ey - 254}C${ex - 112} ${ey - 262} ${ex - 158} ${ey - 234} ${ex - 168} ${ey - 194}C${ex - 146} ${ey - 212} ${ex - 122} ${ey - 208} ${ex - 116} ${ey - 194}C${ex - 104} ${ey - 184} ${ex - 72} ${ey - 194} ${ex - 48} ${ey - 204}Z" fill="url(#${beak})"/>`;
    eagle += `<path d="M${ex - 116} ${ey - 194}C${ex - 94} ${ey - 208} ${ex - 72} ${ey - 212} ${ex - 48} ${ey - 208}" stroke="#B47318" stroke-width="3" fill="none" stroke-opacity="0.75"/>`;
    eagle += `<path d="M${ex - 50} ${ey - 222}l-14 -4" stroke="#B47318" stroke-width="3" stroke-linecap="round" stroke-opacity="0.6"/>`;
    eagle += `<circle cx="${ex - 30}" cy="${ey - 238}" r="11" fill="#26245E"/><circle cx="${ex - 33}" cy="${ey - 241}" r="3.5" fill="#FFFFFF"/>`;
    eagle += `<path d="M${ex - 56} ${ey - 252}Q${ex - 32} ${ey - 262} ${ex - 12} ${ey - 250}" stroke="#26245E" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
    eagle += `<path d="M${ex + 20} ${ey - 280}C${ex + 60} ${ey - 270} ${ex + 80} ${ey - 230} ${ex + 76} ${ey - 190}" stroke="#C3BFEC" stroke-width="10" fill="none" stroke-opacity="0.6" stroke-linecap="round"/>`;
    parts.push({
      defs:
        k.linear(wingG, 90, [[0, '#4650C0'], [0.45, '#333A9C'], [1, '#222868']]) +
        k.linear(handG, 0, [[0, '#2F3690'], [1, '#202560']]) +
        k.linear(cov, 90, [[0, '#7D86E6'], [1, '#4A53BE', 0]]) +
        k.linear(body, 90, [[0, '#3A41A6'], [0.6, '#2C3288'], [1, '#22286A']]) +
        k.linear(head, 120, [[0, '#FFFFFF'], [0.6, '#F4F1FF'], [1, '#C8C4EE']]) +
        k.linear(beak, 90, [[0, '#FFDB78'], [1, '#E8A63A']]) +
        k.linear(tail, 90, [[0, '#E2DFF9'], [1, '#FFFFFF']]),
      svg: `<g>${eagle}</g>`,
    });

    parts.push({ svg: k.bird(1180, 330, 18, '#6E67B0') + k.bird(1238, 300, 13, '#6E67B0') + k.bird(1990, 360, 15, '#6E67B0') });

    // ---- foreground roses, framing the bottom corners ---------------------------------
    function rose(x, y, rad, colour, deep, seed) {
      const rr = rng(seed);
      const g = k.id('rose'), cup = k.id('cup');
      const defs = k.radial(g, '50%', '30%', '80%', [[0, k.lighten(colour, 0.4)], [0.55, colour], [1, deep]]) +
        k.radial(cup, '50%', '60%', '60%', [[0, deep], [1, colour]]);
      let s = '';
      // Outer petals: broad and cupped, then tighter rings, then the bud.
      for (let ring = 0; ring < 3; ring++) {
        const count = [6, 5, 4][ring];
        const R = rad * [1, 0.74, 0.5][ring];
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + ring * 0.55 + rr() * 0.25;
          const px = x + Math.cos(a) * R * 0.42, py = y + Math.sin(a) * R * 0.34;
          s += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(R * 0.62)}" ry="${n(R * 0.48)}" transform="rotate(${n(a * 57.3 + 90)} ${n(px)} ${n(py)})" fill="url(#${g})"/>`;
        }
      }
      s += `<circle cx="${n(x)}" cy="${n(y - rad * 0.04)}" r="${n(rad * 0.26)}" fill="url(#${cup})"/>`;
      s += `<path d="M${n(x - rad * 0.2)} ${n(y)}C${n(x - rad * 0.2)} ${n(y - rad * 0.3)} ${n(x + rad * 0.24)} ${n(y - rad * 0.3)} ${n(x + rad * 0.2)} ${n(y + rad * 0.04)}C${n(x + rad * 0.1)} ${n(y + rad * 0.2)} ${n(x - rad * 0.12)} ${n(y + rad * 0.15)} ${n(x - rad * 0.05)} ${n(y - rad * 0.06)}" fill="none" stroke="${deep}" stroke-width="${n(rad * 0.05)}" stroke-linecap="round"/>`;
      return { defs, svg: s };
    }
    function leaf(x, y, L, ang, fill, vein) {
      const t = `translate(${n(x)} ${n(y)}) rotate(${n(ang)})`;
      let serr = 'M0 0';
      for (let i = 1; i <= 6; i++) serr += `L${n(L * i / 6.2)} ${n(-L * 0.27 * Math.sin(Math.PI * i / 6.5) - (i % 2) * 3)}`;
      serr += `L${n(L)} 0`;
      for (let i = 6; i >= 1; i--) serr += `L${n(L * i / 6.2)} ${n(L * 0.27 * Math.sin(Math.PI * i / 6.5) + (i % 2) * 3)}`;
      return `<path transform="${t}" d="${serr}Z" fill="${fill}"/><path transform="${t}" d="M0 0L${n(L * 0.95)} 0" stroke="${vein}" stroke-width="2.5" stroke-opacity="0.5"/>`;
    }
    function bush(corner, seed) {
      const rr = rng(seed);
      const left = corner === 'bl';
      const X = (x) => (left ? x : k.W - x);
      let defs = '', back = '', blooms = '';
      // Stems and leaves first.
      for (let i = 0; i < 26; i++) {
        const x = -30 + rr() * 520, y = k.H + 20 - rr() * 420 * Math.max(0.15, 1 - x / 560);
        back += leaf(X(x), y, 80 + rr() * 60, (left ? -40 : 220) + (rr() - 0.5) * 150, rr() < 0.5 ? '#2F6E5E' : '#4E8C6E', '#16443A');
      }
      const spots = [[150, 1400, 112, 0], [360, 1500, 88, 1], [40, 1250, 84, 1], [270, 1300, 64, 0], [500, 1560, 70, 0]];
      spots.forEach((p, i) => {
        const ro = rose(X(p[0]), p[1], p[2], p[3] ? '#F38E95' : '#EE7584', '#A93556', seed + i);
        defs += ro.defs;
        blooms += ro.svg;
      });
      // Buds.
      for (let i = 0; i < 4; i++) {
        const x = X(80 + rr() * 380), y = 1180 + rr() * 160;
        blooms += `<path d="M${n(x)} ${n(y)}q-14 -22 0 -46q14 24 0 46Z" fill="#E86A7E"/><path d="M${n(x)} ${n(y)}q-16 -8 -22 -26M${n(x)} ${n(y)}q16 -8 22 -26" stroke="#2F6E5E" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      }
      return { defs, svg: back + blooms };
    }
    parts.push(bush('bl', 41));
    parts.push(bush('br', 77));

    return k.spread(parts, { grain: 0.62 });
  },
};
