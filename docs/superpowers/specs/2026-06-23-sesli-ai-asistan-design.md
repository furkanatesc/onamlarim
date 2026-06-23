# Sesli AI Asistan (Chatbox) — Tasarım Spec'i

**Tarih:** 2026-06-23
**Durum:** Onaylandı, implementasyona hazır
**Kapsam:** Dashboard'a gömülü, sesli (mikrofonlu) kural-tabanlı asistan widget'ı

---

## 1. Amaç

Dashboard içinde, kullanıcının **sesle veya yazıyla** etkileşebildiği bir mini asistan. Üç iş yapar:

1. **Navigasyon** — "hastalara git" gibi komutlarla sayfa değiştirir.
2. **Canlı veri** — "kaç hasta var", "kritik stok", "imza bekleyen onam" gibi soruları Pinia store'lardan gerçek veriyle yanıtlar.
3. **Ürün bilgisi** — "MHRS nedir", "KVKK", "e-imza" gibi soruları şablon bilgi tabanından yanıtlar.

Backend yoktur; her şey tarayıcıda çalışır. "AI" deterministik, kural-tabanlı bir niyet çözücüdür (LLM yok).

## 2. Kapsam Dışı (YAGNI)

- Gerçek LLM / serbest metin üretimi.
- Bağlam hafızası / çok-adımlı diyalog ("peki ya stok?" gibi takipler).
- Landing veya global gösterim (yalnızca dashboard).
- Sunucu tarafı, kimlik doğrulama, kalıcılık (mesaj geçmişi oturumla sınırlı, in-memory).

## 3. Mimari

Dört bağımsız birim + bir montaj noktası.

### 3.1 `src/assistant/intents.js` — Niyet kayıt defteri (saf)
- Niyetlerin dışa aktarılan bir dizisi. Her niyet:
  ```js
  {
    id: 'nav.patients',
    keywords: ['hasta', 'hastalar', 'crm', 'hasta listesi'],
    type: 'navigate',            // 'navigate' | 'data' | 'info' | 'help'
    payload: '/dashboard/crm',   // navigate: path | data/info: handler anahtarı
  }
  ```
- **Saf ve veri odaklı** — Vue/router/store importu YOK. Test edilebilir.
- `resolveIntent(utterance, intents)` saf fonksiyonu: cümleyi normalize eder (küçük harf, Türkçe karakter/aksan toleransı, noktalama temizliği), her niyetin keyword'leriyle **skorlar** (eşleşen keyword sayısı + kısmi eşleşme), en yüksek skorlu niyeti döndürür. Skor eşiğin (örn. 1) altındaysa `null` → fallback.

