<template>
  <div class="relative min-h-screen font-sans text-slate-900 overflow-x-hidden">
    <!-- Scroll-driven embossed architecture backdrop -->
    <ScrollArchitecture />

    <!-- Navigation (glass on paper) -->
    <header
      class="fixed top-0 inset-x-0 z-50 h-16 px-6 lg:px-16 flex items-center justify-between bg-white/55 backdrop-blur-xl border-b border-white/60"
    >
      <div class="flex items-center gap-3">
        <div class="emboss-raised flex items-center justify-center w-8 h-8 rounded-lg bg-white text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-3-3v6m-9-3h18" />
          </svg>
        </div>
        <div>
          <span class="text-sm font-bold text-slate-900 tracking-tight">Onamlarım</span>
          <span class="text-[9px] font-extrabold text-blue-600 tracking-widest uppercase ml-1.5">ERP</span>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-1 emboss-inset rounded-full px-2 py-1.5 bg-white/60">
        <a v-for="link in navLinks" :key="link" href="#features" class="px-3.5 py-1 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          {{ link }}
        </a>
      </nav>

      <router-link
        to="/login"
        class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:-translate-y-0.5 transition-all"
      >
        Sisteme Giriş Yap
      </router-link>
    </header>

    <!-- HERO -->
    <section class="relative z-10 min-h-[100svh] flex flex-col items-center text-center px-6 pt-32 pb-24">
      <span
        v-reveal="0"
        class="emboss-raised inline-flex px-3.5 py-1.5 rounded-full bg-white text-[10px] font-bold uppercase tracking-widest text-slate-500"
      >
        Türkiye'nin Klinik &amp; ERP Odaklı Onam Platformu
      </span>

      <h1
        v-reveal="80"
        class="max-w-4xl mt-7 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight text-slate-900 text-engrave"
      >
        Sağlık kuruluşları için dijital onam ve
        <span class="font-serif-italic font-normal">klinik yönetim</span>
      </h1>

      <p v-reveal="180" class="max-w-xl mt-6 text-sm sm:text-base text-slate-500 leading-relaxed">
        Kağıt onam formlarını geride bırakın. MHRS randevu eşitleme, gerçek zamanlı stok takibi ve akıllı hasta CRM'i ile
        kliniğinizi tek panelden dijitalleştirin.
      </p>

      <div v-reveal="280" class="flex flex-col sm:flex-row items-center gap-4 mt-9">
        <router-link
          to="/login"
          class="flex items-center gap-1.5 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
        >
          Hemen Başlayın <ArrowRight class="w-4 h-4" />
        </router-link>
        <a
          href="#features"
          class="emboss-raised flex items-center gap-1.5 px-6 py-3 rounded-xl bg-white text-sm font-bold text-slate-700 hover:-translate-y-0.5 transition-all"
        >
          <Play class="w-4 h-4" /> Özellikleri İncele
        </a>
      </div>

      <div class="mt-auto pt-16 flex flex-col items-center gap-1 text-slate-400">
        <span class="text-[10px] uppercase tracking-widest">kaydır</span>
        <ChevronDown class="w-4 h-4 animate-bounce" />
      </div>
    </section>

    <!-- CONTENT (paper plane that scrolls over the fixed backdrop) -->
    <div class="relative z-10 -mt-6 rounded-t-[40px] bg-white/95 backdrop-blur-sm border-t border-white/80 shadow-[0_-12px_40px_rgba(15,23,42,0.04)]">
      <!-- TRUST BAR -->
      <div class="max-w-5xl mx-auto px-6 pt-16">
        <p class="text-center text-[10px] uppercase tracking-widest text-slate-400 mb-4">
          Kliniklerin güvendiği altyapı
        </p>
        <div
          v-reveal="0"
          class="emboss-inset rounded-2xl px-8 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3"
        >
          <div v-for="item in trust" :key="item.label" class="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <component :is="item.icon" class="w-4 h-4 text-blue-600" />
            {{ item.label }}
          </div>
        </div>
      </div>

      <!-- FEATURES -->
      <section id="features" class="max-w-6xl mx-auto px-6 pt-28">
        <div class="text-center max-w-2xl mx-auto">
          <span class="text-[11px] font-bold uppercase tracking-widest text-blue-600">Özellikler</span>
          <h2 v-reveal="0" class="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-engrave">
            Kliniğinizi uçtan uca dijitalleştirin
          </h2>
          <p v-reveal="80" class="mt-3 text-sm text-slate-500">
            Onam, randevu, stok ve hasta ilişkileri — hepsi tek, bütünleşik bir platformda.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          <div
            v-for="(f, i) in features"
            :key="f.title"
            v-reveal="i * 90"
            class="emboss-raised rounded-2xl p-6 bg-white text-left space-y-3 hover:-translate-y-1 transition-transform duration-300"
          >
            <div class="emboss-inset w-10 h-10 rounded-xl flex items-center justify-center text-blue-600">
              <component :is="f.icon" class="w-5 h-5" />
            </div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">{{ f.title }}</h3>
            <p class="text-[11px] text-slate-400 leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="max-w-5xl mx-auto px-6 pt-28">
        <div class="text-center">
          <span class="font-serif-italic text-xl text-slate-400">üç adımda</span>
          <h2 v-reveal="0" class="mt-1 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-engrave">
            Kağıttan dijitale, dakikalar içinde
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8 mt-14">
          <div v-for="(s, i) in steps" :key="s.title" v-reveal="i * 110" class="text-left space-y-2">
            <div class="text-6xl font-extrabold text-slate-900/10 leading-none">0{{ i + 1 }}</div>
            <h3 class="text-base font-bold text-slate-800">{{ s.title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">{{ s.desc }}</p>
          </div>
        </div>
      </section>

      <!-- CTA STRIP -->
      <section class="max-w-4xl mx-auto px-6 pt-28">
        <div v-reveal="0" class="emboss-inset rounded-3xl px-8 py-14 text-center bg-white">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-engrave">
            Kağıdı bırakın, kontrolü alın.
          </h2>
          <p class="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            Onamlarım ile kliniğinizin onam ve operasyon süreçlerini bugün dijitale taşıyın.
          </p>
          <router-link
            to="/login"
            class="inline-flex items-center gap-1.5 mt-8 px-7 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
          >
            Hemen Başlayın <ArrowRight class="w-4 h-4" />
          </router-link>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="mt-28 border-t border-slate-200 py-10 text-center">
        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
          © 2026 Onamlarım Medical ERP — Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ArrowRight, Play, ChevronDown, FileSignature, RefreshCw, Package, Users, ShieldCheck, Lock, Activity } from '@lucide/vue'
import ScrollArchitecture from '../components/ScrollArchitecture.vue'

const navLinks = ['Platform', 'Özellikler', 'MHRS', 'Fiyatlandırma']

const trust = [
  { icon: RefreshCw, label: 'MHRS Uyumlu' },
  { icon: ShieldCheck, label: 'KVKK & Veri Güvenliği' },
  { icon: FileSignature, label: 'Yasal e-İmza' },
  { icon: Lock, label: 'TLS 1.3 Şifreleme' },
  { icon: Activity, label: '%99.9 Erişilebilirlik' },
]

const features = [
  { icon: FileSignature, title: 'Dijital İmza & Onam', desc: 'Tablet ve mobilde parmak veya kalemle yasal, zaman damgalı dijital imza toplayın.' },
  { icon: RefreshCw, title: 'MHRS Randevu Eşitleme', desc: 'Merkezi Hekim Randevu Sistemi ile randevu, hekim sırası ve hasta listelerini anlık eşitleyin.' },
  { icon: Package, title: 'Klinik Stok Takibi', desc: 'Kritik ameliyat malzemelerini ve implantları barkodla takip edin, kritik stok alarmı alın.' },
  { icon: Users, title: 'Akıllı Hasta CRM', desc: 'Tıbbi dosya, onam geçmişi ve iletişim kaydını tek panelden yönetin.' },
]

const steps = [
  { title: 'Onam Oluştur', desc: 'Hazır şablonlardan saniyeler içinde işleme özel onam formu üretin.' },
  { title: 'İmzala & Onayla', desc: 'Hasta tablette imzalar; sistem zaman damgası ve kimlik doğrulamasını ekler.' },
  { title: 'Arşivle & Eriş', desc: 'Form KVKK uyumlu şekilde şifreli arşivlenir, tek tıkla geri çağrılır.' },
]

// In-view reveal directive (respects reduced motion)
const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const vReveal = {
  mounted(el, binding) {
    if (reducedMotion) return
    const delay = binding.value || 0
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.style.opacity = '1'
            el.style.transform = 'none'
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.15 }
    )
    io.observe(el)
  },
}
</script>
