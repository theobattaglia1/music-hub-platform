<script setup>
import { ref } from "vue";
import { useReveal } from "./useReveal";

const props = defineProps({
  bio: { type: Object, required: true },
  highlights: { type: Array, default: () => [] },
  illustration: { type: String, default: null },
});

const sectionRef = ref(null);
useReveal(sectionRef);
</script>

<template>
  <section ref="sectionRef" id="about" class="os-section">
    <div class="bio-wrap">
      <h2 class="bio-heading os-reveal">About</h2>

      <div class="bio-layout">
        <div>
          <!-- Bio blocks -->
          <div class="bio-cards">
            <div v-for="(block, i) in bio.blocks" :key="block.heading" class="bio-card os-reveal" :style="{ transitionDelay: `${(i+1)*80}ms` }">
              <h3 class="bio-card__heading">{{ block.heading }}</h3>
              <p class="bio-card__text">{{ block.text }}</p>
            </div>
          </div>

          <!-- Highlights -->
          <div v-if="highlights.length" class="bio-highlights os-reveal" style="transition-delay:320ms">
            <h3 class="bio-highlights__label">At a Glance</h3>
            <ul class="bio-highlights__list">
              <li v-for="item in highlights" :key="item" class="bio-highlights__item">
                <span class="bio-highlights__dot" aria-hidden="true"></span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Illustration (large screens) -->
        <div v-if="illustration" class="bio-illustration">
          <img :src="illustration" alt="" aria-hidden="true" loading="lazy" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bio-wrap { max-width: 64rem; margin: 0 auto; }
.bio-heading { font-size: 11px; text-transform: uppercase; letter-spacing: .2em; color: var(--os-muted); font-weight: 500; margin: 0 0 2.5rem; }
@media (min-width: 768px) { .bio-heading { margin-bottom: 3.5rem; } }

.bio-layout { display: block; }
@media (min-width: 1024px) { .bio-layout { display: grid; grid-template-columns: 1fr auto; gap: 4rem; } }

.bio-cards { display: grid; gap: 1rem; }
@media (min-width: 640px) { .bio-cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .bio-cards { grid-template-columns: repeat(3, 1fr); gap: 1.25rem; } }

.bio-card { background: var(--os-surface); border: 1px solid var(--os-border); border-radius: .75rem; padding: 1.5rem; }
@media (min-width: 768px) { .bio-card { padding: 1.75rem; } }
.bio-card__heading { font-size: 10px; text-transform: uppercase; letter-spacing: .25em; color: var(--os-accent); font-weight: 600; margin: 0 0 1rem; }
.bio-card__text { font-size: .875rem; color: var(--os-secondary); line-height: 1.65; margin: 0; }

.bio-highlights { margin-top: 2.5rem; }
@media (min-width: 768px) { .bio-highlights { margin-top: 3rem; } }
.bio-highlights__label { font-size: 10px; text-transform: uppercase; letter-spacing: .25em; color: var(--os-muted); font-weight: 500; margin: 0 0 1.25rem; }
.bio-highlights__list { list-style: none; padding: 0; margin: 0; display: grid; gap: .625rem; }
@media (min-width: 640px) { .bio-highlights__list { grid-template-columns: repeat(2, 1fr); column-gap: 2rem; } }
.bio-highlights__item { display: flex; align-items: flex-start; gap: .625rem; font-size: .875rem; color: var(--os-secondary); }
.bio-highlights__dot { width: 4px; height: 4px; border-radius: 50%; background: var(--os-accent); margin-top: 7px; flex-shrink: 0; }

.bio-illustration { display: none; }
@media (min-width: 1024px) {
  .bio-illustration { display: flex; align-items: flex-start; justify-content: center; padding-top: 1.5rem; }
  .bio-illustration img { width: 9rem; opacity: .12; filter: brightness(0) invert(1); user-select: none; pointer-events: none; }
}
@media (min-width: 1280px) { .bio-illustration img { width: 11rem; } }
</style>
