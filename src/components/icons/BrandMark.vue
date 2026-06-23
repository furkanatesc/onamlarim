<template>
  <!-- Onamlarım marka amblemi: tek imza vuruşu, onay (✓) ucuyla biten — "imzala → onayla" -->
  <svg
    viewBox="2 8.5 28 17"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    aria-label="Onamlarım"
  >
    <!-- İmza alt çizgisi (ıslak imza hissi) -->
    <path
      v-if="baseline"
      d="M4 24 H25"
      :stroke-width="strokeWidth * 0.72"
      stroke-opacity="0.35"
    />
    <!-- İmza akışı + onay vuruşu (tek kesintisiz stroke) -->
    <path
      d="M4 18 C 6.5 11.5, 8.5 11.5, 10 16 S 12.8 20.5, 14.2 14.5 S 16.2 10.5, 18 15.5 L 20.5 20 L 27.5 10.5"
      :stroke-width="strokeWidth"
    />
    <!-- Opsiyonel kıvılcım (varsayılan kapalı; :sparkle ile açılır) -->
    <g v-if="sparkle">
      <path d="M28.4 5.8 Q28.4 9 31.6 9 Q28.4 9 28.4 12.2 Q28.4 9 25.2 9 Q28.4 9 28.4 5.8 Z" fill="currentColor" stroke="none" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  strokeWidth: { type: Number, default: 2 },
  baseline: { type: Boolean, default: true },
  sparkle: { type: Boolean, default: false },
})
</script>
