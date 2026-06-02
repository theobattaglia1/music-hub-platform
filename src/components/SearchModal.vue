<template>
  <Teleport to="body">
    <Transition name="search-fade" appear>
      <div v-if="visible" class="search-overlay" @mousedown.self="close" role="presentation">
        <div
          class="search-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          @keydown.escape.prevent="close"
          @keydown.up.prevent="move(-1)"
          @keydown.down.prevent="move(1)"
          @keydown.enter.prevent="activateSelected"
        >
          <!-- ── Input ─────────────────────────────────── -->
          <div class="search-input-row">
            <svg class="input-glass" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              class="search-input"
              placeholder="Search artists, pages, actions…"
              autocomplete="off"
              spellcheck="false"
            />
            <kbd class="esc-badge" @click="close">ESC</kbd>
          </div>

          <!-- ── Results ───────────────────────────────── -->
          <div v-if="flatItems.length" class="search-sep"></div>

          <div v-if="flatItems.length" class="search-results" ref="resultsEl">
            <template v-for="(item, idx) in flatItems" :key="item._id">
              <!-- Section header (non-selectable) -->
              <div v-if="item._type === 'header'" class="result-header">
                {{ item.label }}
              </div>

              <!-- Artist result -->
              <button
                v-else-if="item._type === 'artist'"
                class="result-row"
                :class="{ 'is-active': idx === activeIdx }"
                @mouseenter="activeIdx = idx"
                @click="go(item)"
              >
                <div class="result-avatar">
                  <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.label" />
                  <span v-else class="avatar-letter">{{ item.label.charAt(0) }}</span>
                </div>
                <div class="result-body">
                  <span class="result-label" v-html="highlight(item.label)"></span>
                  <span class="result-meta">Artist</span>
                </div>
                <svg
                  class="result-caret"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </button>

              <!-- Page / nav result -->
              <button
                v-else
                class="result-row"
                :class="{ 'is-active': idx === activeIdx }"
                @mouseenter="activeIdx = idx"
                @click="go(item)"
              >
                <div class="result-num">{{ item.num }}</div>
                <div class="result-body">
                  <span class="result-label" v-html="highlight(item.label)"></span>
                  <span v-if="item.meta" class="result-meta">{{ item.meta }}</span>
                </div>
                <svg
                  class="result-caret"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
              </button>
            </template>
          </div>

          <!-- ── No results ─────────────────────────────── -->
          <div v-else-if="query.trim()" class="search-empty">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
            <p>
              No results for "<strong>{{ query.trim() }}</strong
              >"
            </p>
          </div>

          <!-- ── Footer ─────────────────────────────────── -->
          <div class="search-footer">
            <span class="footer-hint"><kbd>↑↓</kbd> navigate</span>
            <span class="footer-hint"><kbd>↵</kbd> open</span>
            <span class="footer-hint"><kbd>ESC</kbd> dismiss</span>
            <span class="footer-shortcut">⌘K</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  artists: { type: Array, default: () => [] },
});

const emit = defineEmits(["close"]);

const router = useRouter();

// ── State ────────────────────────────────────────────────
const visible = ref(true); // controls Transition; set false before emitting close
const query = ref("");
const activeIdx = ref(0);
const inputEl = ref(null);
const resultsEl = ref(null);

// ── All navigable pages ──────────────────────────────────
const PAGES = [
  { num: "00", label: "Home", path: "/dashboard", meta: "Dashboard" },
  { num: "05", label: "Projects", path: "/projects", meta: "Execution" },
  { num: "01", label: "Songs", path: "/songs", meta: "Music" },
  { num: "02", label: "Playlists", path: "/playlists", meta: "Music" },
  { num: "03", label: "Releases", path: "/releases", meta: "Music" },
  { num: "10", label: "Media Library", path: "/media-library", meta: "Creative" },
  { num: "11", label: "Moodboards", path: "/moodboards", meta: "Creative" },
  { num: "20", label: "Files", path: "/files", meta: "Documents" },
  { num: "35", label: "Financials", path: "/financials", meta: "Insights" },
  { num: "40", label: "Calendar", path: "/calendar", meta: "Schedule" },
  { num: "41", label: "Timeline", path: "/timeline", meta: "Schedule" },
  { num: "42", label: "Notes", path: "/notes", meta: "Schedule" },
  { num: "50", label: "Artists & Partners", path: "/artists", meta: "People" },
  { num: "51", label: "Team", path: "/team", meta: "People" },
  { num: "60", label: "Profile", path: "/profile", meta: "Account" },
  { num: "61", label: "Preferences", path: "/preferences", meta: "Account" },
];

// ── Build flat, indexed results list ────────────────────
const flatItems = computed(() => {
  const q = query.value.trim().toLowerCase();
  const result = [];

  // Empty state: show quick-jump navigation
  if (!q) {
    result.push({ _id: "h-jump", _type: "header", label: "Jump to" });
    PAGES.slice(0, 8).forEach((p, i) => result.push({ ...p, _id: `page-${i}`, _type: "page" }));
    return result;
  }

  // Pages
  const matchedPages = PAGES.filter(
    (p) =>
      p.label.toLowerCase().includes(q) || p.meta?.toLowerCase().includes(q) || p.num.startsWith(q),
  );
  if (matchedPages.length) {
    result.push({ _id: "h-pages", _type: "header", label: "Pages" });
    matchedPages.forEach((p, i) => result.push({ ...p, _id: `page-${i}`, _type: "page" }));
  }

  // Artists
  const matchedArtists = props.artists.filter((a) => a.name.toLowerCase().includes(q));
  if (matchedArtists.length) {
    result.push({ _id: "h-artists", _type: "header", label: "Artists & Partners" });
    matchedArtists.forEach((a) =>
      result.push({
        _id: `artist-${a.id}`,
        _type: "artist",
        label: a.name,
        path: `/artists/${a.slug}`,
        avatarUrl: a.avatar_url ?? null,
      }),
    );
  }

  return result;
});

