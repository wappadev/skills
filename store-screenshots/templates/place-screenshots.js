#!/usr/bin/env node
/**
 * place-screenshots.js — app-store-screenshots editöründen dışa aktarılan (export)
 * mağaza görsellerini bu repo'nun store-assets düzenine YERLEŞTİRİR, sıralar,
 * boyutlarını DOĞRULAR ve isteğe bağlı store.config.json screenshots haritasını yamalar.
 *
 * Editör (ParthJadhav/app-store-screenshots) her kareyi mağaza boyutlarında PNG olarak
 * verir. Bu betik o PNG'leri boyutlarına bakıp doğru hedefe kopyalar:
 *
 *   1290×2796  → iOS iPhone 6.9"  → store/apple/screenshot/<iosLocale>/APP_IPHONE_67/NN.png
 *   2064×2752  → iOS iPad 13"     → store/apple/screenshot/<iosLocale>/APP_IPAD_PRO_3GEN_129/NN.png
 *   1080×1920  → Android telefon  → fastlane/metadata/android/<androidLocale>/images/phoneScreenshots/NN_*.png
 *   1024×500   → Android feature  → fastlane/metadata/android/<androidLocale>/images/featureGraphic.png
 *   512×512    → Android ikon     → fastlane/metadata/android/<androidLocale>/images/icon.png
 *
 * Kullanım:
 *   node place-screenshots.js --from ./export --locale tr [--project .] \
 *        [--ios-locale tr] [--android-locale tr-TR] \
 *        [--resize] [--patch-config] [--dry-run]
 *
 *   --from           Dışa aktarılan PNG'lerin klasörü (ZIP'i açtığın yer). ZORUNLU.
 *   --locale         Kısayol: hem iOS hem Android locale'ini türetir (tr→ios tr / android tr-TR).
 *   --ios-locale     iOS locale (store.config.json anahtarı ile aynı: tr, en-US ...). --locale'i ezer.
 *   --android-locale Android locale (Play tam kodu: tr-TR, en-US ...). --locale'i ezer.
 *   --project        Proje kökü (varsayılan: bulunduğun dizin).
 *   --resize         Boyut tam tutmuyorsa hedef boyuta 'cover' ile yeniden ölçekle (dikkatli kullan).
 *   --patch-config   store.config.json → apple.info.<iosLocale>.screenshots haritasını güncelle.
 *   --dry-run        Hiçbir dosya yazmadan ne yapılacağını yazdır.
 *
 * Dosya sırası: kaynak dosya adları alfabetik/numerik sıralanır; ilk 2 kare ASO'da en
 * kritik olduğundan editörde istediğin sırada 01-, 02- diye adlandır. NN önekiyle kopyalanır.
 *
 * sharp otomatik kurulur (proje bağımlılığı gerekmez): önce require('sharp'),
 * bulunamazsa ~/.cache/wappa-icons içine --no-save kurar ve oradan yükler.
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
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 38).join('\n').replace(/^ \*?/gm, ''));
  process.exit(0);
}

if (!args.from) {
  console.error('Hata: --from <export-klasörü> zorunlu. Yardım: node place-screenshots.js --help');
  process.exit(1);
}

const PROJECT = path.resolve(args.project === true || !args.project ? '.' : args.project);
const FROM = path.resolve(args.from);
const DRY = !!args['dry-run'];
const RESIZE = !!args.resize;

// iOS locale → Android locale kaba eşlemesi (gerektiğinde flag ile ez)
const LOCALE_MAP = { tr: 'tr-TR', 'en-US': 'en-US', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', ar: 'ar' };
const shortcut = args.locale && args.locale !== true ? args.locale : null;
const IOS_LOCALE = (args['ios-locale'] && args['ios-locale'] !== true) ? args['ios-locale'] : (shortcut || 'en-US');
const ANDROID_LOCALE = (args['android-locale'] && args['android-locale'] !== true)
  ? args['android-locale']
  : (LOCALE_MAP[shortcut] || LOCALE_MAP[IOS_LOCALE] || shortcut || 'en-US');

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

// ---------- hedef tanımları ----------
// tol: en-boy oranı korunacak; ufak (±%1) sapmalara izin ver, tam eşleşmede resize'a gerek yok.
const TARGETS = [
  { key: 'iphone67',  w: 1290, h: 2796, kind: 'ios-set',  dir: () => path.join(PROJECT, 'store', 'apple', 'screenshot', IOS_LOCALE, 'APP_IPHONE_67') },
  { key: 'ipad13',    w: 2064, h: 2752, kind: 'ios-set',  dir: () => path.join(PROJECT, 'store', 'apple', 'screenshot', IOS_LOCALE, 'APP_IPAD_PRO_3GEN_129') },
  { key: 'android',   w: 1080, h: 1920, kind: 'and-set',  dir: () => path.join(PROJECT, 'fastlane', 'metadata', 'android', ANDROID_LOCALE, 'images', 'phoneScreenshots') },
  { key: 'feature',   w: 1024, h: 500,  kind: 'and-file', file: () => path.join(PROJECT, 'fastlane', 'metadata', 'android', ANDROID_LOCALE, 'images', 'featureGraphic.png') },
  { key: 'icon',      w: 512,  h: 512,  kind: 'and-file', file: () => path.join(PROJECT, 'fastlane', 'metadata', 'android', ANDROID_LOCALE, 'images', 'icon.png') },
];

// Bir görüntü boyutunu en yakın hedefe eşle (en-boy oranına göre, ±%3 tolerans).
function matchTarget(w, h) {
  const ar = w / h;
  let best = null, bestErr = Infinity;
  for (const t of TARGETS) {
    const tar = t.w / t.h;
    const err = Math.abs(ar - tar) / tar;
    if (err < bestErr) { bestErr = err; best = t; }
  }
  return bestErr <= 0.03 ? best : null;
}

async function main() {
  if (!fs.existsSync(FROM)) { console.error(`Hata: --from klasörü yok: ${FROM}`); process.exit(1); }
  const files = fs.readdirSync(FROM)
    .filter((f) => /\.png$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!files.length) { console.error(`Hata: ${FROM} içinde PNG yok.`); process.exit(1); }

  console.log(`Proje: ${PROJECT}`);
  console.log(`iOS locale: ${IOS_LOCALE}   Android locale: ${ANDROID_LOCALE}`);
  console.log(`Kaynak: ${FROM}  (${files.length} PNG)${DRY ? '   [DRY-RUN]' : ''}\n`);

  const counters = {};   // hedef key başına sıra numarası
  const placed = { iphone67: [], ipad13: [], android: [], feature: [], icon: [] };
  const skipped = [];

  for (const f of files) {
    const src = path.join(FROM, f);
    const meta = await sharp(src).metadata();
    const target = matchTarget(meta.width, meta.height);
    if (!target) {
      skipped.push(`${f} (${meta.width}×${meta.height}) — bilinen bir mağaza boyutuna uymuyor`);
      continue;
    }

    const exact = meta.width === target.w && meta.height === target.h;
    let dest;
    if (target.kind === 'and-file') {
      dest = target.file();
    } else {
      counters[target.key] = (counters[target.key] || 0) + 1;
      const nn = String(counters[target.key]).padStart(2, '0');
      const base = target.kind === 'and-set' ? `${nn}_${path.parse(f).name}.png` : `${nn}.png`;
      dest = path.join(target.dir(), base);
    }

    const note = exact ? 'tam boyut' : (RESIZE ? `→ ${target.w}×${target.h} yeniden ölçekleniyor` : `⚠ boyut ${target.w}×${target.h} DEĞİL (--resize ile düzelt)`);
    console.log(`• ${f} (${meta.width}×${meta.height}) → ${path.relative(PROJECT, dest)}  [${note}]`);
    placed[target.key].push(dest);

    if (DRY) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (exact || !RESIZE) {
      // Boyut tamsa ya da resize istenmemişse ham kopyala (yeniden kodlama yok).
      fs.copyFileSync(src, dest);
    } else {
      await sharp(src).resize(target.w, target.h, { fit: 'cover', position: 'centre' }).png().toFile(dest);
    }
  }

  // ---------- özet ----------
  console.log('\n─── Özet ───');
  for (const t of TARGETS) {
    const arr = placed[t.key];
    if (arr.length) console.log(`  ${t.key.padEnd(9)} ${arr.length} dosya`);
  }
  if (skipped.length) {
    console.log('\n⚠ Atlananlar (boyut eşleşmedi):');
    skipped.forEach((s) => console.log('   - ' + s));
  }

  // ---------- zorunluluk uyarıları ----------
  const warn = [];
  if (!placed.iphone67.length) warn.push('iOS iPhone 6.9" (1290×2796) YOK — App Store için en az 1 zorunlu.');
  if (placed.android.length && placed.android.length < 2) warn.push('Android telefon görseli 1 tane — Play en az 2 ister.');
  if (placed.android.length && !placed.feature.length) warn.push('Android feature graphic (1024×500) YOK — Play zorunlu.');
  if (warn.length) { console.log('\n⚠ Eksikler:'); warn.forEach((w) => console.log('   - ' + w)); }

  // ---------- store.config.json yaması ----------
  if (args['patch-config'] && !DRY) patchConfig(placed);

  console.log('\nBitti.' + (DRY ? ' (dry-run — dosya yazılmadı)' : ''));
}

function patchConfig(placed) {
  const cfgPath = path.join(PROJECT, 'store.config.json');
  if (!fs.existsSync(cfgPath)) { console.log('\n(store.config.json yok — --patch-config atlandı)'); return; }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.apple = cfg.apple || {};
  cfg.apple.info = cfg.apple.info || {};
  const info = cfg.apple.info[IOS_LOCALE] = cfg.apple.info[IOS_LOCALE] || {};
  const rel = (p) => './' + path.relative(PROJECT, p).split(path.sep).join('/');
  const map = {};
  if (placed.iphone67.length) map.APP_IPHONE_67 = placed.iphone67.map(rel);
  if (placed.ipad13.length) map.APP_IPAD_PRO_3GEN_129 = placed.ipad13.map(rel);
  if (Object.keys(map).length) {
    info.screenshots = map;
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    console.log(`\n✓ store.config.json → apple.info.${IOS_LOCALE}.screenshots güncellendi.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
