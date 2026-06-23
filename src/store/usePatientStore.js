import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePatientStore = defineStore('patient', () => {
  const patients = ref([
    { id: 'P-101', name: 'Ahmet Yılmaz', tcNo: '23485910292', phone: '+90 532 123 45 67', email: 'ahmet.yilmaz@email.com', bloodType: 'A Rh+', lastVisit: '2026-06-10', status: 'Active' },
    { id: 'P-102', name: 'Merve Demir', tcNo: '10984950384', phone: '+90 543 987 65 43', email: 'merve.demir@email.com', bloodType: '0 Rh-', lastVisit: '2026-06-08', status: 'Active' },
    { id: 'P-103', name: 'Caner Özkan', tcNo: '48201938592', phone: '+90 505 456 78 90', email: 'caner.ozkan@email.com', bloodType: 'B Rh+', lastVisit: '2026-06-05', status: 'Completed' },
    { id: 'P-104', name: 'Elif Kaya', tcNo: '59203948591', phone: '+90 555 111 22 33', email: 'elif.kaya@email.com', bloodType: 'AB Rh+', lastVisit: '2026-06-11', status: 'Active' },
    { id: 'P-105', name: 'Mustafa Şahin', tcNo: '30491827463', phone: '+90 533 444 55 66', email: 'mustafa.sahin@email.com', bloodType: '0 Rh+', lastVisit: '2026-05-28', status: 'Inactive' },
    { id: 'P-106', name: 'Zeynep Çelik', tcNo: '18492039485', phone: '+90 542 333 44 55', email: 'zeynep.celik@email.com', bloodType: 'A Rh-', lastVisit: '2026-06-09', status: 'Active' },
  ])

  const searchQuery = ref('')

  const filteredPatients = computed(() => {
    if (!searchQuery.value.trim()) return patients.value
    const query = searchQuery.value.toLowerCase().trim()
    return patients.value.filter(
      p => p.name.toLowerCase().includes(query) || 
           p.tcNo.includes(query) || 
           p.phone.includes(query) ||
           p.id.toLowerCase().includes(query)
    )
  })

  function registerPatient(newPatient) {
    const nextId = `P-${100 + patients.value.length + 1}`
    patients.value.unshift({
      id: nextId,
      status: 'Active',
      lastVisit: new Date().toISOString().split('T')[0],
      ...newPatient
    })
  }

  return {
    patients,
    searchQuery,
    filteredPatients,
    registerPatient
  }
})
