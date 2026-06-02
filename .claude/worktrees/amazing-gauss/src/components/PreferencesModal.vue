<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="pref-modal" role="dialog" aria-modal="true" aria-label="Preferences">

      <!-- Header -->
      <div class="pref-header">
        <div>
          <h2 class="pref-title">Preferences</h2>
          <p class="pref-subtitle">Customize your Music Hub experience</p>
        </div>
        <button @click="$emit('close')" class="close-btn" aria-label="Close preferences">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body: tab nav + content -->
      <div class="pref-body">

        <!-- Tab nav (left rail) -->
        <nav class="pref-tab-nav" aria-label="Preferences sections">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="pref-tab-btn"
            :class="{ active: activeTab === tab.id }"
            :aria-current="activeTab === tab.id ? 'page' : undefined"
          >
            <svg :viewBox="tab.iconViewBox" fill="currentColor" aria-hidden="true">
              <path :d="tab.iconPath" />
            </svg>
            <span>{{ tab.name }}</span>
          </button>
        </nav>

        <!-- Tab content -->
        <div class="pref-tab-content">

          <!-- ── Appearance ─────────────────────────── -->
          <div v-if="activeTab === 'appearance'" class="pref-panel">

            <section class="pref-section">
              <h3 class="pref-section-title">Density</h3>
              <div class="density-toggle" role="group" aria-label="Density mode">
                <button
                  @click="setDensity('comfortable')"
                  class="density-btn"
                  :class="{ active: preferences.density === 'comfortable' }"
                >
                  <span class="density-icon comfortable-icon">
                    <span></span><span></span><span></span>
                  </span>
                  <span class="density-label">Comfortable</span>
                  <span class="density-desc">More breathing room</span>
                </button>
                <button
                  @click="setDensity('compact')"
                  class="density-btn"
                  :class="{ active: preferences.density === 'compact' }"
                >
                  <span class="density-icon compact-icon">
                    <span></span><span></span><span></span><span></span><span></span>
                  </span>
                  <span class="density-label">Compact</span>
                  <span class="density-desc">More information visible</span>
                </button>
              </div>
            </section>

            <hr class="pref-divider" />

            <section class="pref-section">
              <h3 class="pref-section-title">Accent Color</h3>
              <div class="setting-row">
                <label class="setting-label" for="accentColor">Accent Color</label>
                <div class="color-field">
                  <input
                    id="accentColorPicker"
                    v-model="preferences.accentColor"
                    type="color"
                    class="color-swatch"
                    @change="applyPreferences"
                  />
                  <input
                    id="accentColor"
                    v-model="preferences.accentColor"
                    type="text"
                    class="color-text-input"
                    placeholder="#C84B11"
                    @change="applyPreferences"
                  />
                </div>
              </div>
            </section>

            <hr class="pref-divider" />

            <section class="pref-section">
              <h3 class="pref-section-title">Layout</h3>
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="setting-label">Hide Images</span>
                  <span class="setting-desc">Hide album artwork and artist images</span>
                </div>
                <button
                  @click="preferences.hideImages = !preferences.hideImages; applyPreferences()"
                  class="toggle-switch"
                  :class="{ on: preferences.hideImages }"
                  role="switch"
                  :aria-checked="preferences.hideImages"
                ></button>
              </div>
            </section>
          </div>

          <!-- ── Audio ─────────────────────────────── -->
          <div v-if="activeTab === 'audio'" class="pref-panel">

            <section class="pref-section">
              <h3 class="pref-section-title">Playback</h3>

              <div class="setting-row">
                <label class="setting-label" for="defaultVolume">Default Volume</label>
                <div class="slider-field">
                  <input
                    id="defaultVolume"
                    v-model="preferences.defaultVolume"
                    type="range"
                    min="0"
                    max="100"
                    class="slider"
                  />
                  <span class="slider-value">{{ preferences.defaultVolume }}%</span>
                </div>
              </div>

              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="setting-label">Auto-play next track</span>
                </div>
                <button
                  @click="preferences.autoPlay = !preferences.autoPlay"
                  class="toggle-switch"
                  :class="{ on: preferences.autoPlay }"
                  role="switch"
                  :aria-checked="preferences.autoPlay"
                ></button>
              </div>

              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="setting-label">Crossfade between tracks</span>
                </div>
                <button
                  @click="preferences.crossfade = !preferences.crossfade"
                  class="toggle-switch"
                  :class="{ on: preferences.crossfade }"
                  role="switch"
                  :aria-checked="preferences.crossfade"
                ></button>
              </div>
            </section>

            <hr class="pref-divider" />

            <section class="pref-section">
              <h3 class="pref-section-title">Quality</h3>
              <div class="setting-row">
                <label class="setting-label" for="audioQuality">Audio Quality</label>
                <select id="audioQuality" v-model="preferences.audioQuality" class="pref-select">
                  <option value="low">Low (96 kbps)</option>
                  <option value="normal">Normal (160 kbps)</option>
                  <option value="high">High (320 kbps)</option>
                  <option value="lossless">Lossless</option>
                </select>
              </div>
            </section>
          </div>

          <!-- ── Privacy ────────────────────────────── -->
          <div v-if="activeTab === 'privacy'" class="pref-panel">

            <section class="pref-section">
              <h3 class="pref-section-title">Activity</h3>

              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="setting-label">Show my activity to collaborators</span>
                  <span class="setting-desc">Let team members see when you're active</span>
                </div>
                <button
                  @click="preferences.showActivity = !preferences.showActivity"
                  class="toggle-switch"
                  :class="{ on: preferences.showActivity }"
                  role="switch"
                  :aria-checked="preferences.showActivity"
                ></button>
              </div>

              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="setting-label">Allow notifications</span>
                  <span class="setting-desc">Receive notifications for collaborations and updates</span>
                </div>
                <button
                  @click="preferences.allowNotifications = !preferences.allowNotifications"
                  class="toggle-switch"
                  :class="{ on: preferences.allowNotifications }"
                  role="switch"
                  :aria-checked="preferences.allowNotifications"
                ></button>
              </div>
            </section>

            <hr class="pref-divider" />

            <section class="pref-section">
              <h3 class="pref-section-title">Data</h3>
              <div class="data-actions">
                <div>
                  <button class="btn-secondary">Export My Data</button>
                  <p class="setting-desc" style="margin-top:var(--space-1)">Download a copy of your Music Hub data</p>
                </div>
                <div>
                  <button class="btn-secondary danger">Delete Account</button>
                  <p class="setting-desc" style="margin-top:var(--space-1)">Permanently delete your account and all data</p>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="pref-footer">
        <button @click="resetToDefaults" class="btn-ghost">Reset to Defaults</button>
        <div class="footer-actions">
          <button @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button @click="savePreferences" class="btn-primary">Save Changes</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const emit = defineEmits(['close'])

