<script setup>
import { ref } from "vue";
import { useReveal } from "./useReveal";

const props = defineProps({
  releases: { type: Array, required: true },
  links: { type: Object, required: true },
  heroEmbed: { type: String, default: null },
});

const sectionRef = ref(null);
useReveal(sectionRef);
</script>

<template>
  <section ref="sectionRef" id="music" class="os-section">
    <div class="sp-wrap">
      <h2 class="sp-heading os-reveal">Music</h2>

      <!-- Main embed player (Untitled.stream) -->
      <div v-if="heroEmbed" class="sp-embed os-reveal" style="transition-delay:100ms">
        <div class="sp-embed__frame">
          <iframe :src="heroEmbed" width="100%" height="344" allowfullscreen allow="picture-in-picture" frameborder="0" loading="lazy" title="Music player" style="border-radius:16px"></iframe>
        </div>
      </div>

      <!-- Release gallery -->
      <div v-if="releases.length" class="sp-releases os-reveal" :style="{ transitionDelay: heroEmbed ? '200ms' : '100ms' }">
        <h3 class="sp-releases__label">Releases</h3>
        <div class="sp-releases__grid">
          <div v-for="release in releases" :key="release.title" class="sp-release">
            <div class="sp-release__art">
              <img :src="release.cover" :alt="release.title" loading="lazy" />
              <span v-if="release.featured" class="sp-release__badge">Latest</span>
            </div>
            <h4 class="sp-release__title">{{ release.title }}</h4>
            <p class="sp-release__meta">{{ release.year }}<span v-if="release.type"> &middot; {{ release.type }}</span></p>
          </div>
        </div>
      </div>

      <!-- Platform links -->
      <div class="sp-links os-reveal" :style="{ transitionDelay: heroEmbed ? '300ms' : '200ms' }">
        <a v-if="links.spotify" :href="links.spotify" target="_blank" rel="noopener noreferrer" class="sp-link">
          <svg style="width:1rem;height:1rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.81-.87 7.077-.496 9.713 1.115a.623.623 0 01.206.857zm1.225-2.72a.78.78 0 01-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 01-.453-1.494c3.629-1.102 8.14-.568 11.233 1.329a.78.78 0 01.257 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 01-.543-1.79c3.533-1.073 9.405-.865 13.115 1.338a.935.935 0 01-1.053 1.545z"/></svg>
          Open in Spotify
        </a>
        <a v-if="links.appleMusic" :href="links.appleMusic" target="_blank" rel="noopener noreferrer" class="sp-link">
          <svg style="width:1rem;height:1rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.345 10.308 10.308 0 0017.564.1c-.574-.05-.96-.05-1.517-.05H7.95c-.556 0-.94 0-1.517.05C5.56.164 4.756.291 4.003.633 3.063 1.054 2.32 1.768 1.82 2.62c-.387.65-.585 1.37-.67 2.135-.066.583-.095.959-.108 1.522v11.416c.013.563.042.939.108 1.522.085.765.283 1.485.67 2.135.5.852 1.243 1.566 2.183 1.987.753.342 1.557.469 2.432.533.574.05.96.05 1.517.05h8.095c.557 0 .943 0 1.517-.05.875-.064 1.679-.191 2.432-.533.94-.421 1.683-1.135 2.183-1.987.387-.65.585-1.37.67-2.135.066-.583.095-.959.108-1.522V7.646c-.013-.563-.042-.939-.108-1.522z"/></svg>
          Open in Apple Music
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sp-wrap { max-width: 64rem; margin: 0 auto; }
.sp-heading { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--os-muted); font-weight: 500; margin: 0 0 2.5rem; }
@media (min-width: 768px) { .sp-heading { margin-bottom: 3.5rem; } }

.sp-embed__frame { background: var(--os-surface); border-radius: 1rem; overflow: hidden; border: 1px solid var(--os-border); }

.sp-releases { margin-top: 2.5rem; }
@media (min-width: 768px) { .sp-releases { margin-top: 3.5rem; } }
.sp-releases__label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: var(--os-muted); font-weight: 500; margin: 0 0 1.5rem; }
.sp-releases__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
@media (min-width: 640px) { .sp-releases__grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; } }

.sp-release { cursor: default; }
.sp-release__art { position: relative; border-radius: .5rem; overflow: hidden; margin-bottom: .75rem; border: 1px solid var(--os-border); transition: border-color .3s; }
.sp-release:hover .sp-release__art { border-color: rgba(212,115,43,.4); }
.sp-release__art img { width: 100%; aspect-ratio: 1; object-fit: cover; transition: transform .5s; }
.sp-release:hover .sp-release__art img { transform: scale(1.03); }
.sp-release__badge { position: absolute; top: .5rem; right: .5rem; background: var(--os-accent); color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; padding: .15rem .5rem; border-radius: 9999px; }
.sp-release__title { font-size: .875rem; font-weight: 500; color: var(--os-text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-release__meta { font-size: .75rem; color: var(--os-muted); margin: .125rem 0 0; }

.sp-links { display: flex; gap: 1rem; margin-top: 2rem; }
.sp-link { display: inline-flex; align-items: center; gap: .375rem; font-size: .75rem; color: var(--os-muted); transition: color .2s; }
.sp-link:hover { color: var(--os-accent); }
</style>
