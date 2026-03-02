import { onMounted } from "vue";

/**
 * Composable that observes elements with class "os-reveal" inside a container
 * and adds the "visible" class when they scroll into view.
 *
 * Respects prefers-reduced-motion by making elements visible immediately.
 *
 * Usage:
 *   const sectionRef = ref(null)
 *   useReveal(sectionRef)
 *   // In template: <section ref="sectionRef"><div class="os-reveal">...</div></section>
 */
export function useReveal(containerRef) {
  onMounted(() => {
    if (!containerRef?.value) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const reveals = containerRef.value.querySelectorAll(".os-reveal");

    if (prefersReducedMotion) {
      reveals.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    reveals.forEach((el) => observer.observe(el));
  });
}
