<template>
  <!-- Boş durum: imza bekleyen onam yok — dinlenen belge + onay mührü -->
  <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- yumuşak zemin halkası -->
    <circle cx="48" cy="48" r="30" stroke-width="1.5" stroke-opacity="0.18" stroke-dasharray="3 5" />
    <!-- belge -->
    <path d="M37 28h16l8 8v28a3 3 0 0 1-3 3H37a3 3 0 0 1-3-3V31a3 3 0 0 1 3-3z" stroke-width="2" />
    <path d="M53 28v8h8" stroke-width="2" />
    <path d="M40 44h12" stroke-width="2" stroke-opacity="0.45" />
    <path d="M40 50h16" stroke-width="2" stroke-opacity="0.45" />
    <path d="M40 56h9" stroke-width="2" stroke-opacity="0.45" />
    <!-- onay mührü -->
    <circle cx="60" cy="62" r="9" stroke-width="2" />
    <path d="M56 62l3 3 5-6" stroke-width="2" />
  </svg>
</template>
