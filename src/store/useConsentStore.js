import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as consentsApi from '../api/consents.api.js'
import { usePatientStore } from './usePatientStore.js'
import { getAccess } from '../api/tokens.js'
import { API_ENABLED } from '../api/config.js'

export const useConsentStore = defineStore('consent', () => {
  const consents = ref([])
  const loading = ref(false)
  const error = ref('')

  const pendingConsents = computed(() => consents.value.filter((c) => c.status === 'pending'))
  const signedConsents = computed(() => consents.value.filter((c) => c.status === 'signed'))

  function patientsById() {
    const patientStore = usePatientStore()
    return Object.fromEntries(patientStore.patients.map((p) => [p.id, p.name]))
  }

  async function load() {
    loading.value = true; error.value = ''
    try {
      const patientStore = usePatientStore()
      consents.value = await consentsApi.list(patientStore.patients)
    } catch (e) { error.value = 'Onamlar yüklenemedi.' }
    finally { loading.value = false }
  }

  async function createConsent(form) {
    const created = await consentsApi.create(form)
    consents.value.unshift(created)
    return created
  }

  async function signConsent(id, signatureDataUrl) {
    const updated = await consentsApi.sign(id, signatureDataUrl, patientsById())
    const idx = consents.value.findIndex((c) => c.id === id)
    if (idx !== -1) consents.value[idx] = { ...consents.value[idx], ...updated }
  }

  // Open the signed PDF. Real mode fetches with the auth token and opens a blob URL.
  async function openPdf(consent) {
    if (!API_ENABLED || !consent.pdfPath) { window.alert('PDF yalnızca canlı backend modunda hazırdır.'); return }
    const res = await fetch(consentsApi.pdfHref(consent), { headers: { Authorization: `Bearer ${getAccess()}` } })
    if (!res.ok) { window.alert('PDF açılamadı.'); return }
    const blob = await res.blob()
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return { consents, loading, error, pendingConsents, signedConsents, load, createConsent, signConsent, openPdf }
})
