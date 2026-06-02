<template>
  <div class="login-view">
    <!-- Left panel: brand -->
    <div class="login-brand" aria-hidden="true">
      <div class="brand-grid"></div>
      <div class="brand-content">
        <div class="brand-wordmark">Music Hub</div>
        <div class="brand-tagline">Everything in one place.</div>
      </div>
    </div>

    <!-- Right panel: form -->
    <div class="login-form-panel">
      <div class="login-form-container">
        <!-- Wordmark (mobile) -->
        <div class="login-mobile-brand">
          <span class="brand-wordmark-sm">Music Hub</span>
        </div>

        <div class="login-header">
          <h1 class="login-title">Sign in</h1>
          <p class="login-subtitle">Access your creative workspace</p>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form" novalidate>
          <!-- Email -->
          <div class="field">
            <label for="email" class="field-label">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="field-input"
              placeholder="you@example.com"
              autocomplete="email"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div v-if="!useMagicLink" class="field">
            <label for="password" class="field-label">Password</label>
            <div class="password-field">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="field-input"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :disabled="loading"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Options row -->
          <div class="form-options">
            <button
              type="button"
              @click="useMagicLink = !useMagicLink"
              class="link-btn"
              :disabled="loading"
            >
              {{ useMagicLink ? 'Use password instead' : 'Use magic link' }}
            </button>
            <router-link
              v-if="!useMagicLink"
              to="/auth/forgot-password"
              class="link-btn"
            >
              Forgot password?
            </router-link>
          </div>

          <!-- Error -->
          <div v-if="error" class="form-alert form-alert--error" role="alert">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {{ error }}
          </div>

          <!-- Success -->
          <div v-if="success" class="form-alert form-alert--success" role="status">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {{ success }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading || !email || (!useMagicLink && !password)"
            class="submit-btn"
          >
            <svg v-if="loading" class="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            {{ loading
              ? (useMagicLink ? 'Sending…' : 'Signing in…')
              : (useMagicLink ? 'Send Magic Link' : 'Sign In') }}
          </button>
        </form>

        <!-- Sign-up link -->
        <p class="signup-prompt">
          No account?
          <router-link to="/auth/signup" class="link-btn">Create one</router-link>
        </p>

        <p class="login-footer">&copy; {{ new Date().getFullYear() }} Music Hub Platform</p>
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

const email = ref('')
const password = ref('')
const useMagicLink = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    success.value = ''
    if (useMagicLink.value) {
      await authStore.signInWithMagicLink(email.value)
      success.value = 'Magic link sent! Check your email to sign in.'
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

onMounted(() => {
  if (authStore.isAuthenticated) router.push('/dashboard')
})
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  width: 100%;
  display: flex;
  background: var(--color-bg);
}

/* ── Brand panel (left) ────────────────────────────────── */
.login-brand {
  display: none;
  position: relative;
  flex: 1;
  background: var(--color-text);
  overflow: hidden;
}

@media (min-width: 768px) {
  .login-brand { display: flex; }
}

/* Subtle grid pattern */
.brand-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--color-accent) 1px, transparent 1px),
                    linear-gradient(90deg, var(--color-accent) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.08;
}

.brand-content {
  position: relative;
  z-index: 1;
  padding: var(--space-10);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
}

.brand-wordmark {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-inverse);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.brand-tagline {
  font-size: var(--text-body);
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.02em;
}

/* ── Form panel (right) ────────────────────────────────── */
.login-form-panel {
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
}

@media (max-width: 767px) {
  .login-form-panel {
    max-width: 100%;
    border-left: none;
  }
}

.login-form-container {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Mobile brand */
.login-mobile-brand {
  display: none;
}

@media (max-width: 767px) {
  .login-mobile-brand { display: block; }
}

.brand-wordmark-sm {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

/* ── Header ────────────────────────────────────────────── */
.login-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.login-title {
  font-size: var(--text-heading);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
  margin: 0;
}

.login-subtitle {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Form ──────────────────────────────────────────────── */
.login-form {
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
  padding: var(--space-3) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-small);
  font-family: var(--font-sans);
  transition: border-color var(--motion-fast), box-shadow var(--motion-fast);
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
  background: var(--color-surface-raised);
}

/* Password with toggle */
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
  transition: color var(--motion-fast);
}

.password-toggle:hover {
  color: var(--color-text);
}

.password-toggle svg {
  width: 16px;
  height: 16px;
}

/* Options row */
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
  transition: color var(--motion-fast);
}

.link-btn:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

/* Alerts */
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
  border: 1px solid rgba(192,57,43,0.2);
}

.form-alert--success {
  background: var(--color-success-subtle);
  color: var(--color-success);
  border: 1px solid rgba(26,122,74,0.2);
}

/* Submit */
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
  letter-spacing: 0.01em;
}

.submit-btn:hover:not(:disabled) {
  background: #2C2B28;
}

.submit-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-icon {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

/* Bottom */
.signup-prompt {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}

.login-footer {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  margin: 0;
}
</style>
