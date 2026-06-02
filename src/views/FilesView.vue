<template>
  <WorkspacePage
    class="files-page"
    artist-scoped-header
    eyebrow="Documents"
    title="Files"
    :count="totalFileCount"
    subtitle="Organize folders, assets, and shared files in one focused browser."
  >
    <template #actions>
      <div class="header-actions">
        <button class="workspace-header-primary-btn" @click="openCreateFolderModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            ></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          <span>New Folder</span>
        </button>
        <button class="workspace-header-secondary-btn" @click="triggerFileUpload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <span>Upload</span>
        </button>
      </div>
    </template>

    <template #stats>
      <div class="quick-stats">
        <div class="stat-pill">
          <strong>{{ visibleFolderCount }}</strong>
          <span>folders in view</span>
        </div>
        <div class="stat-pill">
          <strong>{{ filteredItems.length }}</strong>
          <span>visible items</span>
        </div>
        <div class="stat-pill">
          <strong>{{ pinnedFolderCount }}</strong>
          <span>pinned folders</span>
        </div>
        <div class="stat-pill">
          <strong>{{ currentFolderLabel }}</strong>
          <span>current location</span>
        </div>
      </div>
    </template>

    <div class="files-view" @contextmenu.prevent="handleWorkspaceMenu">
      <section v-if="showPinnedStrip" class="pinned-strip surface-panel">
        <div class="section-header compact">
          <div class="section-heading">
            <h2 class="section-title-quiet">Pinned Folders</h2>
            <p>Keep important folders at the top of the workspace.</p>
          </div>
        </div>
        <div class="pinned-folders-row">
          <button
            v-for="folder in pinnedRootFolders"
            :key="folder.id"
            class="pinned-folder-chip"
            @click="handleItemClick(folder)"
            @contextmenu.prevent.stop="handleItemMenu(folder, $event)"
          >
            <span class="chip-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                />
              </svg>
            </span>
            <span class="chip-copy">
              <strong>{{ folder.name }}</strong>
              <small>{{ formatDate(folder.modified_at) }}</small>
            </span>
            <span class="chip-pin" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M16 9V4l1-1V2H7v1l1 1v5l-2 2v1h5v7l1 1 1-1v-7h5v-1l-2-2z"
                />
              </svg>
            </span>
          </button>
        </div>
      </section>

      <section class="browser-toolbar surface-panel">
        <div class="finder-toolbar">
          <div class="breadcrumb-section">
            <nav class="breadcrumb">
              <button
                v-for="(crumb, index) in breadcrumbs"
                :key="crumb.path"
                class="breadcrumb-item"
                :class="{ active: index === breadcrumbs.length - 1 }"
                @click="navigateToFolder(crumb.path)"
              >
                <svg v-if="index === 0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                <span>{{ crumb.name }}</span>
                <svg
                  v-if="index < breadcrumbs.length - 1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="breadcrumb-arrow"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </nav>
          </div>

          <div class="controls-section">
            <div class="search-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="search-icon"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search files, folders, and assets..."
                class="search-input"
              />
            </div>

            <div class="filter-group">
              <div class="custom-select">
                <select v-model="sortBy" class="filter-select" @change="setSort(sortBy, true)">
                  <option value="name">Name</option>
                  <option value="date">Date Modified</option>
                  <option value="size">Size</option>
                  <option value="type">Kind</option>
                </select>
              </div>

              <div class="view-toggles segmented-control" role="tablist" aria-label="File views">
                <button
                  v-for="mode in viewModes"
                  :key="mode.value"
                  class="view-toggle"
                  :class="{ active: viewMode === mode.value }"
                  :title="mode.label"
                  @click="viewMode = mode.value"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path :d="mode.icon" />
                  </svg>
                  <span>{{ mode.shortLabel }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="filter-racks">
          <div class="filter-rack">
            <span class="filter-rack-label">Categories</span>
            <div class="filter-chip-group segmented-control">
              <button
                class="filter-chip"
                :class="{ active: selectedCategories.length === 0 }"
                @click="clearCategoryFilters"
              >
                <span>All</span>
              </button>
              <button
                v-for="option in categoryOptions"
                :key="option.value"
                class="filter-chip"
                :class="{ active: selectedCategories.includes(option.value) }"
                @click="toggleCategoryFilter(option.value)"
              >
                <span>{{ option.label }}</span>
                <small>{{ option.count }}</small>
              </button>
            </div>
          </div>

          <div class="filter-rack">
            <span class="filter-rack-label">Types</span>
            <div class="filter-chip-group segmented-control">
              <button
                class="filter-chip"
                :class="{ active: selectedTypes.length === 0 }"
                @click="clearTypeFilters"
              >
                <span>All</span>
              </button>
              <button
                v-for="option in typeOptions"
                :key="option.value"
                class="filter-chip"
                :class="{ active: selectedTypes.includes(option.value) }"
                @click="toggleTypeFilter(option.value)"
              >
                <span>{{ option.label }}</span>
                <small>{{ option.count }}</small>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="file-explorer surface-panel">
        <div v-if="loading" class="loading-state">
          <div class="skeleton-items">
            <div v-for="i in 8" :key="i" class="skeleton-item"></div>
          </div>
        </div>

        <template v-else-if="displayItems.length > 0">
          <div v-if="viewMode === 'list'" class="finder-list">
            <div class="finder-list-header">
              <button
                class="finder-header-btn"
                :class="{ active: sortBy === 'name' }"
                @click="setSort('name')"
              >
                <span>Name</span>
                <svg
                  v-if="sortBy === 'name'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="sort-indicator"
                  :class="{ desc: sortDirection === 'desc' }"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              <button
                class="finder-header-btn"
                :class="{ active: sortBy === 'date' }"
                @click="setSort('date')"
              >
                <span>Date Modified</span>
                <svg
                  v-if="sortBy === 'date'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="sort-indicator"
                  :class="{ desc: sortDirection === 'desc' }"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              <button
                class="finder-header-btn"
                :class="{ active: sortBy === 'type' }"
                @click="setSort('type')"
              >
                <span>Kind</span>
                <svg
                  v-if="sortBy === 'type'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="sort-indicator"
                  :class="{ desc: sortDirection === 'desc' }"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              <button
                class="finder-header-btn align-end"
                :class="{ active: sortBy === 'size' }"
                @click="setSort('size')"
              >
                <span>Size</span>
                <svg
                  v-if="sortBy === 'size'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="sort-indicator"
                  :class="{ desc: sortDirection === 'desc' }"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              <span class="finder-header-spacer"></span>
            </div>

            <button
              v-for="item in displayItems"
              :key="item.id"
              class="finder-row"
              :class="{ folder: item.type === 'folder', pinned: item.pinned }"
              @click="handleItemClick(item)"
              @contextmenu.prevent.stop="handleItemMenu(item, $event)"
            >
              <span class="finder-name-cell">
                <span class="item-icon" :class="`type-${item.type}`">
                  <svg v-if="item.type === 'folder'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                    />
                  </svg>
                  <svg v-else-if="item.type === 'audio'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                    />
                  </svg>
                  <svg v-else-if="item.type === 'video'" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg v-else-if="item.type === 'image'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                    />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </span>
                <span class="finder-name-copy">
                  <strong>{{ item.name }}</strong>
                  <small v-if="item.pinned" class="pinned-label">Pinned</small>
                </span>
              </span>

              <span class="finder-meta-cell modified">{{ formatDate(item.modified_at) }}</span>
              <span class="finder-meta-cell kind">{{ getKindLabel(item) }}</span>
              <span class="finder-meta-cell size">
                {{ item.type === "folder" ? "—" : formatFileSize(item.size) }}
              </span>

              <span class="finder-actions-cell">
                <button
                  v-if="item.type === 'folder'"
                  class="row-action pin"
                  :title="item.pinned ? 'Unpin folder' : 'Pin folder'"
                  @click.stop="togglePin(item)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M16 9V4l1-1V2H7v1l1 1v5l-2 2v1h5v7l1 1 1-1v-7h5v-1l-2-2z"
                    />
                  </svg>
                </button>
                <button class="row-action" title="Download" @click.stop="downloadItem(item)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                </button>
                <button class="row-action" title="More" @click.stop="handleItemMenu(item, $event)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </span>
            </button>
          </div>

          <div v-else-if="viewMode === 'folders'" class="folder-browser collection-grid-compact">
            <button
              v-for="item in displayItems"
              :key="item.id"
              class="folder-card surface-panel surface-panel-hover"
              :class="{ folder: item.type === 'folder' }"
              @click="handleItemClick(item)"
              @contextmenu.prevent.stop="handleItemMenu(item, $event)"
            >
              <div class="folder-card-top">
                <span class="folder-card-icon" :class="`type-${item.type}`">
                  <svg v-if="item.type === 'folder'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                    />
                  </svg>
                  <svg v-else-if="item.type === 'audio'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                    />
                  </svg>
                  <svg v-else-if="item.type === 'video'" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg v-else-if="item.type === 'image'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                    />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </span>

                <button
                  v-if="item.type === 'folder'"
                  class="folder-pin"
                  :class="{ active: item.pinned }"
                  :title="item.pinned ? 'Unpin folder' : 'Pin folder'"
                  @click.stop="togglePin(item)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M16 9V4l1-1V2H7v1l1 1v5l-2 2v1h5v7l1 1 1-1v-7h5v-1l-2-2z"
                    />
                  </svg>
                </button>
              </div>

              <div class="folder-card-copy">
                <strong>{{ item.name }}</strong>
                <span>{{ getKindLabel(item) }}</span>
                <small>{{ formatDate(item.modified_at) }}</small>
              </div>
            </button>
          </div>

          <div v-else class="preview-browser">
            <div class="preview-rail">
              <button
                v-for="item in displayItems"
                :key="item.id"
                class="preview-card surface-panel surface-panel-hover"
                :class="{ folder: item.type === 'folder' }"
                @click="handleItemClick(item)"
                @contextmenu.prevent.stop="handleItemMenu(item, $event)"
              >
                <div class="preview-art" :class="`type-${item.type}`">
                  <svg v-if="item.type === 'folder'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                    />
                  </svg>
                  <svg v-else-if="item.type === 'audio'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                    />
                  </svg>
                  <svg v-else-if="item.type === 'video'" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg v-else-if="item.type === 'image'" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                    />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>

                <div class="preview-copy">
                  <strong>{{ item.name }}</strong>
                  <span>{{ getKindLabel(item) }}</span>
                  <small>{{ item.type === "folder" ? "Pinned browser slot" : formatFileSize(item.size) }}</small>
                </div>
              </button>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <div class="empty-illustration">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 120h100v60H50z"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M40 110h120v70H40z"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                opacity="0.3"
              />
              <path
                d="M60 100l15-15h45l15 15v50H60z"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </div>
          <h3 class="empty-title">{{ searchQuery ? "No files found" : "This folder is empty" }}</h3>
          <p class="empty-text">
            {{
              searchQuery
                ? "Try adjusting the search or filter settings."
                : "Create a folder or upload new files to start organizing the workspace."
            }}
          </p>
          <div v-if="!searchQuery" class="empty-actions">
            <button class="action-btn" @click="openCreateFolderModal">
              <span>Create Folder</span>
            </button>
            <button class="action-btn primary" @click="triggerFileUpload">
              <span>Upload Files</span>
            </button>
          </div>
        </div>
      </div>

      <input ref="fileInput" type="file" multiple class="hidden-input" @change="handleFileUpload" />

      <teleport to="body">
        <transition name="fade">
          <div v-if="fileModalOpen" class="modal-overlay" @click.self="closeFileModal">
            <div class="modal-card">
              <div class="modal-head">
                <div>
                  <h2>{{ fileModalMode === "create-folder" ? "Create Folder" : "Rename Item" }}</h2>
                  <p>
                    {{
                      fileModalMode === "create-folder"
                        ? "Create a new folder in the current location."
                        : "Update the item name without leaving this view."
                    }}
                  </p>
                </div>
                <button class="modal-close" @click="closeFileModal">×</button>
              </div>

              <form class="modal-form" @submit.prevent="submitFileModal">
                <label>
                  <span>{{ fileModalMode === "create-folder" ? "Folder Name" : "Item Name" }}</span>
                  <input
                    v-model.trim="fileDraft.name"
                    type="text"
                    :placeholder="
                      fileModalMode === 'create-folder' ? 'Press assets' : 'Updated file name'
                    "
                    required
                    autofocus
                  />
                </label>
                <div class="modal-actions">
                  <button type="button" class="ghost-btn" @click="closeFileModal">Cancel</button>
                  <button type="submit" class="primary-btn">
                    {{ fileModalMode === "create-folder" ? "Create Folder" : "Save Name" }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>

        <transition name="fade">
          <div v-if="deleteModalOpen" class="modal-overlay" @click.self="closeDeleteModal">
            <div class="modal-card delete-modal">
              <div class="modal-head">
                <div>
                  <h2>Delete Item</h2>
                  <p>This action removes the item from the current workspace.</p>
                </div>
                <button class="modal-close" @click="closeDeleteModal">×</button>
              </div>

              <div class="delete-copy">
                <strong>{{ pendingDeleteItem?.name }}</strong>
                <p>
                  {{ pendingDeleteItem?.type === "folder" ? "Folder" : "File" }} items can’t be
                  restored in demo mode.
                </p>
              </div>

              <div class="modal-actions">
                <button type="button" class="ghost-btn" @click="closeDeleteModal">Cancel</button>
                <button type="button" class="danger-btn" @click="confirmDeleteItem">Delete</button>
              </div>
            </div>
          </div>
        </transition>
      </teleport>
    </div>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { apiService } from "@/shared/services/api";
import { useDashboardStore } from "@/stores/dashboard";

const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});
const route = useRoute();
const dashboardStore = useDashboardStore();