const activeTab = ref('appearance')

const tabs = [
  {
    id: 'appearance',
    name: 'Appearance',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2z'
  },
  {
    id: 'audio',
    name: 'Audio',
    iconViewBox: '0 0 24 24',
    iconPath: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'
  },
  {
    id: 'privacy',
    name: 'Privacy',
    iconViewBox: '0 0 24 24',
    iconPath: 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z'
  }
]

const defaultPreferences = {
  density: 'comfortable',
  accentColor: '#C84B11',
  hideImages: false,
  defaultVolume: 80,
  autoPlay: true,
  crossfade: false,
  audioQuality: 'high',
  showActivity: true,
  allowNotifications: true,
  // Legacy fields kept for compatibility
  headerFont: { family: "'SF Pro Display', -apple-system, sans-serif", size: '20px', weight: '600', lineHeight: '1.25' },
  bodyFont: { family: "'SF Pro Text', -apple-system, sans-serif", size: '14px', weight: '400', lineHeight: '1.5' },
  bgColor: '#F4F3F0',
  compactMode: false
}

const preferences = reactive({ ...defaultPreferences })

const setDensity = (mode) => {
  preferences.density = mode
  preferences.compactMode = mode === 'compact'
  // Apply immediately so user sees the effect in real time
  if (mode === 'compact') {
    document.documentElement.classList.add('compact')
  } else {
    document.documentElement.classList.remove('compact')
  }
}

const applyPreferences = () => {
  const root = document.documentElement
  root.style.setProperty('--color-accent', preferences.accentColor)
  root.style.setProperty('--color-accent-hover', shadeColor(preferences.accentColor, -15))
  root.style.setProperty('--hide-images', preferences.hideImages ? 'none' : '')
  // Density is applied via class (see setDensity)
}

