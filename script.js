(() => {
  'use strict';
  window.__saReady = true;

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktopMQ = matchMedia('(min-width: 961px)');
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGSAP && !reduceMQ.matches;
  if (!animate) root.classList.remove('js-anim');

  /* ---------------- Motion preference ---------------- */
  let userPaused = false;
  try { userPaused = localStorage.getItem('sa-motion-paused') === 'true'; } catch (e) { /* optional */ }
  const isPaused = () => reduceMQ.matches || userPaused;
  const motionHooks = [];
  const motionBtn = $('.motion-toggle');
  function syncMotion() {
    const paused = isPaused();
    root.classList.toggle('motion-paused', paused);
    motionBtn.setAttribute('aria-pressed', String(paused));
    motionBtn.textContent = paused ? 'Activar animaciones' : 'Pausar animaciones';
    motionBtn.disabled = reduceMQ.matches;
    motionHooks.forEach(fn => fn(paused));
  }
  motionBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('sa-motion-paused', String(userPaused)); } catch (e) { /* optional */ }
    syncMotion();
  });
  reduceMQ.addEventListener('change', syncMotion);

  /* ---------------- Theme ---------------- */
  const themeBtn = $('.theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const themeHooks = [];
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeMeta.setAttribute('content', theme === 'dark' ? '#0e1210' : '#f4f3ee');
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
    try { sessionStorage.setItem('sa-theme', theme); } catch (e) { /* optional */ }
    themeHooks.forEach(fn => fn(theme));
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || isPaused()) { applyTheme(next); return; }
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  });

  /* ---------------- Utilities ---------------- */
  $$('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });
  const fmt = new Intl.DateTimeFormat('es-UY', { timeZone: 'America/Montevideo', hour: '2-digit', minute: '2-digit', hour12: false });
  const tickClock = () => $$('.js-clock').forEach(el => { el.textContent = fmt.format(new Date()); });
  tickClock(); setInterval(tickClock, 15000);

  const copyBtn = $('.copy-btn');
  copyBtn?.addEventListener('click', async () => {
    const label = $('span', copyBtn);
    try { await navigator.clipboard.writeText(copyBtn.dataset.copy); label.textContent = 'Copiado'; }
    catch (e) { label.textContent = 'Usá el enlace'; }
    copyBtn.classList.add('is-done');
    setTimeout(() => { label.textContent = 'Copiar'; copyBtn.classList.remove('is-done'); }, 2000);
  });

  // Experience accordion (smooth height via CSS grid rows).
  $$('.xp-toggle').forEach(btn => btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    $('.toggle-label', btn).textContent = open ? 'Ocultar responsabilidades' : 'Ver responsabilidades';
    btn.closest('.xp-card').classList.toggle('is-open', open);
    setTimeout(() => window.ScrollTrigger?.refresh(), 650);
  }));

  // Decorative CSS loops pause while off-screen.
  const hasIO = 'IntersectionObserver' in window;
  if (hasIO) {
    const offIO = new IntersectionObserver(es => es.forEach(e => e.target.toggleAttribute('data-anim-off', !e.isIntersecting)), { rootMargin: '100px' });
    $$('.hero-visual, .focus, .skills, .contact, .about').forEach(el => offIO.observe(el));
  }

  /* ---------------- Header, navigation ---------------- */
  const header = $('.header');
  const nav = $('#navigation');
  const navLinks = $$(':scope > a', nav);
  const indicator = $('.nav-indicator');
  const menuBtn = $('.menu-toggle');
  let lenis = null;
  let activeLink = null;

  function moveIndicator(link) {
    if (!indicator || !desktopMQ.matches) return;
    if (!link || link.classList.contains('nav-mobile-only')) { indicator.style.opacity = '0'; return; }
    indicator.style.opacity = '1';
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }
  function setActive(id) {
    activeLink = null;
    navLinks.forEach(l => {
      const on = l.hash === '#' + id;
      l.classList.toggle('active', on);
      if (on) { l.setAttribute('aria-current', 'location'); activeLink = l; } else l.removeAttribute('aria-current');
    });
    moveIndicator(activeLink);
  }
  if (hasIO) {
    const secIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(s => secIO.observe(s));
  }
  addEventListener('resize', () => moveIndicator(activeLink), { passive: true });

  function setMenu(open, focusBack) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('menu-open', open);
    header.classList.remove('is-hidden');
    if (lenis) open ? lenis.stop() : lenis.start();
    if (!open && focusBack) menuBtn.focus();
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true); });
  desktopMQ.addEventListener('change', e => { if (e.matches) setMenu(false); moveIndicator(activeLink); });

  // Hide the header while reading down, bring it back on scroll up.
  const toTop = $('.to-top');
  const ringFill = $('.ring-fill');
  const progress = $('.header-progress');
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    if (!nav.classList.contains('open')) header.classList.toggle('is-hidden', y > lastY + 2 && y > innerHeight * .6);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
    progress.style.transform = `scaleX(${p})`;
    ringFill.style.strokeDashoffset = String(1 - p);
    toTop.classList.toggle('is-visible', y > innerHeight * .8);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (animate && window.Lenis) {
    lenis = new window.Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    if (nav.classList.contains('open')) setMenu(false);
    if (lenis) lenis.scrollTo(id === '#inicio' ? 0 : target, { offset: id === '#inicio' ? 0 : -24, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    if (id === '#contenido') target.focus({ preventScroll: true });
  }));

  // Experience mini-map follows the cards.
  const mapItems = $$('.xp-map li');
  if (hasIO && mapItems.length) {
    const cardIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      mapItems.forEach(li => li.classList.toggle('is-active', $('a', li).hash === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -50% 0px' });
    $$('.xp-card').forEach(c => cardIO.observe(c));
  }

  /* ---------------- Hero canvas ---------------- */
  const flow = initFlow($('.flow-canvas'));

  /* ---------------- Pointer niceties (desktop) ---------------- */
  if (finePointer && !reduceMQ.matches) {
    // Nav indicator follows hover and returns to the active section.
    navLinks.forEach(l => l.addEventListener('pointerenter', () => moveIndicator(l)));
    nav.addEventListener('pointerleave', () => moveIndicator(activeLink));

    // Hero chips drift with the pointer at different depths.
    const chips = $$('.chip');
    const heroEl = $('.hero');
    heroEl.addEventListener('pointermove', e => {
      if (isPaused() || !hasGSAP) return;
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      chips.forEach(c => gsap.to(c, { x: x * 30 * +c.dataset.depth, y: y * 24 * +c.dataset.depth, duration: 1.2, ease: 'power3.out' }));
    });

    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        if (isPaused()) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', `${(y - .5) * -6}deg`);
        card.style.setProperty('--ry', `${(x - .5) * 6}deg`);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => ['--rx', '--ry', '--mx', '--my'].forEach(p => card.style.removeProperty(p)));
    });

    const sheet = $('.focus-sheet');
    sheet?.addEventListener('pointermove', e => {
      const r = sheet.getBoundingClientRect();
      sheet.style.setProperty('--gx', `${(e.clientX - r.left) / r.width * 100}%`);
      sheet.style.setProperty('--gy', `${(e.clientY - r.top) / r.height * 100}%`);
    }, { passive: true });

    $$('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => { card.style.removeProperty('--mx'); card.style.removeProperty('--my'); });
    });

    if (hasGSAP) $$('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      const k = el.classList.contains('cta-circle') ? .3 : .16;
      el.addEventListener('pointermove', e => {
        if (isPaused()) return;
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * k); my((e.clientY - r.top - r.height / 2) * k * 1.3);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  syncMotion();
  if (!animate) return;

  /* ---------------- Scroll choreography ---------------- */
  gsap.registerPlugin(ScrollTrigger);
  const hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);

  // Ticker: slow drift that reacts to scroll speed and direction.
  const track = $('.ticker-track');
  if (track) {
    const group = $('.ticker-group', track);
    let x = 0, dir = -1;
    const setX = gsap.quickSetter(track, 'x', 'px');
    gsap.ticker.add((t, dt) => {
      const v = lenis ? lenis.velocity : 0;
      if (v > .3) dir = -1; else if (v < -.3) dir = 1;
      x += ((isPaused() ? 0 : 26) + Math.abs(v) * 8) * dir * dt / 1000;
      const w = group.offsetWidth;
      if (w) { x %= w; if (x > 0) x -= w; }
      setX(x);
    });
  }

  const start = () => {
    // Intro
    const desktop = desktopMQ.matches;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    let chars = $$('.hero-line');
    if (hasSplit) chars = SplitText.create('.hero-line', { type: 'chars', charsClass: 'char' }).chars;
    gsap.set('.hero-line', { visibility: 'visible' });
    tl.from(chars, { yPercent: 110, duration: 1.4, stagger: .028 }, .1)
      .fromTo('[data-intro]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1, stagger: .08 }, .3)
      .fromTo('.hero-visual', { opacity: 0, scale: .92, rotate: -6 }, { opacity: desktop ? 1 : .55, scale: 1, rotate: 0, duration: 2 }, .2);

    // Hero visual drifts as the page scrolls away
    gsap.to('.hero-visual', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Reveals
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, onStart: () => b.forEach(el => el.classList.add('is-visible')) })
    });

    // Titles rise line by line
    $$('[data-split]').forEach(h => {
      gsap.set(h, { visibility: 'visible' });
      if (!hasSplit) { gsap.from(h, { opacity: 0, y: 30, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 90%', once: true } }); return; }
      SplitText.create(h, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: h, start: 'top 90%', once: true } })
      });
    });

    // Profile lead lights up as it is read
    const lead = $('[data-fill]');
    if (lead && hasSplit) SplitText.create(lead, {
      type: 'words', wordsClass: 'word', autoSplit: true,
      onSplit: self => gsap.fromTo(self.words, { opacity: .18 }, { opacity: 1, stagger: .06, ease: 'none', scrollTrigger: { trigger: lead, start: 'top 82%', end: 'bottom 55%', scrub: true } })
    });

    // Portrait: soft clip reveal + inner parallax
    gsap.fromTo('.portrait-frame', { clipPath: 'inset(18% 10% 18% 10% round 200px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top 95%', end: 'top 40%', scrub: true } });
    gsap.fromTo('.portrait-frame img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Experience timeline line
    gsap.to('.xp-map-line span', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.xp-list', start: 'top 60%', end: 'bottom 60%', scrub: true } });

    // Dark sheets settle into place
    ['.focus-sheet', '.contact-sheet'].forEach(sel => {
      gsap.fromTo(sel, { scale: .95, y: 40 }, { scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: sel, start: 'top bottom', end: 'top 45%', scrub: true } });
    });
    gsap.fromTo('.contact-art', { rotate: -20 }, { rotate: 20, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });

    addEventListener('load', () => ScrollTrigger.refresh());
  };
  (document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve()).then(start);

  /* ==========================================================================
     Torus-knot line sculpture (Canvas 2D), batched by depth, theme-aware.
     ========================================================================== */
  function initFlow(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const host = canvas.parentElement;
    const TAU = Math.PI * 2, strips = 36, steps = 200, buckets = 10;
    let w = 0, h = 0, clock = 0, last = 0, frame = 0, visible = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let colors = {};
    const readColors = () => {
      const cs = getComputedStyle(root);
      colors = { line: cs.getPropertyValue('--canvas-line').trim(), accent: cs.getPropertyValue('--canvas-accent').trim(), dot: cs.getPropertyValue('--canvas-dot').trim() };
    };
    readColors();
    const center = t => { const r = 1.42 + .43 * Math.cos(3 * t); return [r * Math.cos(2 * t), r * Math.sin(2 * t), .7 * Math.sin(3 * t)]; };
    const pts = [];
    for (let s = 0; s < strips; s++) {
      const row = [];
      for (let j = 0; j <= steps; j++) {
        const t = j / steps * TAU, c = center(t), n = center(t + .001);
        let tx = n[0] - c[0], ty = n[1] - c[1], tz = n[2] - c[2];
        const L = Math.hypot(tx, ty, tz); tx /= L; ty /= L; tz /= L;
        const nn = Math.hypot(tx, ty), nx = -ty / nn, ny = tx / nn;
        const bx = -tz * ny, by = tz * nx, bz = tx * ny - ty * nx;
        const a = s / strips * TAU + t * 3, ca = .23 * Math.cos(a), sb = .23 * Math.sin(a);
        row.push([c[0] + nx * ca + bx * sb, c[1] + ny * ca + by * sb, c[2] + bz * sb]);
      }
      pts.push(row);
    }
    const proj = (p, rot, out) => {
      const ax = .94 + pointer.y * .16, ay = -.36 + Math.sin(rot * .5) * .15 + pointer.x * .2, az = -.3 + rot * .14;
      const y1 = p[1] * Math.cos(ax) - p[2] * Math.sin(ax), z1 = p[1] * Math.sin(ax) + p[2] * Math.cos(ax);
      const x2 = p[0] * Math.cos(ay) + z1 * Math.sin(ay), z2 = -p[0] * Math.sin(ay) + z1 * Math.cos(ay);
      const x3 = x2 * Math.cos(az) - y1 * Math.sin(az), y3 = x2 * Math.sin(az) + y1 * Math.cos(az);
      const sc = Math.min(w, h) / 4.9, per = 7 / (7 + z2);
      out[0] = w * .5 + x3 * sc * per; out[1] = h * .5 + y3 * sc * per; out[2] = z2;
      return out;
    };
    const paths = Array.from({ length: buckets }, () => []);
    const A = [0, 0, 0], B = [0, 0, 0];
    function render() {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      paths.forEach(p => { p.length = 0; });
      for (let s = 0; s < strips; s++) {
        proj(pts[s][0], clock, A);
        for (let j = 1; j <= steps; j++) {
          proj(pts[s][j], clock, B);
          const k = clamp(Math.floor((1.9 - (A[2] + B[2]) * .5) / 3.8 * buckets), 0, buckets - 1);
          paths[k].push(A[0], A[1], B[0], B[1]);
          A[0] = B[0]; A[1] = B[1]; A[2] = B[2];
        }
      }
      ctx.lineWidth = .7;
      for (let k = 0; k < buckets; k++) {
        const arr = paths[k];
        if (!arr.length) continue;
        ctx.strokeStyle = `rgba(${colors.line},${(.1 + k / buckets * .55).toFixed(3)})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 4) { ctx.moveTo(arr[i], arr[i + 1]); ctx.lineTo(arr[i + 2], arr[i + 3]); }
        ctx.stroke();
      }
      for (let i = 0; i < 3; i++) {
        proj(center((clock * .22 + i * TAU / 3) % TAU), clock, A);
        ctx.beginPath(); ctx.arc(A[0], A[1], 6, 0, TAU); ctx.fillStyle = colors.dot; ctx.fill();
        ctx.beginPath(); ctx.arc(A[0], A[1], 3, 0, TAU); ctx.fillStyle = `rgb(${colors.accent})`; ctx.fill();
      }
    }
    function tick(now) {
      frame = 0;
      if (isPaused() || !visible || document.hidden) return;
      if (now - last >= 30) {
        const dt = last ? Math.min((now - last) / 1000, .06) : .03;
        const boost = lenis ? Math.min(Math.abs(lenis.velocity) * .03, 1.2) : 0;
        clock += dt * (.22 + boost);
        pointer.x += (pointer.tx - pointer.x) * .06; pointer.y += (pointer.ty - pointer.y) * .06;
        render(); last = now;
      }
      frame = requestAnimationFrame(tick);
    }
    const run = () => { cancelAnimationFrame(frame); frame = 0; last = 0; render(); if (!isPaused() && visible && !document.hidden) frame = requestAnimationFrame(tick); };
    const resize = () => {
      const r = host.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
      ctx.setTransform(d, 0, 0, d, 0, 0); render();
    };
    addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect();
      pointer.tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      pointer.ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
    }, { passive: true });
    'ResizeObserver' in window ? new ResizeObserver(resize).observe(host) : addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; run(); }).observe(host);
    document.addEventListener('visibilitychange', run);
    motionHooks.push(run);
    themeHooks.push(() => { readColors(); render(); });
    resize(); run();
    return { run };
  }
})();
