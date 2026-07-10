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
 * ÇOK DİLLİ: build-screenshots.js çıktısı locale'i dosya adına gömdüğü için
 * (ör. en-US_android_01.png, tr_feature.png), bu betik her kareyi adından saptayıp
 * DOĞRU dile yerleştirir. Yani TÜM diller için TEK çağrı yeter — --locale'i dile göre
 * tekrar tekrar çağırmaya GEREK YOK (aksi eski davranış, hepsini tek dile yığıp Play'in
 * "dil başına 8 görsel" limitini aşıyordu). --locale yalnızca önekisiz export'ta yedektir.
 *
 * Kullanım:
 *   node place-screenshots.js --from ./export --project . [--patch-config] [--resize] [--dry-run]
 *   # önekisiz (eski editör) export için dili elle ver:
 *   node place-screenshots.js --from ./export --locale tr [--ios-locale tr] [--android-locale tr-TR]
 *
 *   --from           Dışa aktarılan PNG'lerin klasörü (ZIP'i açtığın yer). ZORUNLU.
 *   --locale         Yedek: dosya adında locale yoksa hem iOS hem Android locale'ini türetir.
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
// Hedef klasörler locale-parametrik: aynı export içindeki farklı diller doğru klasöre gider.
const DEVICE_KEYS = ['iphone67', 'ipad13', 'android', 'feature', 'icon'];
const iosDir = (ios, sub) => path.join(PROJECT, 'store', 'apple', 'screenshot', ios, sub);
const andImg = (and) => path.join(PROJECT, 'fastlane', 'metadata', 'android', and, 'images');

const TARGETS = [
  { key: 'iphone67', w: 1290, h: 2796, kind: 'ios-set',  dir: (ios) => iosDir(ios, 'APP_IPHONE_67') },
  { key: 'ipad13',   w: 2064, h: 2752, kind: 'ios-set',  dir: (ios) => iosDir(ios, 'APP_IPAD_PRO_3GEN_129') },
  { key: 'android',  w: 1080, h: 1920, kind: 'and-set',  dir: (ios, and) => path.join(andImg(and), 'phoneScreenshots') },
  { key: 'feature',  w: 1024, h: 500,  kind: 'and-file', file: (ios, and) => path.join(andImg(and), 'featureGraphic.png') },
  { key: 'icon',     w: 512,  h: 512,  kind: 'and-file', file: (ios, and) => path.join(andImg(and), 'icon.png') },
];

