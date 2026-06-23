<template>
  <div class="relative min-h-screen flex text-slate-900 font-sans">
    <!-- Reusable Subtle Mesh Gradient Backdrop -->
    <MeshGradient variant="subtle" />

    <!-- Glassmorphic Sidebar (Fixed inside) -->
    <Sidebar class="z-20" />

    <!-- Main Content Area -->
    <div class="flex-1 pl-64 flex flex-col min-w-0 z-10">
      <!-- Sticky Top Header -->
      <Header class="z-10" />

      <!-- Page Content Wrapper -->
      <main class="flex-1 p-8 overflow-y-auto">
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
  </div>
</template>

<script setup>
import MeshGradient from '../components/MeshGradient.vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
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
