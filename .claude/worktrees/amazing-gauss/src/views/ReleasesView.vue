<template>
  <div class="releases-view">

    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="view-title">Releases</h1>
        <p class="view-sub">Albums, EPs, and singles across your roster</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          New Release
        </button>
      </div>
    </div>

    <!-- Placeholder body -->
    <div class="placeholder-body">
      <div class="placeholder-state">

        <div class="ph-icon-ring">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
          </svg>
        </div>

        <h2 class="ph-title">Releases coming soon</h2>
        <p class="ph-desc">Plan and track albums, EPs, and singles — from recording through delivery to DSPs.</p>

        <!-- Ghost list rows -->
        <div class="ph-list">
          <div class="ph-row" v-for="(item, i) in ghostReleases" :key="i">
            <div class="ph-artwork"></div>
            <div class="ph-row-info">
              <div class="ph-line" :style="{ width: item.titleW }"></div>
              <div class="ph-line thin" :style="{ width: item.subW }"></div>
            </div>
            <div class="ph-badge" :style="{ background: item.badgeColor }"></div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
const ghostReleases = [
  { titleW: '55%', subW: '40%', badgeColor: 'rgba(200,75,17,0.15)' },
  { titleW: '70%', subW: '50%', badgeColor: 'rgba(26,122,74,0.15)' },
  { titleW: '45%', subW: '60%', badgeColor: 'rgba(184,105,26,0.15)' },
  { titleW: '62%', subW: '38%', badgeColor: 'rgba(107,103,98,0.1)' },
]
</script>

<style scoped>
.releases-view {
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

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px var(--space-4);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-small);
  font-weight: var(--weight-semibold);
  cursor: not-allowed;
  opacity: 0.45;
}

.btn-primary svg {
  width: 15px;
  height: 15px;
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
  max-width: 480px;
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

/* ── Ghost list ──────────────────────────────────────── */
.ph-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.ph-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  opacity: 0.55;
}

.ph-artwork {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  flex-shrink: 0;
}

.ph-row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.ph-line {
  height: 10px;
  border-radius: 5px;
  background: var(--color-border);
}

.ph-line.thin {
  height: 8px;
}

.ph-badge {
  width: 52px;
  height: 20px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
</style>
