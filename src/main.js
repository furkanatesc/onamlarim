import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { setOnAuthFailure } from './api/client.js'
import { API_ENABLED } from './api/config.js'
import { useAuthStore } from './store/useAuthStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

setOnAuthFailure(() => {
  localStorage.removeItem('onamlarim_access')
  localStorage.removeItem('onamlarim_refresh')
  router.push('/login')
})

if (API_ENABLED && localStorage.getItem('onamlarim_access')) {
  const auth = useAuthStore()
  auth.loadMe().catch(() => {
    localStorage.removeItem('onamlarim_access')
    localStorage.removeItem('onamlarim_refresh')
  })
}

app.mount('#app')
