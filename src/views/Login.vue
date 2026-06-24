<template>
  <div class="relative min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden">
    <!-- Tam ekran arka plan: glossy teal+beyaz dalga videosu (loop) -->
    <div class="absolute inset-0 z-0 overflow-hidden">
      <MeshGradient variant="subtle" />
      <video
        ref="curtainVideo"
        v-show="videoOk"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        :style="{ opacity: videoReady ? 1 : 0 }"
        @canplay="videoReady = true"
        @error="videoOk = false"
      >
        <source src="/login-curtain-hd.mp4" type="video/mp4" />
      </video>
      <div class="absolute inset-0 bg-white/10 pointer-events-none"></div>
      <div class="bg-noise opacity-[0.03] mix-blend-multiply absolute inset-0 pointer-events-none"></div>
    </div>

    <!-- ============ SOL: Giriş kartı (sidebar gibi sola yaslı, saydam cam) ============ -->
    <aside
      class="relative z-20 w-full lg:w-[440px] min-h-[100svh] lg:min-h-0 lg:h-screen shrink-0 flex-col justify-center px-6 sm:px-14 py-12
             border-b lg:border-b-0 lg:border-r border-white/40
             shadow-[8px_0_40px_-12px_rgba(15,23,42,0.06)]"
      :class="revealing ? 'hidden lg:flex pointer-events-none lg:pointer-events-auto' : 'flex'"
    >
      <!-- Cam zemin: backdrop-filter ayrı katmanda — iOS'ta blur'lu elemanın kendisini
           animasyona sokmak (transform/opacity) bozuk render veriyor; dıştaki aside blur'suz kalsın. -->
      <div class="absolute inset-0 bg-white/10 backdrop-blur-2xl pointer-events-none"></div>
      <div class="bg-noise opacity-[0.03] mix-blend-multiply absolute inset-0 pointer-events-none"></div>

      <!-- Marka -->
      <div class="relative flex items-center gap-3 mb-10">
        <div class="emboss-raised flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-[#088496]">
          <BrandMark class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-slate-900 leading-none">Onamlarım</h1>
          <span class="text-[10px] font-bold text-[#088496] tracking-widest uppercase">Medical ERP</span>
        </div>
      </div>

      <!-- Başlık -->
      <div class="relative mb-7">
        <p class="text-[11px] font-bold uppercase tracking-widest text-[#088496] mb-2">Klinik Yönetim Sistemi</p>
        <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight text-engrave">
          Tekrar hoş geldiniz,
          <span class="font-serif-italic font-normal">doktor</span>.
        </h2>
        <p class="text-sm text-slate-500 mt-3 leading-relaxed">
          Klinik panelinize erişmek için kimlik bilgilerinizi doğrulayın.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="relative space-y-4">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hekim Kullanıcı Adı</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User class="w-4 h-4" />
            </div>
            <input
              v-model="username"
              required
              type="text"
              placeholder="Örn: dr.muge"
              :disabled="revealing"
              class="w-full pl-10 pr-3.5 py-2.5 text-sm emboss-inset bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#088496]/25 transition-all duration-300 disabled:opacity-60"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Şifre</label>
            <a href="#" class="text-[10px] text-[#088496] hover:text-[#066b7a] font-bold hover:underline">Şifremi Unuttum</a>
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
              :disabled="revealing"
              class="w-full pl-10 pr-3.5 py-2.5 text-sm emboss-inset bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#088496]/25 transition-all duration-300 disabled:opacity-60"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading || revealing"
          class="w-full py-3 bg-[#088496] text-white rounded-xl text-sm font-bold hover:bg-[#066b7a] shadow-md shadow-[#088496]/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <template v-else-if="revealing">Hoş geldiniz…</template>
          <template v-else>Sisteme Giriş Yap <ArrowRight class="w-4 h-4" /></template>
        </button>
      </form>

      <!-- Demo helper -->
      <div
        @click="quickFill"
        class="relative mt-6 emboss-inset bg-white/60 hover:bg-white p-3 rounded-2xl cursor-pointer text-left text-[10px] text-slate-500 leading-normal transition-all"
        title="Demo testi için tıklayın"
      >
        <span class="font-bold text-slate-700 block mb-0.5">Demo Giriş (Hızlı Doldur):</span>
        Kullanıcı: <strong class="text-[#088496] font-mono">dr.muge</strong> • Şifre: <strong class="text-[#088496] font-mono">123456</strong>
      </div>
    </aside>

    <!-- ============ SAĞ: İçerik / reveal sahnesi ============ -->
    <main
      class="flex-col items-center justify-center px-8 py-12 overflow-hidden"
      :class="revealing
        ? 'fixed inset-0 z-10 flex lg:relative lg:inset-auto lg:z-10 lg:flex-1'
        : 'fixed inset-0 -z-10 flex pointer-events-none lg:relative lg:inset-auto lg:flex-1'"
    >
      <!-- Doktor kartı: SOL ÜST, soldan gelir -->
      <div
        class="absolute top-8 left-8 sm:top-12 sm:left-12 w-32 sm:w-44 aspect-[3/4] rounded-[24px] overflow-hidden emboss-raised bg-white ring-1 ring-[#088496]/15 transform-gpu will-change-transform lg:transition-[opacity,transform] lg:duration-[850ms] lg:delay-[400ms] lg:ease-[cubic-bezier(.22,1,.36,1)]"
        :class="revealActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16 pointer-events-none'"
      >
        <img
          src="/dr-muge.jpg"
          alt="Dr. Müge Ateş Tıkız"
          class="w-full h-full object-cover object-top"
          @error="photoOk = false"
          v-show="photoOk"
        />
        <div v-if="!photoOk" class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 text-xs">dr-muge.jpg</div>
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 to-transparent px-3.5 pt-8 pb-3 text-left">
          <p class="text-xs sm:text-sm font-bold text-white leading-tight">Dr. Müge Ateş Tıkız</p>
          <p class="text-[9px] sm:text-[10px] text-white/80">Jinekolojik Onkolog</p>
        </div>
      </div>

      <!-- Okul amblemi kartı: SAĞ ALT, sağdan gelir -->
      <div
        class="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 bg-white/15 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_30px_-8px_rgba(15,23,42,0.12)] px-5 sm:px-6 py-4 sm:py-5 flex flex-col items-center text-center transform-gpu will-change-transform lg:transition-[opacity,transform] lg:duration-[850ms] lg:delay-[700ms] lg:ease-[cubic-bezier(.22,1,.36,1)]"
        :class="revealActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16 pointer-events-none'"
      >
        <img
          src="/istanbul-tip-amblem.png"
          alt="İstanbul Üniversitesi İstanbul Tıp Fakültesi"
          class="w-16 sm:w-24 h-auto"
          @error="emblemOk = false"
          v-show="emblemOk"
        />
        <p class="mt-2 text-[9px] sm:text-[10px] font-semibold text-slate-500 leading-snug">
          İstanbul Üniversitesi<br />İstanbul Tıp Fakültesi
        </p>
      </div>

      <!-- Hoş geldiniz: merkez, kurumsal teal -->
      <p
        class="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl font-serif-italic text-[#088496] pointer-events-none lg:transition-all lg:duration-700 lg:delay-[1100ms]"
        :class="revealActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
      >
        Hoş geldiniz
      </p>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, ArrowRight } from '@lucide/vue'
