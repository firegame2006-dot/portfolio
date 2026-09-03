/* =========================================================
   Volodya — 3D droplet portfolio
   Three.js (WebGL droplets) + GSAP (burst / transition)
   ========================================================= */

/* ---------------------------------------------------------
   YOUR PROJECTS — add, remove or reorder freely.
   Every entry becomes one droplet. Keep it between 1 and 7.
   image: 16:10 screenshot (webp/jpg/png), served from /assets
   url:   the real address the droplet opens
   --------------------------------------------------------- */
const projects = [
  {
    title: "Velora Motors",
    tag:   "Car dealership — catalogue, filters, service centre",
    image: "assets/velora-motors.webp",
    url:   "https://carszero.netlify.app/"
  },
  {
    title: "Monarch Barbershop",
    tag:   "Barbershop — services, booking flow, shop",
    image: "assets/monarch-barbershop.webp",
    url:   "https://barbershop0.netlify.app/"
  }
];

/* ---------------------------------------------------------
   CONTACT BUBBLES — smaller, violet, no screenshot inside,
   so they never read as one of the project droplets.
   --------------------------------------------------------- */
const contacts = [
  { label: "Email",    text: "firegame2006@gmail.com",     url: "mailto:firegame2006@gmail.com" },
  { label: "Telegram", text: "@WowCh_ok",                   url: "https://t.me/WowCh_ok" },
  { label: "GitHub",   text: "github.com/firegame2006-dot", url: "https://github.com/firegame2006-dot" }
];

