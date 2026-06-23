<template>
  <div class="relative min-h-screen flex text-slate-900 font-sans">
    <!-- Reusable Subtle Mesh Gradient Backdrop -->
    <MeshGradient variant="subtle" />

    <!-- Glassmorphic Sidebar (mobilde drawer) -->
    <Sidebar />

    <!-- Mobil backdrop -->
    <div
      v-if="isOpen"
      @click="close"
      class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
    ></div>

    <!-- Main Content Area -->
    <div class="flex-1 lg:pl-64 flex flex-col min-w-0 z-10">
      <!-- Sticky Top Header -->
      <Header class="z-10" />

      <!-- Page Content Wrapper -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Sesli AI asistan (yalnızca dashboard) -->
    <AssistantWidget />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import MeshGradient from '../components/MeshGradient.vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import AssistantWidget from '../components/assistant/AssistantWidget.vue'
import { useSidebar } from '../composables/useSidebar'

const route = useRoute()
const { isOpen, close } = useSidebar()

// Rota değişince mobil drawer'ı kapat
watch(() => route.path, () => close())
</script>

<style>
/* Page Routing Transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
