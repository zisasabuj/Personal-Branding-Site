let currentServices = [];
let currentReviews = [];
let currentPartners = [];

let heroBgBase64 = null;
let partnerLogoBase64 = null;
let aboutPhotoBase64 = null;
let siteLogoBase64 = null;

// Track which optional color fields have an explicit override vs "Default"
const customColorFlags = {};
let customHeroHeadSize = false;

// Page Builder State
let builderOrder = ['partners', 'about', 'services', 'reviews'];
let builderVisible = { partners: true, about: true, services: true, reviews: true };
let selectedSrvLayout = 'modal-cards';

const TAB_META = {
  'tab-theme': ['Global Theme & Typography', 'Customize brand palette, Day/Night surfaces, Google Fonts & corner shapes'],
  'tab-hero': ['Hero & First-Screen Dock', 'Manage hero photo, headline, CTA & bottom 4 achievement stats'],
  'tab-review-style': ['Review Card Studio', 'WordPress-style customizer for review card colors, quote font, sizes & grid layout'],
  'tab-builder': ['Page Builder & Sections', 'Reorder landing page sections, toggle visibility, edit titles & switch Services UI layout'],
  'tab-partners': ['Featured In & Partners', 'Add or remove trusted organizations, schools & media logos'],
  'tab-about': ['About Coach', 'Edit coach portrait photo, headline, lead subtitle & full biography'],
  'tab-services': ['Services & Programs', 'Create and edit strategic programs with full deliverables'],
  'tab-reviews': ['Client Reviews', 'Add, edit or delete client testimonials and star ratings'],
  'tab-footer': ['Brand, Logo & Footer', 'Manage site name, navbar logo, contact details & copyright'],
  'tab-security': ['Calendly & Security', 'Update Calendly booking URL and rotate admin password'],
  'tab-backup': ['Backup & Restore', 'Download full JSON backups or restore from automatic cloud snapshots']
};

const SECTION_LABELS = {
  partners: { name: 'Featured In & Partners', desc: 'Organization logos & trust bar' },
  about: { name: 'About Coach', desc: 'Portrait photo & biography narrative' },
  services: { name: 'Personal Branding Services', desc: 'Programs & deliverables showcase' },
  reviews: { name: 'Client Reviews / Testimonials', desc: 'Client feedback cards' }
};

function showToast(msg, type = 'success') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast-item' + (type === 'error' ? ' error' : '');
  el.innerText = msg;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'all 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, 3400);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function togglePassVis() {
  const inp = document.getElementById('adPass');
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

function toggleSidebar() {
  const sb = document.getElementById('studioSidebar');
  if (sb) sb.classList.toggle('open');
}

function syncHex(id) {
  const inp = document.getElementById(id);
  const lbl = document.getElementById(id + '_hex');
  if (inp && lbl) lbl.innerText = inp.value;
}

function markCustomColor(id) {
  customColorFlags[id] = true;
  syncHex(id);
}

function resetColorField(id, fallbackHex) {
  customColorFlags[id] = false;
  const inp = document.getElementById(id);
  const lbl = document.getElementById(id + '_hex');
  if (inp) inp.value = fallbackHex;
  if (lbl) lbl.innerText = 'Default';
}

function setColorField(id, val, fallbackHex) {
  const inp = document.getElementById(id);
  const lbl = document.getElementById(id + '_hex');
  if (val && String(val).trim() !== '') {
    customColorFlags[id] = true;
    if (inp) inp.value = val;
    if (lbl) lbl.innerText = val;
  } else {
    customColorFlags[id] = false;
    if (inp) inp.value = fallbackHex;
    if (lbl) lbl.innerText = 'Default';
  }
}

function getOptionalColor(id) {
  if (!customColorFlags[id]) return '';
  const inp = document.getElementById(id);
  return inp ? inp.value : '';
}

function markHeroHeadSize(val) {
  customHeroHeadSize = true;
  const lbl = document.getElementById('heroHeadSize_val');
  if (lbl) lbl.innerText = val + 'px';
}

