# Onamlarım — Landing Page Prompt Paketi

> **Nasıl kullanılır (TR):** Aşağıda iki bölüm var.
> **BÖLÜM 1 — WEB PROMPT**: Bir UI üretici araca (v0 / lovable / bolt / higgs vb.) olduğu gibi yapıştır. Standalone bir React projesi üretir. Sonra `App.tsx` + `index.css` içeriğini Vue'ya port edebilirsin (ya da bana port ettirirsin).
> **BÖLÜM 2 — VIDEO PROMPT**: Arka plandaki "kabartmadan beliren bina" videosunu üretmek için ayrı bir AI video prompt'u (Runway / Sora / Kling / higgs). Çıkan `.mp4`'in URL'ini WEB PROMPT içindeki `BG_VIDEO_URL` yerine koy. Video gelmese bile sayfa SVG fallback ile çalışır.

---

# BÖLÜM 1 — WEB PROMPT

Build a **product-grade, full landing page** for a Turkish clinical SaaS called **Onamlarım** (a digital patient-consent + clinic ERP platform), using **React 18 + TypeScript + Vite + Tailwind CSS 3**, **framer-motion** for animation, and **lucide-react** for icons. The defining feature is a **white-on-white embossed architectural background that scrubs frame-by-frame as the user scrolls** — a building's relief lines deepen and become defined the further you scroll. Match every detail below exactly.

## Core aesthetic — "embossed paper"

The entire page lives on a near-white surface that reads like thick, raked-light paper. Forms, cards and the hero building are not drawn with color — they are **pressed into the paper** (emboss/deboss) using paired highlight + shadow. Color is almost absent: a single blue accent (`#2563EB`) appears only on primary CTAs and one hairline. Calm, premium, architectural, quiet.

