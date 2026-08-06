/* ===================================================================
   custom-ui.js — UI interactions & motion
   Scroll reveals · animated counters · card tilt · hero badge effects ·
   lightweight parallax · floating background nodes · perf guards
   =================================================================== */

(function () {
  'use strict';

  const utils = (window.RV && window.RV.utils) || {};
  const $ = utils.$ || ((s, c) => (c || document).querySelector(s));
  const $$ = utils.$$ || ((s, c) => Array.from((c || document).querySelectorAll(s)));
  const throttle = utils.throttle || ((fn) => fn);

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------------
     Scroll reveal (IntersectionObserver)
  ----------------------------------------------------------------*/
  const revealEls = $$('.reveal-up');

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* -------------------------------------------------------------
     Animated counters (hero meta stats)
  ----------------------------------------------------------------*/
  const counters = $$('.meta-item__value');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const value = Math.round(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.closest('.meta-item') && el.closest('.meta-item').classList.add('is-counted');
      }
    }

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      el.closest('.meta-item') && el.closest('.meta-item').classList.add('is-counted');
      return;
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => counterIO.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* -------------------------------------------------------------
     Hero ID badge — mouse-tilt interaction (desktop only, lightweight)
  ----------------------------------------------------------------*/
  const badgeWrap = $('#badgeWrap');
  const idBadge = $('#idBadge');
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  if (badgeWrap && idBadge && !isCoarsePointer && !prefersReducedMotion) {
    let raf = null;

    badgeWrap.addEventListener('mousemove', (e) => {
      const rect = badgeWrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rotateY = px * 14;
        const rotateX = -py * 10;
        idBadge.style.transform =
          `perspective(900px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(-2px)`;
      });
    });

    badgeWrap.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      idBadge.style.transform = 'perspective(900px) rotateY(-6deg) rotateX(2deg)';
    });
  }

  /* -------------------------------------------------------------
     Lightweight parallax for hero visual on scroll
  ----------------------------------------------------------------*/
  const hero = $('.hero');

  if (hero && badgeWrap && !prefersReducedMotion) {
    const onScrollParallax = throttle(() => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progress = 1 - Math.max(0, Math.min(1, rect.top / window.innerHeight));
      badgeWrap.style.transform = `translateY(${progress * -18}px)`;
    }, 40);

    window.addEventListener('scroll', onScrollParallax, { passive: true });
  }

  /* -------------------------------------------------------------
     Card lift micro-interaction (platform cards) — pointer tracking
     for a subtle glow position, CPU-cheap
  ----------------------------------------------------------------*/
  $$('.platform-card, .cap-card, .cert-badge').forEach((card) => {
    if (isCoarsePointer || prefersReducedMotion) return;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.background =
        `radial-gradient(240px circle at ${x}% ${y}%, var(--surface-3), var(--surface))`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });

  /* -------------------------------------------------------------
     Floating background nodes — identity-graph ambient canvas
     Kept subtle and low-cost: capped node count, pauses off-screen,
     respects reduced-motion, and pauses on tab blur.
  ----------------------------------------------------------------*/
  (function initNodes() {
    const host = $('#bgNodes');
    if (!host || prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width, height, dpr;
    let nodes = [];
    let animId = null;
    let running = true;

    const NODE_COUNT = Math.min(38, Math.floor((window.innerWidth * window.innerHeight) / 42000));
    const LINK_DIST = 130;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = Math.max(window.innerHeight, document.documentElement.scrollHeight * 0.6);
      height = Math.min(height, window.innerHeight * 1.6); // keep it cheap, top of page only
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeNodes() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }

    function styleColor() {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      return {
        dot: isLight ? 'rgba(23,26,34,0.28)' : 'rgba(232,236,244,0.35)',
        line: isLight ? 'rgba(23,26,34,0.07)' : 'rgba(232,236,244,0.06)',
        accent: isLight ? 'rgba(185,112,14,0.4)' : 'rgba(232,163,61,0.4)',
      };
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const colors = styleColor();

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = colors.line;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n, idx) => {
        ctx.beginPath();
        ctx.fillStyle = idx % 9 === 0 ? colors.accent : colors.dot;
        ctx.arc(n.x, n.y, idx % 9 === 0 ? 2 : 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(tick);
    }

    resize();
    makeNodes();
    tick();

    window.addEventListener('resize', throttle(() => {
      resize();
      makeNodes();
    }, 300));

    // Perf: pause animation when tab is hidden
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running && !animId) tick();
      if (!running && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });
  })();

  /* -------------------------------------------------------------
     Section transition effect — subtle fade-in of alt sections'
     background as they enter (perf-friendly, class toggle only)
  ----------------------------------------------------------------*/
  const sections = $$('.section');
  if ('IntersectionObserver' in window && sections.length) {
    const sectionIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-in-view', entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );
    sections.forEach((s) => sectionIO.observe(s));
  }
})();
