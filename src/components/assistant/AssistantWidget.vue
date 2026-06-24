<template>
  <!-- Floating Action Button -->
  <button
    v-show="!isOpen"
    @click="open"
    class="fixed bottom-6 right-6 z-40 emboss-raised flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-[#088496] hover:-translate-y-0.5 transition-transform duration-300"
    aria-label="Onam Asistanı'nı aç"
  >
    <MessageCircle class="w-6 h-6" />
    <span class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#088496] ring-2 ring-white"></span>
  </button>

  <!-- Panel -->
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <div
      v-if="isOpen"
      class="fixed z-40 flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-[0_24px_70px_-12px_rgba(15,23,42,0.28)]
             inset-x-3 bottom-3 top-16
             sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-[370px] sm:h-[540px]"
    >
      <!-- Header -->
      <header class="flex items-center gap-3 px-4 py-3 border-b border-white/60 bg-white/40">
        <div class="emboss-raised flex items-center justify-center w-9 h-9 rounded-xl bg-white text-[#088496]">
          <MessageCircle class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-slate-800 leading-none">Onam Asistanı</p>
          <p class="text-[10px] text-[#088496] font-semibold tracking-wide mt-0.5">
            {{ isListening ? 'Dinleniyor…' : 'Sesle veya yazarak sorun' }}
          </p>
        </div>
        <button
          v-if="ttsSupported"
          @click="toggleMute"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
          :aria-label="muted ? 'Sesli yanıtı aç' : 'Sesli yanıtı kapat'"
        >
          <component :is="muted ? VolumeX : Volume2" class="w-4 h-4" />
        </button>
        <button
          @click="close"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
          aria-label="Kapat"
        >
          <X class="w-4 h-4" />
        </button>
      </header>

      <!-- Messages -->
      <div ref="listEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="flex"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[82%] px-3.5 py-2 text-xs leading-relaxed whitespace-pre-line rounded-2xl"
            :class="m.role === 'user'
              ? 'bg-[#088496] text-white rounded-tr-sm'
              : 'emboss-inset bg-white text-slate-700 rounded-tl-sm'"
          >
            {{ m.text }}
          </div>
        </div>

        <!-- Öneri çipleri (sohbet başında) -->
        <div v-if="messages.length <= 1" class="flex flex-wrap gap-2 pt-1">
          <button
            v-for="s in suggestions"
            :key="s"
            @click="send(s)"
            class="emboss-raised text-[11px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full hover:text-[#088496] hover:-translate-y-0.5 transition-all"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Canlı transcript -->
      <div v-if="isListening && transcript" class="px-4 pb-1">
        <p class="text-[11px] text-slate-400 italic truncate">“{{ transcript }}”</p>
      </div>

      <!-- Input -->
      <form @submit.prevent="submitForm" class="flex items-center gap-2 px-3 py-3 border-t border-white/60 bg-white/40">
        <button
          v-if="isSupported"
          type="button"
          @click="toggleMic"
          class="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors"
          :class="isListening
            ? 'bg-[#088496] text-white animate-pulse'
            : 'emboss-inset bg-white text-[#088496]'"
          :aria-label="isListening ? 'Dinlemeyi durdur' : 'Konuşmak için bas'"
        >
          <Mic class="w-4 h-4" />
        </button>
        <input
          v-model="input"
          type="text"
          placeholder="Bir şey sorun veya söyleyin…"
          class="flex-1 min-w-0 emboss-inset bg-white rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#088496]/20"
        />
        <button
          type="submit"
          :disabled="!input.trim()"
          class="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 bg-[#088496] text-white disabled:opacity-40 hover:bg-[#066b7a] transition-colors"
          aria-label="Gönder"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>

      <p v-if="!isSupported" class="px-4 pb-3 text-[10px] text-slate-400 text-center">
        Tarayıcınız sesli girişi desteklemiyor — yazarak devam edebilirsiniz.
      </p>
    </div>
  </transition>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { MessageCircle, Mic, Send, X, Volume2, VolumeX } from '@lucide/vue'
import { useSpeech } from '../../composables/useSpeech'
import { useAssistant } from '../../composables/useAssistant'

const { handle } = useAssistant()
const { isSupported, ttsSupported, isListening, transcript, muted, start, stop, onResult, speak, cancelSpeak, toggleMute } =
  useSpeech()

const isOpen = ref(false)
const input = ref('')
const listEl = ref(null)
const messages = ref([
  { role: 'assistant', text: 'Merhaba! Size nasıl yardımcı olabilirim? Sayfa açabilir, klinik verinizi sorabilir ya da ürünü tanıtabilirim.' },
])

const suggestions = ['Kaç hasta var?', 'Hastalara git', 'İmza bekleyen onam', 'MHRS nedir?']

async function scrollToBottom() {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

function send(text) {
  const t = (text || '').trim()
  if (!t) return
  messages.value.push({ role: 'user', text: t })
  const { reply } = handle(t)
  messages.value.push({ role: 'assistant', text: reply })
  speak(reply)
  input.value = ''
  scrollToBottom()
}

function submitForm() {
  send(input.value)
}

function toggleMic() {
  if (isListening.value) stop()
  else start()
}

// Sesli sonuç gelince otomatik gönder (canlı metin "Canlı transcript" satırında gösterilir)
onResult((finalText) => send(finalText))

function open() {
  isOpen.value = true
  scrollToBottom()
}
function close() {
  if (isListening.value) stop()
  cancelSpeak() // panel kapanınca süren seslendirmeyi durdur
  isOpen.value = false
}
</script>