// ---- Auth helper ----
async function adminFetch(url, options) {
  options = options || {};
  options.headers = Object.assign({}, options.headers, {
    'Authorization': 'Bearer ' + (sessionStorage.getItem('adToken') || localStorage.getItem('adToken') || '')
  });
  const res = await fetch(url, options);
  if (res.status === 401) {
    showToast('Session expired. Please sign in again.', 'error');
    sessionStorage.removeItem('adToken'); localStorage.removeItem('adToken');
    setTimeout(() => location.reload(), 900);
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    try {
      const j = await res.clone().json();
      if (j && j.error) showToast(j.error, 'error');
    } catch (e) {}
  }
  return res;
}

function switchAdminTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-nav-btn').forEach(b => b.classList.remove('active'));

  const pane = document.getElementById(tabId);
  if (pane) pane.classList.add('active');

  const btn = Array.from(document.querySelectorAll('.side-nav-btn')).find(b => {
    const oc = b.getAttribute('onclick') || '';
    return oc.includes("'" + tabId + "'");
  });
  if (btn) btn.classList.add('active');

  const meta = TAB_META[tabId];
  if (meta) {
    document.getElementById('topbarTitle').innerText = meta[0];
    document.getElementById('topbarSub').innerText = meta[1];
  }

  const sb = document.getElementById('studioSidebar');
  if (sb && sb.classList.contains('open')) sb.classList.remove('open');

  if (tabId === 'tab-backup') loadBackupList();
  if (tabId === 'tab-review-style') updateReviewPreview();
}

function previewFile(event, previewId) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const previewEl = document.getElementById(previewId);
    if (previewEl) {
      previewEl.src = e.target.result;
      previewEl.style.display = 'block';
    }
    if (previewId === 'heroBgPreview') heroBgBase64 = e.target.result;
    if (previewId === 'partnerLogoPreview') partnerLogoBase64 = e.target.result;
    if (previewId === 'aboutPhotoPreview') aboutPhotoBase64 = e.target.result;
    if (previewId === 'setLogoPreview') siteLogoBase64 = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function handleAdminLogin(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const btn = document.getElementById('btnAdminLogin');
  const errBox = document.getElementById('loginErrorBox');
  if (errBox) { errBox.style.display = 'none'; errBox.innerText = ''; }
  if (btn) { btn.disabled = true; btn.innerText = 'Signing in...'; }

  try {
    const username = (document.getElementById('adUser').value || '').trim();
    const password = document.getElementById('adPass').value || '';
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.token) {
      sessionStorage.setItem('adToken', j.token);
      localStorage.setItem('adToken', j.token);
      initAdmin();
    } else {
      const msg = j.error || (res.status === 429 ? 'Too many failed attempts. Wait 15 minutes.' : 'Invalid username or password!');
      if (errBox) { errBox.innerText = msg; errBox.style.display = 'block'; }
      showToast(msg, 'error');
    }
  } catch (err) {
    const msg = 'Server is waking up or unreachable. Please wait 15 seconds and click Sign In again.';
    if (errBox) { errBox.innerText = msg; errBox.style.display = 'block'; }
    showToast(msg, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In to Studio &rarr;'; }
  }
  return false;
}

function initAdmin() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'flex';
  loadAdminData();
}

