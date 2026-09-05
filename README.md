# Volodya — web developer portfolio

One page, no build step, no npm. Every project is a 3D water droplet with a live
preview of the site inside it; clicking a droplet bursts it and opens the project.
Droplets float behind the whole page, and each one answers the pointer on its own:
the small glass beads scatter away from the cursor, the project droplets lean in.

Live: https://portfolions2.netlify.app/

## Files

    index.html          the page
    drops.css           styling
    drops.js            Three.js scene, GSAP transitions, projects + contacts data
    previews.js         screenshots inlined as data URIs (only used from file://)
    make-previews.py    regenerates previews.js from assets/
    assets/             project screenshots (16:10 WebP) and the social card
    favicon.svg         droplet mark
    apple-touch-icon.png
    robots.txt, sitemap.xml, _headers

## Run it

    python -m http.server 8000

Then http://localhost:8000/. Opening `index.html` by double-click also works:
WebGL cannot read textures over `file://`, so in that case the page falls back to
the inlined copies in `previews.js`. Over http that file is skipped and the
textures come from `assets/` — 200 KB lighter for real visitors.

## Adding a project

The array at the top of `drops.js` is the only thing to edit. One entry = one
droplet; anything between one and seven looks right.

    const projects = [
      {
        title: "Velora Motors",
        tag:   "Car dealership — catalogue, filters, service centre",
        image: "assets/velora-motors.webp",
        url:   "https://carszero.netlify.app/"
      }
    ];

Contacts work the same way through the `contacts` array below it.

`image` wants a 16:10 screenshot (1600x1000 is ideal) in `assets/`. After adding
one, run `python make-previews.py` so the offline copies stay in step. Positions,
sizes and captions are computed from the number of entries — nothing to adjust by
hand.

Capturing a screenshot without extra tools:

    chrome --headless=new --hide-scrollbars --window-size=1600,1000 \
      --virtual-time-budget=9000 --screenshot=shot.png https://example.com/

    python -c "from PIL import Image; im=Image.open('shot.png').convert('RGB'); \
      im.save('assets/shot.webp','WEBP',quality=82,method=6)"

## Structure

    hero        MY WORKS and one line — the droplets carry the work
    services    services list and a small tech line
    about me
    contact     three violet bubbles: email, Telegram, GitHub

Fonts: Syne (headings) and Sora (text). A reload always lands at the top —
`history.scrollRestoration` is set to manual.

## Dependencies

Two CDN scripts, pinned and checked with Subresource Integrity:

* Three.js 0.149.0 (jsDelivr)
* GSAP 3.12.5 (cdnjs)

If WebGL is unavailable the droplets are skipped and a plain list of the projects
and contacts appears instead, so nothing is unreachable.

## Notes

* Project and contact droplets are pinned to the page, so they stay in their own
  section; only the small beads keep a parallax.
* Rendering pauses when the tab is hidden. Pixel ratio is capped at 2 (1.6 on
  touch screens).
* Clicking a droplet: it squashes, bursts into particles, then swells out and
  floods the screen with a drop mark and a filling line, and the URL opens in the
  same tab. Returning with the browser's Back button clears that overlay and puts
  the droplet back together.
* `prefers-reduced-motion` turns off the float, the burst and the intro; a click
  then goes straight to the project URL.

## Before deploying elsewhere

The absolute URLs in `index.html` (`canonical`, `og:url`, `og:image`),
`robots.txt` and `sitemap.xml` point at `portfolions2.netlify.app`. Change them if
the domain changes.