// Naive hex shade helper
const shadeColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`
}

const savePreferences = () => {
  localStorage.setItem('musicHubPreferences', JSON.stringify(preferences))
  localStorage.setItem('mhDensity', preferences.density)
  applyPreferences()
  emit('close')
}

const resetToDefaults = () => {
  Object.assign(preferences, defaultPreferences)
  setDensity('comfortable')
  applyPreferences()
}

const loadPreferences = () => {
  const saved = localStorage.getItem('musicHubPreferences')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(preferences, parsed)
    } catch (_) { /* ignore */ }
  }
  // Sync density from dedicated key
  const density = localStorage.getItem('mhDensity')
  if (density === 'compact' || density === 'comfortable') {
    preferences.density = density
    preferences.compactMode = density === 'compact'
  }
  applyPreferences()
}

onMounted(() => {
  loadPreferences()
})
</script>

<style scoped>
/* ── Modal shell ──────────────────────────────────────── */
.pref-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
  width: 100%;
  max-width: 780px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn var(--motion-default);
}

/* ── Header ───────────────────────────────────────────── */
.pref-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.pref-title {
  font-size: var(--text-heading);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.pref-subtitle {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0;
}

.close-btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--motion-fast);
}

.close-btn:hover {
  background: var(--color-surface-raised);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

/* ── Body ─────────────────────────────────────────────── */
.pref-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ── Tab nav ──────────────────────────────────────────── */
.pref-tab-nav {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  padding: var(--space-3) 0;
  overflow-y: auto;
}

.pref-tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-5);
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  text-align: left;
  transition: all var(--motion-fast);
}

.pref-tab-btn:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--color-text);
}

.pref-tab-btn.active {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-left-color: var(--color-accent);
  font-weight: var(--weight-semibold);
}

.pref-tab-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ── Tab content ──────────────────────────────────────── */
.pref-tab-content {
  flex: 1;
  overflow-y: auto;
}

.pref-panel {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ── Sections ─────────────────────────────────────────── */
.pref-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pref-section-title {
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin: 0;
}

.pref-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0;
}

/* ── Density toggle ───────────────────────────────────── */
.density-toggle {
  display: flex;
  gap: var(--space-3);
}

.density-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-surface-raised);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--motion-fast);
  font-family: var(--font-sans);
}

.density-btn:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface);
}

.density-btn.active {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.density-icon {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 36px;
}

.density-icon span {
  display: block;
  width: 100%;
  background: var(--color-border-strong);
  border-radius: 1px;
}

.density-btn.active .density-icon span {
  background: var(--color-accent);
}

.comfortable-icon span { height: 5px; }
.compact-icon span { height: 3px; }

.density-label {
  font-size: var(--text-small);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.density-desc {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  line-height: 1.3;
}

/* ── Setting rows ─────────────────────────────────────── */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.setting-label {
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.setting-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

/* ── Color field ──────────────────────────────────────── */
.color-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: none;
  padding: 0;
}

.color-text-input {
  width: 100px;
  padding: var(--space-1) var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-small);
  font-family: var(--font-mono);
}

.color-text-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-subtle);
}

/* ── Slider ───────────────────────────────────────────── */
.slider-field {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.slider {
  width: 160px;
  height: 4px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.slider-value {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
}

/* ── Toggle switch ────────────────────────────────────── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-switch {
  width: 40px;
  height: 24px;
  flex-shrink: 0;
  background: var(--color-border-strong);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: background var(--motion-fast);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: var(--color-surface);
  border-radius: 50%;
  transition: transform var(--motion-fast);
  box-shadow: var(--shadow-sm);
}

.toggle-switch.on {
  background: var(--color-accent);
}

.toggle-switch.on::after {
  transform: translateX(16px);
}

/* ── Select ───────────────────────────────────────────── */
.pref-select {
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-small);
  font-family: var(--font-sans);
  min-width: 180px;
  cursor: pointer;
}

.pref-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-subtle);
}

/* ── Data actions ─────────────────────────────────────── */
.data-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ── Footer ───────────────────────────────────────────── */
.pref-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  gap: var(--space-3);
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 600px) {
  .pref-modal {
    max-width: 100%;
    max-height: 95vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    margin-bottom: 0;
  }

  .pref-body {
    flex-direction: column;
  }

  .pref-tab-nav {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: var(--space-2);
    gap: var(--space-1);
  }

  .pref-tab-btn {
    border-left: none;
    border-bottom: 2px solid transparent;
    padding: var(--space-2) var(--space-3);
    white-space: nowrap;
  }

  .pref-tab-btn.active {
    border-left-color: transparent;
    border-bottom-color: var(--color-accent);
  }

  .density-toggle {
    flex-direction: column;
  }
}
</style>
