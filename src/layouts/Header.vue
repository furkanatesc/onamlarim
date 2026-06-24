<template>
  <header class="h-16 border-b border-white/60 bg-white/55 backdrop-blur-xl sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between gap-3">
    <!-- Mobil menü (hamburger) -->
    <button
      @click="toggle"
      class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl emboss-inset bg-white text-slate-600 shrink-0"
      aria-label="Menüyü aç"
    >
      <Menu class="w-5 h-5" />
    </button>

    <!-- Search Bar with keyboard shortcut -->
    <div class="relative hidden md:block w-full md:w-72 lg:w-96">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search class="h-4 w-4 text-slate-400" />
      </div>
      <input
        ref="searchInputRef"
        v-model="patientStore.searchQuery"
        type="search"
        placeholder="Hasta, onam veya malzeme ara..."
        class="block w-full pl-9 pr-16 py-1.5 emboss-inset bg-white/70 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#088496]/20 transition-all duration-300"
      />
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md shadow-xs select-none">
          {{ isMac ? '⌘K' : 'Ctrl+K' }}
        </kbd>
      </div>
    </div>

    <!-- Actions & Profile Info -->
    <div class="flex items-center gap-3 sm:gap-6 ml-auto">
      <!-- MHRS Sync Badge -->
      <div 
        @click="triggerSync"
        class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full emboss-inset bg-white/60 hover:bg-white/80 cursor-pointer select-none transition-all duration-300"
        title="MHRS randevularını eşitle"
      >
        <span class="relative flex h-2 w-2">
          <span 
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :class="syncStatus === 'synced' ? 'bg-emerald-400' : syncStatus === 'syncing' ? 'bg-amber-400' : 'bg-rose-400'"
          ></span>
          <span 
            class="relative inline-flex rounded-full h-2 w-2"
            :class="syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500' : 'bg-rose-500'"
          ></span>
        </span>
        <span class="text-[10px] font-semibold text-slate-600 tracking-wide uppercase flex items-center gap-1.5">
          MHRS Eşitleme: 
          <span 
            class="font-bold"
            :class="syncStatus === 'synced' ? 'text-emerald-600' : syncStatus === 'syncing' ? 'text-amber-600' : 'text-rose-600'"
          >
            {{ syncStatus === 'synced' ? 'Güncel' : syncStatus === 'syncing' ? 'Eşitleniyor...' : 'Hata' }}
          </span>
        </span>
        <RefreshCw 
          class="w-3 h-3 text-slate-400" 
          :class="{ 'animate-spin text-[#088496]': isSyncing }"
        />
      </div>

      <!-- Quick Date Display -->
      <div class="hidden md:flex flex-col items-end">
        <span class="text-xs font-semibold text-slate-700">11 Haziran 2026</span>
        <span class="text-[10px] text-slate-400 font-medium">Son Güncelleme: {{ lastSyncTime }}</span>
      </div>

      <!-- Notifications -->
      <button class="relative p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors duration-300">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
      </button>

      <!-- Doctor/User Dropdown -->
      <div ref="dropdownRef" class="relative">
        <button 
          @click="toggleDropdown" 
          class="flex items-center gap-2 group focus:outline-none"
        >
          <div class="emboss-inset w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-[#088496] text-sm transition-colors duration-300">
            MA
          </div>
          <ChevronDown class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-300" :class="{ 'rotate-180': isDropdownOpen }" />
        </button>

        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div 
            v-if="isDropdownOpen" 
            class="absolute right-0 mt-2.5 w-56 rounded-xl border border-slate-200/50 bg-white shadow-xl py-1.5 z-50 text-slate-700 text-xs"
          >
            <div class="px-4 py-2 border-b border-slate-100">
              <p class="font-bold text-slate-800">Dr. Müge Ateş Tıkız</p>
              <p class="text-[10px] text-slate-400">Jinekolojik Onkolog</p>
            </div>
            <router-link to="/dashboard/profile" @click="isDropdownOpen = false" class="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors">
              <User class="w-3.5 h-3.5 text-slate-400" /> Profilim
            </router-link>
            <router-link to="/dashboard/settings" @click="isDropdownOpen = false" class="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors">
              <Settings class="w-3.5 h-3.5 text-slate-400" /> Ayarlar
            </router-link>
            <button 
              @click="logout" 
              class="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors border-t border-slate-100 text-rose-600 hover:bg-rose-50/50 cursor-pointer"
            >
              <LogOut class="w-3.5 h-3.5 text-rose-400" /> Çıkış Yap
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  RefreshCw,
  Menu
} from '@lucide/vue'
import { useMagicKeys, onClickOutside } from '@vueuse/core'
import { useMhrsSync } from '../composables/useMhrsSync'
import { usePatientStore } from '../store/usePatientStore'
import { useSidebar } from '../composables/useSidebar'

const { toggle } = useSidebar()
const router = useRouter()
const patientStore = usePatientStore()
const { isSyncing, lastSyncTime, syncStatus, triggerSync } = useMhrsSync()

function logout() {
  localStorage.removeItem('onamlarim_token')
  router.push('/login')
}

// Keyboard shortcut detection using VueUse
const keys = useMagicKeys()
const searchInputRef = ref(null)
const isMac = computed(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0)

// Listen to Cmd+K (Mac) or Ctrl+K (Windows/Linux)
const shortcut = computed(() => {
  return isMac.value ? keys['meta+k'] : keys['ctrl+k']
})

// Focus search input on shortcut trigger
onMounted(() => {
  shortcut.value ? focusSearch() : null
})

// Watch for keyboard combinations
const combo = isMac.value ? 'meta+k' : 'ctrl+k'
watch(() => keys[combo].value, (v) => {
  if (v) {
    focusSearch()
  }
})

function focusSearch() {
  if (searchInputRef.value) {
    searchInputRef.value.focus()
    searchInputRef.value.select()
  }
}

// Dropdown state
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)
function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}
// Dışarı tıkta dropdown'u kapat
onClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
})
</script>
