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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Set New Password</h1>
        <p class="text-dark-400">Enter your new password below</p>
      </div>

      <!-- Reset Form -->
      <div class="bg-dark-900/50 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
        <!-- Invalid Token State -->
        <div v-if="invalidToken" class="text-center space-y-4">
          <div class="w-16 h-16 bg-red-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>

          <h2 class="text-xl font-semibold text-white">Invalid Reset Link</h2>
          <p class="text-dark-300">This password reset link is invalid or has expired.</p>

          <div class="space-y-3">
            <router-link
              to="/auth/forgot-password"
              class="block w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all text-center"
            >
              Request New Reset Link
            </router-link>

            <router-link
              to="/auth/login"
              class="block text-center text-primary-400 hover:text-primary-300 transition-colors"
            >
              Back to Login
            </router-link>
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="passwordUpdated" class="text-center space-y-4">
          <div class="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>

          <h2 class="text-xl font-semibold text-white">Password Updated</h2>
          <p class="text-dark-300">Your password has been successfully updated.</p>

          <button
            @click="redirectToLogin"
            class="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all"
          >
            Continue to Login
          </button>
        </div>

        <!-- Password Reset Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- New Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-dark-300 mb-2">
              New Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="6"
                class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors pr-12"
                placeholder="Enter your new password"
                :disabled="loading"
                autofocus
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-3 text-dark-400 hover:text-white transition-colors"
                :disabled="loading"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                </svg>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-dark-400">Minimum 6 characters</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-dark-300 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              :class="{ 'border-red-500 focus:ring-red-500': passwordMismatch }"
              placeholder="Confirm your new password"
              :disabled="loading"
            />
            <p v-if="passwordMismatch" class="mt-1 text-xs text-red-400">Passwords do not match</p>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="password" class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-dark-400">Password strength:</span>
              <span :class="passwordStrengthColor">{{ passwordStrengthText }}</span>
            </div>
            <div class="w-full bg-dark-700 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="passwordStrengthColor"
                :style="{ width: passwordStrengthWidth }"
              ></div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p class="text-sm text-red-400">{{ error }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating password...
            </span>
            <span v-else>Update Password</span>
          </button>
        </form>

        <!-- Back to Login -->
        <div v-if="!passwordUpdated && !invalidToken" class="mt-6 text-center">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

// Form state
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const invalidToken = ref(false)
const passwordUpdated = ref(false)

// Computed
const passwordMismatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value
})

const isFormValid = computed(() => {
  return password.value &&
         confirmPassword.value &&
         password.value === confirmPassword.value &&
         password.value.length >= 6
})

const passwordStrength = computed(() => {
  if (!password.value) return 0

  let score = 0
  if (password.value.length >= 8) score++
  if (/[A-Z]/.test(password.value)) score++
  if (/[a-z]/.test(password.value)) score++
  if (/[0-9]/.test(password.value)) score++
  if (/[^A-Za-z0-9]/.test(password.value)) score++

  return score
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'Weak'
  if (strength <= 2) return 'Fair'
  if (strength <= 3) return 'Good'
  if (strength <= 4) return 'Strong'
  return 'Very Strong'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'bg-red-500 text-red-400'
  if (strength <= 2) return 'bg-yellow-500 text-yellow-400'
  if (strength <= 3) return 'bg-blue-500 text-blue-400'
  if (strength <= 4) return 'bg-green-500 text-green-400'
  return 'bg-green-600 text-green-300'
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 5) * 100}%`
})

// Methods
const handleSubmit = async () => {
  if (passwordMismatch.value) {
    error.value = 'Passwords do not match'
    return
  }

  try {
    loading.value = true
    error.value = ''

    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value
    })

    if (updateError) throw updateError

    passwordUpdated.value = true
  } catch (err) {
    error.value = err.message || 'An error occurred while updating your password'
  } finally {
    loading.value = false
  }
}

const redirectToLogin = () => {
  router.push('/auth/login')
}

// Check for valid session and handle auth callback
onMounted(async () => {
  try {
    // Check if we have an access token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (type === 'recovery' && accessToken) {
      // Set the session with the tokens from the URL
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (error) {
        console.error('Session error:', error)
        invalidToken.value = true
      }
    } else {
      // Check if we have a valid session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        invalidToken.value = true
      }
    }
  } catch (err) {
    console.error('Reset password initialization error:', err)
    invalidToken.value = true
  }
})
</script>
