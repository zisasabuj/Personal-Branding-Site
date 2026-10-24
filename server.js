const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas কানেকশন স্ট্রিং (Render-এর Environment থেকে আসবে)
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Schema
const siteSchema = new mongoose.Schema({
  dataId: { type: String, default: 'main_site_data', unique: true },
  content: { type: Object, default: {} }
}, { timestamps: true });

const SiteModel = mongoose.model('SiteData', siteSchema);

// লোকাল ফাইল ব্যাকআপ ফাংশন
function readLocalDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (err) {}
  return { admin: {}, settings: {}, theme: {}, hero: {}, about: {}, partners: [], services: [], reviews: [] };
}

// ডাটা পড়ার সেন্ট্রাল ফাংশন (MongoDB থাকলে সেখান থেকে নিবে)
async function getActiveData() {
  if (mongoose.connection.readyState === 1) {
    let doc = await SiteModel.findOne({ dataId: 'main_site_data' });
    if (!doc) {
      const localData = readLocalDB();
      doc = await SiteModel.create({ dataId: 'main_site_data', content: localData });
    }
    return doc.content || {};
  }
  return readLocalDB();
}

// ডাটা সেভ করার সেন্ট্রাল ফাংশন (সরাসরি MongoDB ক্লাউডে জমা রাখবে)
async function saveActiveData(data) {
  if (mongoose.connection.readyState === 1) {
    await SiteModel.findOneAndUpdate(
      { dataId: 'main_site_data' },
      { content: data },
      { upsert: true, new: true }
    );
  }
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

// ডাটাবেজ কানেকশন
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas Cloud Database!'))
    .catch(err => console.error('MongoDB Connection Error:', err));
} else {
  console.log('MONGODB_URI not set. Running on local db.json mode.');
}

// পাবলিক এপিআই
app.get('/api/site-data', async (req, res) => {
  const data = await getActiveData();
  res.json(data);
});

// অ্যাডমিন অথেনটিকেশন
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await getActiveData();
  const u = (db.admin && db.admin.username) || 'admin';
  const p = (db.admin && db.admin.password) || 'Consult@2026#Secure';
  if (username === u && password === p) {
    return res.json({ success: true, token: 'admin_authenticated_session' });
  }
  return res.status(401).json({ error: 'Invalid username or password' });
});

// ১. থিম ও কালার আপডেট
app.put('/api/admin/theme', async (req, res) => {
  const db = await getActiveData();
  db.theme = {
    primaryColor: req.body.primaryColor || (db.theme && db.theme.primaryColor) || '#6366f1',
    accentColor: req.body.accentColor || (db.theme && db.theme.accentColor) || '#8b5cf6',
    bgDark: req.body.bgDark || (db.theme && db.theme.bgDark) || '#080c14',
    bgLight: req.body.bgLight || (db.theme && db.theme.bgLight) || '#f8fafc',
    fontFamily: req.body.fontFamily || (db.theme && db.theme.fontFamily) || "'Plus Jakarta Sans', sans-serif",
    fontSizeBase: req.body.fontSizeBase || (db.theme && db.theme.fontSizeBase) || '16px',
    headlineWeight: req.body.headlineWeight || (db.theme && db.theme.headlineWeight) || '900'
  };
  await saveActiveData(db);
  res.json({ success: true, theme: db.theme });
});

// ২. হিরো সেকশন আপডেট (ছবি সরাসরি ক্লাউডে পারসিস্ট থাকবে)
app.put('/api/admin/hero', async (req, res) => {
  const db = await getActiveData();
  if (!db.hero) db.hero = {};
  
  db.hero = {
    headline: req.body.headline || db.hero.headline || '',
    ctaText: req.body.ctaText || db.hero.ctaText || 'Request a Call',
    ctaLink: req.body.ctaLink || db.hero.ctaLink || '#services',
    summaryText: req.body.summaryText || db.hero.summaryText || '',
    bgImage: req.body.bgImageBase64 || db.hero.bgImage || '',
    stat1Num: req.body.stat1Num || db.hero.stat1Num || '200+',
    stat1Label: req.body.stat1Label || db.hero.stat1Label || '',
    stat2Num: req.body.stat2Num || db.hero.stat2Num || '6M+',
    stat2Label: req.body.stat2Label || db.hero.stat2Label || '',
    stat3Num: req.body.stat3Num || db.hero.stat3Num || '3k+',
    stat3Label: req.body.stat3Label || db.hero.stat3Label || '',
    stat4Num: req.body.stat4Num || db.hero.stat4Num || '500+',
    stat4Label: req.body.stat4Label || db.hero.stat4Label || ''
  };
  await saveActiveData(db);
  res.json({ success: true, hero: db.hero });
});

