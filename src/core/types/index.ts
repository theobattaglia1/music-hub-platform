/**
 * Core type definitions for the Music Hub Platform
 */

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  volume: number
  autoPlay: boolean
  showLyrics: boolean
  audioQuality: 'low' | 'medium' | 'high'
}

export interface Artist {
  id: string
  name: string
  slug: string
  bio?: string
  avatar_url?: string
  website_url?: string
  social_links: Record<string, string>
  created_at: string
  updated_at: string
}

export interface Song {
  id: string
  title: string
  artist_id: string
  artist: Artist
  duration: number
  file_url?: string
  cover_url?: string
  lyrics?: string
  genre?: string
  release_date?: string
  created_at: string
  updated_at: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  cover_url?: string
  user_id: string
  is_public: boolean
  song_count: number
  total_duration: number
  created_at: string
  updated_at: string
}

export interface PlaylistSong {
  id: string
  playlist_id: string
  song_id: string
  position: number
  song: Song
  added_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  artist_id?: string
  artist?: Artist
  venue?: string
  event_type: 'performance' | 'recording' | 'meeting' | 'other'
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  artist_id?: string
  action_type: string
  target_type: string
  target_id: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
}

// Query and mutation types
export interface QueryOptions {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface CreateArtistData {
  name: string
  bio?: string
  website_url?: string
  social_links?: Record<string, string>
}

export interface UpdateArtistData extends Partial<CreateArtistData> {
  id: string
}

export interface CreateSongData {
  title: string
  artist_id: string
  duration?: number
  genre?: string
  release_date?: string
  lyrics?: string
}

export interface UpdateSongData extends Partial<CreateSongData> {
  id: string
}

export interface CreatePlaylistData {
  name: string
  description?: string
  is_public?: boolean
}

export interface UpdatePlaylistData extends Partial<CreatePlaylistData> {
  id: string
}

// Playback state types
export interface PlaybackState {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: 'off' | 'all' | 'one'
  queue: Song[]
  queueIndex: number
}

// Upload types
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUpload {
  file: File
  progress: UploadProgress
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

// Component prop types
export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  sizes?: string
  loading?: 'lazy' | 'eager'
  quality?: number
  formats?: string[]
}

export interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => any
  keyExtractor: (item: T, index: number) => string | number
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Context types
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  submenu?: ContextMenuItem[]
  handler?: () => void
}