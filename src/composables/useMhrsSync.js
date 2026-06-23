import { ref, onMounted, onUnmounted } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import apiClient from '../api/axios'

export function useMhrsSync() {
  const isSyncing = ref(false)
  const lastSyncTime = ref(new Date().toLocaleTimeString('tr-TR'))
  const appointmentCount = ref(12)
  const syncStatus = ref('synced') // 'synced', 'syncing', 'error'

  // Function to perform synchronization
  async function triggerSync() {
    if (isSyncing.value) return
    
    isSyncing.value = true
    syncStatus.value = 'syncing'
    
    try {
      // API call (goes through interceptor which delays for 800ms)
      const response = await apiClient.get('/mhrs/sync-status')
      appointmentCount.value = Math.floor(Math.random() * 10) + 8 // Randomize count slightly
      lastSyncTime.value = new Date().toLocaleTimeString('tr-TR')
      syncStatus.value = 'synced'
    } catch (error) {
      console.error('MHRS Sync failed', error)
      syncStatus.value = 'error'
    } finally {
      isSyncing.value = false
    }
  }

  // Auto-sync every 60 seconds using VueUse's useIntervalFn
  const { pause, resume } = useIntervalFn(() => {
    triggerSync()
  }, 60000)

  onMounted(() => {
    resume()
  })

  onUnmounted(() => {
    pause()
  })

  return {
    isSyncing,
    lastSyncTime,
    appointmentCount,
    syncStatus,
    triggerSync
  }
}
