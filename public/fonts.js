// Shared font catalog (used by the public site and the admin Design Studio)
window.FONT_CATALOG = [
  { name: 'Plus Jakarta Sans', cat: 'Sans', w: [400, 500, 600, 700, 800] },
  { name: 'Inter', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Poppins', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Outfit', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Montserrat', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'DM Sans', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Manrope', cat: 'Sans', w: [400, 500, 600, 700, 800] },
  { name: 'Space Grotesk', cat: 'Sans', w: [400, 500, 600, 700] },
  { name: 'Raleway', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Nunito', cat: 'Sans', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Roboto', cat: 'Sans', w: [400, 500, 700, 900] },
  { name: 'Playfair Display', cat: 'Serif', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Lora', cat: 'Serif', w: [400, 500, 600, 700] },
  { name: 'Merriweather', cat: 'Serif', w: [400, 700, 900] },
  { name: 'Cormorant Garamond', cat: 'Serif', w: [400, 500, 600, 700] },
  { name: 'Hind Siliguri', cat: 'Bangla', w: [400, 500, 600, 700] },
  { name: 'Noto Sans Bengali', cat: 'Bangla', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Noto Serif Bengali', cat: 'Bangla', w: [400, 500, 600, 700, 800, 900] },
  { name: 'Anek Bangla', cat: 'Bangla', w: [400, 500, 600, 700, 800] },
  { name: 'Baloo Da 2', cat: 'Bangla', w: [400, 500, 600, 700, 800] },
  { name: 'Tiro Bangla', cat: 'Bangla', w: [400] }
];
window.fontStack = function (name) {
  if (!name) return '';
  const f = window.FONT_CATALOG.find(x => x.name === name);
  if (!f) return name; // already a full CSS stack (older saved theme values)
  const fallback = f.cat === 'Serif' ? 'serif' : 'sans-serif';
  return "'" + f.name + "', " + fallback;
};
window.loadFontByName = function (name) {
  const f = window.FONT_CATALOG.find(x => x.name === name);
  if (!f) return;
  const id = 'gf-' + f.name.replace(/\s+/g, '-');
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id;
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + f.name.replace(/\s+/g, '+') + ':wght@' + f.w.join(';') + '&display=swap';
  document.head.appendChild(l);
};
