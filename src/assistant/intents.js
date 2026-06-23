// Saf niyet kayıt defteri + çözücü — Vue/router/store importu YOK (test edilebilir).
// "AI" burada deterministik, kural-tabanlı bir eşleyicidir (LLM yok).

// Türkçe karakterleri ascii'ye indirger + küçük harfe çevirir (eşleşme toleransı için).
export function normalize(input = '') {
  return String(input)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ') // noktalama → boşluk
    .replace(/\s+/g, ' ')
    .trim()
}

// type: 'navigate' (payload=path) | 'data' (payload=veri anahtarı) | 'info' (payload=cevap metni) | 'help'
// keywords ascii-normalize edilmiş halde tutulur; daha uzun/özel ifadeler skorda ağır basar.
export const INTENTS = [
  // ---------- Canlı veri (navigasyondan ÖNCE; daha spesifik ifadeler) ----------
  {
    id: 'data.patients',
    type: 'data',
    payload: 'patients',
    keywords: ['kac hasta', 'hasta sayisi', 'kac kayitli hasta', 'toplam hasta', 'kac tane hasta'],
  },
  {
    id: 'data.pendingConsents',
    type: 'data',
    payload: 'pendingConsents',
    keywords: ['imza bekleyen', 'bekleyen onam', 'imza bekleyen onam', 'kac onam bekliyor', 'bekleyen imza'],
  },
  {
    id: 'data.signedConsents',
    type: 'data',
    payload: 'signedConsents',
    keywords: ['imzalanan onam', 'imzali onam', 'kac onam imzalandi', 'tamamlanan onam'],
  },
  {
    id: 'data.lowStock',
    type: 'data',
    payload: 'lowStock',
    keywords: ['kritik stok', 'az kalan', 'stok uyari', 'dusuk stok', 'azalan malzeme', 'stok azaldi'],
  },

  // ---------- Navigasyon ----------
  {
    id: 'nav.overview',
    type: 'navigate',
    payload: '/dashboard/overview',
    keywords: ['kontrol panel', 'panele git', 'ana ekran', 'anasayfa', 'dashboard', 'panel'],
  },
  {
    id: 'nav.consents',
    type: 'navigate',
    payload: '/dashboard/consents',
    keywords: ['onamlar', 'onam belgesi', 'onam sayfa', 'dijital onam', 'onama git', 'onam'],
  },
  {
    id: 'nav.patients',
    type: 'navigate',
    payload: '/dashboard/crm',
    keywords: ['hasta crm', 'hastalar', 'hasta listesi', 'crm', 'hastalara git', 'hasta'],
  },
  {
    id: 'nav.inventory',
    type: 'navigate',
    payload: '/dashboard/inventory',
    keywords: ['envanter', 'malzeme', 'stok sayfa', 'stoga git', 'stok', 'depo'],
  },
  {
    id: 'nav.mhrs',
    type: 'navigate',
    payload: '/dashboard/mhrs-sync',
    keywords: ['mhrs', 'randevu esitleme', 'randevu', 'esitleme', 'mhrs sayfa'],
  },
  {
    id: 'nav.profile',
    type: 'navigate',
    payload: '/dashboard/profile',
    keywords: ['profilim', 'profil', 'hesabim'],
  },
  {
    id: 'nav.settings',
    type: 'navigate',
    payload: '/dashboard/settings',
    keywords: ['ayarlar', 'ayar sayfa', 'tercihler', 'sistem ayar'],
  },

  // ---------- Ürün bilgisi (şablon) ----------
  {
    id: 'info.mhrs',
    type: 'info',
    payload:
      'MHRS Randevu Eşitleme, Merkezi Hekim Randevu Sistemi ile randevuları, hekim sırasını ve hasta listelerini anlık olarak eşitler.',
    keywords: ['mhrs nedir', 'mhrs ne', 'esitleme nedir', 'randevu nasil'],
  },
  {
    id: 'info.kvkk',
    type: 'info',
    payload:
      'Onam formları KVKK uyumlu şekilde şifreli arşivlenir; veri güvenliği ve TLS 1.3 şifreleme ile hasta verileri korunur.',
    keywords: ['kvkk', 'veri guvenli', 'gizlilik', 'sifreleme'],
  },
  {
    id: 'info.esignature',
    type: 'info',
    payload:
      'Yasal e-İmza ile hasta, tablet veya mobilde parmak ya da kalemle zaman damgalı, hukuken geçerli dijital imza atar.',
    keywords: ['e imza', 'eimza', 'imza nedir', 'dijital imza nedir', 'imza nasil'],
  },
  {
    id: 'info.stock',
    type: 'info',
    payload:
      'Klinik Stok Takibi, kritik ameliyat malzemelerini ve implantları barkodla izler; stok limitin altına düşünce uyarı verir.',
    keywords: ['stok takibi nedir', 'envanter nedir', 'stok nasil'],
  },
  {
    id: 'info.crm',
    type: 'info',
    payload:
      'Akıllı Hasta CRM; tıbbi dosya, onam geçmişi ve iletişim kayıtlarını tek panelden yönetmenizi sağlar.',
    keywords: ['crm nedir', 'hasta yonetimi nedir', 'hasta kayit nasil'],
  },

  // ---------- Yardım ----------
  {
    id: 'help',
    type: 'help',
    payload: null,
    keywords: ['ne yapabilir', 'neler yapabilir', 'yardim', 'nasil kullan', 'komutlar', 'ne yapabilirsin'],
  },
]

// Uzunluk-ağırlıklı skorlama: eşleşen keyword'lerin uzunlukları toplanır;
// daha spesifik (uzun) ifadeler genel kelimelere baskın gelir.
export function resolveIntent(utterance, intents = INTENTS) {
  const norm = normalize(utterance)
  if (!norm) return null
  let best = null
  let bestScore = 0
  for (const intent of intents) {
    let score = 0
    for (const kw of intent.keywords) {
      if (norm.includes(kw)) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      best = intent
    }
  }
  return bestScore > 0 ? best : null
}
