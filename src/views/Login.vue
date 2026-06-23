<template>
  <div class="relative min-h-screen flex items-center justify-center p-6 font-sans overflow-hidden">
    <!-- Reusable Liquid Mesh Gradient Backdrop -->
    <MeshGradient variant="vibrant" />

    <!-- Glassmorphic Login Card -->
    <div class="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl p-8 space-y-6 z-10 animate-fade-in-up">
      <!-- Brand Logo -->
      <div class="flex flex-col items-center gap-3">
        <div class="flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/25 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6 text-white">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-3-3v6m-9-3h18" />
          </svg>
        </div>
        <div class="text-center">
          <h1 class="text-xl font-bold tracking-tight text-slate-900 leading-none">Onamlarım</h1>
          <span class="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Tıbbi ERP ve Onam Platformu</span>
        </div>
      </div>

      <!-- Welcome text -->
      <div class="text-center space-y-1">
        <h2 class="text-sm font-bold text-slate-800">Kullanıcı Girişi</h2>
        <p class="text-[11px] text-slate-400">Klinik panelinize erişmek için kimlik bilgilerinizi doğrulayın.</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4 pt-2">
        <div class="space-y-1 text-left">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hekim Kullanıcı Adı veya E-posta</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User class="w-4 h-4" />
            </div>
            <input 
              v-model="username" 
              required
              type="text" 
              placeholder="Örn: dr.caner" 
              class="w-full pl-10 pr-3.5 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
            />
          </div>
        </div>

        <div class="space-y-1 text-left">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Şifre</label>
            <a href="#" class="text-[10px] text-blue-600 hover:text-blue-700 font-bold hover:underline">Şifremi Unuttum</a>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock class="w-4 h-4" />
            </div>
            <input 
              v-model="password" 
              required
              type="password" 
              placeholder="••••••••" 
              class="w-full pl-10 pr-3.5 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          :disabled="isLoading"
          class="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else>Sisteme Giriş Yap</span>
        </button>
      </form>

      <!-- Quick Fill Helper (for easy demo testing) -->
      <div 
        @click="quickFill"
        class="border border-slate-200/50 bg-white/40 hover:bg-white/80 p-3 rounded-2xl cursor-pointer text-left text-[10px] text-slate-500 leading-normal transition-all"
        title="Demo testi için tıklayın"
      >
        <span class="font-bold text-slate-700 block mb-0.5">Demo Giriş Bilgileri (Hızlı Doldur):</span>
        Kullanıcı: <strong class="text-blue-600 font-mono">dr.caner</strong> • Şifre: <strong class="text-blue-600 font-mono">123456</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@lucide/vue'
import MeshGradient from '../components/MeshGradient.vue'

const router = useRouter()

const username = ref('')
const password = ref('')
const isLoading = ref(false)

function quickFill() {
  username.value = 'dr.caner'
  password.value = '123456'
}

function handleLogin() {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    // Store token/flag
    localStorage.setItem('onamlarim_token', 'demo-token')
    // Go to dashboard
    router.push('/dashboard/overview')
  }, 1000)
}
</script>
