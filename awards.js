(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const language = () => document.documentElement.lang === 'en' ? 'en' : 'zh';
  const banner = document.querySelector('[data-banner]');
  if (banner) {
    const slides = [...banner.querySelectorAll('.banner-slide')];
    const strip = banner.querySelector('.banner-slides');
    const dots = [...banner.querySelectorAll('[data-slide]')];
    const position = banner.querySelector('.banner-position');
    const pause = banner.querySelector('[data-banner-pause]');
    let current = 0;
    let paused = motion.matches;
    let hovered = false;
    let timer;
    let transition = 0;
    slides.forEach(slide => { slide.querySelector('img').loading = 'eager'; });
    function updatePauseLabel() {
      pause.querySelector('span').textContent = language() === 'en'
        ? (paused ? 'Play slideshow' : 'Pause slideshow')
        : (paused ? '播放轮播' : '暂停轮播');
      pause.setAttribute('aria-pressed', String(paused));
    }
    function schedule() {
      clearTimeout(timer);
      const playing = !paused && !hovered && !document.hidden && !banner.matches(':focus-within');
      banner.dataset.playing = String(playing);
      if (playing) timer = setTimeout(() => show(current + 1), 5000);
    }
    async function show(index) {
      clearTimeout(timer);
      const requested = (index + slides.length) % slides.length;
      const request = ++transition;
      const photo = slides[requested].querySelector('img');
      try {
        if (!photo.complete || !photo.naturalWidth) await photo.decode();
      } catch (_) {
        // Keep the last complete photograph visible if the next asset is unavailable.
        if (request === transition) schedule();
        return;
      }
      if (request !== transition) return;
      current = requested;
      strip.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === current)));
      slides[current].querySelector('img').loading = 'eager';
      slides[(current + 1) % slides.length].querySelector('img').loading = 'eager';
      position.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      banner.dataset.activeSlide = String(current + 1);
      schedule();
    }
    banner.querySelector('.banner-controls').hidden = false;
    banner.querySelector('[data-banner-prev]').addEventListener('click', () => show(current - 1));
    banner.querySelector('[data-banner-next]').addEventListener('click', () => show(current + 1));
    dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.slide))));
    pause.addEventListener('click', () => { paused = !paused; updatePauseLabel(); schedule(); });
    banner.addEventListener('mouseenter', () => { hovered = true; schedule(); });
    banner.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    banner.addEventListener('focusin', schedule);
    banner.addEventListener('focusout', () => setTimeout(schedule, 0));
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('site:languagechange', updatePauseLabel);
    motion.addEventListener('change', () => { paused = motion.matches; updatePauseLabel(); schedule(); });
    let touchStart;
    const frame = banner.querySelector('.banner-frame');
    frame.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
    frame.addEventListener('touchend', event => {
      if (touchStart === undefined) return;
      const delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
      touchStart = undefined;
    }, { passive: true });
    updatePauseLabel();
    show(0);
  }

  document.querySelectorAll('[data-gallery]').forEach(group => {
    const track = group.querySelector('.poster-track');
    const cards = [...track.children];
    const previous = group.querySelector('[data-gallery-prev]');
    const next = group.querySelector('[data-gallery-next]');
    const position = group.querySelector('.gallery-position');
    group.querySelector('.gallery-controls').hidden = false;
    function step() { return cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap); }
    function update() {
      const max = track.scrollWidth - track.clientWidth;
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      const first = Math.max(1, Math.round(track.scrollLeft / step()) + 1);
      const visible = Math.max(1, Math.floor((track.clientWidth + parseFloat(getComputedStyle(track).columnGap) + 2) / step()));
      const last = Math.min(cards.length, first + visible - 1);
      position.textContent = `${first === last ? first : `${first}–${last}`} / ${cards.length}`;
    }
    function move(direction) {
      track.scrollBy({ left: direction * step(), behavior: motion.matches ? 'instant' : 'smooth' });
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: motion.matches ? 'instant' : 'smooth' });
      }
    });
    new ResizeObserver(update).observe(track);
    update();
  });

  // Static previews and direct PDF links also work from a local file or without JS.
  // Under HTTP(S), visible posters are rendered directly from their original PDFs.
  if (!/^https?:$/.test(location.protocol)) return;
  const assets = new URL('vendor/pdfjs/', document.baseURI);
  let library;
  const queue = [];
  let running = 0;
  async function renderPoster(link) {
    let task;
    try {
      library ||= import(new URL('pdf.min.mjs', assets).href);
      const pdfjs = await library;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', assets).href;
      task = pdfjs.getDocument({
        url: new URL(link.dataset.pdf, document.baseURI).href,
        cMapUrl: new URL('cmaps/', assets).href,
        cMapPacked: true,
        standardFontDataUrl: new URL('standard_fonts/', assets).href,
        wasmUrl: new URL('wasm/', assets).href,
        isEvalSupported: false
      });
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const width = Math.min(1600, Math.max(1000, link.clientWidth * Math.min(devicePixelRatio || 1, 2)));
      const viewport = page.getViewport({ scale: width / base.width });
      const canvas = link.querySelector('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, background: '#ffffff' }).promise;
      canvas.hidden = false;
      link.querySelector('img').hidden = true;
      link.dataset.pdfRendered = 'true';
    } catch (_) {
      // Keep the complete, pre-rendered page and original PDF link available.
      link.dataset.pdfRendered = 'fallback';
    } finally {
      if (task) await task.destroy();
    }
  }
  function drain() {
    while (running < 2 && queue.length) {
      running++;
      renderPoster(queue.shift()).finally(() => { running--; drain(); });
    }
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      queue.push(entry.target);
    });
    drain();
  }, { rootMargin: '450px 0px', threshold: 0.01 });
  document.querySelectorAll('[data-pdf]').forEach(link => observer.observe(link));
})();
