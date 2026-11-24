let currentServices = [];
let currentReviews = [];
let currentPartners = [];


// ---- Auth helper: প্রতিটি অ্যাডমিন রিকোয়েস্টে টোকেন পাঠায় ----
async function adminFetch(url, options) {
  options = options || {};
  options.headers = Object.assign({}, options.headers, {
    'Authorization': 'Bearer ' + (sessionStorage.getItem('adToken') || '')
  });
  const res = await fetch(url, options);
  if (res.status === 401) {
    alert('Session expired or not authorized. Please log in again.');
    sessionStorage.removeItem('adToken');
    location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    try {
      const j = await res.clone().json();
      if (j && j.error) alert(j.error);
    } catch (e) {}
  }
  return res;
}

let heroBgBase64 = null;
let partnerLogoBase64 = null;
let aboutPhotoBase64 = null;
let siteLogoBase64 = null;

function switchAdminTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
  if (btn) btn.classList.add('active');
  if (tabId === 'tab-backup') loadBackupList();
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
  e.preventDefault();
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('adUser').value,
      password: document.getElementById('adPass').value
    })
  });
  if (res.ok) {
    const j = await res.json();
    sessionStorage.setItem('adToken', j.token);
    initAdmin();
  } else if (res.status === 429) {
    alert('Too many failed attempts. Please wait 15 minutes.');
  } else {
    alert('Invalid username or password!');
  }
}

function initAdmin() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  loadAdminData();
}

async function loadAdminData() {
  try {
    const res = await fetch('/api/site-data');
    const data = await res.json();

    const t = data.theme || {};
    document.getElementById('thmPrimary').value = t.primaryColor || '#6366f1';
    document.getElementById('thmAccent').value = t.accentColor || '#8b5cf6';
    document.getElementById('thmBgDark').value = t.bgDark || '#080c14';
    document.getElementById('thmBgLight').value = t.bgLight || '#f8fafc';
    document.getElementById('thmFont').value = t.fontFamily || "'Plus Jakarta Sans', sans-serif";
    document.getElementById('thmFontSize').value = t.fontSizeBase || '16px';
    document.getElementById('thmWeight').value = t.headlineWeight || '900';

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

async function saveThemeSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveTheme');
  btn.innerText = 'Saving Theme...';
  const payload = {
    primaryColor: document.getElementById('thmPrimary').value,
    accentColor: document.getElementById('thmAccent').value,
    bgDark: document.getElementById('thmBgDark').value,
    bgLight: document.getElementById('thmBgLight').value,
    fontFamily: document.getElementById('thmFont').value,
    fontSizeBase: document.getElementById('thmFontSize').value,
    headlineWeight: document.getElementById('thmWeight').value
  };

  try {
    const res = await adminFetch('/api/admin/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('Theme colors, fonts, and Day/Night settings saved successfully!');
      loadAdminData();
    } else {
      alert('Failed to save theme settings.');
    }
  } catch (err) {
    alert('Server connection error.');
  } finally {
    btn.innerText = 'Save Theme & Colors';
  }
}

async function saveHeroSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveHero');
  btn.innerText = 'Saving Hero...';
  const payload = {
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

  try {
    const res = await adminFetch('/api/admin/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('Hero section and background photo saved successfully!');
      heroBgBase64 = null;
      loadAdminData();
    } else {
      alert('Failed to save hero setup.');
    }
  } catch (err) {
    alert('Server connection error.');
  } finally {
    btn.innerText = 'Save Hero Setup';
  }
}

async function saveAboutSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveAbout');
  btn.innerText = 'Saving About...';
  const payload = {
    imageBase64: aboutPhotoBase64,
    title: document.getElementById('abTitle').value,
    leadText: document.getElementById('abLead').value,
    bio: document.getElementById('abBio').value
  };

  try {
    const res = await adminFetch('/api/admin/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('About coach section and photo saved successfully!');
      aboutPhotoBase64 = null;
      loadAdminData();
    } else {
      alert('Failed to save about section.');
    }
  } catch (err) {
    alert('Server connection error.');
  } finally {
    btn.innerText = 'Save About Info';
  }
}

async function saveFooterSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveFooter');
  btn.innerText = 'Saving Footer...';
  const payload = {
    siteName: document.getElementById('setSiteName').value,
    logoBase64: siteLogoBase64,
    phone: document.getElementById('setPhone').value,
    email: document.getElementById('setEmail').value,
    address: document.getElementById('setAddress').value,
    footerBio: document.getElementById('setFooterBio').value,
    copyright: document.getElementById('setCopyright').value
  };

  try {
    const res = await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('Brand Logo and Footer contact details saved successfully!');
      siteLogoBase64 = null;
      loadAdminData();
    } else {
      alert('Failed to save logo & footer details.');
    }
  } catch (err) {
    alert('Server connection error.');
  } finally {
    btn.innerText = 'Save Logo & Footer Details';
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
  if (res.ok) {
    alert('Calendly booking URL and password updated successfully!');
    document.getElementById('setNewPass').value = '';
    loadAdminData();
  } else {
    document.getElementById('setNewPass').value = '';
  }
}