### Fonts
Load in `index.html` (preconnect to fonts.gstatic.com), then in `src/index.css` set the global family before `@tailwind base/components/utilities`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
* { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
.font-serif-italic { font-family: 'Instrument Serif', serif; font-style: italic; }
```
- Body / UI font: **Inter**, with `font-feature-settings: "cv02","cv03","cv04","cv11";` on body.
- Display accent: **Instrument Serif, italic** (used for one emphasized word in the H1 and the "how it works" eyebrow).

### Color system (Tailwind config `extend`)
```
colors:
  paper:    '#FFFFFF'   // base background
  paper-2:  '#F6F7F9'   // recessed plane
  paper-3:  '#EEF1F5'   // deepest recess
  hairline: '#E2E5EA'   // engraved 1px lines
  ink:      '#0F172A'   // primary text (slate-900)
  ink-2:    '#64748B'   // secondary text (slate-500)
  ink-3:    '#94A3B8'   // tertiary text (slate-400)
  accent:   '#2563EB'   // blue-600, used sparingly
```
Emboss is done with box-shadows, never gradients of color:
- **Raised** chip/button: `box-shadow: -2px -2px 6px rgba(255,255,255,0.9), 3px 3px 8px rgba(15,23,42,0.08);`
- **Recessed** card/inset: `box-shadow: inset 2px 2px 5px rgba(15,23,42,0.06), inset -2px -2px 5px rgba(255,255,255,0.9);`
- Hairlines: `1px solid #E2E5EA`.

### Global CSS utilities (`index.css`)
1. `.bg-grain` — a fractal-noise SVG data-URI overlay (`feTurbulence baseFrequency='0.8' numOctaves='3'`), used as a fixed full-screen layer at `opacity: 0.035; mix-blend-mode: multiply; pointer-events:none; z-index: 1;` to give the paper its tooth.
2. `.emboss-raised` and `.emboss-inset` — the two box-shadow recipes above.
3. `.text-engrave` — `text-shadow: 0 1px 0 rgba(255,255,255,0.8);` for the debossed-text feel on light surfaces.

---

## THE SIGNATURE EFFECT — scroll-scrubbed embossed building (most important)

A fixed, full-viewport layer behind all content renders an **architectural structure made of white-on-white relief lines** that become progressively defined as the user scrolls through the first ~180vh of the page. Implement it as a self-contained `<ScrollArchitecture />` component with **three tiers of graceful degradation**:

**Tier A — frame-scrubbed video (preferred).**
- A `<div>` fixed to `inset-0; z-index:-10; background:#FFFFFF;` containing a `<canvas>` and a hidden `<video>` (`muted playsInline preload="auto" crossorigin="anonymous"`, `src = BG_VIDEO_URL`).
- On mount, attempt frame extraction: `fetch(BG_VIDEO_URL,{mode:'cors'})` → `blob` → object URL → offscreen `<video>`; wait for `loadedmetadata`; compute `frameCount = clamp(round(duration*24), 30, 120)`; seek to each timestamp, `await 'seeked'`, `createImageBitmap(video, {resizeWidth, resizeHeight})` (scale so width ≤ 1280), push to `frames[]`. On success set `framesReady=true` and hide the `<video>`.
- A `requestAnimationFrame` loop reads scroll progress and draws the matching frame (cover-fit, centered, devicePixelRatio-aware, only redraw when the frame index changes).
- `progress = clamp((scrollY - start) / (end - start), 0, 1)` where `start = innerHeight*0.0`, `end = innerHeight*1.8`.
- If `fetch`/CORS fails, **fall back to live video seeking**: set `video.currentTime = progress * duration` on each rAF tick (debounced via a `seeking` flag).
- **Light-theme overlay:** on top of the canvas, a fixed white scrim `background: linear-gradient(to bottom, rgba(255,255,255,0) 55%, rgba(255,255,255,0.85) 100%)` so content stays readable as it scrolls over the building, plus a top scrim `rgba(255,255,255,0.35)` behind the nav.

**Tier B — SVG line-draw fallback (no video / load failure).**
- If neither frames nor a seekable video are available within ~4s, render an inline `<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">` of an **abstract modern architectural elevation** (a clean multi-tower structure: stacked rectangular volumes, vertical mullions, a stepped roofline — evocative of a modern medical campus, NOT a literal hospital).
- Every path uses `stroke:#0F172A; stroke-opacity:0.10; fill:none; stroke-width:1.25;` plus `filter: drop-shadow(0 1px 0 rgba(255,255,255,0.9));` to fake the emboss.
- Each path has `pathLength={1}` and animated `strokeDashoffset` driven by scroll `progress` (framer-motion `useScroll` + `useTransform`), so the building **draws itself in** as you scroll. Closer paths (foreground) finish first; background paths trail.
- Subtle parallax: foreground group translates `y: progress * -40`, background group `y: progress * -12`.

**Tier C — reduced motion / mobile.**
- If `matchMedia('(prefers-reduced-motion: reduce)')` OR viewport width `< 768px`: skip scrubbing entirely. Show a **single static still** — the final/most-defined frame as a poster image (`POSTER_URL`) or, if absent, the SVG at full `progress=1`. No rAF loop, no heavy decode.

> The net feel: on a sheet of white paper, faint pressed-in lines resolve into a crisp embossed building as you scroll — never a dark video, never a blank hero.

---

## PAGE STRUCTURE (sections, top → bottom)

Root: `min-h-screen bg-paper text-ink tracking-[-0.01em] overflow-x-hidden`, with `<ScrollArchitecture />` and `.bg-grain` as the two fixed background layers, and a `relative z-10` content wrapper above them.

### 1) Navigation (fixed, glass-on-paper)
`fixed top-0 inset-x-0 z-50 h-16 px-6 lg:px-16 flex items-center justify-between` with `bg-white/55 backdrop-blur-xl border-b border-white/60`.
- **Left:** an `.emboss-raised` rounded-lg `w-8 h-8` tile containing a small lucide `Plus`-style mark, then wordmark `<span class="text-sm font-bold text-ink tracking-tight">Onamlarım</span>` followed by `<span class="text-[9px] font-extrabold text-accent tracking-widest uppercase ml-1.5">ERP</span>`.
- **Center (md+):** an `.emboss-inset` pill with links **Platform · Özellikler · MHRS · Fiyatlandırma** (`text-xs font-semibold text-ink-2 hover:text-ink`).
- **Right:** primary CTA button **"Sisteme Giriş Yap"** — `bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-md shadow-accent/20`.

### 2) HERO (`min-h-[100svh]`, content bottom-weighted)
Centered column, content sits in the upper-middle so the building reads beneath it. `flex flex-col items-center text-center px-6 pt-32`.
- **Eyebrow chip:** `.emboss-raised` pill, `text-[10px] font-bold uppercase tracking-widest text-ink-2`, text **"Türkiye'nin Klinik & ERP Odaklı Onam Platformu"**.
- **H1** (`max-w-4xl`, `text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight text-ink text-engrave`):
  - Line: `Sağlık kuruluşları için` 
  - Line: `dijital onam ve` *`klinik yönetim`* — wrap **"klinik yönetim"** in `<span class="font-serif-italic font-normal text-ink">` (serif italic accent, same ink color — emphasis via form, not color).
- **Subcopy** (`max-w-xl text-sm sm:text-base text-ink-2 leading-relaxed mt-6`): "Kağıt onam formlarını geride bırakın. MHRS randevu eşitleme, gerçek zamanlı stok takibi ve akıllı hasta CRM'i ile kliniğinizi tek panelden dijitalleştirin."
- **CTAs** (`flex gap-4 mt-9`):
  - Primary **"Hemen Başlayın"** + lucide `ArrowRight` — `bg-accent text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md shadow-accent/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all`.
  - Secondary **"Demoyu İzle"** + lucide `Play` — `.emboss-raised` rounded-xl `text-sm font-bold text-ink px-6 py-3 hover:-translate-y-0.5 transition-all`.
- **Scroll cue** at bottom: lucide `ChevronDown`, `text-ink-3 animate-bounce`, with tiny label "kaydır".

### 3) TRUST BAR
A slim `.emboss-inset` strip `max-w-5xl mx-auto rounded-2xl px-8 py-5 mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-3`. Items (lucide icon + label, `text-xs font-semibold text-ink-2`): **MHRS Uyumlu** (`RefreshCw`), **KVKK & Veri Güvenliği** (`ShieldCheck`), **Yasal e-İmza** (`FileSignature`), **TLS 1.3 Şifreleme** (`Lock`), **%99.9 Erişilebilirlik** (`Activity`). Above it a tiny centered label `text-[10px] uppercase tracking-widest text-ink-3`: "Kliniklerin güvendiği altyapı".

### 4) FEATURES (`id="features"`, max-w-6xl mx-auto px-6 py-28`)
Section header: small accent eyebrow "ÖZELLİKLER", then H2 `text-3xl sm:text-4xl font-extrabold text-ink tracking-tight text-engrave` — "Kliniğinizi uçtan uca dijitalleştirin." + one-line ink-2 subhead.
4-up grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`). Each card: `.emboss-raised` `rounded-2xl p-6 text-left space-y-3 bg-paper hover:-translate-y-1 transition-all duration-300`, with an `.emboss-inset` `w-10 h-10 rounded-xl` icon tile (`text-accent`):
1. `FileSignature` — **Dijital İmza & Onam** — "Tablet ve mobilde parmak veya kalemle yasal, zaman damgalı dijital imza toplayın."
2. `RefreshCw` — **MHRS Randevu Eşitleme** — "Merkezi Hekim Randevu Sistemi ile randevu, hekim sırası ve hasta listelerini anlık eşitleyin."
3. `Package` — **Klinik Stok Takibi** — "Kritik ameliyat malzemelerini ve implantları barkodla takip edin, kritik stok alarmı alın."
4. `Users` — **Akıllı Hasta CRM** — "Tıbbi dosya, onam geçmişi ve iletişim kaydını tek panelden yönetin."

### 5) HOW IT WORKS (`max-w-5xl mx-auto px-6 py-28`)
Eyebrow in **font-serif-italic** "üç adımda". H2 same style as Features. 3 numbered steps in a row (`grid md:grid-cols-3 gap-8`), connected by a hairline. Each step: a large engraved number (`text-6xl font-extrabold text-ink/10`), title, one-line desc:
1. **Onam Oluştur** — "Hazır şablonlardan saniyeler içinde işleme özel onam formu üretin."
2. **İmzala & Onayla** — "Hasta tablette imzalar; sistem zaman damgası ve kimlik doğrulamasını ekler."
3. **Arşivle & Eriş** — "Form KVKK uyumlu şekilde şifreli arşivlenir, tek tıkla geri çağrılır."

### 6) CTA STRIP
Centered `.emboss-inset` rounded-3xl panel `max-w-4xl mx-auto px-8 py-14 text-center`: H2 "Kağıdı bırakın, kontrolü alın." + primary CTA "Hemen Başlayın".

### 7) FOOTER
`border-t border-hairline py-10 text-center text-[10px] uppercase tracking-widest text-ink-3`: "© 2026 Onamlarım Medical ERP — Tüm hakları saklıdır." Above it a single hairline-thin engraved wordmark.

---

## ANIMATIONS (framer-motion)
- **WordsPullUp** component: split text by spaces, each word a `motion.span` rising from `y:24, opacity:0` → `y:0, opacity:1`, staggered `delay: i*0.07`, `ease:[0.16,1,0.3,1]`, `duration:0.8`, triggered by `useInView({ once:true })`. Use it for the H1 and section H2s.
- **Fade-up** wrapper (`whileInView`, `viewport:{once:true, margin:'-80px'}`, `y:20→0`, `duration:0.7`, same ease) for chips, subcopy, cards (cards stagger `i*0.08`).
- **Scroll-linked building**: as specified in ScrollArchitecture (`useScroll`/`useTransform`).
- Respect `prefers-reduced-motion`: gate all entrance animations to no-op when reduced.

## RESPONSIVENESS
- Use `100svh` for hero. Type scales `text-5xl → sm:text-6xl → lg:text-7xl`.
- Center nav pill hidden `< md`; mobile shows a `.emboss-raised` hamburger (lucide `Menu`).
- Features: 1 → 2 (`md`) → 4 (`lg`) columns. How-it-works: stack on mobile.
- Below `md`, ScrollArchitecture uses **Tier C** (static poster, no scrubbing) for performance.

## TECH STACK / DEPENDENCIES
React 18, TypeScript, Vite, Tailwind CSS 3, `framer-motion`, `lucide-react`. Single-page `App.tsx` composing the sections; `ScrollArchitecture.tsx`, `WordsPullUp.tsx` as separate components. No backend.

## PLACEHOLDERS to fill before running
- `BG_VIDEO_URL` — the embossed-building MP4 (see Part 2). If you don't have it yet, leave it empty string and the component will run Tier B (SVG draw) automatically.
- `POSTER_URL` — optional still for reduced-motion/mobile; falls back to the SVG if empty.

---

# BÖLÜM 2 — VIDEO PROMPT (arka plan videosu)

> Bu prompt'u bir AI video aracına ver (Runway Gen-3 / Sora / Kling / higgs). Çıktıyı `.mp4` olarak indir, host et, URL'i WEB PROMPT'taki `BG_VIDEO_URL`'e koy. Videonun zaman çizgisi = scroll ilerlemesi; yani video **başında neredeyse düz beyaz**, **sonunda hatları tam belirgin** olmalı (monoton, geri-ileri sarılabilir his).

**Prompt (EN — kopyala/yapıştır):**

> Macro, top-down raking light on a sheet of thick matte white paper. A modern architectural structure — a clean, multi-volume building (stacked rectangular masses, vertical mullions, a stepped roofline, abstract and minimal, evocative of a contemporary medical campus, no signage, no people) — **emerges purely as an emboss / relief pressed into the white paper**. The surface is entirely white-on-white; form is revealed only by soft self-shadows and bright highlight edges from a low, raking key light coming from the top-left. 
> **Motion:** over the full duration the relief **deepens and sharpens monotonically** — at the start the paper is almost flat with only the faintest impression of lines; by the end the building is crisply embossed with clear depth, edges and cast micro-shadows. Extremely slow, smooth, eased, continuous; the camera is **locked / static**, no orbit, no zoom. No element ever moves laterally — only depth/definition increases. 
> **Look:** monochrome white / off-white (#FFFFFF–#F2F4F7), subtle paper grain, soft global illumination plus one raking light, gentle ambient occlusion in the recesses. Architectural, premium, quiet, editorial. Shallow contrast — never high-key blown out, never dark. 
> **Specs:** 16:9, ~12 seconds, high resolution, steady, loop-friendly (can be scrubbed forward/back), clean ease-in-out timing.
> **Negative / avoid:** color, blue/orange tints, text, logos, people, cars, sky, glass reflections, lens flare, fast motion, camera shake, dark/black areas, dramatic lighting, photorealistic city, clutter.

**Notlar (TR):**
- Aracın "image-to-video" modu varsa: önce aynı tarifle bir **beyaz kabartma bina still'i** üret, sonra "slowly deepen the emboss, static camera" diyerek videolaştır — kontrol daha iyi olur.
- Süre 10–14 sn ideal; daha uzun video scroll'da daha pürüzsüz scrub verir ama dosya büyür.
- Çıkışı `.mp4` (H.264) tut; `crossorigin="anonymous"` çalışsın diye host'un **CORS** başlığı vermeli (yoksa kod otomatik Tier B/SVG'ye düşer, sorun olmaz).
- İstersen videodan son kareyi alıp `POSTER_URL` olarak da kullan (mobil + reduced-motion için).
