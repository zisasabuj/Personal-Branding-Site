let currentSiteData = {};

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
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerText = theme === 'dark' ? '☀️' : '🌙';
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) {
    drawer.classList.toggle('active');
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

function renderSite(data) {
  if (data.theme) {
    applyThemeColors(data.theme);
  }

  const s = data.settings || {};
  document.getElementById('navSiteName').innerText = s.siteName || 'KABIR';
  document.getElementById('footerSiteName').innerText = s.siteName || 'KABIR';
  if (s.logoImage) {
    const lImg = document.getElementById('navLogoImg');
    lImg.src = s.logoImage;
    lImg.style.display = 'block';
  }

  const calUrl = s.calendlyUrl || 'https://calendly.com';
  document.getElementById('navCalendlyBtn').href = calUrl;
  document.getElementById('aboutCalendlyBtn').href = calUrl;
  document.getElementById('stickyCalendlyBtn').href = calUrl;

  document.getElementById('footerBio').innerText = s.footerBio || '';
  document.getElementById('footerPhone').innerText = `Phone: ${s.phone || ''}`;
  document.getElementById('footerEmail').innerText = `Email: ${s.email || ''}`;
  document.getElementById('footerAddress').innerText = `Address: ${s.address || ''}`;
  document.getElementById('footerCopyright').innerText = s.copyright || '© 2026 All rights reserved.';

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
      ${p.logo ? `<img src="${p.logo}" alt="${p.name}" class="partner-logo-img">` : ''}
      <span>${p.name}</span>
    </div>
  `).join('');

  const a = data.about || {};
  document.getElementById('aboutTitle').innerText = a.title || 'Meet Kabir';
  document.getElementById('aboutLead').innerText = a.leadText || '';
  document.getElementById('aboutBio').innerText = a.bio || '';
  if (a.image) document.getElementById('aboutImg').src = a.image;

  const sContainer = document.getElementById('servicesCardsContainer');
  sContainer.innerHTML = (data.services || []).map(srv => `
    <div class="service-card reveal-scroll">
      <div>
        <div class="card-cat">${srv.category || 'Strategic Program'}</div>
        <h3>${srv.title}</h3>
        <p>${srv.shortDesc}</p>
        <span style="font-size: 0.85rem; color: var(--primary-color); font-weight: 700; display: inline-flex; align-items: center; gap: 6px; margin-top: 1.5rem;">
          Hover for Full Scope &rarr;
        </span>
      </div>

      <div class="card-hover-details">
        <div>
          <div class="card-cat" style="color: var(--primary-color);">Included Scope</div>
          <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">${srv.fullDetails}</p>
          <ul class="hover-feat-list">
            ${(srv.features || []).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        <a href="#about" class="btn-pill" style="justify-content: center;">
          Inquire Scope &rarr;
        </a>
      </div>
    </div>
  `).join('');

  const rContainer = document.getElementById('reviewsContainer');
  rContainer.innerHTML = (data.reviews || []).map(r => `
    <div class="review-card reveal-scroll">
      <div class="stars">${'★'.repeat(r.rating || 5)}</div>
      <p class="rev-quote">"${r.comment}"</p>
      <div>
        <div class="rev-name">${r.name}</div>
        <div class="rev-role">${r.role}</div>
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
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-scroll').forEach(el => observer.observe(el));
}

window.addEventListener('DOMContentLoaded', loadSite);
