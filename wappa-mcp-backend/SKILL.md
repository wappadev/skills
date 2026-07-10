---
name: wappa-mcp-backend
description: >-
  Wire the Wappa admin backend into a project through the Wappa MCP server and
  create backend entities & queries with the MCP tools. Use this when setting up
  the Wappa MCP server in a project (`.mcp.json` with @appaflytech/wappa-mcp),
  when creating Wappa backend models via MCP, when creating the leaderboard
  `Score` entity + `score-leaderboard` / `submit-score` queries that the
  `wappa-leaderboard` skill consumes, or when configuring Firebase (FCM/Android)
  and Apple APNs (iOS) push credentials on the Wappa panel for the
  `wappa-notifications` skill. Covers the MCP env vars, reloading MCP in Claude
  Code, and verifying models with the read-only MCP tools.
---

# Wappa MCP Backend

Bu skill, bir projeyi **Wappa admin backend**'ine `wappa-mcp` MCP sunucusu üzerinden
bağlar. Bağlandıktan sonra entity (tablo), query (veri çekme/yazma) ve push kimlik
bilgileri artık Claude Code içinden **MCP tool'ları** olarak yönetilir — panele elle
girmeye gerek kalmaz.

Kardeş skilller:
- **wappa-leaderboard** — buradaki `Score` entity'sini ve `score-leaderboard` /
  `submit-score` query'lerini `game/leaderboard.ts` üzerinden tüketen istemci.
- **wappa-notifications** — buradaki Firebase/APNs push kimliklerini kullanan bildirim tarafı.
- **wappa-games-template** — oyunu iskeletleyen ana şablon.

---

## 1. Amaç

Projeyi Wappa yönetim API'sine bağlamak; böylece:
- Backend modelleri (entity + query) MCP tool'larıyla oluşturulur/güncellenir.
- Leaderboard "Score" modelleri MCP üzerinden açılır (bu skill'in çekirdeği).
- Firebase (Android) ve APNs (iOS) push kimlikleri MCP ile panele yazılır.

İstemci kodu (`wappa-leaderboard`) bu query'leri şu **UI API çalıştırma yolu** ile çağırır:

```
{apiUrl}/{site}/queries/{lang}/{name}/run
```

Bu yüzden query **adları** ve kolon **alias**'ları birebir eşleşmek zorundadır.

---

## 2. `.mcp.json` kurulumu

`templates/.mcp.json` dosyasını proje köküne `.mcp.json` olarak kopyala ve
placeholder'ları doldur. Gerçek 2048 projesindeki dolu hali şu şekildeydi:

```json
{
  "mcpServers": {
    "{{SITE_KEY}}": {
      "command": "npx",
      "args": ["-y", "@appaflytech/wappa-mcp@latest"],
      "env": {
        "WAP_ADMIN_API_URL": "{{WAPPA_ADMIN_API_URL}}",
        "WAP_SITE_KEY": "{{SITE_KEY}}",
        "WAP_EMAIL": "{{WAP_EMAIL}}",
        "WAP_PASSWORD": "{{WAP_PASSWORD}}",
        "WAP_LANGUAGE": "en-us",
        "WAPPA_PROJECT_ROOT": "."
      }
    }
  }
}
```

Placeholder → gerçek değer örnekleri (2048 projesinden):
- `{{SITE_KEY}}` → `2048` — hem `WAP_SITE_KEY` hem de `mcpServers` altındaki sunucu
  anahtarı aynı site key'dir. Bu yüzden MCP tool adları `mcp__2048__wappa_*` biçiminde çıkar.
- `{{WAPPA_ADMIN_API_URL}}` → `https://wappa-admin-api.appaflytech.com`
- `{{WAP_EMAIL}}` → `can.ataman@glomil.com`
- `{{WAP_PASSWORD}}` → `123456`

### Env değişkenleri
| Değişken | Anlamı |
| --- | --- |
| `WAP_ADMIN_API_URL` | Wappa yönetim API kök adresi. MCP tüm yönetim çağrılarını buraya yapar. |
| `WAP_SITE_KEY` | Sitenin/oyunun benzersiz anahtarı (örn. `2048`). Tüm entity/query bu siteye açılır. |
| `WAP_EMAIL` | Panel yönetici e-postası (MCP giriş yapar). |
| `WAP_PASSWORD` | Panel yönetici parolası. |
| `WAP_LANGUAGE` | Admin oturum dili. `en-us` sabit bırak. |
| `WAPPA_PROJECT_ROOT` | MCP'nin proje kökü referansı. `"."` bırak (proje köküne göreli). |

> Not: İstemci (`game/leaderboard.ts`) **UI API**'yi (`https://wappa-ui-api.appaflytech.com`,
> `auth.ts` içindeki `apiUrl`) kullanır; `.mcp.json` ise **admin API**'yi kullanır. İkisi
> ayrı adreslerdir — karıştırma.