// ৩. অ্যাবাউট কোচ আপডেট
app.put('/api/admin/about', async (req, res) => {
  const db = await getActiveData();
  if (!db.about) db.about = {};
  
  db.about = {
    title: req.body.title || db.about.title || '',
    leadText: req.body.leadText || db.about.leadText || '',
    bio: req.body.bio || db.about.bio || '',
    image: req.body.imageBase64 || db.about.image || ''
  };
  await saveActiveData(db);
  res.json({ success: true, about: db.about });
});

// ৪. ব্র্যান্ড সেটিংস ও লোগো
app.put('/api/admin/settings', async (req, res) => {
  const db = await getActiveData();
  if (!db.settings) db.settings = {};
  if (!db.admin) db.admin = {};

  db.settings = {
    siteName: req.body.siteName || db.settings.siteName || 'KABIR',
    logoImage: req.body.logoBase64 || db.settings.logoImage || '',
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
  await saveActiveData(db);
  res.json({ success: true, settings: db.settings });
});

// ৫. পার্টনার্স CRUD
app.post('/api/admin/partners', async (req, res) => {
  const db = await getActiveData();
  if (!Array.isArray(db.partners)) db.partners = [];
  const newPartner = {
    id: Date.now(),
    name: req.body.name,
    logo: req.body.logoBase64 || ''
  };
  db.partners.push(newPartner);
  await saveActiveData(db);
  res.status(201).json({ success: true, partners: db.partners });
});

app.delete('/api/admin/partners/:id', async (req, res) => {
  const db = await getActiveData();
  if (Array.isArray(db.partners)) {
    db.partners = db.partners.filter(p => p.id != req.params.id);
    await saveActiveData(db);
  }
  res.json({ success: true });
});

// ৬. সার্ভিসেস CRUD
app.post('/api/admin/services', async (req, res) => {
  const db = await getActiveData();
  if (!Array.isArray(db.services)) db.services = [];
  const newService = {
    id: Date.now(),
    title: req.body.title,
    category: req.body.category || 'Strategic Program',
    shortDesc: req.body.shortDesc,
    fullDetails: req.body.fullDetails,
    features: req.body.features ? req.body.features.split(',').map(f => f.trim()) : []
  };
  db.services.unshift(newService);
  await saveActiveData(db);
  res.status(201).json({ success: true, services: db.services });
});

app.put('/api/admin/services/:id', async (req, res) => {
  const db = await getActiveData();
  if (Array.isArray(db.services)) {
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
      await saveActiveData(db);
      return res.json({ success: true, services: db.services });
    }
  }
  res.status(404).json({ error: 'Service not found' });
});

app.delete('/api/admin/services/:id', async (req, res) => {
  const db = await getActiveData();
  if (Array.isArray(db.services)) {
    db.services = db.services.filter(s => s.id != req.params.id);
    await saveActiveData(db);
  }
  res.json({ success: true });
});

// ৭. রিভিউ CRUD
app.post('/api/admin/reviews', async (req, res) => {
  const db = await getActiveData();
  if (!Array.isArray(db.reviews)) db.reviews = [];
  const newRev = {
    id: Date.now(),
    name: req.body.name,
    role: req.body.role,
    rating: Number(req.body.rating) || 5,
    comment: req.body.comment
  };
  db.reviews.unshift(newRev);
  await saveActiveData(db);
  res.status(201).json({ success: true, reviews: db.reviews });
});

app.put('/api/admin/reviews/:id', async (req, res) => {
  const db = await getActiveData();
  if (Array.isArray(db.reviews)) {
    const idx = db.reviews.findIndex(r => r.id == req.params.id);
    if (idx !== -1) {
      db.reviews[idx] = {
        id: Number(req.params.id),
        name: req.body.name,
        role: req.body.role,
        rating: Number(req.body.rating) || 5,
        comment: req.body.comment
      };
      await saveActiveData(db);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'Review not found' });
});

app.delete('/api/admin/reviews/:id', async (req, res) => {
  const db = await getActiveData();
  if (Array.isArray(db.reviews)) {
    db.reviews = db.reviews.filter(r => r.id != req.params.id);
    await saveActiveData(db);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
