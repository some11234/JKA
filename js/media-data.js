/* ==========================================================================
   media-data.js — the whole "CMS" for the two carousels in About.
   Two plain arrays of { src, title, sub }. Edit by hand; nothing else to run.

   `sub` is free text. Music uses "Artist • Album"; the Movies & TV row uses
   "Year • Director or creator" — neither is enforced.

   Art lives in assets/about/album-art/ and assets/about/movies/, exported to
   WebP at 600px (square art) and 900px on the long edge (posters). Originals
   are kept in assets/_originals/media/, which is gitignored.
   ========================================================================== */

const MIXTAPE = [
  { src: "/assets/about/album-art/sing-to-the-moon.webp",
    title: "Green Garden",            sub: "Laura Mvula • Sing to the Moon" },
  { src: "/assets/about/album-art/the-slow-rush-b-sides.webp",
    title: "Breathe Deeper (Lil Yachty Remix)",
                                      sub: "Tame Impala • The Slow Rush B-Sides & Remixes" },
  { src: "/assets/about/album-art/left-of-the-middle.webp",
    title: "Torn",                    sub: "Natalie Imbruglia • Left of the Middle" },
  { src: "/assets/about/album-art/rhinestone-cowboy.webp",
    title: "Rhinestone Cowboy",       sub: "Glen Campbell • Rhinestone Cowboy" },
  { src: "/assets/about/album-art/jagged-little-pill.webp",
    title: "You Oughta Know",         sub: "Alanis Morissette • Jagged Little Pill" },
  { src: "/assets/about/album-art/midwest-princess.webp",
    title: "Naked in Manhattan",      sub: "Chappell Roan • The Rise and Fall of a Midwest Princess" },
  { src: "/assets/about/album-art/london-calling.webp",
    title: "Lost in the Supermarket", sub: "The Clash • London Calling" }

  /* TODO(JOE): two from your list have no art in assets/about/album-art/ yet —
     drop the covers in, export them the same way, and uncomment:

  , { src: "/assets/about/album-art/californication.webp",
      title: "Californication",  sub: "Red Hot Chili Peppers • Californication" }
  , { src: "/assets/about/album-art/something-to-give-each-other.webp",
      title: "Got Me Started",   sub: "Troye Sivan • Something to Give Each Other" }
  */
];

const MOVIES = [
  { src: "/assets/about/movies/andor.webp",
    title: "Andor",                sub: "2022 • Tony Gilroy" },
  { src: "/assets/about/movies/ted-lasso.webp",
    title: "Ted Lasso",            sub: "2020 • Bill Lawrence" },
  { src: "/assets/about/movies/desperate-housewives.webp",
    title: "Desperate Housewives", sub: "2004 • Marc Cherry" },
  { src: "/assets/about/movies/iron-giant.webp",
    title: "The Iron Giant",       sub: "1999 • Brad Bird" },
  { src: "/assets/about/movies/rogue-one.webp",
    title: "Rogue One",            sub: "2016 • Gareth Edwards" }

  /* assets/about/movies/fallout.webp is exported and ready but was not on your
     list — add a row here if you want it in. */
];
