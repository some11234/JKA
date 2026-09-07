/* ==========================================================================
   gallery-data.js — generated from assets/gallery/Originals, then yours to edit.

   Every value below is REAL: the EXIF is read out of your files, and the
   coordinates are the GPS tags your camera and phone recorded. Place names were
   resolved from those coordinates once, at build time, so the site makes no
   network calls of its own.

   SAFE TO EDIT BY HAND. Captions default to the place name — change them to
   whatever you actually want to say, or set caption to '' to show nothing.
   `alt` is what a screen reader announces: the generated text only says where
   the photo was taken, so replacing it with a real description is the single
   most valuable edit here.

   TO ADD PHOTOS
     1. Drop them in the right folder under assets/gallery/Originals/.
     2. Re-run the build script (it reads Originals and writes only to
        assets/gallery/web/ — your originals are never modified).
   TO ADD A COLLECTION
     Make a new folder under Originals/ and add it to the list in the build
     script, or just add an entry here by hand pointing at existing files.

   `file` is the path stem under /assets/gallery/web/ — the code appends
   -thumb.webp (900px, grids) and -large.webp (2000px, lightbox).
   `w`/`h` are the large file's pixel size, already corrected for EXIF
   orientation, and they reserve each tile's space so nothing jumps on load.
   ========================================================================== */

