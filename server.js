'use strict';

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1); // Render proxy-র পেছনে সঠিক IP পেতে

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const MONGODB_URI = process.env.MONGODB_URI;
const USE_MONGO = !!MONGODB_URI;

const DOC_ID = 'main_site_data';
const MAX_DOC_BYTES = 15 * 1024 * 1024; // MongoDB-র ১৬MB ডকুমেন্ট সীমার নিচে নিরাপদ সীমা
const KEEP_BACKUPS = 10;                // সর্বশেষ কতগুলো স্বয়ংক্রিয় স্ন্যাপশট রাখা হবে
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'Consult@2026#Secure';

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------------------------------------------------
   MongoDB মডেল
   গুরুত্বপূর্ণ: মডেলের নাম ('SiteData') ও dataId অপরিবর্তিত রাখা হয়েছে,
   যাতে আপনার বর্তমান Atlas ডাটা হুবহু একই কালেকশন থেকে পড়া যায়।
   ------------------------------------------------------------------------- */
const siteSchema = new mongoose.Schema({
  dataId: { type: String, default: DOC_ID, unique: true },
  content: { type: Object, default: {} }
}, { timestamps: true, minimize: false });
const SiteModel = mongoose.model('SiteData', siteSchema);

// প্রতিটি সেভের আগের অবস্থার স্ন্যাপশট (আলাদা কালেকশনে)
const backupSchema = new mongoose.Schema({
  reason: { type: String, default: '' },
  sizeBytes: { type: Number, default: 0 },
  content: { type: Object, default: {} }
}, { timestamps: true, minimize: false });
const BackupModel = mongoose.model('SiteBackup', backupSchema);

/* ------------------------------ ছোট হেল্পার ------------------------------ */
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isPlainObject = v => v && typeof v === 'object' && !Array.isArray(v);

/* ------------------------------ লোকাল ফাইল ------------------------------ */
function emptySite() {
  return { admin: {}, settings: {}, theme: {}, hero: {}, about: {}, partners: [], services: [], reviews: [] };
}
function readLocalDB() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('Local db.json read error:', err.message);
  }
  return emptySite();
}
function writeLocalDB(data) {
  const tmp = DB_PATH + '.tmp';
  if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, DB_PATH + '.bak'); // আগের অবস্থা সংরক্ষণ
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DB_PATH); // অ্যাটমিক রিপ্লেস
}

/* ------------------------------ ডাটা লোড/সেভ ------------------------------ */
function assertMongoReady() {
  if (mongoose.connection.readyState !== 1) {
    throw httpError(503, 'Database is not connected right now. Nothing was changed. Please try again shortly.');
  }
}

async function loadData() {
  if (!USE_MONGO) return readLocalDB();
  assertMongoReady();
  // $setOnInsert: ডকুমেন্ট না থাকলেই কেবল তৈরি হবে, থাকলে কখনোই ওভাররাইট করবে না
  const doc = await SiteModel.findOneAndUpdate(
    { dataId: DOC_ID },
    { $setOnInsert: { content: readLocalDB() } },
    { upsert: true, new: true, lean: true }
  );
  return doc.content || {};
}

async function pruneBackups() {
  const keep = await BackupModel.find().sort({ createdAt: -1 }).limit(KEEP_BACKUPS).select('_id').lean();
  await BackupModel.deleteMany({ _id: { $nin: keep.map(k => k._id) } });
}

