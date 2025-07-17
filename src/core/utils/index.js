/**
 * Core utility functions for the Music Hub Platform
 */

import { IMAGE_CONFIG, UI_CONFIG } from '../constants'

// String utilities
export const truncate = (str, length = 50, suffix = '...') => {
  if (!str || str.length <= length) return str
  return str.slice(0, length) + suffix
}

export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const pascalCase = (str) => {
  return str
    .split(/[\s-_]+/)
    .map(word => capitalize(word))
    .join('')
}

// Number utilities
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const formatNumber = (num, compact = false) => {
  if (!num) return '0'
  
  if (compact && num >= 1000) {
    const units = ['', 'K', 'M', 'B', 'T']
    const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3)
    const scaledNum = num / Math.pow(1000, unitIndex)
    
    return `${scaledNum.toFixed(1).replace(/\.0$/, '')}${units[unitIndex]}`
  }
  
  return new Intl.NumberFormat().format(num)
}

// Date utilities
export const formatDate = (date, format = 'short') => {
  if (!date) return ''
  
  const d = new Date(date)
  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  }
  
  return d.toLocaleDateString('en-US', options[format] || options.short)
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now - then) / 1000)
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}

export const isToday = (date) => {
  const today = new Date()
  const d = new Date(date)
  return d.toDateString() === today.toDateString()
}

export const isThisWeek = (date) => {
  const today = new Date()
  const d = new Date(date)
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6))
  
  return d >= weekStart && d <= weekEnd
}

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key]
    const bVal = typeof key === 'function' ? key(b) : b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export const unique = (array, key) => {
  if (!key) return [...new Set(array)]
  
  const seen = new Set()
  return array.filter(item => {
    const val = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

export const chunk = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Object utilities
export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key]
    }
    return acc
  }, {})
}

export const omit = (obj, keys) => {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// Function utilities
export const debounce = (func, delay = UI_CONFIG.DEBOUNCE_DELAY) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

export const throttle = (func, delay) => {
  let timeoutId
  let lastExecTime = 0
  return (...args) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(null, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

export const memoize = (func, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map()
  return (...args) => {
    const key = getKey(...args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = func.apply(null, args)
    cache.set(key, result)
    return result
  }
}

// Image utilities
export const generateImageSrcSet = (baseUrl, sizes = [IMAGE_CONFIG.THUMBNAIL_SIZE, IMAGE_CONFIG.MEDIUM_SIZE, IMAGE_CONFIG.LARGE_SIZE]) => {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ')
}

export const generateImageSizes = (breakpoints = ['(max-width: 640px)', '(max-width: 1024px)']) => {
  const sizes = breakpoints.map((bp, index) => {
    const size = index === 0 ? '100vw' : index === 1 ? '50vw' : '33vw'
    return `${bp} ${size}`
  })
  sizes.push('25vw')
  return sizes.join(', ')
}

export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return ''
  
  const {
    width = IMAGE_CONFIG.MEDIUM_SIZE,
    height,
    quality = IMAGE_CONFIG.QUALITY,
    format = 'webp'
  } = options
  
  const params = new URLSearchParams()
  params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  params.append('q', quality.toString())
  params.append('f', format)
  
  return `${url}?${params.toString()}`
}

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type) || allowedTypes.includes(file.name.split('.').pop()?.toLowerCase())
}

export const isValidFileSize = (file, maxSizeInMB) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

// Storage utilities
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// Error utilities
export const createError = (code, message, details = null) => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
})

export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error?.message) return error.error.message
  return fallback
}

// Random utilities
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}