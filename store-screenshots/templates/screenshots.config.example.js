/**
 * screenshots.config.example.js — build-screenshots.js için slayt/başlık/tema tanımı.
 *
 * Bu dosyayı projenin köküne `screenshots.config.js` olarak kopyala ve DOLDUR.
 * Ajan (Claude) bunu senin yerine doldurabilir: kaynak ekranları (src/*Screen.js)
 * inceleyip hangi ekranın hangi slayta gireceğini ve üstündeki pazarlama başlığını önerir.
 *
 * - `raw`: --raw klasöründeki ham kare dosya adı (o ekranın simülatör/emülatör görüntüsü).
 * - `title` / `subtitle`: görselin üstüne yazılacak pazarlama metni (dile göre değişir).
 * - `badge`: (opsiyonel) küçük üst rozet, ör. "REKLAMSIZ", "TAMAMEN TÜRKÇE".
 * - `devices`: bu slaytın hangi mağaza boyutlarında üretileceği (slayt bazında ezme).
 * - `background`: tek renk = düz; iki renk = dikey gradyan.
 */

module.exports = {
  appName: 'Sweet Pop',
  // Play 512×512 mağaza ikonu kaynağı (opsiyonel; yoksa assets/icon-512.png|icon.png otomatik).
  icon: './assets/icon-512.png',

  // Her locale'de varsayılan üretilecek çıktılar (slaytta `devices` ile ezilebilir):
  //   iphone67 (1290×2796, zorunlu) · ipad13 (2064×2752, yalnız supportsTablet)
  //   android  (1080×1920 telefon)  · android7 (1200×1920, 7" tablet) · android10 (1600×2560, 10" tablet)
  //   feature  (1024×500 Play feature graphic) · icon (512×512 Play mağaza ikonu)
  devices: ['iphone67', 'ipad13', 'android', 'android7', 'android10', 'feature', 'icon'],

  locales: {
    tr: {
      textColor: '#ffffff',
      background: ['#ff6ea9', '#8a5cff'],
      slides: [
        // İlk 2 kare ASO'da en kritik — en güçlü faydayı buraya koy.
        { raw: 'welcome.png',  title: '1000 Tatlı Bölüm',    subtitle: 'Reklamsız & tamamen ücretsiz', badge: 'REKLAMSIZ' },
        { raw: 'game.png',     title: 'Patlat & Kombola',    subtitle: 'Özel şekerler, dev kombolar' },
        { raw: 'boosters.png', title: 'Güçlü Boosterlar',    subtitle: 'Çekiç, karıştır, ekstra hamle' },
        { raw: 'compete.png',  title: 'Lider Tablosu',       subtitle: 'Arkadaşlarını geç, zirveye çık' },
        { raw: 'reward.png',   title: 'Her Gün Hediye',      subtitle: 'Günlük ödüller ve canlar' },
      ],
      feature: { title: 'Sweet Pop', subtitle: 'Match-3 Şeker Bulmaca' },
    },

    'en-US': {
      textColor: '#ffffff',
      background: ['#ff6ea9', '#8a5cff'],
      slides: [
        { raw: 'welcome.png',  title: '1000 Sweet Levels',   subtitle: 'No ads, totally free', badge: 'NO ADS' },
        { raw: 'game.png',     title: 'Match & Blast',        subtitle: 'Special candies, huge combos' },
        { raw: 'boosters.png', title: 'Powerful Boosters',    subtitle: 'Hammer, shuffle, extra moves' },
        { raw: 'compete.png',  title: 'Leaderboard',          subtitle: 'Beat your friends to the top' },
        { raw: 'reward.png',   title: 'Daily Rewards',        subtitle: 'A free gift every single day' },
      ],
      feature: { title: 'Sweet Pop', subtitle: 'Match-3 Candy Puzzle' },
    },
  },
};
