<template>
  <div class="auth-shell">
    <div class="auth-shell-background">
      <div class="auth-shell-gradient"></div>
      <div class="auth-shell-grid"></div>
    </div>

    <div class="auth-shell-content">
      <div class="auth-shell-brand">
        <div class="auth-shell-logo">
          <svg
            class="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="32"
            height="32"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h1 class="auth-shell-title">Reset Password</h1>
        <p class="auth-shell-subtitle">Enter your email to receive a password reset link</p>
      </div>

      <div class="auth-shell-panel">
        <form v-if="!emailSent" @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="auth-label">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="auth-input"
              placeholder="your@email.com"
              :disabled="loading"
              autofocus
            />
            <p class="mt-2 text-sm auth-helper">
              We'll send a password reset link to this email address
            </p>
          </div>

          <div v-if="error" class="auth-status auth-status--error">
            <p>{{ error }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading || !email"
            class="auth-primary-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending reset link...
            </span>
            <span v-else>Send Reset Link</span>
          </button>
        </form>

        <div v-else class="text-center space-y-4">
          <div class="auth-icon-badge auth-icon-badge--success">
            <svg
              class="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="32"
              height="32"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 class="auth-state-title">Check Your Email</h2>

          <div class="auth-copy space-y-2">
            <p>We've sent a password reset link to:</p>
            <p class="auth-emphasis">{{ email }}</p>
          </div>

          <div class="auth-state-card text-sm">
            <p class="mb-2"><strong class="auth-emphasis">Didn't receive the email?</strong></p>
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
              class="auth-secondary-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="resendLoading">Sending...</span>
              <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
              <span v-else>Resend Email</span>
            </button>

            <router-link to="/auth/login" class="auth-link"> Back to Login </router-link>
          </div>
        </div>

        <div v-if="!emailSent" class="mt-6 text-center">
          <router-link to="/auth/login" class="auth-link text-sm"> ← Back to Login </router-link>
        </div>
      </div>

      <div class="auth-shell-footer">
        <p>&copy; 2024 Music Hub Platform. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// Form state
const email = ref("");
const loading = ref(false);
const error = ref("");
const emailSent = ref(false);
const resendLoading = ref(false);
const resendCooldown = ref(0);

let resendTimer = null;

// Methods
const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = "";

    await authStore.resetPassword(email.value);

    emailSent.value = true;
    startResendCooldown();
  } catch (err) {
    error.value = err.message || "An error occurred while sending the reset email";
  } finally {
    loading.value = false;
  }
};

const resendEmail = async () => {
  try {
    resendLoading.value = true;
    await authStore.resetPassword(email.value);
    startResendCooldown();
  } catch (err) {
    error.value = err.message || "Failed to resend email";
  } finally {
    resendLoading.value = false;
  }
};

const startResendCooldown = () => {
  resendCooldown.value = 60; // 60 second cooldown

  resendTimer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(resendTimer);
    }
  }, 1000);
};

// Check if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push("/dashboard");
  }
});

// Cleanup timer
onUnmounted(() => {
  if (resendTimer) {
    clearInterval(resendTimer);
  }
});
</script>