// Keep activeIdx pointing to a selectable row
watch(flatItems, () => {
  const first = flatItems.value.findIndex((i) => i._type !== "header");
  activeIdx.value = first >= 0 ? first : 0;
});

// ── Keyboard navigation ──────────────────────────────────
const selectableIdxs = computed(() =>
  flatItems.value.map((item, i) => (item._type !== "header" ? i : -1)).filter((i) => i >= 0),
);

const move = (dir) => {
  const idxs = selectableIdxs.value;
  const pos = idxs.indexOf(activeIdx.value);
  const next = idxs[Math.max(0, Math.min(idxs.length - 1, pos + dir))];
  if (next !== undefined) {
    activeIdx.value = next;
    nextTick(() => {
      resultsEl.value?.querySelector(".result-row.is-active")?.scrollIntoView({ block: "nearest" });
    });
  }
};

const activateSelected = () => {
  const item = flatItems.value[activeIdx.value];
  if (item && item._type !== "header") go(item);
};

// ── Navigation & close ───────────────────────────────────
const go = (item) => {
  router.push(item.path);
  close();
};

const close = () => {
  visible.value = false;
  setTimeout(() => emit("close"), 180);
};

// ── Highlight matching text ──────────────────────────────
const highlight = (text) => {
  const q = query.value.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    text.slice(0, i) +
    `<mark class="sh">${text.slice(i, i + q.length)}</mark>` +
    text.slice(i + q.length)
  );
};

// ── Focus input on mount ─────────────────────────────────
onMounted(() => nextTick(() => inputEl.value?.focus()));

// ── Close on browser back ─────────────────────────────────
const handlePop = () => close();
onMounted(() => window.addEventListener("popstate", handlePop));
onBeforeUnmount(() => window.removeEventListener("popstate", handlePop));
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────── */
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 11vh;
}

/* ── Panel ──────────────────────────────────────────────── */
.search-panel {
  width: 580px;
  max-width: calc(100vw - 32px);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
  display: flex;
  flex-direction: column;
  max-height: 72vh;
  overflow: hidden;
}

/* ── Input row ──────────────────────────────────────────── */
.search-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  flex-shrink: 0;
}

.input-glass {
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: var(--weight-regular);
  color: var(--color-text);
  font-family: var(--font-sans);
  caret-color: var(--color-accent);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.esc-badge {
  font-size: 10px;
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 7px;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}

.esc-badge:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
}

/* ── Separator ──────────────────────────────────────────── */
.search-sep {
  height: 1px;
  background: var(--color-border);
  flex-shrink: 0;
}

/* ── Results area ───────────────────────────────────────── */
.search-results {
  overflow-y: auto;
  flex: 1;
  padding: var(--space-2) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.search-results::-webkit-scrollbar {
  width: 4px;
}
.search-results::-webkit-scrollbar-track {
  background: transparent;
}
.search-results::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

/* ── Section header ─────────────────────────────────────── */
.result-header {
  padding: 6px var(--space-5) 3px;
  font-size: 10px;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  user-select: none;
}

/* ── Result row ─────────────────────────────────────────── */
.result-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px var(--space-5);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--motion-fast);
}

.result-row:hover,
.result-row.is-active {
  background: var(--color-accent-subtle);
}

.result-row.is-active .result-num {
  background: var(--color-accent-subtle2);
  border-color: transparent;
  color: var(--color-accent);
}

/* Number badge */
.result-num {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--weight-semibold);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  transition: all var(--motion-fast);
}

/* Artist avatar */
.result-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter {
  font-size: 12px;
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
}

/* Text body */
.result-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.result-label {
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Caret arrow */
.result-caret {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--motion-fast);
}

.result-row:hover .result-caret,
.result-row.is-active .result-caret {
  opacity: 1;
}

/* Highlight mark */
:deep(.sh) {
  background: var(--color-accent-subtle2);
  color: var(--color-accent);
  font-weight: var(--weight-semibold);
  border-radius: 2px;
  padding: 0 1px;
}

/* ── Empty state ────────────────────────────────────────── */
.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-5);
  color: var(--color-text-tertiary);
}

.search-empty svg {
  width: 28px;
  height: 28px;
  opacity: 0.4;
}

.search-empty p {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  margin: 0;
}

.search-empty strong {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
}

/* ── Footer ─────────────────────────────────────────────── */
.search-footer {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 8px var(--space-5);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  background: var(--color-surface-raised);
}

.footer-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.footer-hint kbd {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 1px 5px;
}

.footer-shortcut {
  margin-left: auto;
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: var(--color-text-tertiary);
  letter-spacing: 0.05em;
}

/* ── Transition ─────────────────────────────────────────── */
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 160ms ease;
}

.search-fade-enter-active .search-panel,
.search-fade-leave-active .search-panel {
  transition:
    transform 160ms ease,
    opacity 160ms ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}

.search-fade-enter-from .search-panel,
.search-fade-leave-to .search-panel {
  transform: scale(0.96) translateY(-10px);
  opacity: 0;
}
</style>
