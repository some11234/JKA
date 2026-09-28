/* ==========================================================================
   travel-data.js — everything the travel page shows. Hand-edited; this is the
   whole "CMS" for /travel/, the same way gallery-data.js is for the gallery.

   TO ADD A COUNTRY
     Copy any entry below and change it. Only `code` and `name` are required;
     everything else is optional and simply doesn't render when missing.

       code       ISO 3166 two-letter code — 'FR', 'IT', 'NL', 'JP'…
                  This is how the globe finds the country's outline, so it
                  must be right: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
                  (the UK is 'GB', not 'UK').
       name       What the card and the globe call it.
       home       true for home. Drawn in white instead of the accent, so
                  "where I'm from" reads differently from "where I've been".
       continent  Feeds the Continents count at the top of the page.
       when       Free text: 'Summer 2027', 'March 2027', 'Spring break'.
       note       A sentence or two for the card.
       photos     Up to two photos for the card's cover — the same path stems
                  gallery-data.js uses (the part after /assets/gallery/web/,
                  without -thumb.webp). `pos` is optional and moves the crop,
                  as a CSS object-position: '50% 20%' keeps the top in frame.
       cities     Each becomes a pin. Get lat/lon by right-clicking the spot in
                  Google Maps — the first line of the menu is "lat, lon".
                  A city with now: true gets the pulsing "Here now" pin; move
                  it when you move. Leave lat/lon off to list a city without
                  pinning it.
       links      Buttons at the bottom of the card, e.g. to a gallery page.

   ORDER is the order of the cards, and so the order the globe flies in as you
   scroll. It's newest-first and runs westward — Brussels, across the Channel,
   across the Atlantic, home.
   ========================================================================== */

var TRAVEL = {

  /* TODO(JOE): this is placeholder copy in your voice — rewrite it. */
  intro: [
    'A running map of everywhere I’ve been so far. Scroll through the ' +
    'list and the globe will fly to each stop, or grab it and give it a spin.'
  ],

  countries: [
    {
      code: 'BE',
      name: 'Belgium',
      continent: 'Europe',
      when: 'Fall 2026',
      note: 'My junior-year semester abroad, studying International Business at ' +
            'the Brussels School of Governance.',
      photos: [
        { file: 'brussels/brussels-dscf0154', pos: '50% 30%',
          alt: 'The Gothic tower of Brussels Town Hall on the Grand-Place' },
        { file: 'brussels/brussels-dscf0223',
          alt: 'A stained glass window glowing in a dark church in Sablon' }
      ],
      cities: [
        { name: 'Brussels', lat: 50.8467, lon: 4.3525, now: true }
      ],
      links: [
        { label: 'Brussels photos', href: '/gallery/brussels/' }
      ]
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      continent: 'Europe',
      when: 'August 2026',
      note: 'London, then up to Edinburgh, on the way to my semester in Brussels.',
      photos: [
        { file: 'london/london-dscf1057',
          alt: 'A London Underground roundel against a blue sky' },
        { file: 'edinburgh/edinburgh-dscf0840',
          alt: 'Colorful shopfronts curving down Victoria Street in Edinburgh' }
      ],
      cities: [
        { name: 'London', lat: 51.5074, lon: -0.1278 },
        { name: 'Edinburgh', lat: 55.9533, lon: -3.1883 }
      ],
      links: [
        { label: 'London photos', href: '/gallery/london/' },
        { label: 'Edinburgh photos', href: '/gallery/edinburgh/' }
      ]
    },
    {
      code: 'CA',
      name: 'Canada',
      continent: 'North America',
      when: 'August 2025',
      note: 'Montréal, including the Biodome and its very photogenic macaws.',
      photos: [
        { file: 'nature-creatures/nature-creatures-img_1332', pos: '50% 40%',
          alt: 'A scarlet macaw perched among tropical leaves at the Montréal Biodome' },
        { file: 'nature-creatures/nature-creatures-img_1432',
          alt: 'A bleached cow skull among cacti in Montréal' }
      ],
      cities: [
        { name: 'Montréal', lat: 45.5019, lon: -73.5674 }
      ],
      links: [
        { label: 'Nature & Creatures', href: '/gallery/nature-creatures/' }
      ]
    },
    {
      code: 'US',
      name: 'United States',
      home: true,
      continent: 'North America',
      note: 'Home is Portland, Oregon. School is UVM, in Burlington, Vermont.',
      photos: [
        { file: 'nighttime/nighttime-img_4783', pos: '50% 60%',
          alt: 'The neon Portland Oregon sign in Old Town at night' },
        { file: 'nature-creatures/nature-creatures-img_6705',
          alt: 'A curly-haired dog on a beach on the Oregon coast' }
      ],
      cities: [
        { name: 'Portland', lat: 45.5152, lon: -122.6784 },
        { name: 'Burlington', lat: 44.4759, lon: -73.2121 },
        { name: 'Lincoln', lat: 40.8136, lon: -96.7026 },
        { name: 'Orlando', lat: 28.3747, lon: -81.5494 },
        { name: 'Big Island', lat: 19.9515, lon: -155.8532 }
      ],
      links: [
        { label: 'Nighttime', href: '/gallery/nighttime/' }
      ]
    }
  ]
};
