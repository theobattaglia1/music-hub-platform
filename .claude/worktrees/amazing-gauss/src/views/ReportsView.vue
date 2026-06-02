<template>
  <div class="reports-view">

    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="view-title">Reports</h1>
        <p class="view-sub">Streaming analytics, revenue, and audience insights</p>
      </div>
    </div>

    <!-- Placeholder body -->
    <div class="placeholder-body">
      <div class="placeholder-state">

        <div class="ph-icon-ring">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 3H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </div>

        <h2 class="ph-title">Analytics coming soon</h2>
        <p class="ph-desc">Streaming stats, royalty tracking, and audience growth — aggregated across your entire roster.</p>

        <!-- Ghost bar chart -->
        <div class="ph-chart-wrap">
          <div class="ph-chart">
            <div
              class="ph-bar"
              v-for="(h, i) in barHeights"
              :key="i"
              :style="{ height: h + '%' }"
            ></div>
          </div>
          <div class="ph-chart-axis"></div>
          <div class="ph-chart-labels">
            <span v-for="label in monthLabels" :key="label" class="ph-label">{{ label }}</span>
          </div>
        </div>

        <!-- Ghost stat pills -->
        <div class="ph-stats">
          <div class="ph-stat" v-for="i in 3" :key="i">
            <div class="ph-stat-value"></div>
            <div class="ph-stat-label"></div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
const barHeights = [38, 55, 42, 72, 60, 85, 65, 90, 58, 78, 48, 95]
const monthLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
</script>

<style scoped>
.reports-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* ── Header ───────────────────────────────────────────── */
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-8);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.view-title {
  font-size: var(--text-heading);
  font-weight: var(--weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--space-1);
}

.view-sub {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Placeholder body ─────────────────────────────────── */
.placeholder-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
}

.placeholder-state {
  max-width: 520px;
  width: 100%;
  text-align: center;
}

.ph-icon-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4);
}

.ph-icon-ring svg {
  width: 28px;
  height: 28px;
  color: var(--color-text-tertiary);
}

.ph-title {
  font-size: var(--text-subheading);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0 0 var(--space-2);
}

.ph-desc {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  line-height: 1.65;
  margin: 0 0 var(--space-8);
}

/* ── Ghost chart ─────────────────────────────────────── */
.ph-chart-wrap {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-5) var(--space-3);
  opacity: 0.6;
  margin-bottom: var(--space-4);
}

.ph-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 80px;
}

.ph-bar {
  flex: 1;
  background: var(--color-border-strong);
  border-radius: 2px 2px 0 0;
  opacity: 0.5;
  transition: height 0.3s ease;
}

.ph-bar:nth-child(12) {
  background: var(--color-accent);
  opacity: 0.3;
}

.ph-chart-axis {
  height: 1px;
  background: var(--color-border);
  margin: 0;
}

.ph-chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-2);
}

.ph-label {
  font-size: 9px;
  color: var(--color-text-tertiary);
  flex: 1;
  text-align: center;
}

/* ── Ghost stat pills ────────────────────────────────── */
.ph-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.ph-stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  opacity: 0.5;
}

.ph-stat-value {
  height: 22px;
  width: 65%;
  background: var(--color-border);
  border-radius: 4px;
}

.ph-stat-label {
  height: 9px;
  width: 50%;
  background: var(--color-border);
  border-radius: 4px;
}
</style>