const loading = ref(true);
const items = ref([]);
const currentPath = ref("/");
const searchQuery = ref("");
const sortBy = ref("name");
const sortDirection = ref("asc");
const selectedTypes = ref([]);
const selectedCategories = ref([]);
const viewMode = ref("list");
const fileInput = ref(null);
const fileModalOpen = ref(false);
const fileModalMode = ref("create-folder");
const selectedItem = ref(null);
const deleteModalOpen = ref(false);
const pendingDeleteItem = ref(null);
const fileDraft = reactive({
  name: "",
});

const viewModes = [
  {
    value: "list",
    label: "List View",
    shortLabel: "List",
    icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
  },
  {
    value: "folders",
    label: "Folders View",
    shortLabel: "Folders",
    icon: "M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  {
    value: "preview",
    label: "Preview View",
    shortLabel: "Preview",
    icon: "M3 5h18v14H3zm3 3v8h12V8zm2 1.5a1.5 1.5 0 1 0 0 .01zM8 15l2.5-3 2 2.5 2.5-3.5 3 4z",
  },
];

const scopedArtistSlug = computed(() =>
  typeof route.query.artist === "string" ? route.query.artist : "",
);

const scopedArtist = computed(() =>
  (dashboardStore.artists || []).find(
    (artist) => artist.slug === scopedArtistSlug.value || String(artist.id) === scopedArtistSlug.value,
  ) || null,
);

