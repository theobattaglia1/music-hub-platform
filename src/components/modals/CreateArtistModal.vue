<template>
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="glassmorphic rounded-2xl w-full max-w-lg mx-auto shadow-2xl">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-dark-700">
        <div>
          <h2 class="text-xl font-semibold text-white">Create New Artist</h2>
          <p class="text-dark-400 text-sm mt-1">Set up a new artist workspace</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-dark-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Artist Avatar Upload -->
        <div class="flex items-center space-x-6">
          <div class="relative">
            <div
              v-if="previewImage"
              class="w-20 h-20 rounded-full overflow-hidden border-2 border-dark-600"
            >
              <img
                :src="previewImage"
                alt="Artist avatar preview"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center border-2 border-dark-600"
            >
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>

            <!-- Upload Button -->
            <label class="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden"
                ref="imageInput"
              />
            </label>
          </div>

          <div>
            <h3 class="text-white font-medium">Artist Avatar</h3>
            <p class="text-dark-400 text-sm">Upload a profile image for this artist</p>
            <button
              v-if="previewImage"
              type="button"
              @click="removeImage"
              class="text-red-400 hover:text-red-300 text-sm mt-1 transition-colors"
            >
              Remove image
            </button>
          </div>
        </div>

        <!-- Artist Name -->
        <div>
          <label for="artistName" class="block text-sm font-medium text-dark-300 mb-2">
            Artist Name *
          </label>
          <input
            id="artistName"
            v-model="form.name"
            type="text"
            required
            maxlength="100"
            class="input-primary"
            placeholder="Enter artist name"
            :disabled="loading"
            @input="updateSlug"
          />
        </div>

        <!-- Artist Slug -->
        <div>
          <label for="artistSlug" class="block text-sm font-medium text-dark-300 mb-2">
            URL Slug *
          </label>
          <div class="flex">
            <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-dark-700 bg-dark-800 text-dark-400 text-sm">
              /artists/
            </span>
            <input
              id="artistSlug"
              v-model="form.slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and dashes allowed"
              maxlength="50"
              class="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-r-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="artist-name"
              :disabled="loading"
            />
          </div>
          <p class="text-xs text-dark-500 mt-1">
            Only lowercase letters, numbers, and dashes allowed
          </p>
        </div>

        <!-- Genre/Style -->
        <div>
          <label for="genre" class="block text-sm font-medium text-dark-300 mb-2">
            Primary Genre
          </label>
          <select
            id="genre"
            v-model="form.genre"
            class="input-primary"
            :disabled="loading"
          >
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

        <!-- Bio/Description -->
        <div>
          <label for="bio" class="block text-sm font-medium text-dark-300 mb-2">
            Bio/Description
          </label>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="3"
            maxlength="500"
            class="input-primary resize-none"
            placeholder="Brief description of the artist..."
            :disabled="loading"
          ></textarea>
          <p class="text-xs text-dark-500 mt-1">
            {{ form.bio?.length || 0 }}/500 characters
          </p>
        </div>

        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-dark-300 mb-2">
            Location
          </label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            maxlength="100"
            class="input-primary"
            placeholder="e.g., Los Angeles, CA"
            :disabled="loading"
          />
        </div>

        <!-- Privacy Settings -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-dark-300">Privacy Settings</h3>

          <div class="flex items-center space-x-3">
            <input
              id="isPublic"
              v-model="form.is_public"
              type="checkbox"
              class="w-4 h-4 bg-dark-800 border border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
              :disabled="loading"
            />
            <label for="isPublic" class="text-sm text-dark-300">
              Make this artist profile publicly visible
            </label>
          </div>

          <div class="flex items-center space-x-3">
            <input
              id="allowCollaboration"
              v-model="form.allow_collaboration"
              type="checkbox"
              class="w-4 h-4 bg-dark-800 border border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
              :disabled="loading"
            />
            <label for="allowCollaboration" class="text-sm text-dark-300">
              Allow team collaboration requests
            </label>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 pt-4 border-t border-dark-700">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn-primary"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
            <span v-else>Create Artist</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Emits
const emit = defineEmits(['close', 'created'])

// State
const loading = ref(false)
const error = ref('')
const previewImage = ref(null)
const imageFile = ref(null)
const imageInput = ref(null)

const form = ref({
  name: '',
  slug: '',
  genre: '',
  bio: '',
  location: '',
  is_public: true,
  allow_collaboration: true
})

// Computed
const isFormValid = computed(() => {
  return form.value.name.trim() &&
         form.value.slug.trim() &&
         // Validate slug: only lowercase letters, numbers, and dashes (no slashes or regex delimiters)
         /^[a-z0-9-]+$/.test(form.value.slug)
})

// Methods
const updateSlug = () => {
  if (form.value.name) {
    // Generate URL-safe slug from artist name:
    // 1. Convert to lowercase
    // 2. Remove non-alphanumeric characters except spaces and dashes
    // 3. Replace spaces with dashes
    // 4. Remove consecutive dashes
    // 5. Trim any leading/trailing whitespace
    form.value.slug = form.value.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-')          // Replace spaces with dashes
      .replace(/-+/g, '-')           // Remove consecutive dashes
      .trim()
  }
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type for security and compatibility
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select a valid image file'
    return
  }

  // Validate file size (5MB max) to prevent performance issues
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image size must be less than 5MB'
    return
  }

  imageFile.value = file

  // Create preview using FileReader for better UX
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)

  // Clear any previous errors
  error.value = ''
}

const removeImage = () => {
  previewImage.value = null
  imageFile.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''

    // Check if slug is unique (in real implementation)
    // For now, we'll just proceed

    // Emit the form data and image file to parent
    emit('created', form.value, imageFile.value)
  } catch (err) {
    error.value = err.message || 'Failed to create artist'
    loading.value = false
  }
}

// Handle escape key for better accessibility
const handleKeydown = (event) => {
  if (event.key === 'Escape' && !loading.value) {
    emit('close')
  }
}

// Add event listener for escape key on mount
// Clean up event listener on unmount to prevent memory leaks
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  // Add passive event listener for better performance
  document.addEventListener('keydown', handleKeydown, { passive: true })
})

onUnmounted(() => {
  // Always clean up event listeners to prevent memory leaks
  document.removeEventListener('keydown', handleKeydown)
})
</script>