async function loadAdminData() {
  try {
    const res = await fetch('/api/site-data');
    const data = await res.json();

    // 1. Theme
    const t = data.theme || {};
    document.getElementById('thmPrimary').value = t.primaryColor || '#6366f1';
    syncHex('thmPrimary');
    document.getElementById('thmAccent').value = t.accentColor || '#8b5cf6';
    syncHex('thmAccent');
    document.getElementById('thmBgDark').value = t.bgDark || '#080c14';
    syncHex('thmBgDark');
    document.getElementById('thmBgLight').value = t.bgLight || '#f8fafc';
    syncHex('thmBgLight');

    setColorField('thmCardDark', t.cardBgDark, '#111827');
    setColorField('thmCardLight', t.cardBgLight, '#ffffff');
    setColorField('thmTextDark', t.textMainDark, '#f9fafb');
    setColorField('thmTextLight', t.textMainLight, '#0f172a');

    document.getElementById('thmFont').value = t.fontFamily || "'Plus Jakarta Sans', sans-serif";
    document.getElementById('thmFontSize').value = t.fontSizeBase || '16px';
    document.getElementById('thmWeight').value = t.headlineWeight || '900';
    document.getElementById('thmBtnRadius').value = t.buttonRadius || '50px';

    const cardRadNum = parseInt(t.cardRadius || '22', 10) || 22;
    document.getElementById('thmCardRadius').value = cardRadNum;
    document.getElementById('thmCardRadius_val').innerText = cardRadNum + 'px';

    // Hero visual tokens
    const ovPct = Math.round((parseFloat(t.heroOverlayOpacity || '0.88') || 0.88) * 100);
    document.getElementById('heroOverlay').value = ovPct;
    document.getElementById('heroOverlay_val').innerText = ovPct + '%';

    if (t.heroHeadlineSize) {
      const hs = parseInt(t.heroHeadlineSize, 10) || 44;
      customHeroHeadSize = true;
      document.getElementById('heroHeadSize').value = hs;
      document.getElementById('heroHeadSize_val').innerText = hs + 'px';
    } else {
      customHeroHeadSize = false;
      document.getElementById('heroHeadSize').value = 44;
      document.getElementById('heroHeadSize_val').innerText = 'Auto (44px)';
    }

    setColorField('heroHeadColor', t.heroHeadlineColor, '#ffffff');
    setColorField('heroSumColor', t.heroSummaryColor, '#e2e8f0');
    setColorField('statsDockText', t.statsDockText, '#ffffff');

    // 2. Hero Content
    const h = data.hero || {};
    document.getElementById('hHeadline').value = h.headline || '';
    document.getElementById('hCtaText').value = h.ctaText || '';
    document.getElementById('hCtaLink').value = h.ctaLink || '';
    document.getElementById('hSummary').value = h.summaryText || '';
    if (h.bgImage) {
      const el = document.getElementById('heroBgPreview');
      el.src = h.bgImage;
      el.style.display = 'block';
    }
    document.getElementById('hStat1Num').value = h.stat1Num || '';
    document.getElementById('hStat1Lbl').value = h.stat1Label || '';
    document.getElementById('hStat2Num').value = h.stat2Num || '';
    document.getElementById('hStat2Lbl').value = h.stat2Label || '';
    document.getElementById('hStat3Num').value = h.stat3Num || '';
    document.getElementById('hStat3Lbl').value = h.stat3Label || '';
    document.getElementById('hStat4Num').value = h.stat4Num || '';
    document.getElementById('hStat4Lbl').value = h.stat4Label || '';

    // 3. Review Card Customizer
    const rs = data.reviewStyle || {};
    document.getElementById('rsLayout').value = rs.layout || 'masonry';
    setColorField('rsCardBg', rs.cardBg, '#111827');
    setColorField('rsBorderColor', rs.borderColor, '#263045');
    document.getElementById('rsStarColor').value = rs.starColor || '#f59e0b';
    syncHex('rsStarColor');

    const rsRad = parseInt(rs.borderRadius || '20', 10);
    document.getElementById('rsRadius').value = isNaN(rsRad) ? 20 : rsRad;
    document.getElementById('rsRadius_val').innerText = (isNaN(rsRad) ? 20 : rsRad) + 'px';

    const rsPad = parseInt(rs.cardPadding || '28', 10) || 28;
    document.getElementById('rsPadding').value = rsPad;
    document.getElementById('rsPadding_val').innerText = rsPad + 'px';

    document.getElementById('rsShadow').value = rs.cardShadow || 'soft';
    document.getElementById('rsQuoteFont').value = rs.quoteFont || '';
    setColorField('rsQuoteColor', rs.quoteColor, '#f9fafb');

    const qSize = parseInt(rs.quoteSize || '15', 10) || 15;
    document.getElementById('rsQuoteSize').value = qSize;
    document.getElementById('rsQuoteSize_val').innerText = qSize + 'px';
    document.getElementById('rsQuoteItalic').value = rs.quoteItalic === false ? 'false' : 'true';

    setColorField('rsNameColor', rs.nameColor, '#ffffff');
    const nSize = parseInt(rs.nameSize || '16', 10) || 16;
    document.getElementById('rsNameSize').value = nSize;
    document.getElementById('rsNameSize_val').innerText = nSize + 'px';

    setColorField('rsRoleColor', rs.roleColor, '#9ca3af');
    const rSize = parseInt(rs.roleSize || '13', 10) || 13;
    document.getElementById('rsRoleSize').value = rSize;
    document.getElementById('rsRoleSize_val').innerText = rSize + 'px';

    updateReviewPreview();

    // 4. Page Builder & Customizer
    const cz = data.customizer || {};
    builderOrder = Array.isArray(cz.sectionsOrder) && cz.sectionsOrder.length
      ? cz.sectionsOrder.slice()
      : ['partners', 'about', 'services', 'reviews'];
    ['partners', 'about', 'services', 'reviews'].forEach(k => {
      if (!builderOrder.includes(k)) builderOrder.push(k);
    });
    builderVisible = Object.assign({ partners: true, about: true, services: true, reviews: true }, cz.sectionsVisible || {});
    renderSectionBuilder();

    selectServicesLayout(cz.servicesLayout || 'modal-cards');

    const tx = cz.sectionTexts || {};
    document.getElementById('secPartnersTitle').value = tx.partnersTitle || '';
    document.getElementById('secServicesTag').value = tx.servicesTag || '';
    document.getElementById('secServicesTitle').value = tx.servicesTitle || '';
    document.getElementById('secServicesSub').value = tx.servicesSubtitle || '';
    document.getElementById('secReviewsTag').value = tx.reviewsTag || '';
    document.getElementById('secReviewsTitle').value = tx.reviewsTitle || '';
    document.getElementById('secReviewsSub').value = tx.reviewsSubtitle || '';

    const sc = cz.sectionColors || {};
    setColorField('colPartnersBg', sc.partnersBg, '#080c14');
    setColorField('colAboutBg', sc.aboutBg, '#080c14');
    setColorField('colServicesBg', sc.servicesBg, '#0a0f1c');
    setColorField('colReviewsBg', sc.reviewsBg, '#080c14');

    // 5. Partners, About, Settings, Services, Reviews
    currentPartners = data.partners || [];
    renderAdminPartners();

    const a = data.about || {};
    document.getElementById('abTitle').value = a.title || '';
    document.getElementById('abLead').value = a.leadText || '';
    document.getElementById('abBio').value = a.bio || '';
    if (a.image) {
      const el = document.getElementById('aboutPhotoPreview');
      el.src = a.image;
      el.style.display = 'block';
    }

    const s = data.settings || {};
    document.getElementById('setSiteName').value = s.siteName || '';
    document.getElementById('setPhone').value = s.phone || '';
    document.getElementById('setEmail').value = s.email || '';
    document.getElementById('setAddress').value = s.address || '';
    document.getElementById('setFooterBio').value = s.footerBio || '';
    document.getElementById('setCopyright').value = s.copyright || '';
    document.getElementById('setCalendly').value = s.calendlyUrl || '';
    if (s.logoImage) {
      const el = document.getElementById('setLogoPreview');
      el.src = s.logoImage;
      el.style.display = 'block';
    }

    currentServices = data.services || [];
    renderAdminServices();
    currentReviews = data.reviews || [];
    renderAdminReviews();

  } catch (e) {
    console.error('Error loading admin data:', e);
  }
}

