<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Envanter ve Klinik Malzemeler</h2>
        <p class="text-xs text-slate-500">Klinik demirbaşları ve sarf malzemeleri takip edin, tüketim eğrilerini gözlemleyin ve stok yenileyin.</p>
      </div>
      <button 
        @click="isNewMaterialOpen = true"
        class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
      >
        <Plus class="w-4 h-4" /> Yeni Malzeme Ekle
      </button>
    </div>

    <!-- Quick Stat Alerts (Staggered item 2) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up animation-delay-100">
      <div class="p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Takip Edilen Malzeme</span>
          <p class="text-2xl font-extrabold text-slate-800 mt-1">{{ inventoryStore.items.length }}</p>
        </div>
        <div class="w-9 h-9 rounded-lg emboss-inset bg-white text-[#088496] flex items-center justify-center">
          <Layers class="w-5 h-5" />
        </div>
      </div>
      
      <div class="p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kritik Stok Uyarıları</span>
          <p class="text-2xl font-extrabold text-rose-600 mt-1">{{ inventoryStore.lowStockItems.length }}</p>
        </div>
        <div class="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle class="w-5 h-5" />
        </div>
      </div>

      <div class="p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bu Hafta Yenilenen</span>
          <p class="text-2xl font-extrabold text-emerald-600 mt-1">4 Malzeme</p>
        </div>
        <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Search Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200/50 rounded-2xl shadow-xs animate-fade-in-up animation-delay-200">
      <div class="relative flex-1 max-w-md">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-slate-400" />
        </div>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Malzeme adı veya kategorisine göre ara..."
          class="block w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
        />
      </div>
    </div>

    <!-- Materials Table -->
    <div class="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden animate-fade-in-up animation-delay-300">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <th class="px-6 py-3.5">Malzeme ID</th>
              <th class="px-6 py-3.5">Malzeme Adı</th>
              <th class="px-6 py-3.5">Kategori</th>
              <th class="px-6 py-3.5">Mevcut Stok</th>
              <th class="px-6 py-3.5">Emniyet Limiti</th>
              <th class="px-6 py-3.5">7 Günlük Tüketim</th>
              <th class="px-6 py-3.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr v-if="filteredItems.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                Aradığınız kriterlere uygun malzeme kaydı bulunamadı.
              </td>
            </tr>
            <tr 
              v-for="item in filteredItems" 
              :key="item.id"
              class="hover:bg-slate-50/30 transition-colors"
            >
              <td class="px-6 py-4 font-mono font-bold text-slate-500">
                {{ item.id }}
              </td>
              <td class="px-6 py-4 font-bold text-slate-850">
                {{ item.name }}
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-250/20 uppercase tracking-wide">
                  {{ item.category === 'Surgical' ? 'Cerrahi' : item.category === 'Restorative' ? 'Restoratif' : item.category === 'Consumables' ? 'Sarf Malzeme' : item.category === 'Disposables' ? 'Tek Kullanımlık' : item.category === 'Hygiene' ? 'Sterilizasyon' : item.category }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-extrabold" :class="item.stock <= item.minStock ? 'text-rose-600' : 'text-slate-800'">
                    {{ item.stock }}
                  </span>
                  <span class="text-slate-400 font-semibold text-[10px]">{{ item.unit === 'pcs' ? 'adet' : item.unit === 'boxes' ? 'kutu' : item.unit === 'tube' ? 'tüp' : item.unit }}</span>
                </div>
              </td>
              <td class="px-6 py-4 font-semibold text-slate-500">
                {{ item.minStock }} {{ item.unit === 'pcs' ? 'adet' : item.unit === 'boxes' ? 'kutu' : item.unit === 'tube' ? 'tüp' : item.unit }}
              </td>
              <!-- Sparkline Trend Chart -->
              <td class="px-6 py-3 w-40">
                <div class="h-10">
                  <Sparkline 
                    :data="item.history" 
                    :color="item.stock <= item.minStock ? '#f43f5e' : '#3b82f6'" 
                    :width="120" 
                    :height="30"
                  />
                </div>
              </td>
              <!-- Stock Control Action Buttons -->
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    @click="deductInventory(item)"
                    class="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100/50 text-[10px] font-semibold transition-all cursor-pointer inline-flex items-center gap-0.5"
                    title="1 Birim Tüket"
                  >
                    <Minus class="w-3.5 h-3.5" /> Tüket
                  </button>
                  <button 
                    @click="restockInventory(item)"
                    class="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100/50 text-[10px] font-semibold transition-all cursor-pointer inline-flex items-center gap-0.5"
                    title="Stok Ekle (+10)"
                  >
                    <Plus class="w-3.5 h-3.5" /> Stok Ekle
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Material Modal Drawer Overlay -->
    <Transition name="modal-fade">
      <div v-if="isNewMaterialOpen" class="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all duration-300">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800">Klinik Malzeme Kaydı</h3>
            <button @click="isNewMaterialOpen = false" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="submitNewMaterial" class="p-6 space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Malzeme Adı</label>
              <input 
                v-model="materialForm.name" 
                required
                type="text" 
                placeholder="Örn: Diş Dolgu Kompoziti" 
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                <select 
                  v-model="materialForm.category" 
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
                >
                  <option value="Surgical">Cerrahi</option>
                  <option value="Restorative">Restoratif</option>
                  <option value="Consumables">Sarf Malzeme</option>
                  <option value="Disposables">Tek Kullanımlık</option>
                  <option value="Hygiene">Sterilizasyon</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ölçü Birimi</label>
                <input 
                  v-model="materialForm.unit" 
                  required
                  type="text" 
                  placeholder="Örn: adet, kutu, tüp" 
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Başlangıç Stoğu</label>
                <input 
                  v-model.number="materialForm.stock" 
                  required
                  min="0"
                  type="number" 
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Emniyet Limiti (Minimum)</label>
                <input 
                  v-model.number="materialForm.minStock" 
                  required
                  min="0"
                  type="number" 
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#088496] focus:ring-4 focus:ring-[#088496]/15 transition-all duration-300"
                />
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                type="button"
                @click="isNewMaterialOpen = false" 
                class="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-[#088496] text-white rounded-xl text-xs font-semibold hover:bg-[#066b7a] shadow-md shadow-[#088496]/20 transition-all"
              >
                Malzemeyi Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Minus, Layers, AlertTriangle, CheckCircle, X } from '@lucide/vue'
import { useInventoryStore } from '../store/useInventoryStore'
import Sparkline from '../components/Sparkline.vue'

const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const isNewMaterialOpen = ref(false)

const materialForm = ref({
  name: '',
  category: 'Consumables',
  unit: 'pcs',
  stock: 10,
  minStock: 5
})

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return inventoryStore.items
  const q = searchQuery.value.toLowerCase().trim()
  return inventoryStore.items.filter(item => 
    item.name.toLowerCase().includes(q) || 
    item.category.toLowerCase().includes(q) || 
    item.id.toLowerCase().includes(q)
  )
})

function deductInventory(item) {
  inventoryStore.deductStock(item.id, 1)
}

function restockInventory(item) {
  inventoryStore.restockMaterial(item.id, 10)
}

function submitNewMaterial() {
  inventoryStore.addMaterial({ ...materialForm.value })
  materialForm.value = {
    name: '',
    category: 'Consumables',
    unit: 'pcs',
    stock: 10,
    minStock: 5
  }
  isNewMaterialOpen.value = false
}
</script>
