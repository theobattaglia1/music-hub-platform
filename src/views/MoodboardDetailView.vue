<template>
  <div class="moodboard-detail-view">
    <section v-if="board" class="editor-workspace">
      <header class="editor-header surface-panel">
        <div class="editor-heading">
          <button class="ghost-btn compact-btn" @click="goBack">Back</button>
          <div class="board-title-stack">
            <input
              v-model="boardTitle"
              class="board-title-input"
              @blur="saveBoardMeta"
              @keydown.enter.prevent="saveBoardMeta"
            />
            <p class="board-subtitle">{{ board.description }}</p>
          </div>
        </div>

        <div class="editor-head-actions">
          <button class="ghost-btn compact-btn" @click="focusBoard">Fit Board</button>
          <button class="ghost-btn compact-btn" @click="toolbarCollapsed = !toolbarCollapsed">
            {{ toolbarCollapsed ? "Show Controls" : "Hide Controls" }}
          </button>
          <button class="ghost-btn compact-btn" @click="shareBoard">Copy Link</button>
          <button class="ghost-btn compact-btn" @click="duplicateBoard">Duplicate</button>
          <button class="create-btn compact-btn" @click="saveBoardMeta">Saved Automatically</button>
        </div>
      </header>

      <section v-show="!toolbarCollapsed" class="editor-toolbar surface-panel">
        <div class="toolbar-row">
          <div class="toolbar-group toolbar-group-add">
            <span class="toolbar-label">Add</span>
            <input
              v-model="newText"
              class="toolbar-input toolbar-input-text"
              type="text"
              placeholder="Add a note or headline"
            />
            <button class="ghost-btn compact-btn" @click="addTextItem">Text</button>

            <input v-model="newColor" class="color-swatch" type="color" aria-label="New color" />
            <button class="ghost-btn compact-btn" @click="addColorItem">Color</button>

            <input
              v-model="newImageUrl"
              class="toolbar-input toolbar-input-url"
              type="url"
              placeholder="Paste image URL"
            />
            <button class="ghost-btn compact-btn" @click="addImageFromUrl">Image</button>

            <label class="ghost-btn compact-btn upload-chip">
              Upload
              <input type="file" accept="image/*" @change="handleImageUpload" />
            </label>

            <button class="ghost-btn compact-btn" @click="showAssetBrowser = !showAssetBrowser">
              {{ showAssetBrowser ? "Hide Linked Assets" : "Link App Asset" }}
            </button>
          </div>

          <div class="toolbar-group toolbar-group-view">
            <span class="toolbar-label">View</span>
            <button class="ghost-btn compact-btn icon-btn" @click="zoomOut">−</button>
            <button class="ghost-btn compact-btn zoom-pill" @click="resetZoom">{{ zoomLabel }}</button>
            <button class="ghost-btn compact-btn icon-btn" @click="zoomIn">+</button>
            <button
              class="ghost-btn compact-btn"
              :disabled="!selectedItem"
              @click="focusSelection"
            >
              Focus Selection
            </button>
            <button class="ghost-btn compact-btn" @click="focusBoard">Fit</button>
            <button class="ghost-btn compact-btn" @click="resetZoom">100%</button>
            <button class="ghost-btn compact-btn" @click="clearSelection">Clear Selection</button>
            <button class="danger-btn compact-btn" @click="clearBoard">Clear Board</button>
          </div>
        </div>
      </section>

      <section class="editor-canvas-shell surface-panel">
        <div class="canvas-meta-row">
          <div class="canvas-status">
            <span>{{ board.items.length }} items</span>
            <span>{{ selectedItem ? `${selectedItem.type} selected` : "Click to select items" }}</span>
          </div>
          <div class="canvas-hints">
            <span>Wheel pans</span>
            <span>Pinch or Cmd/Ctrl + wheel zooms</span>
            <span>Space + drag pans</span>
          </div>
        </div>

        <div
          ref="viewportRef"
          class="canvas-viewport"
          @click="handleViewportClick"
          @contextmenu.prevent="openCanvasMenu"
          @pointerdown="handleViewportPointerDown"
          @wheel.prevent="handleViewportWheel"
        >
          <div class="canvas-grid-shell">
            <div
              ref="cameraRef"
              class="canvas-camera"
              :class="{ 'is-animated': cameraAnimationEnabled && !isDirectManipulation }"
              :style="cameraStyle"
            >
              <div class="canvas-grid-plane" :style="gridPlaneStyle"></div>
              <div ref="canvasRef" class="canvas-stage" :style="canvasStyle">
                <div
                  v-for="item in sortedItems"
                  :key="item.id"
                  class="canvas-item"
                  :class="[item.type, { selected: selectedItemId === item.id }]"
                  :style="itemStyle(item)"
                  @click.stop="handleItemClick(item)"
                  @pointerdown.stop="startInteraction('drag', item, $event)"
                  @contextmenu.prevent.stop="openItemMenu(item, $event)"
                >
                  <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt" draggable="false" />

                  <div
                    v-else-if="item.type === 'text'"
                    class="text-item"
                    :style="{ color: item.color }"
                  >
                    {{ item.content }}
                  </div>

                  <button v-else-if="item.type === 'asset'" class="asset-item" type="button">
                    <div v-if="item.assetImage" class="asset-thumb">
                      <img :src="item.assetImage" :alt="item.assetTitle" draggable="false" />
                    </div>
                    <div class="asset-badge">{{ item.assetBadge || "Linked" }}</div>
                    <strong>{{ item.assetTitle }}</strong>
                    <p>{{ item.assetSubtitle }}</p>
                    <span>{{ item.assetMeta }}</span>
                  </button>

                  <div v-else class="color-item" :style="{ background: item.color }"></div>

                  <button
                    class="resize-handle"
                    @pointerdown.stop="startInteraction('resize', item, $event)"
                  ></button>
                </div>
              </div>
            </div>
          </div>

          <div class="viewport-zoom-indicator">{{ zoomLabel }}</div>

          <aside v-if="showAssetBrowser || selectedItem" class="floating-panels">
            <section v-if="showAssetBrowser" class="floating-panel surface-panel">
              <div class="panel-head">
                <div>
                  <h2>Attach App Assets</h2>
                  <p>Search songs, playlists, and files to place directly on the board.</p>
                </div>
                <button class="ghost-btn compact-btn" @click="showAssetBrowser = false">Close</button>
              </div>

              <input
                v-model="assetSearch"
                class="toolbar-input panel-search"
                type="search"
                placeholder="Search assets..."
              />

              <div class="asset-picker-groups">
                <div v-for="group in assetGroups" :key="group.key" class="asset-group">
                  <div class="asset-group-head">
                    <h3>{{ group.label }}</h3>
                    <span>{{ group.items.length }}</span>
                  </div>

                  <div v-if="group.items.length" class="asset-group-list">
                    <button
                      v-for="asset in group.items.slice(0, 10)"
                      :key="asset.key"
                      class="asset-link-row"
                      @click="addAssetItem(asset)"
                    >
                      <div class="asset-link-copy">
                        <strong>{{ asset.title }}</strong>
                        <p>{{ asset.subtitle }}</p>
                      </div>
                      <span>{{ asset.badge }}</span>
                    </button>
                  </div>
                  <p v-else class="asset-group-empty">No matching assets in this section.</p>
                </div>
              </div>
            </section>

            <section v-if="selectedItem" class="floating-panel surface-panel">
              <div class="panel-head">
                <div>
                  <h2>Selected Item</h2>
                  <p>{{ selectedItem.type }} · {{ Math.round(selectedItem.width) }} × {{ Math.round(selectedItem.height) }}</p>
                </div>
                <button class="ghost-btn compact-btn" @click="clearSelection">Close</button>
              </div>

              <div class="inspector-grid">
                <label>
                  <span>X</span>
                  <input
                    :value="Math.round(selectedItem.x)"
                    @change="updateSelectedNumber('x', $event)"
                  />
                </label>
                <label>
                  <span>Y</span>
                  <input
                    :value="Math.round(selectedItem.y)"
                    @change="updateSelectedNumber('y', $event)"
                  />
                </label>
                <label>
                  <span>Width</span>
                  <input
                    :value="Math.round(selectedItem.width)"
                    @change="updateSelectedNumber('width', $event)"
                  />
                </label>
                <label>
                  <span>Height</span>
                  <input
                    :value="Math.round(selectedItem.height)"
                    @change="updateSelectedNumber('height', $event)"
                  />
                </label>
              </div>

              <label v-if="selectedItem.type === 'text'" class="panel-field">
                <span>Text</span>
                <textarea
                  :value="selectedItem.content"
                  rows="4"
                  @change="updateSelectedText"
                ></textarea>
              </label>

              <label v-if="selectedItem.type === 'color'" class="panel-field">
                <span>Color</span>
                <input
                  class="color-swatch panel-color"
                  type="color"
                  :value="selectedItem.color"
                  @input="updateSelectedColor"
                />
              </label>

              <div v-if="selectedItem.type === 'asset'" class="asset-inspector">
                <span>Linked Resource</span>
                <strong>{{ selectedItem.assetTitle }}</strong>
                <p>{{ selectedItem.assetSubtitle }}</p>
                <button class="ghost-btn compact-btn" @click="openLinkedAsset(selectedItem)">
                  Open Linked Asset
                </button>
              </div>

              <div class="panel-actions">
                <button class="ghost-btn compact-btn" @click="focusSelection">Focus Item</button>
                <button class="ghost-btn compact-btn" @click="bringForwardSelected">Bring Forward</button>
                <button class="ghost-btn compact-btn" @click="sendBackwardSelected">Send Backward</button>
                <button class="ghost-btn compact-btn" @click="duplicateSelected">Duplicate</button>
                <button class="danger-btn compact-btn" @click="deleteSelected">Delete</button>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </section>

    <section v-else class="missing-state surface-panel">
      <h2>Moodboard not found</h2>
      <p>This board may have been deleted.</p>
      <button class="create-btn compact-btn" @click="goBack">Back to Moodboards</button>
    </section>

    <teleport to="body">
      <transition name="fade">
        <div v-if="showClearBoardModal" class="modal-overlay" @click.self="closeClearBoardModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Clear Moodboard</h2>
                <p>Remove all items from this board while keeping the board itself.</p>
              </div>
              <button class="ghost-btn compact-btn" @click="closeClearBoardModal">Close</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ board?.title }}</strong>
              <p>
                {{ board?.items.length || 0 }} item{{ (board?.items.length || 0) === 1 ? "" : "s" }}
                will be removed.
              </p>
            </div>

            <div class="panel-actions">
              <button class="ghost-btn compact-btn" @click="closeClearBoardModal">Cancel</button>
              <button class="danger-btn compact-btn" @click="confirmClearBoard">Clear Board</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMoodboardsStore } from "@/stores/moodboards";
