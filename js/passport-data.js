/* ==========================================================================
   passport-data.js — Joe's travel stamps, and where they're stuck in.

   The visa pages themselves are weathered paper (made by
   tools/build-visa-paper.py into assets/passport/web/visa-NN.webp) with the
   passport's blue printing on them — the VISAS heading, a frame, the page
   number, guide marks quartering the page, microprint — laid over, worn,
   by js/passport.js. The book has exactly as many
   of them as the stamps below fill, in whole spreads, so there are never
   blank pages to leaf through: put a stamp on a later page and the book
   grows to reach it (then rerun the paper build — see tools/README.md).
   ========================================================================== */

/* --------------------------------------------------------------------------
   PASSPORT_STAMPS — Joe's American Express travel stamps, stuck onto the
   visa pages in the order he went, the way a real passport fills up. Each
   is its own element on its page, so it turns with the leaf it's on, and
   each has its country and year rubber-stamped in blue ink just under it.

     stamp   The image: assets/passport/web/stamp-<stamp>.webp, made by
             tools/build-passport.py from "<Country> <Year>.png" in
             assets/passport/ (lowercased, spaces to hyphens).
     name    The country, as it's read out and inked under the stamp (in
             capitals, without a leading "the").
     year    The year on the stamp, inked after the name.
     page    Which visa page, from 1: odd on the left, even on the right.
     at      Where the stamp's centre goes: [across, down], in % of the
             page. A stamp is 36% of the page wide and about 24% tall, with
             its ink mark another ~3% below. Keep it below the VISAS heading
             and the page number's ring (its top edge under ~10 down, so
             centres from ~23), above the
             microprint at the foot (ink ending above ~92), and clear of the
             spine (centres at most ~70 across on a left page, at least ~30
             on a right one).
     tilt    Degrees, clockwise. Small and never quite square: stuck down
             by hand, not by a machine.
     ink     Optional: 'left' or 'right' lines the ink mark up with that
             edge of the stamp instead of centring it — for when another
             stamp covers the middle.

   Four go on a page, two rows of two, one in each quarter the guide marks
   show: centres about 27 and 70 across on a left page (30 and 73 on a
   right), and about 27 and 70 down, each a few points off so it doesn't
   read as a grid. A new stamp takes the next free quarter, then the next
   page. Germany and Iceland were one trip, so they're stuck in together,
   overlapping a little; the rest each have room of their own.
   -------------------------------------------------------------------------- */

window.PASSPORT_STAMPS = [
  { stamp: 'united-states-of-america-2006', name: 'United States', year: 2006, page: 1, at: [27, 27], tilt: -3.2 },
  { stamp: 'mexico-2015', name: 'Mexico', year: 2015, page: 1, at: [70, 31], tilt: 2.6 },
  { stamp: 'germany-2017', name: 'Germany', year: 2017, page: 1, at: [28, 69], tilt: -4.2 },
  { stamp: 'iceland-2017', name: 'Iceland', year: 2017, page: 1, at: [64, 74], tilt: 3.4 },
  { stamp: 'canada-2025', name: 'Canada', year: 2025, page: 2, at: [31, 27], tilt: -2.3 },
  { stamp: 'united-kingdom-2026', name: 'United Kingdom', year: 2026, page: 2, at: [73, 24], tilt: 4.1 },
  { stamp: 'belgium-2026', name: 'Belgium', year: 2026, page: 2, at: [30, 68], tilt: -3.0 },
  { stamp: 'netherlands-2026', name: 'the Netherlands', year: 2026, page: 2, at: [72, 71], tilt: 2.2 },
  { stamp: 'portugal-2026', name: 'Portugal', year: 2026, page: 3, at: [27, 29], tilt: -3.7 },
  { stamp: 'malta-2026', name: 'Malta', year: 2026, page: 3, at: [69, 25], tilt: 2.8 },
  { stamp: 'czech-republic-2026', name: 'Czech Republic', year: 2026, page: 3, at: [29, 70], tilt: -2.7 },
];

/* --------------------------------------------------------------------------
   PASSPORT_COUNTRIES — every country Joe has been to, for the "Countries
   visited" page the passport opens on. Each is stamped on the globes in
   violet, and its flag is stamped under the globe where it sits nearest the
   centre. A country can be here without an Amex stamp in the list above.

     code    ISO 3166 two-letter code, upper case ('GB' for the UK). It's how
             the globes (tools/build-globes.py) find the outline, and names
             the flag: assets/passport/flags/<code in lower case>.svg, the
             1x1 flag from flag-icons (github.com/lipis/flag-icons, MIT).
     name    The country, as it's read out and printed under the flag (in
             capitals, without a leading "the"; two words break onto two
             lines).
     globe   Optional: 'west' or 'east', to put the flag under that globe
             instead of the nearer one.

   In the order Joe went, like the stamps. Adding one is a line here and its
   flag file; the globes never need rebuilding.
   -------------------------------------------------------------------------- */

window.PASSPORT_COUNTRIES = [
  { code: 'US', name: 'the United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'DE', name: 'Germany' },
  { code: 'IS', name: 'Iceland' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'the United Kingdom' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'the Netherlands' },
  { code: 'PT', name: 'Portugal' },
  { code: 'MT', name: 'Malta' },
  { code: 'CZ', name: 'the Czech Republic' },
];
