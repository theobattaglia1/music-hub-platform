// Core API configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// Storage buckets
export const STORAGE_BUCKETS = {
  ARTIST_AVATARS: 'artist-avatars',
  SONG_COVERS: 'song-covers',
  MEDIA_FILES: 'media-files',
  USER_UPLOADS: 'user-uploads',
}

// Image optimization settings
export const IMAGE_CONFIG = {
  THUMBNAIL_SIZE: 150,
  MEDIUM_SIZE: 400,
  LARGE_SIZE: 800,
  QUALITY: 85,
  FORMATS: ['webp', 'jpg'],
  LAZY_LOADING_THRESHOLD: '50px',
}

// Audio playback settings
export const AUDIO_CONFIG = {
  DEFAULT_VOLUME: 80,
  FADE_DURATION: 300,
  BUFFER_SIZE: 8192,
  SUPPORTED_FORMATS: ['mp3', 'wav', 'ogg', 'flac'],
}

// UI constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  VIRTUALIZED_ITEM_HEIGHT: 64,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
}

// Query keys for data caching
export const QUERY_KEYS = {
  // User and auth
  USER_PROFILE: 'userProfile',
  USER_PREFERENCES: 'userPreferences',
  
  // Artists
  ARTISTS: 'artists',
  ARTIST_DETAIL: 'artistDetail',
  ARTIST_SONGS: 'artistSongs',
  ARTIST_EVENTS: 'artistEvents',
  
  // Music
  SONGS: 'songs',
  SONG_DETAIL: 'songDetail',
  RECENT_SONGS: 'recentSongs',
  
  // Playlists
  PLAYLISTS: 'playlists',
  PLAYLIST_DETAIL: 'playlistDetail',
  PLAYLIST_SONGS: 'playlistSongs',
  
  // Dashboard
  DASHBOARD_DATA: 'dashboardData',
  RECENT_ACTIVITY: 'recentActivity',
  
  // Calendar
  EVENTS: 'events',
  CALENDAR_VIEW: 'calendarView',
}

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
}

// Success messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Changes saved successfully.',
  DELETE_SUCCESS: 'Item deleted successfully.',
  UPLOAD_SUCCESS: 'File uploaded successfully.',
  CREATE_SUCCESS: 'Item created successfully.',
  UPDATE_SUCCESS: 'Item updated successfully.',
}