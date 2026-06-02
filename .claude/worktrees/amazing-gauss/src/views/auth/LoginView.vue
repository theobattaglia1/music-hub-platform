<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-wordmark">Music Hub</div>
        <h1 class="auth-title">Sign in</h1>
        <p class="auth-subtitle">Access your creative workspace</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <div class="field">
          <label class="field-label" for="login-email">Email</label>
          <input
            id="login-email"
            class="field-input"
            type="email"
            v-model="email"
            :disabled="loading"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field" v-if="!useMagicLink">
          <label class="field-label" for="login-password">Password</label>
          <div class="password-field">
            <input
              id="login-password"
              class="field-input"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              :disabled="loading"
              placeholder="Your password"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-options">
          <button
            type="button"
            class="link-btn"
            @click="useMagicLink = !useMagicLink"
          >
            {{ useMagicLink ? 'Use password instead' : 'Use magic link instead' }}
          </button>
          <router-link
            v-if="!useMagicLink"
            to="/auth/forgot-password"
            class="link-btn"
          >
            Forgot password?
          </router-link>
        </div>

        <div class="form-alert form-alert--error" v-if="error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <div class="form-alert form-alert--success" v-if="success" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>{{ success }}</span>
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="loading || !email || (!useMagicLink && !password)"
        >
          <svg v-if="loading" class="spinner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span>{{ loading ? 'Signing in...' : useMagicLink ? 'Send magic link' : 'Sign in' }}</span>
        </button>
      </form>

      <p class="auth-footer">
        No account?
        <router-link to="/auth/signup" class="link-btn">Create one</router-link>
      </p>

      <p class="auth-copyright">© 2026 Music Hub Platform</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const email = ref('')
const password = ref('')
const useMagicLink = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

// Methods
const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = ''

    if (useMagicLink.value) {
      await authStore.signInWithMagicLink(email.value)
      success.value = 'Magic link sent! Check your email and click the link to sign in.'
    } else {
      await authStore.signInWithPassword(email.value, password.value)
      router.push('/dashboard')
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during sign in'
  } finally {
    loading.value = false
  }
}

// Check if already authenticated or redirect immediately in mock mode
onMounted(async () => {
  console.log('🎭 MOCK MODE: LoginView mounted, redirecting to dashboard')
  
  // In mock mode, immediately redirect to dashboard
  // This ensures the auth store is initialized with the mock user
  await authStore.initialize()
  router.push('/dashboard')
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: var(--space-6);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.auth-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.auth-wordmark {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.auth-title {
  font-size: var(--text-heading);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
  margin: 0;
}

.auth-subtitle {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.field-input {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-small);
  font-family: var(--font-sans);
  transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
  box-sizing: border-box;
}

.field-input::placeholder {
  color: var(--color-text-tertiary);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-subtle);
}

.field-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-field {
  position: relative;
}

.password-field .field-input {
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.password-toggle svg {
  width: 16px;
  height: 16px;
}

.password-toggle:hover {
  color: var(--color-text);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.link-btn {
  font-size: var(--text-small);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  font-family: var(--font-sans);
}

.link-btn:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.form-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-small);
  line-height: 1.4;
}

.form-alert svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.form-alert--error {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  border: 1px solid rgba(192, 57, 43, 0.2);
}

.form-alert--success {
  background: var(--color-success-subtle);
  color: var(--color-success);
  border: 1px solid rgba(26, 122, 74, 0.2);
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast);
}

.submit-btn:hover:not(:disabled) {
  background: #2C2B28;
}

.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.submit-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-icon {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

.auth-footer {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  text-align: center;
}

.auth-copyright {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
}
</style>
