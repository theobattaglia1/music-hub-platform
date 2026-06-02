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

<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- Form state -->
      <template v-if="!emailSent">
        <div class="auth-header">
          <div class="auth-wordmark">MUSIC HUB</div>
          <h1 class="auth-title">Forgot Password</h1>
          <p class="auth-subtitle">Enter your email to receive a reset link</p>
        </div>

        <form class="auth-form" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field-label" for="email">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="field-input"
              :disabled="loading"
              placeholder="your@email.com"
              autofocus
              required
            />
            <p class="field-hint">We'll send a password reset link to this address</p>
          </div>

          <div v-if="error" class="form-alert form-alert--error">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="loading || !email"
          >
            <svg v-if="loading" class="spinner-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <div class="auth-footer">
          <router-link to="/auth/login" class="link-btn">← Back to sign in</router-link>
        </div>
      </template>

      <!-- Success state -->
      <template v-else>
        <div class="status-block">
          <div class="status-icon status-icon--success">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2>Check Your Email</h2>
          <p>We sent a reset link to</p>
          <p class="email-highlight">{{ email }}</p>

          <div class="info-box">
            <p>Didn't receive it?</p>
            <ul>
              <li>Check your spam or junk folder</li>
              <li>Verify the email address is correct</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <div class="resend-actions">
            <button
              class="secondary-btn"
              @click="resendEmail"
              :disabled="resendLoading || resendCooldown > 0"
            >
              <template v-if="resendLoading">Sending...</template>
              <template v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</template>
              <template v-else>Resend Email</template>
            </button>

            <router-link to="/auth/login" class="link-btn">Back to sign in</router-link>
          </div>
        </div>
      </template>

    </div>

    <p class="auth-copyright">© {{ new Date().getFullYear() }} Music Hub Platform</p>
  </div>
</template>

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
  margin-top: var(--space-1);
}

.auth-header { display: flex; flex-direction: column; }

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field { display: flex; flex-direction: column; gap: var(--space-2); }

.field-label {
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.field-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
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

.field-input::placeholder { color: var(--color-text-tertiary); }
.field-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-subtle);
}
.field-input:disabled { opacity: 0.5; cursor: not-allowed; }

.password-field { position: relative; }
.password-field .field-input { padding-right: 40px; }
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
.password-toggle svg { width: 16px; height: 16px; }
.password-toggle:hover { color: var(--color-text); }

.form-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-small);
  line-height: 1.4;
}
.form-alert svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
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
  text-decoration: none;
  text-align: center;
}
.submit-btn:hover:not(:disabled) { background: #2C2B28; }
.submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.submit-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner-icon { width: 16px; height: 16px; animation: spin 0.8s linear infinite; }

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
.link-btn:hover { color: var(--color-accent-hover); text-decoration: underline; }

.auth-footer {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  text-align: center;
}
.auth-footer a { color: var(--color-accent); text-decoration: none; }
.auth-footer a:hover { text-decoration: underline; }

.auth-copyright {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
}

/* Status states */
.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4);
}
.status-icon--success { background: var(--color-success-subtle); color: var(--color-success); }
.status-icon--error { background: var(--color-danger-subtle); color: var(--color-danger); }
.status-icon svg { width: 24px; height: 24px; }

.status-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
}
.status-block h2 {
  font-size: var(--text-subheading);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0;
}
.status-block p {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Password strength */
.strength-bar-wrap {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: var(--space-2);
}
.strength-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

/* Resend info box */
.info-box {
  background: var(--color-surface-raised, #FAFAF8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-small);
  color: var(--color-text-secondary);
}
.info-box p { margin: 0 0 var(--space-2); font-weight: var(--weight-medium); color: var(--color-text); }
.info-box ul { margin: 0; padding-left: var(--space-4); }
.info-box li { margin-bottom: var(--space-1); }

.resend-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.secondary-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-small);
  color: var(--color-text);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: background var(--motion-fast);
}
.secondary-btn:hover:not(:disabled) { background: var(--color-surface-raised, #FAFAF8); }
.secondary-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.email-highlight {
  font-weight: var(--weight-medium);
  color: var(--color-text);
}
</style>
