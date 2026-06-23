<template>
  <div class="relative min-h-screen flex flex-col font-sans overflow-hidden">
    <!-- Reusable Vibrant Liquid Mesh Gradient Backdrop -->
    <MeshGradient variant="vibrant" />

    <!-- Navigation Header (Glassmorphic) -->
    <header class="bg-white/50 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50 px-6 lg:px-16 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-md shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4.5 h-4.5 text-white">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-3-3v6m-9-3h18" />
          </svg>
        </div>
        <div>
          <span class="text-sm font-bold text-slate-900 tracking-tight">Onamlarım</span>
          <span class="text-[9px] font-bold text-blue-600 tracking-wider uppercase ml-1.5">ERP</span>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <router-link 
          to="/login"
          class="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/10 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          Sisteme Giriş Yap
        </router-link>
      </div>
    </header>

    <!-- Hero & Features Content -->
    <section class="flex-1 max-w-6xl mx-auto px-6 py-16 lg:py-24 text-center space-y-12 z-10 relative">
      <div class="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        <span class="px-3 py-1 bg-blue-50/60 backdrop-blur-md text-blue-600 border border-white/60 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
          Türkiye'nin Klinik ve ERP Odaklı Onam Platformu
        </span>
        <h1 class="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Sağlık Kuruluşları İçin <span class="text-blue-600">Dijital Onam</span> ve Klinik Yönetim Platformu
        </h1>
        <p class="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Kağıt onam formlarını geride bırakın. MHRS randevu eşitleme, gerçek zamanlı stok takibi ve akıllı hasta CRM sistemi ile kliniğinizi dijitalleştirin.
        </p>
        <div class="flex justify-center gap-4 pt-4">
          <router-link 
            to="/login"
            class="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/10 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Hemen Başlayın <ArrowRight class="w-4 h-4" />
          </router-link>
          <a 
            href="#features"
            class="px-6 py-2.5 border border-white/60 bg-white/40 backdrop-blur-md text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50/50 hover:-translate-y-0.5 transition-all"
          >
            Özellikleri İncele
          </a>
        </div>
      </div>

      <!-- Feature Grid (Glassmorphic Cards) -->
      <div id="features" class="grid grid-cols-1 md:grid-cols-4 gap-6 pt-12 animate-fade-in-up animation-delay-200">
        <div class="bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300 text-left space-y-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center">
            <FileSignature class="w-4.5 h-4.5" />
          </div>
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Dijital İmza & Onam</h3>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Tablet ve mobil cihazlarda parmak veya kalem ile yasal ve güvenli dijital imza toplama.
          </p>
        </div>

        <div class="bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300 text-left space-y-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center">
            <RefreshCw class="w-4.5 h-4.5" />
          </div>
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Randevu Eşitleme</h3>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Merkezi Hekim Randevu Sistemi (MHRS) ile randevuları, hekim sıralarını ve hasta listelerini anlık eşitleyin.
          </p>
        </div>

        <div class="bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300 text-left space-y-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center">
            <Package class="w-4.5 h-4.5" />
          </div>
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Klinik Stok Takibi</h3>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Kritik ameliyat malzemelerini ve implantları barkod tarayıcı ile takip edin, stok alarmları alın.
          </p>
        </div>

        <div class="bg-white/50 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300 text-left space-y-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center">
            <Users class="w-4.5 h-4.5" />
          </div>
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Akıllı Hasta CRM</h3>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Hastalarınızın tıbbi dosyalarını, onam geçmişlerini ve iletişim geçmişlerini tek panelden yönetin.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white/40 backdrop-blur-md border-t border-white/40 py-8 text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase z-10 relative">
      © 2026 ONAMLARIM MEDICAL ERP. TÜM HAKLARI SAKLIDIR.
    </footer>
  </div>
</template>

<script setup>
import { ArrowRight, FileSignature, RefreshCw, Package, Users } from '@lucide/vue'
import MeshGradient from '../components/MeshGradient.vue'
</script>