async function saveData(data, reason) {
  const size = Buffer.byteLength(JSON.stringify(data));
  if (size > MAX_DOC_BYTES) {
    throw httpError(413, `Site data would be ${(size / 1048576).toFixed(1)} MB, above the safe ${MAX_DOC_BYTES / 1048576} MB limit (MongoDB single-document cap). Nothing was saved. Use smaller / compressed images.`);
  }
  if (!USE_MONGO) {
    writeLocalDB(data);
    return;
  }
  assertMongoReady();
  // ১) বর্তমান ডাটার স্ন্যাপশট নিন
  const current = await SiteModel.findOne({ dataId: DOC_ID }).lean();
  if (current && current.content && Object.keys(current.content).length) {
    await BackupModel.create({
      reason: reason || 'update',
      sizeBytes: Buffer.byteLength(JSON.stringify(current.content)),
      content: current.content
    });
    await pruneBackups();
  }
  // ২) তারপর নতুন ডাটা সেভ করুন
  await SiteModel.findOneAndUpdate(
    { dataId: DOC_ID },
    { content: data },
    { upsert: true, new: true }
  );
}

// একসাথে একাধিক রিকোয়েস্ট এলে read-modify-write যেন একে অপরকে মুছে না দেয়
let chain = Promise.resolve();
function withLock(fn) {
  const run = chain.then(() => fn());
  chain = run.catch(() => {});
  return run;
}
function mutate(reason, fn) {
  return withLock(async () => {
    const db = await loadData();
    const result = await fn(db);
    await saveData(db, reason);
    return result;
  });
}
function replaceAll(newData, reason) {
  return withLock(async () => {
    const current = await loadData();
    if (!isPlainObject(newData.admin) || !Object.keys(newData.admin).length) {
      newData.admin = current.admin || {}; // নিজেকে লক-আউট হওয়া থেকে বাঁচাতে
    }
    await saveData(newData, reason);
  });
}

/* ------------------------------ অথেনটিকেশন ------------------------------ */
const SECRET = process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update('site-session|' + (MONGODB_URI || 'local-dev')).digest('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function signToken(username) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function verifyToken(token) {
  if (typeof token !== 'string' || token.indexOf('.') < 1) return false;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch (e) { return false; }
}
function safeEqualStr(x, y) {
  const a = crypto.createHash('sha256').update(String(x)).digest();
  const b = crypto.createHash('sha256').update(String(y)).digest();
  return crypto.timingSafeEqual(a, b);
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function verifyPassword(pw, admin) {
  admin = admin || {};
  if (admin.passwordHash) {
    const parts = String(admin.passwordHash).split('$');
    if (parts.length !== 3) return false;
    const calc = crypto.scryptSync(pw, parts[1], 64);
    const stored = Buffer.from(parts[2], 'hex');
    return calc.length === stored.length && crypto.timingSafeEqual(calc, stored);
  }
  // আগের ফরম্যাট (প্লেইন পাসওয়ার্ড) — আপনার বর্তমান পাসওয়ার্ড অপরিবর্তিত থাকে
  return safeEqualStr(pw, admin.password || DEFAULT_PASS);
}
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  next();
}

// লগইন ব্রুট-ফোর্স সীমা: ১৫ মিনিটে ১০ বার ব্যর্থ হলে ব্লক
const attempts = new Map();
function tooManyAttempts(ip) {
  const rec = attempts.get(ip);
  return rec && rec.count >= 10 && Date.now() - rec.first < 15 * 60 * 1000;
}
function noteFailure(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first >= 15 * 60 * 1000) attempts.set(ip, { count: 1, first: now });
  else rec.count++;
}

/* ------------------------------ পাবলিক API ------------------------------ */
app.get('/healthz', (req, res) => res.json({ ok: true, mongo: USE_MONGO ? mongoose.connection.readyState === 1 : 'local-mode' }));

app.get('/api/site-data', ah(async (req, res) => {
  const data = await loadData();
  const { admin, ...publicData } = data; // অ্যাডমিন ইউজারনেম/পাসওয়ার্ড কখনোই পাবলিকে যাবে না
  res.json(publicData);
}));

app.post('/api/admin/login', ah(async (req, res) => {
  const ip = req.ip;
  if (tooManyAttempts(ip)) return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
  const { username, password } = req.body || {};
  const db = await loadData();
  const u = (db.admin && db.admin.username) || DEFAULT_USER;
  if (typeof username === 'string' && typeof password === 'string' &&
      safeEqualStr(username, u) && verifyPassword(password, db.admin)) {
    attempts.delete(ip);
    return res.json({ success: true, token: signToken(u) });
  }
  noteFailure(ip);
  return res.status(401).json({ error: 'Invalid username or password' });
}));

