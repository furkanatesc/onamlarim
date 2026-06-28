import apiClient from './client.js'
import { API_ENABLED, API_BASE_URL } from './config.js'
import { mockConsents } from './mock/seed.js'

export function toFrontendConsent(b, patientsById = {}) {
  return {
    id: b.id,
    patientId: b.patientId,
    patientName: patientsById[b.patientId] || b.patientId,
    procedure: b.procedure,
    doctor: b.doctorName,
    status: (b.status || '').toLowerCase(),
    date: (b.signedAt || b.createdAt || '').slice(0, 10),
    signature: b.signatureData ?? null,
    pdfPath: b.pdfPath ?? null,
  }
}

function indexNames(patients = []) {
  return Object.fromEntries(patients.map((p) => [p.id, p.name]))
}

export async function list(patients = []) {
  if (!API_ENABLED) return mockConsents()
  const { data } = await apiClient.get('/consents')
  const byId = indexNames(patients)
  return data.map((c) => toFrontendConsent(c, byId))
}

export async function create(form) {
  if (!API_ENABLED) {
    return {
      id: `C-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientId: form.patientId, patientName: form.patientName,
      procedure: form.procedure, doctor: form.doctor,
      status: 'pending', date: new Date().toISOString().slice(0, 10),
      signature: null, pdfPath: null,
    }
  }
  const { data } = await apiClient.post('/consents', {
    patientId: form.patientId, procedure: form.procedure, doctorName: form.doctor,
  })
  const out = toFrontendConsent(data, {})
  out.patientName = form.patientName // we know it from the form selection
  return out
}

export async function sign(id, signatureDataUrl, patientsById = {}) {
  if (!API_ENABLED) {
    return { id, status: 'signed', signature: signatureDataUrl, date: new Date().toISOString().slice(0, 10), pdfPath: null, _mock: true }
  }
  const { data } = await apiClient.post(`/consents/${id}/sign`, { signatureData: signatureDataUrl })
  return toFrontendConsent(data, patientsById)
}

export function pdfHref(consent) {
  return `${API_BASE_URL}/consents/${consent.id}/pdf`
}
