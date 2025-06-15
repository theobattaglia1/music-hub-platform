<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-950">
    <div class="text-center">
      <div v-if="loading" class="space-y-4">
        <div class="animate-spin-slow w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p class="text-dark-300">{{ loadingMessage }}</p>
      </div>

      <div v-else-if="error" class="space-y-4 max-w-md">
        <div class="w-12 h-12 bg-red-500/20 rounded-full mx-auto flex items-center justify-center">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-white">Authentication Error</h2>
        <p class="text-dark-300">{{ error }}</p>
        <router-link
          to="/auth/login"
          class="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Back to Login
        </router-link>
      </div>

      <div v-else class="space-y-4">
        <div class="w-12 h-12 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-white">Authentication Successful</h2>
        <p class="text-dark-300">Redirecting to your dashboard...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')
const loadingMessage = ref('Verifying authentication...')

onMounted(async () => {
  try {
    // Handle the auth callback
    const { data, error: authError } = await supabase.auth.getSession()

    if (authError) {
      throw authError
    }

    if (data.session) {
      loadingMessage.value = 'Setting up your account...'

      // Update auth store
      await authStore.setUser(data.session.user)

      loadingMessage.value = 'Redirecting to dashboard...'

      // Small delay for UX
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      throw new Error('No session found. Please try signing in again.')
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'An unexpected error occurred'
    loading.value = false
  }
})
</script>