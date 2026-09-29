(() => {
  'use strict';
  const translations = [...document.querySelectorAll('[data-en]')].map(element => ({
    element, zh: element.textContent, en: element.dataset.en
  }));
  const controls = [...document.querySelectorAll('[data-lang]')];
  const config = window.POSTER_CONFIG || {};
  const enabledLabels = {
    submission: ['进入投稿系统', 'Submit your work'],
    posterTemplate: ['下载海报模板', 'Download poster template'],
    paperTemplate: ['参考论文模板（可自定义格式）', 'Reference paper template (custom formats welcome)']
  };
  function safeLink(value, key) {
    if (typeof value !== 'string' || !value.trim()) return '';
    value = value.trim();
    if (key === 'contact') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : '';
    if (/^(?:https?:\/\/|\.\.?\/|assets\/|downloads\/|templates\/)/i.test(value)) return value;
    return '';
  }
  function updateLinks(lang) {
    document.querySelectorAll('[data-link]').forEach(link => {
      const key = link.dataset.link;
      const destination = safeLink(config[key], key);
      if (!destination) return;
      link.href = destination;
      link.removeAttribute('aria-disabled');
      link.classList.remove('placeholder-link');
      if (key === 'contact') link.textContent = config[key];
      else link.querySelector('[data-en]').textContent = enabledLabels[key][lang === 'en' ? 1 : 0];
      if (/^https?:/.test(destination)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    });
  }
  function setLanguage(lang) {
    lang = lang === 'en' ? 'en' : 'zh';
    translations.forEach(item => { item.element.textContent = item[lang]; });
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = lang === 'en'
      ? 'Workshop Call for Posters | 2026 International Conference on AI for Engineering'
      : 'Workshop 海报征集 | 2026 国际工程智能大会';
    document.querySelector('meta[name="description"]').content = lang === 'en'
      ? '2026 International Conference on AI for Engineering, part of the World Laureates Forum, coordinated by the World Laureates Foundation. Workshop posters due 15 October; accepted posters announced 20 October; poster exhibition 30–31 October; awards and main forum 31 October.'
      : '2026国际工程智能大会为世界顶尖科学家论坛组成部分，由上海世界顶尖科学家发展基金会统筹举办。Workshop海报10月15日截稿，10月20日通知入选海报，10月30—31日海报展示，10月31日颁奖及主论坛。';
    document.querySelector('.desktop-nav').setAttribute('aria-label', lang === 'en' ? 'Primary navigation' : '主要导航');
    controls.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.lang === lang)));
    updateLinks(lang);
    try { localStorage.setItem('iaie-poster-language', lang); } catch (_) { /* Local file privacy settings may disable storage. */ }
  }
  controls.forEach(control => control.addEventListener('click', () => setLanguage(control.dataset.lang)));
  let initialLanguage = 'zh';
  try { initialLanguage = localStorage.getItem('iaie-poster-language') || 'zh'; } catch (_) { /* Keep Chinese as the default. */ }
  const queryLanguage = new URLSearchParams(location.search).get('lang');
  if (queryLanguage === 'en' || queryLanguage === 'zh') initialLanguage = queryLanguage;
  setLanguage(initialLanguage);
})();