/* ------------------- এর পর থেকে সব /api/admin/* এ লগইন বাধ্যতামূলক ------------------- */
app.use('/api/admin', requireAuth);

// ১. থিম
app.put('/api/admin/theme', ah(async (req, res) => {
  const theme = await mutate('theme', db => {
    const t = db.theme || {};
    db.theme = {
      primaryColor: req.body.primaryColor || t.primaryColor || '#6366f1',
      accentColor: req.body.accentColor || t.accentColor || '#8b5cf6',
      bgDark: req.body.bgDark || t.bgDark || '#080c14',
      bgLight: req.body.bgLight || t.bgLight || '#f8fafc',
      fontFamily: req.body.fontFamily || t.fontFamily || "'Plus Jakarta Sans', sans-serif",
      fontSizeBase: req.body.fontSizeBase || t.fontSizeBase || '16px',
      headlineWeight: req.body.headlineWeight || t.headlineWeight || '900'
    };
    return db.theme;
  });
  res.json({ success: true, theme });
}));

// ২. হিরো
app.put('/api/admin/hero', ah(async (req, res) => {
  const hero = await mutate('hero', db => {
    const h = db.hero || {};
    db.hero = {
      headline: req.body.headline || h.headline || '',
      ctaText: req.body.ctaText || h.ctaText || 'Request a Call',
      ctaLink: req.body.ctaLink || h.ctaLink || '#services',
      summaryText: req.body.summaryText || h.summaryText || '',
      bgImage: req.body.bgImageBase64 || h.bgImage || '',
      stat1Num: req.body.stat1Num || h.stat1Num || '200+',
      stat1Label: req.body.stat1Label || h.stat1Label || '',
      stat2Num: req.body.stat2Num || h.stat2Num || '6M+',
      stat2Label: req.body.stat2Label || h.stat2Label || '',
      stat3Num: req.body.stat3Num || h.stat3Num || '3k+',
      stat3Label: req.body.stat3Label || h.stat3Label || '',
      stat4Num: req.body.stat4Num || h.stat4Num || '500+',
      stat4Label: req.body.stat4Label || h.stat4Label || ''
    };
    return db.hero;
  });
  res.json({ success: true, hero });
}));

// ৩. অ্যাবাউট
app.put('/api/admin/about', ah(async (req, res) => {
  const about = await mutate('about', db => {
    const a = db.about || {};
    db.about = {
      title: req.body.title || a.title || '',
      leadText: req.body.leadText || a.leadText || '',
      bio: req.body.bio || a.bio || '',
      image: req.body.imageBase64 || a.image || ''
    };
    return db.about;
  });
  res.json({ success: true, about });
}));

// ৪. ব্র্যান্ড সেটিংস ও পাসওয়ার্ড
app.put('/api/admin/settings', ah(async (req, res) => {
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword.trim() : '';
  if (newPassword && newPassword.length < 8) {
    throw httpError(400, 'New password must be at least 8 characters. Nothing was changed.');
  }
  const settings = await mutate('settings', db => {
    const s = db.settings || {};
    if (!db.admin) db.admin = {};
    db.settings = {
      siteName: req.body.siteName || s.siteName || 'Kabir Anwar',
      logoImage: req.body.logoBase64 || s.logoImage || '',
      calendlyUrl: req.body.calendlyUrl || s.calendlyUrl || 'https://calendly.com',
      phone: req.body.phone || s.phone || '',
      email: req.body.email || s.email || '',
      address: req.body.address || s.address || '',
      footerBio: req.body.footerBio || s.footerBio || '',
      copyright: req.body.copyright || s.copyright || '© 2026 All rights reserved.'
    };
    if (newPassword) {
      db.admin.passwordHash = hashPassword(newPassword);
      delete db.admin.password; // প্লেইন পাসওয়ার্ড আর রাখা হবে না
    }
    return db.settings;
  });
  res.json({ success: true, settings });
}));