import { useLibraryStore } from "@/stores/library";
import { usePlaylistsStore } from "@/stores/playlists";

const MIN_SCALE = 0.08;
const MAX_SCALE = 6;
const FIT_PADDING = 96;
const ITEM_FOCUS_PADDING = 220;
const GRID_EXTENT = 20000;

const route = useRoute();
const router = useRouter();
const moodboardsStore = useMoodboardsStore();
const libraryStore = useLibraryStore();
const playlistsStore = usePlaylistsStore();
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

const boardId = computed(() => String(route.params.id || ""));
const artistScopeQuery = computed(() =>
  route.query.artist ? { artist: String(route.query.artist) } : {},
);
const board = computed(() => moodboardsStore.getMoodboardById(boardId.value));
const selectedItemId = ref("");
const boardTitle = ref("");
const newText = ref("");
const newColor = ref("#e85a19");
const newImageUrl = ref("");
const showClearBoardModal = ref(false);
const assetSearch = ref("");
const showAssetBrowser = ref(false);
const toolbarCollapsed = ref(false);
const viewportRef = ref(null);
const canvasRef = ref(null);
const cameraRef = ref(null);
const cameraAnimationEnabled = ref(true);
const suppressClickUntil = ref(0);
const spacePressed = ref(false);

const interaction = reactive({
  mode: "",
  itemId: "",
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  originWidth: 0,
  originHeight: 0,
  didMove: false,
});

