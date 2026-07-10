---
name: wappa-leaderboard
description: >-
  Add a competition / leaderboard / high-score table (the "yarışma" feature) to an
  Expo / React Native game, backed by a real Wappa backend "Score" entity read and written
  through Wappa UI-API queries. Use when a game needs daily and all-time rankings, a
  "submit my score on a new personal best" flow, a per-user best-score table with the
  current player's row highlighted, and a login banner for anonymous players. Provides the
  client (game/leaderboard.ts: fetchLeaderboard, submitScore, userDisplayName) plus an
  example CompeteScreen. Depends on the wappa-mcp-backend skill (which creates the Score
  entity and the score-leaderboard / submit-score queries) and on wappa-auth (for the
  logged-in user's id and name). No extra npm dependencies — uses fetch.
---

# wappa-leaderboard — Wappa tabanlı yarışma / skor tablosu

Bir Expo oyununa **gerçek** (backend'e bağlı) yarışma özelliği ekler: günlük ve tüm
zamanlar sıralaması, kişisel rekor geldiğinde skoru gönderme, kendi satırını işaretleme
ve giriş yapmamış oyuncular için giriş bandı.

## 1. Amaç ve backend sözleşmesi

Skorlar Wappa panelindeki bir **`Score` entity**'sinde tutulur; okuma/yazma Wappa UI-API
sorguları ile yapılır. İstemci `fetch` dışında bir bağımlılık kullanmaz.

> **ÖNEMLİ:** Entity ve sorgular bu istemci çalışmadan ÖNCE **`wappa-mcp-backend`** skill'i
> ile oluşturulmalıdır. Aşağıdaki sözleşme `wappa-mcp-backend` ile birebir aynı olmalı —
> kolon ve sorgu adları backend ile paylaşılan kontrattır, değiştirilmemelidir.

**Entity `Score`** kolonları:

| Kolon (client key) | Panel adı  | Tip           | Açıklama                          |
| ------------------ | ---------- | ------------- | -------------------------------- |
| `playerName`       | PlayerName | text          | Görünen oyuncu adı               |
| `score`            | Score      | number        | Skor değeri                      |
| `avatar`           | Avatar     | text          | Emoji/avatar (örn. 🙂)           |
| `userId`           | UserId     | text          | Wappa kullanıcı id'si            |
| `scoreDate`        | ScoreDate  | text/date     | Yerel tarih "YYYY-MM-DD"         |

**Sorgular:**

- `score-leaderboard` (GET): skora göre **azalan** liste döndürür. İsteğe bağlı
  `?scoreDate=YYYY-MM-DD` parametresi ile günlük filtre uygular. Dönen gövde
  `{ data: ScoreRecord[] }` biçiminde beklenir.
- `submit-score` (create): tek bir `Score` satırı ekler.

**Çalıştırma yolu (run URL):**

```
{apiUrl}/{site}/queries/{lang}/{name}/run[?query]
```

- `{apiUrl}` → `wappaAuthConfig.apiUrl` (varsayılan `{{WAPPA_UI_API_URL}}`)
- `{site}`   → `wappaAuthConfig.siteKey` (varsayılan `{{SITE_KEY}}`)
- `{lang}`   → sabit `en-us`. Kolonlar çok dilli olmadığından yol segmenti için sabit dil
  yeterlidir (backend'de dil özel bir davranış tetiklemez).
- `{name}`   → `score-leaderboard` veya `submit-score`.

## 2. Kurulacak dosyalar

- `templates/game/leaderboard.ts` → projede **`game/leaderboard.ts`**. (Zorunlu istemci.)
- `templates/screens/CompeteScreen.tsx` → projede **`screens/CompeteScreen.tsx`**. (Örnek
  yarışma ekranı — kendi tasarımına uyarlayabilirsin. Örnekte `game/achievements` ve
  `game/themes`'e referanslar `wappa-games-template`'ten gelir; yarışma dışı sekmeleri
  çıkarabilirsin.)

Placeholder'ları doldur:

- `{{WAPPA_UI_API_URL}}` → Wappa UI-API tabanı (örn. `https://wappa-ui-api.appaflytech.com`)
- `{{SITE_KEY}}` → site key fallback'i.

Not: `game/leaderboard.ts`, `apiUrl` ve `siteKey` değerlerini **`./auth`** dosyasındaki
`wappaAuthConfig`'ten import eder (bkz. `wappa-auth`). Bu yüzden placeholder'lar yalnızca
fallback'tir; `game/auth.ts` doğru kurulduysa gerçek değerler oradan gelir.

## 3. API

`game/leaderboard.ts` üç şey dışa açar:

- `fetchLeaderboard(scope: 'daily' | 'all', me?: ScoreUser): Promise<LeaderboardRow[]>`
  - `scope='daily'` → yalnızca bugünkü (yerel tarih) skorlar (`?scoreDate=...`);
    `scope='all'` → tüm zamanlar.
  - Aynı kullanıcının (önce `userId`, yoksa isim) birden çok kaydı varsa **en yüksek**
    skorunu tutar (dedupe), skora göre azalan sıralar, `rank` atar.
  - `me` verilirse eşleşen `userId` satırına `me: true` koyar (kendi satırını
    highlight'lamak için).
- `submitScore({ userId, name, score, avatar? }): Promise<boolean>` — `submit-score`
  sorgusuna bugünün tarihiyle bir satır ekler; başarılıysa `true`.
- `userDisplayName(user)` — WappaUser'dan görünen ad üretir (ad soyad, yoksa e-posta ön
  eki, yoksa "Oyuncu").

Tipler: `ScoreUser { userId, name, avatar? }`, `LeaderboardRow { rank, name, score,
avatar, online?, me? }`, `LeaderboardScope = 'daily' | 'all'`.

## 4. Entegrasyon

### 4a. Yeni kişisel rekorda skor gönder (App.tsx)

Skoru **yalnızca** giriş yapılmışsa ve oyuncu yeni bir kişisel rekor yaptıysa gönder.
İki ref ile tekrar yazımı engelle:

- `preGameBestRef` — oyuna başlarken oyuncunun o anki global rekoru sabitlenir; skor bunu
  geçmezse rekor değildir, gönderilmez.
- `lastSubmittedRef` — bu oturumda gönderilen en yüksek skor; daha düşük/eşit skorların
  tekrar gönderilmesini önler.

```tsx
import { useWappaAuth } from '@appaflytech/wappa-auth';
import { submitScore, userDisplayName } from './game/leaderboard';

const { isAuthenticated, user } = useWappaAuth();
const preGameBestRef = useRef(0);   // oyuna girerken sabitlenir: preGameBestRef.current = totalBest
const lastSubmittedRef = useRef(0); // oturumda en son gönderilen skor

const handleGameEnd = useCallback(
  (_modeId: string, score: number) => {
    if (!isAuthenticated || !user || score <= 0) return;
    if (score <= preGameBestRef.current) return;   // rekor değil
    if (score <= lastSubmittedRef.current) return; // zaten gönderildi
    lastSubmittedRef.current = score;
    submitScore({
      userId: user.id,
      name: userDisplayName(user),
      score,
      avatar: '🙂',
    });
  },
  [isAuthenticated, user],
);
```

Oyuna girerken (mod seçiminde) `preGameBestRef.current = totalBest;` ata; `onGameEnd`'i
oyun ekranına geçir.

### 4b. Yarışma ekranı (CompeteScreen)

Ekran açılınca `daily` ve `all` tablolarını paralel çeker. Giriş yapılmışsa ve global en
iyi skor (`totalBest`), kullanıcının backend'deki mevcut en iyisini geçiyorsa bir kez
gönderir (`submittedRef` ile korunur), sonra tabloları tazeler. Kendi satırı `r.me` ile
işaretlenir ve highlight'lanır (örn. kenarlık).

```tsx
const me: ScoreUser | undefined =
  isAuthenticated && user
    ? { userId: user.id, name: userDisplayName(user), avatar: '🙂' }
    : undefined;

const [d, a] = await Promise.all([
  fetchLeaderboard('daily', me),
  fetchLeaderboard('all', me),
]);
```

### 4c. Giriş bandı

Giriş yapılmamışsa (`!authLoading && !isAuthenticated`) tablonun üstünde "Sıralamada yer
almak için giriş yap" bandı göster; dokununca giriş ekranını aç. Giriş akışı **`wappa-auth`**
skill'i ile gelir (`useWappaAuth`, LoginScreen).

## 5. Bağımlılıklar

- **`wappa-mcp-backend`** — `Score` entity'sini ve `score-leaderboard` / `submit-score`
  sorgularını Wappa MCP ile oluşturur. Bu skill onsuz çalışmaz (istemci sadece tüketir).
- **`wappa-auth`** — kullanıcı kimliği (`user.id`, ad) ve `game/auth.ts` içindeki
  `wappaAuthConfig` (`apiUrl`, `siteKey`). `game/leaderboard.ts` `./auth`'tan import eder.
- **`wappa-games-template`** — örnek CompeteScreen'in kullandığı tema/başarım altyapısı.
- Ek npm bağımlılığı **yok** — yalnızca `fetch` kullanılır.

## 6. Doğrulama

1. `wappa-mcp-backend` ile `Score` entity + iki sorgu kurulu olmalı.
2. Placeholder'ları doldur, `game/leaderboard.ts` ve (isteğe bağlı) CompeteScreen'i yerleştir.
3. Uygulamada giriş yap, bir oyun oyna ve **yeni bir kişisel rekor** kır → `submit-score`
   çağrılır; kayıt `score-leaderboard` sonucunda görünmeli (CompeteScreen'de kendi satırın
   highlight'lı).
4. Günlük sekmesi `?scoreDate=YYYY-MM-DD` (yerel tarih) ile filtreler → her gün sıfırlanır;
   bir sonraki gün önceki günün skorları günlük tabloda görünmez, "Tüm Zamanlar"da kalır.
5. Aynı kullanıcı birden çok skor gönderse bile tabloda kullanıcı başına yalnızca en yüksek
   skor tek satır olarak görünmeli (dedupe).
