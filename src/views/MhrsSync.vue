<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Merkezi Hekim Randevu Sistemi (MHRS) Eşitleme</h2>
        <p class="text-xs text-slate-500">Hekim randevularını, günlük hasta listelerini ve bekleme kuyruklarını bakanlık sistemleriyle güncelleyin.</p>
      </div>
      <button 
        @click="triggerSync"
        :disabled="isSyncing"
        class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isSyncing }" /> MHRS Randevularını Eşitle
      </button>
    </div>

    <!-- Status Cards & Settings panel -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up animation-delay-100">
      <!-- Sync Status Widget -->
      <div class="md:col-span-2 bg-white emboss-raised rounded-2xl p-6 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
              <span class="relative inline-flex rounded-full h-3 w-3" :class="syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            </span>
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Eşitleme Durumu</h3>
          </div>

          <div class="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 text-xs font-medium text-slate-600">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MHRS Bağlantı Durumu</p>
              <p class="font-extrabold text-emerald-600 text-sm mt-1">GÜVENLİ VE GÜNCEL</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MHRS Servis API Sürümü</p>
              <p class="font-bold text-slate-800 text-sm mt-1">v4.1.2-PRD</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Son Güncelleme Zamanı</p>
              <p class="font-bold text-slate-800 text-sm mt-1">{{ lastSyncTime }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Güncelleme Sıklığı</p>
              <p class="font-bold text-slate-850 text-sm mt-1">Her 60 saniyede bir</p>
            </div>
          </div>
        </div>

        <div v-if="isSyncing" class="text-xs text-[#088496] font-bold animate-pulse mt-4 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#088496] animate-ping"></span>
          Sağlık Bakanlığı sunucularından randevu bilgileri alınıyor...
        </div>
        <div v-else class="text-[10px] text-slate-400 mt-4">
          MHRS güvenli bağlantısı e-imza altyapısı üzerinden doğrulanmıştır.
        </div>
      </div>

      <!-- Settings Panel -->
      <div class="bg-white emboss-raised rounded-2xl p-6 space-y-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Eşitleme Ayarları</h3>
        <div class="flex flex-col gap-3 text-xs text-slate-600 font-medium">
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
            <span>Arka planda otomatik güncelle</span>
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
            <span>Güncelleme sonrası hastaya SMS gönder</span>
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
            <span>Yeni randevulara otomatik onam formu hazırla</span>
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked class="w-4 h-4 rounded text-[#088496] border-slate-200 focus:ring-[#088496]/20" />
            <span>E-Nabız protokolleriyle eşleştir</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Active MHRS Queued Appointments -->
    <div class="bg-white emboss-raised rounded-2xl overflow-hidden animate-fade-in-up animation-delay-200">
      <div class="px-6 py-5 border-b border-slate-100">
        <h3 class="text-sm font-bold text-slate-800">Bugünkü MHRS Randevu Listesi (11 Haziran 2026)</h3>
        <p class="text-[10px] text-slate-400">Klinik sırası Sağlık Bakanlığı veri tabanından anlık çekilmektedir.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <th class="px-6 py-3.5">Randevu Saati</th>
              <th class="px-6 py-3.5">Hasta Bilgileri</th>
              <th class="px-6 py-3.5">Sorumlu Hekim</th>
              <th class="px-6 py-3.5">Poliklinik / Bölüm</th>
              <th class="px-6 py-3.5">Randevu Durumu</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="app in appointments" :key="app.time" class="hover:bg-slate-50/30 transition-colors">
              <td class="px-6 py-4 font-bold text-[#088496] font-mono text-sm">
                {{ app.time }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg emboss-inset bg-white text-[#088496] flex items-center justify-center font-bold text-xs">
                    {{ app.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-800">{{ app.name }}</p>
                    <p class="text-[9px] text-slate-400 font-mono">TC: {{ app.tc }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-semibold text-slate-700">
                {{ app.doctor }}
              </td>
              <td class="px-6 py-4 text-slate-500 font-medium">
                {{ app.department === 'Gyn Oncology' ? 'Jinekolojik Onkoloji' : app.department }}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/30">
                  <span class="w-1.2 h-1.2 rounded-full bg-emerald-500"></span> Onaylandı
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RefreshCw, CalendarCheck, Layers, AlertTriangle, CheckCircle } from '@lucide/vue'
import { useMhrsSync } from '../composables/useMhrsSync'

const { isSyncing, lastSyncTime, syncStatus, triggerSync } = useMhrsSync()

const appointments = ref([
  { time: '09:00', name: 'Ahmet Yılmaz', tc: '234******92', doctor: 'Dr. Müge Ateş Tıkız', department: 'Gyn Oncology' },
  { time: '10:15', name: 'Merve Demir', tc: '109******84', doctor: 'Dr. Müge Ateş Tıkız', department: 'Gyn Oncology' },
  { time: '11:00', name: 'Caner Özkan', tc: '482******92', doctor: 'Dr. Müge Ateş Tıkız', department: 'Gyn Oncology' },
  { time: '13:30', name: 'Elif Kaya', tc: '592******91', doctor: 'Dr. Müge Ateş Tıkız', department: 'Gyn Oncology' },
  { time: '14:45', name: 'Zeynep Çelik', tc: '184******85', doctor: 'Dr. Müge Ateş Tıkız', department: 'Gyn Oncology' }
])
</script>
