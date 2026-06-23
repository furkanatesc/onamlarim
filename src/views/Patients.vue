<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Hasta CRM ve Kayıtlar</h2>
        <p class="text-xs text-slate-500">Hasta ziyaretlerini, iletişim bilgilerini, kan gruplarını ve onam geçmişini takip edin.</p>
      </div>
      <button 
        @click="isRegisterOpen = true"
        class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
      >
        <UserPlus class="w-4 h-4" /> Hasta Kaydet
      </button>
    </div>

    <!-- Search Box and List Info -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white emboss-raised rounded-2xl animate-fade-in-up animation-delay-100">
      <div class="relative flex-1 max-w-md">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-slate-400" />
        </div>
        <!-- Connect directly to patientStore searchQuery -->
        <input
          v-model="patientStore.searchQuery"
          type="search"
          placeholder="İsim, TC No veya telefon ile ara..."
          class="block w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
        />
      </div>

      <div class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        Toplam CRM Kaydı: <span class="text-slate-700 font-extrabold">{{ patientStore.filteredPatients.length }}</span>
      </div>
    </div>

    <!-- CRM Patient Grid / Table -->
    <div class="bg-white emboss-raised rounded-2xl overflow-hidden animate-fade-in-up animation-delay-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <th class="px-6 py-3.5">Hasta Bilgileri</th>
              <th class="px-6 py-3.5">TC Kimlik No</th>
              <th class="px-6 py-3.5">İletişim Bilgileri</th>
              <th class="px-6 py-3.5">Kan Grubu</th>
              <th class="px-6 py-3.5">Son Ziyaret</th>
              <th class="px-6 py-3.5">Durum</th>
              <th class="px-6 py-3.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr v-if="patientStore.filteredPatients.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                Aradığınız kriterlere uygun hasta kaydı bulunamadı.
              </td>
            </tr>
            <tr 
              v-for="patient in patientStore.filteredPatients" 
              :key="patient.id"
              class="hover:bg-slate-50/30 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8.5 h-8.5 rounded-xl emboss-inset bg-white text-[#088496] flex items-center justify-center font-bold text-xs">
                    {{ patient.name.split(' ').map(n=>n.charAt(0)).join('') }}
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-800">{{ patient.name }}</h4>
                    <p class="text-[9px] text-slate-400 font-mono">ERP-ID: {{ patient.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-mono font-medium text-slate-500">
                {{ patient.tcNo }}
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-700">{{ patient.phone }}</p>
                <p class="text-[9px] text-slate-400">{{ patient.email }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded-md font-bold text-[9px] bg-slate-100 text-slate-700 border border-slate-200/50">
                  {{ patient.bloodType }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 font-medium">
                {{ patient.lastVisit }}
              </td>
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1.2 px-2 py-0.5 rounded-full text-[9px] font-bold border"
                  :class="[
                    patient.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100/30' 
                      : patient.status === 'Completed'
                      ? 'bg-[#088496]/10 text-[#088496] border-[#088496]/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200/40'
                  ]"
                >
                  <span class="w-1.2 h-1.2 rounded-full" :class="patient.status === 'Active' ? 'bg-emerald-500' : patient.status === 'Completed' ? 'bg-[#088496]' : 'bg-slate-400'"></span>
                  {{ patient.status === 'Active' ? 'Aktif' : patient.status === 'Completed' ? 'Tamamlandı' : 'Pasif' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button 
                  @click="openPatientProfile(patient)"
                  class="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 font-semibold text-[10px] rounded-lg hover:bg-slate-50 transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <FolderHeart class="w-3.5 h-3.5 text-slate-400" /> Tıbbi Dosya
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Medical File / Patient Profile Drawer Modal -->
    <Transition name="modal-fade">
      <div v-if="selectedProfilePatient" class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all duration-300">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">Hasta Tıbbi Dosyası & Onam Geçmişi</h3>
            <button @click="selectedProfilePatient = null" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Drawer Profile Body -->
          <div class="p-6 overflow-y-auto max-h-[60vh] space-y-6">
            <!-- Patient Mini Summary -->
            <div class="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
              <div class="w-12 h-12 rounded-xl bg-[#088496] text-white flex items-center justify-center font-bold text-base shadow-md shadow-[#088496]/20">
                {{ selectedProfilePatient.name.split(' ').map(n=>n.charAt(0)).join('') }}
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-800">{{ selectedProfilePatient.name }}</h4>
                <p class="text-[10px] text-slate-400 font-medium">TC No: {{ selectedProfilePatient.tcNo }} • Kan Grubu: {{ selectedProfilePatient.bloodType }}</p>
              </div>
            </div>

            <!-- Consent history list -->
            <div class="space-y-3">
              <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onam Formu Geçmişi ({{ patientConsents.length }})</h5>
              
              <div v-if="patientConsents.length === 0" class="text-xs text-slate-400 text-center py-4">
                Bu hasta adına henüz bir onam formu oluşturulmamış.
              </div>
              <div 
                v-for="consent in patientConsents" 
                :key="consent.id"
                class="flex items-center justify-between p-3 border border-slate-200/50 rounded-xl hover:border-slate-300 transition-colors"
              >
                <div>
                  <p class="text-xs font-bold text-slate-800">{{ consent.procedure }}</p>
                  <p class="text-[9px] text-slate-400">{{ consent.date }} • Sorumlu Hekim: {{ consent.doctor }}</p>
                </div>
                <span 
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                  :class="consent.status === 'signed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                >
                  {{ consent.status === 'signed' ? 'İmzalandı' : 'İmza Bekliyor' }}
                </span>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
              @click="selectedProfilePatient = null" 
              class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] transition-colors"
            >
              Dosyayı Kapat
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Register Action Modal -->
    <ActionModals 
      :is-open="isRegisterOpen" 
      type="patient" 
      @close="isRegisterOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, UserPlus, FolderHeart, X } from '@lucide/vue'
import { usePatientStore } from '../store/usePatientStore'
import { useConsentStore } from '../store/useConsentStore'
import ActionModals from '../components/ActionModals.vue'

const patientStore = usePatientStore()
const consentStore = useConsentStore()

// State
const isRegisterOpen = ref(false)
const selectedProfilePatient = ref(null)

function openPatientProfile(patient) {
  selectedProfilePatient.value = patient
}

// Compute patient's consents
const patientConsents = computed(() => {
  if (!selectedProfilePatient.value) return []
  return consentStore.consents.filter(c => c.patientId === selectedProfilePatient.value.id)
})
</script>
