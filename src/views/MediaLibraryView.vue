<template>
  <WorkspacePage
    class="media-library-view"
    artist-scoped-header
    eyebrow="Assets"
    title="Media Library"
    :count="totalFiles"
    subtitle="Manage your audio, video, and image files"
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="triggerFileUpload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span>Upload Files</span>
      </button>
    </template>

    <template #stats>
      <div class="stat-item">
        <div class="stat-value">{{ audioFiles.length }}</div>
        <div class="stat-label">Audio Files</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">{{ videoFiles.length }}</div>
        <div class="stat-label">Video Files</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">{{ imageFiles.length }}</div>
        <div class="stat-label">Images</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">{{ formatFileSize(totalSize) }}</div>
        <div class="stat-label">Total Size</div>
      </div>
    </template>

    <template #toolbar>
      <div class="search-container">
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
            placeholder="Search files by name or type..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <div class="custom-select">
          <select v-model="filterType" class="filter-select">
            <option value="">All Types</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="image">Images</option>
          </select>
        </div>

        <div class="custom-select">
          <select v-model="sortBy" class="filter-select">
            <option value="name">Name</option>
            <option value="date">Date Added</option>
            <option value="size">File Size</option>
            <option value="type">File Type</option>
          </select>
        </div>

        <div class="view-toggles">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="view-toggle"
            :class="{ active: viewMode === mode.value }"
            @click="viewMode = mode.value"
            :title="mode.label"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="mode.icon" />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-grid collection-grid-compact">
        <div v-for="i in 8" :key="i" class="skeleton-file"></div>
      </div>
    </div>

    <!-- File Grid -->
    <div v-else-if="filteredFiles.length > 0" :class="['files-container', viewMode]">
      <div class="files-grid collection-grid-compact">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-card"
          @click="handleFileSelect(file)"
          @contextmenu.prevent="handleFileMenu(file, $event)"
        >
          <div class="file-preview">
            <div v-if="file.type === 'audio'" class="file-icon audio">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                />
              </svg>
            </div>
            <div v-else-if="file.type === 'video'" class="file-icon video">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div v-else-if="file.type === 'image'" class="file-thumbnail">
              <img :src="file.thumbnail || file.url" :alt="file.name" />
            </div>
            <div v-else class="file-icon document">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
          </div>

          <div class="file-details">
            <h3 class="file-name">{{ file.name }}</h3>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.created_at) }}</span>
            </div>
          </div>

          <div class="file-actions">
            <button class="action-btn" @click.stop="handleDownload(file)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </button>
            <button class="action-btn danger" @click.stop="handleDelete(file)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" stroke="currentColor" stroke-width="2" opacity="0.1" />
          <path
            d="M70 70h60v60H70z"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            opacity="0.2"
          />
          <path
            d="M80 110l20-20 20 20"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.3"
          />
        </svg>
      </div>
      <h3 class="empty-title">
        {{ searchQuery ? "No files found" : "Upload your first media file" }}
      </h3>
      <p class="empty-text">
        {{
          searchQuery
            ? "Try adjusting your search or filters"
            : "Drag and drop files here or use the upload button"
        }}
      </p>
      <button v-if="!searchQuery" class="upload-btn large" @click="triggerFileUpload">
        <div class="btn-bg"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span>Upload Your First File</span>
      </button>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="audio/*,video/*,image/*"
      class="hidden-input"
      @change="handleFileUpload"
    />

    <teleport to="body">
      <transition name="fade">
        <div v-if="deleteModalOpen" class="modal-overlay" @click.self="closeDeleteModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Delete File</h2>
                <p>Remove this media file from the library.</p>
              </div>
              <button class="modal-close" @click="closeDeleteModal">×</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ pendingDeleteFile?.name }}</strong>
              <p>
                {{
                  pendingDeleteFile
                    ? `${getFileTypeLabel(pendingDeleteFile.type)} · ${formatFileSize(pendingDeleteFile.size)}`
                    : ""
                }}
              </p>
            </div>

            <div class="modal-actions">
              <button class="ghost-btn" @click="closeDeleteModal">Cancel</button>
              <button class="danger-btn" @click="confirmDeleteFile">Delete File</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { useRoute } from "vue-router";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { useDashboardStore } from "@/stores/dashboard";
import { apiService } from "@/shared/services/api";

const showToast = inject("showToast", () => {});
const route = useRoute();
const dashboardStore = useDashboardStore();

// State
const loading = ref(true);
const files = ref([]);
const searchQuery = ref("");
const filterType = ref("");
const sortBy = ref("name");
const viewMode = ref("grid");
const fileInput = ref(null);
const deleteModalOpen = ref(false);
const pendingDeleteFile = ref(null);

