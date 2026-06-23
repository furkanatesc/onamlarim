<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        ref="modalContainerRef" 
        class="bg-white rounded-2xl border border-slate-200/60 shadow-2xl w-full overflow-hidden flex flex-col transform transition-all duration-300"
        :class="type === 'material' ? 'max-w-lg' : 'max-w-md'"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg emboss-inset bg-white flex items-center justify-center text-[#088496]">
              <UserPlus v-if="type === 'patient'" class="w-4 h-4" />
              <FilePlus v-else-if="type === 'consent'" class="w-4 h-4" />
              <Maximize v-else-if="type === 'material'" class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-bold text-slate-900">
              {{ title }}
            </h3>
          </div>
          <button 
            @click="closeModal" 
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 overflow-y-auto max-h-[75vh]">
          <!-- REGISTER PATIENT FORM -->
          <form v-if="type === 'patient'" @submit.prevent="submitPatient" class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adı Soyadı</label>
              <input 
                v-model="patientForm.name" 
                required
                type="text" 
                placeholder="Örn: Ahmet Yılmaz" 
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TC Kimlik Numarası</label>
                <input 
                  v-model="patientForm.tcNo" 
                  required
                  maxlength="11"
                  type="text" 
                  placeholder="Örn: 10293847562" 
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kan Grubu</label>
                <select 
                  v-model="patientForm.bloodType" 
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
                >
                  <option value="A Rh+">A Rh+</option>
                  <option value="A Rh-">A Rh-</option>
                  <option value="B Rh+">B Rh+</option>
                  <option value="B Rh-">B Rh-</option>
                  <option value="AB Rh+">AB Rh+</option>
                  <option value="AB Rh-">AB Rh-</option>
                  <option value="0 Rh+">0 Rh+</option>
                  <option value="0 Rh-">0 Rh-</option>
                </select>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefon Numarası</label>
              <input 
                v-model="patientForm.phone" 
                required
                type="tel" 
                placeholder="+90 5XX XXX XX XX" 
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-posta Adresi</label>
              <input 
                v-model="patientForm.email" 
                required
                type="email" 
                placeholder="isim@ornek.com" 
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              />
            </div>

            <!-- Submit Button inside form for accessibility -->
            <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                type="button"
                @click="closeModal" 
                class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 transition-all"
              >
                Hastayı Kaydet
              </button>
            </div>
          </form>

          <!-- NEW DIGITAL CONSENT FORM -->
          <form v-else-if="type === 'consent'" @submit.prevent="submitConsent" class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hasta Seçin</label>
              <select 
                v-model="consentForm.patientIndex" 
                required
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              >
                <option value="" disabled selected>CRM sisteminden hasta seçin...</option>
                <option 
                  v-for="(pat, index) in patientStore.patients" 
                  :key="pat.id" 
                  :value="index"
                >
                  {{ pat.name }} (TC: {{ pat.tcNo }})
                </option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uygulanacak Tıbbi İşlem</label>
              <input 
                v-model="consentForm.procedure" 
                required
                type="text" 
                placeholder="Örn: Total Histerektomi, Kolposkopi"
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sorumlu Hekim</label>
              <select 
                v-model="consentForm.doctor" 
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              >
                <option value="Dr. Müge Ateş Tıkız">Dr. Müge Ateş Tıkız (Jinekolojik Onkoloji)</option>
                <option value="Dr. Selin Kaya">Dr. Selin Kaya (Kadın Hastalıkları)</option>
              </select>
            </div>

            <div class="bg-[#088496]/8 rounded-xl p-3 border border-[#088496]/15 flex items-start gap-2.5">
              <Info class="w-4 h-4 text-[#088496] shrink-0 mt-0.5" />
              <p class="text-[10px] text-[#066b7a] leading-normal font-medium">
                Bu dijital onam belgesi oluşturulduğunda Kontrol Panelinde <strong>İmza Bekliyor</strong> olarak görünecektir. Hasta formu hemen klinik tableti üzerinden imzalayabilir.
              </p>
            </div>

            <!-- Submit Button -->
            <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                type="button"
                @click="closeModal" 
                class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 transition-all"
              >
                Onam Belgesi Oluştur
              </button>
            </div>
          </form>

          <!-- SCAN MATERIAL (BARCODE SIMULATOR) -->
          <div v-else-if="type === 'material'" class="flex flex-col gap-6">
            <!-- Simulated Viewfinder Scanner -->
            <div class="w-full h-44 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
              <div v-if="scanningState === 'idle'" class="flex flex-col items-center gap-2.5 text-center text-slate-400">
                <div class="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                  <Camera class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-200">ERP Akıllı Malzeme Barkod Okuyucu</h4>
                  <p class="text-[10px] text-slate-500">Stokları anlık güncellemek için barkod kamerasını başlatın</p>
                </div>
                <button 
                  @click="startScanSimulation"
                  class="mt-1 px-4 py-1.5 bg-[#088496] text-white font-semibold text-[10px] rounded-lg hover:bg-[#066b7a] transition-colors shadow-sm"
                >
                  Barkod Kamerasını Başlat
                </button>
              </div>

              <!-- Scanning animation -->
              <div v-else-if="scanningState === 'scanning'" class="absolute inset-0 flex flex-col items-center justify-center">
                <!-- Barcode mockup -->
                <div class="w-48 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-around px-2 opacity-50">
                  <div v-for="n in 24" :key="n" class="bg-white h-8 w-[2px] transition-all duration-300" :style="`opacity: ${Math.random() * 0.7 + 0.3}; width: ${[2, 3, 4, 1][n % 4]}px`"/>
                </div>
                <!-- Pulsing Scanning Red Line -->
                <div class="absolute inset-x-0 h-0.5 bg-rose-500 animate-bounce shadow-[0_0_10px_#f43f5e] opacity-80"></div>
                <span class="text-[9px] text-slate-400 font-semibold tracking-widest mt-4 animate-pulse">BARKOD OKUNUYOR...</span>
              </div>

              <!-- Success State -->
              <div v-else-if="scanningState === 'success'" class="text-center text-slate-200 flex flex-col items-center gap-2">
                <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                  <Check class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-xs font-bold">Malzeme Başarıyla Tarandı!</h4>
                  <p class="text-[10px] text-slate-500 font-mono">KOD: ONAM-2849-BAR</p>
                </div>
              </div>
            </div>

            <!-- Material Details & Actions -->
            <div v-if="scanningState === 'success'" class="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col gap-3.5 animate-fade-in-up">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[9px] font-bold text-[#088496] uppercase tracking-widest bg-[#088496]/10 px-2 py-0.5 rounded border border-[#088496]/20">
                    {{ selectedScannedMaterial.category === 'Surgical' ? 'Cerrahi' : selectedScannedMaterial.category === 'Restorative' ? 'Restoratif' : selectedScannedMaterial.category === 'Consumables' ? 'Sarf' : selectedScannedMaterial.category }}
                  </span>
                  <h4 class="text-xs font-bold text-slate-800 mt-1.5">{{ selectedScannedMaterial.name }}</h4>
                  <p class="text-[9px] text-slate-400 font-mono">ID: {{ selectedScannedMaterial.id }}</p>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 font-medium">Mevcut Stok</span>
                  <p class="text-sm font-extrabold text-slate-800">{{ selectedScannedMaterial.stock }} {{ selectedScannedMaterial.unit === 'pcs' ? 'adet' : selectedScannedMaterial.unit === 'boxes' ? 'kutu' : selectedScannedMaterial.unit }}</p>
                </div>
              </div>

              <!-- Adjustment Panel -->
              <div class="border-t border-slate-150/40 pt-3 flex flex-col gap-2">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stok Düzeyini Güncelle</span>
                <div class="flex gap-2">
                  <div class="flex-1 flex border border-slate-200 bg-white rounded-xl overflow-hidden">
                    <button 
                      @click="adjustAmount = Math.max(1, adjustAmount - 1)" 
                      class="px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-sm font-bold border-r border-slate-100"
                    >
                      -
                    </button>
                    <input 
                      v-model.number="adjustAmount"
                      type="number" 
                      min="1"
                      class="w-full text-center text-xs font-bold text-slate-700 focus:outline-none"
                    />
                    <button 
                      @click="adjustAmount++" 
                      class="px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-sm font-bold border-l border-slate-100"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    @click="applyStockDeduction"
                    class="px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Minus class="w-3.5 h-3.5" /> Tüketildi
                  </button>

                  <button 
                    @click="applyStockRestock"
                    class="px-3.5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" /> Eklendi
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer for scanning mode -->
            <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                @click="closeModal" 
                class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Pencereyi Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  X, 
  UserPlus, 
  FilePlus, 
  Maximize, 
  Camera, 
  Check, 
  Info, 
  Plus, 
  Minus 
} from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import { usePatientStore } from '../store/usePatientStore'
import { useConsentStore } from '../store/useConsentStore'
import { useInventoryStore } from '../store/useInventoryStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: (val) => ['patient', 'consent', 'material'].includes(val)
  }
})

