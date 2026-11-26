let currentSiteData = {};
let activeSplitIndex = 0;

function initTheme() {
  const savedTheme = localStorage.getItem('user-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  applyModeSpecificTokens(savedTheme, currentSiteData.theme || {});
}

function toggleDayNightTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('user-theme', nextTheme);
  updateThemeIcon(nextTheme);
  applyModeSpecificTokens(nextTheme, currentSiteData.theme || {});
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerText = theme === 'dark' ? '☀️' : '🌙';
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) drawer.classList.toggle('active');
}

function applyModeSpecificTokens(mode, t) {
  const root = document.documentElement;
  if (mode === 'light') {
    if (t.cardBgLight) root.style.setProperty('--card-bg', t.cardBgLight);
    else root.style.removeProperty('--card-bg');
    if (t.textMainLight) root.style.setProperty('--text-main', t.textMainLight);
    else root.style.removeProperty('--text-main');
    if (t.textMutedLight) root.style.setProperty('--text-muted', t.textMutedLight);
    else root.style.removeProperty('--text-muted');
  } else {
    if (t.cardBgDark) root.style.setProperty('--card-bg', t.cardBgDark);
    else root.style.removeProperty('--card-bg');
    if (t.textMainDark) root.style.setProperty('--text-main', t.textMainDark);
    else root.style.removeProperty('--text-main');
    if (t.textMutedDark) root.style.setProperty('--text-muted', t.textMutedDark);
    else root.style.removeProperty('--text-muted');
  }
}

function applyThemeColors(t) {
  if (!t) return;
  const root = document.documentElement;
  if (t.primaryColor) root.style.setProperty('--primary-color', t.primaryColor);
  if (t.accentColor) root.style.setProperty('--accent-color', t.accentColor);
  if (t.bgDark) root.style.setProperty('--bg-dark', t.bgDark);
  if (t.bgLight) root.style.setProperty('--bg-light', t.bgLight);
  if (t.fontFamily) root.style.setProperty('--font-family', t.fontFamily);
  if (t.fontSizeBase) root.style.setProperty('--font-size-base', t.fontSizeBase);
  if (t.headlineWeight) root.style.setProperty('--headline-weight', t.headlineWeight);
  if (t.buttonRadius) root.style.setProperty('--btn-radius', t.buttonRadius);
  if (t.cardRadius) root.style.setProperty('--card-radius', t.cardRadius);
  if (t.heroOverlayOpacity) root.style.setProperty('--hero-overlay-opacity', t.heroOverlayOpacity);
  if (t.heroHeadlineSize) root.style.setProperty('--hero-headline-size', t.heroHeadlineSize);
  if (t.heroHeadlineColor) root.style.setProperty('--hero-headline-color', t.heroHeadlineColor);
  if (t.heroSummaryColor) root.style.setProperty('--hero-summary-color', t.heroSummaryColor);
  if (t.heroBtnBg) root.style.setProperty('--hero-btn-bg', t.heroBtnBg);
  if (t.heroBtnColor) root.style.setProperty('--hero-btn-color', t.heroBtnColor);
  if (t.statsDockBg) root.style.setProperty('--stats-dock-bg', t.statsDockBg);
  if (t.statsDockText) root.style.setProperty('--stats-dock-text', t.statsDockText);

  const currentMode = document.documentElement.getAttribute('data-theme') || 'dark';
  applyModeSpecificTokens(currentMode, t);
}