// View modes
const viewModes = [
  { value: "grid", label: "Grid View", icon: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" },
  {
    value: "list",
    label: "List View",
    icon: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
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

const scopedFiles = computed(() => {
  if (!scopedArtist.value) return files.value;
  return files.value.filter(
    (file) =>
      !file.artist_id || String(file.artist_id) === String(scopedArtist.value.id),
  );
});

// Computed
const filteredFiles = computed(() => {
  let result = [...scopedFiles.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (file) => file.name.toLowerCase().includes(query) || file.type.toLowerCase().includes(query),
    );
  }

  // Type filter
  if (filterType.value) {
    result = result.filter((file) => file.type === filterType.value);
  }

  // Sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case "name":
        return a.name.localeCompare(b.name);
      case "date":
        return new Date(b.created_at) - new Date(a.created_at);
      case "size":
        return b.size - a.size;
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  return result;
});

const audioFiles = computed(() => scopedFiles.value.filter((f) => f.type === "audio"));
const videoFiles = computed(() => scopedFiles.value.filter((f) => f.type === "video"));
const imageFiles = computed(() => scopedFiles.value.filter((f) => f.type === "image"));
const totalFiles = computed(() => scopedFiles.value.length);
const totalSize = computed(() => scopedFiles.value.reduce((sum, file) => sum + file.size, 0));

// Methods
const loadFiles = async () => {
  try {
    loading.value = true;
    const result = await apiService.getAll("media_files");
    files.value = result.data || [];

    // Add some mock files for demo
    if (files.value.length === 0) {
      files.value = [
        {
          id: "demo-1",
          name: "Demo Track.mp3",
          type: "audio",
          artist_id: (dashboardStore.artists || [])[0]?.id || "artist-1",
          size: 4500000,
          url: "https://mock-storage.example.com/demo-track.mp3",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "demo-2",
          name: "Artist Photo.jpg",
          type: "image",
          artist_id: (dashboardStore.artists || [])[0]?.id || "artist-1",
          size: 1200000,
          url: "https://ui-avatars.com/api/?name=Demo+Artist&background=6366f1&color=fff&size=400",
          thumbnail:
            "https://ui-avatars.com/api/?name=Demo+Artist&background=6366f1&color=fff&size=200",
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "demo-3",
          name: "Music Video.mp4",
          type: "video",
          artist_id: (dashboardStore.artists || [])[1]?.id || "artist-2",
          size: 25000000,
          url: "https://mock-storage.example.com/music-video.mp4",
          created_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ];
    }
  } catch (error) {
    console.error("Failed to load files:", error);
    showToast({ message: "Failed to load media files", type: "error" });
  } finally {
    loading.value = false;
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event) => {
  const uploadedFiles = event.target.files;
  if (!uploadedFiles.length) return;

  try {
    for (const file of uploadedFiles) {
      // Mock upload
      const uploadResult = await apiService.uploadFile("media", file);

      const newFile = {
        id: `uploaded-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: file.name,
        type: getFileType(file.type),
        size: file.size,
        url: uploadResult.publicUrl,
        created_at: new Date().toISOString(),
      };

      files.value.unshift(newFile);
    }

    showToast({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      type: "success",
    });

    // Clear input
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

const handleFileSelect = (file) => {
  showToast({ message: `Selected: ${file.name}`, type: "info" });
};

const handleFileMenu = (file) => {
  // Context menu functionality would go here
  console.log("File menu for:", file.name);
};

const handleDownload = (file) => {
  showToast({ message: `Downloading ${file.name}`, type: "info" });
  // In a real app, this would trigger an actual download
};

const handleDelete = async (file) => {
  pendingDeleteFile.value = file;
  deleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  deleteModalOpen.value = false;
  pendingDeleteFile.value = null;
};

const confirmDeleteFile = async () => {
  if (!pendingDeleteFile.value) return;

  try {
    await apiService.delete("media_files", pendingDeleteFile.value.id);
    files.value = files.value.filter((f) => f.id !== pendingDeleteFile.value.id);
    showToast({ message: "File deleted successfully", type: "success" });
  } catch (error) {
    console.error("Delete failed:", error);
    showToast({ message: "Failed to delete file", type: "error" });
  } finally {
    closeDeleteModal();
  }
};

const getFileTypeLabel = (type) => {
  const labels = {
    audio: "Audio",
    video: "Video",
    image: "Image",
    document: "Document",
  };
  return labels[type] || "File";
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString();
};

onMounted(() => {
  loadFiles();
});
</script>

<style scoped>
.media-library-view {
  min-height: 100%;
  background: transparent;
  color: var(--color-text);
}

/* Loading State */
.loading-state {
  flex: 1;
  padding: 0 0 var(--page-gutter);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(var(--collection-card-min), 100%), var(--collection-card-min))
  );
  justify-content: start;
  gap: var(--collection-grid-gap);
}

.skeleton-file {
  height: 228px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-card);
  animation: skeleton 1.5s ease-in-out infinite alternate;
}

@keyframes skeleton {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* Files Container */
.files-container {
  flex: 1;
  padding: 0 0 var(--page-gutter);
  overflow-y: auto;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(var(--collection-card-min), 100%), var(--collection-card-min))
  );
  justify-content: start;
  gap: var(--collection-grid-gap);
}

.files-container.list .files-grid {
  grid-template-columns: 1fr;
  gap: 16px;
}

/* File Card */
.file-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
  border-color: rgba(255, 255, 255, 0.1);
}

.file-preview {
  height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  position: relative;
}

.files-container.list .file-preview {
  height: 80px;
  width: 80px;
  flex-shrink: 0;
}

.file-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
}

.file-icon.audio {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-accent);
}

.file-icon.video {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.file-icon.document {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.file-icon svg {
  width: 24px;
  height: 24px;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.file-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-details {
  padding: 14px 14px 10px;
}

.files-container.list .file-details {
  flex: 1;
  padding: 16px;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.file-actions {
  display: flex;
  gap: 6px;
  padding: 0 14px 14px;
}

.files-container.list .file-actions {
  padding: 16px;
  flex-shrink: 0;
}

.action-btn {
  width: var(--control-sm);
  height: var(--control-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-control);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--page-gutter);
  text-align: center;
}

.empty-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 32px;
  color: rgba(255, 255, 255, 0.1);
}

.empty-title {
  font-size: 28px;
  font-weight: 300;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 32px;
  max-width: 400px;
}

.hidden-input {
  display: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  background: rgba(0, 0, 0, 0.76);
  backdrop-filter: blur(14px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.modal-card {
  width: min(480px, 100%);
  border-radius: var(--radius-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.4);
  padding: 22px;
  display: grid;
  gap: 18px;
}

.modal-head,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-head {
  align-items: flex-start;
}

.modal-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 320;
}

.modal-head p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.58);
}

.modal-close,
.ghost-btn,
.danger-btn {
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.modal-close {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 22px;
}

.ghost-btn,
.danger-btn {
  min-height: var(--control-md);
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.danger-btn {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
}

.confirm-copy {
  padding: 16px 18px;
  border-radius: var(--radius-card);
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

/* Responsive */
@media (max-width: 768px) {
  .files-container {
    padding: 0 0 24px;
  }

  .files-grid {
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .files-grid {
    grid-template-columns: 1fr;
  }
}

/* Theme override */
.media-library-view {
  color: var(--color-text);
  background: transparent;
}

.file-card {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72)),
    var(--color-surface);
  box-shadow: none;
  border-radius: var(--radius-card);
  overflow: hidden;
}

.file-card:hover {
  border-color: rgba(200, 75, 17, 0.24);
  box-shadow: var(--shadow-1);
}

.file-preview,
.files-container.list .file-preview {
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.08), rgba(255, 255, 255, 0.48));
}

.files-container {
  padding: 0 0 var(--page-gutter);
}

.files-grid {
  gap: var(--collection-grid-gap);
}

.file-icon.audio,
.file-icon.video,
.file-icon.document {
  color: var(--color-accent);
}

.file-actions .action-btn {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-secondary);
}

.file-actions .action-btn:hover {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text);
}

.file-actions .action-btn.danger:hover,
.danger-btn {
  border-color: rgba(192, 57, 43, 0.18);
  background: rgba(192, 57, 43, 0.08);
  color: var(--color-danger);
}

.empty-state {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72)),
    var(--color-surface);
  box-shadow: var(--shadow-1);
  border-radius: var(--radius-card);
  border-style: dashed;
  border-color: rgba(200, 75, 17, 0.22);
  padding: var(--space-10) var(--page-gutter);
}

.empty-illustration {
  color: rgba(200, 75, 17, 0.22);
}

.modal-overlay {
  background: rgba(19, 18, 17, 0.16);
  backdrop-filter: blur(22px);
}

.modal-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.9)),
    var(--color-surface);
  border: 1px solid var(--color-border);
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-overlay);
}

.modal-close,
.ghost-btn {
  border-color: var(--color-border);
  background: rgba(19, 18, 17, 0.04);
  color: var(--color-text);
}

.confirm-copy {
  border-color: rgba(192, 57, 43, 0.16);
  background: rgba(192, 57, 43, 0.07);
}

.media-library-view .file-meta,
.media-library-view .empty-text {
  color: var(--color-text-secondary);
}

.media-library-view .file-name,
.media-library-view .empty-title {
  color: var(--color-text);
}

.media-library-view .empty-state svg {
  color: rgba(200, 75, 17, 0.22);
}
</style>
