<template>
  <div ref="rootRef" class="fixed inset-0 -z-10 bg-white overflow-hidden" aria-hidden="true">
    <!-- Tier A: scroll-scrubbed video frames -->
    <canvas v-show="mode === 'frames'" ref="canvasRef" class="absolute inset-0 w-full h-full"></canvas>

    <!-- Tier A fallback: live video seeking -->
    <video
      v-show="mode === 'seek'"
      ref="videoRef"
      :src="src"
      muted
      playsinline
      preload="auto"
      class="absolute inset-0 w-full h-full object-cover"
    ></video>

    <!-- Tier B/C: SVG line-draw building (also used for reduced-motion / mobile, drawn fully) -->
    <svg
      v-if="mode === 'svg'"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      class="absolute inset-0 w-full h-full"
    >
      <g style="filter: drop-shadow(0 1px 0 rgba(255,255,255,0.9))">
        <path
          v-for="(l, i) in lines"
          :key="i"
          :d="l.d"
          fill="none"
          stroke="#0f172a"
          stroke-opacity="0.11"
          :stroke-width="l.w"
          stroke-linecap="round"
          stroke-linejoin="round"
          pathLength="1"
          stroke-dasharray="1"
          :stroke-dashoffset="offset(l)"
        />
      </g>
    </svg>

    <!-- White scrims: keep it light, never dark; fade content to paper toward the bottom -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 24%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.94) 100%);"
    ></div>
    <!-- Subtle paper grain for tooth -->
    <div class="absolute inset-0 bg-noise opacity-[0.035] mix-blend-multiply pointer-events-none"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  // Same-origin file in /public. Swap to a CDN URL later if desired.
  src: { type: String, default: '/hero-architecture.mp4' },
  // Scroll distance (in viewport heights) over which the building fully defines.
  scrollSpan: { type: Number, default: 1.0 },
})

const rootRef = ref(null)
const canvasRef = ref(null)
const videoRef = ref(null)
const mode = ref('frames') // 'frames' | 'seek' | 'svg'
const progress = ref(0)

let ctx = null
let frames = []
let framesReady = false
let lastIdx = -1
let rafId = null
let lastProgress = -1

const reduced =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- SVG fallback building (abstract modern architectural elevation) ---------- */
function buildLines() {
  const out = []
  const baseY = 770
  const towers = [
    { x: 560, w: 210, h: 560, floors: 11, bays: 5 }, // center, tallest
    { x: 372, w: 168, h: 372, floors: 8, bays: 4 }, // left
    { x: 800, w: 184, h: 470, floors: 9, bays: 4 }, // right
  ]
  out.push({ d: `M 110 ${baseY} L 1330 ${baseY}`, w: 1.5 }) // ground
  towers.forEach((t) => {
    const top = baseY - t.h
    out.push({
      d: `M ${t.x} ${baseY} L ${t.x} ${top} L ${t.x + t.w} ${top} L ${t.x + t.w} ${baseY}`,
      w: 1.5,
    })
    for (let b = 1; b < t.bays; b++) {
      const x = t.x + (t.w / t.bays) * b
      out.push({ d: `M ${x} ${top} L ${x} ${baseY}`, w: 1 })
    }
    for (let f = 1; f < t.floors; f++) {
      const y = top + (t.h / t.floors) * f
      out.push({ d: `M ${t.x} ${y} L ${t.x + t.w} ${y}`, w: 1 })
    }
  })
  const n = out.length
  return out.map((o, i) => {
    const s = (i / n) * 0.88
    return { ...o, s, e: Math.min(1, s + 0.16) }
  })
}
const lines = buildLines()
function offset(l) {
  return Math.max(0, Math.min(1, (l.e - progress.value) / (l.e - l.s)))
}

/* ---------- Scroll progress ---------- */
function getProgress() {
  const end = window.innerHeight * props.scrollSpan
  if (end <= 0) return 0
  return Math.max(0, Math.min(1, window.scrollY / end))
}