import BrandMark from '../components/icons/BrandMark.vue'
import MeshGradient from '../components/MeshGradient.vue'

const router = useRouter()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const revealing = ref(false)
const revealActive = ref(false)
const videoOk = ref(true)
const videoReady = ref(false)
const emblemOk = ref(true)
const photoOk = ref(true)

/* ---------- Akışkan perde: tek video, native loop ---------- */
const curtainVideo = ref(null)
let loginTimer = null
let redirectTimer = null

onMounted(() => {
  const v = curtainVideo.value
  if (v) v.play().catch(() => {})
})

onBeforeUnmount(() => {
  if (loginTimer) clearTimeout(loginTimer)
  if (redirectTimer) clearTimeout(redirectTimer)
})

function quickFill() {
  username.value = 'dr.muge'
  password.value = '123456'
}

function handleLogin() {
  if (!username.value || !password.value || revealing.value) return
  isLoading.value = true
  // kısa doğrulama → reveal animasyonu → dashboard
  loginTimer = setTimeout(() => {
    isLoading.value = false
    revealing.value = true
    localStorage.setItem('onamlarim_token', 'demo-token')
    // Reveal sahnesini önce yerleştir/boyat (mobilde -z-10 ile gizli olduğu için
    // start state commit edilmiyordu); kartların geçişini bir sonraki frame'de tetikle.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { revealActive.value = true })
    })
    redirectTimer = setTimeout(() => router.push('/dashboard/overview'), 3000)
  }, 700)
}
</script>