function applyReviewStyles(rs) {
  const root = document.documentElement;
  const grid = document.getElementById('reviewsContainer');
  if (!rs) {
    if (grid) grid.className = 'reviews-grid rev-layout-masonry';
    return;
  }

  if (rs.cardBg) root.style.setProperty('--rev-card-bg', rs.cardBg);
  else root.style.removeProperty('--rev-card-bg');

  if (rs.borderColor) root.style.setProperty('--rev-border-color', rs.borderColor);
  else root.style.removeProperty('--rev-border-color');

  if (rs.borderRadius) root.style.setProperty('--rev-radius', rs.borderRadius);
  if (rs.cardPadding) root.style.setProperty('--rev-padding', rs.cardPadding);

  const shadowMap = {
    none: 'none',
    soft: '0 8px 24px rgba(0, 0, 0, 0.08)',
    elevated: '0 18px 42px rgba(0, 0, 0, 0.25)',
    glow: '0 0 28px rgba(99, 102, 241, 0.22)'
  };
  root.style.setProperty('--rev-shadow', shadowMap[rs.cardShadow] || shadowMap.soft);

  if (rs.starColor) root.style.setProperty('--rev-star-color', rs.starColor);
  if (rs.quoteFont) root.style.setProperty('--rev-quote-font', rs.quoteFont);
  else root.style.removeProperty('--rev-quote-font');

  if (rs.quoteSize) root.style.setProperty('--rev-quote-size', rs.quoteSize);
  if (rs.quoteColor) root.style.setProperty('--rev-quote-color', rs.quoteColor);
  else root.style.removeProperty('--rev-quote-color');

  root.style.setProperty('--rev-quote-style', rs.quoteItalic === false ? 'normal' : 'italic');
  if (rs.quoteWeight) root.style.setProperty('--rev-quote-weight', rs.quoteWeight);

  if (rs.nameColor) root.style.setProperty('--rev-name-color', rs.nameColor);
  else root.style.removeProperty('--rev-name-color');
  if (rs.nameSize) root.style.setProperty('--rev-name-size', rs.nameSize);

  if (rs.roleColor) root.style.setProperty('--rev-role-color', rs.roleColor);
  else root.style.removeProperty('--rev-role-color');
  if (rs.roleSize) root.style.setProperty('--rev-role-size', rs.roleSize);

  if (grid) {
    const layoutClass = ['masonry', 'grid-3', 'grid-2', 'spotlight'].includes(rs.layout) ? rs.layout : 'masonry';
    grid.className = 'reviews-grid rev-layout-' + layoutClass;
  }
}

function applyPageCustomizer(c) {
  if (!c) return;
  const rootContainer = document.getElementById('dynamicSectionsRoot');
  const validKeys = ['partners', 'about', 'services', 'reviews'];

  // 1. Reorder sections
  if (rootContainer && Array.isArray(c.sectionsOrder)) {
    c.sectionsOrder.forEach(key => {
      if (!validKeys.includes(key)) return;
      const el = rootContainer.querySelector(`[data-section-key="${key}"]`);
      if (el) rootContainer.appendChild(el);
    });
  }

  // 2. Show/Hide sections & sync navbar links
  if (c.sectionsVisible && typeof c.sectionsVisible === 'object') {
    validKeys.forEach(key => {
      const visible = c.sectionsVisible[key] !== false;
      const secEl = rootContainer ? rootContainer.querySelector(`[data-section-key="${key}"]`) : null;
      if (secEl) secEl.style.display = visible ? '' : 'none';
      document.querySelectorAll(`[data-sec="${key}"]`).forEach(link => {
        link.style.display = visible ? '' : 'none';
      });
    });
  }

  // 3. Section custom texts
  const tx = c.sectionTexts || {};
  if (tx.partnersTitle) document.getElementById('partnersTitleText').innerText = tx.partnersTitle;
  if (tx.aboutTag) document.getElementById('aboutTagText').innerText = tx.aboutTag;
  if (tx.servicesTag) document.getElementById('servicesTagText').innerText = tx.servicesTag;
  if (tx.servicesTitle) document.getElementById('servicesTitleText').innerText = tx.servicesTitle;
  if (tx.servicesSubtitle) document.getElementById('servicesSubtitleText').innerText = tx.servicesSubtitle;
  if (tx.reviewsTag) document.getElementById('reviewsTagText').innerText = tx.reviewsTag;
  if (tx.reviewsTitle) document.getElementById('reviewsTitleText').innerText = tx.reviewsTitle;
  if (tx.reviewsSubtitle) document.getElementById('reviewsSubtitleText').innerText = tx.reviewsSubtitle;

  // 4. Section custom background colors
  const col = c.sectionColors || {};
  const secMap = {
    partners: document.getElementById('partnersSection'),
    about: document.getElementById('about'),
    services: document.getElementById('services'),
    reviews: document.getElementById('reviews'),
    footer: document.getElementById('siteFooter')
  };
  Object.keys(secMap).forEach(k => {
    const keyName = k + 'Bg';
    if (secMap[k] && col[keyName]) {
      secMap[k].style.backgroundColor = col[keyName];
    }
  });
}

