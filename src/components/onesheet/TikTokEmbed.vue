<script setup>
import { ref, onMounted } from "vue";
import { useReveal } from "./useReveal";

const props = defineProps({
  tiktok: { type: Object, required: true },
});

const sectionRef = ref(null);
const showEmbed = ref(false);
useReveal(sectionRef);

onMounted(() => {
  if (!sectionRef.value) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        showEmbed.value = true;
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "300px" },
  );
  observer.observe(sectionRef.value);
});
</script>

<template>
  <section ref="sectionRef" id="featured-video" class="os-section">
    <div class="tt-wrap">
      <h2 class="tt-heading os-reveal">Featured</h2>
      <div class="tt-player os-reveal" style="transition-delay:100ms">
        <div class="tt-frame">
          <iframe v-if="showEmbed" :src="`https://www.tiktok.com/embed/v2/${tiktok.videoId}`" class="tt-iframe" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen :title="`TikTok video by @${tiktok.username}`"></iframe>
          <div v-else class="tt-loading">
            <div class="tt-spinner"></div>
          </div>
        </div>
        <p class="tt-caption">
          <a :href="`https://www.tiktok.com/@${tiktok.username}`" target="_blank" rel="noopener noreferrer" class="tt-link">@{{ tiktok.username }}</a>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tt-wrap { max-width: 64rem; margin: 0 auto; }
.tt-heading { font-size: 11px; text-transform: uppercase; letter-spacing: .2em; color: var(--os-muted); font-weight: 500; margin: 0 0 2.5rem; }
@media (min-width: 768px) { .tt-heading { margin-bottom: 3.5rem; } }

.tt-player { max-width: 360px; margin: 0 auto; }
.tt-frame { position: relative; background: var(--os-surface); border-radius: 1rem; overflow: hidden; border: 1px solid var(--os-border); aspect-ratio: 9/16; max-height: 680px; }
.tt-iframe { position: absolute; inset: 0; width: 100%; height: 100%; }
.tt-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.tt-spinner { width: 2rem; height: 2rem; border: 2px solid var(--os-border); border-top-color: var(--os-accent); border-radius: 50%; animation: os-spin .8s linear infinite; }
.tt-caption { text-align: center; margin: 1rem 0 0; }
.tt-link { font-size: .75rem; color: var(--os-muted); transition: color .2s; }
.tt-link:hover { color: var(--os-accent); }
</style>
