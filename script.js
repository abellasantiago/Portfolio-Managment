(() => {
  'use strict';

  const root = document.documentElement;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('.motion-toggle');
  let userPaused = false;
  try { userPaused = localStorage.getItem('sa-motion-paused') === 'true'; } catch { /* Preferences are optional. */ }
  let motionPaused = media.matches || userPaused;
  let drawFlow = () => {};

  function updateMotion() {
    motionPaused = media.matches || userPaused;
    root.classList.toggle('motion-paused', motionPaused);
    root.classList.toggle('motion-enabled', !motionPaused);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    const label = motionPaused ? 'Activar animaciones' : 'Pausar animaciones';
    motionButton.setAttribute('aria-label', label);
    motionButton.disabled = media.matches;
    motionButton.title = media.matches ? 'Movimiento reducido según la configuración de tu dispositivo' : label;
    if (motionPaused) document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    drawFlow();
  }
  motionButton.addEventListener('click', () => {
    if (media.matches) return;
    userPaused = !userPaused;
    try { localStorage.setItem('sa-motion-paused', String(userPaused)); } catch { /* Storage may be unavailable. */ }
    updateMotion();
  });
  media.addEventListener('change', updateMotion);
  updateMotion();

  const header = document.querySelector('.header');
  const progress = document.querySelector('.reading-progress');
  let scrollPending = false;
  function updateScroll() {
    const total = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
    header.classList.toggle('scrolled', scrollY > 20);
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  function closeMenu(returnFocus = false) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('menu-open');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('menu-open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !header.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  document.querySelector('#year').textContent = new Date().getFullYear();

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px 24px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll('a').forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(el => sectionObserver.observe(el));
  } else {
    root.classList.remove('motion-enabled');
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', event => {
        if (motionPaused) return;
        const rect = el.getBoundingClientRect();
        el.style.translate = `${(event.clientX - rect.left - rect.width / 2) * .1}px ${(event.clientY - rect.top - rect.height / 2) * .14}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  // A continuous torus-knot surface: no meshes, polyhedra or external libraries.
  const canvas = document.querySelector('#flow-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const host = document.querySelector('.hero-visual');
  const TAU = Math.PI * 2;
  const strips = 42;
  const steps = 230;
  let width = 0, height = 0, clock = 0, lastFrame = 0, frameId = 0;
  let inView = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const center = t => {
    const r = 1.42 + .43 * Math.cos(3 * t);
    return [r * Math.cos(2 * t), r * Math.sin(2 * t), .7 * Math.sin(3 * t)];
  };
  const points = [];
  for (let strip = 0; strip < strips; strip++) {
    const pointsOnStrip = [];
    for (let step = 0; step <= steps; step++) {
      const t = step / steps * TAU;
      const c = center(t);
      const next = center(t + .001);
      let tx = next[0] - c[0], ty = next[1] - c[1], tz = next[2] - c[2];
      const length = Math.hypot(tx, ty, tz);
      tx /= length; ty /= length; tz /= length;
      const norm = Math.hypot(tx, ty);
      const nx = -ty / norm, ny = tx / norm;
      const bx = -tz * ny, by = tz * nx, bz = tx * ny - ty * nx;
      const angle = strip / strips * TAU + t * 3;
      const a = .23 * Math.cos(angle), b = .23 * Math.sin(angle);
      pointsOnStrip.push([c[0] + nx * a + bx * b, c[1] + ny * a + by * b, c[2] + bz * b]);
    }
    points.push(pointsOnStrip);
  }

  function project(point, rotation) {
    const [x, y, z] = point;
    const ax = .94 + pointer.y * .13;
    const ay = -.36 + Math.sin(rotation * .5) * .15 + pointer.x * .16;
    const az = -.3 + rotation * .14;
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
    const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
    const x3 = x2 * Math.cos(az) - y1 * Math.sin(az);
    const y3 = x2 * Math.sin(az) + y1 * Math.cos(az);
    const scale = Math.min(width / 4.5, height / 4.5) * (1 + Math.sin(rotation * .8) * .018);
    const perspective = 7 / (7 + z2);
    return [width * .51 + x3 * scale * perspective, height * .46 + y3 * scale * perspective, z2];
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const shadow = ctx.createRadialGradient(width * .53, height * .53, 5, width * .53, height * .53, width * .42);
    shadow.addColorStop(0, '#b2c59826');
    shadow.addColorStop(1, '#b2c59800');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, width, height);

    // Drawing small segments back-to-front preserves the knot's depth.
    const segments = [];
    for (let s = 0; s < strips; s++) {
      let previous = project(points[s][0], clock);
      for (let j = 1; j <= steps; j++) {
        const current = project(points[s][j], clock);
        segments.push([previous, current, (previous[2] + current[2]) * .5, s]);
        previous = current;
      }
    }
    segments.sort((a, b) => b[2] - a[2]);
    ctx.lineWidth = .65;
    for (const [a, b, depth, strip] of segments) {
      const opacity = .15 + Math.min(1, Math.max(0, (1.9 - depth) / 3.8)) * .55;
      ctx.strokeStyle = strip % 7 === 0 ? `rgba(115,143,81,${opacity})` : `rgba(47,91,61,${opacity})`;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // Three travelling accents tie the continuous form to the idea of connection.
    for (let i = 0; i < 3; i++) {
      const t = (clock * .22 + i * TAU / 3) % TAU;
      const p = project(center(t), clock);
      ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, TAU); ctx.fillStyle = '#f4f4ed'; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, TAU); ctx.fillStyle = '#7e9959'; ctx.fill();
    }
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  function tick(now) {
    frameId = 0;
    if (motionPaused || !inView || document.hidden) return;
    if (now - lastFrame >= 32) {
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .06) : .033;
      clock += delta * .24;
      pointer.x += (pointer.tx - pointer.x) * .06;
      pointer.y += (pointer.ty - pointer.y) * .06;
      render();
      lastFrame = now;
    }
    frameId = requestAnimationFrame(tick);
  }
  drawFlow = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
    render();
    if (!motionPaused && inView && !document.hidden) frameId = requestAnimationFrame(tick);
  };
  host.addEventListener('pointermove', event => {
    const rect = host.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.ty = (event.clientY - rect.top) / rect.height * 2 - 1;
  }, { passive: true });
  host.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    drawFlow();
  }, { rootMargin: '100px' }).observe(host);
  document.addEventListener('visibilitychange', drawFlow);
  resize();
  drawFlow();
})();
