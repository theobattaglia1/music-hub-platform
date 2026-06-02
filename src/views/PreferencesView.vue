<template>
  <WorkspacePage
    eyebrow="Workspace Settings"
    title="Preferences"
    subtitle="Configure navigation density, notifications, and playback defaults from one anchored settings surface."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" type="button" @click="save">
        Save Preferences
      </button>
      <button class="workspace-header-secondary-btn" type="button" @click="resetDefaults">
        Reset Defaults
      </button>
    </template>

    <template #stats>
      <article class="stat-card">
        <span>Default Landing</span>
        <strong>{{ landingLabel }}</strong>
      </article>
      <article class="stat-card">
        <span>Notifications</span>
        <strong>{{ notificationsLabel }}</strong>
      </article>
      <article class="stat-card">
        <span>Motion Profile</span>
        <strong>{{ prefs.reducedMotion ? "Reduced" : "Standard" }}</strong>
      </article>
    </template>

    <section class="settings-grid">
      <section class="settings-panel">
        <div class="panel-head">
          <h2>Workspace</h2>
          <p>Core shell and navigation behavior for day-to-day use.</p>
        </div>

        <label class="setting-row">
          <div>
            <span class="setting-label">Compact sidebar</span>
            <span class="setting-help">Use denser spacing for navigation and cards.</span>
          </div>
          <input v-model="prefs.compactSidebar" type="checkbox" />
        </label>

        <label class="setting-row">
          <div>
            <span class="setting-label">Reduced motion</span>
            <span class="setting-help">Limit animated transitions for better focus.</span>
          </div>
          <input v-model="prefs.reducedMotion" type="checkbox" />
        </label>

        <label class="setting-row">
          <div>
            <span class="setting-label">Default landing page</span>
            <span class="setting-help">Where the workspace should open after auth.</span>
          </div>
          <select v-model="prefs.defaultLanding">
            <option value="/dashboard">Dashboard</option>
            <option value="/artists">Artists</option>
            <option value="/releases">Releases</option>
            <option value="/playlists">Playlists</option>
            <option value="/calendar">Calendar</option>
          </select>
        </label>
      </section>

      <section class="settings-panel">
        <div class="panel-head">
          <h2>Notifications</h2>
          <p>Control what gets surfaced and how aggressively it interrupts the flow.</p>
        </div>

        <label class="setting-row">
          <div>
            <span class="setting-label">Desktop notifications</span>
            <span class="setting-help">Alert when collaborators update shared work.</span>
          </div>
          <input v-model="prefs.desktopNotifications" type="checkbox" />
        </label>

        <label class="setting-row">
          <div>
            <span class="setting-label">Email digests</span>
            <span class="setting-help">Daily summary of notes, calendar updates, and files.</span>
          </div>
          <input v-model="prefs.emailDigest" type="checkbox" />
        </label>

        <label class="setting-row">
          <div>
            <span class="setting-label">Critical alerts only</span>
            <span class="setting-help">Suppress non-blocking notifications.</span>
          </div>
          <input v-model="prefs.criticalOnly" type="checkbox" />
        </label>
      </section>

      <section class="settings-panel">
        <div class="panel-head">
          <h2>Playback & Library</h2>
          <p>Set the operating defaults for listening and media review.</p>
        </div>

        <label class="setting-row">
          <div>
            <span class="setting-label">Autoplay next track</span>
            <span class="setting-help">Continue playback automatically when a track ends.</span>
          </div>
          <input v-model="prefs.autoplay" type="checkbox" />
        </label>

        <label class="setting-row">
          <div>
            <span class="setting-label">Default media view</span>
            <span class="setting-help">Initial media browser layout.</span>
          </div>
          <select v-model="prefs.defaultMediaView">
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="compact">Compact</option>
          </select>
        </label>

        <label class="setting-row">
          <div>
            <span class="setting-label">Audio fade (ms)</span>
            <span class="setting-help">Crossfade duration between tracks.</span>
          </div>
          <input v-model.number="prefs.fadeMs" type="number" min="0" max="5000" step="100" />
        </label>
      </section>
    </section>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, reactive } from "vue";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const showToast = inject("showToast", () => {});
