<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="modal-panel" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h2 class="modal-title">Preferences</h2>
          <p class="modal-subtitle">Customize your Music Hub experience</p>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Tab Navigation -->
        <div class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
          >
            <component :is="tab.icon" />
            <span>{{ tab.name }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Appearance Tab -->
          <div v-if="activeTab === 'appearance'" class="tab-panel">
            <div class="section">
              <h3 class="section-title">Typography</h3>
              <div class="setting-group">
                <div class="setting-item">
                  <label class="setting-label">Header Font Family</label>
                  <select v-model="preferences.headerFont.family" class="setting-input">
                    <option value="'SF Pro Display', -apple-system, sans-serif">SF Pro Display</option>
                    <option value="'Helvetica Neue', Arial, sans-serif">Helvetica Neue</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="setting-label">Header Font Size</label>
                  <input
                    v-model="preferences.headerFont.size"
                    type="text"
                    class="setting-input"
                    placeholder="24px"
                  />
                </div>

                <div class="setting-item">
                  <label class="setting-label">Body Font Family</label>
                  <select v-model="preferences.bodyFont.family" class="setting-input">
                    <option value="'SF Pro Text', -apple-system, sans-serif">SF Pro Text</option>
                    <option value="'Helvetica Neue', Arial, sans-serif">Helvetica Neue</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label class="setting-label">Body Font Size</label>
                  <input
                    v-model="preferences.bodyFont.size"
                    type="text"
                    class="setting-input"
                    placeholder="14px"
                  />
                </div>
              </div>
            </div>

            <div class="section">
              <h3 class="section-title">Colors</h3>
              <div class="setting-group">
                <div class="setting-item">
                  <label class="setting-label">Background Color</label>
                  <div class="color-input-group">
                    <input
                      v-model="preferences.bgColor"
                      type="color"
                      class="color-input"
                    />
                    <input
                      v-model="preferences.bgColor"
                      type="text"
                      class="setting-input"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div class="setting-item">
                  <label class="setting-label">Accent Color</label>
                  <div class="color-input-group">
                    <input
                      v-model="preferences.accentColor"
                      type="color"
                      class="color-input"
                    />
                    <input
                      v-model="preferences.accentColor"
                      type="text"
                      class="setting-input"
                      placeholder="#1db954"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <h3 class="section-title">Layout</h3>
              <div class="setting-group">
                <div class="setting-item checkbox-item">
                  <label class="checkbox-label">
                    <input
                      v-model="preferences.compactMode"
                      type="checkbox"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span>Compact Mode</span>
                  </label>
                  <p class="setting-description">Reduces spacing and padding throughout the interface</p>
                </div>

                <div class="setting-item checkbox-item">
                  <label class="checkbox-label">
                    <input
                      v-model="preferences.hideImages"
                      type="checkbox"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span>Hide Images</span>
                  </label>
                  <p class="setting-description">Hide album artwork and artist images</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Audio Tab -->
          <div v-if="activeTab === 'audio'" class="tab-panel">
            <div class="section">
              <h3 class="section-title">Playback</h3>
              <div class="setting-group">
                <div class="setting-item">
                  <label class="setting-label">Default Volume</label>
                  <div class="slider-group">
                    <input
                      v-model="preferences.defaultVolume"
                      type="range"
                      min="0"
                      max="100"
                      class="slider-input"
                    />
                    <span class="slider-value">{{ preferences.defaultVolume }}%</span>
                  </div>
                </div>

                <div class="setting-item checkbox-item">
                  <label class="checkbox-label">
                    <input
                      v-model="preferences.autoPlay"
                      type="checkbox"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span>Auto-play next track</span>
                  </label>
                </div>

                <div class="setting-item checkbox-item">
                  <label class="checkbox-label">
                    <input
                      v-model="preferences.crossfade"
                      type="checkbox"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span>Crossfade between tracks</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="section">
              <h3 class="section-title">Quality</h3>
              <div class="setting-group">
                <div class="setting-item">
                  <label class="setting-label">Audio Quality</label>
                  <select v-model="preferences.audioQuality" class="setting-input">
                    <option value="low">Low (96 kbps)</option>
                    <option value="normal">Normal (160 kbps)</option>
                    <option value="high">High (320 kbps)</option>
                    <option value="lossless">Lossless</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy Tab -->
          <div v-if="activeTab === 'privacy'" class="tab-panel">
            <div class="section">
              <h3 class="section-title">Activity</h3>
              <div class="setting-group">
                <div class="setting-item checkbox-item">
                  <label class="checkbox-label">
                    <input
                      v-model="preferences.showActivity"
                      type="checkbox"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span>Show my activity to collaborators</span>
                  </label>
                  <p class="setting-description">Let team members see when you're active</p>
                </div>

                <div class="setting-item checkbox-item">
                  <label class="checkbox-label">
                    <input
                      v-model="preferences.allowNotifications"
                      type="checkbox"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span>Allow notifications</span>
                  </label>
                  <p class="setting-description">Receive notifications for collaborations and updates</p>
                </div>
              </div>
            </div>

            <div class="section">
              <h3 class="section-title">Data</h3>
              <div class="setting-group">
                <div class="setting-item">
                  <button class="btn-secondary">Export My Data</button>
                  <p class="setting-description">Download a copy of your Music Hub data</p>
                </div>

                <div class="setting-item">
                  <button class="btn-secondary danger">Delete Account</button>
                  <p class="setting-description">Permanently delete your account and all data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button @click="resetToDefaults" class="btn-secondary">Reset to Defaults</button>
        <div class="footer-actions">
          <button @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button @click="savePreferences" class="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'

// Emits
const emit = defineEmits(['close'])

// State
const activeTab = ref('appearance')

const tabs = [
  {
    id: 'appearance',
    name: 'Appearance',
    icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.19 0 .34-.16.34-.34 0-.09-.03-.17-.09-.25-.27-.44-.64-1.41-.64-2.41 0-1.66 1.34-3 3-3h3.5c3.03 0 5.5-2.47 5.5-5.5C22 5.81 17.19 2 12 2z' }))
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' }))
  },
  {
    id: 'privacy',
    name: 'Privacy',
    icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z' }))
  }
]

// Preferences state
const preferences = reactive({
  // Typography
  headerFont: {
    family: "'SF Pro Display', -apple-system, sans-serif",
    size: '24px',
    weight: '700',
    lineHeight: '1.2'
  },
  bodyFont: {
    family: "'SF Pro Text', -apple-system, sans-serif",
    size: '14px',
    weight: '400',
    lineHeight: '1.5'
  },

  // Colors
  bgColor: '#000000',
  accentColor: '#1db954',

  // Layout
  compactMode: false,
  hideImages: false,

  // Audio
  defaultVolume: 80,
  autoPlay: true,
  crossfade: false,
  audioQuality: 'high',

  // Privacy
  showActivity: true,
  allowNotifications: true
})

// Methods
const savePreferences = () => {
  // Save to localStorage or API
  localStorage.setItem('musicHubPreferences', JSON.stringify(preferences))

  // Apply CSS variables
  applyPreferences()

  emit('close')
}

const resetToDefaults = () => {
  // Reset all preferences to defaults
  Object.assign(preferences, {
    headerFont: {
      family: "'SF Pro Display', -apple-system, sans-serif",
      size: '24px',
      weight: '700',
      lineHeight: '1.2'
    },
    bodyFont: {
      family: "'SF Pro Text', -apple-system, sans-serif",
      size: '14px',
      weight: '400',
      lineHeight: '1.5'
    },
    bgColor: '#000000',
    accentColor: '#1db954',
    compactMode: false,
    hideImages: false,
    defaultVolume: 80,
    autoPlay: true,
    crossfade: false,
    audioQuality: 'high',
    showActivity: true,
    allowNotifications: true
  })
}

const applyPreferences = () => {
  const root = document.documentElement

  // Apply CSS variables
  root.style.setProperty('--header-font-family', preferences.headerFont.family)
  root.style.setProperty('--header-font-size', preferences.headerFont.size)
  root.style.setProperty('--header-font-weight', preferences.headerFont.weight)
  root.style.setProperty('--header-font-line-height', preferences.headerFont.lineHeight)

  root.style.setProperty('--body-font-family', preferences.bodyFont.family)
  root.style.setProperty('--body-font-size', preferences.bodyFont.size)
  root.style.setProperty('--body-font-weight', preferences.bodyFont.weight)
  root.style.setProperty('--body-font-line-height', preferences.bodyFont.lineHeight)

  root.style.setProperty('--bg-color', preferences.bgColor)
  root.style.setProperty('--accent-color', preferences.accentColor)
  root.style.setProperty('--hide-images', preferences.hideImages ? 'none' : 'initial')
  root.style.setProperty('--compact-mode', preferences.compactMode ? '1' : '0')
}

const loadPreferences = () => {
  const saved = localStorage.getItem('musicHubPreferences')
  if (saved) {
    try {
      Object.assign(preferences, JSON.parse(saved))
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }
  applyPreferences()
}

// Lifecycle
onMounted(() => {
  loadPreferences()
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-panel {
  background: #282828;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.close-btn svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.modal-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.tab-nav {
  width: 200px;
  padding: 20px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.tab-btn.active {
  background: rgba(29, 185, 84, 0.1);
  color: #1db954;
  border-right: 2px solid #1db954;
}

.tab-btn svg {
  width: 18px;
  height: 18px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.tab-panel {
  padding: 24px;
}

.section {
  margin-bottom: 32px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px 0;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item.checkbox-item {
  flex-direction: row;
  align-items: flex-start;
  gap: 0;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.setting-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  width: 200px;
}

.setting-input:focus {
  outline: none;
  border-color: #1db954;
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2);
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: none;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 250px;
}

.slider-input {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #1db954;
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 35px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #1db954;
  border-color: #1db954;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.setting-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 4px 0 0 30px;
}

.checkbox-item .setting-description {
  margin-left: 30px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary.danger {
  color: #ff5555;
  border-color: rgba(255, 85, 85, 0.3);
}

.btn-secondary.danger:hover {
  background: rgba(255, 85, 85, 0.1);
  border-color: rgba(255, 85, 85, 0.5);
}
</style>