### MCP'yi Claude Code'da yeniden yükleme
`.mcp.json` ekledikten/değiştirdikten sonra Claude Code'a MCP sunucusunu tanıtman gerekir:
- Claude Code'u yeniden başlat, **veya** `/mcp` komutuyla sunucu durumunu gör/yeniden bağla.
- İlk çalıştırmada `npx` paketi indirir; kısa bir gecikme normaldir.
- Bağlanınca tool'lar `mcp__{{SITE_KEY}}__wappa_*` adıyla görünür (2048'de `mcp__2048__wappa_*`).

### Güvenlik notu (ÖNEMLİ)
`.mcp.json` **düz metin admin e-posta + parola** içerir. Paylaşılan bir repoda commit'lenirse
kimlik bilgileri sızar. Öneriler:
- `.mcp.json`'ı `.gitignore`'a ekle **veya** repoda yalnızca placeholder'lı bir örnek tut
  (`.mcp.json.example`) ve gerçek dosyayı lokal bırak.
- Mümkünse ayrı/az yetkili bir panel kullanıcısı kullan.
- Parolayı asla başka dosyalara/koda gömme.

---

## 3. Leaderboard modellerini MCP ile açma (çekirdek)

Hedef: `Score` entity'si + `score-leaderboard` (liste) ve `submit-score` (kayıt) query'leri.
Aşağıdaki reçete, **2048 projesindeki canlı modellerden birebir okunan** gerçek şemaya dayanır
(`mcp__2048__wappa_list_entities` ve `mcp__2048__wappa_list_queries` çıktıları).

> **Yaklaşım:** Bu adımları Claude'un MCP tool'larıyla **interaktif** yürütmesi en sağlıklısıdır.
> Yazmadan önce, benzer bir mevcut entity/query'yi `wappa_get_entity` / `wappa_get_query` ile
> okuyup argüman şeklini doğrula, sonra yaz. Aşağıdaki JSON'lar doğrulanmış birer checklist'tir;
> yine de call anında argüman şemasını canlı tool açıklamasından teyit et.

### 3a. Entity: `Score`
Tool: **`wappa_create_entity`**. Canlı `Score` entity'sinin kolonları:

| Kolon | type (enum) | Anlamı | nullable |
| --- | --- | --- | --- |
| `PlayerName` | `12` (Text) | Oyuncu görünen adı | `false` (zorunlu) |
| `Score` | `8` (Number) | Skor değeri | `false` (zorunlu) |
| `Avatar` | `12` (Text) | Emoji/avatar | `true` |
| `UserId` | `12` (Text) | Kullanıcı kimliği (kendi satırını işaretlemek için) | `true` |
| `ScoreDate` | `22` (DateOnly) | Skor tarihi `YYYY-MM-DD` (günlük filtre) | `true` |

`Order` (type `16`) ve `Id` kolonları backend tarafından **otomatik** eklenir — sen tanımlama.

`hasPageRelation`: `false`. Score bir "salt-veri" modelidir (her kaydın detay sayfası yoktur).
Bu alan **DEĞİŞTİRİLEMEZ** — yanlışlıkla `true` açarsan yeniden oluşturmak gerekir. Bu yüzden
`false` ver. `accessType`: `3` (yalnızca geçerli site).

Doğrulanmış argüman iskeleti (call anında `wappa_create_entity` açıklamasıyla teyit et):

