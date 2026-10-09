// Privacy-friendly analytics (Umami: no cookies, no personal data) plus a few named events.
// Paste the Website ID from your Umami dashboard below. While it is empty nothing loads and track() does nothing.
const WEBSITE_ID = '00201639-cace-48ee-b419-05deec5ca56b';
const SCRIPT_SRC = 'https://cloud.umami.is/script.js';
const DOMAINS = 'simplybydaniel.com';

const queue = [];
let ready = false;

export function track(name, data) {
  if (!WEBSITE_ID) return;
  if (ready && window.umami) window.umami.track(name, data);
  else queue.push([name, data]);
}

export function initAnalytics() {
  if (!WEBSITE_ID) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = SCRIPT_SRC;
  s.dataset.websiteId = WEBSITE_ID;
  s.dataset.domains = DOMAINS;       // ignore localhost and preview URLs
  s.dataset.doNotTrack = 'true';     // respect the browser's Do Not Track setting
  s.onload = () => { ready = true; queue.splice(0).forEach(([n, d]) => window.umami?.track(n, d)); };
  document.head.appendChild(s);

  // Clicks on anything marked data-track="name"
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-track]');
    if (el) track(el.dataset.track);
  });

  // Which sections people actually reach
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !seen.has(en.target.id)) { seen.add(en.target.id); track('view-' + en.target.id); }
      });
    }, { threshold: 0.35 });
    ['process', 'case-studies', 'about', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
}
