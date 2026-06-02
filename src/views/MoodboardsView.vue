<template>
  <WorkspacePage
    class="moodboards-view"
    artist-scoped-header
    eyebrow="Creative Workspace"
    title="Moodboards"
    :count="filteredMoodboards.length"
    subtitle="Build living visual boards, then open them into a working canvas editor."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="showCreateModal = true">
        New Moodboard
      </button>
    </template>

    <template #stats>
      <article class="stat-card">
        <span>Boards</span>
        <strong>{{ filteredMoodboards.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Linked Assets</span>
        <strong>{{ linkedAssetCount }}</strong>
      </article>
      <article class="stat-card">
        <span>Total Items</span>
        <strong>{{ totalItemCount }}</strong>
      </article>
    </template>

    <template #toolbar>
      <div class="search-container">
        <label class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="Search moodboards..."
          />
        </label>
      </div>

      <label class="sort-field">
        <span>Sort</span>
        <select v-model="sortBy">
          <option value="recent">Recently Updated</option>
          <option value="name">Name</option>
          <option value="created">Created</option>
        </select>
      </label>
    </template>

    <section class="moodboard-grid" @contextmenu.prevent="openWorkspaceMenu">
      <article
        v-for="board in filteredMoodboards"
        :key="board.id"
        class="moodboard-card"
        @click="openMoodboard(board)"
        @contextmenu.prevent.stop="openMoodboardMenu(board, $event)"
      >
        <div class="card-preview">
          <div class="preview-canvas">
            <div
              v-for="(item, index) in board.preview_items"
              :key="`${board.id}-${index}`"
              class="preview-item"
              :class="item.type"
              :style="previewStyle(item)"
            >
              <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt" />
              <div v-else-if="item.type === 'asset'" class="preview-asset">
                <span>{{ item.content || "Linked asset" }}</span>
              </div>
              <div
                v-else-if="item.type === 'text'"
                class="preview-text"
                :style="{ color: item.color }"
              >
                {{ item.content }}
              </div>
              <div v-else class="preview-color" :style="{ background: item.color }"></div>
            </div>
          </div>
        </div>

        <div class="card-meta">
          <div>
            <h2>{{ board.title }}</h2>
            <p>{{ board.description }}</p>
          </div>
          <button class="ghost-btn" @click.stop="openMoodboard(board)">Open</button>
        </div>

        <div class="card-footer">
          <span>{{ board.item_count }} items</span>
          <span>{{ formatRelativeDate(board.updated_at) }}</span>
        </div>
      </article>

      <div v-if="filteredMoodboards.length === 0" class="empty-state">
        <h2>{{ searchQuery ? "No moodboards match this search" : "No moodboards yet" }}</h2>
        <p>
          {{
            searchQuery
              ? "Try a broader name or create a new board."
              : "Create a board and start arranging images, text, and colors."
          }}
        </p>
        <button class="create-btn" @click="showCreateModal = true">Create Moodboard</button>
      </div>
    </section>

    <teleport to="body">
      <transition name="fade">
        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
          <div class="modal-card">
            <div class="modal-head">
              <h2>Create Moodboard</h2>
              <button class="close-btn" @click="showCreateModal = false">×</button>
            </div>

            <form class="modal-form" @submit.prevent="createMoodboard">
              <label>
                <span>Title</span>
                <input
                  v-model="draftBoard.title"
                  type="text"
                  placeholder="Campaign references"
                  required
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  v-model="draftBoard.description"
                  rows="3"
                  placeholder="What this board is collecting..."
                ></textarea>
              </label>
              <div class="modal-actions">
                <button type="button" class="ghost-btn" @click="showCreateModal = false">
                  Cancel
                </button>
                <button type="submit" class="create-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showRenameModal" class="modal-overlay" @click.self="closeRenameModal">
          <div class="modal-card">
            <div class="modal-head">
              <h2>Rename Moodboard</h2>
              <button class="close-btn" @click="closeRenameModal">×</button>
            </div>

            <form class="modal-form" @submit.prevent="submitRenameMoodboard">
              <label>
                <span>Title</span>
                <input
                  v-model="renameBoardTitle"
                  type="text"
                  placeholder="Moodboard title"
                  required
                />
              </label>
              <div class="modal-actions">
                <button type="button" class="ghost-btn" @click="closeRenameModal">Cancel</button>
                <button type="submit" class="create-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
          <div class="modal-card">
            <div class="modal-head">
              <h2>Delete Moodboard</h2>
              <button class="close-btn" @click="closeDeleteModal">×</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ activeBoard?.title }}</strong>
              <p>This removes the board and its current layout from the workspace.</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="ghost-btn" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="danger-btn" @click="confirmDeleteMoodboard">
                Delete Moodboard
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMoodboardsStore } from "@/stores/moodboards";
import { useDashboardStore } from "@/stores/dashboard";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const router = useRouter();
const route = useRoute();
const moodboardsStore = useMoodboardsStore();
const dashboardStore = useDashboardStore();
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

