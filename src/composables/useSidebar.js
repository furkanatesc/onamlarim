import { ref } from 'vue'

// Mobil sidebar drawer durumu (modül-seviyesi paylaşımlı ref).
const isOpen = ref(false)

export function useSidebar() {
  return {
    isOpen,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
    toggle: () => (isOpen.value = !isOpen.value),
  }
}
