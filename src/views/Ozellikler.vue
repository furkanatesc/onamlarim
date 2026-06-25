<template>
  <div class="relative min-h-screen font-sans text-slate-900 overflow-x-hidden bg-[#F7F8F9]">
    <div class="bg-noise opacity-[0.025] mix-blend-multiply fixed inset-0 pointer-events-none"></div>
    <SiteHeader variant="solid" />

    <main class="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-10">
      <!-- ====== Başlık ====== -->
      <header class="max-w-2xl">
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E8755D]">Özellikler</p>
        <h1 class="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 text-engrave leading-[1.02]">
          Tek panelde,
          <span class="font-serif-italic font-normal">uçtan uca</span> klinik
        </h1>
        <p class="mt-4 text-sm text-slate-500 leading-relaxed">
          Onam, randevu, stok ve hasta ilişkileri ayrı yazılımlara dağılmaz. Dört modül aynı verinin üzerinde çalışır.
        </p>
      </header>

      <!-- ====== Modüller (alternatif satır düzeni) ====== -->
      <section class="mt-20 space-y-24">
        <div
          v-for="(f, i) in features"
          :key="f.key"
          class="grid md:grid-cols-2 gap-8 lg:gap-14 items-center"
        >
          <!-- Metin -->
          <div :class="i % 2 ? 'md:order-2' : ''">
            <div class="emboss-inset w-11 h-11 rounded-xl flex items-center justify-center text-[#088496]">
              <component :is="f.icon" class="w-6 h-6" />
            </div>
            <h2 class="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">{{ f.title }}</h2>
            <p class="mt-2.5 text-sm text-slate-500 leading-relaxed max-w-md">{{ f.desc }}</p>
            <ul class="mt-5 space-y-2.5">
              <li v-for="p in f.points" :key="p" class="flex items-start gap-2.5 text-[13px] text-slate-600">
                <Check class="w-4 h-4 mt-0.5 shrink-0 text-[#088496]" /><span>{{ p }}</span>
              </li>
            </ul>
          </div>

          <!-- Görsel parçacık (gerçek ürün hissi) -->
          <div :class="i % 2 ? 'md:order-1' : ''">
            <!-- Dijital onam -->
            <div v-if="f.key === 'onam'" class="emboss-raised rounded-2xl bg-white p-6">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Onam Formu</p>
              <p class="mt-1 text-sm font-bold text-slate-800">Laparoskopik Histerektomi — Bilgilendirme</p>
              <div class="mt-5 h-px bg-slate-100"></div>
              <div class="mt-5 flex items-end justify-between">
                <span class="font-serif-italic text-3xl text-slate-700 leading-none">Müge A.</span>
                <span class="inline-flex items-center gap-1 text-[10px] font-bold text-[#088496] bg-[#088496]/10 px-2.5 py-1 rounded-full">
                  <Check class="w-3 h-3" /> İmzalandı 14:32
                </span>
              </div>
            </div>

            <!-- MHRS -->
            <div v-else-if="f.key === 'mhrs'" class="emboss-raised rounded-2xl bg-white p-6 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-slate-800">MHRS Eşitleme</span>
                <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <RefreshCw class="w-3 h-3" /> Eşitlendi · 2 dk
                </span>
              </div>
              <div v-for="r in mhrsRows" :key="r.t" class="flex items-center justify-between emboss-inset rounded-xl px-3 py-2 bg-white">
                <span class="text-xs font-semibold text-slate-700">{{ r.t }} · {{ r.p }}</span>
                <span class="text-[10px] font-bold" :class="r.ok ? 'text-emerald-600' : 'text-[#E8755D]'">{{ r.s }}</span>
              </div>
            </div>

            <!-- Stok -->
            <div v-else-if="f.key === 'stok'" class="emboss-raised rounded-2xl bg-white p-6 space-y-2">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Klinik Stok</p>
              <div v-for="s in stockRows" :key="s.n" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span class="text-xs font-semibold text-slate-700">{{ s.n }}</span>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="s.crit ? 'text-[#E8755D] bg-[#E8755D]/10' : 'text-slate-500 bg-slate-100'"
                >{{ s.crit ? 'Kritik · ' : '' }}{{ s.q }} adet</span>
              </div>
            </div>

            <!-- CRM -->
            <div v-else class="emboss-raised rounded-2xl bg-white p-6">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-[#088496]/10 text-[#088496] flex items-center justify-center text-sm font-bold">MA</div>
                <div>
                  <p class="text-sm font-bold text-slate-800">Müge Ateş Tıkız</p>
                  <p class="text-[11px] text-slate-400">Son ziyaret: 12 Haz 2026</p>
                </div>
              </div>
              <div class="mt-4 flex flex-wrap gap-1.5">
                <span v-for="t in ['Onam tamam', 'Kontrol', 'MHRS']" :key="t" class="text-[10px] font-semibold text-slate-500 emboss-inset px-2 py-1 rounded-full bg-white">{{ t }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ====== Kapanış CTA ====== -->
      <section class="mt-24 emboss-inset rounded-3xl bg-white px-8 py-12 text-center">
        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-engrave">
          Modülleri kliniğinizde görün
        </h2>
        <p class="mt-2.5 text-sm text-slate-500 max-w-md mx-auto">Demo hesabıyla tüm modülleri gerçek veriyle deneyin.</p>
        <router-link
          to="/login"
          class="inline-flex items-center gap-1.5 mt-7 px-7 py-3 bg-[#088496] text-white rounded-xl text-sm font-bold shadow-md shadow-[#08849640] hover:bg-[#066b7a] hover:-translate-y-0.5 transition-all"
        >
          Demoyu açın <ArrowRight class="w-4 h-4" />
        </router-link>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { Check, RefreshCw, ArrowRight } from '@lucide/vue'
import SiteHeader from '../components/site/SiteHeader.vue'
import SiteFooter from '../components/site/SiteFooter.vue'
import IconConsent from '../components/icons/IconConsent.vue'
import IconMhrs from '../components/icons/IconMhrs.vue'
import IconStock from '../components/icons/IconStock.vue'
import IconCrm from '../components/icons/IconCrm.vue'

const features = [
  {
    key: 'onam',
    icon: IconConsent,
    title: 'Dijital İmza & Onam',
    desc: 'Kağıt formları bırakın; yasal, zaman damgalı dijital imzayı saniyeler içinde toplayın.',
    points: ['Branşa özel hazır şablonlar', 'Tablet veya mobilde parmak/kalemle imza', 'Zaman damgalı, KVKK uyumlu arşiv', 'Tek tıkla PDF ve güvenli paylaşım'],
  },
  {
    key: 'mhrs',
    icon: IconMhrs,
    title: 'MHRS Randevu Eşitleme',
    desc: 'Merkezi Hekim Randevu Sistemi ile randevu ve hekim sırasını anlık tutun.',
    points: ['Randevu ve hekim sırası anlık senkron', 'Çakışma ve mükerrer kayıt uyarısı', 'Otomatik hasta eşleştirme', 'Geçmiş randevuların içe aktarımı'],
  },
  {
    key: 'stok',
    icon: IconStock,
    title: 'Klinik Stok Takibi',
    desc: 'Ameliyat malzemesi ve implantları barkodla izleyin, kritik eşikte uyarı alın.',
    points: ['Barkodla giriş/çıkış', 'Eşik bazlı kritik stok alarmı', 'Lot ve son kullanma takibi', 'İmplant/sarf tüketim raporları'],
  },
  {
    key: 'crm',
    icon: IconCrm,
    title: 'Akıllı Hasta CRM',
    desc: 'Tıbbi dosya, onam geçmişi ve iletişim kaydı tek ekranda.',
    points: ['Dosya ve onam geçmişi tek görünümde', 'İletişim ve randevu kaydı', 'Etiketleme ve hasta segmentleri', 'Kontrol ve takip hatırlatmaları'],
  },
]

const mhrsRows = [
  { t: '09:30', p: 'A. Yılmaz', s: 'Onaylı', ok: true },
  { t: '10:15', p: 'B. Demir', s: 'Çakışma', ok: false },
  { t: '11:00', p: 'C. Kaya', s: 'Onaylı', ok: true },
]
const stockRows = [
  { n: 'Tek kullanımlık trokar', q: 4, crit: true },
  { n: 'Cerrahi sütur 3-0', q: 38, crit: false },
  { n: 'Steril örtü seti', q: 21, crit: false },
]
</script>