const STORAGE_KEY = "musicHub.preferences";

const defaults = {
  compactSidebar: false,
  reducedMotion: false,
  defaultLanding: "/dashboard",
  desktopNotifications: true,
  emailDigest: false,
  criticalOnly: false,
  autoplay: true,
  defaultMediaView: "grid",
  fadeMs: 300,
};

const landingLabels = {
  "/dashboard": "Dashboard",
  "/artists": "Artists",
  "/releases": "Releases",
  "/playlists": "Playlists",
  "/calendar": "Calendar",
};

const readStoredPreferences = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
};

const prefs = reactive(readStoredPreferences());

const landingLabel = computed(() => landingLabels[prefs.defaultLanding] || "Dashboard");
const notificationsLabel = computed(() => {
  if (prefs.criticalOnly) return "Critical Only";
  if (prefs.desktopNotifications && prefs.emailDigest) return "Desktop + Email";
  if (prefs.desktopNotifications) return "Desktop";
  if (prefs.emailDigest) return "Email";
  return "Muted";
});

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  showToast({ message: "Preferences saved", type: "success" });
};

const resetDefaults = () => {
  Object.assign(prefs, defaults);
  save();
};
</script>

<style scoped>
.action-btn,
.settings-panel,
.setting-row,
.setting-row select,
.setting-row input[type="number"] {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.action-btn {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn.primary {
  background: rgba(232, 90, 25, 0.16);
  border-color: rgba(232, 90, 25, 0.3);
  color: var(--color-accent);
}

.stat-card {
  min-width: 180px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  display: grid;
  gap: 8px;
}

.stat-card span {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.stat-card strong {
  font-size: 22px;
  font-weight: 520;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.settings-panel {
  border-radius: 24px;
  padding: 18px;
  display: grid;
  gap: 12px;
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 420;
}

.panel-head p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.58);
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  min-height: 74px;
  border-radius: 18px;
  padding: 14px 16px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 520;
}

.setting-help {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

.setting-row input[type="checkbox"] {
  accent-color: var(--color-accent);
  width: 18px;
  height: 18px;
}

.setting-row select,
.setting-row input[type="number"] {
  min-width: 160px;
  min-height: 38px;
  border-radius: 12px;
  padding: 0 12px;
}

@media (max-width: 1100px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .setting-row {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .setting-row select,
  .setting-row input[type="number"] {
    width: 100%;
  }
}

/* Theme override */
.action-btn,
.settings-panel,
.setting-row,
.setting-row select,
.setting-row input[type="number"],
.stat-card {
  border-color: var(--color-border);
  color: var(--color-text);
}

.action-btn,
.setting-row,
.setting-row select,
.setting-row input[type="number"],
.stat-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.74)),
    var(--color-surface);
  box-shadow: none;
}

.settings-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.74)),
    var(--color-surface);
  box-shadow: var(--shadow-1);
}

.action-btn.primary {
  background: rgba(19, 18, 17, 0.94);
  border-color: rgba(19, 18, 17, 0.08);
  color: var(--color-text-inverse);
}

.stat-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.68)),
    var(--color-surface);
}

.stat-card span,
.panel-head p,
.setting-help {
  color: var(--color-text-secondary);
}

.stat-card strong,
.panel-head h2,
.setting-label {
  color: var(--color-text);
}

.settings-panel {
  border-radius: 24px;
}

.setting-row {
  min-height: 84px;
}

.setting-row select,
.setting-row input[type="number"] {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.9);
}

.setting-row select:focus,
.setting-row input[type="number"]:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.setting-row input[type="checkbox"] {
  accent-color: var(--color-accent);
}
</style>
