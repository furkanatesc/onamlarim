import { useRouter } from 'vue-router'
import { resolveIntent } from '../assistant/intents'
import { usePatientStore } from '../store/usePatientStore'
import { useConsentStore } from '../store/useConsentStore'
import { useInventoryStore } from '../store/useInventoryStore'

const ROUTE_LABELS = {
  '/dashboard/overview': 'Kontrol Paneli',
  '/dashboard/consents': 'Dijital Onamlar',
  '/dashboard/crm': 'Hasta CRM',
  '/dashboard/inventory': 'Malzeme & Envanter',
  '/dashboard/mhrs-sync': 'MHRS Randevu Eşitleme',
  '/dashboard/profile': 'Profil',
  '/dashboard/settings': 'Ayarlar',
}

const HELP_TEXT =
  'Şunları yapabilirim:\n' +
  '• Sayfa açma: "hastalara git", "onamları aç", "stoğa git"\n' +
  '• Canlı bilgi: "kaç hasta var", "imza bekleyen onam", "kritik stok"\n' +
  '• Ürün bilgisi: "MHRS nedir", "e-imza nedir", "KVKK"'

const FALLBACK_TEXT =
  'Bunu tam anlayamadım. Örneğin "hastalara git", "kaç hasta var" ya da "MHRS nedir" diyebilirsiniz.'

// Niyet → {reply, action?} çeviren beyin. Router + canlı store verisini kullanır.
export function useAssistant() {
  const router = useRouter()
  const patientStore = usePatientStore()
  const consentStore = useConsentStore()
  const inventoryStore = useInventoryStore()

  function answerData(key) {
    switch (key) {
      case 'patients':
        return `Şu an ${patientStore.patients.length} kayıtlı hasta var.`
      case 'pendingConsents': {
        const n = consentStore.pendingConsents.length
        return n
          ? `İmza bekleyen ${n} onam formu var.`
          : 'İmza bekleyen onam formu yok, tüm işlemler tamam.'
      }
      case 'signedConsents':
        return `${consentStore.signedConsents.length} onam imzalanmış durumda.`
      case 'lowStock': {
        const items = inventoryStore.lowStockItems
        if (!items.length) return 'Tüm stok düzeyleri sağlıklı, kritik uyarı yok.'
        const names = items.slice(0, 3).map((i) => i.name).join(', ')
        const extra = items.length > 3 ? ` ve ${items.length - 3} kalem daha` : ''
        return `${items.length} kalemde kritik stok var: ${names}${extra}.`
      }
      default:
        return FALLBACK_TEXT
    }
  }

  // utterance → { reply, action? }
  function handle(utterance) {
    const text = (utterance || '').trim()
    if (!text) return { reply: FALLBACK_TEXT }

    const intent = resolveIntent(text)
    if (!intent) return { reply: FALLBACK_TEXT }

    switch (intent.type) {
      case 'navigate': {
        const label = ROUTE_LABELS[intent.payload] || 'ilgili'
        router.push(intent.payload)
        return {
          reply: `${label} sayfasını açtım.`,
          action: { type: 'navigate', path: intent.payload },
        }
      }
      case 'data':
        return { reply: answerData(intent.payload) }
      case 'info':
        return { reply: intent.payload }
      case 'help':
        return { reply: HELP_TEXT }
      default:
        return { reply: FALLBACK_TEXT }
    }
  }

  return { handle }
}