const emit = defineEmits(['close'])

const patientStore = usePatientStore()
const consentStore = useConsentStore()
const inventoryStore = useInventoryStore()

const modalContainerRef = ref(null)

// Close on outside clicks
onClickOutside(modalContainerRef, () => {
  closeModal()
})

function closeModal() {
  emit('close')
}

// Modal Titles
const title = computed(() => {
  switch (props.type) {
    case 'patient': return 'Yeni Hasta Kaydı'
    case 'consent': return 'Dijital Onam Belgesi Oluştur'
    case 'material': return 'Medikal Malzeme Barkod Okuyucu'
    default: return ''
  }
})

// --- Register Patient Logic ---
const patientForm = ref({
  name: '',
  tcNo: '',
  phone: '',
  email: '',
  bloodType: 'A Rh+'
})

function submitPatient() {
  patientStore.registerPatient({ ...patientForm.value })
  // Reset form
  patientForm.value = {
    name: '',
    tcNo: '',
    phone: '',
    email: '',
    bloodType: 'A Rh+'
  }
  closeModal()
}

// --- Digital Consent Logic ---
const consentForm = ref({
  patientIndex: '',
  procedure: '',
  doctor: 'Dr. Müge Ateş Tıkız'
})

function submitConsent() {
  const patient = patientStore.patients[consentForm.value.patientIndex]
  if (patient) {
    consentStore.createConsent({
      patientId: patient.id,
      patientName: patient.name,
      procedure: consentForm.value.procedure,
      doctor: consentForm.value.doctor
    })
    // Reset form
    consentForm.value = {
      patientIndex: '',
      procedure: '',
      doctor: 'Dr. Müge Ateş Tıkız'
    }
    closeModal()
  }
}

