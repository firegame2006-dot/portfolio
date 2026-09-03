# Volodya — 3D droplet portfolio

One page, no build step, no npm. Every project is a 3D water droplet with a live
preview of the site inside it; clicking a droplet bursts it and opens the real URL.
Droplets float behind the whole page, not just the hero, and each one answers the
pointer on its own: the small glass beads scatter away from the cursor, the project
droplets lean towards it.

There is no "Selected Work" section — the droplets are the project list. A plain
text list appears only when WebGL is unavailable, so nothing is unreachable.

    index.html         the 3D site (main page)
    drops.css          styling
    drops.js           Three.js scene, GSAP burst, the projects and contacts arrays
    previews.js        screenshots inlined as data URIs (generated)
    make-previews.py   regenerates previews.js from assets/
    assets/        project screenshots (16:10 webp)
    favicon.svg    droplet favicon
    minimal.html   the earlier light minimal design, kept as a backup
    styles.css     styling for minimal.html
    script.js      scripting for minimal.html

## Run it

Double-clicking `index.html` works: WebGL cannot read textures over `file://`, so
in that case the page pulls the screenshots from `previews.js`, where they are
inlined as data URIs. Over http that file is skipped and the textures come from
`assets/` instead — 200 KB lighter for real visitors. A server is still nicer
while developing:

    python -m http.server 8000

**After changing anything in `assets/`, run:**

    python make-previews.py

## Contacts

The three violet bubbles near the Contact section come from the `contacts` array
in `drops.js`, right under the projects. Each carries a monogram (E / T / G), so
they never read as a project droplet:

    const contacts = [
      { label: "Email", text: "firegame2006@gmail.com", url: "mailto:firegame2006@gmail.com" }
    ];

## Adding a project

Open `drops.js` — the array at the very top is the only thing you need to touch.
One entry = one droplet. Anything between 1 and 7 entries looks right.

    const projects = [
      {
        title: "Velora Motors",
        tag:   "Car dealership — catalogue, filters, service centre",
        image: "assets/velora-motors.webp",
        url:   "https://carszero.netlify.app/"
      }
    ];

* `image` — a 16:10 screenshot (1600x1000 is ideal), WebP keeps it small.
  Drop the file into `assets/` and point `image` at it.
* `url` — the real address; this is what opens after the droplet bursts.
* Everything else follows automatically: the droplet, its number, its label,
  and the row in the "Selected Work" list.

Layout, sizes and positions are computed from the number of projects, so nothing
has to be adjusted by hand. Droplets without a project (the small glass beads)
fill the composition and are added automatically up to six.

## Taking a screenshot of a site

Headless Chrome, no extra tools:

    chrome --headless=new --hide-scrollbars --window-size=1600,1000 \
      --virtual-time-budget=9000 --screenshot=shot.png https://example.com/

Then convert to WebP (Python + Pillow):

    python -c "from PIL import Image; im=Image.open('shot.png').convert('RGB'); \
      im.save('assets/shot.webp','WEBP',quality=82,method=6)"

## Dependencies

Two CDN scripts, pinned:

* Three.js 0.149.0 — https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js
* GSAP 3.12.5 — https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js

If WebGL is unavailable the droplets are skipped and the page falls back to the
"Selected Work" list — every project stays reachable.

## Page structure

    hero        MY WORKS + one line, nothing else — the droplets carry the work
    services    My services + a small tech stack line (appears on scroll)
    about me
    contact     three violet bubbles

Fonts are Syne (headings) and Sora (text), loaded from Google Fonts.
A reload always lands at the top: `history.scrollRestoration` is set to manual.

## Notes

* Rendering pauses when the tab is hidden.
* Project droplets are only clickable while the hero is on screen.
* Pixel ratio is capped (2 on desktop, 1.6 on touch) to keep it smooth.
* Clicking a droplet: it squashes, bursts into particles, then swells out and
  floods the screen with a drop mark and a filling line, and the URL opens in
  the same tab. No screenshot is zoomed, so nothing gets cropped on a phone.
* On a phone the hero puts the words first and the droplets underneath, and
  the contact bubbles sit in their own row under the contact text.
* `prefers-reduced-motion` turns off the float, the burst and the intro; a click
  then goes straight to the project URL.
