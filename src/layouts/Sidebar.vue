<template>
  <aside class="w-64 h-screen fixed left-0 top-0 z-20 flex flex-col justify-between backdrop-blur-md bg-white/75 border-r border-slate-200/60 p-6 select-none transition-all duration-300">
    <div class="flex flex-col gap-8">
      <!-- Brand Logo -->
      <div class="flex items-center gap-3 px-2">
        <div class="emboss-raised flex items-center justify-center w-10 h-10 rounded-xl bg-white text-[#088496]">
          <BrandMark class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-slate-900 leading-none">Onamlarım</h1>
          <span class="text-[10px] font-semibold text-[#088496] tracking-wider uppercase">Medical ERP</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex flex-col gap-1.5">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group hover:translate-x-1"
          :class="[
            $route.path === item.path
              ? 'bg-[#088496] text-white shadow-md shadow-[#088496]/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
          ]"
        >
          <component 
            :is="item.icon" 
            class="w-4.5 h-4.5 transition-transform duration-300"
            :class="[
              $route.path === item.path 
                ? 'text-white scale-110' 
                : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-108'
            ]"
          />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>
    </div>

    <!-- User / Footer Info -->
    <div class="border-t border-slate-200/50 pt-4 flex flex-col gap-3">
      <div class="flex items-center gap-3 px-2">
        <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200/50">
          MA
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-slate-800 truncate">Dr. Müge Ateş Tıkız</p>
          <p class="text-[10px] text-slate-400 truncate">Jinekolojik Onkolog</p>
        </div>
      </div>
      <div class="text-[10px] text-slate-400 px-2 text-center">
        v1.2.0 • Klinik Modülü
      </div>
    </div>
  </aside>
</template>

<script setup>
import { LayoutDashboard } from '@lucide/vue'
import BrandMark from '../components/icons/BrandMark.vue'
import IconConsent from '../components/icons/IconConsent.vue'
import IconCrm from '../components/icons/IconCrm.vue'
import IconStock from '../components/icons/IconStock.vue'
import IconMhrs from '../components/icons/IconMhrs.vue'

const menuItems = [
  { name: 'Kontrol Paneli', path: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Dijital Onamlar', path: '/dashboard/consents', icon: IconConsent },
  { name: 'Hasta CRM', path: '/dashboard/crm', icon: IconCrm },
  { name: 'Malzeme & Envanter', path: '/dashboard/inventory', icon: IconStock },
  { name: 'MHRS Randevu Eşitleme', path: '/dashboard/mhrs-sync', icon: IconMhrs },
]
</script>

<style scoped>
/* Expand text slightly or style router active link */
.router-link-active {
  font-weight: 600;
}
</style>
