import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as patientsApi from '../api/patients.api.js'

export const usePatientStore = defineStore('patient', () => {
  const patients = ref([])
  const loading = ref(false)
  const error = ref('')
  const searchQuery = ref('')

  const filteredPatients = computed(() => {
    if (!searchQuery.value.trim()) return patients.value
    const query = searchQuery.value.toLowerCase().trim()
    return patients.value.filter(
      (p) => (p.name || '').toLowerCase().includes(query) ||
             (p.tcNo || '').includes(query) ||
             (p.phone || '').includes(query) ||
             p.id.toLowerCase().includes(query),
    )
  })

  async function load() {
    loading.value = true; error.value = ''
    try { patients.value = await patientsApi.list() }
    catch (e) { error.value = 'Hastalar yüklenemedi.' }
    finally { loading.value = false }
  }

  async function registerPatient(form) {
    const created = await patientsApi.create(form)
    patients.value.unshift(created)
    return created
  }

  return { patients, loading, error, searchQuery, filteredPatients, load, registerPatient }
})
