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

<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- Invalid token state -->
      <div v-if="invalidToken" class="status-block">
        <div class="status-icon status-icon--error">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2>Invalid Reset Link</h2>
        <p>This reset link is invalid or has expired.</p>
        <router-link to="/auth/forgot-password" class="submit-btn">Request New Link</router-link>
        <router-link to="/auth/login" class="link-btn">Back to sign in</router-link>
      </div>

      <!-- Password updated state -->
      <div v-else-if="passwordUpdated" class="status-block">
        <div class="status-icon status-icon--success">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2>Password Updated</h2>
        <p>Your password has been updated successfully.</p>
        <button class="submit-btn" @click="redirectToLogin">Continue to Sign In</button>
      </div>

      <!-- Reset form -->
      <template v-else>
        <div class="auth-header">
          <div class="auth-wordmark">MUSIC HUB</div>
          <h1 class="auth-title">Set New Password</h1>
          <p class="auth-subtitle">Choose a strong password</p>
        </div>

        <form class="auth-form" @submit.prevent="handleSubmit">
          <!-- New Password -->
          <div class="field">
            <label class="field-label" for="password">New Password</label>
            <div class="password-field">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                :disabled="loading"
                required
                minlength="6"
                placeholder="Enter new password"
                autofocus
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <!-- Eye open -->
                <svg v-if="!showPassword" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye closed -->
                <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p class="field-hint">Minimum 6 characters</p>

            <!-- Password strength -->
            <div v-if="password" class="strength-indicator">
              <div class="strength-label">
                <span class="field-hint">Strength:</span>
                <span class="strength-text" :class="`strength-text--${passwordStrength <= 1 ? 'weak' : passwordStrength <= 2 ? 'fair' : 'strong'}`">
                  {{ passwordStrengthText }}
                </span>
              </div>
              <div class="strength-bar-wrap">
                <div
                  class="strength-bar"
                  :style="{
                    width: passwordStrengthWidth,
                    background: passwordStrength <= 1
                      ? 'var(--color-danger)'
                      : passwordStrength <= 2
                        ? '#B8691A'
                        : 'var(--color-success)'
                  }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="field">
            <label class="field-label" for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="field-input"
              :class="{ 'field-input--error': passwordMismatch }"
              :disabled="loading"
              placeholder="Confirm new password"
            />
            <p v-if="passwordMismatch" class="field-hint field-hint--error">Passwords do not match</p>
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
            :disabled="loading || !isFormValid"
          >
            <svg v-if="loading" class="spinner-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ loading ? 'Updating...' : 'Update Password' }}
          </button>
        </form>

        <div class="auth-footer">
          <router-link to="/auth/login" class="link-btn">← Back to sign in</router-link>
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

.field-hint--error { color: var(--color-danger); }

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

.field-input--error {
  border-color: var(--color-danger);
}
.field-input--error:focus {
  box-shadow: 0 0 0 2px rgba(192, 57, 43, 0.12);
}

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
.strength-indicator { margin-top: var(--space-2); }
.strength-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}
.strength-text {
  font-size: 11px;
  font-weight: var(--weight-medium);
}
.strength-text--weak { color: var(--color-danger); }
.strength-text--fair { color: #B8691A; }
.strength-text--strong { color: var(--color-success); }

.strength-bar-wrap {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
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
