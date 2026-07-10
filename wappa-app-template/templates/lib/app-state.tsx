import React, { createContext, useContext } from 'react';

// Uygulama genelinde paylaşılan hafif durum: karşılama (welcome/onboarding)
// tamamlandı mı? Kök layout bunu AsyncStorage'dan okur; welcome ekranı bitince
// markWelcomeDone() ile günceller. Böylece reklam/push efektleri (kök layout'ta)
// karşılama sonrası tetiklenir ve index route'u yönlendirmeyi buna göre yapar.

export interface AppState {
  /** null = henüz okunmadı (flash önleme), false = ilk açılış, true = geçildi */
  welcomeDone: boolean | null;
  markWelcomeDone: () => void;
}

const Ctx = createContext<AppState>({
  welcomeDone: null,
  markWelcomeDone: () => {},
});

export const AppStateProvider = Ctx.Provider;
export const useAppState = () => useContext(Ctx);
