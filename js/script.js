/* ===================================================================
   script.js — core site functionality
   Navigation · mobile menu · theme switching · typing animation ·
   scroll spy · smooth scrolling · contact form · filtering ·
   copy email · resume download · back-to-top
   =================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------
     Utilities
  ----------------------------------------------------------------*/
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function throttle(fn, wait) {
    let last = 0;
    let scheduled = false;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      } else if (!scheduled) {
        scheduled = true;
        setTimeout(() => {
          last = Date.now();
          scheduled = false;
          fn.apply(this, args);
        }, wait - (now - last));
      }
    };
  }

  /* -------------------------------------------------------------
     Preloader
  ----------------------------------------------------------------*/
  window.addEventListener('load', () => {
    const pre = $('#preloader');
    if (!pre) return;
    setTimeout(() => pre.classList.add('is-hidden'), 350);
  });

  /* -------------------------------------------------------------
     Footer year
  ----------------------------------------------------------------*/
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------------------------------------------------
     Theme switching (dark / light) with persistence
  ----------------------------------------------------------------*/
  const THEME_KEY = 'rv-portfolio-theme';
  const themeToggle = $('#themeToggle');

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }
  }

  (function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { /* noop */ }
    if (stored) {
      applyTheme(stored);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  })();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  /* -------------------------------------------------------------
     Mobile menu
  ----------------------------------------------------------------*/
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger && hamburger.setAttribute('aria-expanded', 'false');
    hamburger && hamburger.setAttribute('aria-label', 'Open menu');
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburger && hamburger.setAttribute('aria-expanded', 'true');
    hamburger && hamburger.setAttribute('aria-label', 'Close menu');
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('is-open');
      isOpen ? closeMobileMenu() : openMobileMenu();
    });
  }

  $$('#mobileMenu a').forEach((a) => a.addEventListener('click', closeMobileMenu));

  /* -------------------------------------------------------------
     Header scroll state + scroll progress bar
  ----------------------------------------------------------------*/
  const siteHeader = $('#siteHeader');
  const scrollProgress = $('#scrollProgress');
  const backToTop = $('#backToTop');

  const onScrollHeader = throttle(() => {
    const y = window.scrollY || window.pageYOffset;

    if (siteHeader) siteHeader.classList.toggle('is-scrolled', y > 12);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = pct + '%';

    if (backToTop) backToTop.classList.toggle('is-visible', y > 600);
  }, 60);

  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -------------------------------------------------------------
     Smooth scrolling for in-page anchors (accounts for fixed header)
  ----------------------------------------------------------------*/
  const HEADER_OFFSET = 84;

  $$('a[data-nav], .scroll-cue, .brand').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileMenu();
      history.pushState(null, '', href);
    });
  });

  /* -------------------------------------------------------------
     Scroll spy — highlight active nav link
  ----------------------------------------------------------------*/
  const navLinks = $$('.nav__link[data-nav]');
  const spySections = navLinks
    .map((l) => document.getElementById(l.getAttribute('href').slice(1)))
    .filter(Boolean);

  function updateScrollSpy() {
    const y = window.scrollY + HEADER_OFFSET + 40;
    let currentId = spySections[0] && spySections[0].id;

    spySections.forEach((sec) => {
      if (sec.offsetTop <= y) currentId = sec.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', throttle(updateScrollSpy, 100), { passive: true });
  updateScrollSpy();

  /* -------------------------------------------------------------
     Typing animation (hero headline target word)
  ----------------------------------------------------------------*/
  const typeTarget = $('#typeTarget');
  const WORDS = ['provisioned', 'governed', 'certified', 'audited', 'revoked'];

  function typeLoop() {
    if (!typeTarget) return;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const word = WORDS[wordIndex];

      if (!deleting) {
        charIndex++;
        typeTarget.textContent = word.slice(0, charIndex);
        if (charIndex === word.length) {
          deleting = true;
          setTimeout(tick, 1600);
          return;
        }
      } else {
        charIndex--;
        typeTarget.textContent = word.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % WORDS.length;
        }
      }
      setTimeout(tick, deleting ? 45 : 90);
    }
    tick();
  }

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    typeLoop();
  } else if (typeTarget) {
    typeTarget.textContent = WORDS[0];
  }

  /* -------------------------------------------------------------
     Capability filtering ("project / skill filtering")
  ----------------------------------------------------------------*/
  const filterBar = $('#filterBar');
  const capCards = $$('.cap-card');

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      $$('.filter-btn', filterBar).forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');
      capCards.forEach((card) => {
        const match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !match);
      });
    });
  }

  /* -------------------------------------------------------------
     Copy email button
  ----------------------------------------------------------------*/
  const copyEmailBtn = $('#copyEmailBtn');
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = copyEmailBtn.getAttribute('data-email');
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          const ta = document.createElement('textarea');
          ta.value = email;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        copyEmailBtn.classList.add('is-copied');
        copyEmailBtn.querySelector('span').textContent = 'Copied';
        showToast('Email copied to clipboard');
        setTimeout(() => {
          copyEmailBtn.classList.remove('is-copied');
          copyEmailBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
      } catch (err) {
        showToast('Could not copy — email: ' + email);
      }
    });
  }

  /* -------------------------------------------------------------
     Resume download feedback
  ----------------------------------------------------------------*/
  $$('#resumeBtn, #mobileResumeBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Downloading résumé…');
    });
  });

  /* -------------------------------------------------------------
     Contact form handling (client-side validation + simulated send)
  ----------------------------------------------------------------*/
  const contactForm = $('#contactForm');
  const submitBtn = $('#submitBtn');
  const formStatus = $('#formStatus');

  function setFieldError(input, message) {
    const row = input.closest('.form-row');
    const errorEl = $(`[data-error-for="${input.id}"]`);
    if (message) {
      row && row.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    } else {
      row && row.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }
  }

  function validateField(input) {
    const value = input.value.trim();

    if (!value) {
      setFieldError(input, 'This field is required.');
      return false;
    }
    if (input.type === 'email') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(value)) {
        setFieldError(input, 'Enter a valid email address.');
        return false;
      }
    }
    setFieldError(input, '');
    return true;
  }

  if (contactForm) {
    $$('input, textarea', contactForm).forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fields = $$('input, textarea', contactForm);
      const allValid = fields.map(validateField).every(Boolean);

      if (!allValid) {
        formStatus.textContent = 'Please fix the highlighted fields.';
        formStatus.classList.add('is-error');
        return;
      }

      formStatus.classList.remove('is-error');
      submitBtn.classList.add('submitting');
      submitBtn.disabled = true;
      formStatus.textContent = 'Sending request…';

      // No backend is wired up — simulate a network round-trip so the
      // interaction feels real, then confirm and reset the form.
      setTimeout(() => {
        submitBtn.classList.remove('submitting');
        submitBtn.disabled = false;
        formStatus.textContent = 'Message received — I\u2019ll reply within 1 business day.';
        showToast('Request submitted');
        contactForm.reset();
      }, 1100);
    });
  }

  /* -------------------------------------------------------------
     Close mobile menu on resize to desktop width
  ----------------------------------------------------------------*/
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 860) closeMobileMenu();
  }, 150));

  /* Expose small helpers for custom-ui.js */
  window.RV = window.RV || {};
  window.RV.utils = { $, $$, throttle, debounce };
})();
