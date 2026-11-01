(() => {
  'use strict';
  const translations = [...document.querySelectorAll('[data-en]')].map(element => ({
    element, zh: element.textContent, en: element.dataset.en
  }));
  const controls = [...document.querySelectorAll('[data-lang]')];
  const config = window.POSTER_CONFIG || {};
  const isAwardsPage = document.body.dataset.page === 'awards';
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
      if (key === 'submission' && config.submissionClosed === true) {
        link.removeAttribute('href');
        link.removeAttribute('target');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('tabindex', '-1');
        link.classList.add('placeholder-link');
        link.querySelector('[data-en]').textContent = lang === 'en' ? 'Submissions closed' : '投稿已截止';
        return;
      }
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
    document.title = isAwardsPage
      ? (lang === 'en' ? 'Award-winning Posters | 2026 International Conference on AI for Engineering' : '获奖海报展示 | 2026 国际工程智能大会')
      : lang === 'en'
      ? 'Workshop Papers & Posters | 2026 International Conference on AI for Engineering'
      : 'Workshop 论文海报 | 2026 国际工程智能大会';
    document.querySelector('meta[name="description"]').content = isAwardsPage
      ? (lang === 'en' ? 'Browse all 20 award-winning posters and real ceremony photos from AI4E2026: 2 Best Paper Awards, 7 Best Paper Candidate Awards and 11 Outstanding Paper Awards.' : '2026国际工程智能大会获奖海报展示：真实颁奖照片轮播，按最佳论文奖2篇、最佳论文候选奖7篇、杰出论文奖11篇分类展示20份原始海报PDF。')
      : lang === 'en'
      ? '2026 International Conference on AI for Engineering. Workshop submissions are closed: 57 submissions, 20 accepted, 2 Best Paper Awards, 7 Best Paper Candidate Awards and 11 Outstanding Paper Awards. Main forum: 31 October, 14:00–18:20 Beijing Time (UTC+8).'
      : '2026国际工程智能大会Workshop投稿已截止：共57篇投稿、20篇入选，评出2篇最佳论文、7篇最佳论文候选及11篇杰出论文。10月31日主论坛14:00–18:20，海报颁奖18:05–18:15（北京时间）。';
    document.querySelector('.desktop-nav').setAttribute('aria-label', lang === 'en' ? 'Primary navigation' : '主要导航');
    controls.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.lang === lang)));
    updateLinks(lang);
    document.querySelectorAll('[data-local-page]').forEach(link => {
      const [path, hash] = link.dataset.localPage.split('#');
      link.setAttribute('href', `${path}?lang=${lang}${hash ? `#${hash}` : ''}`);
    });
    try { localStorage.setItem('iaie-poster-language', lang); } catch (_) { /* Local file privacy settings may disable storage. */ }
    document.dispatchEvent(new CustomEvent('site:languagechange', { detail: { lang } }));
  }
  controls.forEach(control => control.addEventListener('click', () => setLanguage(control.dataset.lang)));
  let initialLanguage = 'zh';
  try { initialLanguage = localStorage.getItem('iaie-poster-language') || 'zh'; } catch (_) { /* Keep Chinese as the default. */ }
  const queryLanguage = new URLSearchParams(location.search).get('lang');
  if (queryLanguage === 'en' || queryLanguage === 'zh') initialLanguage = queryLanguage;
  setLanguage(initialLanguage);
})();
