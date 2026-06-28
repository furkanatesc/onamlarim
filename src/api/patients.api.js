import apiClient from './client.js'
import { API_ENABLED } from './config.js'
import { mockPatients } from './mock/seed.js'

export function toFrontendPatient(b) {
  return {
    id: b.id,
    name: b.name,
    tcNo: b.tcNo,
    phone: b.phone ?? '',
    email: b.email ?? '',
    bloodType: b.bloodType ?? '',
    lastVisit: b.createdAt ? b.createdAt.slice(0, 10) : '',
    status: 'Active',
  }
}

export async function list() {
  if (!API_ENABLED) return mockPatients()
  const { data } = await apiClient.get('/patients')
  return data.map(toFrontendPatient)
}

export async function create(form) {
  const payload = {
    name: form.name,
    tcNo: form.tcNo,
    phone: form.phone || undefined,
    email: form.email || undefined,
    bloodType: form.bloodType || undefined,
  }
  if (!API_ENABLED) {
    return {
      id: `P-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: form.name,
      tcNo: form.tcNo,
      phone: form.phone ?? '',
      email: form.email ?? '',
      bloodType: form.bloodType ?? '',
      lastVisit: new Date().toISOString().slice(0, 10),
      status: 'Active',
    }
  }
  const { data } = await apiClient.post('/patients', payload)
  return toFrontendPatient(data)
}
