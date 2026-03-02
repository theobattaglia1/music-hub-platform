<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import artistData from "@/content/silas-carpenter.js";
import OnesheetHero from "@/components/onesheet/OnesheetHero.vue";
import SwitcherPlayer from "@/components/onesheet/SwitcherPlayer.vue";
import BioBlocks from "@/components/onesheet/BioBlocks.vue";
import TikTokEmbed from "@/components/onesheet/TikTokEmbed.vue";
import ContactBlock from "@/components/onesheet/ContactBlock.vue";

const route = useRoute();
const token = computed(() => route.query.token);
const expectedToken = import.meta.env.VITE_SILAS_PAGE_TOKEN;

const isAuthorized = computed(() => {
  if (!expectedToken) return true;
  return token.value === expectedToken;
});

onMounted(() => {
  if (isAuthorized.value) {
    document.title = `${artistData.name} | EPK`;
  }
});
</script>

<template>
  <div v-if="isAuthorized" class="onesheet">
    <OnesheetHero :data="artistData" />
    <SwitcherPlayer
      :releases="artistData.releases"
      :links="artistData.links"
      :heroEmbed="artistData.heroEmbed"
    />
    <TikTokEmbed
      v-if="artistData.tiktok?.videoId"
      :tiktok="artistData.tiktok"
    />
    <BioBlocks
      :bio="artistData.bio"
      :highlights="artistData.highlights"
      :illustration="artistData.illustration"
    />
    <ContactBlock
      :contacts="artistData.contacts"
      :name="artistData.name"
    />
    <footer class="os-footer">
      <p class="os-footer__copy">
        &copy; {{ new Date().getFullYear() }} {{ artistData.name }}
      </p>
    </footer>
  </div>
  <div v-else class="onesheet os-not-found">
    <p>Page not found</p>
  </div>
</template>

<style>
/* ══════════════════════════════════════════════════════════
   ONE-SHEET STANDALONE STYLES
   ══════════════════════════════════════════════════════════ */
html:has(.onesheet) { scroll-behavior: smooth; overflow: auto !important; height: auto !important; }
html:has(.onesheet) body { margin: 0; padding: 0; display: block; overflow: auto !important; height: auto !important; }
html:has(.onesheet) #app { max-width: none; margin: 0; padding: 0; display: block; overflow: visible !important; height: auto !important; }
.onesheet *, .onesheet *::before, .onesheet *::after { box-sizing: border-box; }
.onesheet img { display: block; max-width: 100%; }

.onesheet {
  --os-bg: #0c0b0a;
  --os-surface: #141312;
  --os-elevated: #1c1b19;
  --os-border: #262422;
  --os-text: #f0ede7;
  --os-secondary: #9b958a;
  --os-muted: #5e5a54;
  --os-accent: #d4732b;
  --os-accent-hover: #e07f35;
  background-color: var(--os-bg);
  color: var(--os-text);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}
.onesheet a { color: inherit; text-decoration: none; background: none; padding: 0; }

.os-section { padding: 4rem 1.25rem; }
@media (min-width: 768px) { .os-section { padding: 6rem 2rem; } }

.os-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
.os-reveal.visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .os-reveal { opacity: 1; transform: none; transition: none; } }

.onesheet :focus-visible { outline: 2px solid var(--os-accent); outline-offset: 2px; border-radius: 4px; }

.os-footer { padding: 1rem 1.25rem 2.5rem; text-align: center; }
.os-footer__copy { color: var(--os-muted); font-size: 0.75rem; letter-spacing: 0.05em; margin: 0; }
.os-not-found { display: flex; align-items: center; justify-content: center; min-height: 100vh; color: var(--os-muted); font-size: 0.875rem; letter-spacing: 0.05em; }

@keyframes os-spin { to { transform: rotate(360deg); } }
@keyframes os-bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
</style>