const scopedItems = computed(() => {
  if (!scopedArtist.value) return items.value;
  return items.value.filter(
    (item) => !item.artist_id || String(item.artist_id) === String(scopedArtist.value.id),
  );
});

const visibleItems = computed(() =>
  scopedItems.value.filter((item) => (item.parentPath || "/") === currentPath.value),
);

const breadcrumbs = computed(() => {
  const paths = currentPath.value.split("/").filter(Boolean);
  const crumbs = [{ name: "Home", path: "/" }];
  let runningPath = "";

  paths.forEach((segment) => {
    runningPath += `/${segment}`;
    crumbs.push({ name: segment, path: runningPath });
  });

  return crumbs;
});

const getCategoryLabel = (item) => {
  if (item.parentPath === "/" || !item.parentPath) {
    return item.type === "folder" ? item.name : "Home";
  }

  const firstSegment = item.path?.split("/").filter(Boolean)[0];
  const rootFolder = scopedItems.value.find(
    (entry) => entry.type === "folder" && entry.parentPath === "/" && entry.path === `/${firstSegment}`,
  );

  return rootFolder?.name || "Home";
};

const categoryOptions = computed(() => {
  const counts = new Map();
  visibleItems.value.forEach((item) => {
    const category = getCategoryLabel(item);
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([label, count]) => ({
    value: label,
    label,
    count,
  }));
});

const typeOptions = computed(() => {
  const definitions = [
    { value: "folder", label: "Folders" },
    { value: "audio", label: "Audio" },
    { value: "image", label: "Images" },
    { value: "video", label: "Video" },
    { value: "document", label: "Documents" },
  ];

  return definitions
    .map((definition) => ({
      ...definition,
      count: visibleItems.value.filter((item) => item.type === definition.value).length,
    }))
    .filter((definition) => definition.count > 0);
});

const filteredItems = computed(() => {
  let result = [...visibleItems.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((item) => item.name.toLowerCase().includes(query));
  }

  if (selectedCategories.value.length) {
    result = result.filter((item) => selectedCategories.value.includes(getCategoryLabel(item)));
  }

  if (selectedTypes.value.length) {
    result = result.filter((item) => selectedTypes.value.includes(item.type));
  }

  const sortComparator = (a, b) => {
    switch (sortBy.value) {
      case "date":
        return new Date(a.modified_at) - new Date(b.modified_at);
      case "size":
        return (a.size || 0) - (b.size || 0);
      case "type":
        return getKindLabel(a).localeCompare(getKindLabel(b));
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  };

  result.sort((a, b) => {
    const bucket = (item) => {
      if (item.type === "folder" && item.pinned) return 0;
      if (item.type === "folder") return 1;
      return 2;
    };

    const bucketDiff = bucket(a) - bucket(b);
    if (bucketDiff !== 0) return bucketDiff;
    const direction = sortDirection.value === "asc" ? 1 : -1;
    return sortComparator(a, b) * direction;
  });

  return result;
});

const pinnedRootFolders = computed(() =>
  scopedItems.value.filter((item) => item.type === "folder" && item.pinned && item.parentPath === "/"),
);

const showPinnedStrip = computed(
  () =>
    currentPath.value === "/" &&
    !searchQuery.value &&
    selectedTypes.value.length === 0 &&
    selectedCategories.value.length === 0 &&
    pinnedRootFolders.value.length > 0,
);

const displayItems = computed(() => {
  if (!showPinnedStrip.value) return filteredItems.value;
  return filteredItems.value.filter((item) => !(item.type === "folder" && item.pinned && item.parentPath === "/"));
});

const totalFileCount = computed(() => scopedItems.value.filter((item) => item.type !== "folder").length);
const visibleFolderCount = computed(() => visibleItems.value.filter((item) => item.type === "folder").length);
const pinnedFolderCount = computed(() => scopedItems.value.filter((item) => item.type === "folder" && item.pinned).length);
const currentFolderLabel = computed(() => breadcrumbs.value[breadcrumbs.value.length - 1]?.name || "Home");

const setSort = (column, reset = false) => {
  if (sortBy.value === column && !reset) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    return;
  }

  sortBy.value = column;
  sortDirection.value = column === "date" || column === "size" ? "desc" : "asc";
};

const toggleValue = (bucket, value) => {
  bucket.value = bucket.value.includes(value)
    ? bucket.value.filter((entry) => entry !== value)
    : [...bucket.value, value];
};

const toggleTypeFilter = (value) => toggleValue(selectedTypes, value);
const toggleCategoryFilter = (value) => toggleValue(selectedCategories, value);
const clearTypeFilters = () => {
  selectedTypes.value = [];
};
const clearCategoryFilters = () => {
  selectedCategories.value = [];
};

const getArtistId = (index) => (dashboardStore.artists || [])[index]?.id || `artist-${index + 1}`;

const createMockItems = () => [
  {
    id: "folder-audio",
    name: "Audio Files",
    type: "folder",
    pinned: true,
    artist_id: getArtistId(0),
    path: "/audio-files",
    parentPath: "/",
    modified_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "folder-images",
    name: "Images",
    type: "folder",
    pinned: true,
    artist_id: getArtistId(0),
    path: "/images",
    parentPath: "/",
    modified_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "folder-videos",
    name: "Videos",
    type: "folder",
    pinned: false,
    artist_id: getArtistId(0),
    path: "/videos",
    parentPath: "/",
    modified_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "folder-docs",
    name: "Contracts",
    type: "folder",
    pinned: false,
    artist_id: getArtistId(0),
    path: "/contracts",
    parentPath: "/",
    modified_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "file-root-brief",
    name: "Campaign Brief.pdf",
    type: "document",
    artist_id: getArtistId(0),
    size: 1840000,
    path: "/campaign-brief.pdf",
    parentPath: "/",
    modified_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "file-audio-demo",
    name: "Midnight Dreams Master.wav",
    type: "audio",
    artist_id: getArtistId(0),
    size: 38100000,
    path: "/audio-files/midnight-dreams-master.wav",
    parentPath: "/audio-files",
    modified_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "file-audio-alt",
    name: "Vocal Comp 03.aif",
    type: "audio",
    artist_id: getArtistId(0),
    size: 22800000,
    path: "/audio-files/vocal-comp-03.aif",
    parentPath: "/audio-files",
    modified_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: "file-audio-notes",
    name: "Session Notes.txt",
    type: "document",
    artist_id: getArtistId(0),
    size: 4200,
    path: "/audio-files/session-notes.txt",
    parentPath: "/audio-files",
    modified_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "file-image-cover",
    name: "Cover Art.jpg",
    type: "image",
    artist_id: getArtistId(0),
    size: 4100000,
    path: "/images/cover-art.jpg",
    parentPath: "/images",
    modified_at: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: "file-image-press",
    name: "Press Shot.png",
    type: "image",
    artist_id: getArtistId(0),
    size: 6100000,
    path: "/images/press-shot.png",
    parentPath: "/images",
    modified_at: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: "file-video-bts",
    name: "Behind The Scenes.mov",
    type: "video",
    artist_id: getArtistId(0),
    size: 286000000,
    path: "/videos/behind-the-scenes.mov",
    parentPath: "/videos",
    modified_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "file-contract-deal",
    name: "Distribution Deal.pdf",
    type: "document",
    artist_id: getArtistId(0),
    size: 980000,
    path: "/contracts/distribution-deal.pdf",
    parentPath: "/contracts",
    modified_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const loadItems = async (path = currentPath.value) => {
  try {
    loading.value = true;
    currentPath.value = path;

    if (!items.value.length) {
      items.value = createMockItems();
    }
  } catch (error) {
    console.error("Failed to load files:", error);
    showToast({ message: "Failed to load files", type: "error" });
  } finally {
    loading.value = false;
  }
};

const joinPath = (base, segment) => {
  const safeSegment = segment.trim().replace(/\//g, "-");
  if (!safeSegment) return base;
  if (base === "/") return `/${safeSegment}`;
  return `${base}/${safeSegment}`;
};

const handleItemClick = (item) => {
  if (item.type === "folder") {
    navigateToFolder(item.path);
    return;
  }

  if (item.url) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }

  showToast({ message: `Preview unavailable for ${item.name}`, type: "info" });
};

const navigateToFolder = (path) => {
  loadItems(path);
};

const togglePin = (item) => {
  if (item.type !== "folder") return;
  item.pinned = !item.pinned;
  showToast({
    message: item.pinned ? `Pinned ${item.name}` : `Removed ${item.name} from pinned folders`,
    type: "success",
  });
};

const handleItemMenu = (item, event) => {
  const pinItem =
    item.type === "folder"
      ? [
          {
            label: item.pinned ? "Unpin Folder" : "Pin Folder",
            handler: () => togglePin(item),
          },
          { separator: true },
        ]
      : [];

  showContextMenu(
    event,
    [
      {
        label: item.type === "folder" ? "Open Folder" : "Open",
        handler: () => handleItemClick(item),
      },
      ...pinItem,
      { label: "Rename", handler: () => openRenameItemModal(item) },
      { label: "Duplicate", handler: () => duplicateItem(item) },
      { label: "Copy Path", handler: () => copyItemPath(item) },
      { separator: true },
      { label: "Download", handler: () => downloadItem(item) },
      { separator: true },
      { label: "Delete", destructive: true, handler: () => deleteItem(item) },
    ],
    "custom",
  );
};

const handleWorkspaceMenu = (event) => {
  if (event.target.closest(".finder-row") || event.target.closest(".folder-card") || event.target.closest(".preview-card") || event.target.closest(".context-menu")) {
    return;
  }

  showContextMenu(
    event,
    [
      { label: "New Folder", handler: () => openCreateFolderModal() },
      { label: "Upload Files", handler: () => triggerFileUpload() },
      { separator: true },
      { label: "List View", handler: () => (viewMode.value = "list") },
      { label: "Folders View", handler: () => (viewMode.value = "folders") },
      { label: "Preview View", handler: () => (viewMode.value = "preview") },
      { separator: true },
      { label: "Sort by Name", handler: () => setSort("name", true) },
      { label: "Sort by Date Modified", handler: () => setSort("date", true) },
      { label: "Sort by Size", handler: () => setSort("size", true) },
      { separator: true },
      { label: "Refresh", handler: () => loadItems(currentPath.value) },
    ],
    "custom",
  );
};

const openCreateFolderModal = () => {
  fileModalMode.value = "create-folder";
  selectedItem.value = null;
  fileDraft.name = "";
  fileModalOpen.value = true;
};

const openRenameItemModal = (item) => {
  selectedItem.value = item;
  fileModalMode.value = "rename";
  fileDraft.name = item?.name || "";
  fileModalOpen.value = true;
};

const closeFileModal = () => {
  fileModalOpen.value = false;
  selectedItem.value = null;
  fileDraft.name = "";
};

const submitFileModal = () => {
  const nextName = fileDraft.name.trim();
  if (!nextName) return;

  if (fileModalMode.value === "create-folder") {
    items.value.unshift({
      id: `folder-${Date.now()}`,
      name: nextName,
      type: "folder",
      pinned: false,
      artist_id: scopedArtist.value?.id || null,
      path: joinPath(currentPath.value, nextName.toLowerCase().replace(/\s+/g, "-")),
      parentPath: currentPath.value,
      modified_at: new Date().toISOString(),
    });
    showToast({ message: `Created folder: ${nextName}`, type: "success" });
    closeFileModal();
    return;
  }

  if (!selectedItem.value || nextName === selectedItem.value.name) {
    closeFileModal();
    return;
  }

  selectedItem.value.name = nextName;
  selectedItem.value.modified_at = new Date().toISOString();
  showToast({ message: `Renamed to ${nextName}`, type: "success" });
  closeFileModal();
};

const duplicateFileName = (name) => {
  const parts = name.split(".");
  if (parts.length === 1) return `${name} Copy`;
  const extension = parts.pop();
  return `${parts.join(".")} Copy.${extension}`;
};

const duplicateItem = (item) => {
  const nextName = item.type === "folder" ? `${item.name} Copy` : duplicateFileName(item.name);
  items.value.unshift({
    ...item,
    id: `${item.id}-copy-${Date.now()}`,
    name: nextName,
    pinned: false,
    path: item.type === "folder" ? joinPath(currentPath.value, `${item.name.toLowerCase().replace(/\s+/g, "-")}-copy`) : joinPath(currentPath.value, nextName),
    parentPath: currentPath.value,
    modified_at: new Date().toISOString(),
  });

  showToast({ message: `Duplicated ${item.name}`, type: "success" });
};

const deleteItem = (item) => {
  pendingDeleteItem.value = item;
  deleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  deleteModalOpen.value = false;
  pendingDeleteItem.value = null;
};

const confirmDeleteItem = () => {
  if (!pendingDeleteItem.value) return;
  const target = pendingDeleteItem.value;
  items.value = items.value.filter((entry) => entry.id !== target.id);
  showToast({ message: `Deleted ${target.name}`, type: "success" });
  closeDeleteModal();
};

const copyItemPath = async (item) => {
  try {
    await navigator.clipboard.writeText(item.path || item.name);
    showToast({ message: "Path copied", type: "success" });
  } catch {
    showToast({ message: item.path || item.name, type: "info" });
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event) => {
  const uploadedFiles = event.target.files;
  if (!uploadedFiles.length) return;

  try {
    const fallbackArtistId = dashboardStore.artists?.[0]?.id || null;
    const activeArtistId = scopedArtist.value?.id || fallbackArtistId;
    const destination =
      currentPath.value === "/" ? "home" : currentPath.value.replace(/^\/+/, "").replace(/\/+/g, "/");

    for (const file of uploadedFiles) {
      const uploadResponse = activeArtistId
        ? await apiService.uploadArtistMedia(activeArtistId, file, {
            title: file.name,
            description: "Uploaded from Files workspace",
            destination,
            source: "web-files",
          })
        : await apiService.uploadFile("media", file, null, {
            publicUrl: false,
            signedUrlExpires: 60 * 60 * 24 * 7,
          });
      if (uploadResponse?.error) {
        throw uploadResponse.error;
      }

      const uploadData = uploadResponse?.data || {};
      const uploadURL =
        uploadData.url ||
        uploadData.signedUrl ||
        uploadData.publicUrl ||
        (typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : null);
      const filePath = uploadData.file_path || uploadData.path || joinPath(currentPath.value, file.name);

      items.value.unshift({
        id: uploadData.id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        type: getFileType(file.type),
        artist_id: activeArtistId,
        size: file.size,
        path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        parentPath: currentPath.value,
        url: uploadURL,
        modified_at: new Date().toISOString(),
      });
    }

    showToast({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      type: "success",
    });
    event.target.value = "";
  } catch (error) {
    console.error("Upload failed:", error);
    showToast({ message: "Upload failed", type: "error" });
  }
};

const getFileType = (mimeType) => {
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  return "document";
};

const getKindLabel = (item) => {
  switch (item.type) {
    case "folder":
      return "Folder";
    case "audio":
      return "Audio";
    case "video":
      return "Video";
    case "image":
      return "Image";
    default:
      return "Document";
  }
};

const downloadItem = (item) => {
  if (item.type === "folder") {
    const folderPrefix = item.path.endsWith("/") ? item.path : `${item.path}/`;
    const folderItems = items.value.filter((entry) => entry.path?.startsWith(folderPrefix));
    const manifest = [
      `Folder: ${item.name}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      ...folderItems.map((entry) => `${getKindLabel(entry)}  ${entry.name}`),
    ].join("\n");

    const blob = new Blob([manifest], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.name}-manifest.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast({ message: `Downloaded ${item.name} manifest`, type: "success" });
    return;
  }

  if (item.url) {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  showToast({ message: `Downloading ${item.name}`, type: "info" });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

onMounted(() => {
  loadItems("/");
});
</script>

<style scoped>
.files-view {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

.quick-stats {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--control-sm);
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text-secondary);
}

.stat-pill strong {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
}

.finder-toolbar {
  display: grid;
  gap: var(--space-4);
}

.browser-toolbar {
  display: grid;
  gap: var(--space-4);
}

.filter-racks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 20px;
  padding: 4px 8px 4px 22px;
}

.filter-rack {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1 1 420px;
}

.filter-rack-label {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-chip-group {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  overflow-x: auto;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-sm);
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
  transition:
    background var(--motion-default),
    color var(--motion-default);
}

.filter-chip:hover {
  color: var(--color-text);
}

.filter-chip.active {
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-text);
}

.filter-chip small {
  color: var(--color-text-tertiary);
  font-size: var(--text-small);
  font-weight: var(--weight-semibold);
}

.filter-chip.active small {
  color: var(--color-accent);
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--control-sm);
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
  transition: background var(--motion-default), color var(--motion-default);
}

.breadcrumb-item:hover:not(.active) {
  background: rgba(19, 18, 17, 0.04);
  color: var(--color-text);
}

.breadcrumb-item.active {
  color: var(--color-text);
}

.breadcrumb-item svg,
.breadcrumb-arrow {
  width: 14px;
  height: 14px;
}

.controls-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1 1 320px;
  min-width: min(100%, 320px);
}

.search-input {
  width: 100%;
  min-height: var(--control-md);
  padding: 0 16px 0 42px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text);
  font: inherit;
}

.search-input::placeholder,
.search-icon {
  color: var(--color-text-tertiary);
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-border-strong);
  box-shadow: 0 0 0 1px rgba(19, 18, 17, 0.05);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  width: 18px;
  height: 18px;
  transform: translateY(-50%);
  pointer-events: none;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-select {
  min-width: 136px;
  min-height: var(--control-md);
  padding: 0 34px 0 var(--control-px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text);
  font: inherit;
  appearance: none;
}

.view-toggles {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-control) + 4px);
  background: rgba(255, 255, 255, 0.78);
}

.view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--control-sm);
  padding: 0 10px;
  border: none;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
  transition: background var(--motion-default), color var(--motion-default);
}

.view-toggle.active {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.view-toggle svg {
  width: 15px;
  height: 15px;
}

.view-toggle span {
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
}

.pinned-strip,
.file-explorer {
  padding: var(--space-4);
}

.pinned-strip {
  display: grid;
  gap: var(--space-3);
}

.section-header.compact {
  margin: 0;
}

.section-header.compact p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-small);
}

.pinned-folders-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
}

.pinned-folder-chip {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 56px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-control) + 4px);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--motion-default), background var(--motion-default), transform var(--motion-default);
}

.pinned-folder-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(200, 75, 17, 0.18);
  background: rgba(200, 75, 17, 0.06);
}

.chip-icon,
.chip-pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  flex-shrink: 0;
}

.chip-icon {
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-accent);
}

.chip-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.chip-copy strong {
  font-size: var(--text-body);
  color: var(--color-text);
}

.chip-copy small {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
}

.chip-pin {
  margin-left: auto;
  color: var(--color-text-tertiary);
}

.loading-state {
  display: grid;
  gap: var(--space-3);
}

.skeleton-items {
  display: grid;
  gap: var(--space-2);
}

.skeleton-item {
  height: 46px;
  border-radius: calc(var(--radius-control) + 2px);
  background: rgba(19, 18, 17, 0.05);
  animation: skeleton 1.25s ease-in-out infinite alternate;
}

@keyframes skeleton {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}

.finder-list {
  display: grid;
  gap: 2px;
}

.finder-list-header,
.finder-row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 190px 140px 100px 108px;
  align-items: center;
  gap: var(--space-3);
}

.finder-list-header {
  padding: 0 12px 8px;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border);
}

.finder-header-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  text-align: left;
}

.finder-header-btn.active {
  color: var(--color-text-secondary);
}

.finder-header-btn.align-end {
  justify-content: flex-end;
  text-align: right;
}

.finder-header-spacer {
  width: 100%;
}

.sort-indicator {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.sort-indicator.desc {
  transform: rotate(180deg);
}

.finder-row {
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: calc(var(--radius-control) + 2px);
  background: rgba(255, 255, 255, 0.55);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background var(--motion-default), border-color var(--motion-default);
}

.finder-row:hover {
  border-color: rgba(200, 75, 17, 0.18);
  background: rgba(200, 75, 17, 0.05);
}

.finder-row.pinned {
  background: rgba(255, 255, 255, 0.74);
}

.finder-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(19, 18, 17, 0.05);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.item-icon svg,
.folder-card-icon svg,
.preview-art svg {
  width: 18px;
  height: 18px;
}

.item-icon.type-folder,
.folder-card-icon.type-folder,
.preview-art.type-folder {
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-accent);
}

.item-icon.type-image,
.folder-card-icon.type-image,
.preview-art.type-image {
  background: rgba(200, 75, 17, 0.08);
  color: var(--color-accent);
}

.item-icon.type-audio,
.folder-card-icon.type-audio,
.preview-art.type-audio {
  background: rgba(159, 128, 92, 0.12);
  color: #8f6b45;
}

.item-icon.type-video,
.folder-card-icon.type-video,
.preview-art.type-video {
  background: rgba(192, 57, 43, 0.1);
  color: var(--color-danger);
}

.finder-name-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.finder-name-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-body);
}

.pinned-label {
  color: var(--color-text-tertiary);
  font-size: var(--text-small);
}

.finder-meta-cell {
  display: flex;
  align-items: center;
  width: 100%;
  color: var(--color-text-secondary);
  font-size: var(--text-small);
  white-space: nowrap;
}

.finder-meta-cell.modified,
.finder-meta-cell.kind {
  justify-self: stretch;
  justify-content: flex-start;
  text-align: left;
}

.finder-meta-cell.size {
  justify-self: stretch;
  justify-content: flex-end;
  text-align: right;
}

.finder-actions-cell {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(19, 18, 17, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-default), color var(--motion-default);
}

.row-action:hover,
.row-action.pin.active {
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-accent);
}

.row-action svg {
  width: 14px;
  height: 14px;
}

.folder-browser {
  align-items: start;
}

.folder-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: 152px;
  border: none;
  cursor: pointer;
  text-align: left;
}

.folder-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.folder-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(19, 18, 17, 0.05);
}

.folder-pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(19, 18, 17, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.folder-pin.active,
.folder-pin:hover {
  color: var(--color-accent);
  background: rgba(200, 75, 17, 0.1);
}

.folder-card-copy {
  display: grid;
  gap: 4px;
}

.folder-card-copy strong {
  font-size: var(--text-heading);
  color: var(--color-text);
}

.folder-card-copy span,
.folder-card-copy small {
  color: var(--color-text-secondary);
}

.preview-browser {
  overflow: hidden;
}

.preview-rail {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
}

.preview-card {
  flex: 0 0 min(320px, 78vw);
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  cursor: pointer;
  text-align: left;
  border: none;
  scroll-snap-align: start;
}

.preview-art {
  display: grid;
  place-items: center;
  height: 180px;
  border-radius: calc(var(--radius-card) - 4px);
  background: rgba(19, 18, 17, 0.05);
}

.preview-art svg {
  width: 32px;
  height: 32px;
}

.preview-copy {
  display: grid;
  gap: 6px;
}

.preview-copy strong {
  font-size: clamp(18px, 2vw, 22px);
  color: var(--color-text);
}

.preview-copy span,
.preview-copy small {
  color: var(--color-text-secondary);
}

.empty-state {
  display: grid;
  place-items: center;
  gap: var(--space-3);
  min-height: 280px;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  color: var(--color-text-tertiary);
}

.empty-title {
  margin: 0;
  color: var(--color-text);
}

.empty-text {
  margin: 0;
  max-width: 360px;
  color: var(--color-text-secondary);
}

.empty-actions {
  display: inline-flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
}

.action-btn.primary {
  border-color: rgba(200, 75, 17, 0.16);
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.hidden-input {
  display: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 15, 18, 0.2);
  backdrop-filter: blur(12px);
}

.modal-card {
  width: min(520px, calc(100vw - 32px));
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: var(--shadow-overlay);
}

.delete-modal {
  width: min(460px, calc(100vw - 32px));
}

.modal-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.modal-head h2,
.delete-copy strong {
  margin: 0;
  color: var(--color-text);
}

.modal-head p,
.delete-copy p {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
}

.modal-close,
.ghost-btn,
.primary-btn,
.danger-btn {
  border-radius: var(--radius-pill);
  cursor: pointer;
  font: inherit;
}

.modal-close {
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.84);
  color: var(--color-text);
  font-size: 22px;
}

.modal-form {
  display: grid;
  gap: var(--space-4);
}

.modal-form label {
  display: grid;
  gap: var(--space-2);
}

.modal-form span {
  color: var(--color-text-secondary);
  font-size: var(--text-caption);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-form input {
  width: 100%;
  min-height: var(--control-md);
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  font: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.ghost-btn,
.primary-btn,
.danger-btn {
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border: 1px solid var(--color-border);
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-text);
}

.primary-btn {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-color: rgba(200, 75, 17, 0.16);
}

.danger-btn {
  background: rgba(192, 57, 43, 0.1);
  color: var(--color-danger);
  border-color: rgba(192, 57, 43, 0.16);
}

.delete-copy {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-control) + 4px);
  background: rgba(255, 255, 255, 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--motion-default);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .controls-section,
  .filter-group {
    width: 100%;
  }

  .finder-list-header,
  .finder-row {
    grid-template-columns: minmax(220px, 1fr) 150px 110px 84px 108px;
  }
}

@media (max-width: 720px) {
  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    justify-content: space-between;
  }

  .filter-racks,
  .filter-rack {
    display: grid;
    align-items: stretch;
  }

  .filter-chip-group {
    padding-bottom: 6px;
  }

  .view-toggle span {
    display: none;
  }

  .finder-list-header {
    display: none;
  }

  .finder-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "name actions"
      "meta meta";
    gap: 6px 12px;
  }

  .finder-name-cell {
    grid-area: name;
  }

  .finder-actions-cell {
    grid-area: actions;
  }

  .finder-meta-cell {
    grid-area: meta;
    display: inline-flex;
    gap: 10px;
  }

  .finder-meta-cell.size {
    text-align: left;
  }

  .pinned-folders-row {
    grid-template-columns: 1fr;
  }
}
</style>
