"""Build web derivatives + gallery-data.js from assets/gallery/Originals.
Originals are READ ONLY — nothing is written inside that folder."""
from PIL import Image, ImageOps, ExifTags
from fractions import Fraction
import glob, os, json, re, subprocess, sys, tempfile

Image.MAX_IMAGE_PIXELS = None
ROOT = '/Users/joeanderson/Desktop/JKA-Site.nosync'
SRC  = os.path.join(ROOT, 'assets/gallery/Originals')
OUT  = os.path.join(ROOT, 'assets/gallery/web')
CACHE = json.load(open(sys.argv[1] + '/geocache.json'))

# display order; folder name -> (slug, display name)
ORDER = [('London', 'london', 'London'),
         ('Edinburgh', 'edinburgh', 'Edinburgh'),
         ('Brussels', 'brussels', 'Brussels'),
         ('Nature & Creatures', 'nature-creatures', 'Nature & Creatures'),
         ('Nighttime', 'nighttime', 'Nighttime')]

def gps_of(ex):
    g = ex.get_ifd(0x8825)
    if not g: return None
    def dec(v, ref):
        d = float(v[0]) + float(v[1])/60 + float(v[2])/3600
        return -d if ref in ('S', 'W') else d
    try: return (round(dec(g[2], g[1]), 6), round(dec(g[4], g[3]), 6))
    except Exception: return None

def clean_town(a):
    t = (a.get('city') or a.get('town') or a.get('village') or a.get('municipality') or '')
    if not t or 'County' in t: t = a.get('state') or a.get('county') or t
    t = t.split(' - ')[0].strip()
    t = re.sub(r'^(City of|London Borough of|Borough of)\s+', '', t)
    return {'Bruxelles': 'Brussels', 'Greater London': 'London',
            'Westminster': 'London', 'Hawaiʻi County': 'Hawaii'}.get(t, t)

def place_of(coord):
    r = CACHE.get("%s,%s" % coord)
    if not r or 'address' not in r: return ''
    a = r['address']
    spot = (r.get('name') or a.get('road') or a.get('pedestrian') or a.get('quarter') or
            a.get('tourism') or a.get('attraction') or a.get('historic') or
            a.get('neighbourhood') or a.get('residential') or a.get('suburb') or '')
    spot = spot.split(' - ')[0].strip()
    town = clean_town(a)
    return "%s, %s" % (spot, town) if spot and town and spot.lower() != town.lower() else (spot or town)

def exif_of(path):
    ex = Image.open(path).getexif()
    d = {ExifTags.TAGS.get(k, k): v for k, v in ex.items()}
    d.update({ExifTags.TAGS.get(k, k): v for k, v in ex.get_ifd(0x8769).items()})
    def shutter(v):
        if not v: return None
        v = float(v)
        return ("%gs" % v) if v >= 1 else "1/%d s" % round(1 / v)
    mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    dt = str(d.get('DateTimeOriginal', ''))
    date = ''
    if dt:
        p = dt.split(' ')[0].split(':')
        if len(p) == 3: date = "%d %s %s" % (int(p[2]), mon[int(p[1]) - 1], p[0])
    make  = str(d.get('Make', '')).strip().title().replace('Nikon Corporation', 'Nikon')
    model = str(d.get('Model', '')).strip()
    cam = model if model.lower().startswith(make.lower()) else ("%s %s" % (make, model)).strip()
    lens = str(d.get('LensModel', '')).strip()
    lens = re.sub(r'^XF(\d)', r'XF \1', lens)
    lens = re.sub(r'mmF([\d.]+)', r'mm f/\1', lens)
    out = {'camera': cam or None, 'lens': lens or None,
           'focal': ("%g mm" % float(d['FocalLength'])) if d.get('FocalLength') else None,
           'aperture': ("f/%g" % float(d['FNumber'])) if d.get('FNumber') else None,
           'shutter': shutter(d.get('ExposureTime')),
           'iso': ("ISO %d" % int(d['ISOSpeedRatings'])) if d.get('ISOSpeedRatings') else None,
           'date': date or None}
    return {k: v for k, v in out.items() if v}

def encode(im, longest, dst, q):
    w, h = im.size
    s = longest / max(w, h)
    r = im if s >= 1 else im.resize((max(1, round(w*s)), max(1, round(h*s))), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tf:
        tmp = tf.name
    r.save(tmp, 'PNG')
    subprocess.run(['cwebp','-quiet','-q',str(q),'-m','6','-sharp_yuv',
                    '-metadata','none', tmp,'-o',dst], check=True)
    os.unlink(tmp)
    return r.size

collections, total_t, total_l = [], 0, 0
for folder, slug, name in ORDER:
    d = os.path.join(SRC, folder)
    if not os.path.isdir(d): continue
    os.makedirs(os.path.join(OUT, slug), exist_ok=True)
    files = sorted(f for f in glob.glob(d + '/*')
                   if f.lower().endswith(('.jpg', '.jpeg', '.png')))
    photos = []
    for f in files:
        base = os.path.splitext(os.path.basename(f))[0].lower()
        pid = '%s-%s' % (slug, base)
        im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')   # honour orientation
        tw = encode(im, 900,  os.path.join(OUT, slug, pid + '-thumb.webp'), 82)
        mw = encode(im, 1400, os.path.join(OUT, slug, pid + '-mid.webp'),   84)
        lw = encode(im, 2000, os.path.join(OUT, slug, pid + '-large.webp'), 86)
        total_t += os.path.getsize(os.path.join(OUT, slug, pid + '-thumb.webp'))
        total_l += os.path.getsize(os.path.join(OUT, slug, pid + '-large.webp'))
        c = gps_of(Image.open(f).getexif())
        pl = place_of(c) if c else ''
        photos.append({'id': pid, 'file': slug + '/' + pid, 'w': lw[0], 'h': lw[1],
                       'caption': pl, 'place': pl,
                       'lat': c[0] if c else None, 'lon': c[1] if c else None,
                       'exif': exif_of(f), 'src': os.path.basename(f)})
        print("  %-34s %sx%s" % (pid, lw[0], lw[1]))
    collections.append({'slug': slug, 'name': name, 'photos': photos})

json.dump(collections, open(sys.argv[1] + '/collections.json', 'w'), indent=1)
print("\n%d photos | thumbs %.1f MB | large %.1f MB" %
      (sum(len(c['photos']) for c in collections), total_t/1048576, total_l/1048576))
