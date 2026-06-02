/**
 * Application constants and configuration
 */

// API Configuration
export const API_CONFIG = {
  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Timeout configuration
  REQUEST_TIMEOUT: 30000,
  
  // Mock mode flag for local testing
  MOCK_MODE: true, // TODO: Set to false when enabling real Supabase integration
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache configuration
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  STALE_TIME: 5 * 60 * 1000,   // 5 minutes
}

// Application URLs and routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ARTISTS: '/artists',
  MEDIA: '/media',
  CALENDAR: '/calendar',
  PROFILE: '/profile',
  PREFERENCES: '/preferences',
  
  // Auth routes
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // API endpoints (mocked in mock mode)
  API: {
    BASE: '/api',
    AUTH: '/api/auth',
    ARTISTS: '/api/artists',
    SONGS: '/api/songs',
    PLAYLISTS: '/api/playlists',
    ACTIVITY: '/api/activity',
    UPLOAD: '/api/upload',
  }
}

// UI Constants
export const UI_CONFIG = {
  // Sidebar
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 80,
  
  // Layout breakpoints
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  
  // Animation durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Toast configuration
  TOAST: {
    DURATION: 5000,
    MAX_TOASTS: 5,
  },
}

// Feature flags
export const FEATURES = {
  // Mock mode features
  MOCK_AUTH: true,
  MOCK_DATA: true,
  
  // Real features (disabled in mock mode)
  REAL_TIME_UPDATES: false,
  EMAIL_NOTIFICATIONS: false,
  FILE_UPLOADS: false,
  
  // UI features
  DARK_MODE: true,
  KEYBOARD_SHORTCUTS: true,
  DRAG_AND_DROP: true,
  CONTEXT_MENUS: true,
}

// File upload configuration
export const UPLOAD_CONFIG = {
  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  
  // File size limits (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,  // 10MB
  MAX_AUDIO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  
  // Storage buckets (mock mode)
  BUCKETS: {
    AVATARS: 'avatars',
    COVERS: 'covers',
    AUDIO: 'audio',
    VIDEOS: 'videos',
    DOCUMENTS: 'documents',
  },
}

// Legacy exports for backwards compatibility
export const STORAGE_BUCKETS = UPLOAD_CONFIG.BUCKETS
export const IMAGE_CONFIG = {
  // Image optimization settings
  SUPPORTED_FORMATS: UPLOAD_CONFIG.SUPPORTED_IMAGE_TYPES,
  MAX_SIZE: UPLOAD_CONFIG.MAX_IMAGE_SIZE,
  QUALITY: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
  },
  RESPONSIVE_SIZES: [320, 640, 768, 1024, 1280, 1536],
  LAZY_LOADING: true,
  WEBP_ENABLED: true,
}

// Validation constants
export const VALIDATION = {
  // User validation
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Artist validation
  MIN_ARTIST_NAME_LENGTH: 1,
  MAX_ARTIST_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 1000,
  
  // Song validation
  MIN_SONG_TITLE_LENGTH: 1,
  MAX_SONG_TITLE_LENGTH: 200,
  MAX_SONG_DESCRIPTION_LENGTH: 2000,
  
  // Playlist validation
  MIN_PLAYLIST_NAME_LENGTH: 1,
  MAX_PLAYLIST_NAME_LENGTH: 100,
  MAX_PLAYLIST_DESCRIPTION_LENGTH: 500,
}

// Date and time formats
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  TIME_ONLY: 'h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
}

// Color themes and branding
export const THEME_CONFIG = {
  // Primary brand colors
  PRIMARY: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  
  // Accent colors
  ACCENT: {
    50: '#fdf4ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    900: '#581c87',
  },
  
  // Status colors
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
}

// Audio/Music specific constants
export const MUSIC_CONFIG = {
  // Audio formats
  SUPPORTED_FORMATS: ['mp3', 'wav', 'flac', 'aac', 'm4a'],
  
  // Quality settings
  QUALITY_PRESETS: {
    LOW: { bitrate: 128, sampleRate: 44100 },
    MEDIUM: { bitrate: 192, sampleRate: 44100 },
    HIGH: { bitrate: 320, sampleRate: 44100 },
    LOSSLESS: { bitrate: 1411, sampleRate: 44100 },
  },
  
  // Player settings
  PLAYER: {
    DEFAULT_VOLUME: 0.8,
    FADE_DURATION: 1000,
    SEEK_STEP: 10, // seconds
  },
}

// Mock data configuration
export const MOCK_CONFIG = {
  // Mock user data
  USER: {
    ID: 'mock-user-123',
    EMAIL: 'demo@example.com',
    NAME: 'Demo User',
    ROLE: 'owner',
  },
  
  // Mock timing
  NETWORK_DELAY: {
    MIN: 50,
    MAX: 200,
  },
  
  // Mock data sizes
  MOCK_ARTISTS_COUNT: 5,
  MOCK_SONGS_COUNT: 20,
  MOCK_PLAYLISTS_COUNT: 8,
  MOCK_ACTIVITIES_COUNT: 50,
}

export default {
  API_CONFIG,
  ROUTES,
  UI_CONFIG,
  FEATURES,
  UPLOAD_CONFIG,
  VALIDATION,
  DATE_FORMATS,
  THEME_CONFIG,
  MUSIC_CONFIG,
  MOCK_CONFIG,
}