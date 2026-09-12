document.getElementById('year').textContent = new Date().getFullYear();

const REPO = 'creulcat/DyadLauncher';
const RELEASES_URL = `https://github.com/${REPO}/releases`;
const LATEST_RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const OS_LABELS = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };

// Ordered lists of asset patterns per OS. The first match on a card becomes
// the primary download button; any further matches show as extra links.
const ASSET_MATCHERS = {
  windows: [
    { label: 'Windows (x64 installer)', test: /\.exe$/i },
  ],
  macos: [
    { label: 'Apple Silicon (.dmg)', test: /aarch64.*\.dmg$/i },
    { label: 'Intel (.dmg)', test: /(x64|x86_64).*\.dmg$/i },
  ],
  linux: [
    { label: 'AppImage', test: /\.appimage$/i },
    { label: '.deb package', test: /\.deb$/i },
  ],
};

function detectVisitorOS() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'macos';
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux';
  return null;
}

const visitorOS = detectVisitorOS();

function getVisitorCard() {
  return visitorOS && document.querySelector(`.dl-card[data-os="${visitorOS}"]`);
}

(function tagVisitorOS() {
  const visitorCard = getVisitorCard();
  if (!visitorCard) return;
  visitorCard.setAttribute('data-you', '');
  const tag = visitorCard.querySelector('.you-tag');
  if (tag) tag.hidden = false;
})();

function wirePrimaryDownload() {
  const primary = document.getElementById('primary-download');
  if (!primary) return;

  const visitorCard = getVisitorCard();
  const url = visitorCard && visitorCard.dataset.downloadUrl;
  if (!url) return;
  primary.href = url;
  primary.textContent = `Download for ${OS_LABELS[visitorOS]}`;
}

async function loadLatestRelease() {
  const lede = document.querySelector('#downloads .section__lede');

  let release;
  try {
    const res = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    release = await res.json();
  } catch (err) {
    console.warn('Dyad Launcher: could not load the latest release from GitHub.', err);
    return;
  }

  const assets = release.assets || [];
  const version = release.tag_name || release.name;
  let anyMatched = false;

  document.querySelectorAll('.dl-card').forEach((card) => {
    const matchers = ASSET_MATCHERS[card.dataset.os] || [];
    const matches = matchers
      .map((m) => ({ ...m, asset: assets.find((a) => m.test.test(a.name)) }))
      .filter((m) => m.asset);

    if (!matches.length) return; // leave the card in its "no build yet" state

    anyMatched = true;
    const [primaryMatch, ...extraMatches] = matches;
    card.dataset.downloadUrl = primaryMatch.asset.browser_download_url;

    const actions = card.querySelector('.dl-card__actions');
    const oldButton = actions.querySelector('.btn--disabled');
    if (oldButton) {
      const button = document.createElement('a');
      button.className = 'btn btn--primary';
      button.href = primaryMatch.asset.browser_download_url;
      button.textContent = 'Download';
      oldButton.replaceWith(button);
    }

    extraMatches.forEach(({ label, asset }) => {
      const link = document.createElement('a');
      link.className = 'link-arrow';
      link.href = asset.browser_download_url;
      link.textContent = label;
      actions.insertBefore(link, actions.lastElementChild);
    });
  });

  if (anyMatched && lede) {
    lede.textContent = `Latest release: ${version}. Pick your platform below.`;
  }

  wirePrimaryDownload();
}

loadLatestRelease();

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
