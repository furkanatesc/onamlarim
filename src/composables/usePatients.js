import { ref } from 'vue'
import apiClient from '../api/axios'
import { usePatientStore } from '../store/usePatientStore'

export function usePatients() {
  const loading = ref(false)
  const error = ref(null)
  const patientStore = usePatientStore()

  async function fetchPatients() {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get('/patients')
      if (response.data && response.data.data) {
        // Hydrate store with API data if needed, or keep local changes
        // For demonstration, we can append new items or merge them
        const apiPatients = response.data.data
        apiPatients.forEach(apiP => {
          const exists = patientStore.patients.some(p => p.id === apiP.id)
          if (!exists) {
            patientStore.patients.push(apiP)
          }
        })
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch patients'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchPatients
  }
}
