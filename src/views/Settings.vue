<template>
  <div class="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">Klinik & Sistem Ayarları</h2>
      <p class="text-xs text-slate-500">Randevu sürelerini, bildirim tercihlerinizi ve e-İmza entegrasyon ayarlarını yapılandırın.</p>
    </div>

    <!-- Forms -->
    <div class="bg-white emboss-raised rounded-2xl p-6 space-y-8">
      
      <!-- Section 1: Clinic profile -->
      <div class="space-y-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Klinik Tanıtım Bilgileri</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Klinik Kurum Adı</label>
            <input v-model="settings.clinicName" type="text" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Klinik Adresi</label>
            <input v-model="settings.address" type="text" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300" />
          </div>
        </div>
      </div>

      <!-- Section 2: Patient and Sync Options -->
      <div class="space-y-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Randevu & Muayene Yapılandırmaları</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Muayene Randevu Süresi</label>
            <select v-model="settings.appointmentDuration" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300">
              <option value="15">15 Dakika (Hızlı Muayene)</option>
              <option value="20">20 Dakika (Standart Klinik Muayene)</option>
              <option value="30">30 Dakika (Detaylı Hekim Muayenesi)</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Otomatik Randevu Eşitleme Aralığı</label>
            <select v-model="settings.syncInterval" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300">
              <option value="30">30 Saniyede Bir</option>
              <option value="60">1 Dakikada Bir (Önerilen)</option>
              <option value="300">5 Dakikada Bir</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section 3: Notification and e-signature toggles -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Notification details -->
        <div class="space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Bildirim Tercihleri</h3>
          <div class="flex flex-col gap-3 text-xs text-slate-600 font-semibold">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input v-model="settings.smsReminders" type="checkbox" class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
              <span>Eşitleme sonrası hastaya SMS ile bilgilendirme yap</span>
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input v-model="settings.stockAlerts" type="checkbox" class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
              <span>Malzemeler kritik limitin altına indiğinde e-posta uyarısı al</span>
            </label>
          </div>
        </div>

        <!-- Integration details -->
        <div class="space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Hukuki Entegrasyon Ayarları</h3>
          <div class="flex flex-col gap-3 text-xs text-slate-600 font-semibold">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input v-model="settings.eSignature" type="checkbox" class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
              <span>e-İmza (e-Güven/TÜBİTAK) entegrasyonunu doğrula</span>
            </label>
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input v-model="settings.eNabizSync" type="checkbox" class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
              <span>İmzalanan onam formlarını E-Nabız sistemine anlık aktar</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
        <button 
          @click="saveSettings" 
          :disabled="saving"
          class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span v-if="saving" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>Ayarları Kaydet</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const saving = ref(false)

const settings = ref({
  clinicName: 'Onamlarım Poliklinikleri',
  address: 'Konyaaltı, Antalya',
  appointmentDuration: '20',
  syncInterval: '60',
  smsReminders: true,
  stockAlerts: true,
  eSignature: true,
  eNabizSync: true
})

function saveSettings() {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    alert('Sistem ayarları başarıyla kaydedildi!')
  }, 1000)
}
</script>
