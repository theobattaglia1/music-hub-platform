<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-shell" role="dialog" aria-modal="true" aria-label="Create new artist">
      <header class="modal-header">
        <div>
          <h2 class="modal-title">Create New Artist</h2>
          <p class="modal-subtitle">Set up a new artist workspace with clean defaults.</p>
        </div>
        <button class="close-btn" type="button" @click="emit('close')" aria-label="Close">×</button>
      </header>

      <form class="modal-form" @submit.prevent="handleSubmit">
        <section class="avatar-row">
          <div class="avatar-frame">
            <img
              v-if="previewImage"
              :src="previewImage"
              alt="Artist avatar preview"
              class="avatar-image"
            />
            <div v-else class="avatar-placeholder">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M16 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0Z"></path>
                <path d="M4 21a8 8 0 0 1 16 0"></path>
              </svg>
            </div>
          </div>

          <div class="avatar-content">
            <h3 class="avatar-title">Artist Avatar</h3>
            <p class="avatar-hint">
              Use a square image for best results. JPG, PNG, or WebP up to 5MB.
            </p>
            <div class="avatar-actions">
              <label class="file-btn">
                Choose Image
                <input
                  ref="imageInput"
                  class="hidden-input"
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                />
              </label>
              <button v-if="previewImage" type="button" class="text-btn" @click="removeImage">
                Remove
              </button>
              <span class="file-name">{{ imageFile?.name || "No file selected" }}</span>
            </div>
          </div>
        </section>

        <section class="form-grid">
          <div class="form-group span-2">
            <label for="artistName" class="field-label">Artist Name *</label>
            <input
              id="artistName"
              v-model="form.name"
              type="text"
              maxlength="100"
              required
              class="field-input"
              placeholder="Enter artist name"
              :disabled="loading"
              @input="updateSlug"
            />
          </div>

          <div class="form-group span-2">
            <label for="artistSlug" class="field-label">URL Slug *</label>
            <div class="slug-row">
              <span class="slug-prefix">/artists/</span>
              <input
                id="artistSlug"
                v-model="form.slug"
                type="text"
                maxlength="60"
                pattern="[a-z0-9-]+"
                title="Use lowercase letters, numbers, and dashes"
                required
                class="field-input slug-input"
                placeholder="artist-name"
                :disabled="loading"
              />
            </div>
            <p class="field-help">Lowercase letters, numbers, and dashes only.</p>
          </div>

          <div class="form-group">
            <label for="artistGenre" class="field-label">Primary Genre</label>
            <select id="artistGenre" v-model="form.genre" class="field-input" :disabled="loading">
              <option value="">Select a genre</option>
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="hip-hop">Hip Hop</option>
              <option value="r&b">R&B</option>
              <option value="country">Country</option>
              <option value="electronic">Electronic</option>
              <option value="jazz">Jazz</option>
              <option value="classical">Classical</option>
              <option value="indie">Indie</option>
              <option value="folk">Folk</option>
              <option value="alternative">Alternative</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="artistLocation" class="field-label">Location</label>
            <input
              id="artistLocation"
              v-model="form.location"
              type="text"
              maxlength="100"
              class="field-input"
              placeholder="e.g., Los Angeles, CA"
              :disabled="loading"
            />
          </div>

          <div class="form-group span-2">
            <label for="artistBio" class="field-label">Bio / Description</label>
            <textarea
              id="artistBio"
              v-model="form.bio"
              rows="4"
              maxlength="500"
              class="field-input textarea"
              placeholder="Brief artist summary"
              :disabled="loading"
            ></textarea>
            <p class="field-help">{{ form.bio.length }}/500</p>
          </div>
        </section>

        <section class="privacy-section">
          <h3 class="privacy-title">Privacy Settings</h3>
          <label class="check-row">
            <input v-model="form.is_public" type="checkbox" :disabled="loading" />
            <span>Make this profile publicly visible</span>
          </label>
          <label class="check-row">
            <input v-model="form.allow_collaboration" type="checkbox" :disabled="loading" />
            <span>Allow collaboration requests</span>
          </label>
        </section>

        <p v-if="error" class="error-message">{{ error }}</p>

        <footer class="modal-actions">
          <button type="button" class="btn-secondary" @click="emit('close')" :disabled="loading">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="loading || !isFormValid">
            <span v-if="loading">Creating...</span>
            <span v-else>Create Artist</span>
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

