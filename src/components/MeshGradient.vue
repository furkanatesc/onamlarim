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

const bgColor = computed(() => props.variant === 'vibrant' ? 'bg-white' : 'bg-white')

// Varyanta göre renk geçişleri — emboss-paper dili: çok hafif teal + kâğıt tonları
const color1 = computed(() => props.variant === 'vibrant' ? 'bg-[#088496]/20' : 'bg-[#088496]/8')
const color2 = computed(() => props.variant === 'vibrant' ? 'bg-slate-200/50' : 'bg-slate-200/30')
const color3 = computed(() => props.variant === 'vibrant' ? 'bg-[#088496]/12' : 'bg-[#088496]/5')
</script>
