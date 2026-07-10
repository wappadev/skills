// Basit tema — generic kabuk için tek varsayılan tema.
//
// Bu şablon KASITLI olarak oyun mantığından bağımsızdır. Kendi oyununun görsel
// diline göre burayı genişlet: çok temalı sistem, taş/karo renk paletleri,
// karanlık mod vb. Ekranlar yalnızca aşağıdaki alanları kullanır.

export interface Theme {
  /** Ekran arka planı */
  screenBg: string;
  /** Kart/panel arka planı */
  boardBg: string;
  /** Başlık metni rengi */
  titleText: string;
  /** İkincil/açıklama metni rengi */
  subText: string;
  /** Vurgu (aksiyon) rengi */
  accent: string;
  /** Koyu zemin üstü açık metin */
  textLight: string;
}

export const theme: Theme = {
  screenBg: '#faf8ef',
  boardBg: '#bbada0',
  titleText: '#776e65',
  subText: '#9c8f82',
  accent: '#f65e3b',
  textLight: '#f9f6f2',
};