/* ---------- Canvas drawing (Tier A) ---------- */
function resize() {
  const c = canvasRef.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.round(window.innerWidth * dpr)
  c.height = Math.round(window.innerHeight * dpr)
  lastIdx = -1
}
function drawFrame(f) {
  const c = canvasRef.value
  if (!c || !f) return
  const cw = c.width
  const ch = c.height
  const s = Math.max(cw / f.width, ch / f.height)
  const dw = f.width * s
  const dh = f.height * s
  ctx.clearRect(0, 0, cw, ch)
  ctx.drawImage(f, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
}

async function extractFrames() {
  try {
    const res = await fetch(props.src, { mode: 'cors' })
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.src = url
    await new Promise((ok, no) => {
      v.onloadedmetadata = () => ok()
      v.onerror = () => no(new Error('metadata'))
      setTimeout(() => no(new Error('metadata timeout')), 12000)
    })
    const scale = Math.min(1, 1280 / v.videoWidth)
    const w = Math.round(v.videoWidth * scale)
    const h = Math.round(v.videoHeight * scale)
    const count = Math.max(30, Math.min(120, Math.round(v.duration * 24)))
    for (let i = 0; i < count; i++) {
      v.currentTime = (i / (count - 1)) * (v.duration - 0.05)
      await new Promise((ok, no) => {
        const onSeeked = () => {
          v.removeEventListener('seeked', onSeeked)
          ok()
        }
        v.addEventListener('seeked', onSeeked)
        setTimeout(() => {
          v.removeEventListener('seeked', onSeeked)
          no(new Error('seek timeout'))
        }, 4000)
      })
      frames.push(await createImageBitmap(v, { resizeWidth: w, resizeHeight: h }))
    }
    URL.revokeObjectURL(url)
    if (frames.length) {
      framesReady = true
      mode.value = 'frames'
    } else {
      throw new Error('no frames')
    }
  } catch (e) {
    startSeekFallback()
  }
}

function startSeekFallback() {
  const v = videoRef.value
  // SVG'ye düşersek binayı tam çizili göster (progress=1), boş hero olmasın
  if (!v) {
    mode.value = 'svg'
    progress.value = 1
    return
  }
  mode.value = 'seek'
  let loaded = false
  v.addEventListener('loadeddata', () => {
    loaded = true
    v.currentTime = 0
  }, { once: true })
  v.addEventListener('error', () => {
    mode.value = 'svg'
    progress.value = 1
  }, { once: true })
  setTimeout(() => {
    if (!loaded) {
      mode.value = 'svg'
      progress.value = 1
    }
  }, 6000)
}

function tick() {
  // Sadece scroll ilerlemesi değiştiğinde iş yap (boştayken bedava rAF)
  const p = getProgress()
  if (p !== lastProgress) {
    lastProgress = p
    progress.value = p
    if (mode.value === 'frames' && framesReady && frames.length) {
      const idx = Math.round(p * (frames.length - 1))
      if (idx !== lastIdx) {
        lastIdx = idx
        if (frames[idx]) drawFrame(frames[idx])
      }
    } else if (mode.value === 'seek') {
      const v = videoRef.value
      if (v && v.duration && isFinite(v.duration) && v.readyState >= 1) {
        const target = p * v.duration
        // Native v.seeking kullan → düşen 'seeked' eventinde kilitlenmez
        if (!v.seeking && Math.abs(v.currentTime - target) > 0.05) {
          v.currentTime = target
        }
      }
    }
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  const isMobile = window.innerWidth < 768
  // Tier C: yalnızca reduced-motion ya da video yoksa statik SVG
  if (!props.src || reduced) {
    mode.value = 'svg'
    progress.value = 1
    return
  }
  if (isMobile) {
    // Mobilde scroll-seek güvenilmez (decode/ızgara artefaktı, donma) →
    // videoyu ambient loop oynat (scroll'a bağlı değil)
    const v = videoRef.value
    if (v) {
      mode.value = 'seek' // video elementini göster
      v.loop = true
      v.play().catch(() => {
        mode.value = 'svg'
        progress.value = 1
      })
    } else {
      mode.value = 'svg'
      progress.value = 1
    }
    return
  }
  const c = canvasRef.value
  ctx = c.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  rafId = requestAnimationFrame(tick)
  extractFrames()
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  frames.forEach((f) => f.close && f.close())
  frames = []
})
</script>
