<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-dark-950 to-accent-900/10"></div>
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0); background-size: 50px 50px;"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 text-center max-w-md mx-auto p-6">
      <!-- 404 Icon -->
      <div class="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl mx-auto mb-8 flex items-center justify-center">
        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>

      <!-- Error Message -->
      <div class="space-y-4 mb-8">
        <h1 class="text-6xl font-bold text-white mb-2">404</h1>
        <h2 class="text-2xl font-semibold text-white">Page Not Found</h2>
        <p class="text-dark-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <!-- Actions -->
      <div class="space-y-4">
        <router-link
          to="/dashboard"
          class="block w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all text-center"
        >
          Back to Dashboard
        </router-link>

        <div class="flex space-x-4">
          <router-link
            to="/artists"
            class="flex-1 py-2 text-primary-400 hover:text-primary-300 transition-colors text-center"
          >
            Browse Artists
          </router-link>

          <button
            @click="goBack"
            class="flex-1 py-2 text-dark-400 hover:text-white transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>

      <!-- Help Text -->
      <div class="mt-8 text-sm text-dark-500">
        <p>If you believe this is an error, please contact support.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/dashboard')
  }
}
</script>