const searchQuery = ref("");
const sortBy = ref("recent");
const showCreateModal = ref(false);
const showRenameModal = ref(false);
const showDeleteModal = ref(false);
const activeBoard = ref(null);
const renameBoardTitle = ref("");
const draftBoard = reactive({
  title: "",
  description: "",
});
const scopedArtistSlug = computed(() =>
  typeof route.query.artist === "string" ? route.query.artist : "",
);
const scopedArtist = computed(() =>
  (dashboardStore.artists || []).find(
    (artist) => artist.slug === scopedArtistSlug.value || String(artist.id) === scopedArtistSlug.value,
  ) || null,
);
const totalItemCount = computed(() =>
  filteredMoodboards.value.reduce(
    (sum, board) => sum + (board.item_count || board.items?.length || 0),
    0,
  ),
);
const linkedAssetCount = computed(() =>
  filteredMoodboards.value.reduce((sum, board) => {
    const items = board.items || board.preview_items || [];
    return sum + items.filter((item) => item.type === "asset").length;
  }, 0),
);

const filteredMoodboards = computed(() => {
  let boards = [...moodboardsStore.boards];

  if (scopedArtist.value) {
    boards = boards.filter(
      (board) => !board.artist_id || String(board.artist_id) === String(scopedArtist.value.id),
    );
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    boards = boards.filter(
      (board) =>
        board.title.toLowerCase().includes(query) ||
        board.description.toLowerCase().includes(query),
    );
  }

  boards.sort((a, b) => {
    if (sortBy.value === "name") return a.title.localeCompare(b.title);
    if (sortBy.value === "created") return new Date(b.created_at) - new Date(a.created_at);
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  return boards;
});

const previewStyle = (item) => ({
  left: `${item.x}%`,
  top: `${item.y}%`,
  width: `${item.width}%`,
  height: `${item.height}%`,
});

const formatRelativeDate = (value) => {
  const diffHours = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const openMoodboard = (board) => {
  router.push(`/moodboards/${board.id}`);
};

const createMoodboard = async () => {
  const board = await moodboardsStore.createMoodboard({
    title: draftBoard.title.trim(),
    description: draftBoard.description.trim(),
    artist_id: scopedArtist.value?.id || null,
  });

  draftBoard.title = "";
  draftBoard.description = "";
  showCreateModal.value = false;
  showToast({ message: `Created ${board.title}`, type: "success" });
  router.push(`/moodboards/${board.id}`);
};

const renameMoodboard = async (board) => {
  activeBoard.value = board;
  renameBoardTitle.value = board.title || "";
  showRenameModal.value = true;
};

const duplicateMoodboard = async (board) => {
  const duplicate = await moodboardsStore.duplicateMoodboard(board.id);
  showToast({ message: `Duplicated ${board.title}`, type: "success" });
  router.push(`/moodboards/${duplicate.id}`);
};

const deleteMoodboard = async (board) => {
  activeBoard.value = board;
  showDeleteModal.value = true;
};

const closeRenameModal = () => {
  showRenameModal.value = false;
  activeBoard.value = null;
  renameBoardTitle.value = "";
};

const submitRenameMoodboard = async () => {
  if (!activeBoard.value) return;
  const title = renameBoardTitle.value.trim();
  if (!title) return;
  await moodboardsStore.renameMoodboard(activeBoard.value.id, title);
  showToast({ message: `Renamed to ${title}`, type: "success" });
  closeRenameModal();
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  activeBoard.value = null;
};

const confirmDeleteMoodboard = async () => {
  if (!activeBoard.value) return;
  const title = activeBoard.value.title;
  await moodboardsStore.deleteMoodboard(activeBoard.value.id);
  showToast({ message: `Deleted ${title}`, type: "success" });
  closeDeleteModal();
};

const shareMoodboard = async (board) => {
  const href = `${window.location.origin}${router.resolve(`/moodboards/${board.id}`).href}`;
  try {
    await navigator.clipboard.writeText(href);
    showToast({ message: "Moodboard link copied", type: "success" });
  } catch {
    showToast({ message: href, type: "info" });
  }
};

const openMoodboardMenu = (board, event) => {
  showContextMenu(
    event,
    [
      { label: "Open Editor", handler: () => openMoodboard(board) },
      { label: "Rename", handler: () => renameMoodboard(board) },
      { label: "Duplicate", handler: () => duplicateMoodboard(board) },
      { label: "Copy Link", handler: () => shareMoodboard(board) },
      { separator: true },
      { label: "Delete", destructive: true, handler: () => deleteMoodboard(board) },
    ],
    "custom",
  );
};

const openWorkspaceMenu = (event) => {
  if (event.target.closest(".moodboard-card") || event.target.closest(".modal-card")) return;

  showContextMenu(
    event,
    [
      {
        label: "New Moodboard",
        handler: () => {
          showCreateModal.value = true;
        },
      },
      { separator: true },
      {
        label: "Sort by Recently Updated",
        handler: () => {
          sortBy.value = "recent";
        },
      },
      {
        label: "Sort by Name",
        handler: () => {
          sortBy.value = "name";
        },
      },
      {
        label: "Sort by Created",
        handler: () => {
          sortBy.value = "created";
        },
      },
      { label: "Refresh", handler: () => moodboardsStore.loadMoodboards() },
    ],
    "custom",
  );
};

onMounted(() => {
  moodboardsStore.loadMoodboards();
});
</script>

<style scoped>
.moodboards-view {
  color: #fff;
}

.create-btn,
.ghost-btn,
.danger-btn,
.stat-card,
.search-input,
.sort-field select,
.modal-form input,
.modal-form textarea {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.create-btn,
.ghost-btn,
.danger-btn {
  min-height: 40px;
  border-radius: 999px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.create-btn:hover,
.ghost-btn:hover,
.danger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.danger-btn {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.28);
  color: #fecaca;
}

.search-container {
  flex: 1 1 340px;
  max-width: 520px;
}

.stat-card {
  min-width: 154px;
  padding: 12px 14px;
  border-radius: 20px;
  display: grid;
  gap: 4px;
}

.stat-card span {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.stat-card strong {
  font-size: 18px;
  font-weight: 520;
}

.search-input,
.sort-field select,
.modal-form input,
.modal-form textarea {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
}

.sort-field {
  display: grid;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.sort-field select {
  min-width: 180px;
  min-height: 42px;
  border-radius: 12px;
  padding: 0 12px;
}

.moodboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 18px;
}

.moodboard-card,
.modal-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
}

.moodboard-card {
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease;
}

.moodboard-card:hover {
  transform: translateY(-3px);
  border-color: rgba(251, 191, 36, 0.34);
}

.card-preview {
  padding: 14px;
}

.preview-canvas {
  position: relative;
  aspect-ratio: 16 / 11;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
}

.preview-item {
  position: absolute;
  overflow: hidden;
  border-radius: 12px;
}

.preview-item.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-text {
  width: 100%;
  height: 100%;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.preview-color {
  width: 100%;
  height: 100%;
}

.preview-asset {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 8px;
  background: linear-gradient(180deg, rgba(232, 90, 25, 0.14), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.84);
  font-size: 11px;
  text-align: center;
  line-height: 1.3;
}

.card-meta,
.card-footer,
.modal-head,
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.card-meta {
  padding: 0 16px 12px;
}

.card-meta h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 520;
}

.card-meta p,
.card-footer,
.empty-state p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  line-height: 1.5;
}

.card-footer {
  padding: 0 16px 16px;
  font-size: 12px;
}

.empty-state {
  min-height: 280px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 32px;
}

.empty-state h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.modal-card {
  width: min(520px, calc(100vw - 32px));
  padding: 18px;
}

.modal-head h2 {
  margin: 0;
  font-size: 22px;
}

.close-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 30px;
  cursor: pointer;
}

.modal-form {
  display: grid;
  gap: 14px;
  margin-top: 12px;
}

.modal-form label {
  display: grid;
  gap: 8px;
}

.modal-form span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.modal-form input,
.modal-form textarea {
  border-radius: 14px;
  padding: 12px 14px;
}

.confirm-copy {
  margin-top: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(239, 68, 68, 0.18);
  background: rgba(239, 68, 68, 0.08);
}

.confirm-copy strong {
  display: block;
  font-size: 18px;
}

.confirm-copy p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.62);
}

