<template>
  <div class="w-full h-full">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <!-- Gradient for Area Fill -->
        <linearGradient :id="`gradient-${gradientId}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.15" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Area below the line -->
      <path
        :d="areaPath"
        :fill="`url(#gradient-${gradientId})`"
        class="transition-all duration-500"
      />

      <!-- Sparkline path -->
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="transition-all duration-500"
      />

      <!-- End Point Indicator Dot -->
      <circle
        v-if="points.length > 0"
        :cx="points[points.length - 1].x"
        :cy="points[points.length - 1].y"
        r="3"
        :fill="color"
        class="animate-pulse shadow-sm"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  color: {
    type: String,
    default: '#088496', // teal accent
  },
  strokeWidth: {
    type: Number,
    default: 1.8,
  },
  width: {
    type: Number,
    default: 120,
  },
  height: {
    type: Number,
    default: 40,
  }
})

// Unique ID for gradients in case multiple sparklines are on the same page
const gradientId = Math.random().toString(36).substring(2, 9)

const points = computed(() => {
  if (!props.data || props.data.length < 2) return []

  const maxVal = Math.max(...props.data)
  const minVal = Math.min(...props.data)
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal
  
  const stepX = props.width / (props.data.length - 1)

  return props.data.map((val, idx) => {
    const x = idx * stepX
    // Normalize and scale, adding padding top/bottom so it doesn't clip
    const padding = 4
    const normalizedY = (val - minVal) / range
    const y = props.height - (normalizedY * (props.height - padding * 2) + padding)
    return { x, y }
  })
})

// Build the SVG path using cubic bezier curves or simple smooth connections
const linePath = computed(() => {
  if (points.value.length === 0) return ''
  
  let path = `M ${points.value[0].x} ${points.value[0].y}`
  
  for (let i = 0; i < points.value.length - 1; i++) {
    const p0 = points.value[i]
    const p1 = points.value[i + 1]
    // Control points for a smooth transition
    const cpX1 = p0.x + (p1.x - p0.x) / 2
    const cpY1 = p0.y
    const cpX2 = p0.x + (p1.x - p0.x) / 2
    const cpY2 = p1.y
    
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
  }
  
  return path
})

// Area path extends down to the bottom coordinates of the SVG viewbox
const areaPath = computed(() => {
  const line = linePath.value
  if (!line || points.value.length === 0) return ''
  
  const lastPoint = points.value[points.value.length - 1]
  const firstPoint = points.value[0]
  
  // Close the shape by extending to bottom-right, then bottom-left, then back to start
  return `${line} L ${lastPoint.x} ${props.height} L ${firstPoint.x} ${props.height} Z`
})
</script>
