#!/usr/bin/env node
/**
 * generate-icons.js — Tek bir kaynak logodan Expo için gereken TÜM ikonları üretir
 * ve isteğe bağlı olarak app.json'a gerekli alanları/plugin'i ekler.
 *
 * Üretilenler (varsayılan --out ./assets):
 *   icon.png             1024x1024, OPAK (iOS alpha kabul etmez) — ana uygulama ikonu
 *   icon-512.png         512x512, opak — mağaza/bildirim ikonu
 *   adaptive-icon.png    1024x1024, ŞEFFAF — Android adaptive foreground (güvenli alan)
 *   splash-icon.png      1024x1024, şeffaf — açılış ekranı (açık tema)
 *   splash-icon-dark.png 1024x1024, şeffaf — açılış ekranı (koyu tema)
 *   favicon.png          48x48, opak — web favicon
 *   logo-mark.png        kaynağın 1024'e ölçeklenmiş kopyası (şeffaf)
 *
 * Kullanım:
 *   node generate-icons.js --source ./logo.png \
 *        [--source-dark ./logo-dark.png] \
 *        [--out ./assets] \
 *        [--bg "#faf8ef"] [--adaptive-bg "#bbada0"] [--splash-dark-bg "#1c1c1e"] \
 *        [--app-json ./app.json]   (verilirse app.json yamalanır)
 *
 * sharp otomatik kurulur (proje bağımlılığı gerekmez): önce require('sharp'),
 * bulunamazsa ~/.cache/wappa-icons altına --no-save kurar ve oradan yükler.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ---------- args ----------
function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { out[key] = true; }
      else { out[key] = next; i++; }
    }
  }
  return out;
}
const args = parseArgs(process.argv);

if (args.help || args.h) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 34).join('\n').replace(/^ \*?/gm, ''));
  process.exit(0);
}

// ---------- sharp bootstrap ----------
function loadSharp() {
  try { return require('sharp'); } catch (_) {}
  const cache = path.join(os.homedir(), '.cache', 'wappa-icons');
  const cachedSharp = path.join(cache, 'node_modules', 'sharp');
  try { return require(cachedSharp); } catch (_) {}
  console.error('• sharp bulunamadı, ~/.cache/wappa-icons içine kuruluyor (tek seferlik)…');
  fs.mkdirSync(cache, { recursive: true });
  const pkg = path.join(cache, 'package.json');
  if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, JSON.stringify({ name: 'wappa-icons-cache', private: true }));
  execSync('npm install sharp@^0.33 --no-audit --no-fund --loglevel=error', { cwd: cache, stdio: 'inherit' });
  return require(cachedSharp);
}
const sharp = loadSharp();

// ---------- helpers ----------
function hexToRgb(hex) {
  if (!hex || hex === true) return null;
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function bgWithAlpha(hex, alpha) {
  const c = hexToRgb(hex) || { r: 255, g: 255, b: 255 };
  return { ...c, alpha };
}

/**
 * size x size tuval üzerine, tuvalin `frac` oranı kadar merkezlenmiş logo yerleştirir.
 * bgHex null ise arka plan ŞEFFAF; değilse OPAK renkli.
 */
async function compose(src, size, frac, bgHex, outPath) {
  const inner = Math.round(size * frac);
  const logo = await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const background = bgHex ? bgWithAlpha(bgHex, 1) : { r: 0, g: 0, b: 0, alpha: 0 };
  const canvas = sharp({ create: { width: size, height: size, channels: 4, background } });
  let img = canvas.composite([{ input: logo, gravity: 'center' }]);
  // Opak ikonlarda alpha KANALINI tamamen kaldır (App Store alpha'lı ikonu reddeder).
  if (bgHex) img = img.flatten({ background: bgWithAlpha(bgHex, 1) }).removeAlpha();
  await img.png().toFile(outPath);
  return outPath;
}

// ---------- resolve source ----------
function firstExisting(cands) {
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return null;
}
const outDir = path.resolve(args.out || './assets');
const source = path.resolve(
  args.source || firstExisting(['./assets/logo-mark.png', './assets/icon.png', './logo.png']) || './assets/logo-mark.png'
);
if (!fs.existsSync(source)) {
  console.error(`✗ Kaynak görsel bulunamadı: ${source}\n  --source ./logo.png ile belirt (kare, yüksek çözünürlük, tercihen şeffaf PNG).`);
  process.exit(1);
}
const sourceDark = args['source-dark'] ? path.resolve(args['source-dark']) : source;

