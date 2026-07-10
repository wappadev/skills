// Skor tabloları — Wappa "Score" entity'sine bağlı GERÇEK veri.
//
// Backend (Wappa MCP ile kuruldu):
//   • Entity  "Score"           → PlayerName, Score, Avatar, UserId, ScoreDate
//   • Query   "score-leaderboard" (GET)    → skora göre azalan liste; ?scoreDate ile günlük filtre
//   • Query   "submit-score"      (create)  → yeni skor kaydı ekler
//
// UI API çalıştırma yolu:  {apiUrl}/{site}/queries/{lang}/{name}/run

import { wappaAuthConfig } from './auth';

const API_URL = (wappaAuthConfig.apiUrl || '{{WAPPA_UI_API_URL}}').replace(/\/+$/, '');
const SITE = wappaAuthConfig.siteKey || '{{SITE_KEY}}';
const LANG = 'en-us'; // kolonlar çok dilli değil; yol segmenti için sabit dil yeterli

export type LeaderboardScope = 'daily' | 'all';

/** Giriş yapmış kullanıcıyı temsil eder (kendi satırını işaretlemek/skorunu göndermek için). */
export interface ScoreUser {
  userId: string;
  name: string;
  avatar?: string;
}

/** WappaUser → görünen ad (ad soyad, yoksa e-posta ön eki). */
export function userDisplayName(
  user: { firstname?: string; lastname?: string; email?: string } | null | undefined,
): string {
  if (!user) return 'Oyuncu';
  const full = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
  if (full) return full;
  return user.email ? user.email.split('@')[0] : 'Oyuncu';
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  avatar: string;
  online?: boolean;
  me?: boolean;
}

export interface LeaderboardRow extends LeaderboardEntry {
  rank: number;
}

// Backend'den dönen ham kayıt
interface ScoreRecord {
  id: string;
  playerName?: string;
  score?: number;
  avatar?: string;
  userId?: string;
  scoreDate?: string;
}

// Yerel tarih → "YYYY-MM-DD" (günlük tablo filtresi)
function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function runUrl(name: string, query = ''): string {
  return `${API_URL}/${SITE}/queries/${LANG}/${name}/run${query}`;
}

/**
 * Skor tablosunu getirir. scope='daily' → yalnızca bugünkü skorlar; 'all' → tüm zamanlar.
 * Aynı kullanıcının birden çok kaydı varsa en yükseği tutulur. `me` verilirse kendi satırı işaretlenir.
 */
export async function fetchLeaderboard(
  scope: LeaderboardScope,
  me?: ScoreUser,
): Promise<LeaderboardRow[]> {
  try {
    const q = scope === 'daily' ? `?scoreDate=${todayStr()}` : '';
    const res = await fetch(runUrl('score-leaderboard', q));
    if (!res.ok) return [];
    const json = await res.json();
    const records: ScoreRecord[] = Array.isArray(json?.data) ? json.data : [];

    // Kullanıcı başına (userId, yoksa isim) en yüksek skoru tut
    const bestByKey = new Map<string, ScoreRecord>();
    for (const r of records) {
      const key = (r.userId && r.userId.trim()) || `name:${r.playerName ?? ''}`;
      const prev = bestByKey.get(key);
      if (!prev || (r.score ?? 0) > (prev.score ?? 0)) bestByKey.set(key, r);
    }

    return Array.from(bestByKey.values())
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((r, i) => ({
        rank: i + 1,
        name: r.playerName || 'Anonim',
        score: r.score ?? 0,
        avatar: r.avatar || '🙂',
        me: !!me && !!r.userId && r.userId === me.userId,
      }));
  } catch {
    return [];
  }
}

/** Kullanıcının skorunu bugünün tarihiyle kaydeder. Başarılıysa true döner. */
export async function submitScore(input: {
  userId: string;
  name: string;
  score: number;
  avatar?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(runUrl('submit-score'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columns: [
          { name: 'playerName', data: { refs: [], value: input.name } },
          { name: 'score', data: { refs: [], value: input.score } },
          { name: 'avatar', data: { refs: [], value: input.avatar || '🙂' } },
          { name: 'userId', data: { refs: [], value: input.userId } },
          { name: 'scoreDate', data: { refs: [], value: todayStr() } },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
