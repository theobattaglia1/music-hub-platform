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
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p class="text-dark-400">Enter your email to receive a password reset link</p>
      </div>

      <!-- Reset Form -->
      <div class="bg-dark-900/50 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
        <form v-if="!emailSent" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-dark-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="your@email.com"
              :disabled="loading"
              autofocus
            />
            <p class="mt-2 text-sm text-dark-400">
              We'll send a password reset link to this email address
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p class="text-sm text-red-400">{{ error }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !email"
            class="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending reset link...
            </span>
            <span v-else>Send Reset Link</span>
          </button>
        </form>

        <!-- Success State -->
        <div v-else class="text-center space-y-4">
          <div class="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>

          <h2 class="text-xl font-semibold text-white">Check Your Email</h2>

          <div class="text-dark-300 space-y-2">
            <p>We've sent a password reset link to:</p>
            <p class="font-medium text-white">{{ email }}</p>
          </div>

          <div class="text-sm text-dark-400 bg-dark-800/50 rounded-lg p-4 border border-dark-700">
            <p class="mb-2"><strong class="text-dark-300">Didn't receive the email?</strong></p>
            <ul class="space-y-1 text-left">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes for delivery</li>
            </ul>
          </div>

          <div class="flex flex-col space-y-3">
            <button
              @click="resendEmail"
              :disabled="resendLoading || resendCooldown > 0"
              class="px-4 py-2 bg-dark-800 text-white rounded-lg font-medium hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-dark-600 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="resendLoading">Sending...</span>
              <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
              <span v-else>Resend Email</span>
            </button>

            <router-link
              to="/auth/login"
              class="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Back to Login
            </router-link>
          </div>
        </div>

        <!-- Back to Login (when form is showing) -->
        <div v-if="!emailSent" class="mt-6 text-center">
          <router-link
            to="/auth/login"
            class="text-primary-400 hover:text-primary-300 transition-colors text-sm"
          >
            ← Back to Login
          </router-link>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-xs text-dark-500">
        <p>&copy; 2024 Music Hub Platform. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const email = ref('')
const loading = ref(false)
const error = ref('')
const emailSent = ref(false)
const resendLoading = ref(false)
const resendCooldown = ref(0)

let resendTimer = null

// Methods
const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''

    await authStore.resetPassword(email.value)

    emailSent.value = true
    startResendCooldown()
  } catch (err) {
    error.value = err.message || 'An error occurred while sending the reset email'
  } finally {
    loading.value = false
  }
}

const resendEmail = async () => {
  try {
    resendLoading.value = true
    await authStore.resetPassword(email.value)
    startResendCooldown()
  } catch (err) {
    error.value = err.message || 'Failed to resend email'
  } finally {
    resendLoading.value = false
  }
}

const startResendCooldown = () => {
  resendCooldown.value = 60 // 60 second cooldown

  resendTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(resendTimer)
    }
  }, 1000)
}

// Check if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})

// Cleanup timer
onUnmounted(() => {
  if (resendTimer) {
    clearInterval(resendTimer)
  }
})
</script>