async function loadSite() {
  initTheme();
  try {
    const res = await fetch('/api/site-data');
    currentSiteData = await res.json();
    renderSite(currentSiteData);
    setupScrollAnimations();
  } catch (err) {
    console.error('Data load error:', err);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderServicesSection(services, layout, calUrl) {
  const container = document.getElementById('servicesCardsContainer');
  if (!container) return;

  if (!services || services.length === 0) {
    container.className = 'cards-grid';
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); grid-column:1/-1;">No services published yet.</p>';
    return;
  }

  if (layout === 'split-showcase') {
    container.className = 'srv-split-wrap';
    if (activeSplitIndex >= services.length) activeSplitIndex = 0;
    const activeSrv = services[activeSplitIndex];

    container.innerHTML = `
      <div class="srv-split-tabs">
        ${services.map((srv, idx) => `
          <button type="button" class="srv-split-tab ${idx === activeSplitIndex ? 'active' : ''}" onclick="selectSplitService(${idx})">
            <div style="font-size:0.74rem; font-weight:800; color:var(--primary-color); text-transform:uppercase; margin-bottom:4px;">
              0${idx + 1} · ${escapeHtml(srv.category || 'Strategic Program')}
            </div>
            <div style="font-size:1.05rem; font-weight:800;">${escapeHtml(srv.title)}</div>
          </button>
        `).join('')}
      </div>
      <div class="srv-split-panel">
        <span class="card-cat-badge" style="display:inline-block; margin-bottom:0.9rem;">${escapeHtml(activeSrv.category || 'Strategic Program')}</span>
        <h3 style="font-size:1.75rem; font-weight:800; margin-bottom:0.8rem; line-height:1.25;">${escapeHtml(activeSrv.title)}</h3>
        <p style="font-weight:600; color:var(--text-main); margin-bottom:0.9rem;">${escapeHtml(activeSrv.shortDesc)}</p>
        <p style="color:var(--text-muted); line-height:1.75; margin-bottom:1.5rem; white-space:pre-line;">${escapeHtml(activeSrv.fullDetails)}</p>
        ${(activeSrv.features && activeSrv.features.length) ? `
          <div style="margin-bottom:1.8rem;">
            <div class="srv-deliv-label">Included Deliverables & Scope</div>
            <ul class="modal-feat-list">
              ${activeSrv.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <a href="${escapeHtml(calUrl)}" target="_blank" class="btn-pill">Book Consultation for This Program &rarr;</a>
      </div>
    `;
    return;
  }

  if (layout === 'accordion-cards') {
    container.className = 'cards-grid';
    container.innerHTML = services.map((srv, idx) => `
      <div class="service-card-pro reveal-scroll active" style="cursor:default;">
        <div>
          <div class="srv-card-top">
            <span class="card-cat-badge">${escapeHtml(srv.category || 'Strategic Program')}</span>
            <span class="srv-index-num">0${idx + 1}</span>
          </div>
          <h3>${escapeHtml(srv.title)}</h3>
          <p class="srv-short-desc">${escapeHtml(srv.shortDesc)}</p>

          <div id="accBody-${idx}" class="srv-acc-details">
            <p style="font-size:0.93rem; color:var(--text-main); line-height:1.7; margin-bottom:1rem; white-space:pre-line;">${escapeHtml(srv.fullDetails)}</p>
            ${(srv.features && srv.features.length) ? `
              <ul class="srv-feat-mini" style="margin-bottom:1rem;">
                ${srv.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
              </ul>
            ` : ''}
            <a href="${escapeHtml(calUrl)}" target="_blank" class="btn-pill" style="width:100%; justify-content:center; margin-top:0.5rem;">
              Book 1:1 Discovery Call &rarr;
            </a>
          </div>
        </div>
        <div class="srv-card-footer" style="margin-top:1rem;">
          <button type="button" class="srv-scope-link" style="background:none; border:none; cursor:pointer; font-family:inherit;" onclick="toggleAccordionCard(${idx}, this)">
            Show Full Deliverables &darr;
          </button>
        </div>
      </div>
    `).join('');
    return;
  }

  // Default Layout: Executive Cards with Visible Deliverables + Interactive Scope Modal
  container.className = 'cards-grid';
  container.innerHTML = services.map((srv, idx) => {
    const feats = srv.features || [];
    const previewFeats = feats.slice(0, 3);
    const extraCount = feats.length - previewFeats.length;

    return `
      <div class="service-card-pro reveal-scroll" onclick="openServiceModal(${idx})">
        <div>
          <div class="srv-card-top">
            <span class="card-cat-badge">${escapeHtml(srv.category || 'Strategic Program')}</span>
            <span class="srv-index-num">0${idx + 1}</span>
          </div>
          <h3>${escapeHtml(srv.title)}</h3>
          <p class="srv-short-desc">${escapeHtml(srv.shortDesc)}</p>

          ${previewFeats.length > 0 ? `
            <div class="srv-deliverables-preview">
              <div class="srv-deliv-label">Key Deliverables</div>
              <ul class="srv-feat-mini">
                ${previewFeats.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
              </ul>
              ${extraCount > 0 ? `<span class="srv-more-pill">+${extraCount} more deliverables included</span>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="srv-card-footer">
          <span class="srv-scope-link">View Full Scope &rarr;</span>
        </div>
      </div>
    `;
  }).join('');
}

function selectSplitService(idx) {
  activeSplitIndex = idx;
  const s = currentSiteData.settings || {};
  const c = currentSiteData.customizer || {};
  renderServicesSection(currentSiteData.services || [], c.servicesLayout || 'split-showcase', s.calendlyUrl || 'https://calendly.com');
}

function toggleAccordionCard(idx, btn) {
  const body = document.getElementById('accBody-' + idx);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  btn.innerHTML = isOpen ? 'Hide Deliverables &uarr;' : 'Show Full Deliverables &darr;';
}

function openServiceModal(idx) {
  const services = currentSiteData.services || [];
  const srv = services[idx];
  if (!srv) return;
  const s = currentSiteData.settings || {};

  document.getElementById('modalSrvCategory').innerText = srv.category || 'Strategic Program';
  document.getElementById('modalSrvTitle').innerText = srv.title || '';
  document.getElementById('modalSrvSummary').innerText = srv.shortDesc || '';
  document.getElementById('modalSrvDetails').innerText = srv.fullDetails || '';

  const feats = srv.features || [];
  const wrap = document.getElementById('modalSrvFeaturesWrap');
  const list = document.getElementById('modalSrvFeatures');
  if (feats.length > 0) {
    wrap.style.display = 'block';
    list.innerHTML = feats.map(f => `<li>${escapeHtml(f)}</li>`).join('');
  } else {
    wrap.style.display = 'none';
  }

  document.getElementById('modalSrvBookBtn').href = s.calendlyUrl || 'https://calendly.com';
  document.getElementById('serviceScopeModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeServiceModal(e) {
  if (e && e.target !== document.getElementById('serviceScopeModal')) return;
  document.getElementById('serviceScopeModal').classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeServiceModal();
});

function renderSite(data) {
  if (data.theme) applyThemeColors(data.theme);
  applyReviewStyles(data.reviewStyle || {});
  applyPageCustomizer(data.customizer || {});

  const s = data.settings || {};
  document.getElementById('navSiteName').innerText = s.siteName || 'Kabir Anwar';
  document.getElementById('footerSiteName').innerText = s.siteName || 'Kabir Anwar';
  if (s.logoImage) {
    const lImg = document.getElementById('navLogoImg');
    lImg.src = s.logoImage;
    lImg.style.display = 'block';
  }

  const calUrl = s.calendlyUrl || 'https://calendly.com';
  document.getElementById('navCalendlyBtn').href = calUrl;
  document.getElementById('aboutCalendlyBtn').href = calUrl;

  document.getElementById('footerBio').innerText = s.footerBio || '';
  document.getElementById('footerPhone').innerText = `Phone: ${s.phone || ''}`;
  document.getElementById('footerEmail').innerText = `Email: ${s.email || ''}`;
  document.getElementById('footerAddress').innerText = `Address: ${s.address || ''}`;
  document.getElementById('footerCopyright').innerText = s.copyright || '© 2026 Kabir Anwar. All rights reserved.';

  const h = data.hero || {};
  const heroSec = document.getElementById('home');
  if (h.bgImage) {
    heroSec.style.backgroundImage = `url('${h.bgImage}')`;
  }
  document.getElementById('heroHeadline').innerHTML = (h.headline || "You're More Than a Brand.<br>You're a Movement.").replace(/\n/g, '<br>');
  document.getElementById('heroCtaText').innerText = h.ctaText || 'Request a Call';
  document.getElementById('heroCtaBtn').href = h.ctaLink || '#services';
  document.getElementById('heroSummary').innerText = h.summaryText || 'Helping you turn connections into opportunities through authentic branding.';
  
  document.getElementById('stat1Num').innerText = h.stat1Num || '200+';
  document.getElementById('stat1Label').innerText = h.stat1Label || 'Successful Members';
  document.getElementById('stat2Num').innerText = h.stat2Num || '6M+';
  document.getElementById('stat2Label').innerText = h.stat2Label || 'Followers Generated';
  document.getElementById('stat3Num').innerText = h.stat3Num || '3k+';
  document.getElementById('stat3Label').innerText = h.stat3Label || 'Satisfied Clients';
  document.getElementById('stat4Num').innerText = h.stat4Num || '500+';
  document.getElementById('stat4Label').innerText = h.stat4Label || 'Branding Projects';

  const pContainer = document.getElementById('partnersGrid');
  pContainer.innerHTML = (data.partners || []).map(p => `
    <div class="partner-item">
      ${p.logo ? `<img src="${p.logo}" alt="${escapeHtml(p.name)}" class="partner-logo-img">` : ''}
      <span>${escapeHtml(p.name)}</span>
    </div>
  `).join('');

  const a = data.about || {};
  document.getElementById('aboutTitle').innerText = a.title || 'Meet Kabir';
  document.getElementById('aboutLead').innerText = a.leadText || '';
  document.getElementById('aboutBio').innerText = a.bio || '';
  if (a.image) document.getElementById('aboutImg').src = a.image;

  const customizer = data.customizer || {};
  renderServicesSection(data.services || [], customizer.servicesLayout || 'modal-cards', calUrl);

  const rContainer = document.getElementById('reviewsContainer');
  rContainer.innerHTML = (data.reviews || []).map(r => `
    <div class="review-card reveal-scroll">
      <div class="stars">${'★'.repeat(r.rating || 5)}</div>
      <p class="rev-quote">"${escapeHtml(r.comment)}"</p>
      <div>
        <div class="rev-name">${escapeHtml(r.name)}</div>
        <div class="rev-role">${escapeHtml(r.role)}</div>
      </div>
    </div>
  `).join('');
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal-scroll').forEach(el => observer.observe(el));
}

window.addEventListener('DOMContentLoaded', loadSite);
