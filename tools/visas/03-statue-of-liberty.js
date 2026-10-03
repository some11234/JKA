/* Visa pages 5–6 — New York Harbor.
   Left: the harbor at sunrise — a low sun behind Ellis Island's red-brick main
   building and its four copper-domed towers, calm water with long reflections,
   a ferry crossing toward Liberty Island, gulls. Right: the Statue of Liberty,
   verdigris copper lit warm from the left, torch raised, on Hunt's granite
   pedestal and the star-shaped walls of Fort Wood. Beach roses (left) and
   asters (right) frame the bottom corners. Quote (live text, see
   js/passport-data.js): Anna Julia Cooper. */

'use strict';

module.exports = {
  pages: [5, 6],
  svg(k) {
    const { C, n, rng } = k;
    const parts = [];
    const HZ = 985; // horizon / far waterline

    // userSpaceOnUse linear gradient (coordinates in the referencing element's space).
    function lgU(gid, x1, y1, x2, y2, stops) {
      return `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${
        stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`;
    }
    function poly(pts) { return 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z'; }

    // ---- sky, security print -----------------------------------------------------
    parts.push(k.sky([[0, '#DCD5F0'], [0.3, '#EAD4E6'], [0.5, '#F6D3D3'], [0.62, '#FCDCC6'], [0.75, '#FDE8D3'], [1, '#FDE8D3']]));
    parts.push(k.microtext('Liberty Enlightening the World', { y0: 30, y1: 960, opacity: 0.05 }));
    parts.push(k.guilloche({ y0: 110, y1: 860, lines: 22, opacity: 0.065, amp: 16, period: 680, phase: 1.3 }));

    // The low sun on the left page, behind Ellis Island.
    const SX = 450, SY = 700, SR = 165;
    const sunGlow = k.id('sunglow'), sunDisc = k.id('sundisc');
    parts.push({
      defs: k.radial(sunGlow, '50%', '50%', '50%', [[0, '#FFF6E6', 0.95], [0.35, '#FDE3CC', 0.6], [1, '#F8D3C8', 0]]) +
        k.linear(sunDisc, 90, [[0, '#FFF8EC'], [0.6, '#FFE9C9'], [1, '#FCC9A4']]),
      svg: `<circle cx="${SX}" cy="${SY}" r="${SR * 3}" fill="url(#${sunGlow})"/>` +
        `<circle cx="${SX}" cy="${SY}" r="${SR}" fill="url(#${sunDisc})"/>`,
    });

    // Torch light: a glory of fine rays and a rosette behind the statue.
    const TX = 1490, TY = 328;
    const torchGlow = k.id('tglow');
    parts.push({
      defs: k.radial(torchGlow, '50%', '50%', '50%', [[0, '#FFF7E4', 1], [0.3, '#FEEBD3', 0.55], [1, '#F8DCCF', 0]]),
      svg: `<circle cx="${TX}" cy="${TY}" r="460" fill="url(#${torchGlow})"/>` +
        k.sunburst(TX, TY, 90, 700, 48, "#FFFFFF", 0.13) +
        k.rosette(1580, 640, 360, { opacity: 0.085, rings: 9, lobes: 30 }),
    });

    // Long sunrise cloud streaks.
    const rc = rng(505);
    let streaks = '';
    const bands = [
      [80, 560, 520, 26, '#FCE6DA'], [300, 610, 360, 18, '#F7CFCB'], [20, 790, 420, 22, '#FBDCD0'],
      [430, 770, 300, 16, '#F5C4C3'], [620, 470, 300, 18, '#FBE4DC'], [1220, 860, 380, 20, '#F9DCD2'],
      [1700, 820, 420, 24, '#FBE3D8'], [1840, 520, 300, 18, '#F8DAD4'], [1150, 600, 220, 14, '#FBE6DE'],
      [150, 860, 300, 14, '#F3C6C4'], [640, 840, 260, 12, '#F6CFC6'],
    ];
    for (const [x, y, w, h, col] of bands) {
      streaks += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${col}" fill-opacity="${n(0.6 + rc() * 0.3)}"/>`;
      streaks += `<rect x="${n(x + w * 0.15)}" y="${n(y + h * 0.55)}" width="${n(w * 0.7)}" height="${n(h * 0.45)}" rx="${n(h * 0.22)}" fill="#E7B8C2" fill-opacity="0.35"/>`;
    }
    parts.push({ svg: streaks });

    // ---- far shores, haze ----------------------------------------------------------------
    const farG = k.id('far');
    let far = `<path d="${k.ridge({ y: HZ - 22, amp: 6, seed: 21, step: 30, peaks: [[1300, 22, 360], [1900, 34, 300], [80, 18, 260]], bottom: HZ + 4 })}" fill="url(#${farG})"/>`;
    // A faint distant skyline (Jersey City / Bayonne) — just a texture of blocks.
    const rs = rng(77);
    let blocks = '';
    for (let x = 1180; x < 2080; x += 14 + rs() * 22) {
      const h = 8 + rs() * 26 * (x > 1700 ? 1.4 : 1);
      blocks += `<rect x="${n(x)}" y="${n(HZ - 24 - h)}" width="${n(10 + rs() * 16)}" height="${n(h + 6)}"/>`;
    }
    for (let x = 0; x < 120; x += 12 + rs() * 18) {
      const h = 6 + rs() * 18;
      blocks += `<rect x="${n(x)}" y="${n(HZ - 20 - h)}" width="${n(9 + rs() * 12)}" height="${n(h + 6)}"/>`;
    }
    far = `<g fill="#CDBEDD" fill-opacity="0.75">${blocks}</g>` + far;
    parts.push({ defs: k.linear(farG, 90, [[0, '#C9B8DC'], [1, '#DCCBE1']]), svg: far });
    parts.push(k.haze(HZ - 70, 120, '#FCE6D6', 0.65));

    // ---- water ---------------------------------------------------------------------------
    const waterG = k.id('water');
    let water = `<rect x="0" y="${HZ}" width="${k.W}" height="${k.H - HZ}" fill="url(#${waterG})"/>`;
    // Sun glitter path below the sun.
    const rw = rng(909);
    let glit = '';
    for (let y = HZ + 6; y < k.H; y += 7 + (y - HZ) * 0.03) {
      const spread = 60 + (y - HZ) * 0.32;
      const count = 2 + Math.floor(rw() * 3);
      for (let i = 0; i < count; i++) {
        const cx = SX + (rw() - 0.5) * 2 * spread;
        const w = 14 + rw() * (30 + (y - HZ) * 0.12);
        const th = 2 + (y - HZ) * 0.008;
        glit += `<rect x="${n(cx - w / 2)}" y="${n(y)}" width="${n(w)}" height="${n(th)}" rx="${n(th / 2)}"/>`;
      }
    }
    water += `<g fill="#FFF3E2" fill-opacity="0.7">${glit}</g>`;
    // Ripple lines across the whole harbour.
    let rip = '';
    for (let i = 0; i < 170; i++) {
      const y = HZ + 8 + Math.pow(rw(), 1.4) * (k.H - HZ - 8);
      const x = rw() * k.W;
      const w = 20 + (y - HZ) * (0.1 + rw() * 0.25);
      rip += `M${n(x)} ${n(y)}h${n(w)}`;
    }
    water += `<path d="${rip}" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="2.6" stroke-linecap="round"/>`;
    let ripD = '';
    for (let i = 0; i < 110; i++) {
      const y = HZ + 40 + Math.pow(rw(), 1.2) * (k.H - HZ - 40);
      const x = rw() * k.W;
      const w = 16 + (y - HZ) * (0.08 + rw() * 0.2);
      ripD += `M${n(x)} ${n(y)}q${n(w / 2)} ${n(3 + (y - HZ) * 0.006)} ${n(w)} 0`;
    }
    water += `<path d="${ripD}" stroke="#6A72C4" stroke-opacity="0.22" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    parts.push({
      defs: k.linear(waterG, 90, [[0, '#F3D9D6'], [0.12, '#DCCDE6'], [0.45, '#B4B6E4'], [1, '#8C95D8']]),
      svg: water,
    });

    // ---- Ellis Island ---------------------------------------------------------------------
    // Front elevation of the 1900 main building: wings, central block with the
    // three great arched Registry Room windows, four copper-domed towers.
    const EX = 430, EB = 972;
    const brick = k.id('brick'), brickD = k.id('brickd'), roofG = k.id('roof'), domeG = k.id('dome'), domeB = k.id('domeb');
    function tower(x, scale, back) {
      // x = tower centre (local), base at 0
      const w = 34 * scale, h = 162 * scale;
      let s = '';
      const hw = w / 2;
      s += `<rect x="${n(x - hw)}" y="${n(-h)}" width="${n(w)}" height="${n(h)}" fill="url(#${back ? brickD : brick})"/>`;
      // limestone quoins
      for (let y = -h + 6; y < -8; y += 12 * scale) {
        s += `<rect x="${n(x - hw)}" y="${n(y)}" width="${n(5 * scale)}" height="${n(6 * scale)}" fill="#F2E2D4" fill-opacity="0.85"/>`;
        s += `<rect x="${n(x + hw - 5 * scale)}" y="${n(y + 6 * scale)}" width="${n(5 * scale)}" height="${n(6 * scale)}" fill="#F2E2D4" fill-opacity="0.7"/>`;
      }
      // belfry stage
      const by = -h;
      s += `<rect x="${n(x - hw - 3 * scale)}" y="${n(by - 6 * scale)}" width="${n(w + 6 * scale)}" height="${n(6 * scale)}" fill="#F4E6DA"/>`;
      s += `<rect x="${n(x - hw + 1)}" y="${n(by - 26 * scale)}" width="${n(w - 2)}" height="${n(20 * scale)}" fill="#F0DED0"/>`;
      s += `<path d="M${n(x - hw + 6 * scale)} ${n(by - 8 * scale)}v${n(-10 * scale)}a${n(5 * scale)} ${n(5 * scale)} 0 0 1 ${n(10 * scale)} 0v${n(10 * scale)}ZM${n(x + 1 * scale)} ${n(by - 8 * scale)}v${n(-10 * scale)}a${n(4 * scale)} ${n(5 * scale)} 0 0 1 ${n(9 * scale)} 0v${n(10 * scale)}Z" fill="#7B5E8E" fill-opacity="0.75"/>`;
      s += `<rect x="${n(x - hw - 2 * scale)}" y="${n(by - 30 * scale)}" width="${n(w + 4 * scale)}" height="${n(5 * scale)}" fill="#F7EBE0"/>`;
      // ogee copper dome, lantern, finial
      const dy = by - 30 * scale, dw = (w + 2 * scale) / 2;
      s += `<path d="M${n(x - dw)} ${n(dy)}C${n(x - dw)} ${n(dy - 18 * scale)} ${n(x - dw * 0.15)} ${n(dy - 20 * scale)} ${n(x - 3 * scale)} ${n(dy - 36 * scale)}H${n(x + 3 * scale)}C${n(x + dw * 0.15)} ${n(dy - 20 * scale)} ${n(x + dw)} ${n(dy - 18 * scale)} ${n(x + dw)} ${n(dy)}Z" fill="url(#${back ? domeB : domeG})"/>`;
      s += `<path d="M${n(x - dw * 0.55)} ${n(dy - 3)}C${n(x - dw * 0.55)} ${n(dy - 14 * scale)} ${n(x - dw * 0.2)} ${n(dy - 18 * scale)} ${n(x - 3 * scale)} ${n(dy - 30 * scale)}" stroke="#DDF3EA" stroke-width="${n(2.2 * scale)}" stroke-opacity="0.7" fill="none"/>`;
      s += `<rect x="${n(x - 4 * scale)}" y="${n(dy - 46 * scale)}" width="${n(8 * scale)}" height="${n(10 * scale)}" fill="#6FAEA3"/>`;
      s += `<path d="M${n(x - 5 * scale)} ${n(dy - 46 * scale)}L${n(x)} ${n(dy - 52 * scale)}L${n(x + 5 * scale)} ${n(dy - 46 * scale)}Z" fill="#5C9A95"/>`;
      s += `<path d="M${n(x)} ${n(dy - 52 * scale)}v${n(-10 * scale)}" stroke="#4E7F86" stroke-width="${n(1.8 * scale)}"/>`;
      return s;
    }
    function windowsRow(x0, x1, y, w, h, gap, arched, col) {
      let s = '';
      for (let x = x0; x + w <= x1 + 0.1; x += w + gap) {
        if (arched) s += `<path d="M${n(x)} ${n(y + h)}V${n(y + w / 2)}A${n(w / 2)} ${n(w / 2)} 0 0 1 ${n(x + w)} ${n(y + w / 2)}V${n(y + h)}Z" fill="${col}"/>`;
        else s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${col}"/>`;
      }
      return s;
    }
    function ellisBuilding() {
      let s = '';
      // back towers first (offset right/up: we stand a little to the left)
      s += tower(-102 + 34, 0.9, true) + tower(102 + 34, 0.9, true);
      // wings
      for (const side of [-1, 1]) {
        const xa = side < 0 ? -292 : 110, xb = side < 0 ? -110 : 292;
        s += `<path d="M${xa - 2} -78L${xa + 12} -96H${xb - 12}L${xb + 2} -78Z" fill="url(#${roofG})"/>`;
        // dormers
        for (let x = xa + 26; x < xb - 20; x += 30) s += `<path d="M${x - 6} -80V-90L${x} -96L${x + 6} -90V-80Z" fill="#E8D2C6"/><rect x="${x - 3}" y="-90" width="6" height="8" fill="#7B5E8E" fill-opacity="0.6"/>`;
        s += `<rect x="${xa}" y="-80" width="${xb - xa}" height="80" fill="url(#${brick})"/>`;
        s += `<rect x="${xa - 2}" y="-82" width="${xb - xa + 4}" height="5" fill="#F4E6DA"/>`;
        s += `<rect x="${xa}" y="-30" width="${xb - xa}" height="3" fill="#F2E2D4" fill-opacity="0.8"/><rect x="${xa}" y="-56" width="${xb - xa}" height="3" fill="#F2E2D4" fill-opacity="0.8"/>`;
        s += windowsRow(xa + 10, xb - 10, -74, 9, 15, 9, true, '#6F5A8C');
        s += windowsRow(xa + 10, xb - 10, -49, 9, 15, 9, false, '#6F5A8C');
        s += windowsRow(xa + 10, xb - 10, -23, 9, 15, 9, true, '#6F5A8C');
        // end pavilion
        const px = side < 0 ? xa : xb - 40;
        s += `<path d="M${px - 3} -88L${px + 6} -108H${px + 34}L${px + 43} -88Z" fill="url(#${roofG})"/>`;
        s += `<rect x="${px}" y="-90" width="40" height="90" fill="url(#${brick})"/><rect x="${px - 2}" y="-92" width="44" height="5" fill="#F4E6DA"/>`;
        s += `<rect x="${px}" y="-90" width="4" height="90" fill="#F2E2D4" fill-opacity="0.7"/><rect x="${px + 36}" y="-90" width="4" height="90" fill="#F2E2D4" fill-opacity="0.7"/>`;
        s += windowsRow(px + 10, px + 30, -80, 8, 18, 4, true, '#6F5A8C') + windowsRow(px + 10, px + 30, -50, 8, 16, 4, false, '#6F5A8C') + windowsRow(px + 10, px + 30, -24, 8, 16, 4, true, '#6F5A8C');
      }
      // central block + hipped roof
      s += `<path d="M-116 -108L-92 -134H92L116 -108Z" fill="url(#${roofG})"/>`;
      s += `<rect x="-112" y="-110" width="224" height="110" fill="url(#${brick})"/>`;
      s += `<rect x="-114" y="-112" width="228" height="6" fill="#F6E9DE"/>`;
      // three great arched windows with limestone surrounds
      for (const x of [-52, 0, 52]) {
        s += `<path d="M${x - 20} -38V-84A20 20 0 0 1 ${x + 20} -84V-38Z" fill="#F3E3D5"/>`;
        s += `<path d="M${x - 15} -40V-83A15 15 0 0 1 ${x + 15} -83V-40Z" fill="#6A5690"/>`;
        s += `<path d="M${x} -98V-40M${x - 15} -66H${x + 15}M${x - 15} -52H${x + 15}" stroke="#E9D5CB" stroke-width="1.6" stroke-opacity="0.8"/>`;
        s += `<path d="M${x - 10} -78Q${x - 8} -90 ${x} -94" stroke="#D3C9F1" stroke-width="2" stroke-opacity="0.6" fill="none"/>`;
      }
      s += `<rect x="-112" y="-36" width="224" height="4" fill="#F2E2D4"/>`;
      s += windowsRow(-92, 92, -26, 12, 18, 14, true, '#6F5A8C');
      // entrance canopy
      s += `<path d="M-40 -8H40L34 -18H-34Z" fill="#E9DCEE"/><rect x="-40" y="-8" width="80" height="8" fill="#B6A5CF"/>`;
      // front towers
      s += tower(-102, 1, false) + tower(102, 1, false);
      return s;
    }
    let ellis = '';
    // island trees behind the wings
    const rt = rng(313);
    let treesBack = '';
    for (let i = 0; i < 26; i++) {
      const x = -360 + rt() * 720, r = 14 + rt() * 16;
      if (Math.abs(x) < 300) continue;
      treesBack += `<circle cx="${n(x)}" cy="${n(-r * 0.5)}" r="${n(r)}"/>`;
    }
    ellis += `<g fill="#9DAFAE">${treesBack}</g>`;
    ellis += ellisBuilding();
    let treesFront = '';
    for (let i = 0; i < 40; i++) {
      const x = -380 + rt() * 760, r = 8 + rt() * 11;
      treesFront += `<circle cx="${n(x)}" cy="${n(4 - r * 0.2)}" r="${n(r)}"/>`;
    }
    ellis += `<g fill="#8FA7A2">${treesFront}</g>`;
    // seawall
    ellis += `<rect x="-400" y="4" width="800" height="9" fill="#D8C3CB"/><rect x="-400" y="11" width="800" height="3" fill="#A796BC"/>`;
    // haze over the whole island to push it back
    const ellisHaze = k.id('ehaze');
    ellis += `<rect x="-420" y="-260" width="840" height="275" fill="url(#${ellisHaze})"/>`;
    parts.push({
      defs:
        k.linear(brick, 0, [[0, '#D99586'], [0.5, '#CF8379'], [1, '#B8737A']]) +
        k.linear(brickD, 0, [[0, '#C98E8C'], [1, '#B07C88']]) +
        k.linear(roofG, 90, [[0, '#8E8DB8'], [1, '#A9A3C8']]) +
        k.linear(domeG, 0, [[0, '#A6DCCB'], [0.5, '#72B6A8'], [1, '#4D8C98']]) +
        k.linear(domeB, 0, [[0, '#97C9BE'], [1, '#5E949C']]) +
        k.linear(ellisHaze, 90, [[0, '#FBE6DA', 0], [0.7, '#F6DCD6', 0.18], [1, '#F2D6DA', 0.35]]),
      svg:
        // reflection
        `<g transform="translate(${EX} ${EB + 14}) scale(1 -0.55)" opacity="0.2">${ellis}</g>` +
        `<g transform="translate(${EX} ${EB})">${ellis}</g>`,
    });
    // break the reflection with water lines
    let refl = '';
    for (let y = EB + 18; y < EB + 140; y += 6) refl += `M${EX - 330 + ((y * 37) % 50)} ${y}h${560 + ((y * 13) % 90)}`;
    parts.push({ svg: `<path d="${refl}" stroke="#E7DAEA" stroke-width="2" stroke-opacity="0.5"/>` });

    // A little sailboat far out by the island.
    parts.push({
      svg: `<g transform="translate(64 1084) scale(1.1)">` +
        `<path d="M0 -4H44L38 4H6Z" fill="#5C5FA8"/>` +
        `<path d="M22 -6V-70" stroke="#5C5FA8" stroke-width="2"/>` +
        `<path d="M24 -68Q46 -40 42 -8H24Z" fill="#FFF5EC"/><path d="M20 -62Q6 -36 2 -8H20Z" fill="#F4A08E"/>` +
        `<path d="M2 8H42" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="2"/></g>`,
    });

    // A red channel buoy rocking in the foreground water.
    {
      const bg = k.id('buoy');
      parts.push({
        defs: k.linear(bg, 0, [[0, '#FF9C84'], [0.45, '#EE5A4E'], [1, '#B8394F']]),
        svg: `<g transform="translate(790 1356) rotate(-6)">` +
          `<path d="M-46 8Q0 28 46 8" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.55" fill="none" stroke-linecap="round"/>` +
          `<path d="M-30 6L-22 -64L0 -96L22 -64L30 6Z" fill="url(#${bg})"/>` +
          `<path d="M-36 4H36L32 16H-32Z" fill="#3B3F8E" fill-opacity="0.85"/>` +
          `<path d="M-25 -36H25" stroke="#FFF3EA" stroke-width="7"/>` +
          `<path d="M-14 -70L-4 -90" stroke="#FFD2C2" stroke-width="4" stroke-opacity="0.8" stroke-linecap="round"/>` +
          `<path d="M-4 -118V-96M-12 -118H4" stroke="#3B3F8E" stroke-width="4"/><circle cx="-4" cy="-124" r="6" fill="#FFE7A0"/>` +
          `<path d="M-30 24H30L18 64H-18Z" fill="#C65060" fill-opacity="0.18"/>` +
          `</g>`,
      });
    }

    // ---- the ferry ------------------------------------------------------------------------
    // A harbour ferry crossing toward Liberty Island (heading right).
    {
      const fx = 560, fy = 1172; // stern-left at waterline
      const hull = k.id('hull'), deck = k.id('deck');
      let f = '';
      // wake
      f += `<path d="M-120 6Q-40 -2 10 2" stroke="#FFFFFF" stroke-width="5" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      f += `<path d="M-200 18Q-80 8 0 10M-160 30Q-60 20 30 16" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.35" fill="none" stroke-linecap="round"/>`;
      f += `<path d="M280 4Q300 10 330 12M276 12Q300 22 340 26" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      // reflection
      f += `<path d="M0 2H300L280 30H14Z" fill="#3B3F8E" fill-opacity="0.18"/>`;
      // hull
      f += `<path d="M-4 -36H316Q306 -12 284 2H12Q2 -12 -4 -36Z" fill="url(#${hull})"/>`;
      f += `<path d="M4 -20H304" stroke="#F06F67" stroke-width="5"/>`;
      // decks
      f += `<path d="M14 -36V-70H262Q282 -60 292 -36Z" fill="url(#${deck})"/>`;
      f += windowsRow(26, 262, -62, 14, 16, 6, false, '#4A55A8');
      f += `<path d="M10 -70H270" stroke="#3F4AA0" stroke-width="3"/>`;
      f += `<path d="M44 -70V-98H214Q228 -88 234 -70Z" fill="url(#${deck})"/>`;
      f += windowsRow(56, 206, -92, 12, 14, 6, false, '#4A55A8');
      f += `<path d="M40 -98H220" stroke="#3F4AA0" stroke-width="3"/>`;
      // top deck railing + wheelhouse
      f += `<path d="M60 -98V-110M80 -98V-110M100 -98V-110M120 -98V-110M140 -98V-110M160 -98V-110M180 -98V-110M58 -110H184" stroke="#4A55A8" stroke-width="2"/>`;
      f += `<path d="M186 -98V-124H222L230 -98Z" fill="#FFFFFF"/><rect x="192" y="-120" width="30" height="9" fill="#3A458F"/>`;
      f += `<path d="M120 -110V-150" stroke="#3F4AA0" stroke-width="2.5"/><path d="M120 -150H146V-134H120Z" fill="#F06F67"/><path d="M120 -150H132V-142H120Z" fill="#3A4FC9"/>`;
      // passengers on top deck (dots)
      f += `<g fill="#6B5D9E">${[66, 74, 92, 104, 128, 150, 158, 172].map((x) => `<circle cx="${x}" cy="-104" r="3.4"/>`).join('')}</g>`;
      f += `<path d="M-4 -36H316" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.8"/>`;
      parts.push({
        defs: k.linear(hull, 90, [[0, '#FFFFFF'], [0.55, '#E8E6F7'], [1, '#B9B6E0']]) +
          k.linear(deck, 90, [[0, '#FFFFFF'], [1, '#E9E4F2']]),
        svg: `<g transform="translate(${fx} ${fy})">${f}</g>`,
      });
    }

    // ---- gulls ----------------------------------------------------------------------------
    function gull(x, y, s, flip, up) {
      const t = `translate(${n(x)} ${n(y)}) scale(${flip ? -s : s} ${s})`;
      const wy = up ? -34 : -10;
      let g = '';
      // far wing
      g += `<path d="M6 -2C20 ${wy - 6} 46 ${wy - 14} 70 ${wy + 2}C50 ${wy} 34 ${wy + 6} 18 4Z" fill="#B7B6DE"/>`;
      g += `<path d="M70 ${wy + 2}C62 ${wy - 2} 56 ${wy - 3} 50 ${wy - 2}L56 ${wy + 4}Z" fill="#2E2E6E"/>`;
      // body
      g += `<path d="M-34 2C-20 -8 8 -10 30 -4C38 -2 42 0 46 4C30 8 4 10 -18 8C-26 7 -32 5 -34 2Z" fill="#FFFFFF"/>`;
      g += `<path d="M-18 8C4 10 30 8 46 4C30 12 0 14 -18 8Z" fill="#C9C6EA"/>`;
      g += `<path d="M30 -4C36 -8 42 -8 46 -4C44 0 46 2 46 4C40 2 34 0 30 -4Z" fill="#FFFFFF"/>`;
      g += `<path d="M46 -3L56 -1L46 1Z" fill="#F2B84C"/><circle cx="41" cy="-4" r="1.6" fill="#26245E"/>`;
      g += `<path d="M-34 2L-46 -2L-44 6Z" fill="#E4E2F4"/>`;
      // near wing
      g += `<path d="M2 0C-14 ${wy - 10} -40 ${wy - 20} -70 ${wy - 8}C-50 ${wy - 2} -30 ${wy + 6} -12 8Z" fill="#9C9ED4"/>`;
      g += `<path d="M-70 ${wy - 8}C-60 ${wy - 12} -52 ${wy - 13} -46 ${wy - 12}L-52 ${wy - 4}Z" fill="#26245E"/>`;
      g += `<path d="M2 0C-14 ${wy - 6} -36 ${wy - 14} -58 ${wy - 8}" stroke="#E6E6FA" stroke-width="2.5" fill="none" stroke-opacity="0.8"/>`;
      return `<g transform="${t}">${g}</g>`;
    }
    parts.push({
      svg: gull(250, 420, 1.15, false, true) + gull(740, 520, 0.85, true, false) + gull(1210, 760, 0.6, false, true) +
        k.bird(560, 380, 14, '#7A71B4') + k.bird(600, 360, 10, '#7A71B4') + k.bird(1950, 420, 13, '#7A71B4') + k.bird(1990, 446, 9, '#7A71B4'),
    });

    // ---- Liberty Island: fort, pedestal, trees -------------------------------------------
    // The statue is drawn in a local frame (origin = centre of the soles, ~15.5
    // units per metre) scaled by SS; the pedestal is drawn at the same scale,
    // a little compressed in height so Fort Wood still shows at the bottom.
    const CX = 1580, SS = 1.06, PH = 0.93; // PH: pedestal height compression
    const FY = 300 + Math.round(728 * SS); // soles: torch tip sits just below the quote band
    const WS = SS;                         // pedestal width scale
    const PB = FY + Math.round(400 * PH);   // base of the pedestal proper
    const stoneL = k.id('stoneL'), stoneS = k.id('stoneS'), wallL = k.id('wallL'), wallS = k.id('wallS'), terr = k.id('terr');
    parts.push({
      defs:
        k.linear(stoneL, 0, [[0, '#FBE7DA'], [0.55, '#F0D6CB'], [1, '#DDC0C6']]) +
        k.linear(stoneS, 0, [[0, '#B8A6CC'], [1, '#9C8FC0']]) +
        k.linear(wallL, 90, [[0, '#F5DED0'], [1, '#D9BCC2']]) +
        k.linear(wallS, 90, [[0, '#BBA9CE'], [1, '#A193C2']]) +
        k.linear(terr, 90, [[0, '#B4CB9C'], [1, '#C9D9A4']]),
    });
    {
      let p = '';
      // the island shore beyond the fort
      p += `<path d="M1150 1572V1540Q1220 1506 1330 1500H1880Q1990 1500 2100 1520V1572Z" fill="#A8C49C"/>`;
      p += `<path d="M1150 1541Q1220 1508 1330 1502" stroke="#F6E7DD" stroke-width="4" fill="none" stroke-opacity="0.8"/>`;
      // Trees on the island either side of the fort.
      function treeClump(x0, x1, y, seed, scale, count) {
        const r0 = rng(seed);
        let back = '', mid = '', hi = '', trunks = '';
        for (let i = 0; i < count; i++) {
          const x = x0 + r0() * (x1 - x0), rr = (22 + r0() * 26) * scale, yy = y - r0() * 34 * scale;
          trunks += `M${n(x)} ${n(yy + rr * 0.6)}v${n(rr * 0.7)}`;
          back += `<circle cx="${n(x)}" cy="${n(yy)}" r="${n(rr)}"/>`;
          mid += `<circle cx="${n(x - rr * 0.16)}" cy="${n(yy - rr * 0.2)}" r="${n(rr * 0.74)}"/>`;
          hi += `<circle cx="${n(x - rr * 0.34)}" cy="${n(yy - rr * 0.42)}" r="${n(rr * 0.34)}"/>`;
        }
        return `<path d="${trunks}" stroke="#4B4C7E" stroke-width="5"/><g fill="#3E6F72">${back}</g><g fill="#5D977F">${mid}</g><g fill="#A4C996" fill-opacity="0.75">${hi}</g>`;
      }
      const treesSvg = treeClump(1150, 1330, 1492, 61, 0.95, 16) + treeClump(1830, 2030, 1488, 62, 1, 16);
      p += treesSvg;
      // Fort Wood: an 11-point star, seen from a little above, walls extruded down.
      const fcx = CX, fcy = PB + 34, R = 380, r = 300, sq = 0.13, wh = 30;
      const star = [];
      for (let i = 0; i < 22; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 11;
        const rad = i % 2 ? r : R;
        star.push([fcx + rad * Math.cos(a), fcy + rad * Math.sin(a) * sq]);
      }
      let walls = '';
      for (let i = 0; i < 22; i++) {
        const a = star[i], b = star[(i + 1) % 22];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]);
        const mx = (a[0] + b[0]) / 2 - fcx, my = (a[1] + b[1]) / 2 - fcy;
        if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
        if (ny <= 0) continue; // faces away from us
        walls += `<path d="${poly([a, b, [b[0], b[1] + wh], [a[0], a[1] + wh]])}" fill="url(#${nx < 0 ? wallL : wallS})"/>`;
      }
      p += walls;
      p += `<path d="${poly(star)}" fill="url(#${terr})"/>`;
      // the parapet: a pale granite coping all round the star
      p += `<path d="${poly(star)}" fill="none" stroke="#FFF1E6" stroke-width="5" stroke-linejoin="round"/>`;
      p += `<path d="${poly(star.map((q) => [fcx + (q[0] - fcx) * 0.93, fcy + (q[1] - fcy) * 0.93]))}" fill="none" stroke="#E6D3CE" stroke-width="3" stroke-opacity="0.7" stroke-linejoin="round"/>`;
      // pedestal foundation: stepped granite plinth on the terrace
      const fw = 200 * WS;
      p += `<path d="M${CX - fw - 34} ${PB + 30}L${CX - fw - 20} ${PB + 14}H${CX + fw + 20}L${CX + fw + 34} ${PB + 30}Z" fill="url(#${stoneL})"/>`;
      p += `<path d="M${CX - fw - 18} ${PB + 16}L${CX - fw - 6} ${PB}H${CX + fw + 6}L${CX + fw + 18} ${PB + 16}Z" fill="url(#${stoneL})"/>`;
      p += `<path d="M${CX + fw + 20} ${PB + 14}L${CX + fw + 34} ${PB + 30}h26L${CX + fw + 42} ${PB + 14}Z" fill="url(#${stoneS})"/>`;
      p += `<path d="M${CX - fw - 34} ${PB + 30}H${CX + fw + 60}" stroke="#9E8FBF" stroke-width="3" stroke-opacity="0.55"/>`;
      p += `<path d="M${CX - fw - 20} ${PB + 14}H${CX + fw + 20}M${CX - fw - 6} ${PB}H${CX + fw + 6}" stroke="#FFF4EC" stroke-width="3"/>`;
      p += `<path d="M${CX - fw - 18} ${PB + 16}H${CX + fw + 18}" stroke="#B9A3C3" stroke-width="2.5" stroke-opacity="0.6"/>`;
      parts.push({ svg: p });

      // The pedestal proper (Richard Morris Hunt, 1886): front face lit, a sliver
      // of the shaded right face.
      let q = '';
      const y0 = FY;                 // statue's own plinth
      const yO = FY + Math.round(18 * PH);   // observation balcony
      const yF = FY + Math.round(50 * PH);   // frieze of discs
      const yL0 = FY + Math.round(104 * PH); // top of the loggia section (under cornice)
      const yL1 = FY + Math.round(262 * PH); // bottom of the loggia section
      const yA = FY + Math.round(284 * PH);  // top of the lower shaft
      const half = (y) => (126 + (y - yL0) * 0.1) * WS;
      const side = (x0, ya, x1, yb, w0, w1) => `<path d="M${n(x0)} ${n(ya)}L${n(x1)} ${n(yb)}h${n(w1)}L${n(x0 + w0)} ${n(ya)}Z" fill="url(#${stoneS})"/>`;
      // lower shaft, flaring to the base
      const hA = half(yA) + 6, hB = 196 * WS;
      q += `<path d="M${n(CX - hA)} ${yA}L${n(CX - hB)} ${PB}H${n(CX + hB)}L${n(CX + hA)} ${yA}Z" fill="url(#${stoneL})"/>`;
      q += side(CX + hA, yA, CX + hB, PB, 26, 30);
      let courses = '';
      for (let y = yA + 22, row = 0; y < PB - 4; y += 22, row++) {
        const hw = hA + (hB - hA) * ((y - yA) / (PB - yA));
        courses += `M${n(CX - hw)} ${y}H${n(CX + hw)}`;
        for (let x = -hw + (row % 2 ? 36 : 72); x < hw - 20; x += 72) courses += `M${n(CX + x)} ${y}v-22`;
      }
      q += `<path d="${courses}" stroke="#BBA2BE" stroke-width="2" stroke-opacity="0.35"/>`;
      // corner quoins on the lower shaft
      for (let y = yA + 4, i = 0; y < PB - 10; y += 22, i++) {
        const hw = hA + (hB - hA) * ((y - yA) / (PB - yA));
        q += `<rect x="${n(CX - hw + 2)}" y="${y}" width="${i % 2 ? 30 : 44}" height="18" fill="#FFF3EA" fill-opacity="0.55"/>`;
      }
      // central arched recess on the lower shaft
      q += `<path d="M${CX - 34} ${PB}V${yA + 80}A34 34 0 0 1 ${CX + 34} ${yA + 80}V${PB}Z" fill="#BCA8CB"/>`;
      q += `<path d="M${CX - 34} ${PB}V${yA + 80}A34 34 0 0 1 ${CX + 34} ${yA + 80}" fill="none" stroke="#FFF3EA" stroke-width="5"/>`;
      q += `<path d="M${CX + 10} ${PB}V${yA + 84}A24 24 0 0 0 ${CX - 10} ${yA + 62}" fill="none" stroke="#9F8DBE" stroke-width="3" stroke-opacity="0.6"/>`;
      // belt course
      const hBelt = half(yL1) + 18;
      q += `<rect x="${n(CX - hBelt)}" y="${yL1}" width="${n(2 * hBelt)}" height="16" fill="#FFF1E7"/>`;
      q += `<rect x="${n(CX - hBelt)}" y="${yL1 + 16}" width="${n(2 * hBelt)}" height="6" fill="#CDB6CB"/>`;
      q += `<path d="M${n(CX + hBelt)} ${yL1}h24v22h-24Z" fill="url(#${stoneS})"/>`;
      // loggia section
      q += `<path d="M${n(CX - half(yL0))} ${yL0}L${n(CX - half(yL1))} ${yL1}H${n(CX + half(yL1))}L${n(CX + half(yL0))} ${yL0}Z" fill="url(#${stoneL})"/>`;
      q += side(CX + half(yL0), yL0, CX + half(yL1), yL1, 24, 26);
      for (const sgn of [-1, 1]) {
        for (let y = yL0 + 6, i = 0; y < yL1 - 10; y += 18, i++) {
          const hw = half(y), w = i % 2 ? 26 : 38;
          q += `<rect x="${n(sgn < 0 ? CX - hw : CX + hw - w)}" y="${y}" width="${w}" height="14" fill="#FFF3EA" fill-opacity="${sgn < 0 ? 0.6 : 0.35}"/>`;
        }
      }
      // the loggia: a deep recess with a balustraded balcony and two pairs of columns
      const lw = 76 * WS;
      q += `<path d="M${n(CX - lw)} ${yL1 - 18}V${yL0 + 26}H${n(CX + lw)}V${yL1 - 18}Z" fill="#A595C6"/>`;
      q += `<path d="M${n(CX - lw)} ${yL0 + 26}H${n(CX + lw)}V${yL0 + 46}H${n(CX - lw)}Z" fill="#8477B2"/>`;
      // the back wall of the loggia: a tall arched opening between the column pairs
      q += `<path d="M${CX - 18} ${yL1 - 18}V${yL0 + 70}A18 18 0 0 1 ${CX + 18} ${yL0 + 70}V${yL1 - 18}Z" fill="#6F64A4"/>`;
      q += `<path d="M${CX - 18} ${yL1 - 18}V${yL0 + 70}A18 18 0 0 1 ${CX + 18} ${yL0 + 70}" fill="none" stroke="#C8B6D6" stroke-width="3"/>`;
      for (const x of [-60, -38, 38, 60]) q += `<rect x="${n(CX + x * WS + 8)}" y="${yL0 + 46}" width="9" height="${yL1 - yL0 - 66}" fill="#7E71AE" fill-opacity="0.6"/>`;
      q += `<path d="M${n(CX + lw)} ${yL0 + 26}V${yL1 - 18}H${n(CX + lw - 14)}V${yL0 + 40}Z" fill="#8F82B8"/>`;
      for (const x of [-60, -38, 38, 60]) {
        const cx = CX + x * WS;
        q += `<rect x="${n(cx - 7)}" y="${yL0 + 30}" width="14" height="${yL1 - yL0 - 50}" fill="#F7E6DB"/>`;
        q += `<rect x="${n(cx + 2)}" y="${yL0 + 30}" width="5" height="${yL1 - yL0 - 50}" fill="#C9B2C8"/>`;
        q += `<rect x="${n(cx - 10)}" y="${yL0 + 26}" width="20" height="7" fill="#FFF5EE"/>`;
        q += `<rect x="${n(cx - 10)}" y="${yL1 - 26}" width="20" height="6" fill="#FFF5EE"/>`;
      }
      q += `<rect x="${n(CX - lw - 10)}" y="${yL1 - 22}" width="${n(2 * lw + 20)}" height="8" fill="#FFF5EE"/>`;
      let bal = '';
      for (let x = -lw + 4; x <= lw - 4; x += 8) bal += `M${n(CX + x)} ${yL1 - 14}v12`;
      q += `<path d="${bal}" stroke="#E2CDD3" stroke-width="3.4"/>`;
      // cornice
      const hc = half(yL0) + 18;
      q += `<path d="M${n(CX - hc)} ${yL0}L${n(CX - hc + 10)} ${yL0 - 16}H${n(CX + hc - 10)}L${n(CX + hc)} ${yL0}Z" fill="#FFF3EA"/>`;
      q += `<path d="M${n(CX - hc)} ${yL0}H${n(CX + hc)}" stroke="#CDB6CB" stroke-width="4"/>`;
      q += side(CX + hc - 10, yL0 - 16, CX + hc, yL0, 22, 24);
      // frieze with the row of round discs
      const hf = 116 * WS;
      q += `<rect x="${n(CX - hf)}" y="${yF}" width="${n(2 * hf)}" height="${yL0 - 16 - yF}" fill="url(#${stoneL})"/>`;
      q += `<path d="M${n(CX + hf)} ${yF}h22v${yL0 - 16 - yF}h-22Z" fill="url(#${stoneS})"/>`;
      for (let i = 0; i < 8; i++) {
        const x = CX - hf + 20 + i * ((2 * hf - 40) / 7), cy = yF + (yL0 - 16 - yF) / 2;
        q += `<circle cx="${n(x)}" cy="${n(cy)}" r="11" fill="#E4CAC6"/><circle cx="${n(x - 1.5)}" cy="${n(cy - 1.5)}" r="7" fill="#FFF3EA" fill-opacity="0.85"/>`;
      }
      // observation balcony
      const ho = 132 * WS;
      q += `<rect x="${n(CX - ho - 6)}" y="${yF - 8}" width="${n(2 * ho + 12)}" height="10" fill="#FFF3EA"/>`;
      q += `<path d="M${n(CX + ho + 6)} ${yF - 8}h22v10h-22Z" fill="url(#${stoneS})"/>`;
      q += `<rect x="${n(CX - ho)}" y="${yO}" width="${n(2 * ho)}" height="${yF - 8 - yO}" fill="url(#${stoneL})"/>`;
      let posts = '';
      for (let x = -ho + 6; x <= ho - 6; x += 9) posts += `M${n(CX + x)} ${yO + 4}v${yF - 16 - yO}`;
      q += `<path d="${posts}" stroke="#C9B1C7" stroke-width="3.4"/>`;
      q += `<rect x="${n(CX - ho - 4)}" y="${yO - 4}" width="${n(2 * ho + 8)}" height="7" fill="#FFF3EA"/>`;
      // the statue's own square plinth
      const hp = 104 * WS;
      q += `<rect x="${n(CX - hp)}" y="${y0}" width="${n(2 * hp)}" height="${yO - 4 - y0}" fill="url(#${stoneL})"/>`;
      q += `<path d="M${n(CX + hp)} ${y0}h16v${yO - 4 - y0}h-16Z" fill="url(#${stoneS})"/>`;
      // a warm rim of sunlight down the left edges
      q += `<path d="M${n(CX - half(yL0))} ${yL0}L${n(CX - half(yL1))} ${yL1}M${n(CX - hA)} ${yA}L${n(CX - hB)} ${PB}" stroke="#FFD6B4" stroke-width="5" stroke-opacity="0.8"/>`;
      // the statue's soft shadow falling on the plinth
      q += `<ellipse cx="${CX + 10}" cy="${y0 + 4}" rx="${n(96 * SS)}" ry="6" fill="#7C6CA8" fill-opacity="0.3"/>`;
      parts.push({ svg: q });

    }

    // ---- the Statue -------------------------------------------------------------------------
    // Local frame: origin at the centre of the soles, y up is negative; at SS = 1
    // 15.5 units ≈ 1 m (torch tip ≈ 46 m above the heel). Light from the left
    // (the sunrise): mint highlights on her right side, blue-violet shadow on
    // her left, a warm apricot rim along the lit silhouette.
    {
      const cu = k.id('cu'), cuV = k.id('cuV'), cuP = k.id('cuP'), flame = k.id('flame'), flameIn = k.id('flameIn'), tabG = k.id('tab'), raysL = k.id('rayL'), raysD = k.id('rayD'), ao = k.id('ao'), hair = k.id('hair');
      const DARK = '#285B7C', DEEP = '#33458C', MINT = '#DDF8EC', RIM = '#FFD3B0';
      let s = '';
      // bezier helper for the rolled edge of the mantle
      const bz = (p0, p1, p2, p3, t) => {
        const u = 1 - t;
        return [0, 1].map((j) => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j]);
      };

      // -- robe (chiton), main body
      const hemPts = [];
      for (let i = 0; i <= 14; i++) hemPts.push([-88 + i * (174 / 14), i % 2 ? 3 : -4]);
      const hem = hemPts.map((p, i) => (i ? `Q${n(p[0] - 6)} ${n(p[1] + 9)} ${n(p[0])} ${n(p[1])}` : '')).join('');
      const body = `M-14 -442C-32 -436 -50 -430 -60 -414C-70 -396 -71 -370 -68 -340C-65 -300 -64 -270 -68 -240C-72 -200 -76 -150 -79 -100C-82 -60 -85 -30 -88 -4${hem}L86 -10C84 -60 82 -120 84 -170C86 -220 92 -260 90 -300C88 -340 78 -382 64 -406C54 -420 36 -434 14 -442Z`;
      s += `<path d="${body}" fill="url(#${cu})"/>`;
      // grounding: deepen toward the feet
      s += `<path d="${body}" fill="url(#${ao})"/>`;
      // chiton folds below the mantle: tubular pleats, dark wedges + lit edges
      const lowFolds = [[-72, -112, 7], [-58, -100, 9], [-42, -116, 8], [-26, -104, 10], [-10, -112, 8], [6, -100, 10], [22, -108, 8], [38, -96, 10], [54, -100, 8], [70, -92, 9]];
      let wedges = '', lits = '';
      for (const [x, top, w] of lowFolds) {
        wedges += `M${x} ${top}C${n(x - w * 0.2)} ${n(top * 0.62)} ${n(x - w * 0.7)} ${n(top * 0.3)} ${n(x - w * 0.55)} -1L${n(x + w * 0.45)} 2C${n(x + w * 0.4)} ${n(top * 0.3)} ${n(x + w * 0.2)} ${n(top * 0.62)} ${x} ${top}Z`;
        lits += `M${n(x - w - 3)} ${top + 12}C${n(x - w - 4)} ${n(top * 0.6)} ${n(x - w * 1.3 - 3)} ${n(top * 0.3)} ${n(x - w * 1.2 - 3)} -6`;
      }
      s += `<path d="${wedges}" fill="${DEEP}" fill-opacity="0.34"/>`;
      s += `<path d="${lits}" stroke="${MINT}" stroke-width="2.6" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      // chest: the chiton gathered toward her left shoulder, and the bust
      let cf = '';
      for (let i = 0; i < 5; i++) cf += `M${44 - i * 9} ${-412 + i * 2}C${30 - i * 12} ${-384 + i * 4} ${8 - i * 13} ${-356 + i * 6} ${-18 - i * 9} ${-334 + i * 11}`;
      s += `<path d="${cf}" stroke="${DARK}" stroke-width="3" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-46 -380C-36 -360 -16 -356 -4 -366M10 -372C20 -360 34 -360 42 -372" stroke="${MINT}" stroke-width="2.4" stroke-opacity="0.45" fill="none" stroke-linecap="round"/>`;
      // shadow under the raised arm, down her right side
      s += `<path d="M-60 -414C-70 -396 -71 -370 -68 -340C-58 -352 -50 -380 -44 -410Z" fill="${DEEP}" fill-opacity="0.22"/>`;

      // -- palla: the mantle, rolled edge from her left shoulder to her right hip
      const palla = `M50 -414C32 -372 -8 -312 -64 -258C-68 -230 -72 -190 -75 -150C-68 -138 -60 -134 -50 -140L-42 -126C-30 -132 -22 -128 -12 -120L-4 -130C8 -122 18 -122 28 -116L36 -126C50 -118 60 -110 70 -100L76 -110C80 -104 84 -98 86 -94C84 -140 84 -190 88 -240C92 -280 90 -330 82 -362C76 -386 66 -402 50 -414Z`;
      s += `<path d="${palla}" fill="url(#${cuP})"/>`;
      // the chiton in the shadow just below the mantle's hem
      s += `<path d="M-75 -150C-68 -138 -60 -134 -50 -140L-42 -126C-30 -132 -22 -128 -12 -120L-4 -130C8 -122 18 -122 28 -116L36 -126C50 -118 60 -110 70 -100L76 -110C80 -104 84 -98 86 -94" stroke="${DEEP}" stroke-width="7" stroke-opacity="0.28" fill="none" transform="translate(0 6)"/>`;
      s += `<path d="M-75 -150C-68 -138 -60 -134 -50 -140L-42 -126C-30 -132 -22 -128 -12 -120L-4 -130C8 -122 18 -122 28 -116L36 -126C50 -118 60 -110 70 -100L76 -110C80 -104 84 -98 86 -94" stroke="${MINT}" stroke-width="2" stroke-opacity="0.55" fill="none"/>`;
      // swag folds: crescents hanging from her left side, tapering to the right hip
      const swags = [[-352, -64, -250, 9], [-312, -68, -214, 11], [-270, -70, -184, 10], [-228, -72, -160, 12], [-186, -60, -142, 9]];
      let sw = '', swh = '';
      for (const [y0, xe, ye, w] of swags) {
        sw += `M84 ${y0}C${54} ${y0 + 34} ${10} ${ye - 6} ${xe} ${ye}C${14} ${ye + 2} ${56} ${y0 + 44 + w} ${86} ${y0 + w + 6}Z`;
        swh += `M80 ${y0 - 10}C${50} ${y0 + 22} ${8} ${ye - 20} ${xe + 8} ${ye - 12}`;
      }
      s += `<path d="${sw}" fill="${DEEP}" fill-opacity="0.3"/>`;
      s += `<path d="${swh}" stroke="${MINT}" stroke-width="2.8" stroke-opacity="0.55" fill="none" stroke-linecap="round"/>`;
      // cascade of the mantle down her left side (under the tablet)
      s += `<path d="M80 -330C76 -270 74 -190 78 -104L86 -96C84 -150 84 -220 88 -280Z" fill="${DEEP}" fill-opacity="0.35"/>`;
      s += `<path d="M66 -250C62 -200 62 -150 66 -106" stroke="${DEEP}" stroke-width="4" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>`;
      // the rolled edge: a twisted rope of fabric
      const R0 = [50, -414], R1 = [32, -372], R2 = [-8, -312], R3 = [-64, -258];
      s += `<path d="M${R0[0]} ${R0[1]}C${R1[0]} ${R1[1]} ${R2[0]} ${R2[1]} ${R3[0]} ${R3[1]}" stroke="${DEEP}" stroke-width="14" stroke-opacity="0.3" fill="none" stroke-linecap="round" transform="translate(3 7)"/>`;
      const rollD = `M${R0[0]} ${R0[1]}C${R1[0]} ${R1[1]} ${R2[0]} ${R2[1]} ${R3[0]} ${R3[1]}`;
      s += `<path d="${rollD}" stroke="#5E9FA0" stroke-width="17" fill="none" stroke-linecap="round"/>`;
      s += `<path d="${rollD}" stroke="#8ED2BE" stroke-width="12" fill="none" stroke-linecap="round" transform="translate(-1.5 -2)"/>`;
      s += `<path d="${rollD}" stroke="${MINT}" stroke-width="3.2" stroke-opacity="0.85" fill="none" stroke-linecap="round" transform="translate(-3 -5)"/>`;
      let twist = '';
      for (let i = 1; i < 12; i++) {
        const t = i / 12, p = bz(R0, R1, R2, R3, t);
        twist += `M${n(p[0] - 4)} ${n(p[1] - 7)}q5 4 7 12`;
      }
      s += `<path d="${twist}" stroke="${DARK}" stroke-width="2" stroke-opacity="0.32" fill="none" stroke-linecap="round"/>`;
      // the right foot stepping out from under the hem
      s += `<path d="M-40 -2C-38 -12 -22 -14 -16 -6C-14 0 -18 4 -26 4H-40Z" fill="url(#${cu})"/><path d="M-38 -4C-32 -10 -24 -10 -20 -6" stroke="${MINT}" stroke-width="2" fill="none" stroke-opacity="0.7"/>`;

      // -- tablet (left arm): keystone-shaped, tilted out, inscribed JULY IV MDCCLXXVI
      let tb = '';
      tb += `<path d="M29 -58L37 -54L32 60L25 58Z" fill="#3D579A"/>`;
      tb += `<path d="M-29 -58H29L25 58H-25Z" fill="url(#${tabG})"/>`;
      tb += `<path d="M-29 -58H29" stroke="${MINT}" stroke-width="3" stroke-opacity="0.9"/>`;
      tb += `<path d="M-27 -54L-24 54" stroke="${MINT}" stroke-width="2.5" stroke-opacity="0.7"/>`;
      tb += `<path d="M-22 -50H22L19 50H-19Z" fill="none" stroke="${DARK}" stroke-width="1.4" stroke-opacity="0.3"/>`;
      tb += `<g font-family="Libre Caslon Text" fill="${DARK}" fill-opacity="0.62" text-anchor="middle" letter-spacing="0.6"><text x="0" y="-6" font-size="10.5">JULY IV</text><text x="0" y="11" font-size="8.4">MDCCLXXVI</text></g>`;
      // shadow the tablet casts on the robe
      s += `<path d="M44 -380L90 -372L84 -262L44 -270Z" fill="${DEEP}" fill-opacity="0.22"/>`;
      s += `<g transform="translate(72 -328) rotate(10)">${tb}</g>`;
      // left hand under the tablet's lower edge, forearm in the mantle
      s += `<path d="M88 -238C92 -262 82 -276 74 -282L60 -262C70 -258 76 -250 80 -232Z" fill="url(#${cuP})"/>`;
      s += `<path d="M42 -280C48 -292 64 -294 72 -284C76 -276 70 -268 60 -266C52 -264 44 -270 42 -280Z" fill="url(#${cu})"/>`;
      s += `<path d="M50 -278h16M52 -272h14" stroke="${DARK}" stroke-width="2" stroke-opacity="0.45"/>`;
      s += `<path d="M46 -284Q54 -292 66 -290" stroke="${MINT}" stroke-width="2" stroke-opacity="0.7" fill="none"/>`;

      // -- crown rays (behind the head and the arm)
      const HS = 1.16; // the head is drawn a touch larger than life, for presence
      let rays = '';
      for (const deg of [-80, -53, -26, 0, 26, 53, 80]) {
        const a = ((deg - 90) * Math.PI) / 180;
        const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
        const ox = 0, oy = -508;
        const r0 = 22, r1 = deg === 0 ? 86 : 80, bw = 9;
        const b1 = [ox + ux * r0 - px * bw, oy + uy * r0 - py * bw], b2 = [ox + ux * r0 + px * bw, oy + uy * r0 + py * bw];
        const m = [ox + ux * r0, oy + uy * r0], t = [ox + ux * r1, oy + uy * r1];
        rays += `<path d="${poly([b1, t, m])}" fill="url(#${raysL})"/><path d="${poly([m, t, b2])}" fill="url(#${raysD})"/>`;
        rays += `<path d="M${n(m[0])} ${n(m[1])}L${n(t[0])} ${n(t[1])}" stroke="${MINT}" stroke-width="1.2" stroke-opacity="0.6"/>`;
      }
      s += `<g transform="translate(0 -446) scale(${HS}) translate(0 446)">${rays}</g>`;

      // -- raised right arm with the torch
      s += `<path d="M-64 -406C-72 -440 -84 -500 -92 -560L-100 -594L-72 -596C-68 -562 -58 -502 -48 -456C-44 -440 -38 -430 -26 -424Z" fill="url(#${cu})"/>`;
      s += `<path d="M-64 -420C-72 -460 -82 -520 -91 -580" stroke="${RIM}" stroke-width="4" stroke-opacity="0.85" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-56 -470C-62 -510 -70 -550 -76 -590" stroke="${DEEP}" stroke-width="7" stroke-opacity="0.25" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-84 -548Q-80 -540 -72 -540" stroke="${DARK}" stroke-width="2" stroke-opacity="0.35" fill="none"/>`;
      // the sleeve, fallen back to the shoulder in heavy folds
      s += `<path d="M-70 -400C-80 -426 -88 -456 -92 -486C-84 -478 -70 -476 -56 -484C-50 -462 -40 -442 -24 -428C-36 -414 -54 -404 -70 -400Z" fill="url(#${cu})"/>`;
      s += `<path d="M-80 -484C-74 -490 -64 -490 -58 -484C-64 -482 -72 -482 -80 -484Z" fill="${DEEP}" fill-opacity="0.3"/>`;
      s += `<path d="M-84 -470C-78 -448 -68 -430 -56 -416M-74 -478C-66 -458 -56 -440 -44 -426M-64 -480C-58 -462 -48 -446 -36 -434" stroke="${DARK}" stroke-width="3" stroke-opacity="0.35" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-92 -486C-84 -478 -70 -476 -56 -484" stroke="${MINT}" stroke-width="3" stroke-opacity="0.8" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M-88 -470C-84 -446 -78 -428 -70 -410" stroke="${RIM}" stroke-width="3" stroke-opacity="0.7" fill="none" stroke-linecap="round"/>`;
      // torch: handle, stem, cup, balcony and the gilded flame
      let tc = '';
      tc += `<path d="M-92 -598L-90 -580H-80L-78 -598Z" fill="url(#${cuV})"/>`;
      tc += `<path d="M-94 -624H-76L-74 -646H-96Z" fill="url(#${cuV})"/>`;
      tc += `<path d="M-98 -632H-72" stroke="${MINT}" stroke-width="2" stroke-opacity="0.6"/>`;
      tc += `<path d="M-102 -646H-68L-56 -670H-114Z" fill="url(#${cuV})"/>`;
      tc += `<path d="M-100 -652Q-96 -660 -104 -666M-90 -650V-668M-78 -650V-668M-70 -652Q-72 -660 -64 -666" stroke="${DARK}" stroke-width="1.6" stroke-opacity="0.45" fill="none"/>`;
      tc += `<ellipse cx="-85" cy="-672" rx="34" ry="6.5" fill="#86CBB8"/>`;
      let rail = '';
      for (let x = -116; x <= -54; x += 6) rail += `M${x} -672v-10`;
      tc += `<path d="${rail}" stroke="#4E8E95" stroke-width="2"/>`;
      tc += `<path d="M-118 -682H-52" stroke="#6DB3A8" stroke-width="2.8" stroke-linecap="round"/>`;
      tc += `<path d="M-102 -680C-114 -694 -106 -708 -96 -716C-96 -708 -90 -704 -86 -708C-86 -716 -82 -724 -76 -728C-76 -716 -64 -706 -64 -692C-64 -686 -66 -682 -68 -680Z" fill="url(#${flame})"/>`;
      tc += `<path d="M-98 -682C-104 -692 -100 -704 -94 -710C-92 -700 -86 -696 -82 -700C-82 -708 -78 -716 -76 -720C-76 -706 -84 -690 -84 -682Z" fill="url(#${flameIn})"/>`;
      tc += `<path d="M-74 -684C-72 -694 -72 -704 -76 -712" stroke="#C47C1C" stroke-width="2.2" stroke-opacity="0.55" fill="none" stroke-linecap="round"/>`;
      s += tc;
      // fist around the torch handle
      s += `<path d="M-102 -600C-104 -614 -98 -626 -86 -626C-74 -626 -70 -614 -72 -602C-74 -592 -98 -590 -102 -600Z" fill="url(#${cu})"/>`;
      s += `<path d="M-100 -614H-76M-100 -606H-76" stroke="${DARK}" stroke-width="2" stroke-opacity="0.4"/>`;
      s += `<path d="M-100 -612C-100 -620 -94 -624 -88 -624" stroke="${MINT}" stroke-width="2.4" stroke-opacity="0.85" fill="none"/>`;

      // -- head (scaled about the chin for presence)
      let hd = '';
      hd += `<path d="M-12 -452L-15 -424H15L12 -452Z" fill="url(#${cu})"/>`;
      hd += `<path d="M-10 -448Q0 -440 10 -448L12 -438Q0 -432 -12 -438Z" fill="${DEEP}" fill-opacity="0.35"/>`;
      // hair mass, waved, gathered at the nape
      hd += `<path d="M0 -532C21 -532 31 -517 31 -499C31 -484 28 -472 24 -463C21 -457 19 -452 15 -448L-15 -448C-19 -452 -21 -457 -24 -463C-28 -472 -31 -484 -31 -499C-31 -517 -21 -532 0 -532Z" fill="url(#${hair})"/>`;
      hd += `<path d="M-25 -504C-30 -494 -26 -486 -29 -477C-26 -470 -27 -464 -22 -458M26 -504C30 -494 27 -486 29 -477C26 -470 27 -464 22 -458" stroke="${DARK}" stroke-width="2.2" stroke-opacity="0.45" fill="none" stroke-linecap="round"/>`;
      hd += `<path d="M-28 -500C-31 -490 -27 -482 -30 -472" stroke="${MINT}" stroke-width="2" stroke-opacity="0.7" fill="none" stroke-linecap="round"/>`;
      // face
      const face = 'M0 -526C14 -526 21 -513 21 -497C21 -481 17 -466 10 -455C6 -449 3 -446 0 -446C-3 -446 -6 -449 -10 -455C-17 -466 -21 -481 -21 -497C-21 -513 -14 -526 0 -526Z';
      hd += `<path d="${face}" fill="url(#${cu})"/>`;
      hd += `<path d="M5 -502C10 -488 12 -472 7 -456C14 -462 20 -476 21 -492C21 -500 18 -506 14 -508Z" fill="${DEEP}" fill-opacity="0.26"/>`;
      // brow ridge shadow, eyes, nose, lips, chin
      hd += `<path d="M-16 -490Q-9 -494 -2 -490L-3 -486Q-9 -489 -15 -486ZM2 -490Q9 -494 16 -490L15 -486Q9 -489 3 -486Z" fill="${DEEP}" fill-opacity="0.35"/>`;
      hd += `<path d="M-14 -483Q-9 -486 -4 -483Q-9 -480.5 -14 -483ZM4 -483Q9 -486 14 -483Q9 -480.5 4 -483Z" fill="${DARK}" fill-opacity="0.75"/>`;
      hd += `<path d="M-1 -488L-2 -472" stroke="${MINT}" stroke-width="2" stroke-opacity="0.6" stroke-linecap="round"/>`;
      hd += `<path d="M1 -488L4 -470Q1 -467 -4 -469" stroke="${DARK}" stroke-width="1.8" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      hd += `<path d="M2 -486L5 -470L1 -469Z" fill="${DEEP}" fill-opacity="0.3"/>`;
      hd += `<path d="M-6 -461.5Q-3 -462.5 0 -461.5Q3 -462.5 6 -461.5" stroke="${DARK}" stroke-width="1.8" stroke-opacity="0.6" fill="none" stroke-linecap="round"/>`;
      hd += `<path d="M-4 -457Q0 -454.5 4 -457" stroke="${DEEP}" stroke-width="2" stroke-opacity="0.3" fill="none"/>`;
      hd += `<path d="M-5 -450Q0 -447 5 -450" stroke="${DEEP}" stroke-width="1.6" stroke-opacity="0.3" fill="none"/>`;
      hd += `<path d="M-17 -480C-17 -472 -14 -466 -11 -462" stroke="${MINT}" stroke-width="2.4" stroke-opacity="0.45" fill="none" stroke-linecap="round"/>`;
      hd += `<path d="M-12 -510Q-6 -514 0 -514" stroke="${MINT}" stroke-width="2" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>`;
      hd += `<path d="M-22 -500C-22 -514 -14 -526 0 -526" stroke="${RIM}" stroke-width="2.2" stroke-opacity="0.75" fill="none"/>`;
      // diadem with its row of windows
      hd += `<path d="M-32 -503Q0 -495 32 -503L31 -518Q0 -511 -31 -518Z" fill="url(#${cuV})"/>`;
      hd += `<path d="M-31 -518Q0 -511 31 -518" stroke="${MINT}" stroke-width="2.4" stroke-opacity="0.9" fill="none"/>`;
      hd += `<path d="M-32 -503Q0 -495 32 -503" stroke="${DEEP}" stroke-width="1.6" stroke-opacity="0.4" fill="none"/>`;
      let win = '';
      for (let i = -3; i <= 3; i++) {
        const x = i * 8.4, y = -509.5 + Math.abs(i) * 0.25 - (3 - Math.abs(i)) * 0.55;
        win += `<rect x="${n(x - 2.5)}" y="${n(y - 2.7)}" width="5" height="5.4" rx="1"/>`;
      }
      hd += `<g fill="#1C3A66" fill-opacity="0.8">${win}</g>`;
      s += `<g transform="translate(0 -446) scale(${HS}) translate(0 446)">${hd}</g>`;

      // warm rim light along the sunlit left silhouette of the robe
      s += `<path d="M-60 -404C-70 -390 -71 -366 -68 -340C-65 -300 -64 -270 -68 -240C-72 -200 -76 -150 -79 -100C-82 -60 -85 -30 -88 -6" stroke="${RIM}" stroke-width="3.5" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>`;

      const torchGlow2 = k.id('tg2');
      parts.push({
        defs:
          lgU(cu, -100, 0, 100, 0, [[0, '#B8EAD9'], [0.2, '#8CD0BC'], [0.48, '#62AFA3'], [0.76, '#4A889E'], [1, '#3D5A9E']]) +
          lgU(cuV, -120, 0, 30, 0, [[0, '#A8E2D0'], [0.5, '#70BCAB'], [1, '#4A8A9C']]) +
          lgU(cuP, -80, -330, 96, -170, [[0, '#A4E0CE'], [0.35, '#72BFAE'], [0.75, '#4D8EA1'], [1, '#40609F']]) +
          lgU(tabG, -29, -58, 29, 58, [[0, '#B0E6D6'], [0.5, '#7CC5B4'], [1, '#5A9BA2']]) +
          lgU(raysL, -70, -560, 70, -560, [[0, '#B8EBDA'], [1, '#8ACFBB']]) +
          lgU(raysD, -70, -560, 70, -560, [[0, '#5FA9A1'], [1, '#41709F']]) +
          lgU(ao, 0, -200, 0, 0, [[0, '#33458C', 0], [1, '#33458C', 0.28]]) +
          lgU(hair, -33, 0, 33, 0, [[0, '#8DD2BE'], [0.5, '#5FA9A0'], [1, '#3F6A9C']]) +
          lgU(flame, 0, -730, 0, -678, [[0, '#FFE9A6'], [0.45, '#F6C24F'], [1, '#E0912E']]) +
          lgU(flameIn, 0, -722, 0, -680, [[0, '#FFFBE6'], [1, '#FFD978']]) +
          k.radial(torchGlow2, '50%', '50%', '50%', [[0, '#FFF6D8', 0.9], [1, '#FFE9C0', 0]]),
        svg: `<g transform="translate(${CX} ${FY}) scale(${SS})">` +
          `<circle cx="-85" cy="-704" r="70" fill="url(#${torchGlow2})"/>` + s + `</g>`,
      });
    }

    // ---- foreground: beach roses (left), asters (right) --------------------------------
    function rugosa(x, y, rad, rot, seed) {
      const rr = rng(seed);
      const g = k.id('rug');
      const defs = k.radial(g, '50%', '50%', '50%', [[0, '#B83A78'], [0.35, '#DC5C96'], [0.85, '#F08DB8'], [1, '#F8B4D0']]);
      let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">`;
      for (let i = 0; i < 5; i++) {
        const a = i * 72 + rr() * 8;
        const w = rad * 0.62;
        s += `<path transform="rotate(${n(a)})" d="M0 0C${n(-w)} ${n(-rad * 0.3)} ${n(-w * 1.05)} ${n(-rad * 0.95)} ${n(-w * 0.35)} ${n(-rad)}Q0 ${n(-rad * 0.86)} ${n(w * 0.35)} ${n(-rad)}C${n(w * 1.05)} ${n(-rad * 0.95)} ${n(w)} ${n(-rad * 0.3)} 0 0Z" fill="url(#${g})"/>`;
        s += `<path transform="rotate(${n(a)})" d="M0 ${n(-rad * 0.25)}Q${n(-rad * 0.08)} ${n(-rad * 0.6)} ${n(-rad * 0.18)} ${n(-rad * 0.82)}M0 ${n(-rad * 0.25)}Q${n(rad * 0.1)} ${n(-rad * 0.6)} ${n(rad * 0.2)} ${n(-rad * 0.8)}" stroke="#B73C79" stroke-width="${n(rad * 0.025)}" stroke-opacity="0.35" fill="none"/>`;
      }
      s += `<circle r="${n(rad * 0.26)}" fill="#F5C64F"/><circle r="${n(rad * 0.13)}" fill="#E39A32"/>`;
      let dots = '';
      for (let i = 0; i < 16; i++) {
        const a = rr() * Math.PI * 2, d = rad * (0.14 + rr() * 0.14);
        dots += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(Math.sin(a) * d)}" r="${n(rad * 0.03)}"/>`;
      }
      s += `<g fill="#FFF0B0">${dots}</g></g>`;
      return { defs, svg: s };
    }
    function leaflet(x, y, L, ang, fill) {
      const t = `translate(${n(x)} ${n(y)}) rotate(${n(ang)})`;
      let veins = '';
      for (let i = 1; i < 5; i++) veins += `M${n(L * i / 5)} 0l${n(L * 0.1)} ${n(-L * 0.18)}M${n(L * i / 5)} 0l${n(L * 0.1)} ${n(L * 0.18)}`;
      return `<g transform="${t}"><path d="M0 0C${n(L * 0.25)} ${n(-L * 0.32)} ${n(L * 0.75)} ${n(-L * 0.3)} ${n(L)} 0C${n(L * 0.75)} ${n(L * 0.3)} ${n(L * 0.25)} ${n(L * 0.32)} 0 0Z" fill="${fill}"/>` +
        `<path d="M0 0L${n(L * 0.92)} 0${veins}" stroke="#16443A" stroke-width="1.8" stroke-opacity="0.45" fill="none"/></g>`;
    }
    function compoundLeaf(x, y, L, ang, fill, seed) {
      const rr = rng(seed);
      const a = (ang * Math.PI) / 180;
      let s = `<path d="M${n(x)} ${n(y)}L${n(x + Math.cos(a) * L)} ${n(y + Math.sin(a) * L)}" stroke="#2C5E4E" stroke-width="3"/>`;
      for (let i = 1; i <= 3; i++) {
        const t = i / 3.4;
        const px = x + Math.cos(a) * L * t, py = y + Math.sin(a) * L * t;
        const ll = L * (0.42 - i * 0.04);
        s += leaflet(px, py, ll, ang - 55 + (rr() - 0.5) * 10, fill) + leaflet(px, py, ll, ang + 55 + (rr() - 0.5) * 10, fill);
      }
      s += leaflet(x + Math.cos(a) * L * 0.9, y + Math.sin(a) * L * 0.9, L * 0.36, ang, fill);
      return s;
    }
    function roseBush() {
      const rr = rng(4242);
      let defs = '', back = '', blooms = '';
      // a dune bank the roses grow from
      const bankX = (y) => (y > 1400 ? 330 + (y - 1400) * 1.34 : Math.max(0, 330 * (y - 1300) / 100));
      back += `<path d="M-20 1572V1300C100 1290 220 1320 330 1400C420 1460 500 1530 560 1572Z" fill="#EBD0BC"/>`;
      back += `<path d="M-20 1572V1370C120 1360 230 1400 320 1460C380 1500 420 1540 440 1572Z" fill="#DFBBA8" fill-opacity="0.75"/>`;
      back += `<path d="M-20 1300C100 1290 220 1320 330 1400C420 1460 500 1530 560 1572" stroke="#FFF4EA" stroke-width="5" fill="none" stroke-opacity="0.8"/>`;
      let grass = '';
      for (let i = 0; i < 46; i++) {
        const y = 1330 + rr() * 240, x = rr() * Math.max(0, bankX(y) - 40), L = 40 + rr() * 70;
        grass += `M${n(x)} ${n(y)}q${n(8 + rr() * 16)} ${n(-L * 0.6)} ${n(14 + rr() * 24)} ${n(-L)}`;
      }
      back += `<path d="${grass}" stroke="#8FA56C" stroke-width="3" fill="none" stroke-linecap="round" stroke-opacity="0.8"/>`;
      for (let i = 0; i < 22; i++) {
        const x = -20 + rr() * 470, y = k.H + 10 - rr() * 330 * Math.max(0.2, 1 - x / 520);
        back += compoundLeaf(x, y, 110 + rr() * 50, -30 - rr() * 120, rr() < 0.5 ? '#2F6E5E' : '#468A6C', 100 + i);
      }
      const spots = [[120, 1390, 72, 10], [300, 1470, 64, 40], [40, 1270, 58, 20], [220, 1310, 46, 70], [420, 1545, 52, 5], [120, 1530, 60, 33]];
      spots.forEach((p, i) => { const f = rugosa(p[0], p[1], p[2], p[3], 600 + i); defs += f.defs; blooms += f.svg; });
      // rose hips
      for (const [x, y, r] of [[300, 1360, 13], [322, 1374, 11], [180, 1240, 12], [380, 1420, 10]]) {
        blooms += `<circle cx="${x}" cy="${y}" r="${r}" fill="#E8553F"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${n(r * 0.3)}" fill="#FFB49A" fill-opacity="0.8"/><path d="M${x} ${y - r}l-5 -8M${x} ${y - r}l5 -8M${x} ${y - r}l0 -9" stroke="#2F6E5E" stroke-width="2.4" stroke-linecap="round"/>`;
      }
      return { defs, svg: back + blooms };
    }
    parts.push(roseBush());

    function aster(x, y, rad, seed) {
      const rr = rng(seed);
      const g = k.id('ast');
      const defs = k.linear(g, 0, [[0, '#4E4FC4'], [0.6, '#7D7BE0'], [1, '#B9B6F4']]);
      let s = `<g transform="translate(${n(x)} ${n(y)}) scale(1 ${n(0.8 + rr() * 0.2)}) rotate(${n(rr() * 40)})">`;
      const count = 22;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * 360 + rr() * 6;
        const L = rad * (0.85 + rr() * 0.2);
        s += `<path transform="rotate(${n(a)})" d="M${n(rad * 0.15)} -2.6Q${n(L * 0.6)} -${n(rad * 0.09)} ${n(L)} 0Q${n(L * 0.6)} ${n(rad * 0.09)} ${n(rad * 0.15)} 2.6Z" fill="url(#${g})"/>`;
      }
      s += `<circle r="${n(rad * 0.26)}" fill="#F2BE4A"/><circle r="${n(rad * 0.26)}" fill="#C97E2A" fill-opacity="0.25"/><circle cx="${n(-rad * 0.07)}" cy="${n(-rad * 0.07)}" r="${n(rad * 0.1)}" fill="#FFE7A0"/></g>`;
      return { defs, svg: s };
    }
    function asterPatch() {
      const rr = rng(8080);
      let defs = '', back = '', front = '';
      // grassy bank
      back += `<path d="M2100 1572V1330Q1990 1340 1900 1420Q1820 1490 1770 1572Z" fill="#B7CC93"/>`;
      back += `<path d="M2100 1572V1400Q2010 1410 1940 1470Q1880 1520 1850 1572Z" fill="#9DBA84"/>`;
      let stems = '', leaves = '';
      const heads = [];
      for (let i = 0; i < 34; i++) {
        const bx = 1790 + rr() * 320, by = k.H + 10;
        const h = 110 + rr() * 290 * Math.min(1, (bx - 1770) / 240);
        const tx = bx - 30 - rr() * 60, ty = by - h;
        stems += `M${n(bx)} ${n(by)}Q${n(bx - 10)} ${n(by - h * 0.6)} ${n(tx)} ${n(ty)}`;
        for (let j = 0; j < 3; j++) {
          const t = 0.3 + j * 0.2;
          const lx = bx + (tx - bx) * t, ly = by - h * t;
          const side = j % 2 ? 1 : -1, L = 34 + rr() * 22;
          leaves += `M${n(lx)} ${n(ly)}q${n(side * L * 0.5)} ${n(-L * 0.4)} ${n(side * L)} ${n(-L * 0.15)}q${n(-side * L * 0.5)} ${n(L * 0.2)} ${n(-side * L)} ${n(L * 0.15)}Z`;
        }
        heads.push([tx, ty, 30 + rr() * 16]);
        // a couple of side heads
        if (rr() < 0.6) { const sx = tx + 30 + rr() * 30, sy = ty + 30 + rr() * 40; stems += `M${n(tx + 6)} ${n(ty + 50)}Q${n(sx - 10)} ${n(sy + 10)} ${n(sx)} ${n(sy)}`; heads.push([sx, sy, 20 + rr() * 10]); }
      }
      back += `<path d="${stems}" stroke="#2F6E5E" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      back += `<path d="${leaves}" fill="#3F7F6A"/>`;
      heads.sort((a, b) => a[1] - b[1]).forEach((h, i) => { const f = aster(h[0], h[1], h[2], 900 + i); defs += f.defs; front += f.svg; });
      return { defs, svg: back + front };
    }
    parts.push(asterPatch());

    return k.spread(parts, { grain: 0.6 });
  },
};
