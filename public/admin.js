'use strict';
/* =====================================================================
   Admin Console — content managers + Design Studio (live preview)
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o == null ? {} : o));

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3a4.9 4.9 0 0 0 4.7-5C22 6 17.5 2 12 2z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  up: '<path d="M18 15l-6-6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  chev: '<path d="M9 18l6-6-6-6"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/>',
  undo: '<path d="M3 7v6h6M3 13a9 9 0 1 0 3-7"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  type2: '<path d="M4 20h16M6 16l6-12 6 12M8.5 11h7"/>',
  mouse: '<path d="M4 4l7 17 2.5-7.5L21 11z"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;

/* ------------------------------ state ------------------------------ */
const S = {
  data: {}, design: {}, saved: '{}', stats: null, route: 'overview',
  imgs: {}, previewDevice: 'desktop'
};
const token = () => sessionStorage.getItem('adToken') || '';
const isDirty = () => JSON.stringify(S.design) !== S.saved;

/* ------------------------------ api / ui helpers ------------------------------ */
async function api(method, url, body, raw) {
  const res = await fetch(url, {
    method,
    headers: Object.assign({ Authorization: 'Bearer ' + token() }, body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  if (res.status === 401 && url !== '/api/admin/login') { doLogout(true); throw new Error('Session expired. Please sign in again.'); }
  if (raw && res.ok) return res;
  let json = null;
  try { json = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) throw new Error((json && json.error) || 'Request failed (' + res.status + ')');
  return json;
}
function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'err' ? ' err' : '');
  t.innerHTML = ic(type === 'err' ? 'alert' : 'check') + '<div>' + esc(msg) + '</div>';
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, type === 'err' ? 6000 : 3200);
}
// run an async action on a button with feedback
async function act(btn, fn, okMsg) {
  if (btn) btn.disabled = true;
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(e.message || 'Something went wrong', 'err'); return undefined; }
  finally { if (btn) btn.disabled = false; }
}
function modal(o) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal ${o.size || ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}">
    <header><h3>${esc(o.title)}</h3><button class="icon-btn" data-x aria-label="Close">${ic('plus').replace('<svg', '<svg style="transform:rotate(45deg)"')}</button></header>
    <div class="mb">${o.body}</div>
    <footer>${o.noCancel ? '' : '<button class="btn" data-x>Cancel</button>'}<button class="btn ${o.danger ? 'danger' : 'primary'}" data-ok>${esc(o.okText || 'Save')}</button></footer></div>`;
  document.body.appendChild(wrap);
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  $$('[data-x]', wrap).forEach(b => b.onclick = close);
  const ok = $('[data-ok]', wrap);
  ok.onclick = async () => {
    ok.disabled = true;
    try { const r = o.onOk ? await o.onOk(wrap) : true; if (r !== false) close(); }
    catch (e) { toast(e.message || 'Error', 'err'); }
    finally { ok.disabled = false; }
  };
  if (o.onOpen) o.onOpen(wrap);
  const first = $('input:not([type=file]),textarea,select', wrap); if (first && !o.noFocus) first.focus();
  return { close, el: wrap };
}
const confirmBox = (msg, okText, danger) => new Promise(res => {
  let done = false;
  const m = modal({ title: 'Please confirm', size: 'sm', body: `<p style="color:#c4cbe3">${esc(msg)}</p>`, okText: okText || 'Confirm', danger: danger !== false, noFocus: true,
    onOk: () => { done = true; res(true); } });
  const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) res(false); } });
  obs.observe(document.body, { childList: true });
});

/* ------------------------------ images ------------------------------ */
function compressImage(dataUrl, file, maxDim) {
  return new Promise(resolve => {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        let out = c.toDataURL('image/webp', 0.85);
        if (out.indexOf('data:image/webp') !== 0) out = file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
        if (scale === 1 && out.length >= dataUrl.length) out = dataUrl;
        resolve(out);
      } catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
function readImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('Please choose an image file.'));
    if (file.size > 25 * 1024 * 1024) return reject(new Error('Image is too large (max 25 MB).'));
    const r = new FileReader();
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.onload = async () => resolve(await compressImage(r.result, file, maxDim));
    r.readAsDataURL(file);
  });
}
function dropHtml(id, label, current, hint, removable) {
  return `<div class="field"><label>${esc(label)}${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</label>
    <div class="drop" data-drop="${id}" tabindex="0" role="button" aria-label="Upload ${esc(label)}">
      <div class="thumb">${current ? `<img src="${esc(current)}" alt="">` : ic('image')}</div>
      <div class="meta"><b>${current ? 'Click or drop to replace' : 'Click or drop an image'}</b><span>PNG, JPG, WebP, SVG — auto-optimised</span></div>
      ${removable && current ? `<button type="button" class="btn sm danger" data-drop-clear="${id}">Remove</button>` : ''}
      <input type="file" accept="image/*"></div></div>`;
}
// wire all drop zones inside root; onPick(id, dataUrl|'' )
function bindDrops(root, maxDims, onPick) {
  $$('[data-drop]', root).forEach(z => {
    const id = z.dataset.drop, inp = $('input[type=file]', z);
    const pick = async f => {
      try {
        const url = await readImage(f, (maxDims && maxDims[id]) || 1600);
        const th = $('.thumb', z); th.innerHTML = `<img src="${url}" alt="">`;
        $('.meta b', z).textContent = 'Image ready — remember to save';
        onPick(id, url);
      } catch (e) { toast(e.message, 'err'); }
    };
    z.addEventListener('click', e => { if (e.target.closest('[data-drop-clear]')) return; inp.click(); });
    z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    inp.addEventListener('click', e => e.stopPropagation());
    inp.addEventListener('change', () => { if (inp.files[0]) pick(inp.files[0]); inp.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('over'); }));
    z.addEventListener('drop', e => { if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    const clr = $('[data-drop-clear]', z);
    if (clr) clr.addEventListener('click', e => { e.stopPropagation(); onPick(id, ''); });
  });
}
const IMG_MAX = { heroBg: 1920, aboutImg: 1200, logo: 500, partnerLogo: 500, secBg: 1920 };

/* ------------------------------ data ------------------------------ */
async function loadData() {
  const res = await fetch('/api/site-data', { cache: 'no-store' });
  S.data = await res.json();
  S.design = clone(S.data.design);
  S.saved = JSON.stringify(S.design);
  S.stats = await api('GET', '/api/admin/stats').catch(() => null);
}
const D = () => S.data || {};
const nameOf = () => (D().settings && D().settings.siteName) || 'Your Site';

/* ------------------------------ shell / router ------------------------------ */
const ROUTES = [
  { g: '', id: 'overview', t: 'Overview', i: 'home' },
  { g: 'Content', id: 'hero', t: 'Hero & Stats', i: 'layout' },
  { id: 'about', t: 'About', i: 'user' },
  { id: 'services', t: 'Services', i: 'briefcase' },
  { id: 'reviews', t: 'Client Reviews', i: 'message' },
  { id: 'partners', t: 'Partners', i: 'award' },
  { g: 'Design', id: 'studio', t: 'Design Studio', i: 'palette' },
  { g: 'Settings', id: 'brand', t: 'Brand & Contact', i: 'sliders' },
  { id: 'security', t: 'Security', i: 'lock' },
  { g: 'System', id: 'backup', t: 'Backup & Restore', i: 'database' }
];
function renderNav() {
  let h = '';
  ROUTES.forEach(r => {
    if (r.g) h += `<h6>${r.g}</h6>`;
    h += `<a data-route="${r.id}" class="${S.route === r.id ? 'on' : ''}" tabindex="0">${ic(r.i)}<span>${r.t}</span>${r.id === 'studio' && isDirty() ? '<i class="dot" title="Unsaved changes"></i>' : ''}</a>`;
  });
  $('#nav').innerHTML = h;
}
function go(id) { if (location.hash !== '#/' + id) location.hash = '#/' + id; else route(); }
function route() {
  const id = (location.hash.replace('#/', '') || 'overview');
  const r = ROUTES.find(x => x.id === id) || ROUTES[0];
  S.route = r.id;
  $('#sidebar').classList.remove('open'); const sc = $('.scrim'); if (sc) sc.remove();
  $('#pageTitle').textContent = r.t;
  $('#crumb').textContent = r.g || 'Dashboard';
  $('#topActions').innerHTML = '';
  renderNav();
  const v = $('#view');
  v.className = 'view' + (r.id === 'studio' ? ' wide' : '');
  v.innerHTML = '';
  (VIEWS[r.id] || VIEWS.overview)(v);
  window.scrollTo(0, 0);
}
function initApp() {
  $('#loginScreen').hidden = true; $('#appShell').hidden = false;
  $('#sbName').textContent = nameOf();
  $('#viewSite').innerHTML = ic('external') + ' View website';
  $('#logoutBtn').innerHTML = ic('logout') + ' Sign out';
  route();
}
function doLogout(expired) {
  if (!expired && isDirty() && !confirm('You have unsaved Design Studio changes. Sign out anyway?')) return;
  sessionStorage.removeItem('adToken');
  if (expired) sessionStorage.setItem('adExpired', '1');
  location.reload();
}

/* ------------------------------ login ------------------------------ */
function bindLogin() {
  const form = $('#loginForm'), err = $('#loginErr');
  if (sessionStorage.getItem('adExpired')) { err.textContent = 'Your session expired. Please sign in again.'; sessionStorage.removeItem('adExpired'); }
  $('#togglePw').onclick = () => { const p = $('#adPass'); p.type = p.type === 'password' ? 'text' : 'password'; };
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const btn = $('#loginBtn'); btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#adUser').value.trim(), password: $('#adPass').value }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Sign-in failed');
      sessionStorage.setItem('adToken', j.token);
      await boot();
    } catch (ex) {
      err.textContent = ex.message; form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    } finally { btn.disabled = false; btn.textContent = 'Sign in'; }
  });
}
async function boot() { await loadData(); initApp(); }

/* ------------------------------ overview ------------------------------ */
const VIEWS = {};
VIEWS.overview = v => {
  const st = S.stats || { counts: {}, sizeBytes: 0, maxBytes: 15728640 };
  const pct = Math.min(100, Math.round((st.sizeBytes / st.maxBytes) * 100));
  const mb = n => (n / 1048576).toFixed(2);
  const design = S.design || {};
  const tips = [];
  if (st.defaultPassword) tips.push(['alert', 'You are still using the default admin password. Change it now in Security — the default is visible in the public source code.', 'security', 'Change password']);
  if ((design.nav || {}).showAdminLink !== false) tips.push(['info', 'The public menu shows an "Admin" link to every visitor. You can hide it in Design Studio → Navigation.', 'studio', 'Open Studio']);
  if (pct >= 70) tips.push(['alert', `Stored content is using ${pct}% of the ${mb(st.maxBytes)} MB limit. Use smaller images or remove unused ones.`]);
  v.innerHTML = `
    <div class="page-intro"><h2>Welcome back 👋</h2><p>Everything for <b>${esc(nameOf())}</b> in one place.</p></div>
    <div class="stat-grid">
      <div class="stat"><div class="n">${st.counts.services ?? '–'}</div><div class="l">Services</div></div>
      <div class="stat"><div class="n">${st.counts.reviews ?? '–'}</div><div class="l">Client reviews</div></div>
      <div class="stat"><div class="n">${st.counts.partners ?? '–'}</div><div class="l">Partner logos</div></div>
      <div class="stat"><div class="n">${pct}%</div><div class="l">Storage used (${mb(st.sizeBytes)} / ${mb(st.maxBytes)} MB)</div></div>
    </div>
    <div class="card"><div class="card-head"><div><h3>Quick actions</h3><p>Jump straight to what you need.</p></div></div>
      <div class="quick">
        <a data-go="studio"><span class="ic">${ic('palette')}</span><div><b>Design Studio</b><span>Colors, fonts, layout — live</span></div></a>
        <a data-go="hero"><span class="ic">${ic('layout')}</span><div><b>Edit hero</b><span>Headline, stats, background</span></div></a>
        <a data-go="services"><span class="ic">${ic('briefcase')}</span><div><b>Manage services</b><span>Add, edit, reorder</span></div></a>
        <a data-go="reviews"><span class="ic">${ic('message')}</span><div><b>Client reviews</b><span>Testimonials & ratings</span></div></a>
        <a data-go="backup"><span class="ic">${ic('database')}</span><div><b>Backup</b><span>Download or restore</span></div></a>
      </div></div>
    <div class="card"><div class="card-head"><div><h3>Storage</h3><p>All content and images live in one cloud document (${esc(st.storage || 'database')}).</p></div></div>
      <div class="meter ${pct >= 70 ? 'warn' : ''}"><i style="width:${pct}%"></i></div></div>
    <div class="card"><div class="card-head"><div><h3>Health check</h3></div></div>
      ${tips.length ? tips.map(t => `<div class="tip">${ic(t[0])}<div style="flex:1">${esc(t[1])}</div>${t[2] ? `<button class="btn sm" data-go="${t[2]}">${t[3]}</button>` : ''}</div>`).join('') : `<div class="tip ok">${ic('check')}<div>Everything looks good. Your content is backed up automatically before every save.</div></div>`}
    </div>`;
  $$('[data-go]', v).forEach(a => a.onclick = () => go(a.dataset.go));
};

/* ------------------------------ shared form helpers ------------------------------ */
const fld = (id, label, val, o) => {
  o = o || {};
  const hint = o.hint ? `<span class="hint">${esc(o.hint)}</span>` : '';
  const ctl = o.area
    ? `<textarea class="inp" id="${id}" rows="${o.rows || 4}" placeholder="${esc(o.ph || '')}">${esc(val)}</textarea>`
    : `<input class="inp" id="${id}" type="${o.type || 'text'}" value="${esc(val)}" placeholder="${esc(o.ph || '')}" ${o.max ? `maxlength="${o.max}"` : ''} autocomplete="off">`;
  return `<div class="field"><label for="${id}">${esc(label)}${hint}</label>${ctl}</div>`;
};
const val = id => ($('#' + id) ? $('#' + id).value.trim() : '');
const intro = (t, p) => `<div class="page-intro"><h2>${t}</h2><p>${p}</p></div>`;
async function refreshData() {
  const dirty = isDirty(), keep = S.design;
  const res = await fetch('/api/site-data', { cache: 'no-store' });
  S.data = await res.json();
  S.saved = JSON.stringify(clone(S.data.design));
  S.design = dirty ? keep : clone(S.data.design);
  S.stats = await api('GET', '/api/admin/stats').catch(() => S.stats);
  $('#sbName').textContent = nameOf();
}
function bindChips(root, id, initial) {
  let items = (initial || []).slice();
  const box = $('#' + id, root), input = $('input', box);
  const draw = () => { $$('.chip', box).forEach(c => c.remove()); items.forEach((t, i) => { const c = document.createElement('span'); c.className = 'chip'; c.innerHTML = `${esc(t)}<button type="button" aria-label="Remove">&times;</button>`; $('button', c).onclick = () => { items.splice(i, 1); draw(); }; box.insertBefore(c, input); }); };
  const add = () => { const t = input.value.replace(/,/g, ' ').trim(); if (t) { items.push(t); input.value = ''; draw(); } };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !input.value && items.length) { items.pop(); draw(); } });
  input.addEventListener('blur', add);
  box.addEventListener('click', () => input.focus());
  draw();
  return () => { add(); return items.slice(); };
}
const chipsBox = (id, label, hint) => `<div class="field"><label>${esc(label)}<span class="hint">${esc(hint || '')}</span></label><div class="chips-input" id="${id}"><input placeholder="Type and press Enter…"></div></div>`;
async function reorder(col, idx, dir) {
  const list = (D()[col] || []).map(x => x.id), j = idx + dir;
  if (j < 0 || j >= list.length) return;
  [list[idx], list[j]] = [list[j], list[idx]];
  await api('PUT', '/api/admin/reorder/' + col, { ids: list });
  await refreshData(); route();
}

/* ------------------------------ hero ------------------------------ */
VIEWS.hero = v => {
  const h = D().hero || {};
  S.imgs = {};
  const stats = [1, 2, 3, 4].map(i => `<div class="card" style="padding:1rem;background:var(--panel2)"><div class="lbl" style="margin-bottom:.6rem">Stat ${i}</div><div class="stack">${fld('hs' + i + 'n', 'Number', h['stat' + i + 'Num'], { max: 14 })}${fld('hs' + i + 'l', 'Label', h['stat' + i + 'Label'], { max: 60 })}</div></div>`).join('');
  v.innerHTML = intro('Hero & Stats', 'The first screen visitors see. Tip: an empty field keeps its previous value.') + `
    <div class="card"><div class="card-head"><div><h3>Headline & call-to-action</h3></div></div><div class="stack">
      ${fld('hHead', 'Headline', h.headline, { area: 1, rows: 3, hint: 'Enter = new line' })}
      ${fld('hSum', 'Summary text', h.summaryText, { area: 1, rows: 2 })}
      <div class="grid2">${fld('hCta', 'Button text', h.ctaText)}${fld('hLink', 'Button link', h.ctaLink, { ph: '#services or https://…' })}</div></div></div>
    <div class="card"><div class="card-head"><div><h3>Achievement stats</h3><p>Four highlights shown at the bottom of the first screen. Icons can be changed in Design Studio → Hero.</p></div></div><div class="grid2">${stats}</div></div>
    <div class="card"><div class="card-head"><div><h3>Background image</h3></div></div>${dropHtml('heroBg', 'Hero background', h.bgImage, 'Wide photo works best')}</div>
    <div class="savebar"><button class="btn primary" id="saveHero">${ic('check')} Save hero</button></div>`;
  bindDrops(v, IMG_MAX, (id, url) => { S.imgs[id] = url; });
  $('#saveHero').onclick = e => act(e.currentTarget, async () => {
    const b = { headline: $('#hHead').value, summaryText: val('hSum'), ctaText: val('hCta'), ctaLink: val('hLink') };
    [1, 2, 3, 4].forEach(i => { b['stat' + i + 'Num'] = val('hs' + i + 'n'); b['stat' + i + 'Label'] = val('hs' + i + 'l'); });
    if (S.imgs.heroBg) b.bgImageBase64 = S.imgs.heroBg;
    await api('PUT', '/api/admin/hero', b); S.imgs = {}; await refreshData();
  }, 'Hero saved');
};

/* ------------------------------ about ------------------------------ */
VIEWS.about = v => {
  const a = D().about || {};
  S.imgs = {};
  v.innerHTML = intro('About', 'Tell your story and show your portrait.') + `
    <div class="card"><div class="stack">${fld('aTitle', 'Section title', a.title)}${fld('aLead', 'Lead text', a.leadText, { area: 1, rows: 2, hint: 'Short, bold intro line' })}${fld('aBio', 'Detailed bio', a.bio, { area: 1, rows: 8 })}</div></div>
    <div class="card">${dropHtml('aboutImg', 'Portrait photo', a.image, 'Portrait orientation works best')}</div>
    <div class="savebar"><button class="btn primary" id="saveAbout">${ic('check')} Save about</button></div>`;
  bindDrops(v, IMG_MAX, (id, url) => { S.imgs[id] = url; });
  $('#saveAbout').onclick = e => act(e.currentTarget, async () => {
    const b = { title: val('aTitle'), leadText: val('aLead'), bio: $('#aBio').value };
    if (S.imgs.aboutImg) b.imageBase64 = S.imgs.aboutImg;
    await api('PUT', '/api/admin/about', b); S.imgs = {}; await refreshData();
  }, 'About section saved');
};

/* ------------------------------ services ------------------------------ */
function serviceModal(srv, idx) {
  const edit = !!srv; srv = srv || {};
  let getFeatures;
  modal({
    title: edit ? 'Edit service' : 'Add service', okText: edit ? 'Save changes' : 'Add service',
    body: `<div class="stack">${fld('sTitle', 'Title', srv.title, { ph: 'e.g. 1:1 Brand Strategy' })}${fld('sCat', 'Category label', srv.category, { ph: 'Strategic Program' })}${fld('sShort', 'Short description', srv.shortDesc, { area: 1, rows: 2, hint: 'Shown on the card' })}${fld('sFull', 'Full details', srv.fullDetails, { area: 1, rows: 5, hint: 'Shown in the details popup' })}${chipsBox('sFeat', 'Key features', 'Enter after each one')}</div>`,
    onOpen: w => { getFeatures = bindChips(w, 'sFeat', srv.features); },
    onOk: async () => {
      const b = { title: val('sTitle'), category: val('sCat'), shortDesc: val('sShort'), fullDetails: $('#sFull').value, features: getFeatures().join(',') };
      if (!b.title) throw new Error('Please enter a title.');
      if (edit) await api('PUT', '/api/admin/services/' + srv.id, b); else await api('POST', '/api/admin/services', b);
      await refreshData(); route(); toast(edit ? 'Service updated' : 'Service added');
    }
  });
}
VIEWS.services = v => {
  const list = D().services || [];
  $('#topActions').innerHTML = `<button class="btn primary" id="addSvc">${ic('plus')} Add service</button>`;
  $('#addSvc').onclick = () => serviceModal();
  v.innerHTML = intro('Services', 'Programs shown in the "Personal Branding Services" section. Use the arrows to reorder.') +
    (list.length ? `<div class="items">${list.map((s, i) => `<div class="item"><div class="body"><span class="tag">${esc(s.category || 'Strategic Program')}</span><b>${esc(s.title)}</b><span>${esc(s.shortDesc)}</span></div>
      <div class="acts"><button class="icon-btn" data-mv="${i}" data-d="-1" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${ic('up')}</button><button class="icon-btn" data-mv="${i}" data-d="1" aria-label="Move down" ${i === list.length - 1 ? 'disabled style="opacity:.3"' : ''}>${ic('down')}</button>
      <button class="icon-btn" data-edit="${i}" aria-label="Edit">${ic('edit')}</button><button class="icon-btn bad" data-del="${i}" aria-label="Delete">${ic('trash')}</button></div></div>`).join('')}</div>`
      : `<div class="empty"><b>No services yet</b>Add your first program to show it on the website.</div>`);
  $$('[data-mv]', v).forEach(b => b.onclick = () => act(null, () => reorder('services', +b.dataset.mv, +b.dataset.d)));
  $$('[data-edit]', v).forEach(b => b.onclick = () => serviceModal(list[+b.dataset.edit]));
  $$('[data-del]', v).forEach(b => b.onclick = async () => {
    const s = list[+b.dataset.del];
    if (await confirmBox(`Delete "${s.title}"? A snapshot is saved automatically so you can restore it from Backup.`, 'Delete')) await act(null, async () => { await api('DELETE', '/api/admin/services/' + s.id); await refreshData(); route(); }, 'Service deleted');
  });
};

/* ------------------------------ reviews ------------------------------ */
function reviewModal(r) {
  const edit = !!r; r = r || {}; let rating = Number(r.rating) || 5;
  const stars = () => [1, 2, 3, 4, 5].map(i => `<button type="button" data-star="${i}" class="${i <= rating ? 'on' : ''}" aria-label="${i} star">★</button>`).join('');
  modal({
    title: edit ? 'Edit review' : 'Add review', okText: edit ? 'Save changes' : 'Add review',
    body: `<div class="stack"><div class="grid2">${fld('rName', 'Client name', r.name)}${fld('rRole', 'Role / company', r.role)}</div><div class="field"><label>Rating</label><div class="star-pick" id="rStars">${stars()}</div></div>${fld('rText', 'Testimonial', r.comment, { area: 1, rows: 5 })}</div>`,
    onOpen: w => { const box = $('#rStars', w); box.onclick = e => { const b = e.target.closest('[data-star]'); if (!b) return; rating = +b.dataset.star; box.innerHTML = stars(); }; },
    onOk: async () => {
      const b = { name: val('rName'), role: val('rRole'), rating, comment: $('#rText').value.trim() };
      if (!b.name) throw new Error('Please enter the client name.');
      if (edit) await api('PUT', '/api/admin/reviews/' + r.id, b); else await api('POST', '/api/admin/reviews', b);
      await refreshData(); route(); toast(edit ? 'Review updated' : 'Review added');
    }
  });
}
VIEWS.reviews = v => {
  const list = D().reviews || [];
  $('#topActions').innerHTML = `<button class="btn primary" id="addRv">${ic('plus')} Add review</button>`;
  $('#addRv').onclick = () => reviewModal();
  v.innerHTML = intro('Client Reviews', 'Testimonials shown in the "What My Clients Are Saying" section. Card colors and fonts are in Design Studio → Review cards.') +
    (list.length ? `<div class="items">${list.map((r, i) => `<div class="item"><div class="body"><span class="stars-sm">${'★'.repeat(Math.max(0, Math.min(5, Number(r.rating) || 5)))}</span><b>${esc(r.name)} <span style="font-weight:400;color:var(--dim)">· ${esc(r.role)}</span></b><span>${esc(r.comment)}</span></div>
      <div class="acts"><button class="icon-btn" data-mv="${i}" data-d="-1" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${ic('up')}</button><button class="icon-btn" data-mv="${i}" data-d="1" aria-label="Move down" ${i === list.length - 1 ? 'disabled style="opacity:.3"' : ''}>${ic('down')}</button>
      <button class="icon-btn" data-edit="${i}" aria-label="Edit">${ic('edit')}</button><button class="icon-btn bad" data-del="${i}" aria-label="Delete">${ic('trash')}</button></div></div>`).join('')}</div>`
      : `<div class="empty"><b>No reviews yet</b>Add a testimonial to build trust with visitors.</div>`);
  $$('[data-mv]', v).forEach(b => b.onclick = () => act(null, () => reorder('reviews', +b.dataset.mv, +b.dataset.d)));
  $$('[data-edit]', v).forEach(b => b.onclick = () => reviewModal(list[+b.dataset.edit]));
  $$('[data-del]', v).forEach(b => b.onclick = async () => {
    const r = list[+b.dataset.del];
    if (await confirmBox(`Delete the review from "${r.name}"?`, 'Delete')) await act(null, async () => { await api('DELETE', '/api/admin/reviews/' + r.id); await refreshData(); route(); }, 'Review deleted');
  });
};

/* ------------------------------ partners ------------------------------ */
VIEWS.partners = v => {
  const list = D().partners || [];
  S.imgs = {};
  v.innerHTML = intro('Partners', 'Logos and names of brands that trust you ("Featured In & Trusted By").') + `
    <div class="card"><div class="card-head"><div><h3>Add a partner</h3></div></div><div class="grid2" style="align-items:end">${fld('pName', 'Partner name', '', { ph: 'e.g. Walton' })}${dropHtml('partnerLogo', 'Logo (optional)', '', 'Transparent PNG/SVG looks best')}</div>
      <div class="savebar" style="border:0;margin-top:1rem;padding:0"><button class="btn primary" id="addPartner">${ic('plus')} Add partner</button></div></div>
    <div class="card" style="margin-top:1.2rem"><div class="card-head"><div><h3>Current partners</h3></div></div>${list.length ? `<div class="partner-grid">${list.map((p, i) => `<div class="pcard"><div class="logo">${p.logo ? `<img src="${esc(p.logo)}" alt="">` : `<span style="color:var(--dim)">${ic('award')}</span>`}</div><b>${esc(p.name)}</b>
      <div class="acts"><button class="icon-btn" data-mv="${i}" data-d="-1" aria-label="Move left" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${ic('left')}</button><button class="icon-btn" data-mv="${i}" data-d="1" aria-label="Move right" ${i === list.length - 1 ? 'disabled style="opacity:.3"' : ''}>${ic('right')}</button><button class="icon-btn bad" data-del="${i}" aria-label="Delete">${ic('trash')}</button></div></div>`).join('')}</div>` : `<div class="empty"><b>No partners yet</b>Add your first logo above.</div>`}</div>`;
  bindDrops(v, IMG_MAX, (id, url) => { S.imgs[id] = url; });
  $('#addPartner').onclick = e => act(e.currentTarget, async () => {
    const name = val('pName'); if (!name) throw new Error('Please enter the partner name.');
    await api('POST', '/api/admin/partners', { name, logoBase64: S.imgs.partnerLogo || '' }); S.imgs = {}; await refreshData(); route();
  }, 'Partner added');
  $$('[data-mv]', v).forEach(b => b.onclick = () => act(null, () => reorder('partners', +b.dataset.mv, +b.dataset.d)));
  $$('[data-del]', v).forEach(b => b.onclick = async () => {
    const p = list[+b.dataset.del];
    if (await confirmBox(`Remove "${p.name}" from partners?`, 'Remove')) await act(null, async () => { await api('DELETE', '/api/admin/partners/' + p.id); await refreshData(); route(); }, 'Partner removed');
  });
};

/* ------------------------------ brand & contact ------------------------------ */
VIEWS.brand = v => {
  const s = D().settings || {};
  S.imgs = {};
  v.innerHTML = intro('Brand & Contact', 'Your name, logo, booking link and footer details.') + `
    <div class="card"><div class="card-head"><div><h3>Brand</h3></div></div><div class="stack">${fld('bName', 'Site / brand name', s.siteName)}${dropHtml('logo', 'Logo', s.logoImage, 'Shown in the menu next to the name')}${fld('bCal', 'Booking link (Calendly)', s.calendlyUrl, { ph: 'https://calendly.com/your-name', hint: 'Used by every "Book" button' })}</div></div>
    <div class="card"><div class="card-head"><div><h3>Contact & footer</h3></div></div><div class="stack"><div class="grid2">${fld('bPhone', 'Phone', s.phone)}${fld('bEmail', 'Email', s.email, { type: 'email' })}</div>${fld('bAddr', 'Address', s.address)}${fld('bFoot', 'Footer bio', s.footerBio, { area: 1, rows: 3 })}${fld('bCopy', 'Copyright text', s.copyright)}</div></div>
    <div class="savebar"><button class="btn primary" id="saveBrand">${ic('check')} Save settings</button></div>`;
  bindDrops(v, IMG_MAX, (id, url) => { S.imgs[id] = url; });
  $('#saveBrand').onclick = e => act(e.currentTarget, async () => {
    const b = { siteName: val('bName'), calendlyUrl: val('bCal'), phone: val('bPhone'), email: val('bEmail'), address: val('bAddr'), footerBio: val('bFoot'), copyright: val('bCopy') };
    if (S.imgs.logo) b.logoBase64 = S.imgs.logo;
    await api('PUT', '/api/admin/settings', b); S.imgs = {}; await refreshData();
  }, 'Settings saved');
};

/* ------------------------------ security ------------------------------ */
VIEWS.security = v => {
  v.innerHTML = intro('Security', 'Change the password you use to sign in here.') + `
    <div class="card" style="max-width:560px"><div class="stack">${fld('pw1', 'New password', '', { type: 'password', hint: 'At least 8 characters' })}<div class="pw-meter"><i id="pwBar"></i></div>${fld('pw2', 'Confirm new password', '', { type: 'password' })}</div>
      <div class="savebar"><button class="btn primary" id="savePw">${ic('lock')} Update password</button></div></div>
    <div class="tip ok" style="max-width:560px;margin-top:1.2rem">${ic('check')}<div>Passwords are stored as a salted hash. Admin sessions expire automatically after 12 hours.</div></div>`;
  $('#pw1').oninput = e => { const p = e.target.value; let sc = 0; if (p.length >= 8) sc++; if (p.length >= 12) sc++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) sc++; if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) sc++; const b = $('#pwBar'); b.style.width = (sc * 25) + '%'; b.style.background = ['#f87171', '#f87171', '#fbbf24', '#34d399', '#34d399'][sc]; };
  $('#savePw').onclick = e => act(e.currentTarget, async () => {
    const a = $('#pw1').value, b = $('#pw2').value;
    if (a.length < 8) throw new Error('Password must be at least 8 characters.');
    if (a !== b) throw new Error('The two passwords do not match.');
    await api('PUT', '/api/admin/settings', { newPassword: a }); $('#pw1').value = ''; $('#pw2').value = ''; await refreshData();
  }, 'Password updated');
};

/* ------------------------------ backup & restore ------------------------------ */
const REASON = { design: 'Design change', hero: 'Hero edit', about: 'About edit', settings: 'Settings edit', theme: 'Theme edit', 'partner-add': 'Partner added', 'partner-delete': 'Partner removed', 'service-add': 'Service added', 'service-edit': 'Service edited', 'service-delete': 'Service deleted', 'review-add': 'Review added', 'review-edit': 'Review edited', 'review-delete': 'Review deleted', 'before-restore-from-file': 'Before file restore', 'before-restore-snapshot': 'Before snapshot restore' };
VIEWS.backup = async v => {
  v.innerHTML = intro('Backup & Restore', 'Your safety net. A snapshot is taken automatically before every change.') + `
    <div class="grid2" style="align-items:start">
      <div class="card"><div class="card-head"><div><h3>Download a full backup</h3><p>One .json file with all text, settings and images. Keep it somewhere safe.</p></div></div><button class="btn primary" id="dlBk">${ic('download')} Download backup</button></div>
      <div class="card" style="margin-top:0"><div class="card-head"><div><h3>Restore from a file</h3><p>Replaces everything with the file's content. Your current content is snapshotted first.</p></div></div><label class="btn" style="cursor:pointer">${ic('upload')} Choose backup file<input type="file" id="rsFile" accept=".json,application/json" hidden></label></div>
    </div>
    <div class="card" style="margin-top:1.2rem"><div class="card-head"><div><h3>Automatic snapshots</h3><p>The latest 10 are kept.</p></div></div><div class="bk-list" id="bkList"><p class="hint">Loading…</p></div></div>`;
  $('#dlBk').onclick = e => act(e.currentTarget, async () => {
    const res = await api('GET', '/api/admin/backup', undefined, true), blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'site-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'Backup downloaded');
  $('#rsFile').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    let data; try { data = JSON.parse(await f.text()); } catch (x) { return toast('That file is not valid JSON. Nothing was changed.', 'err'); }
    if (!(await confirmBox(`Replace ALL current content with "${f.name}"? A snapshot of the current content is saved first.`, 'Restore', false))) return;
    await act(null, async () => { await api('POST', '/api/admin/restore', data); await refreshData(); route(); }, 'Backup restored');
  };
  try {
    const { backups } = await api('GET', '/api/admin/backups');
    $('#bkList').innerHTML = backups.length ? backups.map(b => `<div class="item"><div class="body"><b>${new Date(b.createdAt).toLocaleString()}</b><span>${esc(REASON[b.reason] || b.reason || 'Update')} · ${(b.sizeBytes / 1048576).toFixed(2)} MB</span></div><button class="btn sm" data-rs="${esc(b.id)}">${ic('undo')} Restore</button></div>`).join('') : '<div class="empty"><b>No snapshots yet</b>One is created automatically before each save.</div>';
    $$('[data-rs]', v).forEach(b => b.onclick = async () => {
      if (!(await confirmBox('Restore the site to this snapshot? Your current content is saved as a new snapshot first.', 'Restore', false))) return;
      await act(null, async () => { await api('POST', '/api/admin/backups/' + b.dataset.rs + '/restore'); await refreshData(); route(); }, 'Snapshot restored');
    });
  } catch (e) { $('#bkList').innerHTML = `<p class="hint">${esc(e.message)}</p>`; }
};

/* =====================================================================
   DESIGN STUDIO — WordPress-Customizer-style editing with live preview
   ===================================================================== */
const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
function pruneEmpty(o) {
  Object.keys(o).forEach(k => { const v = o[k]; if (v && typeof v === 'object' && !Array.isArray(v)) { pruneEmpty(v); if (!Object.keys(v).length) delete o[k]; } });
}
function setP(o, p, v) {
  const ks = p.split('.'), last = ks.pop();
  let cur = o;
  ks.forEach(k => { if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}; cur = cur[k]; });
  if (v === '' || v === undefined || v === null || (typeof v === 'number' && isNaN(v))) delete cur[last]; else cur[last] = v;
  pruneEmpty(o);
}
function legacy(p) {
  const t = D().theme || {};
  switch (p) {
    case 'global.primary': return t.primaryColor;
    case 'global.accent': return t.accentColor;
    case 'global.bgDark': return t.bgDark;
    case 'global.bgLight': return t.bgLight;
    case 'global.fontBody': { const m = /['"]?([^'",]+)/.exec(t.fontFamily || ''); return m ? m[1].trim() : undefined; }
    case 'global.baseSize': return parseInt(t.fontSizeBase, 10) || undefined;
    case 'global.headingWeight': return t.headlineWeight ? Number(t.headlineWeight) : undefined;
  }
  return undefined;
}
const to6 = h => { h = String(h || '').trim(); if (/^#[0-9a-f]{3}$/i.test(h)) return '#' + h.slice(1).split('').map(c => c + c).join(''); return /^#[0-9a-f]{6}$/i.test(h) ? h : '#000000'; };

/* ---- field renderer ---- */
function rf(f) {
  const cur = getP(S.design, f.p), lg = legacy(f.p);
  const shown = cur !== undefined ? cur : (lg !== undefined ? lg : f.d);
  const rs = `<button type="button" class="reset" data-reset="${f.p}" title="Back to default">Reset</button>`;
  const lab = `<label>${esc(f.l)}${rs}</label>`;
  switch (f.k) {
    case 'color':
      return `<div class="field">${lab}<div class="color"><input type="color" data-p="${f.p}" data-c="sw" value="${to6(cur || lg || f.d)}" aria-label="${esc(f.l)}"><input class="inp" data-p="${f.p}" data-c="hex" value="${esc(cur || '')}" placeholder="${esc(lg || f.d || 'default')}" maxlength="9" spellcheck="false"></div></div>`;
    case 'select':
      return `<div class="field">${lab}<select class="inp" data-p="${f.p}" data-c="sel" data-t="${f.t || 's'}">${f.o.map(o => `<option value="${esc(o[0])}" ${String(cur === undefined ? (lg !== undefined ? lg : '') : cur) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>`;
    case 'font': {
      const cats = ['Sans', 'Serif', 'Bangla'], sel = cur !== undefined ? cur : (lg || '');
      return `<div class="field">${lab}<select class="inp" data-p="${f.p}" data-c="sel" data-t="s"><option value="">Default</option>${cats.map(c => `<optgroup label="${c === 'Bangla' ? 'Bangla-friendly' : c}">${window.FONT_CATALOG.filter(x => x.cat === c).map(x => `<option value="${esc(x.name)}" ${sel === x.name ? 'selected' : ''} style="font-family:'${esc(x.name)}'">${esc(x.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
    }
    case 'range':
      return `<div class="field">${lab}<div class="range"><input type="range" data-p="${f.p}" data-c="rng" data-u="${f.u || ''}" min="${f.min}" max="${f.max}" step="${f.s || 1}" value="${shown !== undefined ? shown : f.min}"><output>${cur !== undefined ? cur + (f.u || '') : (lg !== undefined ? lg + (f.u || '') : 'Default')}</output></div></div>`;
    case 'toggle': {
      const on = cur !== undefined ? cur : f.d;
      return `<div class="row-switch"><div class="t">${esc(f.l)}${f.h ? `<small>${esc(f.h)}</small>` : ''}</div><label class="switch"><input type="checkbox" data-p="${f.p}" data-c="tog" ${on ? 'checked' : ''} aria-label="${esc(f.l)}"><i></i></label></div>`;
    }
    case 'seg':
      return `<div class="field">${lab}<div class="seg">${f.o.map(o => `<button type="button" data-seg data-p="${f.p}" data-v="${esc(o[0])}" class="${String(cur) === String(o[0]) ? 'on' : ''}">${esc(o[1])}</button>`).join('')}</div></div>`;
    case 'text':
      return `<div class="field">${lab}<input class="inp" data-p="${f.p}" data-c="txt" value="${esc(cur || '')}" placeholder="${esc(f.d || '')}" maxlength="${f.max || 160}" autocomplete="off"></div>`;
    case 'img':
      return dropHtml('st:' + f.p, f.l, cur, f.h, true);
  }
  return '';
}
const WEIGHTS = [['', 'Default'], ['300', 'Light 300'], ['400', 'Regular 400'], ['500', 'Medium 500'], ['600', 'Semibold 600'], ['700', 'Bold 700'], ['800', 'Extra bold 800'], ['900', 'Black 900']];
function typo(key) {
  const b = 'elements.' + key.replace(/\./g, '_') + '.';
  return `<div class="grid2">${rf({ k: 'font', p: b + 'fontFamily', l: 'Font' })}${rf({ k: 'select', p: b + 'fontWeight', l: 'Weight', o: WEIGHTS, t: 'n' })}</div>
    ${rf({ k: 'range', p: b + 'fontSize', l: 'Font size', min: 10, max: 96, u: 'px' })}
    ${rf({ k: 'color', p: b + 'color', l: 'Text color' })}
    ${rf({ k: 'seg', p: b + 'textAlign', l: 'Alignment', o: [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] })}
    <div class="grid2">${rf({ k: 'range', p: b + 'letterSpacing', l: 'Letter spacing', min: -2, max: 10, s: 0.5, u: 'px' })}${rf({ k: 'range', p: b + 'lineHeight', l: 'Line height', min: 1, max: 2.6, s: 0.05 })}</div>
    <div class="grid2">${rf({ k: 'select', p: b + 'textTransform', l: 'Letter case', o: [['', 'Default'], ['none', 'Normal'], ['uppercase', 'UPPERCASE'], ['capitalize', 'Capitalize'], ['lowercase', 'lowercase']] })}${rf({ k: 'seg', p: b + 'fontStyle', l: 'Style', o: [['normal', 'Normal'], ['italic', 'Italic']] })}</div>`;
}
const grp = (id, icon, title, inner) => `<details class="grp" data-grp="${id}" ${S.open.has(id) ? 'open' : ''}><summary><span class="ic">${ic(icon)}</span>${title}<span class="chev">${ic('chev')}</span></summary><div class="gb">${inner}</div></details>`;
const subgrp = (id, title, inner, custom) => `<details class="sub-grp" data-grp="${id}" ${S.open.has(id) ? 'open' : ''}><summary><span>${title}</span>${custom ? '<span class="badge">customised</span>' : ''}</summary><div class="gb">${inner}</div></details>`;
const typoGrp = (key, title) => subgrp('ty-' + key, title, typo(key), !!getP(S.design, 'elements.' + key.replace(/\./g, '_')));
S.open = new Set(['colors']);

const DEF_ORDER = { partners: 1, about: 2, services: 3, reviews: 4 };
const SEC_LABEL = { partners: 'Partners', about: 'About', services: 'Services', reviews: 'Client reviews' };
const TXT = [['navCta', 'Menu button', 'Book a Consultation'], ['navAbout', 'Menu: About', 'About'], ['navServices', 'Menu: Services', 'Services'], ['navReviews', 'Menu: Success Stories', 'Success Stories'],
  ['partnersTitle', 'Partners heading', 'Featured In & Trusted By Leaders From'], ['aboutTag', 'About tag', 'Personal Branding Coach'], ['aboutCta', 'About button', 'Schedule 1:1 Intro Call →'],
  ['servicesTag', 'Services tag', 'Tailored Programs'], ['servicesTitle', 'Services title', 'Personal Branding Services'], ['servicesSub', 'Services subtitle', 'Tap any service to see its full deliverables and scope.'],
  ['serviceMore', 'Service card link', 'View details'], ['serviceCta', 'Service details button', 'Inquire About This Program →'],
  ['reviewsTag', 'Reviews tag', 'Testimonials'], ['reviewsTitle', 'Reviews title', 'What My Clients Are Saying'], ['reviewsSub', 'Reviews subtitle', 'Real business ROI achieved through structured personal authority architecture.'],
  ['footerContactTitle', 'Footer: contact heading', 'Direct Contact'], ['footerLinksTitle', 'Footer: links heading', 'Quick Links']];

const optCard = (p, v, title, desc, svg, rec, def) => {
  const cur = getP(S.design, p); const on = cur === v || (cur === undefined && def === v);
  return `<button type="button" class="opt ${on ? 'on' : ''}" data-opt data-p="${p}" data-v="${v}"><span class="pv">${svg}</span><span><b>${title}${rec ? '<em class="rec">Recommended</em>' : ''}</b><span>${desc}</span></span></button>`;
};
const PV = {
  modal: '<svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#7c83ff" stroke-width="1.5"><rect x="2" y="3" width="14" height="10" rx="2"/><rect x="2" y="17" width="14" height="10" rx="2"/><rect x="22" y="6" width="16" height="18" rx="3" fill="rgba(124,131,255,.2)"/></svg>',
  hover: '<svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#7c83ff" stroke-width="1.5"><rect x="2" y="3" width="17" height="24" rx="2"/><rect x="21" y="3" width="17" height="24" rx="2" fill="rgba(124,131,255,.2)"/><path d="M26 12h8M26 17h6"/></svg>',
  expand: '<svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#7c83ff" stroke-width="1.5"><rect x="2" y="3" width="17" height="8" rx="2"/><rect x="21" y="3" width="17" height="20" rx="2" fill="rgba(124,131,255,.2)"/><path d="M25 16h9"/></svg>',
  masonry: '<svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#7c83ff" stroke-width="1.5"><rect x="2" y="3" width="11" height="12" rx="2"/><rect x="2" y="18" width="11" height="9" rx="2"/><rect x="15" y="3" width="11" height="8" rx="2"/><rect x="15" y="14" width="11" height="13" rx="2"/><rect x="28" y="3" width="10" height="14" rx="2"/></svg>',
  grid: '<svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#7c83ff" stroke-width="1.5"><rect x="2" y="4" width="11" height="22" rx="2"/><rect x="15" y="4" width="11" height="22" rx="2"/><rect x="28" y="4" width="10" height="22" rx="2"/></svg>',
  slider: '<svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#7c83ff" stroke-width="1.5"><rect x="6" y="5" width="22" height="20" rx="3" fill="rgba(124,131,255,.2)"/><rect x="31" y="5" width="9" height="20" rx="3"/><path d="M2 15l2-2m-2 2l2 2"/></svg>'
};

function buildStudio() {
  const secOrder = Object.keys(DEF_ORDER).sort((a, b) => ((getP(S.design, `sections.${a}.order`) ?? DEF_ORDER[a]) - (getP(S.design, `sections.${b}.order`) ?? DEF_ORDER[b])));
  const C = (p, l, d) => rf({ k: 'color', p, l, d });
  const out = [];

  out.push(grp('colors', 'palette', 'Colors', `
    <div class="grid2">${C('global.primary', 'Primary (buttons, links)', '#6366f1')}${C('global.accent', 'Accent', '#8b5cf6')}</div>
    <div class="lbl">Dark mode</div><div class="grid2">${C('global.bgDark', 'Page background', '#080c14')}${C('global.cardDark', 'Card background', '#111827')}${C('global.textDark', 'Text', '#f9fafb')}${C('global.mutedDark', 'Muted text', '#9ca3af')}</div>
    <div class="lbl">Light mode</div><div class="grid2">${C('global.bgLight', 'Page background', '#f8fafc')}${C('global.cardLight', 'Card background', '#ffffff')}${C('global.textLight', 'Text', '#0f172a')}${C('global.mutedLight', 'Muted text', '#64748b')}</div>`));

  out.push(grp('fonts', 'type', 'Fonts & text size', `
    <div class="grid2">${rf({ k: 'font', p: 'global.fontHeading', l: 'Heading font' })}${rf({ k: 'font', p: 'global.fontBody', l: 'Body font' })}</div>
    ${rf({ k: 'range', p: 'global.baseSize', l: 'Base text size', min: 13, max: 20, u: 'px', d: 16 })}
    ${rf({ k: 'select', p: 'global.headingWeight', l: 'Heading boldness', o: WEIGHTS, t: 'n' })}
    <p class="hint">Bangla-friendly fonts are listed under their own group. Fine-tune any single text under "Text styles".</p>`));

  out.push(grp('shape', 'grid', 'Shape & layout', `
    ${rf({ k: 'range', p: 'global.radius', l: 'Card corner radius', min: 0, max: 40, u: 'px', d: 24 })}
    ${rf({ k: 'seg', p: 'global.buttonShape', l: 'Button shape', o: [['pill', 'Pill'], ['rounded', 'Rounded'], ['square', 'Square']] })}
    ${rf({ k: 'range', p: 'global.container', l: 'Content width', min: 960, max: 1520, s: 20, u: 'px', d: 1260 })}`));

  out.push(grp('nav', 'compass', 'Navigation bar', `
    ${rf({ k: 'toggle', p: 'nav.sticky', l: 'Keep menu fixed while scrolling', d: false })}
    ${rf({ k: 'toggle', p: 'nav.showAdminLink', l: 'Show "Admin" link to visitors', h: 'Turn off to hide it from the public menu and footer', d: true })}
    ${typoGrp('nav.brand', 'Brand name style')}${typoGrp('nav.link', 'Menu link style')}
    <p class="hint">Menu texts are in "Section texts".</p>`));

  out.push(grp('hero', 'layout', 'Hero (first screen)', `
    ${rf({ k: 'select', p: 'hero.height', l: 'Height', o: [['', 'Full screen (default)'], ['tall', 'Tall — 85%'], ['medium', 'Medium — 70%'], ['compact', 'Compact — 55%'], ['auto', 'Fit content']] })}
    ${rf({ k: 'seg', p: 'hero.align', l: 'Text alignment', o: [['left', 'Left'], ['center', 'Center']] })}
    ${rf({ k: 'range', p: 'hero.overlay', l: 'Dark overlay strength', min: 0, max: 100, u: '%', d: 100 })}
    ${C('hero.overlayColor', 'Overlay color', '#000000')}
    ${rf({ k: 'toggle', p: 'hero.showStats', l: 'Show the stats bar', d: true })}
    <div class="lbl">Stat icons (emoji)</div><div class="grid4">${[0, 1, 2, 3].map(i => rf({ k: 'text', p: 'hero.icons.' + i, l: '#' + (i + 1), d: ['👤', '📈', '🤝', '📄'][i], max: 4 })).join('')}</div>
    ${typoGrp('hero.headline', 'Headline style')}${typoGrp('hero.summary', 'Summary text style')}${typoGrp('hero.cta', 'Button text style')}${typoGrp('hero.statNum', 'Stat number style')}${typoGrp('hero.statLabel', 'Stat label style')}`));

  out.push(grp('sections', 'layers', 'Sections — order, visibility, background', `
    <div><div class="lbl" style="margin-bottom:6px">Page order (below the hero)</div><div class="order-list">${secOrder.map((k, i) => `<div class="order-row"><b>${SEC_LABEL[k]}</b><button class="icon-btn" data-ord="${k}" data-d="-1" ${i === 0 ? 'disabled style="opacity:.3"' : ''} aria-label="Move up">${ic('up')}</button><button class="icon-btn" data-ord="${k}" data-d="1" ${i === secOrder.length - 1 ? 'disabled style="opacity:.3"' : ''} aria-label="Move down">${ic('down')}</button></div>`).join('')}</div></div>
    ${secOrder.map(k => { const b = `sections.${k}.`; return subgrp('sec-' + k, SEC_LABEL[k], `
      ${rf({ k: 'toggle', p: b + 'show', l: 'Show this section', d: true })}
      <div class="grid2">${C(b + 'bg', 'Background color', '')}${C(b + 'bg2', 'Gradient end color', '')}</div>
      ${rf({ k: 'range', p: b + 'bgAngle', l: 'Gradient angle', min: 0, max: 360, u: '°', d: 135 })}
      ${rf({ k: 'img', p: b + 'bgImage', l: 'Background image', h: 'optional' })}
      <div class="grid2">${rf({ k: 'range', p: b + 'bgOverlay', l: 'Image overlay', min: 0, max: 90, u: '%', d: 50 })}${C(b + 'bgOverlayColor', 'Overlay color', '#000000')}</div>
      <div class="grid2">${rf({ k: 'range', p: b + 'padTop', l: 'Space above', min: 0, max: 240, u: 'px', d: k === 'partners' ? 72 : 104 })}${rf({ k: 'range', p: b + 'padBottom', l: 'Space below', min: 0, max: 240, u: 'px', d: k === 'partners' ? 72 : 104 })}</div>
      ${rf({ k: 'seg', p: b + 'align', l: 'Text alignment', o: [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] })}`, !!getP(S.design, 'sections.' + k)); }).join('')}`));

  out.push(grp('services', 'briefcase', 'Services cards', `
    <div class="lbl">How should service details open?</div>
    <div class="opt-cards">${optCard('servicesLayout', 'modal', 'Card + details popup', 'Key features visible on the card; click opens a clean popup. Works great on phones.', PV.modal, true, 'modal')}${optCard('servicesLayout', 'hover', 'Hover reveal', 'Details slide over the card on hover. On touch screens a tap opens the popup.', PV.hover, false, 'modal')}${optCard('servicesLayout', 'expand', 'Expand in place', 'Card grows downward to show details. No popup.', PV.expand, false, 'modal')}</div>
    ${rf({ k: 'select', p: 'servicesColumns', l: 'Columns', o: [['', 'Automatic'], ['2', '2 columns'], ['3', '3 columns'], ['4', '4 columns']], t: 'n' })}
    ${typoGrp('service.category', 'Category label style')}${typoGrp('service.title', 'Service title style')}${typoGrp('service.desc', 'Description style')}`));

  out.push(grp('reviews', 'message', 'Review cards', `
    <div class="lbl">Layout</div>
    <div class="opt-cards">${optCard('reviews.layout', 'masonry', 'Masonry', 'Cards flow in columns with natural heights.', PV.masonry, false, 'masonry')}${optCard('reviews.layout', 'grid', 'Equal grid', 'Neat rows of equal-height cards.', PV.grid, false, 'masonry')}${optCard('reviews.layout', 'slider', 'Slider', 'Swipe or use arrows — compact and modern.', PV.slider, false, 'masonry')}</div>
    ${rf({ k: 'range', p: 'reviews.columns', l: 'Cards per row', min: 1, max: 4, d: 3 })}
    <div class="lbl">Card appearance</div>
    <div class="grid2">${C('reviews.cardBg', 'Card color', '')}${C('reviews.border', 'Border color', '')}</div>
    <div class="grid2">${rf({ k: 'range', p: 'reviews.radius', l: 'Corner radius', min: 0, max: 40, u: 'px', d: 20 })}${rf({ k: 'select', p: 'reviews.shadow', l: 'Shadow', o: [['', 'Default'], ['none', 'None'], ['soft', 'Soft'], ['medium', 'Medium'], ['glow', 'Glow outline']] })}</div>
    ${C('reviews.starColor', 'Star color', '#f59e0b')}
    <div class="lbl">Text (font, color, size)</div>
    ${typoGrp('review.quote', 'Review text')}${typoGrp('review.name', 'Client name')}${typoGrp('review.role', 'Client role')}`));

  out.push(grp('texts', 'edit', 'Section texts (headings & buttons)', TXT.map(t => rf({ k: 'text', p: 'texts.' + t[0], l: t[1], d: t[2], max: 200 })).join('')));

  out.push(grp('typo', 'type2', 'Text styles — everything else', [['section.tag', 'Section tags'], ['section.title', 'Section titles'], ['section.sub', 'Section subtitles'], ['partners.title', 'Partners heading'], ['about.lead', 'About lead text'], ['about.bio', 'About bio'], ['footer.name', 'Footer brand name'], ['footer.text', 'Footer text']].map(x => typoGrp(x[0], x[1])).join('')));
  return out.join('');
}

function fitPreview() {
  const st = $('#pvStage'), f = $('#pvFrame'), w = $('#pvWrap');
  if (!st || !f || !w) return;
  const W = { desktop: 1440, tablet: 820, mobile: 390 }[S.previewDevice] || 1440;
  const availW = Math.max(200, st.clientWidth - 32), availH = Math.max(200, st.clientHeight - 32);
  const sc = Math.min(1, availW / W);
  f.style.width = W + 'px'; f.style.height = Math.round(availH / sc) + 'px';
  f.style.transform = 'scale(' + sc + ')'; f.style.transformOrigin = 'top left';
  w.style.width = Math.round(W * sc) + 'px'; w.style.height = availH + 'px';
}
let pvTimer = null;
function pushPreview() {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(() => { const f = $('#pvFrame'); if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'bb-design', design: S.design }, location.origin); }, 40);
}
function studioChanged() {
  const d = isDirty();
  const sv = $('#stSave'); if (sv) sv.disabled = !d;
  const dc = $('#stDiscard'); if (dc) dc.disabled = !d;
  const link = $('#nav [data-route="studio"]');
  if (link) { const dot = $('.dot', link); if (d && !dot) link.insertAdjacentHTML('beforeend', '<i class="dot" title="Unsaved changes"></i>'); if (!d && dot) dot.remove(); }
  pushPreview();
}
function renderStudioControls() {
  const body = $('#stBody'); if (!body) return;
  const top = $('.st-panel').scrollTop;
  body.innerHTML = buildStudio();
  const dims = {}; Object.keys(DEF_ORDER).forEach(k => { dims[`st:sections.${k}.bgImage`] = 1920; });
  bindDrops(body, dims, (id, url) => { setP(S.design, id.slice(3), url); renderStudioControls(); studioChanged(); });
  $('.st-panel').scrollTop = top;
}
const SCROLL_TO = { hero: 'home', nav: 'home', services: 'services', reviews: 'reviews', 'sec-partners': 'partners', 'sec-about': 'about', 'sec-services': 'services', 'sec-reviews': 'reviews' };
function scrollPreview(id) { const f = $('#pvFrame'); if (f && f.contentWindow && id) f.contentWindow.postMessage({ type: 'bb-scroll', id }, location.origin); }

VIEWS.studio = v => {
  v.innerHTML = `<div class="studio show-controls" id="studio">
    <div class="studio-tabs"><button class="btn sm" data-tab="show-controls">${ic('sliders')} Controls</button><button class="btn sm" data-tab="show-preview">${ic('eye')} Preview</button></div>
    <div class="st-panel"><div class="st-head"><b>Customize</b><span class="sp"></span><button class="btn sm ghost" id="stDiscard" disabled>${ic('undo')} Discard</button><button class="btn sm primary" id="stSave" disabled>${ic('check')} Save & publish</button></div><div class="st-body" id="stBody"></div></div>
    <div class="st-prev"><div class="pv-bar"><b style="font-size:.84rem">Live preview</b><span class="sp"></span>
      <div class="seg" id="pvDev"><button data-dev="desktop" class="on" title="Desktop">${ic('monitor')}</button><button data-dev="tablet" title="Tablet">${ic('tablet')}</button><button data-dev="mobile" title="Mobile">${ic('phone')}</button></div>
      <a class="btn sm" href="/" target="_blank" rel="noopener">${ic('external')}</a></div>
      <div class="pv-stage" id="pvStage"><div class="pv-wrap" id="pvWrap"><iframe class="pv-frame" id="pvFrame" src="/?preview=1" title="Live website preview"></iframe></div></div></div></div>`;
  $('#topActions').innerHTML = `<button class="btn" id="stReset">${ic('undo')} Reset all to default</button>`;
  renderStudioControls();
  const panel = $('.st-panel'), studio = $('#studio'), frame = $('#pvFrame');
  frame.addEventListener('load', pushPreview);
  S.previewDevice = 'desktop';
  $('#pvDev').onclick = e => { const b = e.target.closest('[data-dev]'); if (!b) return; $$('#pvDev button').forEach(x => x.classList.toggle('on', x === b)); S.previewDevice = b.dataset.dev; fitPreview(); };
  if (window.ResizeObserver) { if (S.pvRO) S.pvRO.disconnect(); S.pvRO = new ResizeObserver(fitPreview); S.pvRO.observe($('#pvStage')); }
  window.addEventListener('resize', fitPreview);
  setTimeout(fitPreview, 0);
  $$('.studio-tabs [data-tab]').forEach(b => b.onclick = () => { studio.classList.remove('show-controls', 'show-preview'); studio.classList.add(b.dataset.tab); });

  const onInput = e => {
    const el = e.target.closest('[data-p]'); if (!el || !el.dataset.c) return;
    const p = el.dataset.p; let val;
    switch (el.dataset.c) {
      case 'sw': val = el.value; { const h = el.parentElement.querySelector('[data-c=hex]'); if (h) h.value = val; } break;
      case 'hex': { const t = el.value.trim(); if (t === '') val = ''; else if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) { val = t; const sw = el.parentElement.querySelector('[data-c=sw]'); if (sw) sw.value = to6(t); } else return; break; }
      case 'sel': val = el.dataset.t === 'n' ? (el.value === '' ? '' : Number(el.value)) : el.value; break;
      case 'rng': val = Number(el.value); { const o = el.parentElement.querySelector('output'); if (o) o.textContent = val + (el.dataset.u || ''); } break;
      case 'tog': val = el.checked; break;
      case 'txt': val = el.value; break;
      default: return;
    }
    setP(S.design, p, val); studioChanged();
  };
  panel.addEventListener('input', onInput);
  panel.addEventListener('change', onInput);
  panel.addEventListener('click', e => {
    const t = e.target;
    const rs = t.closest('[data-reset]');
    if (rs) { setP(S.design, rs.dataset.reset, ''); renderStudioControls(); studioChanged(); return; }
    const sg = t.closest('[data-seg]');
    if (sg) { const same = String(getP(S.design, sg.dataset.p)) === sg.dataset.v; setP(S.design, sg.dataset.p, same ? '' : sg.dataset.v); $$('[data-seg][data-p="' + sg.dataset.p + '"]', panel).forEach(x => x.classList.toggle('on', !same && x === sg)); studioChanged(); return; }
    const op = t.closest('[data-opt]');
    if (op) { setP(S.design, op.dataset.p, op.dataset.v); $$('[data-opt][data-p="' + op.dataset.p + '"]', panel).forEach(x => x.classList.toggle('on', x === op)); studioChanged(); return; }
    const od = t.closest('[data-ord]');
    if (od) {
      const keys = Object.keys(DEF_ORDER).sort((a, b) => ((getP(S.design, `sections.${a}.order`) ?? DEF_ORDER[a]) - (getP(S.design, `sections.${b}.order`) ?? DEF_ORDER[b])));
      const i = keys.indexOf(od.dataset.ord), j = i + Number(od.dataset.d);
      if (j >= 0 && j < keys.length) { [keys[i], keys[j]] = [keys[j], keys[i]]; keys.forEach((k, n) => setP(S.design, `sections.${k}.order`, n + 1)); renderStudioControls(); studioChanged(); }
    }
  });
  panel.addEventListener('toggle', e => {
    const d = e.target; if (!d.dataset || !d.dataset.grp) return;
    if (d.open) { S.open.add(d.dataset.grp); scrollPreview(SCROLL_TO[d.dataset.grp]); } else S.open.delete(d.dataset.grp);
  }, true);
  $('#stSave').onclick = async e => {
    await act(e.currentTarget, async () => {
      const r = await api('PUT', '/api/admin/design', S.design);
      S.design = clone(r.design); S.saved = JSON.stringify(S.design); S.data.design = clone(S.design);
      S.stats = await api('GET', '/api/admin/stats').catch(() => S.stats);
      renderStudioControls();
    }, 'Design saved & published');
    studioChanged();
  };
  $('#stDiscard').onclick = () => { S.design = JSON.parse(S.saved); renderStudioControls(); studioChanged(); toast('Changes discarded'); };
  $('#stReset').onclick = async () => {
    if (!(await confirmBox('Reset every design setting to the original look? Nothing is published until you press "Save & publish". Your content is not affected.', 'Reset design', false))) return;
    S.design = {}; renderStudioControls(); studioChanged();
  };
  studioChanged();
};

/* ------------------------------ global wiring ------------------------------ */
document.addEventListener('click', e => {
  const r = e.target.closest('[data-route]'); if (r) { go(r.dataset.route); return; }
  if (e.target.closest('#menuBtn')) { const sb = $('#sidebar'); sb.classList.toggle('open'); if (sb.classList.contains('open')) { const sc = document.createElement('div'); sc.className = 'scrim'; sc.onclick = () => { sb.classList.remove('open'); sc.remove(); }; document.body.appendChild(sc); } return; }
  if (e.target.closest('#logoutBtn')) doLogout(false);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('#nav a')) { e.preventDefault(); go(e.target.dataset.route); } });
window.addEventListener('hashchange', () => { if (!$('#appShell').hidden) route(); });
window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });
(async function start() {
  bindLogin();
  if (token()) { try { await boot(); } catch (e) { sessionStorage.removeItem('adToken'); } }
})();
