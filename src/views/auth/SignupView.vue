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
        <h1 class="text-3xl font-bold text-white mb-2">Join Music Hub</h1>
        <p class="text-dark-400">Create your account to start collaborating</p>
      </div>

      <!-- Signup Form -->
      <div class="bg-dark-900/50 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Full Name -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-dark-300 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              required
              class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Enter your full name"
              :disabled="loading"
            />
          </div>

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
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-dark-300 mb-2">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors pr-12"
                placeholder="Create a secure password"
                :disabled="loading"
                minlength="6"
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
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              :class="{ 'border-red-500 focus:ring-red-500': passwordMismatch }"
              placeholder="Confirm your password"
              :disabled="loading"
            />
            <p v-if="passwordMismatch" class="mt-1 text-xs text-red-400">Passwords do not match</p>
          </div>

          <!-- Role Selection -->
          <div>
            <label for="role" class="block text-sm font-medium text-dark-300 mb-2">
              What best describes you?
            </label>
            <select
              id="role"
              v-model="selectedRole"
              class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              :disabled="loading"
            >
              <option value="artist">Artist</option>
              <option value="manager">Manager</option>
              <option value="producer">Producer</option>
              <option value="label">Label Representative</option>
              <option value="collaborator">Collaborator</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Terms Agreement -->
          <div class="flex items-start space-x-3">
            <input
              id="agreeTerms"
              v-model="agreeTerms"
              type="checkbox"
              required
              class="mt-1 w-4 h-4 bg-dark-800 border border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
              :disabled="loading"
            />
            <label for="agreeTerms" class="text-sm text-dark-300">
              I agree to the <a href="#" class="text-primary-400 hover:text-primary-300 transition-colors">Terms of Service</a>
              and <a href="#" class="text-primary-400 hover:text-primary-300 transition-colors">Privacy Policy</a>
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p class="text-sm text-red-400">{{ error }}</p>
          </div>

          <!-- Success Message -->
          <div v-if="success" class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p class="text-sm text-green-400">{{ success }}</p>
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
              Creating your account...
            </span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-dark-400 text-sm">
            Already have an account?
            <router-link to="/auth/login" class="text-primary-400 hover:text-primary-300 transition-colors">
              Sign in
            </router-link>
          </p>
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
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const selectedRole = ref('artist')
const agreeTerms = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

// Computed
const passwordMismatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value
})

const isFormValid = computed(() => {
  return fullName.value &&
         email.value &&
         password.value &&
         confirmPassword.value &&
         password.value === confirmPassword.value &&
         password.value.length >= 6 &&
         agreeTerms.value
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
    success.value = ''

    const metadata = {
      full_name: fullName.value,
      role: selectedRole.value
    }

    const result = await authStore.signUp(email.value, password.value, metadata)

    if (result.success) {
      success.value = 'Account created! Please check your email to verify your account.'

      // Clear form
      fullName.value = ''
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      agreeTerms.value = false

      // Redirect to login after delay
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during signup'
  } finally {
    loading.value = false
  }
}

// Check if already authenticated
onMounted(async () => {
  console.log('🎭 MOCK MODE: SignupView mounted, redirecting to dashboard')
  
  // In mock mode, immediately redirect to dashboard
  await authStore.initialize()
  router.push('/dashboard')
})
</script>
