<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        ref="modalRef" 
        class="bg-white rounded-2xl border border-slate-200/60 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all duration-300"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Dijital Onam Formunu İmzala</h3>
            <p class="text-[10px] text-slate-400">Belge ID: <span class="font-mono text-slate-600 font-semibold">{{ consentId }}</span></p>
          </div>
          <button 
            @click="closeModal" 
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Document Details -->
        <div class="bg-blue-50/40 px-6 py-3 border-b border-slate-100 flex flex-col gap-1">
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-500">Hasta:</span>
            <span class="font-bold text-slate-700">{{ patientName }}</span>
          </div>
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-500">Uygulanacak İşlem:</span>
            <span class="font-bold text-slate-700">{{ procedure }}</span>
          </div>
        </div>

        <!-- Canvas Drawing Pad -->
        <div class="p-6 flex flex-col gap-4 items-center">
          <div class="w-full flex justify-between items-center text-xs">
            <span class="font-semibold text-slate-600 flex items-center gap-1.5">
              <PenTool class="w-3.5 h-3.5 text-blue-600" /> İmza Çizim Alanı
            </span>
            <span class="text-[10px] text-slate-400">Klinik kalemi veya fareniz ile çizin</span>
          </div>

          <!-- Canvas Container -->
          <div class="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl overflow-hidden relative group">
            <canvas 
              ref="canvasRef" 
              class="w-full h-48 block cursor-crosshair"
            ></canvas>
            
            <div 
              v-if="isCanvasEmpty" 
              class="absolute inset-0 flex flex-col gap-2 items-center justify-center pointer-events-none select-none text-slate-300"
            >
              <Signature class="w-10 h-10 opacity-40" />
              <span class="text-[10px] font-medium tracking-wide">HASTA İMZASI BURAYA</span>
            </div>
          </div>

          <!-- Quick Helpers -->
          <div class="flex justify-between w-full text-[10px] text-slate-400">
            <span>İmzalayarak onam maddelerini kabul etmiş olursunuz.</span>
            <button @click="clearSignature" class="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer">
              Temizle
            </button>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            @click="closeModal" 
            class="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
          >
            İptal
          </button>
          <button 
            @click="saveSignature" 
            :disabled="isCanvasEmpty"
            class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            İmzayı Kaydet
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { X, PenTool, Edit3 as Signature } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import SignaturePad from 'signature_pad'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  consentId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  procedure: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const modalRef = ref(null)
const canvasRef = ref(null)
const isCanvasEmpty = ref(true)
let signaturePadInstance = null

// Close on outside clicks using VueUse
onClickOutside(modalRef, () => {
  closeModal()
})

function closeModal() {
  emit('close')
}

// Watch modal state to initialize signature pad when visible
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    isCanvasEmpty.value = true
    await nextTick()
    initSignaturePad()
  } else {
    destroySignaturePad()
  }
})

function initSignaturePad() {
  const canvas = canvasRef.value
  if (!canvas) return

  // High-DPI support to ensure signature looks crisp
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  
  // Set display size matching container
  canvas.width = canvas.offsetWidth * ratio
  canvas.height = canvas.offsetHeight * ratio
  canvas.getContext("2d").scale(ratio, ratio)

  signaturePadInstance = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255, 255, 255, 0)', // transparent
    penColor: '#0f172a', // Slate 900
    minWidth: 1.2,
    maxWidth: 3.5,
  })

  // Watch stroke start/end
  signaturePadInstance.addEventListener('beginStroke', () => {
    isCanvasEmpty.value = false
  })
}

function clearSignature() {
  if (signaturePadInstance) {
    signaturePadInstance.clear()
    isCanvasEmpty.value = true
  }
}

// Emits base64 png signature back
function saveSignature() {
  if (signaturePadInstance && !signaturePadInstance.isEmpty()) {
    const dataUrl = signaturePadInstance.toDataURL('image/png')
    emit('save', dataUrl)
    closeModal()
  }
}

function destroySignaturePad() {
  if (signaturePadInstance) {
    signaturePadInstance.off()
    signaturePadInstance = null
  }
}

// Handle resize to adjust drawing coordinates scale
function handleResize() {
  if (props.isOpen && canvasRef.value) {
    // Save current strokes, re-init, and restore
    const currentData = signaturePadInstance ? signaturePadInstance.toData() : null
    initSignaturePad()
    if (currentData && signaturePadInstance) {
      signaturePadInstance.fromData(currentData)
    }
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  destroySignaturePad()
})
</script>

<style scoped>
/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .bg-white {
  animation: modal-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-leave-active .bg-white {
  animation: modal-zoom-out 0.2s ease-in;
}

@keyframes modal-zoom-in {
  from {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes modal-zoom-out {
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.95) translateY(5px);
    opacity: 0;
  }
}
</style>
