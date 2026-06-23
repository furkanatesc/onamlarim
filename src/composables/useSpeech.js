import { ref, onBeforeUnmount } from 'vue'

// Web Speech API sarmalayıcı: ses→metin (SpeechRecognition) + metin→ses (SpeechSynthesis).
// Tarayıcı desteği değişkendir (Chrome/Edge tam, Firefox/Safari kısmi) — isSupported ile kontrol et.
export function useSpeech({ lang = 'tr-TR' } = {}) {
  const SR =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  const isSupported = ref(!!SR)
  const ttsSupported = ref(!!synth)
  const isListening = ref(false)
  const transcript = ref('')
  const muted = ref(false)

  let recognition = null
  let resultCallback = null

  if (SR) {
    recognition = new SR()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) final += chunk
        else interim += chunk
      }
      transcript.value = (final || interim).trim()
      if (final && resultCallback) resultCallback(final.trim())
    }
    recognition.onerror = () => {
      isListening.value = false
    }
    recognition.onend = () => {
      isListening.value = false
    }
  }

  function start() {
    if (!recognition || isListening.value) return
    transcript.value = ''
    try {
      recognition.start()
      isListening.value = true
    } catch {
      isListening.value = false
    }
  }

  function stop() {
    if (recognition && isListening.value) {
      try {
        recognition.stop()
      } catch {
        /* yoksay */
      }
    }
    isListening.value = false
  }

  function onResult(cb) {
    resultCallback = cb
  }

  // Türkçe ses varsa onu seçer; mute açıkken sessizdir.
  function speak(text) {
    if (!synth || muted.value || !text) return
    try {
      synth.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      const voices = synth.getVoices()
      const trVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('tr'))
      if (trVoice) utter.voice = trVoice
      synth.speak(utter)
    } catch {
      /* yoksay */
    }
  }

  function cancelSpeak() {
    if (synth) {
      try {
        synth.cancel()
      } catch {
        /* yoksay */
      }
    }
  }

  function toggleMute() {
    muted.value = !muted.value
    if (muted.value) cancelSpeak()
  }

  onBeforeUnmount(() => {
    stop()
    cancelSpeak()
  })

  return {
    isSupported,
    ttsSupported,
    isListening,
    transcript,
    muted,
    start,
    stop,
    onResult,
    speak,
    cancelSpeak,
    toggleMute,
  }
}