/* ========================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  root.className += ' js';

  /* a reload always starts at the top — the droplet field is the entrance */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { window.scrollTo(0, 0); });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------- Fallback list (only when WebGL is missing) ------------- */
  function buildFallbackList() {
  var listEl = document.getElementById('workList');
  document.getElementById('work').hidden = false;
  projects.forEach(function (p, i) {
    var li = document.createElement('li');
    li.className = 'work-item reveal';
    li.innerHTML =
      '<a href="' + p.url + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="work-num">' + pad(i + 1) + '</span>' +
        '<img class="work-thumb" src="' + p.image + '" alt="' + esc(p.title) + ' preview" ' +
             'width="1600" height="1000" loading="lazy" decoding="async">' +
        '<span class="work-name">' + esc(p.title) +
          '<span class="work-tag">' + esc(p.tag || '') + '</span>' +
        '</span>' +
        '<span class="work-go">Visit ↗</span>' +
      '</a>';
    listEl.appendChild(li);
  });
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }

  /* ---------------- Reveal on scroll ---------------- */
  var revealables = document.querySelectorAll('.section, .work-item, .site-footer');
  for (var r = 0; r < revealables.length; r++) revealables[r].classList.add('reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    for (var v = 0; v < revealables.length; v++) revealables[v].classList.add('is-visible');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Custom cursor ---------------- */
  var cursorEl = document.getElementById('cursor');
  if (!coarse) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursorEl.classList.add('is-on');
    }, { passive: true });
    (function follow() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursorEl.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------------- Loader ---------------- */
  var loaderEl = document.getElementById('loader');
  var barEl = document.getElementById('loaderBar');
  var pctEl = document.getElementById('loaderPct');
  var loaderDone = false;

  function setProgress(p) {
    p = Math.max(0, Math.min(1, p));
    barEl.style.width = (p * 100).toFixed(0) + '%';
    pctEl.textContent = (p * 100).toFixed(0);
  }
  function finishLoading() {
    if (loaderDone) return;
    loaderDone = true;
    setProgress(1);
    setTimeout(function () {
      loaderEl.classList.add('is-done');
      document.body.classList.remove('is-loading');
      intro();
    }, 260);
  }
  setTimeout(finishLoading, 7000); // never trap the visitor behind the loader

  /* ---------------- Scene ---------------- */
  var canvas = document.getElementById('scene');
  var labelsEl = document.getElementById('labels');

  var hintEl = document.getElementById('contactHint');
  var contactListEl = document.getElementById('contactList');

  if (typeof THREE === 'undefined' || !hasWebGL()) {
    document.body.classList.add('no-webgl');
    if (hintEl) hintEl.hidden = true;
    buildFallbackList();
    finishLoading();
    return;
  }
  if (contactListEl) contactListEl.hidden = true;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas, alpha: true, antialias: !coarse, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var world = new THREE.Group();
  scene.add(world);

  var sphere = new THREE.SphereGeometry(1, 64, 48);
  var glowTex = makeGlowTexture();
  var sparkTex = makeSparkTexture();

  var VERT = [
    'uniform float uTime;',
    'uniform float uSquash;',
    'uniform float uHover;',
    'varying vec3 vN;',
    'varying vec3 vView;',
    'varying vec2 vPlanar;',
    'void main(){',
    '  vec3 pos = position;',
    '  float w = sin(pos.y*4.0 + uTime*1.5) * cos(pos.x*3.4 + uTime*1.1);',
    '  pos += normal * w * (0.030 + uHover*0.018);',
    '  pos.x *= 1.0 - 0.34*uSquash;',
    '  pos.z *= 1.0 - 0.34*uSquash;',
    '  pos.y *= 1.0 + 0.30*uSquash;',
    '  vN = normalize(normalMatrix * normal);',
    '  vec4 mv = modelViewMatrix * vec4(pos,1.0);',
    '  vView = -mv.xyz;',
    '  vPlanar = position.xy * 0.5 + 0.5;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var FRAG = [
    'uniform sampler2D uTex;',
    'uniform float uHasTex;',
    'uniform float uOpacity;',
    'uniform float uHover;',
    'uniform vec3  uTint;',
    'uniform float uRim;',
    'varying vec3 vN;',
    'varying vec3 vView;',
    'varying vec2 vPlanar;',
    'void main(){',
    '  vec3 N = normalize(vN);',
    '  vec3 V = normalize(vView);',
    '  float fres = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.2);',
    /* the preview lives inside the drop and is bent by the surface — fake refraction */
    '  vec2 uv = (vPlanar - 0.5) * 0.80 + 0.5;',
    '  vec2 off = N.xy * 0.12 * (1.0 - fres*0.45);',
    '  vec3 shot = vec3(',
    '    texture2D(uTex, uv + off*1.07).r,',
    '    texture2D(uTex, uv + off).g,',
    '    texture2D(uTex, uv + off*0.93).b) * uHasTex;',
    '  shot *= mix(1.0, 0.14, fres);',
    /* glass thickness: the preview fades out towards the rim */
    '  float d = length(vPlanar - 0.5) * 2.0;',
    '  shot *= smoothstep(1.02, 0.40, d);',
    '  vec3 col = shot * (0.98 + uHover*0.30);',
    '  col += uTint * pow(fres, 1.5) * (0.80 + uHover*0.45) * uRim;',
    /* key highlight + a small sharp dot — this is what reads as a real droplet */
    '  vec3 L = normalize(vec3(-0.55, 0.78, 0.72));',
    '  vec3 H = normalize(L+V);',
    '  col += vec3(0.92,0.96,1.0) * pow(max(dot(N,H),0.0), 90.0) * 1.10;',
    '  col += vec3(1.0) * pow(max(dot(N,H),0.0), 520.0) * 2.40;',
    /* light bleeding through the bottom of the drop */
    '  vec3 L2 = normalize(vec3(0.72,-0.52,0.55));',
    '  col += uTint * pow(max(dot(N, normalize(L2+V)), 0.0), 16.0) * 0.42;',
    '  float a = clamp(0.16 + pow(fres,1.3)*0.95 + length(shot)*0.55, 0.0, 1.0) * uOpacity;',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  /* --- build droplets: projects, contacts, and beads for the field --- */
  var TINT_PROJECT = new THREE.Color(0x86bcff);   /* blue-white glass  */
  var TINT_CONTACT = new THREE.Color(0xc3adff);   /* violet, clearly a different family */
  var SCROLL_RATE = 0.55;                          /* field drifts slower than the page */

  var drops = [];
  var decor = coarse ? 7 : 11;

  var manager = new THREE.LoadingManager();
  manager.onProgress = function (u, loaded, totalItems) { setProgress(loaded / Math.max(1, totalItems)); };
  manager.onLoad = finishLoading;
  manager.onError = function () { setProgress(1); };
  var loader = new THREE.TextureLoader(manager);

  var specs = [];
  projects.forEach(function (p) { specs.push({ kind: 'project', data: p }); });
  contacts.forEach(function (c) { specs.push({ kind: 'contact', data: c }); });
  for (var b = 0; b < decor; b++) specs.push({ kind: 'bead', data: null });

  specs.forEach(function (spec, i) {
    var isProject = spec.kind === 'project';
    var isContact = spec.kind === 'contact';
    var tint = isContact ? TINT_CONTACT : TINT_PROJECT;

    var mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime:    { value: Math.random() * 40 },
        uSquash:  { value: 0 },
        uHover:   { value: 0 },
        uOpacity: { value: 0 },
        uHasTex:  { value: 0 },
        uTint:    { value: new THREE.Color(tint) },
        uRim:     { value: isContact ? 2.1 : 1.0 },
        uTex:     { value: blankTexture() }
      }
    });

    if (isProject) {
      /* inlined data URI when previews.js is present, plain path otherwise */
      var src = (window.PREVIEWS && window.PREVIEWS[spec.data.image]) || spec.data.image;
      (function (m) {
        loader.load(src, function (tex) {
          tex.encoding = THREE.sRGBEncoding;
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          m.uniforms.uTex.value = tex;
          m.uniforms.uHasTex.value = 1;
        });
      })(mat);
    }

    if (isContact) {
      mat.uniforms.uTex.value = makeGlyphTexture(spec.data.label.charAt(0).toUpperCase());
      mat.uniforms.uHasTex.value = 1;
    }

    var mesh = new THREE.Mesh(sphere, mat);
    mesh.renderOrder = 2;

    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: isContact ? 0xab8dff : 0x6ea8ff,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    }));
    glow.renderOrder = 1;
    world.add(glow);
    world.add(mesh);

    var drop = {
      mesh: mesh, mat: mat, glow: glow,
      kind: spec.kind,
      url: spec.data ? spec.data.url : null,
      image: isProject ? spec.data.image : null,
      title: spec.data ? (spec.data.title || spec.data.label) : '',
      r: 1, base: new THREE.Vector3(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.42 + Math.random() * 0.35,
      amp: 0.05 + Math.random() * 0.05,
      label: null, hover: 0,
      /* each droplet answers the pointer on its own, with its own lag */
      off: new THREE.Vector3(), offTarget: new THREE.Vector3(),
      ease: 0.045 + (i % 5) * 0.014
    };

    if (drop.url) {
      var label = document.createElement('a');
      label.className = 'label' + (isContact ? ' label-contact' : '');
      label.href = spec.data.url;
      if (isProject) { label.target = '_blank'; label.rel = 'noopener noreferrer'; }
      label.innerHTML = '<b>' + esc(drop.title) + '</b><u>' +
        esc(isContact ? spec.data.text : 'Click to visit') + '</u>';
      label.addEventListener('click', function (ev) { ev.preventDefault(); launch(drop); });
      labelsEl.appendChild(label);
      drop.label = label;
    }
    drops.push(drop);
  });

  if (!projects.length && !contacts.length) finishLoading();

  /* ---------------- Layout ---------------- */
  var view = { w: 0, h: 0 };

  function layout() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    var vh = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    var vw = vh * camera.aspect;
    view.w = vw; view.h = vh;

    var wide = camera.aspect > 1.05;
    var m = Math.min(vw, vh);
    var docH = document.body.scrollHeight || h;

    /* world Y that puts a droplet on screen when a given page position is */
    function atDoc(docY) { return -((docY - h / 2) / h) * vh * SCROLL_RATE; }

    var cxw = wide ? vw * 0.17 : 0;
    var cyw = wide ? 0 : -vh * 0.19;   /* portrait: droplets below the copy */
    var ring = wide ? m * 0.31 : m * 0.185;
    var baseR = wide ? m * 0.128 : m * 0.098;

    function docTop(el) {
      return el.getBoundingClientRect().top + (window.scrollY || 0);
    }

    var contactEl = document.getElementById('contact');
    var hintEl2 = document.getElementById('contactHint');
    var contactBase, slots;

    if (wide) {
      /* beside the copy */
      contactBase = atDoc(contactEl
        ? contactEl.offsetTop + contactEl.offsetHeight * 0.5
        : docH * 0.82);
      slots = [[0.14, 0.14], [0.31, -0.02], [0.20, -0.19]];
    } else {
      /* on a phone they belong under the text, in a clear row of their own */
      var anchor = hintEl2
        ? docTop(hintEl2) + hintEl2.offsetHeight + h * 0.20
        : docH * 0.9;
      contactBase = atDoc(anchor);
      slots = [[-0.30, 0.05], [0.00, -0.06], [0.30, 0.05]];
    }

    var pi = 0, ci = 0, bi = 0;

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i], size, x, y, z;

      if (d.kind === 'project') {
        var n = Math.max(1, projects.length);
        var a = -Math.PI / 6 + (pi / n) * Math.PI * 2;
        size = baseR * (1 + (pi % 2 ? -0.10 : 0.12));
        x = cxw + Math.cos(a) * ring * (n === 1 ? 0 : 1);
        var pl = vw * 0.5 - size * 1.15;
        x = Math.max(-pl, Math.min(pl, x));
        y = cyw + Math.sin(a) * ring * (wide ? 0.86 : 0.92);
        z = (pi % 3) * -0.35;
        pi++;
      } else if (d.kind === 'contact') {
        var sl = slots[ci % slots.length];
        size = baseR * (wide ? 0.60 : 0.52);
        /* never let a bubble hang off the edge of a phone screen */
        var limit = vw * 0.5 - size * 1.45;
        x = Math.max(-limit, Math.min(limit, sl[0] * vw));
        y = contactBase + sl[1] * vh;
        z = -0.15;
        ci++;
      } else {
        var depth = (bi + 0.5) / decor;
        size = baseR * (0.20 + (bi % 4) * 0.07);
        x = (((bi * 0.61803) % 1) * 2 - 1) * vw * 0.42;
        y = atDoc(depth * docH) + ((bi % 3) - 1) * vh * 0.15;
        z = -0.2 - (bi % 4) * 0.35;
        bi++;
      }

      d.r = size;
      d.base.set(x, y, z);
      d.mesh.scale.setScalar(size);
      d.glow.scale.setScalar(size * (d.url ? 5.0 : 4.0));
      d.glow.material.opacity = loaderDone
        ? (d.kind === 'project' ? 0.30 : d.kind === 'contact' ? 0.42 : 0.16)
        : 0;
    }
  }

  /* ---------------- Pointer ---------------- */
  var pointer = new THREE.Vector2(-10, -10);
  var pointerPx = { x: -1000, y: -1000 };
  var parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  var raycaster = new THREE.Raycaster();
  var hovered = null;
  var busy = false;

  function onMove(clientX, clientY) {
    pointerPx.x = clientX; pointerPx.y = clientY;
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    parallax.tx = pointer.x * 0.34;
    parallax.ty = pointer.y * 0.22;
  }

  window.addEventListener('pointermove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('pointerdown', function (e) {
    /* never steal a click meant for a real link or control */
    if (e.target && e.target.closest && e.target.closest('a, button, input, textarea, select')) return;
    onMove(e.clientX, e.clientY);
    var hit = pick();
    if (hit) launch(hit);
  });

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    var meshes = [];
    for (var i = 0; i < drops.length; i++) if (drops[i].url) meshes.push(drops[i].mesh);
    var hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    for (var j = 0; j < drops.length; j++) if (drops[j].mesh === hits[0].object) return drops[j];
    return null;
  }

  /* ---------------- Burst + transition ---------------- */
  var bursts = [];

  function launch(drop) {
    if (busy || !drop.url) return;
    busy = true;

    var rect = screenRect(drop);
    var go = function () { window.location.href = drop.url; };

    if (reduced) { go(); return; }

    var tl = gsap.timeline();
    tl.to(drop.mat.uniforms.uSquash, { value: 1, duration: 0.17, ease: 'power3.in' })
      .to(drop.mesh.scale, { x: drop.r * 1.22, y: drop.r * 1.22, z: drop.r * 1.22, duration: 0.17, ease: 'power3.in' }, 0)
      .add(function () { spawnBurst(drop); })
      .to(drop.mat.uniforms.uOpacity, { value: 0, duration: 0.22, ease: 'power2.out' }, '>-0.03')
      .to(drop.glow.material, { opacity: 0.75, duration: 0.12 }, '<')
      .to(drop.glow.material, { opacity: 0, duration: 0.4 }, '>');

    if (drop.label) gsap.to(drop.label, { opacity: 0, duration: 0.2 });

    veil(drop, rect);
    setTimeout(go, drop.image ? 1150 : 900);
  }

  /* The first version zoomed the screenshot to fullscreen, which cropped badly
     on a phone. Now the droplet itself swells out and floods the screen, with a
     small drop mark and a filling line while the next page loads. */
  function veil(drop, rect) {
    var wrap = document.getElementById('transition');
    var flash = document.getElementById('transitionFlash');
    var sheet = document.getElementById('transitionVeil');
    var mark = document.getElementById('transitionMark');
    var name = document.getElementById('transitionName');
    var bar = document.getElementById('transitionBar');

    wrap.classList.add('is-on');
    name.textContent = drop.title;

    var w = window.innerWidth, h = window.innerHeight;
    var dx = Math.max(rect.x, w - rect.x);
    var dy = Math.max(rect.y, h - rect.y);
    var far = Math.sqrt(dx * dx + dy * dy);
    var slow = drop.image ? 1 : 0.78;

    gsap.set(sheet, {
      left: rect.x - rect.r, top: rect.y - rect.r,
      width: rect.r * 2, height: rect.r * 2,
      scale: 0.35, opacity: 0
    });
    gsap.set(bar, { width: '0%' });
    gsap.set(mark, { opacity: 0, y: 8 });

    gsap.timeline()
      .to(flash, { opacity: 0.8, duration: 0.14, ease: 'power2.out' }, 0.06)
      .to(flash, { opacity: 0, duration: 0.5 }, '>')
      .to(sheet, { opacity: 1, duration: 0.18 }, 0.10)
      .to(sheet, { scale: (far / rect.r) * 1.12, duration: 0.78 * slow, ease: 'power2.inOut' }, 0.10)
      .to(mark, { opacity: 1, y: 0, duration: 0.30 }, 0.42 * slow)
      .to(bar, { width: '100%', duration: 0.62 * slow, ease: 'power1.inOut' }, 0.45 * slow);
  }

  function spawnBurst(drop) {
    var COUNT = coarse ? 70 : 120;
    var pos = new Float32Array(COUNT * 3);
    var vel = [];
    var o = drop.mesh.position;

    for (var i = 0; i < COUNT; i++) {
      var t = Math.random() * Math.PI * 2;
      var u = Math.random() * 2 - 1;
      var s = Math.sqrt(1 - u * u);
      var dir = new THREE.Vector3(s * Math.cos(t), s * Math.sin(t), u);
      var p = dir.clone().multiplyScalar(drop.r * (0.7 + Math.random() * 0.4));
      pos[i * 3] = o.x + p.x; pos[i * 3 + 1] = o.y + p.y; pos[i * 3 + 2] = o.z + p.z;
      vel.push(dir.multiplyScalar(1.6 + Math.random() * 3.4));
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      size: drop.r * 0.30, map: sparkTex, color: 0xcfe4ff,
      transparent: true, opacity: 1, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    var pts = new THREE.Points(geo, mat);
    pts.renderOrder = 3;
    world.add(pts);
    bursts.push({ pts: pts, vel: vel, life: 0 });
  }

  function stepBursts(dt) {
    for (var b = bursts.length - 1; b >= 0; b--) {
      var burst = bursts[b];
      burst.life += dt;
      var arr = burst.pts.geometry.attributes.position.array;
      for (var i = 0; i < burst.vel.length; i++) {
        var v = burst.vel[i];
        v.y -= 3.2 * dt;
        v.multiplyScalar(0.975);
        arr[i * 3] += v.x * dt;
        arr[i * 3 + 1] += v.y * dt;
        arr[i * 3 + 2] += v.z * dt;
      }
      burst.pts.geometry.attributes.position.needsUpdate = true;
      burst.pts.material.opacity = Math.max(0, 1 - burst.life / 1.1);
      burst.pts.material.size *= 1 - dt * 0.35;
      if (burst.life > 1.2) {
        world.remove(burst.pts);
        burst.pts.geometry.dispose();
        burst.pts.material.dispose();
        bursts.splice(b, 1);
      }
    }
  }

  function screenRect(drop) {
    var v = drop.mesh.position.clone().add(world.position).project(camera);
    var x = (v.x * 0.5 + 0.5) * window.innerWidth;
    var y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    var edge = drop.mesh.position.clone().add(world.position);
    edge.x += drop.r;
    edge.project(camera);
    var ex = (edge.x * 0.5 + 0.5) * window.innerWidth;
    return { x: x, y: y, r: Math.max(28, Math.abs(ex - x)) };
  }

  /* ---------------- Intro ---------------- */
  function intro() {
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      var target = d.url ? 1 : 0.9;
      if (reduced) {
        d.mat.uniforms.uOpacity.value = target;
        d.glow.material.opacity = d.kind === 'contact' ? 0.42 : d.url ? 0.30 : 0.16;
        if (d.label) d.label.classList.add('is-in');
        continue;
      }
      gsap.fromTo(d.mesh.scale,
        { x: 0.01, y: 0.01, z: 0.01 },
        { x: d.r, y: d.r, z: d.r, duration: 1.25, delay: 0.05 * i, ease: 'elastic.out(1, 0.7)' });
      gsap.to(d.mat.uniforms.uOpacity, { value: target, duration: 0.9, delay: 0.05 * i });
      gsap.to(d.glow.material, { opacity: d.kind === 'contact' ? 0.42 : d.url ? 0.30 : 0.16, duration: 1.1, delay: 0.05 * i });
      if (d.label) (function (el, k) {
        setTimeout(function () { el.classList.add('is-in'); }, 420 + k * 90);
      })(d.label, i);
    }
    if (!reduced && window.gsap) {
      gsap.from('.hero-copy > *', { y: 26, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
    }
  }

  /* ---------------- Loop ---------------- */
  var clock = new THREE.Clock();
  var running = true;


  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) clock.getDelta();
  });

  function tick() {
    requestAnimationFrame(tick);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (!running || document.hidden) return;

    var t = clock.elapsedTime;

    /* the field drifts with the page, slower than the content (parallax) */
    var scrolled = (window.scrollY || document.documentElement.scrollTop || 0);
    var scrollWorld = (scrolled / window.innerHeight) * view.h * SCROLL_RATE;

    parallax.x += (parallax.tx - parallax.x) * 0.045;
    parallax.y += (parallax.ty - parallax.y) * 0.045;
    world.position.x = parallax.x * 0.35;
    world.position.y = parallax.y * 0.35 + scrollWorld;

    /* pointer in world units, on the plane the droplets live on */
    var pwx = pointer.x * view.w / 2 - world.position.x;
    var pwy = pointer.y * view.h / 2 - world.position.y;

    var hit = busy ? null : pick();
    if (hit !== hovered) {
      if (hovered && hovered.label) hovered.label.classList.remove('is-hot');
      hovered = hit;
      if (hovered && hovered.label) hovered.label.classList.add('is-hot');
      if (cursorEl) cursorEl.classList.toggle('is-hot', !!hovered);
      document.body.style.cursor = hovered ? 'pointer' : '';
    }

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.mat.uniforms.uTime.value = t;

      var want = d === hovered ? 1 : 0;
      d.hover += (want - d.hover) * 0.12;
      d.mat.uniforms.uHover.value = d.hover;

      /* individual answer to the pointer: beads scatter, projects lean in */
      var dx = d.base.x - pwx, dy = d.base.y - pwy;
      var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      var reach = d.url ? d.r * 3.4 : d.r * 5.0;
      if (dist < reach) {
        var force = (1 - dist / reach);
        var push = d.url ? -force * d.r * 0.30 : force * d.r * 1.15;
        d.offTarget.set(dx / dist * push, dy / dist * push, 0);
      } else {
        d.offTarget.set(0, 0, 0);
      }
      d.off.x += (d.offTarget.x - d.off.x) * d.ease;
      d.off.y += (d.offTarget.y - d.off.y) * d.ease;

      d.mesh.position.set(
        d.base.x + d.off.x + Math.sin(t * d.speed * 0.7 + d.phase) * d.amp * 1.3,
        d.base.y + d.off.y + Math.sin(t * d.speed + d.phase) * d.amp * 2.2,
        d.base.z
      );
      d.mesh.rotation.y = Math.sin(t * 0.16 + d.phase) * 0.35;
      d.mesh.rotation.z = Math.cos(t * 0.12 + d.phase) * 0.12;
      d.glow.position.copy(d.mesh.position);

      if (!busy && loaderDone && !gsap.isTweening(d.mesh.scale)) {
        d.mesh.scale.setScalar(d.r * (1 + d.hover * 0.07));
      }

      if (d.label) {
        var p = d.mesh.position.clone().add(world.position).project(camera);
        var sx = (p.x * 0.5 + 0.5) * window.innerWidth;
        var sy = (-p.y * 0.5 + 0.5) * window.innerHeight;
        var below = (d.r / view.h) * window.innerHeight * 1.06;
        /* keep the caption inside the viewport, whatever the droplet does */
        var lw = d.label.offsetWidth;
        var lx = Math.min(Math.max(sx - lw / 2, 6), window.innerWidth - lw - 6);
        d.label.style.transform = 'translate3d(' + lx + 'px,' + (sy + below) + 'px,0)';
      }
    }

    stepBursts(dt);
    renderer.render(scene, camera);
  }

  /* ---------------- Boot ---------------- */
  layout();
  window.addEventListener('resize', debounce(layout, 120));
  window.addEventListener('orientationchange', function () { setTimeout(layout, 250); });
  tick();

  /* ---------------- Helpers ---------------- */
  function debounce(fn, ms) {
    var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); };
  }

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function blankTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 2;
    var x = c.getContext('2d');
    x.fillStyle = '#0b1018';
    x.fillRect(0, 0, 2, 2);
    return new THREE.CanvasTexture(c);
  }

  function makeGlowTexture() {
    var s = 256, c = document.createElement('canvas');
    c.width = c.height = s;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(150,195,255,0.55)');
    g.addColorStop(0.45, 'rgba(110,168,255,0.16)');
    g.addColorStop(1, 'rgba(110,168,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  /* One letter inside a contact bubble — E, T, G. Enough to tell them apart
     from the project droplets at a glance, without an icon set. */
  function makeGlyphTexture(letter) {
    var W = 320, H = 200, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#05070a';
    x.fillRect(0, 0, W, H);
    x.fillStyle = '#d8caff';
    x.font = '600 108px "Segoe UI", Helvetica, Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(letter, W / 2, H / 2 + 4);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function makeSparkTexture() {
    var s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(200,225,255,0.7)');
    g.addColorStop(1, 'rgba(160,200,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
})();
