<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Top Greeting Section (Staggered item 1) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Klinik Kontrol Paneli</h2>
        <p class="text-xs text-slate-500">Dijital hasta onam formlarını, klinik malzemeleri ve randevuları yönetin.</p>
      </div>
      <!-- MHRS Calendar Sync State Summary -->
      <div class="flex items-center gap-3 emboss-raised bg-white rounded-xl px-4 py-2">
        <CalendarCheck class="w-4 h-4 text-[#088496]" />
        <div class="text-left">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MHRS Randevuları</p>
          <p class="text-xs font-bold text-slate-800">Bugün {{ appointmentCount }} Randevu</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions Row (Staggered item 2) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up animation-delay-100">
      <button 
        @click="openModal('consent')"
        class="flex items-center justify-between p-4 emboss-raised bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300 group text-left cursor-pointer"
      >
        <div class="flex items-center gap-3.5">
          <div class="emboss-inset w-10 h-10 rounded-xl bg-white text-[#088496] flex items-center justify-center group-hover:bg-[#088496] group-hover:text-white transition-colors duration-300">
            <FileSignature class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800">Yeni Dijital Onam</h4>
            <p class="text-[10px] text-slate-400">Yasal onam belgesi oluştur</p>
          </div>
        </div>
        <ArrowUpRight class="w-4 h-4 text-slate-300 group-hover:text-[#088496] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
      </button>

      <button 
        @click="openModal('patient')"
        class="flex items-center justify-between p-4 emboss-raised bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300 group text-left cursor-pointer"
      >
        <div class="flex items-center gap-3.5">
          <div class="emboss-inset w-10 h-10 rounded-xl bg-white text-[#088496] flex items-center justify-center group-hover:bg-[#088496] group-hover:text-white transition-colors duration-300">
            <UserPlus class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800">Hasta Kaydet</h4>
            <p class="text-[10px] text-slate-400">CRM sistemine yeni hasta ekle</p>
          </div>
        </div>
        <ArrowUpRight class="w-4 h-4 text-slate-300 group-hover:text-[#088496] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
      </button>

      <button 
        @click="openModal('material')"
        class="flex items-center justify-between p-4 emboss-raised bg-white rounded-2xl hover:-translate-y-0.5 transition-all duration-300 group text-left cursor-pointer"
      >
        <div class="flex items-center gap-3.5">
          <div class="emboss-inset w-10 h-10 rounded-xl bg-white text-[#088496] flex items-center justify-center group-hover:bg-[#088496] group-hover:text-white transition-colors duration-300">
            <Camera class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-800">Malzeme Tara</h4>
            <p class="text-[10px] text-slate-400">Barkod okut ve stok güncelle</p>
          </div>
        </div>
        <ArrowUpRight class="w-4 h-4 text-slate-300 group-hover:text-[#088496] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
      </button>
    </div>

    <!-- ERP Stats / Quick Overview Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up animation-delay-200">
      <div class="p-5 emboss-raised bg-white rounded-2xl flex flex-col gap-1.5">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Hasta</span>
        <span class="text-2xl font-extrabold text-slate-800">{{ patientStore.patients.length }}</span>
        <span class="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
          <Plus class="w-2.5 h-2.5" /> bugün 2 yeni kayıt
        </span>
      </div>
      <div class="p-5 emboss-raised bg-white rounded-2xl flex flex-col gap-1.5">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İmzalanan Onamlar</span>
        <span class="text-2xl font-extrabold text-slate-800">{{ consentStore.signedConsents.length }}</span>
        <span class="text-[9px] text-[#088496] font-semibold">
          %{{ Math.round((consentStore.signedConsents.length / (consentStore.consents.length || 1)) * 100) }} Tamamlanma oranı
        </span>
      </div>
      <div class="p-5 emboss-raised bg-white rounded-2xl flex flex-col gap-1.5">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İmza Bekleyen</span>
        <span class="text-2xl font-extrabold text-slate-800 text-amber-600">{{ consentStore.pendingConsents.length }}</span>
        <span class="text-[9px] text-amber-500 font-medium">İmza işlemi bekleniyor</span>
      </div>
      <div class="p-5 emboss-raised bg-white rounded-2xl flex flex-col gap-1.5">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kritik Stok Uyarıları</span>
        <span class="text-2xl font-extrabold" :class="inventoryStore.lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-800'">
          {{ inventoryStore.lowStockItems.length }}
        </span>
        <span class="text-[9px]" :class="inventoryStore.lowStockItems.length > 0 ? 'text-rose-500 font-medium' : 'text-slate-400'">
          {{ inventoryStore.lowStockItems.length > 0 ? 'Limit altı malzemeler var' : 'Tüm stok düzeyleri sağlıklı' }}
        </span>
      </div>
    </div>

    <!-- Main Views Split Grid (Staggered item 3) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-300">
      
      <!-- Pending Consents Data Table (Spans 2 columns on large screens) -->
      <div class="emboss-raised bg-white rounded-2xl overflow-hidden lg:col-span-2 flex flex-col justify-between">
        <div>
          <!-- Card Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-800">İmza Bekleyen Onamlar</h3>
              <p class="text-[10px] text-slate-400">Hasta tarafından onaylanması gereken dijital onam belgeleri.</p>
            </div>
            <router-link to="/dashboard/consents" class="text-[10px] text-[#088496] hover:text-[#066b7a] font-bold hover:underline">
              Tüm Onamları Gör
            </router-link>
          </div>

          <!-- Borderless Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th class="px-6 py-3.5">Hasta Adı</th>
                  <th class="px-6 py-3.5">Uygulanacak İşlem</th>
                  <th class="px-6 py-3.5">Durum</th>
                  <th class="px-6 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="consentStore.pendingConsents.length === 0">
                  <td colspan="4" class="px-6 py-12">
                    <div class="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <EmptyConsents class="w-24 h-24 text-[#088496]" />
                      <p class="text-xs font-medium">İmza bekleyen onam formu bulunmuyor. Tüm işlemler tamam!</p>
                    </div>
                  </td>
                </tr>
                <tr 
                  v-for="consent in consentStore.pendingConsents.slice(0, 5)" 
                  :key="consent.id"
                  class="text-xs hover:bg-slate-50/30 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="emboss-inset w-7 h-7 rounded-lg bg-white text-[#088496] flex items-center justify-center font-bold text-[10px]">
                        {{ consent.patientName.charAt(0) }}
                      </div>
                      <div>
                        <p class="font-semibold text-slate-800">{{ consent.patientName }}</p>
                        <p class="text-[9px] text-slate-400 font-mono">{{ consent.patientId }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-medium text-slate-700">{{ consent.procedure }}</p>
                    <p class="text-[9px] text-slate-400">{{ consent.doctor }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/30">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      İmza Bekliyor
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      @click="triggerSignatureModal(consent)"
                      class="px-3 py-1.5 bg-[#088496] text-white font-semibold text-[10px] rounded-lg hover:bg-[#066b7a] shadow-xs hover:shadow-md hover:shadow-[#088496]/20 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <PenTool class="w-3 h-3" /> Cihazda İmzalat
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-slate-50 bg-slate-50/20 text-right">
          <span class="text-[10px] text-slate-400 font-medium">İmza bekleyen ilk 5 belge listeleniyor</span>
        </div>
      </div>

      <!-- Inventory alerts and sparklines -->
      <div class="emboss-raised bg-white rounded-2xl overflow-hidden flex flex-col">
        <!-- Card Header -->
        <div class="px-6 py-5 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-800">Kritik Stok Uyarıları</h3>
          <p class="text-[10px] text-slate-400">Emniyet stok limitinin altındaki malzemeler.</p>
        </div>

        <!-- Alert Items List -->
        <div class="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[340px]">
          <div v-if="inventoryStore.lowStockItems.length === 0" class="p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full gap-2">
            <EmptyStock class="w-24 h-24 text-emerald-500" />
            <p>Klinik envanter düzeyleri sağlıklı!</p>
          </div>
          <div 
            v-for="item in inventoryStore.lowStockItems" 
            :key="item.id"
            class="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors"
          >
            <div class="flex-1 min-w-0 pr-3">
              <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{{ item.category }}</span>
              <h4 class="text-xs font-bold text-slate-800 truncate mt-0.5">{{ item.name }}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/30">
                  {{ item.stock }} {{ item.unit }} kaldı
                </span>
                <span class="text-[9px] text-slate-400 font-medium">Min: {{ item.minStock }}</span>
              </div>
            </div>

            <!-- SVG Sparkline widget -->
            <div class="w-24 h-10 flex flex-col items-end gap-1 shrink-0">
              <Sparkline 
                :data="item.history" 
                color="#f43f5e" 
                :width="100" 
                :height="30"
              />
              <span class="text-[8px] font-bold text-slate-400 tracking-wider uppercase font-mono">7 günlük trend</span>
            </div>
          </div>
        </div>

        <!-- Inventory quick links -->
        <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/20 flex justify-between items-center text-xs">
          <span class="text-[10px] text-slate-400 font-medium">Stok yenileme gerekiyor</span>
          <router-link to="/dashboard/inventory" class="text-[10px] text-[#088496] hover:text-[#066b7a] font-bold hover:underline">
            Stokları Yönet
          </router-link>
        </div>
      </div>

    </div>

    <!-- Modals -->
    <ActionModals 
      :is-open="activeModal !== null" 
      :type="activeModal || 'patient'" 
      @close="activeModal = null" 
    />

    <SignatureModal
      :is-open="isSignatureModalOpen"
      :consent-id="selectedConsent?.id || ''"
      :patient-name="selectedConsent?.patientName || ''"
      :procedure="selectedConsent?.procedure || ''"
      @close="isSignatureModalOpen = false"
      @save="handleSaveSignature"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  CalendarCheck, 
  FileSignature, 
  UserPlus, 
  Camera, 
  ArrowUpRight, 
  PenTool, 
  Plus
} from '@lucide/vue'
import { usePatientStore } from '../store/usePatientStore'
import { useConsentStore } from '../store/useConsentStore'
import { useInventoryStore } from '../store/useInventoryStore'
import { useMhrsSync } from '../composables/useMhrsSync'
import Sparkline from '../components/Sparkline.vue'
import EmptyConsents from '../components/illustrations/EmptyConsents.vue'
import EmptyStock from '../components/illustrations/EmptyStock.vue'
import ActionModals from '../components/ActionModals.vue'
import SignatureModal from '../components/SignatureModal.vue'

const patientStore = usePatientStore()
const consentStore = useConsentStore()
const inventoryStore = useInventoryStore()
const { appointmentCount } = useMhrsSync()

// Modals State
const activeModal = ref(null) // null | 'patient' | 'consent' | 'material'
const isSignatureModalOpen = ref(false)
const selectedConsent = ref(null)

function openModal(type) {
  activeModal.value = type
}

function triggerSignatureModal(consent) {
  selectedConsent.value = consent
  isSignatureModalOpen.value = true
}

function handleSaveSignature(dataUrl) {
  if (selectedConsent.value) {
    consentStore.signConsent(selectedConsent.value.id, dataUrl)
  }
  isSignatureModalOpen.value = false
  selectedConsent.value = null
}
</script>
