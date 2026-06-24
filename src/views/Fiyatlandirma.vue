<template>
  <div class="relative min-h-screen font-sans text-slate-900 overflow-x-hidden bg-[#F7F8F9]">
    <div class="bg-noise opacity-[0.025] mix-blend-multiply fixed inset-0 pointer-events-none"></div>
    <SiteHeader variant="solid" />

    <main class="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-10">
      <!-- ====== Başlık ====== -->
      <header class="text-center max-w-2xl mx-auto">
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E8755D]">Fiyatlandırma</p>
        <h1 class="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 text-engrave leading-[1.02]">
          Kliniğinizin boyutuna göre
          <span class="font-serif-italic font-normal">net</span> fiyat
        </h1>
        <p class="mt-4 text-sm text-slate-500 leading-relaxed">
          Gizli ücret yok, kurulum bedeli yok. İstediğiniz zaman yükseltin ya da iptal edin.
        </p>

        <!-- Faturalama periyodu -->
        <div class="mt-7 inline-flex items-center gap-1 emboss-inset rounded-full p-1 bg-white/60">
          <button
            v-for="opt in ['aylik', 'yillik']"
            :key="opt"
            @click="billing = opt"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="billing === opt ? 'bg-white text-slate-900 emboss-raised' : 'text-slate-500 hover:text-slate-900'"
          >
            {{ opt === 'aylik' ? 'Aylık' : 'Yıllık' }}
            <span v-if="opt === 'yillik'" class="ml-1 text-[#E8755D]">−2 ay</span>
          </button>
        </div>
      </header>

      <!-- ====== Planlar (kasıtlı hiyerarşi: ortadaki öne çıkar) ====== -->
      <section class="mt-12 grid gap-6 lg:grid-cols-3 lg:items-center">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="relative rounded-3xl bg-white p-7 flex flex-col"
          :class="plan.featured
            ? 'emboss-raised ring-1 ring-[#E8755D]/30 lg:py-10 lg:-my-2 shadow-[0_20px_50px_-20px_rgba(232,117,93,0.35)]'
            : 'emboss-inset'"
        >
          <div
            v-if="plan.badge"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#E8755D] text-white text-[10px] font-bold uppercase tracking-widest shadow-sm shadow-[#E8755D]/40"
          >
            {{ plan.badge }}
          </div>

          <h3 class="text-lg font-extrabold text-slate-900">{{ plan.name }}</h3>
          <p class="mt-1 text-xs text-slate-500">{{ plan.for }}</p>

          <div class="mt-6 flex items-end gap-1.5">
            <span class="text-4xl font-extrabold tracking-tight text-slate-900">{{ priceMain(plan) }}</span>
            <span v-if="plan.monthly" class="pb-1.5 text-xs text-slate-400 font-medium">{{ billing === 'aylik' ? '/ay' : '/yıl' }}</span>
          </div>
          <p class="mt-1 h-4 text-[11px] font-semibold text-[#E8755D]">
            <span v-if="plan.monthly && billing === 'yillik'">Yıllık ödemede 2 ay ücretsiz</span>
          </p>

          <router-link
            to="/login"
            class="mt-6 w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all"
            :class="plan.featured
              ? 'bg-[#088496] text-white hover:bg-[#066b7a] shadow-md shadow-[#08849640] hover:-translate-y-0.5'
              : 'emboss-raised bg-white text-slate-800 hover:-translate-y-0.5'"
          >
            {{ plan.cta }}
          </router-link>

          <ul class="mt-7 space-y-3">
            <li v-for="f in plan.features" :key="f" class="flex items-start gap-2.5 text-[13px] text-slate-600">
              <Check class="w-4 h-4 mt-0.5 shrink-0 text-[#088496]" />
              <span>{{ f }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ====== Tüm planlarda dahil olanlar ====== -->
      <section class="mt-10 emboss-inset rounded-2xl bg-white px-6 py-5">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center mb-4">Tüm planlarda dahil</p>
        <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <div v-for="b in baseline" :key="b" class="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck class="w-4 h-4 text-[#088496]" /> {{ b }}
          </div>
        </div>
      </section>

      <!-- ====== SSS ====== -->
      <section class="mt-16 max-w-3xl mx-auto">
        <h2 class="text-center text-2xl font-extrabold tracking-tight text-slate-900 text-engrave">Sık sorulanlar</h2>
        <div class="mt-8 space-y-3">
          <details v-for="f in faq" :key="f.q" class="group emboss-inset rounded-2xl bg-white px-5 py-4">
            <summary class="flex items-center justify-between cursor-pointer list-none text-sm font-bold text-slate-800">
              {{ f.q }}
              <Plus class="w-4 h-4 text-[#E8755D] transition-transform group-open:rotate-45" />
            </summary>
            <p class="mt-3 text-sm text-slate-500 leading-relaxed">{{ f.a }}</p>
          </details>
        </div>
      </section>

      <!-- ====== Kapanış CTA ====== -->
      <section class="mt-16 text-center">
        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-engrave">
          Hangi planın size uyduğundan emin değil misiniz?
        </h2>
        <p class="mt-2 text-sm text-slate-500">15 dakikalık bir demoda kliniğinize özel öneri sunalım.</p>
        <router-link
          to="/login"
          class="inline-flex items-center gap-1.5 mt-6 px-7 py-3 bg-[#088496] text-white rounded-xl text-sm font-bold shadow-md shadow-[#08849640] hover:bg-[#066b7a] hover:-translate-y-0.5 transition-all"
        >
          Demo planlayın <ArrowRight class="w-4 h-4" />
        </router-link>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, ShieldCheck, ArrowRight, Plus } from '@lucide/vue'
import SiteHeader from '../components/site/SiteHeader.vue'
import SiteFooter from '../components/site/SiteFooter.vue'

const billing = ref('aylik')

const plans = [
  {
    name: 'Başlangıç',
    for: 'Tek hekim & küçük klinik',
    monthly: 1490,
    cta: 'Başlayın',
    featured: false,
    features: ['1 hekim hesabı', 'Sınırsız dijital onam', 'Temel hasta CRM', 'E-imza & zaman damgası', 'E-posta destek'],
  },
  {
    name: 'Klinik',
    for: 'Büyüyen klinikler',
    monthly: 2990,
    cta: 'Başlayın',
    featured: true,
    badge: 'En popüler',
    features: ['10 hekime kadar hesap', 'MHRS randevu eşitleme', 'Klinik stok takibi', 'Gelişmiş CRM & raporlar', 'Öncelikli destek'],
  },
  {
    name: 'Kurumsal',
    for: 'Hastane & zincir klinikler',
    monthly: null,
    priceLabel: 'Size özel',
    cta: 'İletişime geçin',
    featured: false,
    features: ['Sınırsız hekim', 'Özel entegrasyonlar', 'SSO & rol yönetimi', 'SLA & özel sunucu', 'Atanmış müşteri yöneticisi'],
  },
]

const baseline = ['KVKK uyumu', 'TLS 1.3 şifreleme', 'Yasal e-imza', 'Otomatik yedekleme']

const faq = [
  { q: 'Sözleşme zorunluluğu var mı?', a: 'Hayır. Aylık planları istediğiniz zaman iptal edebilirsiniz; uzun vadeli taahhüt gerekmez.' },
  { q: 'Verilerim nerede saklanıyor?', a: 'Tüm veriler Türkiye’de, KVKK uyumlu ve şifreli sunucularda barındırılır. Yedekler otomatik alınır.' },
  { q: 'MHRS entegrasyonu hangi planlarda var?', a: 'MHRS randevu eşitleme Klinik ve Kurumsal planlarda yer alır. Başlangıç planına sonradan eklenebilir.' },
  { q: 'Plan yükseltir veya düşürürsem ne olur?', a: 'Değişiklik anında geçerli olur; ücret farkı kullanım süresine göre orantılanır.' },
]

function priceMain(plan) {
  if (!plan.monthly) return plan.priceLabel
  const value = billing.value === 'aylik' ? plan.monthly : plan.monthly * 10
  return '₺' + value.toLocaleString('tr-TR')
}
</script>
