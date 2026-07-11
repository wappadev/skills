#!/usr/bin/env node
/**
 * build-screenshots.js — Ham ekran kareleri + bir config'ten mağaza boyutlarında,
 * ARKA PLAN + BAŞLIK + yuvarlatılmış çerçeve ile pazarlama görselleri üretir.
 * Dış editöre (app-store-screenshots) gerek YOK; her şey sharp ile kod tarafında.
 *
 * Çıktı, place-screenshots.js'in beklediği boyutlarda PNG'ler → doğrudan onu besler.
 *
 * Kullanım:
 *   node build-screenshots.js --config ./screenshots.config.js --raw ./raw --out ./export
 *   node build-screenshots.js --config ./screenshots.config.js --raw ./raw --out ./export \
 *        --only tr --devices iphone67,android
 *
 *   --config   Slayt/başlık/tema tanımı (aşağıdaki şema). Verilmezse yanındaki
 *              screenshots.config.js aranır.
 *   --raw      Ham PNG karelerinin klasörü (config'teki `raw` adları burada aranır).
 *   --out      Üretilen görsellerin yazılacağı klasör (place-screenshots.js --from bunu alır).
 *   --only     Yalnızca bu locale'i üret (ör. tr).
 *   --devices  Virgüllü liste ile cihazları kısıtla (iphone67,ipad13,android,feature).
 *
 * ---- config şeması (screenshots.config.js) ----
 * module.exports = {
 *   appName: "Sweet Pop",
 *   icon: "./assets/icon-512.png",   // Play 512×512 mağaza ikonu kaynağı (opsiyonel; yoksa assets/ otomatik)
 *   // her locale'de üretilecek çıktılar (slayt bazında da ezilebilir):
 *   //   iphone67, ipad13 (iOS) · android (telefon) · android7/android10 (Play tablet) · feature · icon
 *   devices: ["iphone67", "ipad13", "android", "android7", "android10", "feature", "icon"],
 *   locales: {
 *     tr: {
 *       textColor: "#ffffff",
 *       background: ["#ff6ea9", "#8a5cff"],   // 1 renk = düz; 2 renk = dikey gradyan
 *       slides: [
 *         { raw: "welcome.png", title: "1000 Tatlı Bölüm", subtitle: "Reklamsız & Ücretsiz",
 *           badge: "REKLAMSIZ", devices: ["iphone67","android"] },
 *         { raw: "game.png",    title: "Patlat & Kombola",  subtitle: "Özel şekerler, dev komboli" },
 *         { raw: "compete.png", title: "Lider Tablosu",     subtitle: "Arkadaşlarını geç" },
 *       ],
 *       // feature graphic (1024×500) — ekran görüntüsüz, logo/başlık kartı:
 *       feature: { title: "Sweet Pop", subtitle: "Match-3 Şeker Bulmaca" },
 *     },
 *   },
 * };
 *
 * sharp otomatik kurulur (proje bağımlılığı gerekmez). Metin SVG ile çizilir →
 * sistem fontları (Helvetica/Arial/DejaVu) kullanılır, font dosyası gerekmez.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}
const args = parseArgs(process.argv);
if (args.help || args.h) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 46).join('\n').replace(/^ \*?/gm, ''));
  process.exit(0);
}

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

// ---- cihaz boyutları ----
// android7 / android10 = Google Play 7" ve 10" tablet görselleri (portre).
const DEVICES = {
  iphone67:  { w: 1290, h: 2796, kind: 'portrait' },
  ipad13:    { w: 2064, h: 2752, kind: 'portrait' },
  android:   { w: 1080, h: 1920, kind: 'portrait' },
  android7:  { w: 1200, h: 1920, kind: 'portrait' },
  android10: { w: 1600, h: 2560, kind: 'portrait' },
  feature:   { w: 1024, h: 500,  kind: 'feature' },
};

// ---- config yükle ----
const RAW = path.resolve(args.raw === true || !args.raw ? './raw' : args.raw);
const OUT = path.resolve(args.out === true || !args.out ? './export' : args.out);
let configPath = args.config && args.config !== true ? path.resolve(args.config) : path.join(process.cwd(), 'screenshots.config.js');
if (!fs.existsSync(configPath)) { console.error(`Hata: config bulunamadı: ${configPath}\n(--config ile yol ver ya da örnek için --help)`); process.exit(1); }
const config = require(configPath);
const onlyLocale = args.only && args.only !== true ? args.only : null;
const devFilter = args.devices && args.devices !== true ? String(args.devices).split(',').map((s) => s.trim()) : null;

// Play ikon kaynağını bul: config.icon (config'e göreli) → yoksa proje assets'inde otomatik.
function resolveIconSource() {
  const base = path.dirname(configPath);
  const cand = [];
  if (config.icon && config.icon !== true) cand.push(path.resolve(base, config.icon));
  cand.push(path.join(base, 'assets', 'icon-512.png'), path.join(base, 'assets', 'icon.png'));
  return cand.find((p) => fs.existsSync(p)) || null;
}

// ---- yardımcılar ----
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function hexToRgb(hex) {
  let h = String(hex || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
// başlığı ~maxChars'a göre satırlara böl (kelime bazlı); manuel \n'e saygı duy.
function wrap(text, maxChars) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let cur = '';
    for (const word of para.split(/\s+/)) {
      if (!cur) cur = word;
      else if ((cur + ' ' + word).length <= maxChars) cur += ' ' + word;
      else { lines.push(cur); cur = word; }
    }
    lines.push(cur);
  }
  return lines;
}

// dikey gradyan / düz arka plan (device boyutunda PNG buffer)
async function background(dev, bg) {
  const colors = Array.isArray(bg) ? bg : [bg || '#111827'];
  if (colors.length === 1) {
    const c = hexToRgb(colors[0]);
    return sharp({ create: { width: dev.w, height: dev.h, channels: 4, background: { ...c, alpha: 1 } } }).png().toBuffer();
  }
  const svg = `<svg width="${dev.w}" height="${dev.h}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/>
    </linearGradient></defs>
    <rect width="${dev.w}" height="${dev.h}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// yuvarlatılmış köşe maskesi uygulanmış ham kare (inner genişliğe ölçekli), gölgeli.
async function framedShot(rawPath, targetW) {
  const img = sharp(rawPath);
  const meta = await img.metadata();
  const scale = targetW / meta.width;
  const w = targetW;
  const h = Math.round(meta.height * scale);
  const rx = Math.round(w * 0.055);
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${rx}" ry="${rx}"/></svg>`);
  const rounded = await sharp(rawPath).resize(w, h, { fit: 'fill' })
    .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return { buffer: rounded, w, h, rx };
}

function captionSvg(dev, texts, color, badge) {
  const { w } = dev;
  const titleSize = Math.round(w * 0.072);
  const subSize = Math.round(w * 0.040);
  const lh = Math.round(titleSize * 1.12);
  const titleLines = wrap(texts.title || '', Math.floor(w / (titleSize * 0.56)));
  const subLines = texts.subtitle ? wrap(texts.subtitle, Math.floor(w / (subSize * 0.55))) : [];
  let y = Math.round(dev.h * 0.075) + titleSize;
  let parts = '';
  if (badge) {
    const bs = Math.round(w * 0.032);
    parts += `<text x="${w / 2}" y="${y - titleSize - bs}" text-anchor="middle" font-family="Helvetica,Arial,DejaVu Sans,sans-serif" font-weight="800" font-size="${bs}" letter-spacing="2" fill="${color}" opacity="0.85">${esc(badge)}</text>`;
  }
  for (const line of titleLines) { parts += `<text x="${w / 2}" y="${y}" text-anchor="middle" font-family="Helvetica,Arial,DejaVu Sans,sans-serif" font-weight="800" font-size="${titleSize}" fill="${color}">${esc(line)}</text>`; y += lh; }
  if (subLines.length) { y += Math.round(subSize * 0.4); for (const line of subLines) { parts += `<text x="${w / 2}" y="${y}" text-anchor="middle" font-family="Helvetica,Arial,DejaVu Sans,sans-serif" font-weight="500" font-size="${subSize}" fill="${color}" opacity="0.9">${esc(line)}</text>`; y += Math.round(subSize * 1.25); } }
  const bottom = y;
  const svg = `<svg width="${w}" height="${dev.h}" xmlns="http://www.w3.org/2000/svg">${parts}</svg>`;
  return { svg: Buffer.from(svg), bottom };
}

async function buildPortrait(dev, slide, loc, outFile) {
  const bg = await background(dev, loc.background);
  const color = loc.textColor || '#ffffff';
  const cap = captionSvg(dev, slide, color, slide.badge);
  const pad = Math.round(dev.w * 0.09);
  const innerW = dev.w - pad * 2;
  const shot = await framedShot(path.join(RAW, slide.raw), innerW);
  // ekran görüntüsünü başlığın altına yerleştir; taşarsa yüksekliğe göre küçült
  let sx = pad, sw = shot.w, sh = shot.h, buf = shot.buffer;
  const top = Math.max(cap.bottom + Math.round(dev.h * 0.03), Math.round(dev.h * 0.24));
  const avail = dev.h - top - Math.round(dev.h * 0.05);
  if (sh > avail) {
    const s2 = avail / sh; sw = Math.round(sw * s2); sh = avail;
    sx = Math.round((dev.w - sw) / 2);
    buf = await sharp(shot.buffer).resize(sw, sh, { fit: 'fill' }).png().toBuffer();
  }
  const sy = top;
  // basit gölge: koyu, hafif blurlu yuvarlak dikdörtgen
  const shRx = Math.round(sw * 0.055);
  const shadow = await sharp(Buffer.from(`<svg width="${sw}" height="${sh}"><rect width="${sw}" height="${sh}" rx="${shRx}" ry="${shRx}" fill="#000"/></svg>`))
    .blur(28).png().toBuffer();
  await sharp(bg)
    .composite([
      { input: shadow, left: sx, top: sy + Math.round(dev.h * 0.006), blend: 'over' },
      { input: buf, left: sx, top: sy },
      { input: cap.svg, left: 0, top: 0 },
    ])
    .png().toFile(outFile);
}

async function buildFeature(dev, feat, loc, appName, outFile) {
  const bg = await background(dev, loc.background);
  const color = loc.textColor || '#ffffff';
  const title = (feat && feat.title) || appName || '';
  const sub = (feat && feat.subtitle) || '';
  const tSize = Math.round(dev.h * 0.22);
  const sSize = Math.round(dev.h * 0.09);
  const svg = `<svg width="${dev.w}" height="${dev.h}" xmlns="http://www.w3.org/2000/svg">
    <text x="${dev.w / 2}" y="${dev.h * (sub ? 0.46 : 0.58)}" text-anchor="middle" font-family="Helvetica,Arial,DejaVu Sans,sans-serif" font-weight="800" font-size="${tSize}" fill="${color}">${esc(title)}</text>
    ${sub ? `<text x="${dev.w / 2}" y="${dev.h * 0.72}" text-anchor="middle" font-family="Helvetica,Arial,DejaVu Sans,sans-serif" font-weight="500" font-size="${sSize}" fill="${color}" opacity="0.9">${esc(sub)}</text>` : ''}
  </svg>`;
  await sharp(bg).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).png().toFile(outFile);
}

async function main() {
  if (!fs.existsSync(RAW)) { console.error(`Hata: --raw klasörü yok: ${RAW}`); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const locales = config.locales || {};
  let count = 0;

  for (const [locName, loc] of Object.entries(locales)) {
    if (onlyLocale && locName !== onlyLocale) continue;
    const slides = loc.slides || [];
    let idx = 0;
    for (const slide of slides) {
      idx++;
      const rawFull = path.join(RAW, slide.raw);
      if (!fs.existsSync(rawFull)) { console.error(`  ⚠ ${locName}: ham kare yok, atlandı → ${slide.raw}`); continue; }
      let devs = slide.devices || loc.devices || config.devices || ['iphone67'];
      // feature ve icon slayt-başına değil, aşağıda locale-başına bir kez üretilir.
      devs = devs.filter((d) => d !== 'feature' && d !== 'icon' && (!devFilter || devFilter.includes(d)));
      for (const dName of devs) {
        const dev = DEVICES[dName];
        if (!dev) { console.error(`  ⚠ bilinmeyen cihaz: ${dName}`); continue; }
        const nn = String(idx).padStart(2, '0');
        const outFile = path.join(OUT, `${locName}_${dName}_${nn}.png`);
        await buildPortrait(dev, slide, loc, outFile);
        console.log(`  ✓ ${path.basename(outFile)}  (${dev.w}×${dev.h})`);
        count++;
      }
    }
    // feature graphic (locale'e göre metin/arka plan → İngilizce ve Türkçe FARKLI olur)
    const wantFeature = (loc.devices || config.devices || []).includes('feature') && (!devFilter || devFilter.includes('feature'));
    if (wantFeature) {
      const outFile = path.join(OUT, `${locName}_feature.png`);
      await buildFeature(DEVICES.feature, loc.feature, loc, config.appName, outFile);
      console.log(`  ✓ ${path.basename(outFile)}  (1024×500 feature)`);
      count++;
    }

    // Play mağaza ikonu (512×512) — uygulamanın ikonu (locale'den bağımsız, her dile aynı).
    // Kaynak: config.icon (config dosyasına göreli) ya da otomatik: assets/icon-512.png|icon.png.
    const wantIcon = (loc.devices || config.devices || []).includes('icon') && (!devFilter || devFilter.includes('icon'));
    if (wantIcon) {
      const iconSrc = resolveIconSource();
      if (!iconSrc) {
        console.error('  ⚠ icon istendi ama kaynak yok (config.icon ya da assets/icon-512.png/icon.png).');
      } else {
        const outFile = path.join(OUT, `${locName}_icon.png`);
        await sharp(iconSrc).resize(512, 512, { fit: 'cover' }).png().toFile(outFile);
        console.log(`  ✓ ${path.basename(outFile)}  (512×512 icon)`);
        count++;
      }
    }
  }

  console.log(`\n${count} görsel üretildi → ${OUT}`);
  // Dosya adları locale önekli üretildi → place-screenshots.js dili otomatik saptar;
  // tüm diller için TEK çağrı yeter (dile göre tekrar çağırma).
  console.log('Sırada: node place-screenshots.js --from ' + path.relative(process.cwd(), OUT) + ' --project . --patch-config');
}
main().catch((e) => { console.error(e); process.exit(1); });