```json
{
  "title": "Score",
  "table": "Score",
  "hasPageRelation": false,
  "accessType": 3,
  "columns": [
    { "name": "PlayerName", "title": "Oyuncu Adı", "type": 12, "nullable": false, "isVisualized": true },
    { "name": "Score",      "title": "Skor",       "type": 8,  "nullable": false },
    { "name": "Avatar",     "title": "Avatar",      "type": 12, "nullable": true },
    { "name": "UserId",     "title": "Kullanıcı ID","type": 12, "nullable": true },
    { "name": "ScoreDate",  "title": "Skor Tarihi", "type": 22, "nullable": true }
  ]
}
```

> Tip enum'ları `wappa_create_entity` açıklamasında listelenir (12=Text, 8=Number, 22=DateOnly,
> 16=Order, 2=Date vb.). `ScoreDate` için `22` (DateOnly) kullanıldı; istemci `YYYY-MM-DD` string
> gönderiyor. Tarih tipini `Date`(2) yapmak istersen istemci formatını da uyumla.

### 3b. Query: `score-leaderboard` (liste, GET)
Tool: **`wappa_create_query`**. Canlı tanımın özü:
- `name`: `score-leaderboard` (istemci bu adı çağırır — **birebir**), `title`: `Skor Tablosu`.
- `httpMethod`: `GET`, `type`: `application`, `version`: `v2`.
- **Parametre:** `scoreDate` (refType `22` = DateOnly, `type: "parameter"`). Opsiyoneldir.
- **fields:** her `Score.*` kolonu, istemcinin beklediği **alias**'larla:
  `Score.PlayerName→playerName`, `Score.Score→score`, `Score.Avatar→avatar`,
  `Score.UserId→userId`, `Score.ScoreDate→scoreDate`, ayrıca `Score.Id→Id`.
- **orders:** `Score.Score` **desc** (skora göre azalan).
- **where:** `Score.ScoreDate` `equal` → `scoreDate` parametresi, `isRequired: false`
  (parametre gelmezse filtre uygulanmaz → tüm zamanlar; gelirse günlük filtre).
- **pagination:** `pageSize` 100. **response.type:** `multiple`.

Doğrulanmış `schema` gövdesi (entityId'yi 3a'da oluşturduğun Score'un GUID'iyle değiştir):

```json
{
  "name": "score-leaderboard",
  "title": "Skor Tablosu",
  "type": "application",
  "version": "v2",
  "httpMethod": "GET",
  "parameters": [
    { "name": "scoreDate", "source": { "refType": 22, "type": "parameter", "ref": null, "multiple": false }, "isPrivate": false }
  ],
  "schema": {
    "entityId": "<SCORE_ENTITY_GUID>",
    "fields": [
      { "column": "Score.PlayerName", "name": "Score.PlayerName", "alias": "playerName" },
      { "column": "Score.Score",      "name": "Score.Score",      "alias": "score" },
      { "column": "Score.Avatar",     "name": "Score.Avatar",     "alias": "avatar" },
      { "column": "Score.UserId",     "name": "Score.UserId",     "alias": "userId" },
      { "column": "Score.ScoreDate",  "name": "Score.ScoreDate",  "alias": "scoreDate" },
      { "column": "Score.Id",         "name": "Score.Id",         "alias": "Id" }
    ],
    "orders": [
      { "column": "Score.Score", "name": "Score.Score", "source": { "refType": 8, "type": "static", "ref": "desc", "multiple": false } }
    ],
    "where": {
      "condition": "and",
      "rules": [
        { "column": "Score.ScoreDate", "field": "Score.ScoreDate", "type": "rule", "condition": "and",
          "operator": "equal", "isRequired": false,
          "source": { "refType": 22, "type": "parameter", "ref": "scoreDate", "multiple": false } }
      ]
    },
    "pagination": { "pageIndex": 0, "pageSize": 100 },
    "concats": [],
    "authorizationRequired": false,
    "onlyOwner": false
  },
  "response": { "type": "multiple", "parameters": [], "data": [] }
}
```

İstemci çağrısı: `GET {apiUrl}/{site}/queries/en-us/score-leaderboard/run` ve günlük için
`?scoreDate=YYYY-MM-DD`. Yanıt `json.data` içinde `playerName/score/avatar/userId/scoreDate` alias'lı kayıtlar döner.