@media (max-width: 900px) {
  .moodboards-view {
    padding: 0;
  }

  .card-meta,
  .card-footer,
  .modal-head,
  .modal-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container,
  .sort-field select {
    min-width: 100%;
  }
}

/* Theme override */
.moodboards-view {
  color: var(--color-text);
}

.stat-card,
.search-input,
.sort-field select,
.modal-form input,
.modal-form textarea {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.78)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: none;
}

.moodboard-card {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.78)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: none;
}

.modal-card {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.78)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
}

.stat-card span,
.card-meta p,
.card-footer,
.empty-state p,
.modal-form span,
.confirm-copy p,
.close-btn {
  color: var(--color-text-secondary);
}

.stat-card strong,
.card-meta h2,
.empty-state h2,
.modal-head h2,
.confirm-copy strong {
  color: var(--color-text);
}

.search-icon {
  color: var(--color-text-tertiary);
}

.search-input,
.sort-field select,
.modal-form input,
.modal-form textarea {
  color: var(--color-text);
}

.sort-field,
.sort-field span {
  color: var(--color-text-secondary);
}

.search-input::placeholder,
.modal-form input::placeholder,
.modal-form textarea::placeholder {
  color: var(--color-text-tertiary);
}

.create-btn,
.ghost-btn,
.danger-btn {
  border-radius: 999px;
  backdrop-filter: blur(18px);
}

