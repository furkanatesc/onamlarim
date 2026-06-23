<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Dijital Hasta Onam Formları</h2>
        <p class="text-xs text-slate-500">Tıbbi onam belgelerini güvenli bir şekilde inceleyin, doğrulayın ve imzalayın.</p>
      </div>
      <button 
        @click="isNewConsentOpen = true"
        class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
      >
        <Plus class="w-4 h-4" /> Onam Belgesi Oluştur
      </button>
    </div>

    <!-- Filters and Search Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white emboss-raised rounded-2xl animate-fade-in-up animation-delay-100">
      <div class="relative flex-1 max-w-md">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-slate-400" />
        </div>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Hasta adı, TC ID veya işlem ile ara..."
          class="block w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
        />
      </div>

      <div class="flex items-center gap-2">
        <button 
          v-for="status in ['all', 'pending', 'signed']" 
          :key="status"
          @click="statusFilter = status"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          :class="[
            statusFilter === status 
              ? 'bg-[#088496]/10 text-[#088496] border border-[#088496]/20'
              : 'text-slate-500 hover:bg-slate-50 border border-transparent'
          ]"
        >
          {{ status === 'all' ? 'Tümü' : status === 'pending' ? 'Bekleyenler' : 'İmzalananlar' }}
        </button>
      </div>
    </div>

    <!-- Data Cards / Table -->
    <div class="bg-white emboss-raised rounded-2xl overflow-hidden animate-fade-in-up animation-delay-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <th class="px-6 py-3.5">Belge ID</th>
              <th class="px-6 py-3.5">Hasta Adı</th>
              <th class="px-6 py-3.5">Uygulama & Hekim</th>
              <th class="px-6 py-3.5">Oluşturulma Tarihi</th>
              <th class="px-6 py-3.5">Durum</th>
              <th class="px-6 py-3.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr v-if="filteredConsents.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                Aradığınız kriterlere uygun onam belgesi bulunamadı.
              </td>
            </tr>
            <tr 
              v-for="consent in filteredConsents" 
              :key="consent.id"
              class="hover:bg-slate-50/30 transition-colors"
            >
              <td class="px-6 py-4 font-mono font-bold text-slate-500">
                {{ consent.id }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg emboss-inset bg-white text-[#088496] flex items-center justify-center font-bold text-xs">
                    {{ consent.patientName.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-800">{{ consent.patientName }}</p>
                    <p class="text-[9px] text-slate-400 font-mono">ID: {{ consent.patientId }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-700">{{ consent.procedure }}</p>
                <p class="text-[9px] text-slate-400">Sorumlu Hekim: {{ consent.doctor }}</p>
              </td>
              <td class="px-6 py-4 text-slate-500 font-medium">
                {{ consent.date }}
              </td>
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border"
                  :class="[
                    consent.status === 'signed' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' 
                      : 'bg-amber-50 text-amber-700 border-amber-100/50'
                  ]"
                >
                  <span class="w-1.2 h-1.2 rounded-full" :class="consent.status === 'signed' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                  {{ consent.status === 'signed' ? 'İmzalandı' : 'İmza Bekliyor' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <!-- Sign action -->
                  <button 
                    v-if="consent.status === 'pending'"
                    @click="triggerSignature(consent)"
                    class="px-2.5 py-1.5 bg-[#088496] text-white font-semibold text-[10px] rounded-lg hover:bg-[#066b7a] shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <PenTool class="w-3 h-3" /> İmzalat
                  </button>

                  <!-- Preview signature / details action -->
                  <button 
                    @click="viewConsentDetails(consent)"
                    class="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 font-semibold text-[10px] rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye class="w-3 h-3" /> Detaylar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Consent Details Drawer / Overlay Modal -->
    <Transition name="modal-fade">
      <div v-if="selectedDetailsConsent" class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col transform transition-all duration-300">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">Onam Belgesi Detayları</h3>
            <button @click="selectedDetailsConsent = null" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Document Contents -->
          <div class="p-8 overflow-y-auto max-h-[60vh] space-y-6 text-slate-700 leading-relaxed text-xs">
            <div class="flex justify-between border-b border-slate-100 pb-4">
              <div>
                <p class="font-bold text-slate-800 text-sm">HASTA BİLGİLENDİRİLMİŞ ONAM MADDELERİ</p>
                <p class="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {{ selectedDetailsConsent.id }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold">Onamlarım Klinik ERP</p>
                <p class="text-[9px] text-slate-400">{{ selectedDetailsConsent.date }}</p>
              </div>
            </div>

            <!-- Standard Legal Medical text -->
            <div class="space-y-3 font-medium text-slate-600">
              <p>
                Bana planlanan tıbbi işlem olan <strong class="text-slate-800">{{ selectedDetailsConsent.procedure }}</strong> işleminin, Dr. <strong class="text-slate-800">{{ selectedDetailsConsent.doctor }}</strong> denetiminde gerçekleştirilmesine kendi rızamla izin veriyorum.
              </p>
              <p>
                Bu uygulamanın doğası, kapsamı, riskleri, faydaları ve alternatif tedavi seçenekleri bana detaylı olarak açıklandı. Tıbbi ve cerrahi işlemlerin ağrı, enfeksiyon, hafif kanama veya anestezik maddelere karşı beklenmeyen reaksiyonlar gibi birtakım riskler taşıyabileceğini anlıyorum.
              </p>
              <p>
                Hekimime ilaç alerjilerim, aktif sistemik rahatsızlıklarım ve düzenli kullandığım ilaçlar dahil olmak üzere tüm sağlık geçmişimi doğru ve eksiksiz olarak aktardığımı onaylıyorum. Konu hakkında soru sorma fırsatına sahip oldum ve tüm sorularım hekimim tarafından tatmin edici şekilde yanıtlandı.
              </p>
            </div>

            <!-- Signature Panel -->
            <div class="border-t border-slate-100 pt-6 flex justify-between items-center bg-slate-50/40 p-4 rounded-xl">
              <div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sorumlu Hekim Onayı</span>
                <p class="font-bold text-slate-700 mt-1">{{ selectedDetailsConsent.doctor }}</p>
                <span class="text-[9px] text-slate-400">Elektronik ERP İmzalı</span>
              </div>
              
              <div class="text-right flex flex-col items-end gap-1">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hasta Rıza İmzası</span>
                <!-- signature rendering -->
                <div v-if="selectedDetailsConsent.status === 'signed'" class="bg-white border border-slate-200/50 rounded-lg p-1 w-36 h-12 flex items-center justify-center overflow-hidden">
                  <img :src="selectedDetailsConsent.signature" alt="Hasta İmzası" class="max-h-full max-w-full object-contain" />
                </div>
                <div v-else class="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  İMZALANMAMIŞ BELGE
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button 
              @click="selectedDetailsConsent = null" 
              class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modals -->
    <ActionModals 
      :is-open="isNewConsentOpen" 
      type="consent" 
      @close="isNewConsentOpen = false" 
    />

    <SignatureModal
      :is-open="isSignatureOpen"
      :consent-id="signingConsent?.id || ''"
      :patient-name="signingConsent?.patientName || ''"
      :procedure="signingConsent?.procedure || ''"
      @close="isSignatureOpen = false"
      @save="saveSignature"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Eye, PenTool, X } from '@lucide/vue'
import { useConsentStore } from '../store/useConsentStore'
import ActionModals from '../components/ActionModals.vue'
import SignatureModal from '../components/SignatureModal.vue'

const consentStore = useConsentStore()

// State
const searchQuery = ref('')
const statusFilter = ref('all')
const isNewConsentOpen = ref(false)
const isSignatureOpen = ref(false)
const signingConsent = ref(null)
const selectedDetailsConsent = ref(null)

// Filtering Logics
const filteredConsents = computed(() => {
  let list = consentStore.consents
  
  if (statusFilter.value !== 'all') {
    list = list.filter(c => c.status === statusFilter.value)
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c => 
      c.patientName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.procedure.toLowerCase().includes(q) ||
      c.patientId.toLowerCase().includes(q)
    )
  }

  return list
})

function triggerSignature(consent) {
  signingConsent.value = consent
  isSignatureOpen.value = true
}

function saveSignature(dataUrl) {
  if (signingConsent.value) {
    consentStore.signConsent(signingConsent.value.id, dataUrl)
  }
  isSignatureOpen.value = false
  signingConsent.value = null
}

function viewConsentDetails(consent) {
  selectedDetailsConsent.value = consent
}
</script>
