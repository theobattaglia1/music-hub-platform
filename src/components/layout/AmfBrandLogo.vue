<template>
  <div class="amf-brand" :class="`amf-brand--${variant}`" aria-label="All My Friends">
    <div class="amf-brand__inner" aria-hidden="true">
      <div class="amf-brand__bars">
        <div class="amf-brand__a">
          <span>A</span>
        </div>
        <div class="amf-brand__bar amf-brand__bar--m">
          <span class="amf-brand__letter">M</span>
        </div>
        <div class="amf-brand__bar amf-brand__bar--f">
          <span class="amf-brand__letter">F</span>
        </div>
      </div>
      <div class="amf-brand__wordmark">ALL MY FRIENDS</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: "sidebar",
    validator: (value) => ["sidebar", "mobile"].includes(value),
  },
});
</script>

<style scoped>
.amf-brand {
  display: inline-flex;
  width: 100%;
  min-width: 0;
  color: #11100f;
  --brand-bar-size: 28px;
  --brand-gap: 4px;
  --brand-a-size: 28px;
  --brand-m-height: 72px;
  --brand-f-height: 112px;
  --brand-bars-height: 116px;
  --brand-word-size: 14px;
  --brand-word-spacing: -0.01em;
  --brand-border: rgba(201, 192, 181, 0.9);
  --brand-surface: #fbfbf9;
  --brand-knob: #11100f;
}

.amf-brand--sidebar {
  max-width: 100%;
}

.amf-brand--mobile {
  width: 86px;
  --brand-bar-size: 18px;
  --brand-gap: 3px;
  --brand-a-size: 18px;
  --brand-m-height: 45px;
  --brand-f-height: 64px;
  --brand-bars-height: 66px;
  --brand-border: rgba(188, 179, 166, 0.86);
}

.amf-brand__inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  user-select: none;
}

.amf-brand__bars {
  width: 100%;
  min-height: var(--brand-bars-height);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--brand-gap);
}

.amf-brand__a {
  width: var(--brand-a-size);
  height: var(--brand-a-size);
  border-radius: 999px;
  border: 2px solid var(--brand-border);
  background: var(--brand-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--brand-a-size) * 0.52);
  font-weight: 700;
  animation: amf-rotate 6s linear infinite;
}

.amf-brand__bar {
  width: var(--brand-bar-size);
  border-radius: 999px;
  border: 2px solid var(--brand-border);
  background: var(--brand-surface);
  position: relative;
  overflow: hidden;
}

.amf-brand__bar--m {
  height: var(--brand-m-height);
}

.amf-brand__bar--f {
  height: var(--brand-f-height);
}

.amf-brand__letter {
  width: var(--brand-bar-size);
  height: var(--brand-bar-size);
  border-radius: 999px;
  background: var(--brand-knob);
  color: #fbfbf9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--brand-bar-size) * 0.56);
  font-weight: 700;
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%);
  line-height: 1;
}

.amf-brand__bar--m .amf-brand__letter {
  animation: amf-slide-m 6s ease-in-out infinite alternate;
}

.amf-brand__bar--f .amf-brand__letter {
  animation: amf-slide-f 6.5s ease-in-out infinite alternate;
}

.amf-brand__wordmark {
  font-size: var(--brand-word-size);
  line-height: 1;
  letter-spacing: var(--brand-word-spacing);
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.amf-brand--mobile .amf-brand__wordmark {
  display: none;
}

@keyframes amf-slide-m {
  0%,
  100% {
    bottom: -2px;
  }

  50% {
    bottom: calc(58% - var(--brand-bar-size) / 2);
  }
}

@keyframes amf-slide-f {
  0%,
  100% {
    bottom: calc(58% - var(--brand-bar-size) / 2);
  }

  50% {
    bottom: -2px;
  }
}

@keyframes amf-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
