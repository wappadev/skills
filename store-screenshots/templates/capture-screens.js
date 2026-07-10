#!/usr/bin/env node
/**
 * capture-screens.js — Çalışan bir iOS simülatöründen / Android emülatöründen ham
 * ekran karelerini YAKALAR. İki mod:
 *
 *  1) Etiketli tek çekim (uygulamayı elle o ekrana getir, sonra çek):
 *       node capture-screens.js --platform ios --out ./raw --name welcome
 *
 *  2) Sıralı çoklu çekim (her ENTER'da bir kare; sen gezersin, o snap'ler):
 *       node capture-screens.js --platform ios --out ./raw --names welcome,game,boosters,compete,reward
 *     Terminal her isim için "ekranı hazırla ve ENTER'a bas" der.
 *
 *  --platform  ios | android
 *  --out       Ham PNG'lerin yazılacağı klasör (build-screenshots.js --raw bunu alır).
 *  --name      Tek kare adı (welcome → welcome.png).
 *  --names     Virgüllü liste; her biri için sırayla ENTER bekler.
 *
 * iOS  : xcrun simctl io booted screenshot  (booted bir simülatör gerekir)
 * Android: adb exec-out screencap -p        (tek cihaz/emülatör bağlı olmalı)
 *
 * NOT: Bu betik uygulamayı ekranlar arasında GEZDİRMEZ — o adımı sen yaparsın (ya da
 * Maestro akışı). Otomatik gezinme isteniyorsa Maestro flow'u tercih et; SKILL.md'ye bak.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) out[k] = true; else { out[k] = n; i++; } }
  }
  return out;
}
const args = parseArgs(process.argv);
if (args.help || args.h) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 25).join('\n').replace(/^ \*?/gm, '')); process.exit(0); }

const PLATFORM = args.platform === true ? null : args.platform;
if (!['ios', 'android'].includes(PLATFORM)) { console.error('Hata: --platform ios|android zorunlu.'); process.exit(1); }
const OUT = path.resolve(args.out === true || !args.out ? './raw' : args.out);
fs.mkdirSync(OUT, { recursive: true });

function snap(name) {
  const file = path.join(OUT, `${name}.png`);
  if (PLATFORM === 'ios') {
    execSync(`xcrun simctl io booted screenshot ${JSON.stringify(file)}`, { stdio: 'inherit' });
  } else {
    execSync(`adb exec-out screencap -p > ${JSON.stringify(file)}`, { stdio: ['ignore', 'ignore', 'inherit'], shell: '/bin/bash' });
  }
  const { width, height } = require('child_process').execSync ? sizeOf(file) : { width: '?', height: '?' };
  console.log(`  ✓ ${name}.png  (${width}×${height})`);
}

function sizeOf(file) {
  try {
    // PNG IHDR'den boyutu oku (bağımlılıksız)
    const b = fs.readFileSync(file);
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  } catch (_) { return { width: '?', height: '?' }; }
}

async function main() {
  if (args.name && args.name !== true) { snap(args.name); return; }
  const names = args.names && args.names !== true ? String(args.names).split(',').map((s) => s.trim()).filter(Boolean) : null;
  if (!names) { console.error('Hata: --name <ad> ya da --names a,b,c ver.'); process.exit(1); }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  console.log(`${PLATFORM} · ${names.length} kare çekilecek. Her adımda uygulamayı ilgili ekrana getir.\n`);
  for (const name of names) {
    await ask(`→ "${name}" ekranını hazırla, ENTER'a bas… `);
    snap(name);
  }
  rl.close();
  console.log(`\nHam kareler hazır → ${OUT}\nSırada: node build-screenshots.js --config ./screenshots.config.js --raw ${path.relative(process.cwd(), OUT)} --out ./export`);
}
main().catch((e) => { console.error(e); process.exit(1); });
