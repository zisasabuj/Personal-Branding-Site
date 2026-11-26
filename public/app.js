let currentSiteData = {};
let revealObserver = null;
let lastFocusEl = null;

const IS_PREVIEW = new URLSearchParams(location.search).has('preview');
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escBr = s => esc(s).replace(/\n/g, '<br>');

/* ------------------------------ Day / Night ------------------------------ */
function initTheme() {
  const savedTheme = localStorage.getItem('user-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}
function toggleDayNightTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('user-theme', nextTheme);
  updateThemeIcon(nextTheme);
}
function updateThemeIcon(theme) {
  const btn = $('themeToggleBtn');
  if (btn) btn.innerText = theme === 'dark' ? '☀️' : '🌙';
}
function toggleMobileMenu() {
  const drawer = $('mobileNavDrawer');
  if (drawer) drawer.classList.toggle('active');
}

/* ------------------------------ Theme (legacy) + Design Studio ------------------------------ */
const root = document.documentElement;
const MANAGED_VARS = ['--primary-color', '--accent-color', '--bg-dark', '--bg-light', '--card-dark', '--card-light',
  '--text-dark', '--text-light', '--muted-dark', '--muted-light', '--font-family', '--font-heading', '--font-size-base',
  '--headline-weight', '--card-radius', '--btn-radius', '--container-max', '--hero-min-h', '--hero-ov', '--hero-overlay',
  '--svc-cols', '--rv-cols', '--rv-bg', '--rv-border', '--rv-radius', '--rv-shadow', '--rv-star'];
const setVar = (name, val) => { if (val !== undefined && val !== null && val !== '') root.style.setProperty(name, String(val)); };

function applyThemeColors(t) {
  if (!t) return;
  setVar('--primary-color', t.primaryColor);
  setVar('--accent-color', t.accentColor);
  setVar('--bg-dark', t.bgDark);
  setVar('--bg-light', t.bgLight);
  setVar('--font-family', t.fontFamily);
  setVar('--font-size-base', t.fontSizeBase);
  setVar('--headline-weight', t.headlineWeight);
}

const DEFAULT_ORDER = { partners: 1, about: 2, services: 3, reviews: 4 };
const HERO_HEIGHTS = { full: '100svh', tall: '85svh', medium: '70svh', compact: '55svh', auto: '0px' };
const BTN_RADIUS = { pill: '50px', rounded: '12px', square: '4px' };
const RV_SHADOWS = {
  none: 'none',
  soft: '0 8px 24px rgba(0,0,0,0.12)',
  medium: '0 14px 40px rgba(0,0,0,0.24)',
  glow: '0 0 0 1px var(--primary-color), 0 14px 40px rgba(0,0,0,0.28)'
};
const EL_PROPS = { fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', color: 'color',
  textAlign: 'text-align', letterSpacing: 'letter-spacing', textTransform: 'text-transform', lineHeight: 'line-height', fontStyle: 'font-style' };

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
// Big font sizes shrink gracefully on small screens
function fluidSize(px) {
  px = Number(px);
  if (!px) return '';
  if (px < 20) return px + 'px';
  return `clamp(${Math.max(14, Math.round(px * 0.62))}px, ${(px / 14.4).toFixed(2)}vw, ${px}px)`;
}

function applyDesign(d) {
  d = d || {};
  const g = d.global || {};
  setVar('--primary-color', g.primary);
  setVar('--accent-color', g.accent);
  setVar('--bg-dark', g.bgDark);
  setVar('--bg-light', g.bgLight);
  setVar('--card-dark', g.cardDark);
  setVar('--card-light', g.cardLight);
  setVar('--text-dark', g.textDark);
  setVar('--text-light', g.textLight);
  setVar('--muted-dark', g.mutedDark);
  setVar('--muted-light', g.mutedLight);
  if (g.fontBody) { loadFontByName(g.fontBody); setVar('--font-family', fontStack(g.fontBody)); }
  if (g.fontHeading) { loadFontByName(g.fontHeading); setVar('--font-heading', fontStack(g.fontHeading)); }
  if (g.baseSize) setVar('--font-size-base', g.baseSize + 'px');
  if (g.headingWeight) setVar('--headline-weight', g.headingWeight);
  if (g.radius !== undefined && g.radius !== '') setVar('--card-radius', g.radius + 'px');
  if (g.buttonShape) setVar('--btn-radius', BTN_RADIUS[g.buttonShape]);
  if (g.container) setVar('--container-max', g.container + 'px');

  /* hero */
  const hh = d.hero || {};
  setVar('--hero-min-h', HERO_HEIGHTS[hh.height]);
  if (hh.overlay !== undefined && hh.overlay !== '') setVar('--hero-ov', Number(hh.overlay) / 100);
  const oc = hexToRgb(hh.overlayColor);
  if (oc) {
    const c = oc.join(',');
    setVar('--hero-overlay', `linear-gradient(to right, rgba(${c},0.94) 0%, rgba(${c},0.72) 45%, rgba(${c},0.25) 100%)`);
  }
  $('home').classList.toggle('hero-center', hh.align === 'center');
  $('heroStatsDock').style.display = hh.showStats === false ? 'none' : '';
  document.querySelectorAll('[data-icon]').forEach(n => {
    if (!('def' in n.dataset)) n.dataset.def = n.textContent;
    const ic = (hh.icons || [])[Number(n.dataset.icon)];
    n.textContent = ic ? ic : n.dataset.def;
  });

  /* services + reviews variables */
  if (d.servicesColumns) setVar('--svc-cols', d.servicesColumns);
  const r = d.reviews || {};
  setVar('--rv-cols', r.columns);
  setVar('--rv-bg', r.cardBg);
  setVar('--rv-border', r.border);
  if (r.radius !== undefined && r.radius !== '') setVar('--rv-radius', r.radius + 'px');
  if (r.shadow) setVar('--rv-shadow', RV_SHADOWS[r.shadow]);
  setVar('--rv-star', r.starColor);

  /* navbar */
  const nav = d.nav || {};
  $('siteHeader').classList.toggle('is-sticky', !!nav.sticky);
  document.querySelectorAll('.nav-admin-link').forEach(n => { n.style.display = nav.showAdminLink === false ? 'none' : ''; });

  /* sections */
  const secs = d.sections || {};
  document.querySelectorAll('[data-section]').forEach(el => {
    const key = el.dataset.section;
    if (key === 'home') return;
    const c = secs[key] || {};
    el.style.display = c.show === false ? 'none' : '';
    if (DEFAULT_ORDER[key]) el.style.order = c.order !== undefined && c.order !== '' ? c.order : DEFAULT_ORDER[key];
    el.style.backgroundColor = '';
    el.style.backgroundImage = '';
    el.classList.remove('has-bg-img');
    el.style.removeProperty('--sec-ov');
    el.style.removeProperty('--sec-ov-color');
    if (c.bg && c.bg2) el.style.backgroundImage = `linear-gradient(${Number(c.bgAngle) || 135}deg, ${c.bg}, ${c.bg2})`;
    else if (c.bg) el.style.backgroundColor = c.bg;
    if (c.bgImage) {
      el.style.backgroundImage = `url('${c.bgImage}')`;
      el.classList.add('has-bg-img');
      el.style.setProperty('--sec-ov', (c.bgOverlay === undefined || c.bgOverlay === '' ? 50 : Number(c.bgOverlay)) / 100);
      if (c.bgOverlayColor) el.style.setProperty('--sec-ov-color', c.bgOverlayColor);
    }
    el.style.paddingTop = c.padTop !== undefined && c.padTop !== '' ? c.padTop + 'px' : '';
    el.style.paddingBottom = c.padBottom !== undefined && c.padBottom !== '' ? c.padBottom + 'px' : '';
    el.style.textAlign = c.align || '';
    const link = document.querySelectorAll(`[data-nav="${key}"]`);
    link.forEach(a => { const li = a.closest('li'); (li || a).style.display = c.show === false ? 'none' : ''; });
  });

  /* editable texts */
  const texts = d.texts || {};
  document.querySelectorAll('[data-text]').forEach(n => {
    if (!('def' in n.dataset)) n.dataset.def = n.innerHTML;
    const v = texts[n.dataset.text];
    if (v) n.textContent = v; else n.innerHTML = n.dataset.def;
  });

  /* element typography */
  const els = d.elements || {};
  document.querySelectorAll('[data-el]').forEach(n => {
    Object.values(EL_PROPS).forEach(p => n.style.removeProperty(p));
    const st = els[n.dataset.el.replace(/\./g, '_')];
    if (!st) return;
    if (st.fontFamily) { loadFontByName(st.fontFamily); n.style.fontFamily = fontStack(st.fontFamily); }
    if (st.fontSize) n.style.fontSize = fluidSize(st.fontSize);
    if (st.fontWeight) n.style.fontWeight = st.fontWeight;
    if (st.color) n.style.color = st.color;
    if (st.textAlign) n.style.textAlign = st.textAlign;
    if (st.letterSpacing !== undefined && st.letterSpacing !== '') n.style.letterSpacing = st.letterSpacing + 'px';
    if (st.textTransform) n.style.textTransform = st.textTransform;
    if (st.lineHeight) n.style.lineHeight = st.lineHeight;
    if (st.fontStyle) n.style.fontStyle = st.fontStyle;
  });
}

function applyAll() {
  MANAGED_VARS.forEach(v => root.style.removeProperty(v));
  applyThemeColors(currentSiteData.theme);
  applyDesign(currentSiteData.design);
}

/* ------------------------------ Data ------------------------------ */
async function loadSite() {
  initTheme();
  if (IS_PREVIEW) root.classList.add('is-preview');
  try {
    const res = await fetch('/api/site-data', { cache: 'no-store' });
    currentSiteData = await res.json();
    renderSite(currentSiteData);
  } catch (err) {
    console.error('Data load error:', err);
  }
}

function renderSite(data) {
  const s = data.settings || {};
  $('navSiteName').innerText = s.siteName || 'Kabir Anwar';
  $('footerSiteName').innerText = s.siteName || 'Kabir Anwar';
  const lImg = $('navLogoImg');
  if (s.logoImage) { lImg.src = s.logoImage; lImg.style.display = 'block'; } else { lImg.style.display = 'none'; }

  const calUrl = s.calendlyUrl || 'https://calendly.com';
  $('navCalendlyBtn').href = calUrl;
  $('aboutCalendlyBtn').href = calUrl;
  $('drawerCta').href = calUrl;

  $('footerBio').innerText = s.footerBio || '';
  $('footerPhone').innerText = `Phone: ${s.phone || ''}`;
  $('footerEmail').innerText = `Email: ${s.email || ''}`;
  $('footerAddress').innerText = `Address: ${s.address || ''}`;
  $('footerCopyright').innerText = s.copyright || '© 2026 All rights reserved.';

  const h = data.hero || {};
  const heroSec = $('home');
  heroSec.style.backgroundImage = h.bgImage ? `url('${h.bgImage}')` : '';
  const headline = h.headline || "You're More Than a Brand.<br>You're a Movement.";
  $('heroHeadline').innerHTML = esc(headline).replace(/&lt;br\s*\/?&gt;/gi, '<br>').replace(/\n/g, '<br>');
  $('heroCtaText').innerText = h.ctaText || 'Request a Call';
  $('heroCtaBtn').href = h.ctaLink || '#services';
  $('heroSummary').innerText = h.summaryText || 'Helping you turn connections into opportunities through authentic branding.';
  const defs = [['200+', 'Successful Members'], ['6M+', 'Followers Generated'], ['3k+', 'Satisfied Clients'], ['500+', 'Branding Projects']];
  for (let i = 1; i <= 4; i++) {
    $('stat' + i + 'Num').innerText = h['stat' + i + 'Num'] || defs[i - 1][0];
    $('stat' + i + 'Label').innerText = h['stat' + i + 'Label'] || defs[i - 1][1];
  }

  renderPartners();

  const a = data.about || {};
  $('aboutTitle').innerText = a.title || 'Meet Kabir';
  $('aboutLead').innerText = a.leadText || '';
  $('aboutBio').innerText = a.bio || '';
  if (a.image) $('aboutImg').src = a.image;

  renderServices();
  renderReviews();
  applyAll();
  setupScrollAnimations();
}

/* ------------------------------ Partners (marquee / grid) ------------------------------ */
function renderPartners() {
  const list = currentSiteData.partners || [];
  const c = ((currentSiteData.design || {}).sections || {}).partners || {};
  const box = $('partnersGrid');
  const item = p => `<div class="partner-item">${p.logo
    ? `<span class="p-logo"><img src="${esc(p.logo)}" alt="" loading="lazy"></span>`
    : `<span class="p-logo p-letter">${esc((p.name || '?').trim().charAt(0).toUpperCase())}</span>`}<span class="p-name" data-el="partners.name">${esc(p.name)}</span></div>`;
  if (!list.length) { box.innerHTML = ''; return; }
  if (c.style === 'grid') {
    box.className = 'partners-cards reveal-scroll';
    if (c.cols) box.style.setProperty('--pt-cols', c.cols); else box.style.removeProperty('--pt-cols');
    box.innerHTML = list.map(item).join('');
    return;
  }
  box.style.removeProperty('--pt-cols');
  const reps = Math.max(1, Math.ceil(8 / list.length));
  const half = Array.from({ length: reps }, () => list.map(item).join('')).join('');
  const per = { slow: 7, fast: 3 }[c.speed] || 5;
  box.className = 'partners-marquee reveal-scroll';
  box.innerHTML = `<div class="mq-track" style="--mq-dur:${list.length * reps * per}s">${half}<div style="display:contents" aria-hidden="true">${half}</div></div>`;
}

/* ------------------------------ Services (3 layouts) ------------------------------ */
function renderServices() {
  const d = currentSiteData.design || {};
  const layout = ['modal', 'hover', 'expand'].includes(d.servicesLayout) ? d.servicesLayout : 'modal';
  const list = currentSiteData.services || [];
  const box = $('servicesCardsContainer');
  box.className = `cards-grid layout-${layout}${d.servicesColumns ? ' fixed-cols' : ''}`;

  const cat = srv => `<div class="card-cat" data-el="service.category">${esc(srv.category || 'Strategic Program')}</div>`;
  const chips = srv => {
    const f = srv.features || [];
    if (!f.length) return '';
    return `<div class="svc-chips">${f.slice(0, 3).map(x => `<span class="svc-chip">${esc(x)}</span>`).join('')}${f.length > 3 ? `<span class="svc-chip">+${f.length - 3}</span>` : ''}</div>`;
  };
  const feats = srv => (srv.features || []).map(f => `<li>${esc(f)}</li>`).join('');

  box.innerHTML = list.map((srv, i) => {
    if (layout === 'hover') {
      return `
      <article class="service-card reveal-scroll" data-idx="${i}">
        <div class="svc-front">
          ${cat(srv)}
          <h3 data-el="service.title">${esc(srv.title)}</h3>
          <p data-el="service.desc">${escBr(srv.shortDesc)}</p>
          <span class="svc-more">${'<span data-text="serviceMoreHover">Hover for full scope</span>'} <span class="arrow">&rarr;</span></span>
        </div>
        <div class="card-hover-details">
          <div>
            <div class="card-cat">Included Scope</div>
            <p style="font-size:0.95rem;color:var(--text-main);line-height:1.6;">${escBr(srv.fullDetails)}</p>
            <ul class="hover-feat-list">${feats(srv)}</ul>
          </div>
          <a href="#about" class="btn-pill" style="justify-content:center;" data-text="serviceCta">Inquire About This Program &rarr;</a>
        </div>
      </article>`;
    }
    if (layout === 'expand') {
      return `
      <article class="service-card reveal-scroll" data-idx="${i}">
        <div class="svc-front">
          ${cat(srv)}
          <h3 data-el="service.title">${esc(srv.title)}</h3>
          <p data-el="service.desc">${escBr(srv.shortDesc)}</p>
          <button type="button" class="svc-more" aria-expanded="false"><span data-text="serviceMore">View details</span> <span class="arrow">&rarr;</span></button>
        </div>
        <div class="svc-expand"><div><div class="svc-expand-inner">
          <p>${escBr(srv.fullDetails)}</p>
          <ul class="hover-feat-list">${feats(srv)}</ul>
          <a href="#about" class="btn-pill" style="justify-content:center;" data-text="serviceCta">Inquire About This Program &rarr;</a>
        </div></div></div>
      </article>`;
    }
    return `
      <article class="service-card svc-click reveal-scroll" data-idx="${i}" tabindex="0" role="button" aria-haspopup="dialog">
        <div class="svc-front">
          ${cat(srv)}
          <h3 data-el="service.title">${esc(srv.title)}</h3>
          <p data-el="service.desc">${escBr(srv.shortDesc)}</p>
          ${chips(srv)}
          <span class="svc-more"><span data-text="serviceMore">View details</span> <span class="arrow">&rarr;</span></span>
        </div>
      </article>`;
  }).join('');
}

function openServiceModal(i) {
  const srv = (currentSiteData.services || [])[i];
  if (!srv) return;
  lastFocusEl = document.activeElement;
  $('svcModalCat').textContent = srv.category || 'Strategic Program';
  $('svcModalTitle').textContent = srv.title || '';
  $('svcModalDesc').innerHTML = escBr(srv.fullDetails || srv.shortDesc || '');
  $('svcModalFeatures').innerHTML = (srv.features || []).map(f => `<li>${esc(f)}</li>`).join('');
  const m = $('svcModal');
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  applyAll();
  m.querySelector('.svc-modal-close').focus();
}
function closeServiceModal() {
  const m = $('svcModal');
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusEl && lastFocusEl.focus) lastFocusEl.focus();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeServiceModal(); });

