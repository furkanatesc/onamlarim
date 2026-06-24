<template>
  <div class="relative min-h-screen font-sans text-slate-900 overflow-x-hidden bg-[#F7F8F9]">
    <div class="bg-noise opacity-[0.025] mix-blend-multiply fixed inset-0 pointer-events-none"></div>
    <SiteHeader variant="solid" />

    <main class="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-10">
      <!-- ====== Masthead (editöryel künye) ====== -->
      <header class="border-b border-slate-200 pb-8">
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E8755D]">Kütüphane</p>
        <h1 class="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 text-engrave leading-[1.02]">
          Klinik dijitalleşmesi üzerine
          <span class="font-serif-italic font-normal">rehberler</span> ve notlar
        </h1>
        <div class="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
          <span>Mevzuat</span><span class="text-slate-300">·</span>
          <span>Dijital Onam</span><span class="text-slate-300">·</span>
          <span>MHRS</span><span class="text-slate-300">·</span>
          <span>Klinik Yönetimi</span>
        </div>
      </header>

      <!-- ====== Kategori filtreleri ====== -->
      <div class="mt-8 flex flex-wrap gap-2">
        <button
          v-for="c in categories"
          :key="c"
          @click="active = c"
          class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
          :class="active === c
            ? 'bg-[#E8755D] text-white shadow-sm shadow-[#E8755D]/30'
            : 'emboss-inset bg-white/60 text-slate-500 hover:text-slate-900'"
        >
          {{ c }}
        </button>
      </div>

      <!-- ====== Öne çıkan yazı ====== -->
      <article
        v-if="featured"
        class="group mt-10 emboss-raised rounded-3xl bg-white overflow-hidden grid md:grid-cols-[1.5fr_1fr]"
      >
        <div class="p-8 sm:p-10 flex flex-col">
          <div class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
            <span class="text-[#E8755D]">{{ featured.category }}</span>
            <span class="text-slate-300">Öne çıkan</span>
          </div>
          <h2 class="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {{ featured.title }}
          </h2>
          <p class="mt-3 text-sm text-slate-500 leading-relaxed max-w-prose">{{ featured.excerpt }}</p>
          <div class="mt-auto pt-8 flex items-center justify-between">
            <span class="text-[11px] text-slate-400 font-medium">{{ featured.date }} · {{ featured.read }} okuma</span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-[#088496] group-hover:gap-2 transition-all">
              Devamını oku <ArrowRight class="w-4 h-4" />
            </span>
          </div>
        </div>
        <!-- kâğıt-üstü amblem yüzeyi (görsel yerine markalı doku) -->
        <div class="relative hidden md:flex items-center justify-center bg-gradient-to-br from-[#088496]/[0.06] to-[#E8755D]/[0.06] border-l border-slate-100">
          <div class="bg-noise opacity-[0.04] mix-blend-multiply absolute inset-0"></div>
          <BookOpen class="w-20 h-20 text-[#088496]/25" />
        </div>
      </article>

      <!-- ====== Yazı listesi (dergi içindekiler düzeni) ====== -->
      <section class="mt-14">
        <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tüm yazılar</p>
        <ul>
          <li v-for="a in rest" :key="a.title">
            <a href="#" @click.prevent class="group grid sm:grid-cols-[1fr_auto] gap-2 sm:gap-8 py-6 border-b border-slate-200 hover:border-[#E8755D]/40 transition-colors">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#E8755D]">{{ a.category }}</span>
                <h3 class="mt-1.5 text-lg font-bold text-slate-900 group-hover:text-[#088496] transition-colors">
                  {{ a.title }}
                </h3>
                <p class="mt-1.5 text-sm text-slate-500 leading-relaxed max-w-2xl">{{ a.excerpt }}</p>
              </div>
              <div class="sm:text-right shrink-0 self-end sm:self-center">
                <span class="text-[11px] text-slate-400 font-medium whitespace-nowrap">{{ a.date }}</span>
                <span class="block text-[11px] text-slate-400">{{ a.read }} okuma</span>
              </div>
            </a>
          </li>
        </ul>
        <p v-if="!rest.length && !featured" class="py-16 text-center text-sm text-slate-400">
          Bu kategoride henüz yazı yok.
        </p>
      </section>

      <!-- ====== Bülten kaydı ====== -->
      <section class="mt-16 emboss-inset rounded-3xl bg-white px-8 py-10 sm:flex items-center justify-between gap-8">
        <div>
          <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">Yeni rehberlerden haberdar olun</h3>
          <p class="mt-1.5 text-sm text-slate-500">Ayda bir, klinik dijitalleşmesi üzerine seçili içerikler. Reklam yok.</p>
        </div>
        <form @submit.prevent class="mt-5 sm:mt-0 flex gap-2 shrink-0">
          <input
            type="email"
            required
            placeholder="E-posta adresiniz"
            class="emboss-inset bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#088496]/20 w-full sm:w-64"
          />
          <button type="submit" class="px-4 py-2.5 bg-[#088496] text-white rounded-xl text-sm font-bold hover:bg-[#066b7a] transition-colors shrink-0">
            Abone ol
          </button>
        </form>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowRight, BookOpen } from '@lucide/vue'
import SiteHeader from '../components/site/SiteHeader.vue'
import SiteFooter from '../components/site/SiteFooter.vue'

const categories = ['Tümü', 'Mevzuat', 'Dijital Onam', 'MHRS', 'Klinik Yönetimi']
const active = ref('Tümü')

const articles = [
  { category: 'Dijital Onam', title: 'Kağıt onamdan dijitale geçişte 7 adım', excerpt: 'Kliniğinizde ıslak imzayı yasal dijital imzayla değiştirirken izlemeniz gereken pratik yol haritası.', date: '12 Haz 2026', read: '6 dk' },
  { category: 'Mevzuat', title: 'KVKK kapsamında hasta verisi: kliniklerin sorumlulukları', excerpt: 'Aydınlatma metni, açık rıza ve saklama süreleri — sağlık verisinde uyumun temelleri.', date: '4 Haz 2026', read: '8 dk' },
  { category: 'MHRS', title: 'MHRS randevu eşitlemeyi doğru kurmak', excerpt: 'Hekim sırası ve randevu çakışmalarını önleyen senkronizasyon ayarları ve sık yapılan hatalar.', date: '28 May 2026', read: '5 dk' },
  { category: 'Klinik Yönetimi', title: 'Ameliyat malzemesinde kritik stok alarmı nasıl kurulur', excerpt: 'Barkodla takip ve eşik bazlı uyarılarla implant ve sarf malzemesi yönetimi.', date: '19 May 2026', read: '5 dk' },
  { category: 'Dijital Onam', title: 'Onam şablonlarını branşa göre özelleştirme', excerpt: 'Jinekolojiden ortopediye, işleme özel form alanları ve zorunlu açıklamalar oluşturma.', date: '7 May 2026', read: '4 dk' },
  { category: 'Mevzuat', title: 'e-İmzanın hukuki geçerliliği: bilmeniz gerekenler', excerpt: 'Zaman damgası, kimlik doğrulama ve uyuşmazlık halinde ispat yükü.', date: '22 Nis 2026', read: '7 dk' },
]

const filtered = computed(() =>
  active.value === 'Tümü' ? articles : articles.filter((a) => a.category === active.value)
)
const featured = computed(() => filtered.value[0] || null)
const rest = computed(() => filtered.value.slice(1))
</script>