### 3c. Query: `submit-score` (kayıt/insert)
Tool: **`wappa_create_query`**. Canlı tanımın özü:
- `name`: `submit-score` (**birebir**), `title`: `Skor Gönder`. `type`: `application`, `version`: `v2`.
- **response.type:** `single`. `orders`/`where`: `null`.
- **Parametreler:** `playerName`(12), `score`(8), `avatar`(12), `userId`(12), `scoreDate`(22).
- **fields:** her kolon karşılık gelen parametreden beslenir (`source.type: "parameter"`, `ref: <param>`).
- **httpMethod:** ⚠️ canlı kayıtta bu alanın değeri **`"create"`** olarak görüldü (standart GET/POST
  değil — insert/create query'si). `wappa_create_query` tool'unun `httpMethod` enum'u
  `GET|POST|PUT|DELETE` listeler; **bu bir tutarsızlıktır**. Bu yüzden bu query'yi körlemesine yazma:
  önce mevcut bir insert/create query'sini `wappa_get_query` ile aç, `httpMethod`/alan yapısını
  **call anında doğrula** ve aynı kalıbı kullan. Emin değilsen operatörü/`wappa_get_query`'yi bu
  değeri teyit için kullanmaya yönlendir — uydurma.

Doğrulanmış `schema`/parametre gövdesi (httpMethod'u call anında teyit et):

```json
{
  "name": "submit-score",
  "title": "Skor Gönder",
  "type": "application",
  "version": "v2",
  "parameters": [
    { "name": "playerName", "source": { "refType": 12, "type": "parameter", "ref": null, "multiple": false }, "isPrivate": false },
    { "name": "score",      "source": { "refType": 8,  "type": "parameter", "ref": null, "multiple": false }, "isPrivate": false },
    { "name": "avatar",     "source": { "refType": 12, "type": "parameter", "ref": null, "multiple": false }, "isPrivate": false },
    { "name": "userId",     "source": { "refType": 12, "type": "parameter", "ref": null, "multiple": false }, "isPrivate": false },
    { "name": "scoreDate",  "source": { "refType": 22, "type": "parameter", "ref": null, "multiple": false }, "isPrivate": false }
  ],
  "schema": {
    "entityId": "<SCORE_ENTITY_GUID>",
    "fields": [
      { "column": "Score.PlayerName", "name": "Score.PlayerName", "alias": "playerName", "source": { "refType": 12, "type": "parameter", "ref": "playerName", "multiple": false } },
      { "column": "Score.Score",      "name": "Score.Score",      "alias": "score",      "source": { "refType": 8,  "type": "parameter", "ref": "score",      "multiple": false } },
      { "column": "Score.Avatar",     "name": "Score.Avatar",     "alias": "avatar",     "source": { "refType": 12, "type": "parameter", "ref": "avatar",     "multiple": false } },
      { "column": "Score.UserId",     "name": "Score.UserId",     "alias": "userId",     "source": { "refType": 12, "type": "parameter", "ref": "userId",     "multiple": false } },
      { "column": "Score.ScoreDate",  "name": "Score.ScoreDate",  "alias": "scoreDate",  "source": { "refType": 22, "type": "parameter", "ref": "scoreDate",  "multiple": false } }
    ],
    "orders": null,
    "where": null,
    "pagination": { "pageIndex": 0, "pageSize": 10 },
    "concats": [],
    "authorizationRequired": false,
    "onlyOwner": false
  },
  "response": { "type": "single", "parameters": [], "data": null }
}
```

İstemci çağrısı: `POST {apiUrl}/{site}/queries/en-us/submit-score/run`, gövde:

```json
{ "columns": [
  { "name": "playerName", "data": { "refs": [], "value": "<ad>" } },
  { "name": "score",      "data": { "refs": [], "value": 1234 } },
  { "name": "avatar",     "data": { "refs": [], "value": "🙂" } },
  { "name": "userId",     "data": { "refs": [], "value": "<id>" } },
  { "name": "scoreDate",  "data": { "refs": [], "value": "2026-07-09" } }
] }
```

> **Ad/alias uyumu kritik:** İstemci gövdesindeki `name` değerleri (`playerName`, `score`, `avatar`,
> `userId`, `scoreDate`) query parametre adlarıyla; okuma alias'ları da field alias'larıyla birebir
> eşleşmeli. Query `name`'i (`score-leaderboard`, `submit-score`) de `game/leaderboard.ts`'deki
> `runUrl(name)` çağrılarıyla birebir eşleşmeli. Herhangi bir isim uyuşmazlığı sessiz boş sonuç
> veya 404 üretir.

---

## 4. Push kimlikleri (wappa-notifications için)

Panelden push gönderebilmek için sitenin Firebase (Android) ve APNs (iOS) kimliklerini MCP ile yaz.

### 4a. Firebase / FCM (Android) — `wappa_set_firebase_credential`
- `siteKey`: `{{SITE_KEY}}`
- `serviceAccountJson`: Firebase Console → Proje Ayarları → **Service accounts** → "Generate new
  private key" ile inen JSON dosyasının **tam içeriği** (string). Şifreli saklanır.

```
wappa_set_firebase_credential(siteKey="{{SITE_KEY}}", serviceAccountJson="<service-account.json içeriği>")
```

### 4b. Apple APNs (iOS) — `wappa_set_apns_credential`
- `siteKey`: `{{SITE_KEY}}`
- `keyId`: APNs Key ID, `teamId`: Apple Team ID, `bundleId`: uygulama bundle id.
- `privateKey`: Apple Developer → Keys'ten inen **.p8** Auth Key dosyasının PEM içeriği (string).
- `useSandbox`: dev/Xcode derlemeleri için `true`; TestFlight/App Store için `false`.

```
wappa_set_apns_credential(siteKey="{{SITE_KEY}}", keyId="<KEYID>", teamId="<TEAMID>",
  bundleId="<bundle.id>", privateKey="<.p8 PEM>", useSandbox=false)
```

Durum kontrolü (gizli anahtar dönmez): `wappa_get_firebase_credential` / `wappa_get_apns_credential`.
Bildirim gönderimi ve token istatistikleri **wappa-notifications** skill'inde; ilgili tool'lar
`wappa_send_notification`, `wappa_get_notification_history`, `wappa_get_push_token_stats`.

---

## 5. Doğrulama

1. **Entity var mı:** `wappa_list_entities(table="Score")` → `Score` ve kolonları (PlayerName,
   Score, Avatar, UserId, ScoreDate + otomatik Order/Id) dönmeli. Detay için
   `wappa_get_entity(id=<GUID>)`.
2. **Query'ler var mı:** `wappa_list_queries(name="score-leaderboard")` ve
   `wappa_list_queries(name="submit-score")`. Response alias/queryMap'leri istemcinin beklediği
   camelCase alanlarla eşleşmeli.
3. **Liste çalışıyor mu:** `wappa_run_query(name="score-leaderboard")` (tüm zamanlar) ve
   `wappa_run_query(name="score-leaderboard", queryParams={"scoreDate":"YYYY-MM-DD"})` (günlük).
   `wappa_run_query` yalnızca **GET** query'ler içindir; `submit-score` insert olduğundan bununla
   test edilmez (bunun için `wappa_run_query_with_body`/`wappa_run_query_form` gerekir — call
   anında doğrula) ya da doğrudan istemciden test et.
4. **İstemciden uçtan uca:** `wappa-leaderboard` skill'inin oyununda skor gönder → skor tablosunda
   göründüğünü doğrula.

---

## Notlar / doğrulanma durumu
- Entity `Score` ve query `score-leaderboard` / `submit-score` şemaları **2048 projesinin canlı
  backend'inden birebir okundu** (`wappa_list_entities`, `wappa_list_queries`) — kolon tipleri,
  alias'lar, sıralama, where kuralı ve pagination gerçek değerlerdir.
- `submit-score` için canlı `httpMethod` değeri **`"create"`** görüldü; `wappa_create_query`
  tool'unun `httpMethod` enum'u ise `GET|POST|PUT|DELETE`. Bu tutarsızlık yüzünden insert query'sini
  yazmadan önce mevcut bir insert query'sini `wappa_get_query` ile inceleyip kalıbı **call anında
  teyit et**.
- `wappa_create_entity` / `wappa_create_query` için buradaki JSON'lar canlı okunan yapıdan türetilmiş
  minimal iskeletlerdir; tam argüman şemasını her zaman ilgili tool'un canlı açıklamasından doğrula
  (özellikle `columns[].settings`, `customizations` gibi opsiyonel alanlar backend tarafından
  otomatik doldurulabilir).
