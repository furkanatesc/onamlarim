# Onamlarım — Frontend Teknoloji Haritası (`tech_explain.md`)

Bu doküman, projenin **frontend** tarafında hangi teknolojiyi **hangi iş için** kullandığımızı
açıklar. Onamlarım şu an **backend'siz, tamamen istemci-taraflı bir klinik ERP demosudur**;
veriler Pinia store'larında ve Axios mock interceptor'larında tutulur (gerçek sunucu yok).

---

## 1. Çekirdek Framework & Dil

| Teknoloji | Sürüm | Ne için kullanıyoruz |
|-----------|-------|----------------------|
| **Vue 3** | `^3.5.34` | Tüm UI. Composition API + `<script setup>` SFC stili. Reaktivite (`ref`, `computed`), bileşen kompozisyonu, lifecycle. |
| **JavaScript (ESM)** | `"type": "module"` | TypeScript kullanılmıyor; saf ESM JS. Tüm import/export native modül. |

**Neden Vue 3 Composition API:** Mantığı yeniden kullanılabilir `composables/` fonksiyonlarına
çıkarabilmek için (örn. `useMhrsSync`, `useSpeech`, `useSidebar`). Class/Options API yerine
fonksiyon-tabanlı kompozisyon.

---

## 2. Build & Geliştirme Araçları