// ৫. পার্টনার্স
app.post('/api/admin/partners', ah(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) throw httpError(400, 'Partner name is required.');
  const partners = await mutate('partner-add', db => {
    if (!Array.isArray(db.partners)) db.partners = [];
    db.partners.push({ id: Date.now(), name, logo: req.body.logoBase64 || '' });
    return db.partners;
  });
  res.status(201).json({ success: true, partners });
}));

app.delete('/api/admin/partners/:id', ah(async (req, res) => {
  await mutate('partner-delete', db => {
    if (Array.isArray(db.partners)) db.partners = db.partners.filter(p => p.id != req.params.id);
  });
  res.json({ success: true });
}));

// ৬. সার্ভিসেস
const parseFeatures = f => (typeof f === 'string' && f.trim() ? f.split(',').map(x => x.trim()).filter(Boolean) : []);

app.post('/api/admin/services', ah(async (req, res) => {
  if (!req.body.title || !String(req.body.title).trim()) throw httpError(400, 'Service title is required.');
  const services = await mutate('service-add', db => {
    if (!Array.isArray(db.services)) db.services = [];
    db.services.unshift({
      id: Date.now(),
      title: req.body.title,
      category: req.body.category || 'Strategic Program',
      shortDesc: req.body.shortDesc,
      fullDetails: req.body.fullDetails,
      features: parseFeatures(req.body.features)
    });
    return db.services;
  });
  res.status(201).json({ success: true, services });
}));

app.put('/api/admin/services/:id', ah(async (req, res) => {
  if (!req.body.title || !String(req.body.title).trim()) throw httpError(400, 'Service title is required.');
  const services = await mutate('service-edit', db => {
    const idx = Array.isArray(db.services) ? db.services.findIndex(s => s.id == req.params.id) : -1;
    if (idx === -1) throw httpError(404, 'Service not found');
    db.services[idx] = {
      id: Number(req.params.id),
      title: req.body.title,
      category: req.body.category,
      shortDesc: req.body.shortDesc,
      fullDetails: req.body.fullDetails,
      features: parseFeatures(req.body.features)
    };
    return db.services;
  });
  res.json({ success: true, services });
}));

app.delete('/api/admin/services/:id', ah(async (req, res) => {
  await mutate('service-delete', db => {
    if (Array.isArray(db.services)) db.services = db.services.filter(s => s.id != req.params.id);
  });
  res.json({ success: true });
}));

// ৭. রিভিউ
app.post('/api/admin/reviews', ah(async (req, res) => {
  if (!req.body.name || !String(req.body.name).trim()) throw httpError(400, 'Reviewer name is required.');
  const reviews = await mutate('review-add', db => {
    if (!Array.isArray(db.reviews)) db.reviews = [];
    db.reviews.unshift({
      id: Date.now(),
      name: req.body.name,
      role: req.body.role,
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment
    });
    return db.reviews;
  });
  res.status(201).json({ success: true, reviews });
}));

app.put('/api/admin/reviews/:id', ah(async (req, res) => {
  if (!req.body.name || !String(req.body.name).trim()) throw httpError(400, 'Reviewer name is required.');
  await mutate('review-edit', db => {
    const idx = Array.isArray(db.reviews) ? db.reviews.findIndex(r => r.id == req.params.id) : -1;
    if (idx === -1) throw httpError(404, 'Review not found');
    db.reviews[idx] = {
      id: Number(req.params.id),
      name: req.body.name,
      role: req.body.role,
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment
    };
  });
  res.json({ success: true });
}));

app.delete('/api/admin/reviews/:id', ah(async (req, res) => {
  await mutate('review-delete', db => {
    if (Array.isArray(db.reviews)) db.reviews = db.reviews.filter(r => r.id != req.params.id);
  });
  res.json({ success: true });
}));

