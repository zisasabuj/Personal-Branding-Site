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
      aboutTag: document.getElementById('secAboutTag').value.trim(),
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
  sessionStorage.removeItem('adToken');
  location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adToken')) {
    initAdmin();
  }
});