// ---------------- Save Theme ----------------
async function saveThemeSettings(e) {
  e.preventDefault();
  const payload = {
    primaryColor: document.getElementById('thmPrimary').value,
    accentColor: document.getElementById('thmAccent').value,
    bgDark: document.getElementById('thmBgDark').value,
    bgLight: document.getElementById('thmBgLight').value,
    cardBgDark: getOptionalColor('thmCardDark'),
    cardBgLight: getOptionalColor('thmCardLight'),
    textMainDark: getOptionalColor('thmTextDark'),
    textMainLight: getOptionalColor('thmTextLight'),
    fontFamily: document.getElementById('thmFont').value,
    fontSizeBase: document.getElementById('thmFontSize').value,
    headlineWeight: document.getElementById('thmWeight').value,
    buttonRadius: document.getElementById('thmBtnRadius').value,
    cardRadius: document.getElementById('thmCardRadius').value + 'px'
  };

  try {
    const res = await adminFetch('/api/admin/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Global theme, colors & typography saved!');
      loadAdminData();
    }
  } catch (err) {
    showToast('Server connection error.', 'error');
  }
}

// ---------------- Save Hero + Visual Tokens ----------------
async function saveHeroSettings(e) {
  e.preventDefault();
  const heroPayload = {
    bgImageBase64: heroBgBase64,
    headline: document.getElementById('hHeadline').value,
    ctaText: document.getElementById('hCtaText').value,
    ctaLink: document.getElementById('hCtaLink').value,
    summaryText: document.getElementById('hSummary').value,
    stat1Num: document.getElementById('hStat1Num').value,
    stat1Label: document.getElementById('hStat1Lbl').value,
    stat2Num: document.getElementById('hStat2Num').value,
    stat2Label: document.getElementById('hStat2Lbl').value,
    stat3Num: document.getElementById('hStat3Num').value,
    stat3Label: document.getElementById('hStat3Lbl').value,
    stat4Num: document.getElementById('hStat4Num').value,
    stat4Label: document.getElementById('hStat4Lbl').value
  };

  const visualPayload = {
    heroOverlayOpacity: (parseInt(document.getElementById('heroOverlay').value, 10) / 100).toFixed(2),
    heroHeadlineSize: customHeroHeadSize ? (document.getElementById('heroHeadSize').value + 'px') : '',
    heroHeadlineColor: getOptionalColor('heroHeadColor'),
    heroSummaryColor: getOptionalColor('heroSumColor'),
    statsDockText: getOptionalColor('statsDockText')
  };

  try {
    const [r1, r2] = await Promise.all([
      adminFetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroPayload)
      }),
      adminFetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visualPayload)
      })
    ]);
    if (r1.ok && r2.ok) {
      showToast('Hero content, background & styling saved!');
      heroBgBase64 = null;
      loadAdminData();
    }
  } catch (err) {
    showToast('Server connection error.', 'error');
  }
}

