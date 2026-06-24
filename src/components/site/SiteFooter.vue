<template>
  <footer class="relative mt-28 pt-14 pb-10 px-6 lg:px-16">
    <!-- ince terracotta vurgulu ayraç -->
    <div class="mx-auto mb-12 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-[#E8755D]/30 to-transparent"></div>

    <div class="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <div class="flex items-center gap-3">
          <div class="emboss-raised flex items-center justify-center w-10 h-10 rounded-xl bg-white text-[#088496]">
            <BrandMark class="w-7 h-7" />
          </div>
          <span class="text-sm font-bold text-slate-900 tracking-tight">Onamlarım</span>
        </div>
        <p class="mt-4 text-xs text-slate-500 leading-relaxed max-w-xs">
          Sağlık kuruluşları için dijital onam ve klinik yönetim platformu.
        </p>
      </div>

      <div v-for="col in columns" :key="col.title">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{{ col.title }}</p>
        <ul class="space-y-2">
          <li v-for="l in col.links" :key="l.label">
            <router-link :to="l.to" class="text-xs text-slate-500 hover:text-[#088496] transition-colors">
              {{ l.label }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <div class="max-w-6xl mx-auto mt-12 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p class="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
        © 2026 Onamlarım Medical ERP
      </p>
      <p class="text-[10px] text-slate-400">Türkiye’de ✦ KVKK uyumlu altyapı</p>
    </div>
  </footer>
</template>

<script setup>
import BrandMark from '../icons/BrandMark.vue'

const columns = [
  {
    title: 'Ürün',
    links: [
      { label: 'Özellikler', to: '/#features' },
      { label: 'Fiyatlandırma', to: '/fiyatlandirma' },
      { label: 'Platform', to: '/#features' },
    ],
  },
  {
    title: 'Kaynaklar',
    links: [
      { label: 'Kütüphane', to: '/kutuphane' },
      { label: 'MHRS Rehberi', to: '/kutuphane' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'KVKK Aydınlatma', to: '/kutuphane' },
      { label: 'Gizlilik', to: '/kutuphane' },
    ],
  },
]
</script>
