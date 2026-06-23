<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10" :class="bgColor">
    
    <div :class="[baseBlobClass, color1, 'top-[-10%] left-[-10%] animate-blob']"></div>
    <div :class="[baseBlobClass, color2, 'top-[20%] right-[-10%] animate-blob animation-delay-2000']"></div>
    <div :class="[baseBlobClass, color3, 'bottom-[-20%] left-[20%] animate-blob animation-delay-4000']"></div>
    
    <div class="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'subtle' // 'vibrant' veya 'subtle'
  }
})

// Ortak blur (bulanıklık) ve boyut özellikleri
const baseBlobClass = 'absolute rounded-full mix-blend-multiply filter blur-[120px] w-[500px] h-[500px] opacity-70'

const bgColor = computed(() => props.variant === 'vibrant' ? 'bg-slate-50' : 'bg-slate-50/50')

// Varyanta göre renk geçişleri
const color1 = computed(() => props.variant === 'vibrant' ? 'bg-blue-300' : 'bg-blue-100/40')
const color2 = computed(() => props.variant === 'vibrant' ? 'bg-indigo-300' : 'bg-slate-200/40')
const color3 = computed(() => props.variant === 'vibrant' ? 'bg-cyan-200' : 'bg-blue-50/40')
</script>