function renderAdminPartners() {
  const container = document.getElementById('partnersAdminList');
  if (currentPartners.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No featured brands added yet.</p>';
    return;
  }
  container.innerHTML = currentPartners.map(p => `
    <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); padding: 0.8rem 1.2rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${p.logo ? `<img src="${p.logo}" alt="${p.name}" style="height: 24px; object-fit: contain;">` : '<span style="color: var(--text-muted); font-size: 0.8rem;">[No Logo]</span>'}
        <strong>${p.name}</strong>
      </div>
      <button onclick="deletePartner(${p.id})" class="btn-pill" style="background: #ef4444; padding: 0.35rem 0.8rem; font-size: 0.8rem;">Delete</button>
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
    alert('Partner brand added!');
    document.getElementById('partnerName').value = '';
    document.getElementById('partnerLogoFile').value = '';
    document.getElementById('partnerLogoPreview').style.display = 'none';
    partnerLogoBase64 = null;
    loadAdminData();
  }
}

async function deletePartner(id) {
  if (!confirm('Remove this partner brand?')) return;
  await adminFetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
  loadAdminData();
}

function renderAdminServices() {
  const container = document.getElementById('servicesAdminList');
  if (currentServices.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No services created yet.</p>';
    return;
  }
  container.innerHTML = currentServices.map(s => `
    <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); padding: 0.9rem 1.2rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${s.title}</strong> <span style="color: var(--primary-color); font-size: 0.85rem;">[${s.category}]</span>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${s.shortDesc}</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button onclick="editService(${s.id})" class="btn-pill" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;">Edit</button>
        <button onclick="deleteService(${s.id})" class="btn-pill" style="padding: 0.35rem 0.8rem; font-size: 0.8rem; background: #ef4444;">Delete</button>
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
    alert(id ? 'Service updated!' : 'New service added!');
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
  document.getElementById('srvCancelBtn').style.display = 'inline-block';
}

function resetServiceForm() {
  document.getElementById('serviceForm').reset();
  document.getElementById('srvEditId').value = '';
  document.getElementById('srvFormTitle').innerText = 'Add Strategic Service';
  document.getElementById('srvSubmitBtn').innerText = 'Save Service';
  document.getElementById('srvCancelBtn').style.display = 'none';
}

async function deleteService(id) {
  if (!confirm('Delete this service?')) return;
  await adminFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
  loadAdminData();
}

function renderAdminReviews() {
  const container = document.getElementById('reviewsAdminList');
  if (currentReviews.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No reviews posted yet.</p>';
    return;
  }
  container.innerHTML = currentReviews.map(r => `
    <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); padding: 0.9rem 1.2rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${r.name}</strong> - <span style="color: var(--text-muted); font-size: 0.85rem;">${r.role}</span>
        <div style="color: #f59e0b; font-size: 0.85rem;">${'★'.repeat(r.rating || 5)}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">"${r.comment}"</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button onclick="editReview(${r.id})" class="btn-pill" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;">Edit</button>
        <button onclick="deleteReview(${r.id})" class="btn-pill" style="padding: 0.35rem 0.8rem; font-size: 0.8rem; background: #ef4444;">Delete</button>
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
    alert(id ? 'Review updated!' : 'Review published!');
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
  document.getElementById('revCancelBtn').style.display = 'inline-block';
}

function resetReviewForm() {
  document.getElementById('reviewForm').reset();
  document.getElementById('revEditId').value = '';
  document.getElementById('revFormTitle').innerText = 'Add Client Review';
  document.getElementById('revSubmitBtn').innerText = 'Publish Review';
  document.getElementById('revCancelBtn').style.display = 'none';
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
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
}

async function restoreFromFile(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!confirm('Replace ALL current site content with the contents of "' + file.name + '"?\n\nA snapshot of the current content is saved first, so you can undo this.')) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    alert('This file is not valid JSON. Nothing was changed.');
    return;
  }
  const res = await adminFetch('/api/admin/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    alert('Backup restored successfully.');
    loadAdminData();
    loadBackupList();
  }
}

async function loadBackupList() {
  const box = document.getElementById('backupList');
  if (!box) return;
  box.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Loading...</p>';
  try {
    const res = await adminFetch('/api/admin/backups');
    if (!res.ok) { box.innerHTML = ''; return; }
    const { backups } = await res.json();
    if (!backups.length) {
      box.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No automatic snapshots yet. One is created automatically before every save.</p>';
      return;
    }
    box.innerHTML = backups.map(b => `
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); padding: 0.8rem 1.2rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div>
          <strong>${new Date(b.createdAt).toLocaleString()}</strong>
          <div style="font-size: 0.82rem; color: var(--text-muted);">before: ${b.reason || 'update'} · ${(b.sizeBytes / 1048576).toFixed(2)} MB</div>
        </div>
        <button onclick="restoreSnapshot('${b.id}')" class="btn-pill" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;">Restore</button>
      </div>`).join('');
  } catch (e) {
    box.innerHTML = '';
  }
}

async function restoreSnapshot(id) {
  if (!confirm('Restore the site to this snapshot? The current content is saved as a new snapshot first.')) return;
  const res = await adminFetch('/api/admin/backups/' + id + '/restore', { method: 'POST' });
  if (res.ok) {
    alert('Snapshot restored successfully.');
    loadAdminData();
    loadBackupList();
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('adToken');
  location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adToken')) {
    initAdmin();
  }
});
