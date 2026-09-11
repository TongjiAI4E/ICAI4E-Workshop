(() => {
  'use strict';
  const translations = [...document.querySelectorAll('[data-en]')].map(element => ({
    element, zh: element.textContent, en: element.dataset.en
  }));
  const controls = [...document.querySelectorAll('[data-lang]')];
  const config = window.POSTER_CONFIG || {};
  const enabledLabels = {
    submission: ['进入投稿系统', 'Submit your work'],
    posterTemplate: ['下载 Poster 模板', 'Download poster template'],
    paperTemplate: ['下载论文模板', 'Download paper template']
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
      ? 'Workshop Call for Papers | 2026 International Conference on AI for Engineering'
      : 'Workshop 论文征集 | 2026 国际工程智能大会';
    document.querySelector('meta[name="description"]').content = lang === 'en'
      ? '2026 International Conference on AI for Engineering, Workshop Call for Papers. Submissions open on 12 September; papers are due by 10 October; acceptance notifications on 15 October; poster presentation and awards on 1 November.'
      : '2026国际工程智能大会Workshop论文征集，投稿于9月12日开始，10月10日投稿截止，10月15日通知入选，11月1日现场展示与颁奖。';
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