// ---------------- Review Card Studio Live Preview & Save ----------------
function updateReviewPreview() {
  const card = document.getElementById('liveRevCard');
  const stars = document.getElementById('liveRevStars');
  const quote = document.getElementById('liveRevQuote');
  const name = document.getElementById('liveRevName');
  const role = document.getElementById('liveRevRole');
  if (!card) return;

  const bg = getOptionalColor('rsCardBg') || '#111827';
  const border = getOptionalColor('rsBorderColor') || 'rgba(255,255,255,0.12)';
  const radius = document.getElementById('rsRadius').value + 'px';
  const padding = document.getElementById('rsPadding').value + 'px';
  const shadowKey = document.getElementById('rsShadow').value;
  const shadowMap = {
    none: 'none',
    soft: '0 8px 24px rgba(0, 0, 0, 0.18)',
    elevated: '0 18px 42px rgba(0, 0, 0, 0.35)',
    glow: '0 0 28px rgba(99, 102, 241, 0.28)'
  };

  card.style.background = bg;
  card.style.borderColor = border;
  card.style.borderRadius = radius;
  card.style.padding = padding;
  card.style.boxShadow = shadowMap[shadowKey] || shadowMap.soft;

  stars.style.color = document.getElementById('rsStarColor').value;

  const qFont = document.getElementById('rsQuoteFont').value;
  quote.style.fontFamily = qFont || 'inherit';
  quote.style.fontSize = document.getElementById('rsQuoteSize').value + 'px';
  quote.style.color = getOptionalColor('rsQuoteColor') || '#f9fafb';
  quote.style.fontStyle = document.getElementById('rsQuoteItalic').value === 'false' ? 'normal' : 'italic';

  name.style.color = getOptionalColor('rsNameColor') || '#ffffff';
  name.style.fontSize = document.getElementById('rsNameSize').value + 'px';

  role.style.color = getOptionalColor('rsRoleColor') || '#9ca3af';
  role.style.fontSize = document.getElementById('rsRoleSize').value + 'px';
}

async function saveReviewStyle(e) {
  e.preventDefault();
  const payload = {
    layout: document.getElementById('rsLayout').value,
    cardBg: getOptionalColor('rsCardBg'),
    borderColor: getOptionalColor('rsBorderColor'),
    starColor: document.getElementById('rsStarColor').value,
    borderRadius: document.getElementById('rsRadius').value + 'px',
    cardPadding: document.getElementById('rsPadding').value + 'px',
    cardShadow: document.getElementById('rsShadow').value,
    quoteFont: document.getElementById('rsQuoteFont').value,
    quoteColor: getOptionalColor('rsQuoteColor'),
    quoteSize: document.getElementById('rsQuoteSize').value + 'px',
    quoteItalic: document.getElementById('rsQuoteItalic').value === 'true',
    nameColor: getOptionalColor('rsNameColor'),
    nameSize: document.getElementById('rsNameSize').value + 'px',
    roleColor: getOptionalColor('rsRoleColor'),
    roleSize: document.getElementById('rsRoleSize').value + 'px'
  };

  try {
    const res = await adminFetch('/api/admin/review-style', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Review card design & typography saved!');
      loadAdminData();
    }
  } catch (err) {
    showToast('Server connection error.', 'error');
  }
}

