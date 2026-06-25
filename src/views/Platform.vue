<template>
  <div class="relative min-h-screen font-sans text-slate-900 overflow-x-hidden bg-[#F7F8F9]">
    <div class="bg-noise opacity-[0.025] mix-blend-multiply fixed inset-0 pointer-events-none"></div>
    <SiteHeader variant="solid" />

    <main class="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-10">
      <!-- ====== Başlık ====== -->
      <header class="max-w-2xl">
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E8755D]">Platform</p>
        <h1 class="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 text-engrave leading-[1.02]">
          Dağınık yazılımlar değil,
          <span class="font-serif-italic font-normal">tek</span> akış
        </h1>
        <p class="mt-4 text-sm text-slate-500 leading-relaxed">
          Hasta kaydından arşive kadar her adım aynı veri üzerinde çalışır. Kopyala-yapıştır, çift kayıt ve kayıp form yok.
        </p>
      </header>

      <!-- ====== Akış şeması ====== -->
      <section class="mt-14 flex flex-col md:flex-row md:items-stretch gap-3">
        <template v-for="(n, i) in flow" :key="n.label">
          <div class="flex-1 emboss-raised rounded-2xl bg-white p-5 text-center">
            <div class="emboss-inset w-11 h-11 mx-auto rounded-xl flex items-center justify-center text-[#088496]">
              <component :is="n.icon" class="w-5 h-5" />
            </div>
            <p class="mt-3 text-sm font-bold text-slate-800">{{ n.label }}</p>
            <p class="mt-1 text-[11px] text-slate-400 leading-snug">{{ n.desc }}</p>
          </div>
          <div v-if="i < flow.length - 1" class="flex items-center justify-center text-slate-300">
            <ArrowRight class="hidden md:block w-5 h-5" />
            <ChevronDown class="md:hidden w-5 h-5" />
          </div>
        </template>
      </section>

      <!-- ====== MHRS derinlemesine ====== -->
      <section class="mt-24 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-[#E8755D]">MHRS Entegrasyonu</p>
          <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 text-engrave">
            Randevular tek kaynaktan
          </h2>
          <p class="mt-3 text-sm text-slate-500 leading-relaxed max-w-md">
            MHRS ile çift yönlü, anlık bağlantı. Hekim sırası ve hasta listesi panelden takip edilir; ayrı ekran açmazsınız.
          </p>
        </div>
        <ol class="space-y-4">
          <li v-for="(s, i) in mhrsSteps" :key="s.title" class="flex gap-4 emboss-inset rounded-2xl bg-white p-5">
            <span class="font-serif-italic text-3xl text-[#E8755D] leading-none w-8 shrink-0">0{{ i + 1 }}</span>
            <div>
              <p class="text-sm font-bold text-slate-800">{{ s.title }}</p>
              <p class="mt-1 text-xs text-slate-500 leading-relaxed">{{ s.desc }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- ====== Güvenlik & veri yönetimi ====== -->
      <section class="mt-24">
        <div class="max-w-2xl">
          <p class="text-[11px] font-bold uppercase tracking-widest text-[#E8755D]">Güvenlik & Veri</p>
          <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 text-engrave">
            Veriniz nerede, kim erişiyor — net
          </h2>
        </div>
        <div class="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="g in security" :key="g.title" class="emboss-raised rounded-2xl bg-white p-5">
            <div class="emboss-inset w-10 h-10 rounded-xl flex items-center justify-center text-[#088496]">
              <component :is="g.icon" class="w-5 h-5" />
            </div>
            <p class="mt-4 text-sm font-bold text-slate-800">{{ g.title }}</p>
            <p class="mt-1.5 text-[12px] text-slate-500 leading-relaxed">{{ g.desc }}</p>
          </div>
        </div>
      </section>

      <!-- ====== Kapanış CTA ====== -->
      <section class="mt-24 text-center">
        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-engrave">
          Kliniğinizi tek panelde toplayın
        </h2>
        <p class="mt-2.5 text-sm text-slate-500">Kurulum dakikalar sürer; mevcut verinizi taşımanıza yardımcı oluruz.</p>
        <router-link
          to="/login"
          class="inline-flex items-center gap-1.5 mt-7 px-7 py-3 bg-[#088496] text-white rounded-xl text-sm font-bold shadow-md shadow-[#08849640] hover:bg-[#066b7a] hover:-translate-y-0.5 transition-all"
        >
          Hemen başlayın <ArrowRight class="w-4 h-4" />
        </router-link>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ArrowRight, ChevronDown, UserPlus, FileSignature, LayoutDashboard, Archive, MapPin, KeyRound, History, Lock } from '@lucide/vue'
import SiteHeader from '../components/site/SiteHeader.vue'
import SiteFooter from '../components/site/SiteFooter.vue'

const flow = [
  { icon: UserPlus, label: 'Hasta kaydı', desc: 'MHRS’den gelen veya elle eklenen hasta' },
  { icon: FileSignature, label: 'Onam & randevu', desc: 'Form imzalanır, randevu eşitlenir' },
  { icon: LayoutDashboard, label: 'Onamlarım panel', desc: 'Stok, CRM, raporlar tek ekranda' },
  { icon: Archive, label: 'KVKK arşiv', desc: 'Şifreli, zaman damgalı saklama' },
]

const mhrsSteps = [
  { title: 'Bağlan', desc: 'Kurum bilgilerinizle tek seferlik MHRS bağlantısı kurulur.' },
  { title: 'Eşle', desc: 'Hekim ve hasta kayıtları otomatik eşlenir; mükerrerler ayıklanır.' },
  { title: 'Eşitle', desc: 'Randevular anlık ve çift yönlü güncellenir; çakışmalar uyarı olarak düşer.' },
]

const security = [
  { icon: MapPin, title: 'Türkiye’de barındırma', desc: 'Tüm veriler yurt içindeki veri merkezlerinde tutulur.' },
  { icon: KeyRound, title: 'Rol bazlı erişim & SSO', desc: 'Her kullanıcı yalnızca yetkili olduğu veriyi görür.' },
  { icon: History, title: 'Denetim kaydı', desc: 'Kim neye, ne zaman eriştiği iz olarak kaydedilir.' },
  { icon: Lock, title: 'Uçtan uca şifreleme', desc: 'Aktarımda TLS 1.3, durağan veride şifreleme.' },
]
</script>
