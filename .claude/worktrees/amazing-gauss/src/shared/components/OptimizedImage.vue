<template>
  <div 
    ref="containerRef"
    :class="[
      'optimized-image',
      {
        'optimized-image--loading': isLoading,
        'optimized-image--error': hasError,
        'optimized-image--loaded': isLoaded
      }
    ]"
    :style="containerStyle"
  >
    <!-- Loading placeholder -->
    <div v-if="isLoading" class="optimized-image__placeholder">
      <div class="optimized-image__skeleton"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="optimized-image__error">
      <slot name="error">
        <div class="optimized-image__error-content">
          <svg viewBox="0 0 24 24" fill="currentColor" class="optimized-image__error-icon">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <span class="optimized-image__error-text">Failed to load image</span>
        </div>
      </slot>
    </div>

    <!-- Image element -->
    <picture v-if="!isLoading && !hasError && (loading === 'eager' || isIntersecting)">
      <!-- WebP sources for different screen sizes -->
      <source 
        v-if="shouldUseWebP"
        :srcset="webpSrcSet"
        :sizes="sizes"
        type="image/webp"
      />
      
      <!-- Fallback JPEG/PNG sources -->
      <source 
        :srcset="fallbackSrcSet"
        :sizes="sizes"
        :type="fallbackMimeType"
      />
      
      <!-- Main image element -->
      <img
        ref="imageRef"
        :src="fallbackSrc"
        :alt="alt"
        :loading="loading"
        :class="[
          'optimized-image__img',
          {
            'optimized-image__img--fade-in': fadeIn && isLoaded
          }
        ]"
        @load="handleLoad"
        @error="handleError"
      />
    </picture>

    <!-- Optional overlay content -->
    <div v-if="$slots.overlay" class="optimized-image__overlay">
      <slot name="overlay" :loading="isLoading" :error="hasError" :loaded="isLoaded" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { optimizeImageUrl, generateImageSrcSet, generateImageSizes } from '@/core/utils'
import { IMAGE_CONFIG } from '@/core/constants'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    default: undefined
  },
  height: {
    type: Number,
    default: undefined
  },
  sizes: {
    type: String,
    default: '100vw'
  },
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => ['lazy', 'eager'].includes(value)
  },
  quality: {
    type: Number,
    default: IMAGE_CONFIG.QUALITY,
    validator: (value) => value >= 1 && value <= 100
  },
  formats: {
    type: Array,
    default: () => IMAGE_CONFIG.FORMATS
  },
  aspectRatio: {
    type: String,
    default: undefined
  },
  objectFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain', 'fill', 'scale-down', 'none'].includes(value)
  },
  fadeIn: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: undefined
  },
  blur: {
    type: Boolean,
    default: false
  },
  threshold: {
    type: String,
    default: IMAGE_CONFIG.LAZY_LOADING_THRESHOLD
  }
})

const emit = defineEmits(['load', 'error'])

// Refs
const containerRef = ref(null)
const imageRef = ref(null)
const isLoading = ref(true)
const hasError = ref(false)
const isLoaded = ref(false)
const isIntersecting = ref(false)

// Intersection Observer for lazy loading
let observer = null

// Computed properties
const containerStyle = computed(() => {
  const styles = {}
  
  if (props.width) styles.width = `${props.width}px`
  if (props.height) styles.height = `${props.height}px`
  if (props.aspectRatio) styles.aspectRatio = props.aspectRatio
  
  return styles
})

const shouldUseWebP = computed(() => {
  return props.formats.includes('webp') && supportsWebP()
})

const responsiveSizes = computed(() => {
  const sizes = [
    IMAGE_CONFIG.THUMBNAIL_SIZE,
    IMAGE_CONFIG.MEDIUM_SIZE,
    IMAGE_CONFIG.LARGE_SIZE
  ]
  
  if (props.width) {
    // Add the specific width and some variants
    sizes.push(props.width, props.width * 2)
  }
  
  return [...new Set(sizes)].sort((a, b) => a - b)
})

const webpSrcSet = computed(() => {
  if (!shouldUseWebP.value) return ''
  
  return responsiveSizes.value
    .map(size => {
      const url = optimizeImageUrl(props.src, {
        width: size,
        height: props.height ? Math.round((props.height / props.width) * size) : undefined,
        quality: props.quality,
        format: 'webp'
      })
      return `${url} ${size}w`
    })
    .join(', ')
})

const fallbackSrcSet = computed(() => {
  const format = props.src.toLowerCase().includes('.png') ? 'png' : 'jpg'
  
  return responsiveSizes.value
    .map(size => {
      const url = optimizeImageUrl(props.src, {
        width: size,
        height: props.height ? Math.round((props.height / props.width) * size) : undefined,
        quality: props.quality,
        format
      })
      return `${url} ${size}w`
    })
    .join(', ')
})

const fallbackSrc = computed(() => {
  const targetWidth = props.width || IMAGE_CONFIG.MEDIUM_SIZE
  const format = props.src.toLowerCase().includes('.png') ? 'png' : 'jpg'
  
  return optimizeImageUrl(props.src, {
    width: targetWidth,
    height: props.height,
    quality: props.quality,
    format
  })
})

const fallbackMimeType = computed(() => {
  return props.src.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg'
})

// Methods
const supportsWebP = () => {
  // Simple WebP support detection
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

const handleLoad = () => {
  isLoading.value = false
  isLoaded.value = true
  hasError.value = false
  emit('load')
}

const handleError = (error) => {
  isLoading.value = false
  hasError.value = true
  isLoaded.value = false
  emit('error', error)
}

const setupIntersectionObserver = () => {
  if (props.loading !== 'lazy' || !containerRef.value || typeof IntersectionObserver === 'undefined') {
    isIntersecting.value = true
    return
  }
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isIntersecting.value = true
          observer?.disconnect()
        }
      })
    },
    {
      rootMargin: props.threshold,
      threshold: 0.1
    }
  )
  
  observer.observe(containerRef.value)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  if (props.loading === 'lazy') {
    setupIntersectionObserver()
  } else {
    isIntersecting.value = true
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.optimized-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: var(--color-gray-100, #f5f5f5);
}

.optimized-image__placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.optimized-image__skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-gray-200, #e5e5e5) 25%,
    var(--color-gray-100, #f5f5f5) 50%,
    var(--color-gray-200, #e5e5e5) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.optimized-image__error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-gray-100, #f5f5f5);
}

.optimized-image__error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-gray-500, #6b7280);
  text-align: center;
}

.optimized-image__error-icon {
  width: 24px;
  height: 24px;
  opacity: 0.5;
}

.optimized-image__error-text {
  font-size: 12px;
  font-weight: 500;
}

.optimized-image__img {
  width: 100%;
  height: 100%;
  object-fit: v-bind('props.objectFit');
  transition: opacity 0.3s ease;
}

.optimized-image__img--fade-in {
  opacity: 0;
  animation: fade-in 0.3s ease forwards;
}

.optimized-image__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.optimized-image__overlay > * {
  pointer-events: auto;
}

/* Loading state */
.optimized-image--loading .optimized-image__img {
  opacity: 0;
}

/* Loaded state */
.optimized-image--loaded .optimized-image__placeholder {
  display: none;
}

/* Error state */
.optimized-image--error .optimized-image__img {
  display: none;
}

/* Animations */
@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes fade-in {
  to {
    opacity: 1;
  }
}

/* Blur effect for placeholder */
.optimized-image--blur .optimized-image__img {
  filter: blur(5px);
  transition: filter 0.3s ease;
}

.optimized-image--blur.optimized-image--loaded .optimized-image__img {
  filter: blur(0);
}
</style>