// ---------------- Page Builder & Sections ----------------
function selectServicesLayout(val) {
  selectedSrvLayout = val;
  document.querySelectorAll('#srvLayoutChoices .layout-choice').forEach(el => {
    el.classList.toggle('selected', el.getAttribute('data-val') === val);
  });
}

function renderSectionBuilder() {
  const box = document.getElementById('sectionOrderList');
  if (!box) return;
  box.innerHTML = builderOrder.map((key, idx) => {
    const info = SECTION_LABELS[key] || { name: key, desc: '' };
    const checked = builderVisible[key] !== false;
    return `
      <div class="builder-row">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-weight: 800; color: #a5b4fc; width: 22px;">${idx + 1}.</span>
          <div>
            <div style="font-weight: 700; font-size: 0.94rem;">${escapeHtml(info.name)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(info.desc)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; margin-right: 6px;">
            <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleSectionVis('${key}', this.checked)">
            Visible
          </label>
          <button type="button" class="btn-mini-reset" ${idx === 0 ? 'disabled style="opacity:0.4;"' : ''} onclick="moveSection(${idx}, -1)">↑ Up</button>
          <button type="button" class="btn-mini-reset" ${idx === builderOrder.length - 1 ? 'disabled style="opacity:0.4;"' : ''} onclick="moveSection(${idx}, 1)">↓ Down</button>
        </div>
      </div>
    `;
  }).join('');
}

function moveSection(idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= builderOrder.length) return;
  const tmp = builderOrder[idx];
  builderOrder[idx] = builderOrder[target];
  builderOrder[target] = tmp;
  renderSectionBuilder();
}

function toggleSectionVis(key, isVis) {
  builderVisible[key] = isVis;
}

async function savePageCustomizer(e) {
  e.preventDefault();
  const payload = {
    sectionsOrder: builderOrder,
    sectionsVisible: builderVisible,
    servicesLayout: selectedSrvLayout,
    sectionTexts: {
      partnersTitle: document.getElementById('secPartnersTitle').value.trim(),
      servicesTag: document.getElementById('secServicesTag').value.trim(),
      servicesTitle: document.getElementById('secServicesTitle').value.trim(),
      servicesSubtitle: document.getElementById('secServicesSub').value.trim(),
      reviewsTag: document.getElementById('secReviewsTag').value.trim(),
      reviewsTitle: document.getElementById('secReviewsTitle').value.trim(),
      reviewsSubtitle: document.getElementById('secReviewsSub').value.trim()
    },
    sectionColors: {
      partnersBg: getOptionalColor('colPartnersBg'),
      aboutBg: getOptionalColor('colAboutBg'),
      servicesBg: getOptionalColor('colServicesBg'),
      reviewsBg: getOptionalColor('colReviewsBg')
    }
  };

  try {
    const res = await adminFetch('/api/admin/customizer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Page Builder layout, section order & titles saved!');
      loadAdminData();
    }
  } catch (err) {
    showToast('Server connection error.', 'error');
  }
}

// ---------------- About, Footer, Security ----------------
async function saveAboutSettings(e) {
  e.preventDefault();
  const payload = {
    imageBase64: aboutPhotoBase64,
    title: document.getElementById('abTitle').value,
    leadText: document.getElementById('abLead').value,
    bio: document.getElementById('abBio').value
  };
  const res = await adminFetch('/api/admin/about', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast('About coach profile & photo saved!');
    aboutPhotoBase64 = null;
    loadAdminData();
  }
}

async function saveFooterSettings(e) {
  e.preventDefault();
  const payload = {
    siteName: document.getElementById('setSiteName').value,
    logoBase64: siteLogoBase64,
    phone: document.getElementById('setPhone').value,
    email: document.getElementById('setEmail').value,
    address: document.getElementById('setAddress').value,
    footerBio: document.getElementById('setFooterBio').value,
    copyright: document.getElementById('setCopyright').value
  };
  const res = await adminFetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast('Brand name, logo & footer details saved!');
    siteLogoBase64 = null;
    loadAdminData();
  }
}