// build-screenshots.js çıktısı locale'i dosya adına gömer:
//   "<loc>_<device>_<nn>.png"  ve  "<loc>_feature.png"   (ör. en-US_android_01.png)
// İlk cihaz belirtecinden ÖNCEki kısım locale'dir; böylece ÇOK DİLLİ export'ta her kare
// DOĞRU dile yönlendirilir. (Aksi halde hepsi tek klasöre yığılır → Play "8 görselden fazla"
// hatası.) Locale saptanamazsa (önekisiz eski editör export'u) --locale bayrağına düşülür.
function detectLocale(filename) {
  const parts = path.parse(filename).name.split('_');
  const di = parts.findIndex((p) => DEVICE_KEYS.includes(p));
  return di > 0 ? parts.slice(0, di).join('_') : null;
}

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

  const counters = {};   // "<loc>:<key>" başına sıra numarası (dile göre 01'den başlar)
  const placed = [];     // { key, dest, iosLocale, androidLocale, loc }
  const skipped = [];

  for (const f of files) {
    const src = path.join(FROM, f);
    const meta = await sharp(src).metadata();
    const target = matchTarget(meta.width, meta.height);
    if (!target) {
      skipped.push(`${f} (${meta.width}×${meta.height}) — bilinen bir mağaza boyutuna uymuyor`);
      continue;
    }

    // Dosya adından locale'i sapta; yoksa bayraklardan gelen varsayılana düş.
    const loc = detectLocale(f);
    const iosLocale = loc || IOS_LOCALE;
    const androidLocale = loc ? (LOCALE_MAP[loc] || loc) : ANDROID_LOCALE;

    const exact = meta.width === target.w && meta.height === target.h;
    let dest;
    if (target.kind === 'and-file') {
      dest = target.file(iosLocale, androidLocale);
    } else {
      const ck = `${loc || '_'}:${target.key}`;
      counters[ck] = (counters[ck] || 0) + 1;
      const nn = String(counters[ck]).padStart(2, '0');
      const dir = target.kind === 'and-set' ? target.dir(iosLocale, androidLocale) : target.dir(iosLocale);
      dest = path.join(dir, `${nn}.png`);
    }

    const locTag = loc ? `[${loc}] ` : '';
    const note = exact ? 'tam boyut' : (RESIZE ? `→ ${target.w}×${target.h} yeniden ölçekleniyor` : `⚠ boyut ${target.w}×${target.h} DEĞİL (--resize ile düzelt)`);
    console.log(`• ${locTag}${f} (${meta.width}×${meta.height}) → ${path.relative(PROJECT, dest)}  [${note}]`);
    placed.push({ key: target.key, dest, iosLocale, androidLocale, loc });

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
  const byKey = (k) => placed.filter((p) => p.key === k);
  console.log('\n─── Özet ───');
  for (const t of TARGETS) {
    const arr = byKey(t.key);
    if (!arr.length) continue;
    const locs = [...new Set(arr.map((p) => p.loc || IOS_LOCALE))].join(', ');
    console.log(`  ${t.key.padEnd(9)} ${arr.length} dosya  (${locs})`);
  }
  if (skipped.length) {
    console.log('\n⚠ Atlananlar (boyut eşleşmedi):');
    skipped.forEach((s) => console.log('   - ' + s));
  }

  // ---------- zorunluluk + limit denetimi (dile göre) ----------
  const warn = [];
  const hardErrors = [];
  if (!byKey('iphone67').length) warn.push('iOS iPhone 6.9" (1290×2796) YOK — App Store için en az 1 zorunlu.');

  // Android telefon görsellerini DİLE göre grupla: Play dil başına 2–8 görsel ister.
  const andByLocale = {};
  byKey('android').forEach((p) => { (andByLocale[p.androidLocale] ||= []).push(p); });
  const featureLocales = new Set(byKey('feature').map((p) => p.androidLocale));
  for (const [aloc, arr] of Object.entries(andByLocale)) {
    if (arr.length < 2) warn.push(`Android '${aloc}' dilinde ${arr.length} telefon görseli — Play en az 2 ister.`);
    if (arr.length > 8) hardErrors.push(`Android '${aloc}' dilinde ${arr.length} telefon görseli — Play EN FAZLA 8 kabul eder.`);
    if (!featureLocales.has(aloc)) warn.push(`Android '${aloc}' feature graphic (1024×500) YOK — Play zorunlu.`);
  }

  if (warn.length) { console.log('\n⚠ Eksikler:'); warn.forEach((w) => console.log('   - ' + w)); }
  if (hardErrors.length) {
    console.log('\n❌ Play limiti aşıldı (yükleme reddedilir — dosyaları dile ayır):');
    hardErrors.forEach((e) => console.log('   - ' + e));
    process.exitCode = 1; // yerel çalıştırmada CI'dan ÖNCE fark edilsin
  }

  // ---------- store.config.json yaması ----------
  if (args['patch-config'] && !DRY) patchConfig(placed);

  console.log('\nBitti.' + (DRY ? ' (dry-run — dosya yazılmadı)' : '') + (hardErrors.length ? '  ⚠ Play limiti hatası var (exit 1)' : ''));
}

function patchConfig(placed) {
  const cfgPath = path.join(PROJECT, 'store.config.json');
  if (!fs.existsSync(cfgPath)) { console.log('\n(store.config.json yok — --patch-config atlandı)'); return; }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.apple = cfg.apple || {};
  cfg.apple.info = cfg.apple.info || {};
  const rel = (p) => './' + path.relative(PROJECT, p).split(path.sep).join('/');

  // iOS görsellerini iOS locale'ine göre grupla → her dilin kendi haritası güncellenir.
  const iosLocales = [...new Set(
    placed.filter((p) => p.key === 'iphone67' || p.key === 'ipad13').map((p) => p.iosLocale)
  )];
  let touched = 0;
  for (const loc of iosLocales) {
    const info = cfg.apple.info[loc] = cfg.apple.info[loc] || {};
    const map = {};
    const ip = placed.filter((p) => p.key === 'iphone67' && p.iosLocale === loc).map((p) => rel(p.dest));
    const id = placed.filter((p) => p.key === 'ipad13' && p.iosLocale === loc).map((p) => rel(p.dest));
    if (ip.length) map.APP_IPHONE_67 = ip;
    if (id.length) map.APP_IPAD_PRO_3GEN_129 = id;
    if (Object.keys(map).length) { info.screenshots = map; touched++; }
  }
  if (touched) {
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    console.log(`\n✓ store.config.json → ${iosLocales.join(', ')} için apple.info.<loc>.screenshots güncellendi.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
