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
              d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2M9 19c0-1.1-.9-2-2-2s-2 .9-2 2M21 19c0 1.1-.9 2-2 2s-2-.9-2-2M21 19c0-1.1.9-2.1-2-2s-2 .9-2 2"
            />
          </svg>
        </div>
        <h1 class="auth-shell-title">Welcome to Music Hub</h1>
        <p class="auth-shell-subtitle">Sign in to access your creative workspace</p>
      </div>

      <div class="auth-shell-panel">
        <form @submit.prevent="handleSubmit" class="space-y-6">
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
            />
          </div>

          <div v-if="!useMagicLink">
            <label for="password" class="auth-label">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="auth-input auth-input--with-icon"
                placeholder="Enter your password"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="auth-icon-toggle"
                :disabled="loading"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="useMagicLink = !useMagicLink"
              class="auth-link text-sm"
              :disabled="loading"
            >
              {{ useMagicLink ? "Use password instead" : "Use magic link instead" }}
            </button>

            <router-link v-if="!useMagicLink" to="/auth/forgot-password" class="auth-link text-sm">
              Forgot password?
            </router-link>
          </div>

          <div v-if="error" class="auth-status auth-status--error">
            <p>{{ error }}</p>
          </div>

          <div v-if="success" class="auth-status auth-status--success">
            <p>{{ success }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading || !email || (!useMagicLink && !password)"
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
              {{ useMagicLink ? "Sending magic link..." : "Signing in..." }}
            </span>
            <span v-else>
              {{ useMagicLink ? "Send Magic Link" : "Sign In" }}
            </span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="auth-panel-copy text-sm">
            Don't have an account?
            <router-link to="/auth/signup" class="auth-link"> Sign up </router-link>
          </p>
        </div>
      </div>

      <div class="auth-shell-footer">
        <p>&copy; 2024 Music Hub Platform. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// Form state
const email = ref("");
const password = ref("");
const useMagicLink = ref(true);
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");

// Methods
const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = "";
    success.value = "";

    if (useMagicLink.value) {
      await authStore.signInWithMagicLink(email.value);
      success.value = "Magic link sent! Check your email and click the link to sign in.";
    } else {
      await authStore.signInWithPassword(email.value, password.value);
      router.push("/dashboard");
    }
  } catch (err) {
    error.value = err.message || "An error occurred during sign in";
  } finally {
    loading.value = false;
  }
};

// Check if already authenticated or redirect immediately in mock mode
onMounted(async () => {
  console.log("🎭 MOCK MODE: LoginView mounted, redirecting to dashboard");

  // In mock mode, immediately redirect to dashboard
  // This ensures the auth store is initialized with the mock user
  await authStore.initialize();
  router.push("/dashboard");
});
</script>