const emit = defineEmits(["close", "created"]);

const loading = ref(false);
const error = ref("");
const previewImage = ref(null);
const imageFile = ref(null);
const imageInput = ref(null);

const form = ref({
  name: "",
  slug: "",
  genre: "",
  bio: "",
  location: "",
  is_public: true,
  allow_collaboration: true,
});

const isFormValid = computed(() => {
  return (
    Boolean(form.value.name.trim()) &&
    Boolean(form.value.slug.trim()) &&
    /^[a-z0-9-]+$/.test(form.value.slug)
  );
});

const updateSlug = () => {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const handleImageUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    error.value = "Please select an image file.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = "Image must be smaller than 5MB.";
    return;
  }

  imageFile.value = file;
  error.value = "";

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    previewImage.value = loadEvent.target?.result || null;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  imageFile.value = null;
  previewImage.value = null;
  if (imageInput.value) {
    imageInput.value.value = "";
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  error.value = "";
  try {
    emit("created", { ...form.value }, imageFile.value);
  } catch (submitError) {
    error.value = submitError?.message || "Failed to create artist.";
    loading.value = false;
  }
};

const handleKeydown = (event) => {
  if (event.key === "Escape" && !loading.value) {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

.modal-shell {
  width: min(760px, 100%);
  max-height: 92vh;
  overflow: auto;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(20, 20, 20, 0.98), rgba(12, 12, 12, 0.98));
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-title {
  margin: 0;
  font-size: 30px;
  font-weight: 520;
  letter-spacing: -0.02em;
  color: #fff;
}

.modal-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.62);
}

.close-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.modal-form {
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
}

.avatar-frame {
  width: 88px;
  height: 88px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(135deg, rgba(232, 90, 25, 0.28), rgba(32, 29, 26, 0.22));
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
}

.avatar-placeholder svg {
  width: 34px;
  height: 34px;
}

.avatar-title {
  margin: 0;
  font-size: 17px;
  font-weight: 560;
  color: #fff;
}

.avatar-hint {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.58);
}

.avatar-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.file-btn {
  height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.text-btn {
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 120, 120, 0.95);
  font-size: 13px;
  cursor: pointer;
}

.file-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  min-width: 0;
}

.form-group.span-2 {
  grid-column: 1 / -1;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
}

.field-input {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0 12px;
}

.field-input:focus {
  outline: none;
  border-color: rgba(232, 90, 25, 0.5);
  box-shadow: 0 0 0 3px rgba(232, 90, 25, 0.14);
}

.textarea {
  min-height: 96px;
  padding-top: 9px;
  resize: vertical;
}

.slug-row {
  display: grid;
  grid-template-columns: auto 1fr;
}

.slug-prefix {
  height: 40px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-right: none;
  border-radius: 10px 0 0 10px;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.slug-input {
  border-radius: 0 10px 10px 0;
}

.field-help {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.privacy-section {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  display: grid;
  gap: 10px;
}

.privacy-title {
  margin: 0;
  font-size: 15px;
  font-weight: 580;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

.check-row input {
  accent-color: var(--color-accent);
}

.error-message {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.12);
  color: #fca5a5;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  height: 40px;
  min-width: 120px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: rgba(232, 90, 25, 0.18);
  color: var(--color-accent);
  border-color: rgba(232, 90, 25, 0.32);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.14);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .modal-title {
    font-size: 24px;
  }

  .avatar-row {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
