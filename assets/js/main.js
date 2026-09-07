document.getElementById('year').textContent = new Date().getFullYear();

const RELEASES_URL = 'https://github.com/creulcat/DyadLauncher/releases';
const OS_LABELS = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };

function detectVisitorOS() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'macos';
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux';
  return null;
}

const visitorOS = detectVisitorOS();
const visitorCard = visitorOS && document.querySelector(`.dl-card[data-os="${visitorOS}"]`);

(function tagVisitorOS() {
  if (!visitorCard) return;
  visitorCard.setAttribute('data-you', '');
  const tag = visitorCard.querySelector('.you-tag');
  if (tag) tag.hidden = false;
})();

(function wirePrimaryDownload() {
  const primary = document.getElementById('primary-download');
  if (!primary) return;

  const url = visitorCard && visitorCard.dataset.downloadUrl;
  if (!url) return;
  primary.href = url;
  primary.textContent = `Download for ${OS_LABELS[visitorOS]}`;
})();

(function revealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      setTimeout(() => el.classList.add('is-visible'), i * 60);
      io.unobserve(el);
    });
  }, { threshold: 0.2 });

  items.forEach((el) => io.observe(el));
})();
