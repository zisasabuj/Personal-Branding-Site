const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { admin: {}, settings: {}, theme: {}, hero: {}, about: {}, partners: [], services: [], reviews: [] };
    }
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (!data.admin) data.admin = { username: 'admin', password: 'Consult@2026#Secure' };
    if (!data.settings) data.settings = {};
    if (!data.theme) data.theme = {};
    if (!data.hero) data.hero = {};
    if (!data.about) data.about = {};
    if (!Array.isArray(data.partners)) data.partners = [];
    if (!Array.isArray(data.services)) data.services = [];
    if (!Array.isArray(data.reviews)) data.reviews = [];
    return data;
  } catch (err) {
    console.error('Error reading DB:', err);
    return { admin: {}, settings: {}, theme: {}, hero: {}, about: {}, partners: [], services: [], reviews: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function saveBase64Image(base64Data, prefix) {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.includes(';base64,')) {
    return base64Data || '';
  }
  try {
    const parts = base64Data.split(';base64,');
    const mimePart = parts[0];
    let ext = 'png';
    if (mimePart.includes('image/jpeg') || mimePart.includes('image/jpg')) ext = 'jpg';
    else if (mimePart.includes('image/webp')) ext = 'webp';
    else if (mimePart.includes('image/svg')) ext = 'svg';

    const filename = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const buffer = Buffer.from(parts[1], 'base64');
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving image file:', err);
    return '';
  }
}

app.get('/api/site-data', (req, res) => {
  res.json(getDB());
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const u = (db.admin && db.admin.username) || 'admin';
  const p = (db.admin && db.admin.password) || 'Consult@2026#Secure';
  if (username === u && password === p) {
    return res.json({ success: true, token: 'admin_authenticated_session' });
  }
  return res.status(401).json({ error: 'Invalid username or password' });
});

app.put('/api/admin/theme', (req, res) => {
  const db = getDB();
  db.theme = {
    primaryColor: req.body.primaryColor || db.theme.primaryColor || '#6366f1',
    accentColor: req.body.accentColor || db.theme.accentColor || '#8b5cf6',
    bgDark: req.body.bgDark || db.theme.bgDark || '#080c14',
    bgLight: req.body.bgLight || db.theme.bgLight || '#f8fafc',
    fontFamily: req.body.fontFamily || db.theme.fontFamily || "'Plus Jakarta Sans', sans-serif",
    fontSizeBase: req.body.fontSizeBase || db.theme.fontSizeBase || '16px',
    headlineWeight: req.body.headlineWeight || db.theme.headlineWeight || '900'
  };
  saveDB(db);
  res.json({ success: true, theme: db.theme });
});

app.put('/api/admin/hero', (req, res) => {
  const db = getDB();
  let bgImg = db.hero.bgImage || '';
  if (req.body.bgImageBase64) {
    bgImg = saveBase64Image(req.body.bgImageBase64, 'hero-bg');
  }
  db.hero = {
    headline: req.body.headline || db.hero.headline || '',
    ctaText: req.body.ctaText || db.hero.ctaText || 'Request a Call',
    ctaLink: req.body.ctaLink || db.hero.ctaLink || '#services',
    summaryText: req.body.summaryText || db.hero.summaryText || '',
    bgImage: bgImg,
    stat1Num: req.body.stat1Num || db.hero.stat1Num || '200+',
    stat1Label: req.body.stat1Label || db.hero.stat1Label || '',
    stat2Num: req.body.stat2Num || db.hero.stat2Num || '6M+',
    stat2Label: req.body.stat2Label || db.hero.stat2Label || '',
    stat3Num: req.body.stat3Num || db.hero.stat3Num || '3k+',
    stat3Label: req.body.stat3Label || db.hero.stat3Label || '',
    stat4Num: req.body.stat4Num || db.hero.stat4Num || '500+',
    stat4Label: req.body.stat4Label || db.hero.stat4Label || ''
  };
  saveDB(db);
  res.json({ success: true, hero: db.hero });
});

app.put('/api/admin/about', (req, res) => {
  const db = getDB();
  let aboutImg = db.about.image || '';
  if (req.body.imageBase64) {
    aboutImg = saveBase64Image(req.body.imageBase64, 'about-coach');
  }
  db.about = {
    title: req.body.title || db.about.title || '',
    leadText: req.body.leadText || db.about.leadText || '',
    bio: req.body.bio || db.about.bio || '',
    image: aboutImg
  };
  saveDB(db);
  res.json({ success: true, about: db.about });
});

app.put('/api/admin/settings', (req, res) => {
  const db = getDB();
  let logoImg = db.settings.logoImage || '';
  if (req.body.logoBase64) {
    logoImg = saveBase64Image(req.body.logoBase64, 'brand-logo');
  }
  db.settings = {
    siteName: req.body.siteName || db.settings.siteName || 'KABIR',
    logoImage: logoImg,
    calendlyUrl: req.body.calendlyUrl || db.settings.calendlyUrl || 'https://calendly.com',
    phone: req.body.phone || db.settings.phone || '',
    email: req.body.email || db.settings.email || '',
    address: req.body.address || db.settings.address || '',
    footerBio: req.body.footerBio || db.settings.footerBio || '',
    copyright: req.body.copyright || db.settings.copyright || '© 2026 All rights reserved.'
  };
  if (req.body.newPassword && req.body.newPassword.trim() !== '') {
    db.admin.password = req.body.newPassword.trim();
  }
  saveDB(db);
  res.json({ success: true, settings: db.settings });
});

app.post('/api/admin/partners', (req, res) => {
  const db = getDB();
  let logoPath = '';
  if (req.body.logoBase64) {
    logoPath = saveBase64Image(req.body.logoBase64, 'partner-logo');
  }
  const newPartner = {
    id: Date.now(),
    name: req.body.name,
    logo: logoPath
  };
  db.partners.push(newPartner);
  saveDB(db);
  res.status(201).json({ success: true, partners: db.partners });
});

app.delete('/api/admin/partners/:id', (req, res) => {
  const db = getDB();
  db.partners = db.partners.filter(p => p.id != req.params.id);
  saveDB(db);
  res.json({ success: true, partners: db.partners });
});

app.post('/api/admin/services', (req, res) => {
  const db = getDB();
  const newService = {
    id: Date.now(),
    title: req.body.title,
    category: req.body.category || 'Strategic Program',
    shortDesc: req.body.shortDesc,
    fullDetails: req.body.fullDetails,
    features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : []
  };
  db.services.unshift(newService);
  saveDB(db);
  res.status(201).json({ success: true, services: db.services });
});

app.put('/api/admin/services/:id', (req, res) => {
  const db = getDB();
  const idx = db.services.findIndex(s => s.id == req.params.id);
  if (idx !== -1) {
    db.services[idx] = {
      id: Number(req.params.id),
      title: req.body.title,
      category: req.body.category,
      shortDesc: req.body.shortDesc,
      fullDetails: req.body.fullDetails,
      features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : []
    };
    saveDB(db);
    return res.json({ success: true, services: db.services });
  }
  res.status(404).json({ error: 'Service not found' });
});

app.delete('/api/admin/services/:id', (req, res) => {
  const db = getDB();
  db.services = db.services.filter(s => s.id != req.params.id);
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/admin/reviews', (req, res) => {
  const db = getDB();
  const newRev = {
    id: Date.now(),
    name: req.body.name,
    role: req.body.role,
    rating: Number(req.body.rating) || 5,
    comment: req.body.comment
  };
  db.reviews.unshift(newRev);
  saveDB(db);
  res.status(201).json({ success: true, reviews: db.reviews });
});

app.put('/api/admin/reviews/:id', (req, res) => {
  const db = getDB();
  const idx = db.reviews.findIndex(r => r.id == req.params.id);
  if (idx !== -1) {
    db.reviews[idx] = {
      id: Number(req.params.id),
      name: req.body.name,
      role: req.body.role,
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment
    };
    saveDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Review not found' });
});

app.delete('/api/admin/reviews/:id', (req, res) => {
  const db = getDB();
  db.reviews = db.reviews.filter(r => r.id != req.params.id);
  saveDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Live site:    http://localhost:${PORT}`);
  console.log(`Admin portal: http://localhost:${PORT}/admin.html`);
  console.log(`===============================================`);
});