const BG = args.bg || '#ffffff';                 // ana ikon arka planı (opak)
const ADAPTIVE_BG = args['adaptive-bg'] || BG;   // app.json android.adaptiveIcon.backgroundColor
const SPLASH_DARK_BG = args['splash-dark-bg'] || '#000000';

fs.mkdirSync(outDir, { recursive: true });

// ---------- generate ----------
(async () => {
  const p = (f) => path.join(outDir, f);
  console.log(`• Kaynak : ${source}`);
  console.log(`• Çıktı  : ${outDir}`);

  await compose(source, 1024, 0.78, BG, p('icon.png'));                 // opak, marjinli
  await compose(source, 512, 0.78, BG, p('icon-512.png'));              // opak
  await compose(source, 1024, 0.66, null, p('adaptive-icon.png'));     // şeffaf, güvenli alan
  await compose(source, 1024, 0.60, null, p('splash-icon.png'));       // şeffaf
  await compose(sourceDark, 1024, 0.60, null, p('splash-icon-dark.png')); // şeffaf
  await compose(source, 48, 0.92, BG, p('favicon.png'));               // opak, küçük
  await sharp(source).resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(p('logo-mark.png'));

  console.log('✓ 7 ikon üretildi: icon.png, icon-512.png, adaptive-icon.png, splash-icon.png, splash-icon-dark.png, favicon.png, logo-mark.png');

  // ---------- app.json patch (opsiyonel) ----------
  if (args['app-json']) {
    const appPath = path.resolve(args['app-json'] === true ? './app.json' : args['app-json']);
    patchAppJson(appPath, { ADAPTIVE_BG, BG, SPLASH_DARK_BG });
  } else {
    console.log('ℹ app.json yamalanmadı ( --app-json ./app.json ile ekleyebilirsin ).');
  }
})().catch((e) => { console.error('✗ Hata:', e.message); process.exit(1); });

// ---------- app.json patcher ----------
function patchAppJson(appPath, { ADAPTIVE_BG, SPLASH_DARK_BG }) {
  if (!fs.existsSync(appPath)) { console.error(`✗ app.json yok: ${appPath}`); return; }
  const raw = fs.readFileSync(appPath, 'utf8');
  const json = JSON.parse(raw);
  json.expo = json.expo || {};
  const e = json.expo;

  e.icon = './assets/icon.png';

  e.android = e.android || {};
  e.android.adaptiveIcon = {
    foregroundImage: './assets/adaptive-icon.png',
    backgroundColor: ADAPTIVE_BG,
    ...(e.android.adaptiveIcon || {}),
  };
  // backgroundColor'ı her zaman güncel tut
  e.android.adaptiveIcon.backgroundColor = ADAPTIVE_BG;
  e.android.adaptiveIcon.foregroundImage = './assets/adaptive-icon.png';

  e.web = e.web || {};
  e.web.favicon = './assets/favicon.png';

  // expo-splash-screen plugin'i
  e.plugins = e.plugins || [];
  const splashCfg = {
    image: './assets/splash-icon.png',
    imageWidth: 300,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
    dark: { image: './assets/splash-icon-dark.png', backgroundColor: SPLASH_DARK_BG },
  };
  const idx = e.plugins.findIndex((pl) => pl === 'expo-splash-screen' || (Array.isArray(pl) && pl[0] === 'expo-splash-screen'));
  if (idx === -1) {
    e.plugins.push(['expo-splash-screen', splashCfg]);
  } else if (Array.isArray(e.plugins[idx])) {
    e.plugins[idx][1] = { ...splashCfg, ...(e.plugins[idx][1] || {}) };
    // görselleri her zaman doğru dosyalara bağla
    e.plugins[idx][1].image = splashCfg.image;
    e.plugins[idx][1].dark = { ...(e.plugins[idx][1].dark || {}), image: splashCfg.dark.image };
  } else {
    e.plugins[idx] = ['expo-splash-screen', splashCfg];
  }

  fs.writeFileSync(appPath, JSON.stringify(json, null, 2) + '\n');
  console.log(`✓ app.json güncellendi: icon, android.adaptiveIcon, web.favicon, expo-splash-screen`);
}