| Teknoloji | Sürüm | Ne için kullanıyoruz |
|-----------|-------|----------------------|
| **Vite 8** (Rolldown tabanlı) | `^8.0.12` | Dev sunucusu (`npm run dev`), HMR, prod build (`npm run build`), önizleme. Rolldown (Rust) bundler. |
| **@vitejs/plugin-vue** | `^6.0.6` | `.vue` Single File Component'lerini derler. |
| **@tailwindcss/vite** | `^4.3.0` | Tailwind v4'ü Vite pipeline'ına bağlar (PostCSS config'siz, CSS-first). |

`vite.config.js` minimal: sadece `vue()` + `tailwindcss()` eklentileri.

---

## 3. Stil & Tasarım Sistemi

| Teknoloji | Ne için kullanıyoruz |
|-----------|----------------------|
| **Tailwind CSS v4** | Tüm layout, spacing, tipografi, renk. CSS-first konfig (`style.css` içinde `@theme`/utility'ler), ayrı `tailwind.config.js` yok. |
| **Özel CSS (`src/style.css`)** | Tasarım dili: teal `#088496` "embossed-paper/glass" estetiği — `emboss-raised`, `text-engrave` gibi özel utility'ler. iOS input-zoom fix (mobilde input 16px). |
| **Arbitrary değerler** | Vurgu rengi terracotta `#E8755D` pazarlama sayfalarında `[#E8755D]` ile kullanılır (teal birincil kalır). |

> Tasarım ilkesi: "AI kokmasın" → şablon kart-grid/eşit-sütun klişelerinden kaçınılır, her öğe
> tek iş yapar, dekoratif tekrar yoktur.

---

## 4. Yönlendirme (Routing)

| Teknoloji | Sürüm | Ne için kullanıyoruz |
|-----------|-------|----------------------|
| **vue-router** | `^5.1.0` | SPA yönlendirme, `createWebHistory` (HTML5 history). |

`src/router/index.js`:
- **Public route'lar:** `/` (Landing), `/login`, `/kutuphane`, `/fiyatlandirma`, `/ozellikler`, `/platform`.
- **Korumalı uygulama:** `/dashboard/*` → `MainLayout.vue` altında iç içe (overview, consents, crm, inventory, mhrs-sync, profile, settings).
- **Lazy-loading:** her view `() => import(...)` ile kod bölünür (route-based code splitting).
- **Route guard:** `beforeEach` — `localStorage` token'ına bakar; token yoksa `/dashboard` → `/login` yönlendirir (demo auth).
- **scrollBehavior:** hash linklerde 80px offset ile yumuşak kaydırma.

---

## 5. Durum Yönetimi (State)

| Teknoloji | Sürüm | Ne için kullanıyoruz |
|-----------|-------|----------------------|
| **Pinia** | `^3.0.4` | Global/paylaşılan uygulama durumu. Setup-store stili (composition API ile `defineStore`). |

Store'lar (`src/store/`):
- **`useConsentStore`** — onam kayıtları (oluştur/imzala), `pendingConsents`/`signedConsents` computed'leri.
- **`usePatientStore`** — hasta CRM verisi.
- **`useInventoryStore`** — envanter/kritik stok.

> Şu an store'lar **mock seed verisiyle** başlatılır (gerçek backend yok). Gerçek API gelince
> bu store'lar Axios çağrılarıyla beslenecek.

---

## 6. Veri Katmanı (API / Mock)

| Teknoloji | Sürüm | Ne için kullanıyoruz |
|-----------|-------|----------------------|
| **Axios** | `^1.17.0` | Merkezi HTTP istemcisi (`src/api/axios.js`). |

`src/api/axios.js` öne çıkanlar:
- **`baseURL: https://api.onamlarim.com/v1`** — sahte (mock) prod endpoint, henüz gerçek değil.
- **Request interceptor:** `localStorage` token'ı `Authorization: Bearer` header'ına ekler.
- **Response interceptor:** sunucu yoksa **yerel mock veriye düşer** (`/patients`, `/mhrs/sync-status`),
  800ms sahte ağ gecikmesiyle gerçekçi loading animasyonu sağlar. Prototipin "her zaman çalışır"
  olmasını sağlayan kilit parça.

---

## 7. Composables (Yeniden Kullanılabilir Mantık)

| Composable / Lib | Ne için kullanıyoruz |
|------------------|----------------------|
| **`useMhrsSync.js`** + **@vueuse/core `useIntervalFn`** | MHRS randevu senkronizasyonunu 60 sn'de bir otomatik tetikler; Axios mock'a gider. |
| **`useSpeech.js`** | Web Speech API (SpeechRecognition + SpeechSynthesis) sarmalayıcısı. iOS için `getUserMedia` ile mikrofon iznini açıkça ister; Dikte kapalıysa kullanıcıya yönlendirme verir. |
| **`useAssistant.js`** + **`assistant/intents.js`** | Kural-tabanlı sesli AI asistan (niyet eşleme + yanıt). LLM yok; deterministik skorlama. |
| **`useSidebar.js`** | Mobil sidebar drawer aç/kapa durumu (responsive). |
| **`usePatients.js`** | Hasta verisi erişim composable'ı. |
| **@vueuse/core** `^14.3.0` | `useIntervalFn`, `onClickOutside` vb. yardımcılar (Header dış-tık kapanışı, interval'lar). |

---

## 8. UI Bileşenleri & Görseller

| Teknoloji | Sürüm | Ne için kullanıyoruz |
|-----------|-------|----------------------|
| **@lucide/vue** | `^1.17.0` | İkon seti (Check, RefreshCw, UserPlus, LayoutDashboard, Archive, MapPin, KeyRound, History vb.). |
| **signature_pad** | `^5.1.3` | Onam imzası canvas — `SignatureModal.vue` içinde el imzası yakalama (consent imzalama akışı). |
| **Özel SVG bileşenleri** | — | `components/icons/` (BrandMark, IconConsent/Mhrs/Stock/Crm) + `components/illustrations/` (EmptyConsents, EmptyStock). Kimlik/boş-durum görselleri. |
| **`MeshGradient.vue` / `ScrollArchitecture.vue`** | — | Landing hero: `hero-architecture.mp4` üzerinden scroll-seek (desktop) / ambient loop (mobil) animasyonlar. |
| **Video asset'leri** | — | `public/login-curtain-hd.mp4` (login arka planı), `public/hero-architecture.mp4` (landing hero). Immutable cache'li (bkz. `vercel.json`). |

---

## 9. Dağıtım (Deploy) — Mevcut Durum

| Teknoloji | Ne için kullanıyoruz |
|-----------|----------------------|
| **Vercel** | Static SPA hosting. `vercel.json`: SPA rewrite (tüm path'ler → `index.html`) + video/asset için `max-age=31536000, immutable` cache. |
| **GitHub** (`furkanatesc/onamlarim`) | Kaynak kontrol, `main` branch'ten Vercel auto-deploy. |

> **Not:** Bu, yalnızca **frontend** dağıtımıdır. CDN/servis/DB için hedef mimari (Cloudflare + AWS)
> ayrı `ROADMAP.md` dokümanında planlanmaktadır.

---

## Özet — Tek Bakışta

```
Vue 3 (Composition API, <script setup>)        ← tüm UI
  ├── Vite 8 / Rolldown + plugin-vue            ← build & dev
  ├── Tailwind v4 (@tailwindcss/vite)           ← stil (teal emboss dili)
  ├── vue-router 5                              ← SPA routing + lazy load + auth guard
  ├── Pinia 3                                   ← state (consent / patient / inventory)
  ├── Axios 1                                   ← HTTP + MOCK interceptor (backend yok)
  ├── @vueuse/core                              ← interval / click-outside utils
  ├── @lucide/vue                               ← ikonlar
  ├── signature_pad                             ← onam imza canvas
  └── Web Speech API (custom composables)       ← kural-tabanlı sesli asistan
Deploy: GitHub → Vercel (static SPA + immutable asset cache)
```