async function saveSecuritySettings(e) {
  e.preventDefault();
  const payload = {
    calendlyUrl: document.getElementById('setCalendly').value,
    newPassword: document.getElementById('setNewPass').value
  };
  const res = await adminFetch('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  document.getElementById('setNewPass').value = '';
  if (res.ok) {
    showToast('Calendly URL & security settings updated!');
    loadAdminData();
  }
}

// ---------------- Partners CRUD ----------------
function renderAdminPartners() {
  const container = document.getElementById('partnersAdminList');
  if (currentPartners.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">No featured organizations added yet.</p>';
    return;
  }
  container.innerHTML = currentPartners.map(p => `
    <div class="item-row">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${p.logo ? `<img src="${p.logo}" alt="${escapeHtml(p.name)}" style="height: 26px; object-fit: contain;">` : '<span style="color: var(--text-muted); font-size: 0.78rem;">[Text Badge]</span>'}
        <strong>${escapeHtml(p.name)}</strong>
      </div>
      <button onclick="deletePartner(${p.id})" class="btn-danger">Delete</button>
    </div>
  `).join('');
}

async function handleAddPartner(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('partnerName').value,
    logoBase64: partnerLogoBase64
  };
  const res = await adminFetch('/api/admin/partners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast('Organization added!');
    document.getElementById('partnerName').value = '';
    document.getElementById('partnerLogoFile').value = '';
    document.getElementById('partnerLogoPreview').style.display = 'none';
    partnerLogoBase64 = null;
    loadAdminData();
  }
}

async function deletePartner(id) {
  if (!confirm('Remove this organization?')) return;
  await adminFetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
  showToast('Organization removed.');
  loadAdminData();
}

// ---------------- Services CRUD ----------------
function renderAdminServices() {
  const container = document.getElementById('servicesAdminList');
  if (currentServices.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">No services created yet.</p>';
    return;
  }
  container.innerHTML = currentServices.map(s => `
    <div class="item-row">
      <div>
        <strong>${escapeHtml(s.title)}</strong> <span style="color: #a5b4fc; font-size: 0.8rem;">[${escapeHtml(s.category)}]</span>
        <div style="font-size: 0.83rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(s.shortDesc)}</div>
      </div>
      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <button onclick="editService(${s.id})" class="btn-ghost" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Edit</button>
        <button onclick="deleteService(${s.id})" class="btn-danger">Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleSaveService(e) {
  e.preventDefault();
  const id = document.getElementById('srvEditId').value;
  const payload = {
    title: document.getElementById('srvTitle').value,
    category: document.getElementById('srvCategory').value,
    shortDesc: document.getElementById('srvShortDesc').value,
    fullDetails: document.getElementById('srvFullDetails').value,
    features: document.getElementById('srvFeatures').value
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/services/${id}` : '/api/admin/services';
  const res = await adminFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast(id ? 'Service updated!' : 'New service published!');
    resetServiceForm();
    loadAdminData();
  }
}