### 3.2 `src/composables/useSpeech.js` — Web Speech sarmalayıcı
- **STT:** `window.SpeechRecognition || webkitSpeechRecognition`, `lang='tr-TR'`, `interimResults=true`, `continuous=false`.
  - Dışa aktarır: `isSupported` (ref), `isListening` (ref), `transcript` (ref, canlı), `start()`, `stop()`, `onResult(cb)` (final sonuç callback'i).
- **TTS:** `window.speechSynthesis`, `speak(text)` → `SpeechSynthesisUtterance`, `lang='tr-TR'`, Türkçe ses varsa seçer.
  - `muted` ref ile susturulabilir; `cancel()` ile kesilebilir.
- **Dayanıklılık:** API yoksa `isSupported=false`; izin reddi/`onerror` yakalanır ve `isListening=false`'a düşer.

### 3.3 `src/composables/useAssistant.js` — Beyin
- `handle(utterance) → { reply: string, action?: { type:'navigate', path } }`
- `resolveIntent` ile niyeti bulur, sonra:
  - `navigate` → `router.push(path)`, reply: "X sayfasını açtım."
  - `data` → ilgili store'dan canlı okuma (aşağıda), reply: sayı/özet cümlesi.
  - `info` → bilgi tabanından şablon paragraf.
  - `help` → yetenek listesi.
  - `null` → fallback: "Bunu tam anlayamadım. Şunları deneyebilirsiniz: …"
- Store erişimi composable içinde (usePatientStore, useConsentStore, useInventoryStore).

### 3.4 `src/components/assistant/AssistantWidget.vue` — UI
- **FAB:** sağ altta `fixed bottom-6 right-6 z-40`, `emboss-raised` yuvarlak buton, asistan mark'ı; tıklayınca panel açılır/kapanır.
- **Panel:** FAB üstünde, liquid-glass (emboss + `backdrop-blur`), teal aksan. Bölümler:
  - Başlık: "Onam Asistanı" + mute toggle (🔊/🔇) + kapat (✕).
  - Mesaj listesi: kullanıcı (sağ, teal balon) / asistan (sol, paper balon). Otomatik en alta kayar.
  - Giriş satırı: **mikrofon butonu** (dinlerken teal pulse + canlı transcript), metin input, gönder butonu.
- Mesaj akışı: gönderim → `useAssistant.handle()` → asistan mesajı eklenir → mute değilse `speak(reply)`.
- Web Speech desteklenmiyorsa mikrofon gizlenir, küçük not gösterilir ("Tarayıcınız sesli girişi desteklemiyor"), metin input çalışmaya devam eder.

### 3.5 Montaj
- `src/layouts/MainLayout.vue` içine `<AssistantWidget />` (yalnız dashboard rotaları MainLayout kullanıyor).

## 4. Niyet kataloğu (ilk sürüm)

**Navigasyon:** panel/kontrol paneli → overview · onam/onamlar → consents · hasta/crm → crm · stok/envanter/malzeme → inventory · mhrs/randevu/eşitleme → mhrs-sync · profil → profile · ayarlar → settings.

**Canlı veri:**
- "kaç hasta" → `patientStore.patients.length`
- "imza bekleyen / bekleyen onam" → `consentStore.pendingConsents.length`
- "imzalanan onam" → `consentStore.signedConsents.length`
- "kritik stok / az kalan / stok uyarısı" → `inventoryStore.lowStockItems` (sayı + ilk birkaç isim)

**Ürün bilgisi (şablon):** MHRS eşitleme · KVKK & veri güvenliği · yasal e-imza · klinik stok takibi · hasta CRM. Metinler landing kopyasından türetilir.

**Yardım:** "ne yapabilirsin / yardım" → kategorize yetenek listesi.

## 5. Responsive & Mobil

- **Masaüstü:** panel genişliği ~360px, yükseklik ~480px.
- **Mobil (`< 640px`):** panel neredeyse tam ekran (`inset-x-3 bottom-3 top-16`), FAB `bottom-4 right-4`. Dokunmatik hedefler ≥ 44px.
- Web Speech mobil tarayıcılarda değişken (iOS Safari kısıtlı) → `isSupported` kontrolü mobilde de aynı şekilde mikrofonu gizler/gösterir; metin her zaman çalışır.
- `prefers-reduced-motion`: pulse/açılış animasyonları no-op.

## 6. Hata yönetimi

| Durum | Davranış |
|---|---|
| SpeechRecognition yok | Mikrofon gizli, metin-only, bilgi notu |
| Mikrofon izni reddi | "Mikrofon erişimi reddedildi" mesajı; metinle devam |
| STT `onerror` / boş sonuç | Dinleme durur, sessiz; tekrar denenebilir |
| Niyet bulunamadı | Fallback + örnek öneriler |
| TTS yok / mute | Seslendirme atlanır, metin gösterilir |

## 7. Test stratejisi

- **`intents.js` + `resolveIntent`:** saf → birim testleri (TDD): eş-anlam eşleşmesi, Türkçe karakter toleransı, skor eşiği, belirsiz girişte fallback.
- **`useAssistant.handle`:** store'lar ve router mock'lanarak; her niyet tipinin doğru `{reply, action}` ürettiği.
- **`useSpeech`:** Web Speech API mock'lanır; isSupported false yolu.
- **Widget:** temel render + desteklenmeyen-tarayıcı yolu (gerekirse).

## 8. Tasarım dili

emboss-paper + teal (#088496). FAB `emboss-raised`; panel liquid-glass; kullanıcı balonu teal, asistan balonu paper; dinlerken mikrofon teal `animate-pulse`. Asistan adı: **"Onam Asistanı"** (marka adı netleşince tek yerden güncellenir).

## 9. Açık konular (bloklamaz)

- Marka adı kararı (Onamlarım → ?) netleşince asistan başlığı + wordmark güncellenir.
- İleride gerçek LLM istenirse `useAssistant.handle` arkasına bir async strateji eklenebilir (arayüz aynı kalır).