const panState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  didMove: false,
});

const camera = reactive({
  x: 0,
  y: 0,
  scale: 1,
});

const isDirectManipulation = computed(() => interaction.mode !== "" || panState.active);

const canvasStyle = {
  width: `${moodboardsStore.CANVAS_WIDTH}px`,
  height: `${moodboardsStore.CANVAS_HEIGHT}px`,
};

const cameraStyle = computed(() => ({
  transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
}));

const gridPlaneStyle = {
  width: `${GRID_EXTENT}px`,
  height: `${GRID_EXTENT}px`,
  left: `${-GRID_EXTENT / 2}px`,
  top: `${-GRID_EXTENT / 2}px`,
};

const zoomLabel = computed(() => `${Math.round(camera.scale * 100)}%`);

const sortedItems = computed(() =>
  [...(board.value?.items || [])].sort((a, b) => a.zIndex - b.zIndex),
);

const selectedItem = computed(
  () => board.value?.items.find((item) => item.id === selectedItemId.value) || null,
);

const linkedAssets = computed(() => {
  const songs = (libraryStore.songs || []).map((song) => ({
    key: `song-${song.id}`,
    resourceType: "song",
    resourceId: String(song.id),
    title: song.name,
    subtitle: song.artist || "Unknown artist",
    meta:
      song.album ||
      (song.duration
        ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, "0")}`
        : "Song"),
    badge: "Song",
    image: song.artwork_path || "",
    link: {
      path: "/songs",
      query: { focus: String(song.id) },
    },
  }));

  const playlists = (playlistsStore.playlists || []).map((playlist) => ({
    key: `playlist-${playlist.id}`,
    resourceType: "playlist",
    resourceId: String(playlist.id),
    title: playlist.name || playlist.title || "Untitled Playlist",
    subtitle: playlist.description || "Playlist",
    meta: `${playlist.song_count || playlist.track_ids?.length || 0} tracks`,
    badge: "Playlist",
    image: playlist.cover_image || "",
    link: `/playlists/${playlist.id}`,
  }));

  const files = (libraryStore.media || [])
    .filter((item) => item.media_type !== "audio")
    .map((item) => ({
      key: `file-${item.id}`,
      resourceType: "file",
      resourceId: String(item.id),
      title: item.title || item.file_name || "Untitled file",
      subtitle: item.description || item.media_type || "Media file",
      meta: item.file_name || item.mime_type || "File",
      badge: "File",
      image: item.thumbnail_path || "",
      link: "/files",
    }));

  return { songs, playlists, files };
});

const assetGroups = computed(() => {
  const query = assetSearch.value.trim().toLowerCase();
  const filterItems = (items) => {
    if (!query) return items;
    return items.filter(
      (asset) =>
        asset.title.toLowerCase().includes(query) ||
        asset.subtitle.toLowerCase().includes(query) ||
        asset.meta.toLowerCase().includes(query),
    );
  };

  return [
    { key: "songs", label: "Songs", items: filterItems(linkedAssets.value.songs) },
    { key: "playlists", label: "Playlists", items: filterItems(linkedAssets.value.playlists) },
    { key: "files", label: "Files", items: filterItems(linkedAssets.value.files) },
  ];
});

watch(
  board,
  async (nextBoard) => {
    boardTitle.value = nextBoard?.title || "";
    selectedItemId.value = "";
    if (nextBoard) {
      await nextTick();
      focusBoard(false);
    }
  },
  { immediate: true },
);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const itemStyle = (item) => ({
  left: `${item.x}px`,
  top: `${item.y}px`,
  width: `${item.width}px`,
  height: `${item.height}px`,
  zIndex: item.zIndex,
});

const goBack = () => {
  router.push({ path: "/moodboards", query: artistScopeQuery.value });
};

const withArtistScope = (target) => {
  if (!route.query.artist) return target;
  if (typeof target === "string") {
    return { path: target, query: artistScopeQuery.value };
  }
  return {
    ...target,
    query: { ...target.query, ...artistScopeQuery.value },
  };
};

const viewportRect = () => viewportRef.value?.getBoundingClientRect() || null;

const enableCameraAnimation = () => {
  requestAnimationFrame(() => {
    cameraAnimationEnabled.value = true;
  });
};

const setCamera = ({ x, y, scale }, animated = true) => {
  cameraAnimationEnabled.value = animated;
  camera.x = x;
  camera.y = y;
  camera.scale = clamp(scale, MIN_SCALE, MAX_SCALE);
  if (!animated) enableCameraAnimation();
};

const zoomAt = (nextScale, clientX, clientY, animated = false) => {
  const rect = viewportRect();
  if (!rect) return;
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const worldX = (localX - camera.x) / camera.scale;
  const worldY = (localY - camera.y) / camera.scale;

  setCamera(
    {
      scale,
      x: localX - worldX * scale,
      y: localY - worldY * scale,
    },
    animated,
  );
};

const focusBoard = (animated = true) => {
  const rect = viewportRect();
  if (!rect) return;
  const scale = clamp(
    Math.min(
      (rect.width - FIT_PADDING * 2) / moodboardsStore.CANVAS_WIDTH,
      (rect.height - FIT_PADDING * 2) / moodboardsStore.CANVAS_HEIGHT,
    ),
    MIN_SCALE,
    MAX_SCALE,
  );

  setCamera(
    {
      scale,
      x: (rect.width - moodboardsStore.CANVAS_WIDTH * scale) / 2,
      y: (rect.height - moodboardsStore.CANVAS_HEIGHT * scale) / 2,
    },
    animated,
  );
};

const focusItem = (item = selectedItem.value, animated = true) => {
  if (!item) return;
  const rect = viewportRect();
  if (!rect) return;
  const scale = clamp(
    Math.min(
      (rect.width - ITEM_FOCUS_PADDING * 2) / item.width,
      (rect.height - ITEM_FOCUS_PADDING * 2) / item.height,
    ),
    0.3,
    MAX_SCALE,
  );

  setCamera(
    {
      scale,
      x: rect.width / 2 - (item.x + item.width / 2) * scale,
      y: rect.height / 2 - (item.y + item.height / 2) * scale,
    },
    animated,
  );
};

const resetZoom = () => {
  const rect = viewportRect();
  if (!rect) return;
  const scale = 1;
  setCamera(
    {
      scale,
      x: (rect.width - moodboardsStore.CANVAS_WIDTH * scale) / 2,
      y: (rect.height - moodboardsStore.CANVAS_HEIGHT * scale) / 2,
    },
    true,
  );
};

const zoomFromCenter = (factor) => {
  const rect = viewportRect();
  if (!rect) return;
  zoomAt(
    camera.scale * factor,
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    true,
  );
};

const zoomIn = () => zoomFromCenter(1.18);
const zoomOut = () => zoomFromCenter(1 / 1.18);
const focusSelection = () => focusItem(selectedItem.value, true);

const viewportPointToCanvas = (clientX, clientY) => {
  const rect = viewportRect();
  if (!rect) return { x: 0, y: 0 };
  return {
    x: (clientX - rect.left - camera.x) / camera.scale,
    y: (clientY - rect.top - camera.y) / camera.scale,
  };
};

const saveBoardMeta = async () => {
  if (!board.value) return;
  await moodboardsStore.updateMoodboard(board.value.id, {
    title: boardTitle.value.trim() || board.value.title,
  });
};

const addTextItem = async () => {
  if (!board.value) return;
  const content = newText.value.trim() || "New text";
  const item = await moodboardsStore.addItem(board.value.id, {
    type: "text",
    content,
    color: "#11100f",
    x: 120,
    y: 120,
    width: 280,
    height: 90,
    zIndex: board.value.items.length + 1,
  });
  selectedItemId.value = item.id;
  newText.value = "";
  focusItem(item);
};

const addColorItem = async () => {
  if (!board.value) return;
  const item = await moodboardsStore.addItem(board.value.id, {
    type: "color",
    color: newColor.value,
    x: 140,
    y: 160,
    width: 220,
    height: 220,
    zIndex: board.value.items.length + 1,
  });
  selectedItemId.value = item.id;
  focusItem(item);
};

const addImageFromUrl = async () => {
  if (!board.value || !newImageUrl.value.trim()) return;
  const item = await moodboardsStore.addItem(board.value.id, {
    type: "image",
    src: newImageUrl.value.trim(),
    alt: "Moodboard image",
    x: 180,
    y: 180,
    width: 360,
    height: 240,
    zIndex: board.value.items.length + 1,
  });
  selectedItemId.value = item.id;
  newImageUrl.value = "";
  focusItem(item);
};

const addAssetItem = async (asset) => {
  if (!board.value) return;
  const item = await moodboardsStore.addItem(board.value.id, {
    type: "asset",
    assetType: asset.resourceType,
    assetId: asset.resourceId,
    assetTitle: asset.title,
    assetSubtitle: asset.subtitle,
    assetMeta: asset.meta,
    assetImage: asset.image,
    assetBadge: asset.badge,
    link: asset.link,
    x: 180,
    y: 160,
    width: 320,
    height: 180,
    zIndex: board.value.items.length + 1,
  });
  selectedItemId.value = item.id;
  showToast({ message: `Linked ${asset.title}`, type: "success" });
  focusItem(item);
};

const handleImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file || !board.value) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const item = await moodboardsStore.addItem(board.value.id, {
      type: "image",
      src: String(reader.result),
      alt: file.name,
      x: 220,
      y: 200,
      width: 360,
      height: 260,
      zIndex: board.value.items.length + 1,
    });
    selectedItemId.value = item.id;
    focusItem(item);
  };
  reader.readAsDataURL(file);
  event.target.value = "";
};

const updateSelectedNumber = async (key, event) => {
  if (!selectedItem.value || !board.value) return;
  const raw = Number(event.target.value);
  if (Number.isNaN(raw)) return;
  const nextValue =
    key === "x"
      ? clamp(raw, 0, moodboardsStore.CANVAS_WIDTH - selectedItem.value.width)
      : key === "y"
        ? clamp(raw, 0, moodboardsStore.CANVAS_HEIGHT - selectedItem.value.height)
        : key === "width"
          ? clamp(raw, 80, moodboardsStore.CANVAS_WIDTH - selectedItem.value.x)
          : clamp(raw, 60, moodboardsStore.CANVAS_HEIGHT - selectedItem.value.y);
  await moodboardsStore.updateItem(board.value.id, selectedItem.value.id, { [key]: nextValue });
};

const updateSelectedText = async (event) => {
  if (!selectedItem.value || !board.value) return;
  await moodboardsStore.updateItem(board.value.id, selectedItem.value.id, {
    content: event.target.value,
  });
};

const updateSelectedColor = async (event) => {
  if (!selectedItem.value || !board.value) return;
  await moodboardsStore.updateItem(board.value.id, selectedItem.value.id, {
    color: event.target.value,
  });
};

const clearSelection = () => {
  selectedItemId.value = "";
};

const duplicateSelected = async () => {
  if (!selectedItem.value || !board.value) return;
  const duplicate = await moodboardsStore.duplicateItem(board.value.id, selectedItem.value.id);
  selectedItemId.value = duplicate.id;
  focusItem(duplicate);
};

const deleteSelected = async () => {
  if (!selectedItem.value || !board.value) return;
  await moodboardsStore.deleteItem(board.value.id, selectedItem.value.id);
  selectedItemId.value = "";
};

const bringForwardSelected = async () => {
  if (!selectedItem.value || !board.value) return;
  await moodboardsStore.bringForward(board.value.id, selectedItem.value.id);
};

const sendBackwardSelected = async () => {
  if (!selectedItem.value || !board.value) return;
  await moodboardsStore.sendBackward(board.value.id, selectedItem.value.id);
};

const clearBoard = async () => {
  if (!board.value) return;
  showClearBoardModal.value = true;
};

const closeClearBoardModal = () => {
  showClearBoardModal.value = false;
};

const confirmClearBoard = async () => {
  if (!board.value) return;
  await moodboardsStore.clearBoard(board.value.id);
  selectedItemId.value = "";
  closeClearBoardModal();
};

const shareBoard = async () => {
  const href = `${window.location.origin}${router.resolve({
    path: `/moodboards/${boardId.value}`,
    query: artistScopeQuery.value,
  }).href}`;
  try {
    await navigator.clipboard.writeText(href);
    showToast({ message: "Moodboard link copied", type: "success" });
  } catch {
    showToast({ message: href, type: "info" });
  }
};

const openLinkedAsset = (item) => {
  const targetLink = item?.link;
  if (!targetLink) return;
  if (typeof targetLink === "string" && /^https?:\/\//i.test(targetLink)) {
    window.open(targetLink, "_blank", "noopener,noreferrer");
    return;
  }
  router.push(withArtistScope(targetLink));
};

const duplicateBoard = async () => {
  if (!board.value) return;
  const duplicate = await moodboardsStore.duplicateMoodboard(board.value.id);
  showToast({ message: `Duplicated ${board.value.title}`, type: "success" });
  router.push(withArtistScope(`/moodboards/${duplicate.id}`));
};

const handleItemClick = (item) => {
  if (Date.now() < suppressClickUntil.value) return;
  selectedItemId.value = item.id;
};

const startInteraction = (mode, item, event) => {
  if (!board.value) return;
  if (spacePressed.value || event.button === 1) {
    startCanvasPan(event);
    return;
  }

  selectedItemId.value = item.id;
  interaction.mode = mode;
  interaction.itemId = item.id;
  interaction.startX = event.clientX;
  interaction.startY = event.clientY;
  interaction.originX = item.x;
  interaction.originY = item.y;
  interaction.originWidth = item.width;
  interaction.originHeight = item.height;
  interaction.didMove = false;
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", stopInteraction);
};

const handlePointerMove = (event) => {
  if (!interaction.mode || !board.value) return;
  const item = board.value.items.find((entry) => entry.id === interaction.itemId);
  if (!item) return;

  const deltaX = (event.clientX - interaction.startX) / camera.scale;
  const deltaY = (event.clientY - interaction.startY) / camera.scale;

  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
    interaction.didMove = true;
  }

  if (interaction.mode === "drag") {
    item.x = clamp(interaction.originX + deltaX, 0, moodboardsStore.CANVAS_WIDTH - item.width);
    item.y = clamp(interaction.originY + deltaY, 0, moodboardsStore.CANVAS_HEIGHT - item.height);
  }

  if (interaction.mode === "resize") {
    item.width = clamp(interaction.originWidth + deltaX, 80, moodboardsStore.CANVAS_WIDTH - item.x);
    item.height = clamp(
      interaction.originHeight + deltaY,
      60,
      moodboardsStore.CANVAS_HEIGHT - item.y,
    );
  }
};

const stopInteraction = async () => {
  if (!interaction.mode || !board.value) return;
  const item = board.value.items.find((entry) => entry.id === interaction.itemId);
  if (item) {
    await moodboardsStore.updateItem(board.value.id, item.id, {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    });
  }

  if (interaction.didMove) {
    suppressClickUntil.value = Date.now() + 160;
  }

  interaction.mode = "";
  interaction.itemId = "";
  interaction.didMove = false;
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", stopInteraction);
};

const startCanvasPan = (event) => {
  panState.active = true;
  panState.startX = event.clientX;
  panState.startY = event.clientY;
  panState.originX = camera.x;
  panState.originY = camera.y;
  panState.didMove = false;
  cameraAnimationEnabled.value = false;
  window.addEventListener("pointermove", handleCanvasPanMove);
  window.addEventListener("pointerup", stopCanvasPan);
};

const handleCanvasPanMove = (event) => {
  if (!panState.active) return;
  const deltaX = event.clientX - panState.startX;
  const deltaY = event.clientY - panState.startY;
  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
    panState.didMove = true;
  }
  camera.x = panState.originX + deltaX;
  camera.y = panState.originY + deltaY;
};

const stopCanvasPan = () => {
  if (!panState.active) return;
  if (panState.didMove) {
    suppressClickUntil.value = Date.now() + 160;
  }
  panState.active = false;
  panState.didMove = false;
  enableCameraAnimation();
  window.removeEventListener("pointermove", handleCanvasPanMove);
  window.removeEventListener("pointerup", stopCanvasPan);
};

const handleViewportPointerDown = (event) => {
  if (event.target.closest(".floating-panel")) return;
  if (event.target.closest(".canvas-item")) return;
  if (event.button !== 0 && event.button !== 1) return;
  startCanvasPan(event);
};

const handleViewportClick = () => {
  if (Date.now() < suppressClickUntil.value) return;
  clearSelection();
};

const handleViewportWheel = (event) => {
  if (event.ctrlKey || event.metaKey) {
    const factor = Math.exp(-event.deltaY * 0.0018);
    zoomAt(camera.scale * factor, event.clientX, event.clientY, false);
    return;
  }

  setCamera(
    {
      scale: camera.scale,
      x: camera.x - event.deltaX,
      y: camera.y - event.deltaY,
    },
    false,
  );
};

const openCanvasMenu = (event) => {
  if (event.target.closest(".canvas-item")) return;

  showContextMenu(
    event,
    [
      { label: "Add Text", handler: () => addTextItem() },
      { label: "Add Color Block", handler: () => addColorItem() },
      {
        label: "Link App Asset",
        handler: () => {
          showAssetBrowser.value = true;
        },
      },
      { separator: true },
      { label: "Fit Board", handler: () => focusBoard() },
      { label: "Reset Zoom", handler: () => resetZoom() },
      { separator: true },
      { label: "Clear Board", destructive: true, handler: () => clearBoard() },
    ],
    "custom",
  );
};

const openItemMenu = (item, event) => {
  selectedItemId.value = item.id;
  showContextMenu(
    event,
    [
      { label: "Focus Item", handler: () => focusItem(item) },
      ...(item.type === "asset" && item.link
        ? [
            { label: "Open Linked Asset", handler: () => openLinkedAsset(item) },
            { separator: true },
          ]
        : []),
      { label: "Duplicate", handler: () => duplicateSelected() },
      { label: "Bring Forward", handler: () => bringForwardSelected() },
      { label: "Send Backward", handler: () => sendBackwardSelected() },
      { separator: true },
      { label: "Delete", destructive: true, handler: () => deleteSelected() },
    ],
    "custom",
  );
};

const handleKeyDown = (event) => {
  const target = event.target;
  const isTypingField =
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

  if (event.code === "Space" && !isTypingField) {
    event.preventDefault();
    spacePressed.value = true;
  }

  if (isTypingField) return;

  if ((event.metaKey || event.ctrlKey) && event.key === "0") {
    event.preventDefault();
    focusBoard();
  }

  if ((event.metaKey || event.ctrlKey) && event.key === "1") {
    event.preventDefault();
    resetZoom();
  }

  if ((event.metaKey || event.ctrlKey) && (event.key === "=" || event.key === "+")) {
    event.preventDefault();
    zoomIn();
  }

  if ((event.metaKey || event.ctrlKey) && event.key === "-") {
    event.preventDefault();
    zoomOut();
  }
};

const handleKeyUp = (event) => {
  if (event.code === "Space") {
    spacePressed.value = false;
  }
};

const handleWindowResize = () => {
  if (selectedItem.value) {
    focusItem(selectedItem.value, false);
    return;
  }
  focusBoard(false);
};

onMounted(async () => {
  await moodboardsStore.loadMoodboards();
  playlistsStore.loadPlaylists().catch(() => {});
  libraryStore.loadSongs().catch(() => {});
  window.addEventListener("resize", handleWindowResize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  await nextTick();
  focusBoard(false);
});

onUnmounted(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", stopInteraction);
  window.removeEventListener("pointermove", handleCanvasPanMove);
  window.removeEventListener("pointerup", stopCanvasPan);
  window.removeEventListener("resize", handleWindowResize);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});
</script>

<style scoped>
.moodboard-detail-view {
  min-height: 100vh;
  padding: var(--page-gutter) var(--page-gutter) calc(var(--page-gutter) + var(--space-12));
  background: transparent;
  color: var(--color-text);
}

.editor-workspace {
  display: grid;
  gap: var(--section-gap);
}

.editor-header,
.editor-toolbar,
.editor-canvas-shell,
.floating-panel,
.missing-state,
.modal-card {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  color: var(--color-text);
}

.editor-header,
.editor-toolbar,
.editor-canvas-shell,
.missing-state {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-1);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-6);
}

.editor-heading,
.editor-head-actions,
.toolbar-row,
.toolbar-group,
.canvas-meta-row,
.canvas-status,
.canvas-hints,
.panel-head,
.panel-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.editor-heading {
  flex: 1 1 auto;
  align-items: flex-start;
  min-width: 0;
}

.board-title-stack {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.board-title-input,
.panel-search,
.panel-field textarea,
.inspector-grid input {
  width: 100%;
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.84);
  color: var(--color-text);
  font: inherit;
  box-shadow: none;
}

.board-title-input {
  min-width: min(460px, 52vw);
  padding: var(--space-2) 0;
  border: none;
  background: transparent;
  font-size: clamp(36px, 4vw, 56px);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 0.95;
}

.board-title-input:focus {
  outline: none;
}

.board-subtitle {
  margin: 0;
  max-width: 62ch;
  color: var(--color-text-secondary);
  font-size: var(--text-subheading);
}

.editor-head-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.compact-btn {
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  font-size: var(--text-small);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition:
    background-color var(--motion-default),
    border-color var(--motion-default),
    transform var(--motion-default);
}

.ghost-btn:hover,
.create-btn:hover,
.danger-btn:hover {
  transform: translateY(-1px);
}

.create-btn {
  border-color: rgba(200, 75, 17, 0.18);
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.create-btn:hover {
  background: var(--color-accent-hover);
}

.danger-btn {
  border-color: rgba(214, 64, 50, 0.16);
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
}

.editor-toolbar {
  padding: var(--space-4) var(--space-5);
}

.toolbar-row {
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.toolbar-group {
  flex-wrap: wrap;
  min-width: 0;
}

.toolbar-group-add {
  flex: 1 1 auto;
}

.toolbar-group-view {
  justify-content: flex-end;
  flex: 0 1 auto;
}

.toolbar-label {
  color: var(--color-text-tertiary);
  font-size: var(--text-utility);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.toolbar-input {
  width: auto;
  min-width: 220px;
  flex: 0 1 auto;
}

.toolbar-input-text {
  width: min(360px, 30vw);
}

.toolbar-input-url {
  width: min(320px, 26vw);
}

.color-swatch {
  width: var(--control-md);
  min-width: var(--control-md);
  height: var(--control-md);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: transparent;
  overflow: hidden;
  cursor: pointer;
}

.color-swatch::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-swatch::-webkit-color-swatch {
  border: none;
}

.upload-chip {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.upload-chip input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.icon-btn {
  width: var(--control-md);
  padding: 0;
  justify-content: center;
}

.zoom-pill {
  min-width: 72px;
  justify-content: center;
}

.editor-canvas-shell {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
}

.canvas-meta-row {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-small);
}

.canvas-status,
.canvas-hints {
  flex-wrap: wrap;
}

.canvas-hints span + span::before,
.canvas-status span + span::before {
  content: "•";
  margin-right: var(--space-3);
  margin-left: var(--space-1);
  color: var(--color-text-tertiary);
}

.canvas-viewport {
  position: relative;
  overflow: hidden;
  min-height: max(70vh, 780px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background:
    radial-gradient(circle at top left, rgba(232, 90, 25, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 242, 237, 0.84));
  cursor: default;
}

.canvas-grid-shell {
  position: absolute;
  inset: 0;
}

.canvas-camera {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
}

.canvas-camera.is-animated {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.canvas-grid-plane {
  position: absolute;
  background:
    linear-gradient(90deg, rgba(17, 16, 15, 0.045) 1px, transparent 1px),
    linear-gradient(rgba(17, 16, 15, 0.045) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.canvas-stage {
  position: relative;
  background: transparent;
}

.canvas-item {
  position: absolute;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(17, 16, 15, 0.08);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16px 40px rgba(17, 16, 15, 0.1);
  cursor: grab;
  user-select: none;
}

.canvas-item.selected {
  border-color: rgba(232, 90, 25, 0.28);
  box-shadow:
    0 0 0 1px rgba(232, 90, 25, 0.18),
    0 22px 44px rgba(17, 16, 15, 0.14);
}

.canvas-item img,
.color-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-item {
  width: 100%;
  height: 100%;
  padding: var(--space-5);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.12;
  white-space: pre-wrap;
}

.asset-item {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  width: 100%;
  height: 100%;
  padding: var(--space-4);
  border: none;
  background: rgba(255, 255, 255, 0.84);
  color: var(--color-text);
  text-align: left;
}

.asset-thumb {
  height: 72px;
  border-radius: var(--radius-control);
  overflow: hidden;
  background: rgba(17, 16, 15, 0.04);
}

.asset-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 24px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.asset-item strong {
  font-size: var(--text-heading);
  line-height: 1.18;
}

.asset-item p,
.asset-item span {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-small);
}

.resize-handle {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(17, 16, 15, 0.14);
  background: rgba(255, 255, 255, 0.9);
  cursor: nwse-resize;
}

.floating-panels {
  position: absolute;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 4;
  display: grid;
  gap: var(--space-4);
  width: min(360px, calc(100% - var(--space-10)));
  pointer-events: none;
}

.floating-panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-overlay);
  pointer-events: auto;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 246, 241, 0.9)),
    var(--color-surface);
}

.panel-head {
  align-items: flex-start;
  justify-content: space-between;
}

.panel-head h2 {
  margin: 0;
  font-size: var(--text-heading);
}

.panel-head p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-small);
}

.asset-picker-groups,
.asset-group,
.asset-group-list,
.asset-inspector,
.panel-field {
  display: grid;
  gap: var(--space-2);
}

.asset-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.asset-group-head h3 {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-utility);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.asset-link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
}

.asset-link-copy strong,
.asset-inspector strong {
  display: block;
}

.asset-link-copy p,
.asset-inspector p,
.asset-group-empty {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-small);
}

.inspector-grid,
.panel-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.inspector-grid label,
.panel-field {
  display: grid;
  gap: var(--space-1);
}

.inspector-grid span,
.panel-field span,
.asset-inspector span {
  color: var(--color-text-tertiary);
  font-size: var(--text-utility);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-field textarea {
  min-height: 110px;
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
  resize: vertical;
}

.panel-color {
  width: 100%;
  height: 48px;
}

.viewport-zoom-indicator {
  position: absolute;
  left: var(--space-5);
  bottom: var(--space-5);
  z-index: 2;
  min-height: var(--control-sm);
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid rgba(17, 16, 15, 0.08);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text-secondary);
  font-size: var(--text-small);
  display: inline-flex;
  align-items: center;
  box-shadow: var(--shadow-1);
}

.missing-state {
  padding: var(--space-8);
  display: grid;
  gap: var(--space-3);
}

.missing-state h2 {
  margin: 0;
}

.missing-state p {
  margin: 0;
  color: var(--color-text-secondary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(17, 16, 15, 0.18);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  padding: var(--space-6);
}

.modal-card {
  width: min(480px, 100%);
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-overlay);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.modal-head h2,
.confirm-copy strong {
  margin: 0;
}

.modal-head p,
.confirm-copy p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
}

.confirm-copy {
  padding: var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-danger-subtle);
  border: 1px solid rgba(214, 64, 50, 0.14);
}

@media (max-width: 1180px) {
  .editor-header,
  .toolbar-row,
  .canvas-meta-row {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-head-actions {
    justify-content: flex-start;
  }

  .toolbar-group-view {
    justify-content: flex-start;
  }

  .toolbar-input-text,
  .toolbar-input-url {
    width: 100%;
  }
}

@media (max-width: 900px) {
  .moodboard-detail-view {
    padding: var(--space-4) var(--space-4) calc(var(--space-10) + var(--space-6));
  }

  .board-title-input {
    min-width: 100%;
    font-size: clamp(28px, 8vw, 42px);
  }

  .canvas-viewport {
    min-height: 72vh;
  }

  .floating-panels {
    position: static;
    width: 100%;
    padding: var(--space-4);
    margin-top: auto;
  }

  .canvas-viewport {
    display: grid;
    align-content: start;
    gap: var(--space-4);
  }

  .canvas-grid-shell {
    position: relative;
    min-height: 60vh;
  }
}

@media (max-width: 720px) {
  .inspector-grid,
  .panel-actions {
    grid-template-columns: 1fr;
  }

  .toolbar-group-add,
  .toolbar-group-view {
    flex-basis: 100%;
  }
}
</style>