function editService(id) {
  const s = currentServices.find(item => item.id == id);
  if (!s) return;
  document.getElementById('srvEditId').value = s.id;
  document.getElementById('srvTitle').value = s.title;
  document.getElementById('srvCategory').value = s.category;
  document.getElementById('srvShortDesc').value = s.shortDesc;
  document.getElementById('srvFullDetails').value = s.fullDetails;
  document.getElementById('srvFeatures').value = (s.features || []).join(', ');
  document.getElementById('srvFormTitle').innerText = 'Edit Service: ' + s.title;
  document.getElementById('srvSubmitBtn').innerText = 'Update Service';
  document.getElementById('srvCancelBtn').style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetServiceForm() {
  document.getElementById('serviceForm').reset();
  document.getElementById('srvEditId').value = '';
  document.getElementById('srvFormTitle').innerText = 'Add Strategic Program / Service';
  document.getElementById('srvSubmitBtn').innerText = 'Save Service';
  document.getElementById('srvCancelBtn').style.display = 'none';
}

async function deleteService(id) {
  if (!confirm('Delete this service?')) return;
  await adminFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
  showToast('Service deleted.');
  loadAdminData();
}

// ---------------- Reviews CRUD ----------------
function renderAdminReviews() {
  const container = document.getElementById('reviewsAdminList');
  if (currentReviews.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">No reviews published yet.</p>';
    return;
  }
  container.innerHTML = currentReviews.map(r => `
    <div class="item-row">
      <div>
        <strong>${escapeHtml(r.name)}</strong> — <span style="color: var(--text-muted); font-size: 0.82rem;">${escapeHtml(r.role)}</span>
        <div style="color: #f59e0b; font-size: 0.82rem;">${'★'.repeat(r.rating || 5)}</div>
        <div style="font-size: 0.83rem; color: var(--text-muted); font-style: italic; margin-top: 2px;">"${escapeHtml(r.comment)}"</div>
      </div>
      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <button onclick="editReview(${r.id})" class="btn-ghost" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Edit</button>
        <button onclick="deleteReview(${r.id})" class="btn-danger">Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleSaveReview(e) {
  e.preventDefault();
  const id = document.getElementById('revEditId').value;
  const payload = {
    name: document.getElementById('revName').value,
    role: document.getElementById('revRole').value,
    rating: document.getElementById('revRating').value,
    comment: document.getElementById('revComment').value
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/reviews/${id}` : '/api/admin/reviews';
  const res = await adminFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    showToast(id ? 'Review updated!' : 'Review published!');
    resetReviewForm();
    loadAdminData();
  }
}

function editReview(id) {
  const r = currentReviews.find(item => item.id == id);
  if (!r) return;
  document.getElementById('revEditId').value = r.id;
  document.getElementById('revName').value = r.name;
  document.getElementById('revRole').value = r.role;
  document.getElementById('revRating').value = r.rating;
  document.getElementById('revComment').value = r.comment;
  document.getElementById('revFormTitle').innerText = 'Edit Review: ' + r.name;
  document.getElementById('revSubmitBtn').innerText = 'Update Review';
  document.getElementById('revCancelBtn').style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetReviewForm() {
  document.getElementById('reviewForm').reset();
  document.getElementById('revEditId').value = '';
  document.getElementById('revFormTitle').innerText = 'Add Client Testimonial';
  document.getElementById('revSubmitBtn').innerText = 'Publish Review';
  document.getElementById('revCancelBtn').style.display = 'none';
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
  showToast('Review deleted.');
  loadAdminData();
}

// ---------------- Backup & Restore ----------------
async function downloadBackup() {
  const res = await adminFetch('/api/admin/backup');
  if (!res.ok) return;
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'site-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  showToast('Backup JSON downloaded.');
}

async function restoreFromFile(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!confirm('Replace ALL current site content with "' + file.name + '"?\n\nA cloud snapshot of the current content is saved first.')) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    showToast('Invalid JSON file. Nothing was changed.', 'error');
    return;
  }
  const res = await adminFetch('/api/admin/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    showToast('Backup restored successfully!');
    loadAdminData();
    loadBackupList();
  }
}

async function loadBackupList() {
  const box = document.getElementById('backupList');
  if (!box) return;
  box.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">Loading snapshots...</p>';
  try {
    const res = await adminFetch('/api/admin/backups');
    if (!res.ok) { box.innerHTML = ''; return; }
    const { backups } = await res.json();
    if (!backups.length) {
      box.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">No automatic snapshots yet. One is created automatically before every save.</p>';
      return;
    }
    box.innerHTML = backups.map(b => `
      <div class="item-row">
        <div>
          <strong>${new Date(b.createdAt).toLocaleString()}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">before: ${escapeHtml(b.reason || 'update')} · ${(b.sizeBytes / 1048576).toFixed(2)} MB</div>
        </div>
        <button onclick="restoreSnapshot('${b.id}')" class="btn-ghost" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Restore</button>
      </div>`).join('');
  } catch (e) {
    box.innerHTML = '';
  }
}

async function restoreSnapshot(id) {
  if (!confirm('Restore the site to this snapshot? Current content is saved as a new snapshot first.')) return;
  const res = await adminFetch('/api/admin/backups/' + id + '/restore', { method: 'POST' });
  if (res.ok) {
    showToast('Snapshot restored successfully!');
    loadAdminData();
    loadBackupList();
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('adToken'); localStorage.removeItem('adToken');
  location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
  }
  if (sessionStorage.getItem('adToken') || localStorage.getItem('adToken')) {
    initAdmin();
  }
});
