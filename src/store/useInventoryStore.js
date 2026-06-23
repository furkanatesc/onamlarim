import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref([
    { id: 'INV-001', name: 'Cerrahi Sütür İpliği (No. 2-0)', category: 'Surgical', stock: 12, minStock: 15, unit: 'pcs', history: [22, 20, 19, 17, 15, 13, 12] },
    { id: 'INV-002', name: 'Nitrile Gloves (Box of 100)', category: 'Disposables', stock: 8, minStock: 20, unit: 'boxes', history: [35, 30, 26, 21, 15, 11, 8] },
    { id: 'INV-003', name: 'Tek Kullanımlık Spekulum', category: 'Disposables', stock: 5, minStock: 10, unit: 'pcs', history: [12, 11, 10, 8, 7, 6, 5] },
    { id: 'INV-004', name: 'Local Anesthetic (Ampoules)', category: 'Consumables', stock: 150, minStock: 100, unit: 'pcs', history: [200, 190, 185, 170, 168, 160, 150] },
    { id: 'INV-005', name: 'Surgical Blades #15', category: 'Surgical', stock: 45, minStock: 50, unit: 'pcs', history: [65, 62, 60, 58, 55, 50, 45] },
    { id: 'INV-006', name: 'Sterilization Pouches Medium', category: 'Hygiene', stock: 520, minStock: 200, unit: 'pcs', history: [550, 545, 540, 538, 532, 525, 520] }
  ])

  const lowStockItems = computed(() => {
    return items.value.filter(item => item.stock <= item.minStock)
  })

  function addMaterial(newItem) {
    const nextId = `INV-${String(items.value.length + 1).padStart(3, '0')}`
    // Generate a default 7-day random depletion trend based on starting stock
    const baseVal = newItem.stock
    const history = Array.from({ length: 7 }, (_, i) => {
      // Simulate historical values slightly higher than current
      return Math.round(baseVal * (1.3 - (i * 0.05)))
    }).reverse()

    items.value.unshift({
      id: nextId,
      history,
      ...newItem
    })
  }

  function deductStock(id, amount) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.stock = Math.max(0, item.stock - amount)
      item.history.push(item.stock)
      item.history.shift() // Keep only the last 7 entries
    }
  }

  function restockMaterial(id, amount) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.stock += amount
      item.history.push(item.stock)
      item.history.shift() // Keep last 7 entries
    }
  }

  return {
    items,
    lowStockItems,
    addMaterial,
    deductStock,
    restockMaterial
  }
})