.create-btn {
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(19, 18, 17, 0.94);
  color: var(--color-text-inverse);
}

.create-btn:hover {
  background: rgba(19, 18, 17, 1);
}

.ghost-btn {
  border-color: var(--color-border);
  background: rgba(19, 18, 17, 0.04);
  color: var(--color-text);
}

.ghost-btn:hover {
  background: rgba(19, 18, 17, 0.08);
}

.danger-btn {
  border-color: rgba(192, 57, 43, 0.18);
  background: rgba(192, 57, 43, 0.08);
  color: var(--color-danger);
}

.moodboard-card:hover {
  border-color: rgba(200, 75, 17, 0.26);
  box-shadow: 0 18px 42px rgba(19, 18, 17, 0.08);
}

.preview-canvas {
  background:
    radial-gradient(circle at top left, rgba(200, 75, 17, 0.12), transparent 40%),
    linear-gradient(160deg, rgba(250, 250, 248, 0.95), rgba(237, 236, 233, 0.82));
}

.preview-item.text {
  background: rgba(255, 255, 255, 0.72);
}

.preview-text {
  color: var(--color-text) !important;
}

.preview-asset span {
  color: var(--color-text-secondary);
}

.preview-asset {
  background: linear-gradient(180deg, rgba(200, 75, 17, 0.12), rgba(255, 255, 255, 0.36));
  border-color: rgba(200, 75, 17, 0.16);
  color: var(--color-text);
}

.empty-state {
  border-color: rgba(200, 75, 17, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.44)), transparent;
}

.modal-overlay {
  background: rgba(19, 18, 17, 0.16);
  backdrop-filter: blur(22px);
}

.modal-card {
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-overlay);
}

.confirm-copy {
  border-color: rgba(192, 57, 43, 0.16);
  background: rgba(192, 57, 43, 0.07);
}
</style>
