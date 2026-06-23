<template>
  <div class="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">Hekim Profili</h2>
      <p class="text-xs text-slate-500">Kişisel bilgilerinizi, tıbbi yetki sertifikalarınızı ve resmi imza örneğinizi yönetin.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Column - Profile Card -->
      <div class="bg-white emboss-raised rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
        <div class="w-20 h-20 rounded-2xl emboss-inset bg-white flex items-center justify-center font-bold text-[#088496] text-2xl">
          MA
        </div>
        <div>
          <h3 class="font-bold text-slate-800 text-sm">Dr. Müge Ateş Tıkız</h3>
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Jinekolojik Onkolog</p>
        </div>
        <div class="w-full border-t border-slate-100 pt-4 flex flex-col gap-2 text-xs font-semibold text-slate-600">
          <div class="flex justify-between">
            <span class="text-slate-400">Diploma No:</span>
            <span>Dip-284910-TR</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">e-İmza Lisans:</span>
            <span class="text-emerald-600 font-bold">AKTİF (e-Güven)</span>
          </div>
        </div>
      </div>

      <!-- Right Column - Form Details -->
      <div class="md:col-span-2 bg-white emboss-raised rounded-2xl p-6 space-y-6">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Bilgileri Güncelle</h3>
        
        <form @submit.prevent="saveProfile" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adı Soyadı</label>
              <input v-model="profileData.name" type="text" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uzmanlık Alanı</label>
              <input v-model="profileData.specialty" type="text" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-posta Adresi</label>
              <input v-model="profileData.email" type="email" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefon Numarası</label>
              <input v-model="profileData.phone" type="tel" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300" />
            </div>
          </div>

          <!-- Doctor's official signature sample pad -->
          <div class="space-y-2 pt-2">
            <div class="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Hekim Resmi İmza Örneği</span>
              <button type="button" @click="isSignatureModalOpen = true" class="text-[#088496] hover:text-[#066b7a] hover:underline">
                İmzayı Yenile / Çiz
              </button>
            </div>
            <div class="h-24 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden">
              <img v-if="signatureImage" :src="signatureImage" alt="Hekim İmzası" class="max-h-full max-w-full object-contain p-2" />
              <span v-else class="text-[10px] text-slate-400">Henüz kaydedilmiş bir hekim imza örneği yok.</span>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button 
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Official signature drawing modal -->
    <SignatureModal
      :is-open="isSignatureModalOpen"
      consent-id="HEKIM-IMZA-DRAFT"
      patient-name="Dr. Müge Ateş Tıkız"
      procedure="Hekim Resmi İmza Örneği Güncellemesi"
      @close="isSignatureModalOpen = false"
      @save="saveSignature"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SignatureModal from '../components/SignatureModal.vue'

const saving = ref(false)
const isSignatureModalOpen = ref(false)
const signatureImage = ref('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 15 Q 30 5 50 15 T 90 15" fill="none" stroke="black" stroke-width="2"/></svg>')

const profileData = ref({
  name: 'Dr. Müge Ateş Tıkız',
  specialty: 'Jinekolojik Onkoloji',
  email: 'dr.muge@onamlarim.com',
  phone: '+90 532 987 65 43'
})

function saveSignature(dataUrl) {
  signatureImage.value = dataUrl
}

function saveProfile() {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    alert('Profil bilgileri başarıyla güncellendi!')
  }, 1000)
}
</script>
