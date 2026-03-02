<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  data: { type: Object, required: true },
});

const parallaxY = ref(0);
let ticking = false;
let reducedMotion = false;

function onScroll() {
  if (reducedMotion) return;
  if (!ticking) {
    requestAnimationFrame(() => {
      parallaxY.value = window.scrollY * 0.15;
      ticking = false;
    });
    ticking = true;
  }
}

onMounted(() => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) window.addEventListener("scroll", onScroll, { passive: true });
});
onUnmounted(() => window.removeEventListener("scroll", onScroll));

function scrollToContact() {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}

const iconPaths = {
  spotify: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.81-.87 7.077-.496 9.713 1.115a.623.623 0 01.206.857zm1.225-2.72a.78.78 0 01-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 01-.453-1.494c3.629-1.102 8.14-.568 11.233 1.329a.78.78 0 01.257 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 01-.543-1.79c3.533-1.073 9.405-.865 13.115 1.338a.935.935 0 01-1.053 1.545z",
  "apple-music": "M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.345 10.308 10.308 0 0017.564.1c-.574-.05-.96-.05-1.517-.05H7.95c-.556 0-.94 0-1.517.05C5.56.164 4.756.291 4.003.633 3.063 1.054 2.32 1.768 1.82 2.62c-.387.65-.585 1.37-.67 2.135-.066.583-.095.959-.108 1.522v11.416c.013.563.042.939.108 1.522.085.765.283 1.485.67 2.135.5.852 1.243 1.566 2.183 1.987.753.342 1.557.469 2.432.533.574.05.96.05 1.517.05h8.095c.557 0 .943 0 1.517-.05.875-.064 1.679-.191 2.432-.533.94-.421 1.683-1.135 2.183-1.987.387-.65.585-1.37.67-2.135.066-.583.095-.959.108-1.522V7.646c-.013-.563-.042-.939-.108-1.522zM17.19 14.342c0 .434-.04.67-.059.79-.13.837-.627 1.54-1.373 1.953a2.763 2.763 0 01-1.809.306c-.562-.108-1.06-.425-1.362-.868-.285-.42-.38-.94-.271-1.463.197-.934 1.033-1.619 2.03-1.74.436-.053.883-.108 1.307-.262V9.9L11.8 10.875v4.32c0 .434-.04.67-.059.79-.13.837-.627 1.54-1.373 1.953a2.763 2.763 0 01-1.809.306c-.562-.108-1.06-.425-1.362-.868-.285-.42-.38-.94-.271-1.463.197-.934 1.033-1.619 2.03-1.74.436-.053.883-.108 1.307-.262V7.508c0-.42.15-.8.42-1.073.305-.308.735-.462 1.075-.37l4.97 1.14c.507.117.832.561.832 1.107l-.37 5.99z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  tiktok: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.3 0 .59.05.86.12V9.02a6.33 6.33 0 00-.86-.06 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.98a8.21 8.21 0 004.76 1.52V7.05a4.84 4.84 0 01-1-.36z",
};
</script>

<template>
  <section class="hero" aria-label="Hero">
    <div class="hero__bg" :style="{ transform: `translateY(${parallaxY}px) scale(1.1)` }">
      <img :src="data.hero.image" :alt="data.hero.alt" class="hero__bg-img" fetchpriority="high" />
    </div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <div class="hero__logo-wrap">
        <img :src="data.logo" :alt="data.name" class="hero__logo" />
      </div>
      <div class="hero__bottom">
        <p class="hero__tagline">{{ data.tagline }}</p>
        <div class="hero__ctas">
          <a :href="data.links.listen" target="_blank" rel="noopener noreferrer" class="hero__btn hero__btn--primary">
            <svg style="width:1rem;height:1rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            Listen
          </a>
          <button @click="scrollToContact" class="hero__btn hero__btn--outline">Contact</button>
        </div>
        <nav class="hero__socials" aria-label="Social links">
          <a v-for="s in data.socials" :key="s.platform" :href="s.url" target="_blank" rel="noopener noreferrer" :aria-label="s.label" class="hero__social">
            <svg style="width:1.25rem;height:1.25rem" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="iconPaths[s.platform]"/></svg>
            <span class="hero__social-tip">{{ s.label }}</span>
          </a>
        </nav>
      </div>
    </div>
    <div class="hero__scroll">
      <svg style="width:1.25rem;height:1.25rem;color:var(--os-text)" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.hero { position: relative; min-height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
.hero__bg { position: absolute; inset: 0; will-change: transform; }
.hero__bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center 72%; }
.hero__overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(12,11,10,.45) 0%, rgba(12,11,10,.08) 28%, rgba(12,11,10,.03) 45%, rgba(12,11,10,.55) 72%, rgba(12,11,10,.95) 90%, rgba(12,11,10,1) 100%); }
.hero__content { position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: space-between; min-height: 100vh; padding: 0 1.25rem; }
@media (min-width: 768px) { .hero__content { padding: 0 2rem; } }
.hero__logo-wrap { padding-top: 2.5rem; display: flex; justify-content: center; }
@media (min-width: 768px) { .hero__logo-wrap { padding-top: 3.5rem; } }
.hero__logo { height: 1.25rem; width: auto; filter: brightness(0) invert(1); opacity: .9; }
@media (min-width: 640px) { .hero__logo { height: 1.5rem; } }
@media (min-width: 768px) { .hero__logo { height: 2rem; } }
@media (min-width: 1024px) { .hero__logo { height: 2.5rem; } }
.hero__bottom { padding-bottom: 3.5rem; max-width: 36rem; }
@media (min-width: 768px) { .hero__bottom { padding-bottom: 4rem; } }
.hero__tagline { font-size: 1rem; color: var(--os-text); opacity: .85; margin: 0 0 2rem; line-height: 1.65; }
@media (min-width: 640px) { .hero__tagline { font-size: 1.125rem; } }
@media (min-width: 768px) { .hero__tagline { font-size: 1.25rem; } }
.hero__ctas { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 2.5rem; }
.hero__btn { display: inline-flex; align-items: center; gap: .5rem; padding: .75rem 1.5rem; border-radius: .5rem; font-size: .875rem; font-weight: 500; cursor: pointer; transition: all .2s; border: none; font-family: inherit; }
.hero__btn:hover { transform: scale(1.02); }
.hero__btn:active { transform: scale(.98); }
.hero__btn--primary { background: var(--os-accent); color: #fff; }
.hero__btn--primary:hover { background: var(--os-accent-hover); }
.hero__btn--outline { background: transparent; color: var(--os-text); border: 1px solid rgba(255,255,255,.2); }
.hero__btn--outline:hover { border-color: rgba(255,255,255,.4); background: rgba(255,255,255,.05); }
.hero__socials { display: flex; gap: 1rem; }
.hero__social { position: relative; color: rgba(255,255,255,.35); transition: color .2s; }
.hero__social:hover { color: var(--os-accent); }
.hero__social-tip { position: absolute; top: -2rem; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--os-secondary); opacity: 0; transition: opacity .2s; white-space: nowrap; pointer-events: none; }
.hero__social:hover .hero__social-tip { opacity: 1; }
.hero__scroll { position: absolute; bottom: 1.25rem; left: 50%; transform: translateX(-50%); z-index: 10; opacity: .25; animation: os-bounce 1s infinite; }
@media (prefers-reduced-motion: reduce) { .hero__scroll { animation: none; } }
</style>