document.addEventListener('click', e => {
  const card = e.target.closest('#servicesCardsContainer .service-card');
  if (!card) return;
  const layout = ['modal', 'hover', 'expand'].includes((currentSiteData.design || {}).servicesLayout) ? currentSiteData.design.servicesLayout : 'modal';
  if (e.target.closest('a')) return;
  if (layout === 'modal') openServiceModal(Number(card.dataset.idx));
  else if (layout === 'hover' && window.matchMedia('(hover: none)').matches) openServiceModal(Number(card.dataset.idx));
  else if (layout === 'expand' && e.target.closest('.svc-front')) {
    const open = card.classList.toggle('open');
    const b = card.querySelector('.svc-more');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.service-card.svc-click')) {
    e.preventDefault();
    openServiceModal(Number(e.target.dataset.idx));
  }
});

/* ------------------------------ Reviews ------------------------------ */
function renderReviews() {
  const d = currentSiteData.design || {};
  const layout = ['masonry', 'grid', 'slider'].includes((d.reviews || {}).layout) ? d.reviews.layout : 'masonry';
  const grid = $('reviewsContainer');
  grid.className = `reviews-grid layout-${layout}`;
  grid.closest('.reviews-wrap').classList.toggle('is-slider', layout === 'slider');
  grid.innerHTML = (currentSiteData.reviews || []).map(r => `
    <div class="review-card reveal-scroll">
      <div class="stars">${'★'.repeat(Math.max(0, Math.min(5, Number(r.rating) || 5)))}</div>
      <p class="rev-quote" data-el="review.quote">"${escBr(r.comment)}"</p>
      <div>
        <div class="rev-name" data-el="review.name">${esc(r.name)}</div>
        <div class="rev-role" data-el="review.role">${esc(r.role)}</div>
      </div>
    </div>`).join('');
}
function slideReviews(dir) {
  const g = $('reviewsContainer');
  const card = g.querySelector('.review-card');
  if (!card) return;
  g.scrollBy({ left: dir * (card.getBoundingClientRect().width + 24), behavior: 'smooth' });
}

/* ------------------------------ Animations ------------------------------ */
function setupScrollAnimations() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal-scroll').forEach(el => revealObserver.observe(el));
}

/* ------------------------------ Live preview bridge (admin Design Studio) ------------------------------ */
window.addEventListener('message', e => {
  if (e.origin !== location.origin) return;
  const m = e.data || {};
  if (m.type === 'bb-design') {
    currentSiteData.design = m.design || {};
    renderPartners();
    renderServices();
    renderReviews();
    applyAll();
    setupScrollAnimations();
  } else if (m.type === 'bb-refresh') {
    loadSite();
  } else if (m.type === 'bb-scroll') {
    const t = $(m.id);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

window.addEventListener('DOMContentLoaded', loadSite);