var GALLERY = {

  intro: [
    'I\u2019m pretty new to photography, but I\u2019ve found it to be incredibly fun and ' +
    'rewarding. I love street photography and experimenting with sunlight and shadows. ' +
    'I also jump on any opportunity to photograph exotic birds and wildlife.',

    'Some of my earliest photos were taken on my mom\u2019s T3i or my iPhone. Recently, ' +
    'I bought my first camera, a Fujifilm X-T3. I\u2019m also learning film photography ' +
    'on an Olympus OM-1.'
  ],

  collections: [
    {
      slug: 'london',
      name: 'London',
      blurb: 'I visited London in August 2026, on the way to my semester abroad in Brussels. Despite the ninety-six\u2014 er I mean thirty-five degree weather, I managed to take some of my favorite photos. Hope you enjoy :)',

      photos: [
        {
          id: 'london-dscf0340',
          file: 'london/london-dscf0340',
          w: 1333, h: 2000,
          caption: 'Epping Place, London',
          alt: 'Photograph taken at Epping Place, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.544778, lon: -0.107694, place: 'Epping Place, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/4', shutter: '1/300 s', iso: 'ISO 160', date: '9 Aug 2026' }
        },
        {
          id: 'london-dscf0417',
          file: 'london/london-dscf0417',
          w: 1333, h: 2000,
          caption: 'Lower Stable Street, London',
          alt: 'Photograph taken at Lower Stable Street, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.53605, lon: -0.126342, place: 'Lower Stable Street, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/5', shutter: '1/340 s', iso: 'ISO 160', date: '9 Aug 2026' }
        },
        {
          id: 'london-dscf0517',
          file: 'london/london-dscf0517',
          w: 1333, h: 2000,
          caption: 'Downing Street, London',
          alt: 'Photograph taken at Downing Street, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.503547, lon: -0.1277, place: 'Downing Street, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/5', shutter: '1/340 s', iso: 'ISO 160', date: '9 Aug 2026' }
        },
        {
          id: 'london-dscf0520',
          file: 'london/london-dscf0520',
          w: 1333, h: 2000,
          caption: 'Downing Street, London',
          alt: 'Photograph taken at Downing Street, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.503547, lon: -0.1277, place: 'Downing Street, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/5', shutter: '1/350 s', iso: 'ISO 160', date: '9 Aug 2026' }
        },
        {
          id: 'london-dscf0564',
          file: 'london/london-dscf0564',
          w: 2000, h: 1333,
          caption: 'South Bank, London',
          alt: 'Photograph taken at South Bank, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.50335, lon: -0.119622, place: 'South Bank, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/4.5', shutter: '1/400 s', iso: 'ISO 160', date: '9 Aug 2026' }
        },
        {
          id: 'london-dscf0572',
          file: 'london/london-dscf0572',
          w: 1333, h: 2000,
          caption: 'South Bank, London',
          alt: 'Photograph taken at South Bank, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.50335, lon: -0.119622, place: 'South Bank, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/4.5', shutter: '1/250 s', iso: 'ISO 160', date: '9 Aug 2026' }
        },
        {
          id: 'london-dscf1057',
          file: 'london/london-dscf1057',
          w: 1333, h: 2000,
          caption: 'The Broadwalk, London',
          alt: 'Photograph taken at The Broadwalk, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.503853, lon: -0.144081, place: 'The Broadwalk, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/2', shutter: '1/5800 s', iso: 'ISO 160', date: '14 Aug 2026' }
        },
        {
          id: 'london-dscf1077',
          file: 'london/london-dscf1077',
          w: 2000, h: 1333,
          caption: 'Ambassador\'s Court, London',
          alt: 'Photograph taken at Ambassador\'s Court, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.501108, lon: -0.142361, place: 'Ambassador\'s Court, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/5.6', shutter: '1/1000 s', iso: 'ISO 160', date: '14 Aug 2026' }
        },
        {
          id: 'london-dscf1085',
          file: 'london/london-dscf1085',
          w: 1333, h: 2000,
          caption: 'Ambassador\'s Court, London',
          alt: 'Photograph taken at Ambassador\'s Court, London',   /* TODO(JOE): describe the photo */
          coords: { lat: 51.501108, lon: -0.142361, place: 'Ambassador\'s Court, London' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/4.5', shutter: '1/400 s', iso: 'ISO 160', date: '14 Aug 2026' }
        }
      ]
    },
    {
      slug: 'edinburgh',
      name: 'Edinburgh',
      blurb: 'Edinburgh is one of the most beautiful cities I\u2019ve experienced. The colors of the city itself were inspiring and provided an excellent opportunity to experiment. I was able to visit in August 2026, just after my London trip.',

      photos: [
        {
          id: 'edinburgh-dscf0745',
          file: 'edinburgh/edinburgh-dscf0745',
          w: 1333, h: 2000,
          caption: 'Lang Stairs, Edinburgh',
          alt: 'Photograph taken at Lang Stairs, Edinburgh',   /* TODO(JOE): describe the photo */
          coords: { lat: 55.948644, lon: -3.200436, place: 'Lang Stairs, Edinburgh' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/4', shutter: '1/210 s', iso: 'ISO 160', date: '11 Aug 2026' }
        },
        {
          id: 'edinburgh-dscf0749',
          file: 'edinburgh/edinburgh-dscf0749',
          w: 1333, h: 2000,
          caption: 'Lang Stairs, Edinburgh',
          alt: 'Photograph taken at Lang Stairs, Edinburgh',   /* TODO(JOE): describe the photo */
          coords: { lat: 55.948644, lon: -3.200436, place: 'Lang Stairs, Edinburgh' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/2.8', shutter: '1/110 s', iso: 'ISO 160', date: '11 Aug 2026' }
        },
        {
          id: 'edinburgh-dscf0822',
          file: 'edinburgh/edinburgh-dscf0822',
          w: 1333, h: 2000,
          caption: 'Grassmarket, Edinburgh',
          alt: 'Photograph taken at Grassmarket, Edinburgh',   /* TODO(JOE): describe the photo */
          coords: { lat: 55.947719, lon: -3.195706, place: 'Grassmarket, Edinburgh' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/2.2', shutter: '1/100 s', iso: 'ISO 160', date: '13 Aug 2026' }
        },
        {
          id: 'edinburgh-dscf0838',
          file: 'edinburgh/edinburgh-dscf0838',
          w: 1333, h: 2000,
          caption: 'Victoria Street, Edinburgh',
          alt: 'Photograph taken at Victoria Street, Edinburgh',   /* TODO(JOE): describe the photo */
          coords: { lat: 55.948714, lon: -3.193386, place: 'Victoria Street, Edinburgh' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/3.2', shutter: '1/125 s', iso: 'ISO 160', date: '13 Aug 2026' }
        },
        {
          id: 'edinburgh-dscf0840',
          file: 'edinburgh/edinburgh-dscf0840',
          w: 1333, h: 2000,
          caption: 'Victoria Street, Edinburgh',
          alt: 'Photograph taken at Victoria Street, Edinburgh',   /* TODO(JOE): describe the photo */
          coords: { lat: 55.948714, lon: -3.193386, place: 'Victoria Street, Edinburgh' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/4', shutter: '1/300 s', iso: 'ISO 160', date: '13 Aug 2026' }
        },
        {
          id: 'edinburgh-dscf0887',
          file: 'edinburgh/edinburgh-dscf0887',
          w: 1333, h: 2000,
          caption: 'Chambers Street, Edinburgh',
          alt: 'Photograph taken at Chambers Street, Edinburgh',   /* TODO(JOE): describe the photo */
          coords: { lat: 55.947081, lon: -3.189597, place: 'Chambers Street, Edinburgh' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/5', shutter: '1/400 s', iso: 'ISO 160', date: '13 Aug 2026' }
        }
      ]
    },
    {
      slug: 'brussels',
      name: 'Brussels',
      blurb: 'Ahhhh Brussels\u2014 I spent my Fall Junior semester here. I studied International Business at the Brussels School of Governance. Please enjoy some pictures from my time here.',

      photos: [
        {
          id: 'brussels-dscf0154',
          file: 'brussels/brussels-dscf0154',
          w: 1333, h: 2000,
          caption: 'Grand-Place, Brussels',
          alt: 'Photograph taken at Grand-Place, Brussels',   /* TODO(JOE): describe the photo */
          coords: { lat: 50.846708, lon: 4.352539, place: 'Grand-Place, Brussels' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/2', shutter: '1/50 s', iso: 'ISO 500', date: '7 Aug 2026' }
        },
        {
          id: 'brussels-dscf0170',
          file: 'brussels/brussels-dscf0170',
          w: 1333, h: 2000,
          caption: 'Grand-Place, Brussels',
          alt: 'Photograph taken at Grand-Place, Brussels',   /* TODO(JOE): describe the photo */
          coords: { lat: 50.846708, lon: 4.352539, place: 'Grand-Place, Brussels' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/2', shutter: '1/52 s', iso: 'ISO 400', date: '7 Aug 2026' }
        },
        {
          id: 'brussels-dscf0173',
          file: 'brussels/brussels-dscf0173',
          w: 1333, h: 2000,
          caption: 'Grand-Place, Brussels',
          alt: 'Photograph taken at Grand-Place, Brussels',   /* TODO(JOE): describe the photo */
          coords: { lat: 50.846708, lon: 4.352539, place: 'Grand-Place, Brussels' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 35mm f/2 R WR', focal: '35 mm', aperture: 'f/2', shutter: '1/50 s', iso: 'ISO 800', date: '7 Aug 2026' }
        },
        {
          id: 'brussels-dscf0223',
          file: 'brussels/brussels-dscf0223',
          w: 1333, h: 2000,
          caption: 'Sablon, Brussels',
          alt: 'Photograph taken at Sablon, Brussels',   /* TODO(JOE): describe the photo */
          coords: { lat: 50.840447, lon: 4.356203, place: 'Sablon, Brussels' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/5.6', shutter: '1/750 s', iso: 'ISO 160', date: '8 Aug 2026' }
        },
        {
          id: 'brussels-dscf0279',
          file: 'brussels/brussels-dscf0279',
          w: 1333, h: 2000,
          caption: 'Sablon, Brussels',
          alt: 'Photograph taken at Sablon, Brussels',   /* TODO(JOE): describe the photo */
          coords: { lat: 50.840447, lon: 4.356203, place: 'Sablon, Brussels' },
          exif: { camera: 'Fujifilm X-T3', lens: 'XF 23mm f/2 R WR', focal: '23 mm', aperture: 'f/2', shutter: '1/34 s', iso: 'ISO 160', date: '8 Aug 2026' }
        }
      ]
    },
    {
      slug: 'nature-creatures',
      name: 'Nature & Creatures',
      blurb: 'Please enjoy some of my top wildlife photos. These were taken across the world, from the Oregon Coast, to the Montreal Biodome. I\u2019m so proud of these, as many were taken on my phone.',

      photos: [
        {
          id: 'nature-creatures-img_1325',
          file: 'nature-creatures/nature-creatures-img_1325',
          w: 1500, h: 2000,
          caption: 'Maisonneuve, Montréal',
          alt: 'Photograph taken at Maisonneuve, Montréal',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.559589, lon: -73.549933, place: 'Maisonneuve, Montréal' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '15.66 mm', aperture: 'f/2.8', shutter: '1/120 s', iso: 'ISO 200', date: '1 Aug 2025' }
        },
        {
          id: 'nature-creatures-img_1332',
          file: 'nature-creatures/nature-creatures-img_1332',
          w: 1500, h: 2000,
          caption: 'Maisonneuve, Montréal',
          alt: 'Photograph taken at Maisonneuve, Montréal',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.559619, lon: -73.549919, place: 'Maisonneuve, Montréal' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '15.66 mm', aperture: 'f/2.8', shutter: '1/120 s', iso: 'ISO 250', date: '1 Aug 2025' }
        },
        {
          id: 'nature-creatures-img_1432',
          file: 'nature-creatures/nature-creatures-img_1432',
          w: 1500, h: 2000,
          caption: 'Boulevard Pie-IX, Montréal',
          alt: 'Photograph taken at Boulevard Pie-IX, Montréal',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.556811, lon: -73.557694, place: 'Boulevard Pie-IX, Montréal' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '6.765 mm', aperture: 'f/1.78', shutter: '1/4975 s', iso: 'ISO 64', date: '1 Aug 2025' }
        },
        {
          id: 'nature-creatures-img_4093',
          file: 'nature-creatures/nature-creatures-img_4093',
          w: 2000, h: 1333,
          caption: 'Southwest 5th Avenue, Portland',
          alt: 'Photograph taken at Southwest 5th Avenue, Portland',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.515117, lon: -122.679486, place: 'Southwest 5th Avenue, Portland' },
          exif: { camera: 'Canon EOS REBEL T3i', lens: 'EF-S18-55mm f/3.5-5.6 IS II', focal: '32 mm', aperture: 'f/4.5', shutter: '1/100 s', iso: 'ISO 100', date: '4 Jul 2019' }
        },
        {
          id: 'nature-creatures-img_4146',
          file: 'nature-creatures/nature-creatures-img_4146',
          w: 1500, h: 2000,
          caption: 'Maharajah Jungle Trek, Florida',
          alt: 'Photograph taken at Maharajah Jungle Trek, Florida',   /* TODO(JOE): describe the photo */
          coords: { lat: 28.360047, lon: -81.589514, place: 'Maharajah Jungle Trek, Florida' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '15.66 mm', aperture: 'f/2.8', shutter: '1/99 s', iso: 'ISO 50', date: '8 Mar 2026' }
        },
        {
          id: 'nature-creatures-img_4157',
          file: 'nature-creatures/nature-creatures-img_4157',
          w: 1500, h: 2000,
          caption: 'Maharajah Jungle Trek, Florida',
          alt: 'Photograph taken at Maharajah Jungle Trek, Florida',   /* TODO(JOE): describe the photo */
          coords: { lat: 28.359894, lon: -81.589072, place: 'Maharajah Jungle Trek, Florida' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '15.66 mm', aperture: 'f/2.8', shutter: '1/99 s', iso: 'ISO 250', date: '8 Mar 2026' }
        },
        {
          id: 'nature-creatures-img_4169',
          file: 'nature-creatures/nature-creatures-img_4169',
          w: 1500, h: 2000,
          caption: 'Maharajah Jungle Trek, Florida',
          alt: 'Photograph taken at Maharajah Jungle Trek, Florida',   /* TODO(JOE): describe the photo */
          coords: { lat: 28.359431, lon: -81.589394, place: 'Maharajah Jungle Trek, Florida' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '15.66 mm', aperture: 'f/2.8', shutter: '1/99 s', iso: 'ISO 50', date: '8 Mar 2026' }
        },
        {
          id: 'nature-creatures-img_6705',
          file: 'nature-creatures/nature-creatures-img_6705',
          w: 1500, h: 2000,
          caption: 'Carnahan Road, Oregon',
          alt: 'Photograph taken at Carnahan Road, Oregon',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.823033, lon: -123.962806, place: 'Carnahan Road, Oregon' },
          exif: { camera: 'Apple iPhone XS Max', lens: 'Back dual camera', focal: '6 mm', aperture: 'f/2.4', shutter: '1/922 s', iso: 'ISO 16', date: '18 Aug 2020' }
        }
      ]
    },
    {
      slug: 'nighttime',
      name: 'Nighttime',
      blurb: 'Two little kittens, and a pair of mittens\u2014 Goodnight Moon. I really love the opportunity to photograph after dark. I\u2019m still learning on my main cameras, so many of these were taken on my iPhone using night mode. Enjoy!',

      photos: [
        {
          id: 'nighttime-img_3002',
          file: 'nighttime/nighttime-img_3002',
          w: 1500, h: 2000,
          caption: 'KaMilo at Mauna Lani, Hawaii',
          alt: 'Photograph taken at KaMilo at Mauna Lani, Hawaii',   /* TODO(JOE): describe the photo */
          coords: { lat: 19.951456, lon: -155.853181, place: 'KaMilo at Mauna Lani, Hawaii' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '6.765 mm', aperture: 'f/1.78', shutter: '2s', iso: 'ISO 8000', date: '12 Aug 2024' }
        },
        {
          id: 'nighttime-img_3003',
          file: 'nighttime/nighttime-img_3003',
          w: 1500, h: 2000,
          caption: 'KaMilo at Mauna Lani, Hawaii',
          alt: 'Photograph taken at KaMilo at Mauna Lani, Hawaii',   /* TODO(JOE): describe the photo */
          coords: { lat: 19.951433, lon: -155.853181, place: 'KaMilo at Mauna Lani, Hawaii' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '6.765 mm', aperture: 'f/1.78', shutter: '2s', iso: 'ISO 8000', date: '12 Aug 2024' }
        },
        {
          id: 'nighttime-img_4783',
          file: 'nighttime/nighttime-img_4783',
          w: 1500, h: 2000,
          caption: 'Northwest Naito Parkway, Portland',
          alt: 'Photograph taken at Northwest Naito Parkway, Portland',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.52325, lon: -122.670197, place: 'Northwest Naito Parkway, Portland' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '6.765 mm', aperture: 'f/1.78', shutter: '1/17 s', iso: 'ISO 1600', date: '14 Dec 2024' }
        },
        {
          id: 'nighttime-img_5555',
          file: 'nighttime/nighttime-img_5555',
          w: 1500, h: 2000,
          caption: 'Laneda Avenue Beach Access, Manzanita',
          alt: 'Photograph taken at Laneda Avenue Beach Access, Manzanita',   /* TODO(JOE): describe the photo */
          coords: { lat: 45.718344, lon: -123.941003, place: 'Laneda Avenue Beach Access, Manzanita' },
          exif: { camera: 'Apple iPhone 15 Pro Max', lens: 'Back triple camera', focal: '6.765 mm', aperture: 'f/1.78', shutter: '2s', iso: 'ISO 5000', date: '10 Jun 2026' }
        }
      ]
    }
  ]
};