/* ------------------------ ব্যাকআপ ও রিস্টোর (নতুন) ------------------------ */
function validateSiteShape(d) {
  if (!isPlainObject(d)) return 'Backup file must be a JSON object.';
  for (const k of ['partners', 'services', 'reviews']) {
    if (d[k] !== undefined && !Array.isArray(d[k])) return `"${k}" must be a list.`;
  }
  for (const k of ['theme', 'hero', 'about', 'settings']) {
    if (d[k] !== undefined && !isPlainObject(d[k])) return `"${k}" must be an object.`;
  }
  const known = ['theme', 'hero', 'about', 'settings', 'partners', 'services', 'reviews', 'admin'];
  if (!known.some(k => d[k] !== undefined)) return 'This does not look like a site backup file.';
  return null;
}
function normalizeSite(d) {
  const base = emptySite();
  return Object.assign(base, d);
}

// বর্তমান পূর্ণ ডাটা ডাউনলোড (লগইন করা অ্যাডমিন)
app.get('/api/admin/backup', ah(async (req, res) => {
  const data = await loadData();
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="site-backup-${stamp}.json"`);
  res.send(JSON.stringify(data, null, 2));
}));

// ফাইল থেকে রিস্টোর (রিস্টোরের আগে বর্তমান অবস্থার স্ন্যাপশট নেওয়া হয়)
app.post('/api/admin/restore', ah(async (req, res) => {
  const problem = validateSiteShape(req.body);
  if (problem) throw httpError(400, problem + ' Nothing was changed.');
  await replaceAll(normalizeSite(req.body), 'before-restore-from-file');
  res.json({ success: true });
}));

app.get('/api/admin/backups', ah(async (req, res) => {
  if (!USE_MONGO) {
    const bak = DB_PATH + '.bak';
    if (!fs.existsSync(bak)) return res.json({ backups: [] });
    const st = fs.statSync(bak);
    return res.json({ backups: [{ id: 'local-bak', createdAt: st.mtime, reason: 'previous local save', sizeBytes: st.size }] });
  }
  assertMongoReady();
  const list = await BackupModel.find().sort({ createdAt: -1 }).select('reason sizeBytes createdAt').lean();
  res.json({ backups: list.map(b => ({ id: String(b._id), createdAt: b.createdAt, reason: b.reason, sizeBytes: b.sizeBytes })) });
}));

app.post('/api/admin/backups/:id/restore', ah(async (req, res) => {
  let content;
  if (!USE_MONGO) {
    if (req.params.id !== 'local-bak') throw httpError(404, 'Backup not found');
    content = JSON.parse(fs.readFileSync(DB_PATH + '.bak', 'utf8'));
  } else {
    assertMongoReady();
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid backup id');
    const b = await BackupModel.findById(req.params.id).lean();
    if (!b) throw httpError(404, 'Backup not found');
    content = b.content;
  }
  const problem = validateSiteShape(content);
  if (problem) throw httpError(400, problem + ' Nothing was changed.');
  await replaceAll(normalizeSite(content), 'before-restore-snapshot');
  res.json({ success: true });
}));

/* ------------------------------ এরর হ্যান্ডলার ------------------------------ */
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Server error:', err);
  res.status(status).json({ error: status >= 500 && !err.status ? 'Internal server error' : err.message });
});

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

/* ------------------------------ চালু করা ------------------------------ */
async function start() {
  if (USE_MONGO) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
      console.log('Connected to MongoDB Atlas Cloud Database!');
      console.log('Using database:', mongoose.connection.name);
    } catch (err) {
      // সংযোগ ছাড়া সার্ভার চালু করলে ফাঁকা ডাটা দেখাত — তাই বন্ধ করে দিচ্ছি
      console.error('MongoDB Connection Error:', err.message);
      process.exit(1);
    }
  } else {
    console.log('MONGODB_URI not set. Running on local db.json mode.');
  }
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}
start();