// --- Barcode Scanner Logic ---
const scanningState = ref('idle') // 'idle', 'scanning', 'success'
const selectedScannedMaterial = ref(null)
const adjustAmount = ref(1)

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.type === 'material') {
    scanningState.value = 'idle'
    selectedScannedMaterial.value = null
    adjustAmount.value = 1
  }
})

function startScanSimulation() {
  scanningState.value = 'scanning'
  setTimeout(() => {
    // Randomly select one inventory item to simulate scan
    const randomIndex = Math.floor(Math.random() * inventoryStore.items.length)
    selectedScannedMaterial.value = inventoryStore.items[randomIndex]
    scanningState.value = 'success'
  }, 2000)
}

function applyStockDeduction() {
  if (selectedScannedMaterial.value) {
    inventoryStore.deductStock(selectedScannedMaterial.value.id, adjustAmount.value)
    closeModal()
  }
}

function applyStockRestock() {
  if (selectedScannedMaterial.value) {
    inventoryStore.restockMaterial(selectedScannedMaterial.value.id, adjustAmount.value)
    closeModal()
  }
}
</script>

<style scoped>
/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white {
  animation: modal-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-leave-active .bg-white {
  animation: modal-zoom-out 0.2s ease-in;
}

@keyframes modal-zoom-in {
  from {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes modal-zoom-out {
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.95) translateY(5px);
    opacity: 0;
  }
}
</style>
