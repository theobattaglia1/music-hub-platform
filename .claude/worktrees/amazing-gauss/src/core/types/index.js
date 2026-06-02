/**
 * Core type definitions for the Music Hub Platform
 * These would be TypeScript interfaces in a TypeScript project
 */

// User related types
export const UserSchema = {
  id: 'string',
  email: 'string',
  name: 'string',
  avatar_url: 'string?',
  created_at: 'string',
  updated_at: 'string'
}

export const UserProfileSchema = {
  id: 'string',
  full_name: 'string',
  avatar_url: 'string?',
  bio: 'string?',
  preferences: 'UserPreferences'
}

export const UserPreferencesSchema = {
  theme: 'light | dark | system',
  volume: 'number',
  autoPlay: 'boolean',
  showLyrics: 'boolean',
  audioQuality: 'low | medium | high'
}

// Artist related types
export const ArtistSchema = {
  id: 'string',
  name: 'string',
  slug: 'string',
  bio: 'string?',
  avatar_url: 'string?',
  website_url: 'string?',
  social_links: 'object',
  created_at: 'string',
  updated_at: 'string'
}

// Song related types
export const SongSchema = {
  id: 'string',
  title: 'string',
  artist_id: 'string',
  artist: 'Artist',
  duration: 'number',
  file_url: 'string?',
  cover_url: 'string?',
  lyrics: 'string?',
  genre: 'string?',
  release_date: 'string?',
  created_at: 'string',
  updated_at: 'string'
}

// Playlist related types
export const PlaylistSchema = {
  id: 'string',
  name: 'string',
  description: 'string?',
  cover_url: 'string?',
  user_id: 'string',
  is_public: 'boolean',
  song_count: 'number',
  total_duration: 'number',
  created_at: 'string',
  updated_at: 'string'
}

export const PlaylistSongSchema = {
  id: 'string',
  playlist_id: 'string',
  song_id: 'string',
  position: 'number',
  song: 'Song',
  added_at: 'string'
}

// Event related types
export const EventSchema = {
  id: 'string',
  title: 'string',
  description: 'string?',
  start_date: 'string',
  end_date: 'string?',
  artist_id: 'string?',
  artist: 'Artist?',
  venue: 'string?',
  event_type: 'performance | recording | meeting | other',
  created_at: 'string',
  updated_at: 'string'
}

// Activity related types
export const ActivitySchema = {
  id: 'string',
  user_id: 'string',
  artist_id: 'string?',
  action_type: 'string',
  target_type: 'string',
  target_id: 'string',
  description: 'string',
  metadata: 'object?',
  created_at: 'string'
}

// API Response types
export const ApiResponseSchema = {
  data: 'any',
  success: 'boolean',
  message: 'string?',
  errors: 'object?'
}

export const PaginatedResponseSchema = {
  data: 'array',
  total: 'number',
  page: 'number',
  pageSize: 'number',
  hasNext: 'boolean',
  hasPrevious: 'boolean'
}

// Query options
export const QueryOptionsSchema = {
  page: 'number?',
  pageSize: 'number?',
  search: 'string?',
  sort: 'string?',
  order: 'asc | desc?',
  filters: 'object?'
}

// Create/Update data types
export const CreateArtistDataSchema = {
  name: 'string',
  bio: 'string?',
  website_url: 'string?',
  social_links: 'object?'
}

export const UpdateArtistDataSchema = {
  id: 'string',
  name: 'string?',
  bio: 'string?',
  website_url: 'string?',
  social_links: 'object?'
}

export const CreateSongDataSchema = {
  title: 'string',
  artist_id: 'string',
  duration: 'number?',
  genre: 'string?',
  release_date: 'string?',
  lyrics: 'string?'
}

export const UpdateSongDataSchema = {
  id: 'string',
  title: 'string?',
  duration: 'number?',
  genre: 'string?',
  release_date: 'string?',
  lyrics: 'string?'
}

export const CreatePlaylistDataSchema = {
  name: 'string',
  description: 'string?',
  is_public: 'boolean?'
}

export const UpdatePlaylistDataSchema = {
  id: 'string',
  name: 'string?',
  description: 'string?',
  is_public: 'boolean?'
}

// Playback state types
export const PlaybackStateSchema = {
  currentSong: 'Song | null',
  isPlaying: 'boolean',
  currentTime: 'number',
  duration: 'number',
  volume: 'number',
  isShuffled: 'boolean',
  repeatMode: 'off | all | one',
  queue: 'Song[]',
  queueIndex: 'number'
}

// Upload types
export const UploadProgressSchema = {
  loaded: 'number',
  total: 'number',
  percentage: 'number'
}

export const FileUploadSchema = {
  file: 'File',
  progress: 'UploadProgress',
  status: 'pending | uploading | completed | error',
  url: 'string?',
  error: 'string?'
}

// Component prop types
export const OptimizedImagePropsSchema = {
  src: 'string',
  alt: 'string',
  width: 'number?',
  height: 'number?',
  sizes: 'string?',
  loading: 'lazy | eager?',
  quality: 'number?',
  formats: 'string[]?'
}

export const VirtualizedListPropsSchema = {
  items: 'array',
  itemHeight: 'number',
  containerHeight: 'number',
  renderItem: 'function',
  keyExtractor: 'function'
}

// Error types
export const AppErrorSchema = {
  code: 'string',
  message: 'string',
  details: 'any?',
  timestamp: 'string'
}

export const ValidationErrorSchema = {
  field: 'string',
  message: 'string',
  code: 'string'
}

// Context types
export const ToastMessageSchema = {
  id: 'string',
  type: 'success | error | warning | info',
  title: 'string',
  message: 'string?',
  duration: 'number?',
  action: {
    label: 'string',
    handler: 'function'
  }
}

export const ContextMenuItemSchema = {
  id: 'string',
  label: 'string',
  icon: 'string?',
  shortcut: 'string?',
  disabled: 'boolean?',
  separator: 'boolean?',
  submenu: 'ContextMenuItem[]?',
  handler: 'function?'
}

// Type validators (for runtime type checking)
export const validateUserProfile = (data) => {
  const required = ['id', 'full_name']
  return required.every(field => data[field] !== undefined)
}

export const validateSong = (data) => {
  const required = ['title', 'artist_id']
  return required.every(field => data[field] !== undefined)
}

export const validatePlaylist = (data) => {
  const required = ['name']
  return required.every(field => data[field] !== undefined)
}

// Default values
export const DEFAULT_USER_PREFERENCES = {
  theme: 'system',
  volume: 80,
  autoPlay: false,
  showLyrics: true,
  audioQuality: 'medium'
}

export const DEFAULT_QUERY_OPTIONS = {
  page: 1,
  pageSize: 20,
  sort: 'created_at',
  order: 'desc'
}

export const DEFAULT_PLAYBACK_STATE = {
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isShuffled: false,
  repeatMode: 'off',
  queue: [],
  queueIndex: -1
}