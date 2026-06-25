<template>
  <header
    class="fixed top-0 inset-x-0 z-50 h-16 px-6 lg:px-16 flex items-center justify-between border-b transition-colors"
    :class="variant === 'solid'
      ? 'bg-white/70 backdrop-blur-md border-white/40'
      : 'bg-white/10 backdrop-blur-md border-white/20'"
  >
    <router-link to="/" class="flex items-center gap-3">
      <div class="emboss-raised flex items-center justify-center w-11 h-11 rounded-xl bg-white text-[#088496]">
        <BrandMark class="w-9 h-9" />
      </div>
      <div>
        <span class="text-sm font-bold text-slate-900 tracking-tight">Onamlarım</span>
        <span class="text-[9px] font-extrabold text-[#088496] tracking-widest uppercase ml-1.5">ERP</span>
      </div>
    </router-link>

    <nav class="hidden md:flex items-center gap-1 emboss-inset rounded-full px-2 py-1.5 bg-white/60">
      <router-link
        v-for="item in nav"
        :key="item.label"
        :to="item.to"
        class="px-3.5 py-1 rounded-full text-xs font-semibold transition-colors"
        :class="isActive(item)
          ? 'text-slate-900 bg-white emboss-raised'
          : 'text-slate-500 hover:text-slate-900'"
      >
        {{ item.label }}
      </router-link>
    </nav>

    <div class="flex items-center gap-2">
      <router-link
        to="/login"
        class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-bold hover:bg-[#066b7a] shadow-md shadow-[#08849640] hover:-translate-y-0.5 transition-all"
      >
        Giriş Yap
      </router-link>
      <button
        type="button"
        @click="open = !open"
        class="md:hidden emboss-inset flex items-center justify-center w-9 h-9 rounded-xl bg-white text-slate-700"
        :aria-label="open ? 'Menüyü kapat' : 'Menüyü aç'"
        :aria-expanded="open"
      >
        <X v-if="open" class="w-4 h-4" />
        <Menu v-else class="w-4 h-4" />
      </button>
    </div>
  </header>

  <!-- Mobil menü -->
  <transition
    enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
    leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 -translate-y-2"
  >
    <nav
      v-if="open"
      class="md:hidden fixed top-16 inset-x-0 z-40 mx-4 mt-2 rounded-2xl bg-white/90 backdrop-blur-xl emboss-raised p-2"
    >
      <router-link
        v-for="item in nav"
        :key="item.label"
        :to="item.to"
        @click="open = false"
        class="block px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
        :class="isActive(item) ? 'text-[#088496] bg-[#088496]/5' : 'text-slate-600 hover:bg-slate-50'"
      >
        {{ item.label }}
      </router-link>
    </nav>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X } from '@lucide/vue'
import BrandMark from '../icons/BrandMark.vue'

defineProps({ variant: { type: String, default: 'transparent' } })

const route = useRoute()
const open = ref(false)
const nav = [
  { label: 'Platform', to: '/platform' },
  { label: 'Özellikler', to: '/ozellikler' },
  { label: 'Kütüphane', to: '/kutuphane' },
  { label: 'Fiyatlandırma', to: '/fiyatlandirma' },
]
function isActive(item) {
  return route.path === item.to
}
</script>
