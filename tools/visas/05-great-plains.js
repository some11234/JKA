/* Visa pages 9–10 — the Great Plains.
   Left: the open prairie rolling away under a huge evening sky — a creek
   winding toward the viewer between cottonwoods, a distant bison herd grazing
   on the swells, and a small bald eagle soaring. Right: one big American bison
   bull standing in the tall grass, three-quarter view facing left: the
   shaggy shoulder hump and cape, forehead wool, short curved horns and beard,
   lit from behind by a low sun that catches the tips of his coat. Blazing star
   (purple spikes) and prairie coneflowers frame the bottom corners.
   Quote (live text, see js/passport-data.js): Martin Luther King Jr., "We have
   a great dream. It started way back in 1776...". */

'use strict';

module.exports = {
  pages: [9, 10],
  svg(k) {
    const { n, rng } = k;
    const parts = [];

    // ---- helpers ------------------------------------------------------------------
    // A scalloped blob (wool, canopies): bumps around an ellipse.
    function lumpy(cx, cy, rx, ry, lobes, depth, seed, rot) {
      const r = rng(seed);
      const pts = [];
      for (let i = 0; i < lobes; i++) {
        const a = (i / lobes) * Math.PI * 2 + (rot || 0);
        const j = 1 + (r() - 0.5) * 0.16;
        pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
      }
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      for (let i = 0; i < lobes; i++) {
        const p = pts[i], q = pts[(i + 1) % lobes];
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        const ox = (mx - cx) * depth, oy = (my - cy) * depth;
        d += `Q${n(mx + ox)} ${n(my + oy)} ${n(q[0])} ${n(q[1])}`;
      }
      return d + 'Z';
    }

    // Short hair strokes scattered over a box; colour chosen per stroke by a
    // function of (x, y, random). Strokes of one colour share one path.
    function tufts(o) {
      const r = rng(o.seed);
      const groups = {};
      for (let i = 0; i < o.count; i++) {
        const x = o.x0 + r() * (o.x1 - o.x0), y = o.y0 + r() * (o.y1 - o.y0);
        const pick = o.colour(x, y, r());
        if (!pick) continue;
        const L = o.len[0] + r() * (o.len[1] - o.len[0]);
        const a = (o.angle + (r() - 0.5) * o.spreadA) * Math.PI / 180;
        const dx = Math.cos(a) * L, dy = Math.sin(a) * L;
        const bend = (r() - 0.5) * L * 0.9;
        const key = pick.join('|');
        groups[key] = (groups[key] || '') +
          `M${n(x)} ${n(y)}q${n(dx * 0.5 - dy * bend / L)} ${n(dy * 0.5 + dx * bend / L)} ${n(dx)} ${n(dy)}`;
      }
      return Object.keys(groups).map((key) => {
        const [c, w, op] = key.split('|');
        return `<path d="${groups[key]}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round"/>`;
      }).join('');
    }

    // ---- sky, security print, the low sun --------------------------------------------
    parts.push(k.sky([[0, '#D8D2F0'], [0.26, '#E4D8F0'], [0.48, '#F2DCDF'], [0.64, '#FADFD0'], [1, '#F8D8BD']]));
    parts.push(k.microtext('Great Plains', { y0: 40, y1: 940, opacity: 0.055 }));
    parts.push(k.guilloche({ y0: 120, y1: 900, lines: 22, opacity: 0.065, amp: 18, period: 760, phase: 2.1 }));

    const SX = 1600, SY = 760;           // the sun, behind the bison's hump
    const glory = k.id('glory'), disc = k.id('disc');
    parts.push({
      defs: k.radial(glory, '50%', '50%', '50%', [[0, '#FFF7E8', 1], [0.35, '#FDE9D2', 0.75], [1, '#F7D9C6', 0]]) +
        k.radial(disc, '50%', '50%', '50%', [[0, '#FFFDF6'], [0.8, '#FFF3DE'], [1, '#FCE3C4']]),
      svg: `<circle cx="${SX}" cy="${SY}" r="620" fill="url(#${glory})"/>` +
        k.sunburst(SX, SY, 220, 760, 52, '#FFFFFF', 0.2) +
        k.rosette(SX, SY, 360, { opacity: 0.085, rings: 8, lobes: 30 }) +
        `<circle cx="${SX}" cy="${SY}" r="200" fill="url(#${disc})" fill-opacity="0.9"/>`,
    });

    // Long evening clouds, mostly over the open left-hand sky.
    {
      let s = '';
      s += k.cloud(260, 760, 46, '#FFF6EE', 0.55) + k.cloud(430, 790, 34, '#FFF3EA', 0.5);
      s += k.cloud(820, 640, 40, '#FFF6EE', 0.45) + k.cloud(1960, 560, 38, '#FFF6EE', 0.4);
      // Thin stratus streaks low over the horizon.
      const streaks = [[60, 900, 520, 10], [380, 930, 380, 7], [700, 880, 300, 8], [1700, 905, 420, 8], [1230, 940, 260, 6]];
      for (const [x, y, L, h] of streaks) {
        s += `<rect x="${x}" y="${y}" width="${L}" height="${h}" rx="${h / 2}" fill="#FFF4EA" fill-opacity="0.6"/>`;
      }
      parts.push({ svg: s });
    }

    // ---- the land -------------------------------------------------------------------------
    // Far buttes on the horizon, flat-topped, violet with haze.
    {
      const bg = k.id('butte');
      function butte(x, w, h, y) {
        const t = w * 0.18;
        return `M${x} ${y}L${x + t} ${y - h * 0.8}L${x + t * 1.5} ${y - h}L${x + w - t * 1.4} ${y - h}L${x + w - t * 0.7} ${y - h * 0.72}L${x + w} ${y}Z`;
      }
      const y = 1004;
      let d = butte(60, 260, 70, y) + butte(270, 140, 46, y) + butte(1820, 300, 84, y) + butte(1660, 150, 40, y) + butte(760, 120, 30, y);
      parts.push({
        defs: k.linear(bg, 90, [[0, '#B7A6D6'], [1, '#D9C8E2']]),
        svg: `<path d="${d}" fill="url(#${bg})" fill-opacity="0.85"/>` +
          `<path d="${k.ridge({ y: 1000, amp: 6, seed: 3, step: 60, peaks: [[500, 14, 400], [1400, 18, 500]] })}" fill="#C9BCDD"/>`,
      });
    }
    parts.push(k.haze(950, 120, '#FBE7D8', 0.75));

    // Rolling swells, back to front. Each is drawn twice: violet first, then the
    // grass colour shifted left — so the slopes facing away from the light keep
    // a violet shadow.
    function swell(o) {
      const g = k.id('swell');
      const d = k.ridge(o.ridge);
      const lit = k.ridge(Object.assign({}, o.ridge, { x0: o.ridge.x0 - o.dx, x1: (o.ridge.x1 || k.W + 20) - o.dx }));
      return {
        defs: k.linear(g, 90, o.stops),
        svg: `<path d="${d}" fill="${o.shadow}"/>` +
          `<g transform="translate(${-o.dx} ${o.dy})"><path d="${d}" fill="url(#${g})"/></g>`,
      };
    }
    parts.push(swell({
      ridge: { y: 1050, amp: 8, seed: 21, step: 40, peaks: [[160, 26, 260], [620, 18, 300], [1260, 30, 340], [1880, 40, 320]] },
      dx: 40, dy: 4, shadow: '#B9A9D3',
      stops: [[0, '#D9D2A6'], [1, '#D2D29C']],
    }));
    parts.push(swell({
      ridge: { y: 1120, amp: 8, seed: 34, step: 40, peaks: [[340, 30, 320], [900, 24, 260], [1500, 50, 420], [2000, 30, 300]] },
      dx: 50, dy: 6, shadow: '#AC9BCB',
      stops: [[0, '#D7D69A'], [1, '#CBCF8E']],
    }));

    // Cottonwoods along the creek, far off.
    function cottonwood(x, y, s, seed) {
      const r = rng(seed);
      let t = `<path d="M${n(x - s * 0.05)} ${n(y)}L${n(x - s * 0.03)} ${n(y - s * 0.5)}L${n(x + s * 0.03)} ${n(y - s * 0.5)}L${n(x + s * 0.06)} ${n(y)}Z" fill="#6E5A7E"/>`;
      t += `<path d="${lumpy(x, y - s * 0.75, s * 0.48, s * 0.4, 11, 0.12, seed)}" fill="#7E9C7E"/>`;
      t += `<path d="${lumpy(x + s * 0.12, y - s * 0.66, s * 0.36, s * 0.28, 9, 0.12, seed + 1)}" fill="#8C80B4" fill-opacity="0.6"/>`;
      t += `<path d="${lumpy(x - s * 0.14, y - s * 0.86, s * 0.26, s * 0.2, 8, 0.14, seed + 2)}" fill="#B4C99A" fill-opacity="${n(0.7 + r() * 0.2)}"/>`;
      return t;
    }
    parts.push({
      svg: cottonwood(470, 1112, 74, 3) + cottonwood(530, 1118, 60, 8) + cottonwood(668, 1080, 46, 12) +
        cottonwood(708, 1084, 38, 15) + cottonwood(395, 1150, 96, 19),
    });

    // The distant herd: tiny bison silhouettes grazing on the swells.
    function minibison(x, y, s, flip, colour, grazing) {
      // facing left, 100 × 60 box, feet at y = 60
      const head = grazing
        ? 'M26 26C18 30 10 40 6 52L4 60L14 60L18 50L26 46'
        : 'M24 24C14 22 6 30 6 40L8 48L16 48L22 42';
      const d = head +
        'L26 46L30 60L36 60L38 48L58 50L66 48L68 60L74 60L76 46C84 46 92 46 96 40C100 34 100 24 94 18C84 12 70 10 58 8C50 2 40 0 34 4C28 8 26 16 24 24Z';
      return `<path transform="translate(${n(x)} ${n(y - 60 * s)}) scale(${flip ? -s : s} ${s})${flip ? ' translate(-100 0)' : ''}" d="${d}" fill="${colour}"/>`;
    }
    {
      const herd = [
        [120, 1078, 0.42, 0, 1], [180, 1084, 0.46, 0, 0], [236, 1076, 0.38, 1, 1], [290, 1090, 0.5, 0, 1], [340, 1080, 0.4, 0, 0],
        [214, 1100, 0.52, 1, 1], [80, 1098, 0.5, 0, 1], [380, 1094, 0.44, 1, 1],
        [760, 1052, 0.3, 0, 1], [800, 1056, 0.32, 1, 0], [842, 1050, 0.28, 0, 1], [880, 1058, 0.3, 0, 1], [705, 1058, 0.28, 0, 0],
      ];
      let s = '';
      for (const [x, y, sc, f, g] of herd) s += minibison(x, y, sc, f, '#5E4E86', g);
      // a little lighter dust of grass in front of them
      parts.push({ svg: `<g fill-opacity="0.92">${s}</g>` });
    }

    // Near meadow: low on the left, rising to a broad rise for the bison.
    parts.push(swell({
      ridge: { y: 1300, amp: 10, seed: 44, step: 40, peaks: [[120, 40, 300], [1560, 120, 700], [2060, 70, 300]] },
      dx: 70, dy: 8, shadow: '#A897C6',
      stops: [[0, '#D4D38F'], [0.5, '#C9CD84'], [1, '#B9C27A']],
    }));

    // Grass streaks over the near meadow.
    {
      const rg = rng(57);
      let a = '', b = '';
      for (let i = 0; i < 260; i++) {
        const x = rg() * k.W, y = 1240 + rg() * 330, L = 14 + rg() * 30;
        const seg = `M${n(x)} ${n(y)}q${n(4 - rg() * 8)} ${n(-L * 0.5)} ${n(6 - rg() * 12)} ${n(-L)}`;
        if (rg() < 0.5) a += seg; else b += seg;
      }
      parts.push({
        svg: `<path d="${a}" stroke="#9EAA62" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.55"/>` +
          `<path d="${b}" stroke="#9C8BC4" stroke-width="3" stroke-linecap="round" fill="none" stroke-opacity="0.45"/>`,
      });
    }

    // ---- the creek -------------------------------------------------------------------------
    {
      const cx = (t) => 610 + 200 * t * Math.sin(t * 7.5 + 1.92);
      const cy = (t) => 1052 + (k.H + 30 - 1052) * Math.pow(t, 1.55);
      const cw = (t) => 3 + 190 * t * t;
      const L = [], R = [], B = [];
      const N = 80;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        L.push([cx(t) - cw(t) / 2, cy(t)]);
        R.push([cx(t) + cw(t) / 2, cy(t)]);
        B.push([cx(t) + cw(t) / 2 + 4 + t * 16, cy(t) + 2 + t * 12]);
      }
      const poly = (a, b) => 'M' + a.map((p) => `${n(p[0])} ${n(p[1])}`).join('L') + 'L' + b.slice().reverse().map((p) => `${n(p[0])} ${n(p[1])}`).join('L') + 'Z';
      const Lb = L.map((p, i) => [p[0] - 4 - (i / N) * 14, p[1] + 2]);
      const water = k.id('water'), wclip = k.id('wclip');
      let s = '';
      // banks: a darker lip of mud and grass shadow
      s += `<path d="${poly(Lb, B)}" fill="#8D7AAE" fill-opacity="0.8"/>`;
      s += `<path d="${poly(L, R)}" fill="url(#${water})"/>`;
      // sky reflections: soft light streaks across the water
      const rr = rng(71);
      let streak = '';
      for (let i = 6; i < N; i += 2) {
        const t = i / N;
        if (rr() < 0.35) continue;
        const w = cw(t) * (0.3 + rr() * 0.4);
        const x = cx(t) - cw(t) / 2 + rr() * (cw(t) - w);
        streak += `M${n(x)} ${n(cy(t))}h${n(w)}`;
      }
      s += `<g clip-path="url(#${wclip})"><path d="${streak}" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.55" stroke-linecap="round"/>` +
        `<path d="${poly(L.map((p) => [p[0], p[1] - 2]), L.map((p, i) => [p[0] + 6 + (i / N) * 18, p[1]]))}" fill="#7D6CA8" fill-opacity="0.35"/></g>`;
      parts.push({
        defs: k.linear(water, 90, [[0, '#E8DDF2'], [0.5, '#D8D2F0'], [1, '#B8B4E6']]) +
          `<clipPath id="${wclip}"><path d="${poly(L, R)}"/></clipPath>`,
        svg: s,
      });
    }

    // ---- the eagle, small and high -------------------------------------------------------
    {
      const ex = 470, ey = 520, S = 0.62;
      const wing = (sgn) => `M0 -6C${sgn * 40} -26 ${sgn * 90} -34 ${sgn * 130} -30` +
        `L${sgn * 168} -40L${sgn * 162} -30L${sgn * 182} -32L${sgn * 170} -20L${sgn * 188} -18L${sgn * 168} -8L${sgn * 180} 0L${sgn * 150} 2` +
        `C${sgn * 110} 10 ${sgn * 60} 16 0 14Z`;
      const ew = k.id('ewing');
      let e = '';
      e += `<path d="${wing(1)}" fill="url(#${ew})"/><path d="${wing(-1)}" fill="url(#${ew})"/>`;
      e += `<path d="M-14 -8C-18 10 -14 26 -6 34L6 34C14 26 18 10 14 -8Z" fill="#2B2C6E"/>`;
      e += `<path d="M-8 32L-16 58L0 64L16 58L8 32Z" fill="#FBF8FF"/>`;
      e += `<path d="M-10 -6C-12 -22 -4 -32 4 -32C12 -32 16 -22 12 -6Z" fill="#FFFFFF"/>`;
      e += `<path d="M-2 -32l4 -10l4 10Z" fill="${k.C.gold}"/>`;
      e += `<path d="M-120 -24C-80 -30 -40 -22 -14 -10M120 -24C80 -30 40 -22 14 -10" stroke="#6F74CC" stroke-width="4" fill="none" stroke-opacity="0.6"/>`;
      parts.push({
        defs: k.linear(ew, 90, [[0, '#3D429E'], [1, '#262A6A']]),
        svg: `<g transform="translate(${ex} ${ey}) rotate(-8) scale(${S})">${e}</g>` +
          k.bird(860, 420, 12, '#6E67B0') + k.bird(900, 446, 9, '#6E67B0'),
      });
    }

    // ---- the bison -----------------------------------------------------------------------------
    // Drawn in its own space: muzzle near x = 0, rump near x = 800, hump top
    // near y = 0, hooves near y = 820. Facing left, turned a little toward us.
    {
      const BX = 1180, BY = 650, S = 0.94;
      const id = (p) => k.id(p);
      const gBody = id('bbody'), gCape = id('bcape'), gLeg = id('bleg'), gFar = id('bfar'), gHead = id('bhead'),
        gWool = id('bwool'), gHorn = id('bhorn'), gMuz = id('bmuz'), gThigh = id('bthigh'), gRim = id('brim'),
        cCape = id('ccape'), cBody = id('cbody'), cHead = id('chead'), cWool = id('cwool'), blur = id('bblur');

      const body = 'M360 250C470 214 610 226 702 266C772 298 808 356 806 444C804 520 790 574 772 612L700 626C626 646 520 652 420 652L340 640Z';
      const thigh = 'M604 404C676 414 742 468 750 552C754 600 738 644 720 684C708 722 702 762 708 800L664 806C660 768 660 726 668 686C636 646 612 602 604 552C598 500 596 444 604 404Z';
      // The cape: hump, shoulder, neck, chest — shaggy rear border.
      const cape = 'M120 270C150 170 236 50 344 18C400 4 446 28 478 84' +
        'L494 140L474 182L504 230L480 270L512 322L486 362L516 414L490 456L518 506L492 548L514 600L488 640' +
        'L470 664L446 652L428 676L404 660L382 684L360 664L336 690L312 670L290 692L264 670L238 684L214 660' +
        'C196 630 186 590 186 540C186 480 160 410 120 270Z';
      const farFront = 'M332 600C326 650 326 700 338 750L346 790C344 800 346 808 352 812L392 812C396 800 394 790 392 780L398 740C410 700 418 650 414 600Z';
      const farHind = 'M698 560C716 620 732 680 730 760L734 790L770 792L768 760C772 690 768 620 762 560Z';
      const nearFront = 'M196 600C184 650 188 702 200 742L212 730L224 752L236 732L250 756L262 734L276 752L290 730L300 742C312 700 314 650 304 600Z';
      const nearShin = 'M216 728C222 770 222 800 218 826L270 826C266 800 268 770 278 728Z';
      const head = 'M148 316C178 392 182 470 166 530C156 570 134 602 104 616C78 628 46 626 24 608C4 592 -2 560 6 532C20 466 50 398 82 330Z';
      const wool = lumpy(126, 314, 104, 92, 15, 0.2, 77, 0.2);
      const beard = 'M100 606C104 650 116 700 138 748L150 726L162 764L174 730L190 758L194 718L212 734C218 690 220 650 214 598Z';
      const hornNear = 'M176 300C214 302 246 270 252 226C255 202 248 182 234 170C240 192 238 216 226 240C214 262 194 272 170 274Z';
      const hornFar = 'M64 296C32 290 10 258 14 218C17 196 28 182 40 176C34 198 34 224 46 244C54 258 64 264 76 266Z';

      let b = '';
      // Ground shadow.
      b += `<ellipse cx="470" cy="812" rx="380" ry="34" fill="#4C3C78" fill-opacity="0.32"/>`;
      // Far legs.
      b += `<path d="${farHind}" fill="url(#${gFar})"/><path d="${farFront}" fill="url(#${gFar})"/>`;
      b += `<path d="M346 794h50v18h-50z" fill="#1A1636"/><path d="M734 776h36v16h-36z" fill="#1A1636"/>`;
      // Body and rump.
      b += `<path d="${body}" fill="url(#${gBody})"/>`;
      b += `<g clip-path="url(#${cBody})">` +
        // belly shadow
        `<ellipse cx="560" cy="660" rx="280" ry="90" fill="#1B1638" fill-opacity="0.55"/>` +
        // rim light along the back
        `<path d="M470 228C580 220 680 246 750 296C790 330 806 380 806 430" fill="none" stroke="#F6C08E" stroke-width="22" stroke-opacity="0.55" filter="url(#${blur})"/>` +
        tufts({ seed: 5, count: 260, x0: 460, x1: 810, y0: 230, y1: 650, len: [10, 20], angle: 100, spreadA: 50,
          colour: (x, y, r) => (y < 330 && r < 0.6 ? ['#C98A6A', 3, 0.55] : r < 0.5 ? ['#2A2048', 3, 0.5] : ['#7A5A8E', 2.5, 0.35]) }) +
        `</g>`;
      // Tail.
      b += `<path d="M802 392C818 440 822 500 814 560" fill="none" stroke="#2A2148" stroke-width="10" stroke-linecap="round"/>`;
      b += `<path d="M814 548C800 570 802 604 812 624C820 604 832 576 822 548Z" fill="#2A2148"/>`;
      // Near hind leg.
      b += `<path d="${thigh}" fill="url(#${gThigh})"/>`;
      b += `<path d="M612 420C676 432 728 482 738 552" fill="none" stroke="#E9A47C" stroke-width="7" stroke-opacity="0.45" stroke-linecap="round"/>`;
      b += `<path d="M662 790h48v18h-48z" fill="#1A1636"/>`;
      // Front legs.
      b += `<path d="${nearShin}" fill="url(#${gLeg})"/><path d="M214 812h58v18h-58z" fill="#1A1636"/>`;
      b += `<path d="${nearFront}" fill="url(#${gCape})"/>`;
      // The cape.
      b += `<path d="${cape}" fill="url(#${gCape})"/>`;
      b += `<g clip-path="url(#${cCape})">` +
        `<path d="M110 300C150 180 240 60 344 30C400 16 446 40 478 96" fill="none" stroke="url(#${gRim})" stroke-width="40" filter="url(#${blur})"/>` +
        `<ellipse cx="350" cy="640" rx="200" ry="70" fill="#1B1638" fill-opacity="0.45"/>` +
        tufts({ seed: 9, count: 1500, x0: 110, x1: 520, y0: 10, y1: 700, len: [14, 30], angle: 110, spreadA: 70,
          colour: (x, y, r) => {
            const top = 30 + Math.abs(x - 340) * 0.9; // roughly the cape's top edge
            const d = y - top;
            if (d < 60) return r < 0.5 ? ['#F6C38E', 4, 0.8] : r < 0.8 ? ['#E9A46E', 4, 0.75] : ['#FFE2B8', 3, 0.7];
            if (d < 170) return r < 0.4 ? ['#C07A58', 4, 0.6] : r < 0.75 ? ['#8A5048', 4, 0.6] : ['#E9A46E', 3, 0.5];
            if (d < 330) return r < 0.45 ? ['#6A3C48', 4, 0.6] : r < 0.8 ? ['#3E2848', 4, 0.6] : ['#8A5048', 3, 0.5];
            return r < 0.55 ? ['#2A1F45', 4, 0.6] : r < 0.85 ? ['#4A3260', 3.5, 0.55] : ['#7468B4', 3, 0.45];
          } }) +
        `</g>`;
      // Beard (behind the head, in front of the chest).
      b += `<path d="${beard}" fill="#2C1F40"/>`;
      b += tufts({ seed: 13, count: 60, x0: 110, x1: 205, y0: 610, y1: 730, len: [18, 30], angle: 95, spreadA: 20,
        colour: (x, y, r) => (r < 0.5 ? ['#5A3A56', 3, 0.7] : ['#1C1430', 3, 0.6]) });
      // Horns (bases tucked under the wool).
      b += `<path d="${hornFar}" fill="url(#${gHorn})"/><path d="M38 186C30 210 34 236 48 252" fill="none" stroke="#B9C2FF" stroke-width="4" stroke-opacity="0.55" stroke-linecap="round"/>`;
      b += `<path d="${hornNear}" fill="url(#${gHorn})"/><path d="M236 184C244 210 238 238 220 256" fill="none" stroke="#C9D0FF" stroke-width="5" stroke-opacity="0.6" stroke-linecap="round"/>`;
      // Face.
      b += `<path d="${head}" fill="url(#${gHead})"/>`;
      b += `<g clip-path="url(#${cHead})">` +
        // a cooler, violet light on the side of the face toward us
        `<path d="M150 330C170 400 172 470 160 530" fill="none" stroke="#7E72C2" stroke-width="26" stroke-opacity="0.45" filter="url(#${blur})"/>` +
        `<path d="M8 530C2 556 6 590 26 606C46 622 78 624 102 614" fill="none" stroke="#14102A" stroke-width="40" stroke-opacity="0.35" filter="url(#${blur})"/>` +
        tufts({ seed: 17, count: 220, x0: 10, x1: 180, y0: 330, y1: 560, len: [8, 16], angle: 100, spreadA: 50,
          colour: (x, y, r) => (r < 0.5 ? ['#2A1E42', 3, 0.5] : r < 0.8 ? ['#6A4660', 2.5, 0.45] : ['#8C7FD0', 2.5, 0.35]) }) +
        `</g>`;
      // Muzzle, nostril, mouth.
      b += `<path d="M6 540C4 566 10 594 30 608C50 620 76 620 96 612C84 596 60 580 40 552C30 538 18 532 6 540Z" fill="url(#${gMuz})"/>`;
      b += `<path d="M18 566C22 556 32 556 34 566C34 576 26 582 20 578Z" fill="#0F0B22"/>`;
      b += `<path d="M28 610Q56 618 86 612" stroke="#0F0B22" stroke-width="4" fill="none" stroke-linecap="round" stroke-opacity="0.7"/>`;
      b += `<path d="M16 548C24 540 36 542 44 552" stroke="#B5B4E8" stroke-width="4" fill="none" stroke-opacity="0.6" stroke-linecap="round"/>`;
      // Eye.
      b += `<path d="M96 438C106 426 126 424 138 436C126 448 108 450 96 438Z" fill="#F0C79A" fill-opacity="0.85"/>`;
      b += `<circle cx="117" cy="437" r="9" fill="#120E26"/><circle cx="114" cy="434" r="3" fill="#FFFFFF"/>`;
      b += `<path d="M90 426Q114 410 142 424" stroke="#1A1232" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      // Forehead wool.
      b += `<path d="${wool}" fill="url(#${gWool})"/>`;
      b += `<g clip-path="url(#${cWool})">` +
        tufts({ seed: 23, count: 520, x0: 14, x1: 240, y0: 210, y1: 420, len: [10, 22], angle: 90, spreadA: 160,
          colour: (x, y, r) => {
            const d = y - 214 - Math.abs(x - 126) * 0.4;
            if (d < 44) return r < 0.55 ? ['#F4BC88', 4, 0.8] : ['#FFDDB0', 3, 0.7];
            if (d < 110) return r < 0.5 ? ['#A8664E', 4, 0.6] : ['#6A3C48', 4, 0.6];
            return r < 0.6 ? ['#2E2044', 4, 0.6] : ['#5A3E70', 3, 0.5];
          } }) +
        `</g>`;
      // Forelock shadow over the eye line.
      b += `<path d="M58 392Q100 412 160 392" stroke="#1E1636" stroke-width="10" fill="none" stroke-opacity="0.35" stroke-linecap="round" filter="url(#${blur})"/>`;

      parts.push({
        defs:
          k.linear(gBody, 90, [[0, '#6A4558'], [0.45, '#3E2C56'], [1, '#221C46']]) +
          k.linear(gThigh, 90, [[0, '#5C3E60'], [0.5, '#35285A'], [1, '#1E1A40']]) +
          k.linear(gCape, 90, [[0, '#B0714E'], [0.3, '#7E4A48'], [0.65, '#43305A'], [1, '#231C44']]) +
          k.linear(gLeg, 0, [[0, '#2C2450'], [1, '#1C1838']]) +
          k.linear(gFar, 90, [[0, '#2E2448'], [1, '#18142E']]) +
          k.linear(gHead, 90, [[0, '#4A3150'], [1, '#2A1E42']]) +
          k.linear(gWool, 90, [[0, '#B4724E'], [0.45, '#6E4048'], [1, '#2E2044']]) +
          k.linear(gHorn, 90, [[0, '#4C58C8'], [0.6, '#2A2F80'], [1, '#1A1D52']]) +
          k.linear(gMuz, 90, [[0, '#3C3460'], [1, '#18142C']]) +
          k.linear(gRim, 0, [[0, '#F7C894', 0.7], [0.6, '#FFE0B4', 0.85], [1, '#F2B07E', 0.5]]) +
          `<filter id="${blur}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>` +
          `<clipPath id="${cCape}"><path d="${cape}"/></clipPath>` +
          `<clipPath id="${cBody}"><path d="${body}"/></clipPath>` +
          `<clipPath id="${cHead}"><path d="${head}"/></clipPath>` +
          `<clipPath id="${cWool}"><path d="${wool}"/></clipPath>`,
        svg: `<g transform="translate(${BX} ${BY}) scale(${S})">${b}</g>`,
      });
    }

    // ---- foreground grass ---------------------------------------------------------------------
    {
      const rg = rng(91);
      const groups = {};
      const add = (c, d) => { groups[c] = (groups[c] || '') + d; };
      for (let x = -20; x < k.W + 20; x += 6) {
        const xx = x + rg() * 6;
        // Shorter in the middle of the left page, so the creek reads.
        const base = k.H + 12;
        const tall = (xx > 1100 ? 230 : xx < 460 ? 220 : 130) * (0.45 + rg() * 0.65);
        const lean = (rg() - 0.5) * tall * 0.5;
        const w = 4 + rg() * 5;
        const d = `M${n(xx - w)} ${base}Q${n(xx + lean * 0.3)} ${n(base - tall * 0.6)} ${n(xx + lean)} ${n(base - tall)}Q${n(xx + lean * 0.3 + w * 0.4)} ${n(base - tall * 0.55)} ${n(xx + w)} ${base}Z`;
        const p = rg();
        add(p < 0.2 ? '#8E7CC0' : p < 0.42 ? '#B4B566' : p < 0.66 ? '#CFC777' : p < 0.84 ? '#A3AE5C' : '#E2CC82', d);
      }
      // Seed heads (bluestem "turkey feet") on some stalks.
      let seeds = '';
      for (let i = 0; i < 46; i++) {
        const x = rg() * k.W;
        if (x > 470 && x < 1100) continue;
        const y = k.H - 200 - rg() * 120;
        seeds += `M${n(x)} ${n(y + 120)}Q${n(x + 4)} ${n(y + 60)} ${n(x)} ${n(y)}M${n(x)} ${n(y)}q-10 -14 -14 -36M${n(x)} ${n(y)}q2 -18 0 -40M${n(x)} ${n(y)}q10 -14 16 -34`;
      }
      parts.push({
        svg: Object.keys(groups).map((c) => `<path d="${groups[c]}" fill="${c}"/>`).join('') +
          `<path d="${seeds}" fill="none" stroke="#8A6A9E" stroke-width="3" stroke-linecap="round" stroke-opacity="0.8"/>`,
      });
    }

    // ---- foreground flowers: blazing star and prairie coneflower ----------------------------
    function blazingStar(x, y, h, seed, lean) {
      const r = rng(seed);
      const tx = x + h * lean;
      let s = `<path d="M${n(x)} ${n(y)}Q${n(x + h * lean * 0.3)} ${n(y - h * 0.5)} ${n(tx)} ${n(y - h)}" fill="none" stroke="#4E7A5A" stroke-width="5" stroke-linecap="round"/>`;
      // narrow grassy leaves up the lower stem
      for (let i = 0; i < 7; i++) {
        const t = 0.08 + i * 0.06;
        const lx = x + (tx - x) * t, ly = y - h * t;
        const side = i % 2 ? 1 : -1;
        s += `<path d="M${n(lx)} ${n(ly)}q${n(side * 30)} ${n(-40)} ${n(side * 50)} ${n(-110 + i * 6)}" fill="none" stroke="${i % 2 ? '#6E9A6A' : '#4E7A5A'}" stroke-width="4" stroke-linecap="round"/>`;
      }
      // the spike: fluffy florets, densest and brightest toward the top
      const spikeLen = h * 0.46;
      const groups = {};
      for (let i = 0; i < 70; i++) {
        const t = r();
        const along = 1 - spikeLen / h * t;
        const px = x + (tx - x) * along + (r() - 0.5) * (14 + 10 * (1 - t));
        const py = y - h * along;
        const wid = 14 + 12 * (1 - t * 0.3);
        const c = t < 0.35 ? (r() < 0.5 ? '#9A5BD8' : '#B98AEA') : t < 0.75 ? (r() < 0.6 ? '#7A40BE' : '#A36ADB') : (r() < 0.6 ? '#5E2E9E' : '#8B52C8');
        let d = '';
        for (let j = 0; j < 5; j++) {
          const a = (-90 + (j - 2) * 30 + (r() - 0.5) * 20) * Math.PI / 180;
          d += `M${n(px)} ${n(py)}l${n(Math.cos(a) * wid)} ${n(Math.sin(a) * wid * 0.8)}`;
        }
        groups[c] = (groups[c] || '') + d;
      }
      s += Object.keys(groups).map((c) => `<path d="${groups[c]}" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
      s += `<path d="M${n(tx)} ${n(y - h)}l0 -14" stroke="#C9A2F0" stroke-width="5" stroke-linecap="round"/>`;
      return s;
    }
    function coneflower(x, y, h, seed, lean, sc) {
      const r = rng(seed);
      const tx = x + h * lean, ty = y - h;
      const s0 = sc || 1;
      const cone = k.id('cone');
      let s = `<path d="M${n(x)} ${n(y)}Q${n(x + h * lean * 0.2)} ${n(y - h * 0.5)} ${n(tx)} ${n(ty)}" fill="none" stroke="#557E5C" stroke-width="4.5" stroke-linecap="round"/>`;
      // feathery leaves low on the stem
      for (let i = 0; i < 3; i++) {
        const t = 0.15 + i * 0.12, lx = x + (tx - x) * t, ly = y - h * t, side = i % 2 ? 1 : -1;
        s += `<path d="M${n(lx)} ${n(ly)}q${n(side * 24)} -20 ${n(side * 46)} -12M${n(lx + side * 20)} ${n(ly - 12)}l${n(side * 6)} -16M${n(lx + side * 34)} ${n(ly - 14)}l${n(side * 8)} -12" fill="none" stroke="#6E9A6A" stroke-width="4" stroke-linecap="round"/>`;
      }
      // drooping petals: coral-red with butter tips
      const pet = k.id('pet');
      const np = 6;
      for (let i = 0; i < np; i++) {
        const a = -40 + (i / (np - 1)) * 260 + (r() - 0.5) * 14; // spread around the front
        const ang = a * Math.PI / 180;
        const dx = Math.cos(ang) * 34 * s0, dy = 20 * s0 + Math.abs(Math.sin(ang)) * 16 * s0;
        const bx = tx + Math.cos(ang) * 10 * s0, by = ty + 4 * s0;
        s += `<path d="M${n(bx - 8 * s0)} ${n(by)}Q${n(bx + dx * 0.5 - 10 * s0)} ${n(by + dy * 0.3)} ${n(bx + dx)} ${n(by + dy)}Q${n(bx + dx * 0.5 + 10 * s0)} ${n(by + dy * 0.1)} ${n(bx + 8 * s0)} ${n(by)}Z" fill="url(#${pet})"/>`;
      }
      // the tall column cone
      s += `<path d="M${n(tx - 12 * s0)} ${n(ty + 6 * s0)}C${n(tx - 14 * s0)} ${n(ty - 30 * s0)} ${n(tx - 10 * s0)} ${n(ty - 52 * s0)} ${n(tx)} ${n(ty - 54 * s0)}C${n(tx + 10 * s0)} ${n(ty - 52 * s0)} ${n(tx + 14 * s0)} ${n(ty - 30 * s0)} ${n(tx + 12 * s0)} ${n(ty + 6 * s0)}Z" fill="url(#${cone})"/>`;
      let dots = '';
      for (let i = 0; i < 14; i++) dots += `M${n(tx - 9 * s0 + r() * 18 * s0)} ${n(ty - r() * 48 * s0)}h0.1`;
      s += `<path d="${dots}" stroke="#F4B183" stroke-width="${n(3 * s0)}" stroke-linecap="round" stroke-opacity="0.75"/>`;
      return {
        defs: k.linear(cone, 0, [[0, '#4A2E3C'], [0.45, '#8A5A48'], [1, '#3A2436']]) +
          k.linear(pet, 90, [[0, '#B8344A'], [0.55, '#E5544E'], [1, '#F6D06A']]),
        svg: s,
      };
    }
    function corner(left, seed) {
      const r = rng(seed);
      const X = (x) => (left ? x : k.W - x);
      let svg = '', defs = '';
      // blazing star spikes
      const spikes = left
        ? [[30, 520], [110, 430], [190, 560], [290, 380], [360, 300]]
        : [[30, 560], [120, 470], [210, 380], [300, 320]];
      spikes.forEach((p, i) => { svg += blazingStar(X(p[0]), k.H + 20, p[1], seed + i * 7, (left ? 1 : -1) * (0.02 + r() * 0.06)); });
      const cones = left ? [[70, 300, 1.2], [240, 260, 1.1], [400, 200, 0.95], [150, 190, 1]] : [[70, 320, 1.2], [170, 250, 1.1], [270, 210, 1], [370, 170, 0.9]];
      cones.forEach((p, i) => {
        const c = coneflower(X(p[0]), k.H + 20, p[1], seed + 40 + i, (left ? 1 : -1) * (0.03 + r() * 0.06), p[2]);
        defs += c.defs; svg += c.svg;
      });
      return { defs, svg };
    }
    parts.push(corner(true, 101));
    parts.push(corner(false, 203));

    return k.spread(parts, { grain: 0.62 });
  },
};
