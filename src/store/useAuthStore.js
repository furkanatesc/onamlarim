import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin, me as apiMe, logout as apiLogout } from '../api/auth.api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  async function signIn(username, password) {
    user.value = await apiLogin(username, password)
    return user.value
  }
  async function loadMe() {
    user.value = await apiMe()
    return user.value
  }
  function signOut() {
    apiLogout()
    user.value = null
  }
  return { user, signIn, loadMe, signOut }
})
