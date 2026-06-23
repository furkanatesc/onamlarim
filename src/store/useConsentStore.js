import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConsentStore = defineStore('consent', () => {
  const consents = ref([
    {
      id: 'C-901',
      patientId: 'P-101',
      patientName: 'Ahmet Yılmaz',
      procedure: 'Diş İmplantı Cerrahisi',
      doctor: 'Dr. Selin Kaya',
      status: 'pending',
      date: '2026-06-11',
      signature: null
    },
    {
      id: 'C-902',
      patientId: 'P-102',
      patientName: 'Merve Demir',
      procedure: 'Koroner Anjiyografi',
      doctor: 'Dr. Emre Demir',
      status: 'signed',
      date: '2026-06-10',
      signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 15 Q 30 5 50 15 T 90 15" fill="none" stroke="black" stroke-width="2"/></svg>'
    },
    {
      id: 'C-903',
      patientId: 'P-104',
      patientName: 'Elif Kaya',
      procedure: 'Histeroskopi',
      doctor: 'Dr. Müge Ateş Tıkız',
      status: 'pending',
      date: '2026-06-11',
      signature: null
    },
    {
      id: 'C-904',
      patientId: 'P-106',
      patientName: 'Zeynep Çelik',
      procedure: 'Kanal Tedavisi',
      doctor: 'Dr. Selin Kaya',
      status: 'signed',
      date: '2026-06-09',
      signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 5 25 C 20 5 40 5 60 25 S 80 5 95 15" fill="none" stroke="black" stroke-width="2"/></svg>'
    }
  ])

  const pendingConsents = computed(() => consents.value.filter(c => c.status === 'pending'))
  const signedConsents = computed(() => consents.value.filter(c => c.status === 'signed'))

  function createConsent(newConsent) {
    const nextId = `C-${900 + consents.value.length + 1}`
    consents.value.unshift({
      id: nextId,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      signature: null,
      ...newConsent
    })
  }

  function signConsent(id, signatureDataUrl) {
    const consent = consents.value.find(c => c.id === id)
    if (consent) {
      consent.status = 'signed'
      consent.signature = signatureDataUrl
      consent.date = new Date().toISOString().split('T')[0]
    }
  }

  return {
    consents,
    pendingConsents,
    signedConsents,
    createConsent,
    signConsent
  }
})
