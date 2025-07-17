<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-accent-900/20"></div>
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-md mx-auto p-6">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2M9 19c0-1.1-.9-2-2-2s-2 .9-2 2M21 19c0 1.1-.9 2-2 2s-2-.9-2-2M21 19c0-1.1.9-2.1-2-2s-2 .9-2 2"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Authenticating...</h1>
        <p class="text-dark-400">Please wait while we sign you in</p>
      </div>

      <!-- Status Messages -->
      <div class="bg-dark-900/50 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
        <!-- Loading State -->
        <div v-if="loading" class="text-center space-y-4">
          <div class="w-16 h-16 bg-primary-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p class="text-dark-300">Signing you in...</p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="text-center space-y-4">
          <div class="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white">Successfully Signed In!</h2>
          <p class="text-dark-300">Redirecting to your dashboard...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center space-y-4">
          <div class="w-16 h-16 bg-red-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white">Authentication Failed</h2>
          <p class="text-dark-300">{{ error }}</p>
          
          <div class="space-y-3">
            <router-link
              to="/auth/login"
              class="block w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all text-center"
            >
              Back to Login
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const success = ref(false)
const error = ref('')

// Handle auth callback on mount
onMounted(async () => {
  try {
    // Initialize auth store to handle the callback
    await authStore.initialize()
    
    // Check if user is now authenticated
    if (authStore.isAuthenticated) {
      success.value = true
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      error.value = 'Authentication failed. Please try again.'
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'An unexpected error occurred during authentication.'
  } finally {
    loading.value = false
  }
})
</script>