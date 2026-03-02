<script setup>
import { ref } from "vue";
import { useReveal } from "./useReveal";

defineProps({
  contacts: { type: Array, required: true },
  name: { type: String, required: true },
});

const sectionRef = ref(null);
useReveal(sectionRef);
</script>

<template>
  <section ref="sectionRef" id="contact" class="os-section">
    <div class="ct-wrap">
      <h2 class="ct-heading os-reveal">Contact</h2>
      <div class="ct-grid os-reveal" :class="{ 'ct-grid--single': contacts.length <= 1 }" style="transition-delay:100ms">
        <a v-for="c in contacts" :key="c.label" :href="`mailto:${c.email}`" class="ct-card">
          <p class="ct-card__label">{{ c.label }}</p>
          <p class="ct-card__email">{{ c.email }}</p>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ct-wrap { max-width: 48rem; margin: 0 auto; text-align: center; }
.ct-heading { font-size: 11px; text-transform: uppercase; letter-spacing: .2em; color: var(--os-muted); font-weight: 500; margin: 0 0 2.5rem; }
@media (min-width: 768px) { .ct-heading { margin-bottom: 3.5rem; } }

.ct-grid { display: grid; gap: 1rem; }
@media (min-width: 640px) { .ct-grid { grid-template-columns: repeat(2, 1fr); } }
.ct-grid--single { max-width: 24rem; margin: 0 auto; }
.ct-grid--single { grid-template-columns: 1fr; }

.ct-card { display: block; background: var(--os-surface); border: 1px solid var(--os-border); border-radius: .75rem; padding: 1.5rem; transition: all .2s; text-align: center; }
@media (min-width: 768px) { .ct-card { padding: 1.75rem; } }
.ct-card:hover { border-color: rgba(212,115,43,.25); background: var(--os-elevated); }
.ct-card__label { font-size: 10px; text-transform: uppercase; letter-spacing: .25em; color: var(--os-muted); font-weight: 500; margin: 0 0 .5rem; }
.ct-card__email { font-size: .875rem; color: var(--os-secondary); margin: 0; transition: color .2s; }
.ct-card:hover .ct-card__email { color: var(--os-accent); }
</style>
