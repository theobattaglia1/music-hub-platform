<template>
  <div class="profile-view">
    <!-- Header -->
    <div class="profile-header">
      <div class="header-background"></div>
      <div class="profile-content">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img
              v-if="profile.avatar_url"
              :src="profile.avatar_url"
              :alt="profile.full_name"
              class="avatar-image"
            />
            <div v-else class="avatar-placeholder">
              <span>{{ getInitials(profile.full_name) }}</span>
            </div>
            <button class="change-avatar-btn" @click="triggerAvatarUpload">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3-5c0 1.65 1.35 3 3 3s3-1.35 3-3-1.35-3-3-3-3 1.35-3 3z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="profile-info">
          <h1 class="profile-name">{{ profile.full_name }}</h1>
          <p class="profile-email">{{ profile.email }}</p>
          <div class="profile-meta">
            <span class="role-badge" :class="profile.role">{{ formatRole(profile.role) }}</span>
            <span class="join-date">Member since {{ formatDate(profile.created_at) }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <button class="action-btn primary" @click="editMode = !editMode">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <span>{{ editMode ? 'Cancel' : 'Edit Profile' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="profile-body">
      <div class="profile-sections">
        
        <!-- Personal Information -->
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Personal Information</h2>
          </div>
          <div class="section-content">
            <div v-if="!editMode" class="info-grid">
              <div class="info-item">
                <label class="info-label">Full Name</label>
                <span class="info-value">{{ profile.full_name }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">Email</label>
                <span class="info-value">{{ profile.email }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">Role</label>
                <span class="info-value">{{ formatRole(profile.role) }}</span>
              </div>
              <div class="info-item">
                <label class="info-label">Bio</label>
                <span class="info-value">{{ profile.bio || 'No bio added yet' }}</span>
              </div>
            </div>
            <div v-else class="edit-form">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input
                  v-model="editedProfile.full_name"
                  type="text"
                  class="form-input"
                  placeholder="Enter your full name"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea
                  v-model="editedProfile.bio"
                  class="form-textarea"
                  placeholder="Tell us about yourself..."
                  rows="3"
                ></textarea>
              </div>
              <div class="form-actions">
                <button class="save-btn" @click="saveProfile">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Social Links -->
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Social Links</h2>
            <button v-if="!editSocial" class="edit-section-btn" @click="editSocial = true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>
          <div class="section-content">
            <div v-if="!editSocial" class="social-links">
              <div v-for="(url, platform) in profile.social_links" :key="platform" class="social-link">
                <div class="social-icon" :class="platform">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path :d="getSocialIcon(platform)" />
                  </svg>
                </div>
                <span class="social-platform">{{ formatPlatform(platform) }}</span>
                <a :href="url" target="_blank" class="social-url">{{ url }}</a>
              </div>
              <div v-if="Object.keys(profile.social_links || {}).length === 0" class="empty-social">
                <span>No social links added yet</span>
              </div>
            </div>
            <div v-else class="edit-social">
              <div v-for="platform in socialPlatforms" :key="platform" class="form-group">
                <label class="form-label">{{ formatPlatform(platform) }}</label>
                <input
                  v-model="editedSocial[platform]"
                  type="url"
                  class="form-input"
                  :placeholder="`Your ${formatPlatform(platform)} URL`"
                />
              </div>
              <div class="form-actions">
                <button class="save-btn" @click="saveSocial">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span>Save Links</span>
                </button>
                <button class="cancel-btn" @click="cancelSocialEdit">
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Preferences</h2>
          </div>
          <div class="section-content">
            <div class="preferences-grid">
              <div class="preference-item">
                <div class="preference-info">
                  <label class="preference-label">Email Notifications</label>
                  <p class="preference-desc">Receive updates about your projects and collaborations</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="preferences.email_notifications"
                    type="checkbox"
                    @change="updatePreference('email_notifications', preferences.email_notifications)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="preference-item">
                <div class="preference-info">
                  <label class="preference-label">Dark Mode</label>
                  <p class="preference-desc">Use dark theme across the platform</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="preferences.dark_mode"
                    type="checkbox"
                    @change="updatePreference('dark_mode', preferences.dark_mode)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="preference-item">
                <div class="preference-info">
                  <label class="preference-label">Auto-save Drafts</label>
                  <p class="preference-desc">Automatically save your work as you type</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="preferences.auto_save"
                    type="checkbox"
                    @change="updatePreference('auto_save', preferences.auto_save)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="preference-item">
                <div class="preference-info">
                  <label class="preference-label">Public Profile</label>
                  <p class="preference-desc">Make your profile visible to other users</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="preferences.public_profile"
                    type="checkbox"
                    @change="updatePreference('public_profile', preferences.public_profile)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Hidden Avatar Input -->
    <input
      ref="avatarInput"
      type="file"
      accept="image/*"
      class="hidden-input"
      @change="handleAvatarUpload"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { getUserProfile } from '@/lib/supabase'
import { apiService } from '@/shared/services/api'

const showToast = inject('showToast', () => {})

// State
const loading = ref(true)
const editMode = ref(false)
const editSocial = ref(false)
const avatarInput = ref(null)

const profile = reactive({
  id: 'mock-user-123',
  email: 'demo@example.com',
  full_name: 'Demo User',
  avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256',
  role: 'owner',
  bio: 'Music enthusiast and platform owner. Building the future of collaborative music creation.',
  social_links: {
    twitter: 'https://twitter.com/demouser',
    instagram: 'https://instagram.com/demouser',
    spotify: 'https://open.spotify.com/artist/demouser'
  },
  created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString()
})

const editedProfile = reactive({
  full_name: '',
  bio: ''
})

const preferences = reactive({
  email_notifications: true,
  dark_mode: true,
  auto_save: true,
  public_profile: true
})

const editedSocial = reactive({
  twitter: '',
  instagram: '',
  spotify: '',
  youtube: '',
  soundcloud: ''
})

const socialPlatforms = ['twitter', 'instagram', 'spotify', 'youtube', 'soundcloud']

// Methods
const loadProfile = async () => {
  try {
    loading.value = true
    const userProfile = await getUserProfile()
    if (userProfile) {
      Object.assign(profile, userProfile)
    }
    
    // Load preferences
    const prefsResult = await apiService.getById('user_preferences', profile.id)
    if (prefsResult.data) {
      Object.assign(preferences, prefsResult.data)
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
    showToast({ message: 'Failed to load profile', type: 'error' })
  } finally {
    loading.value = false
  }
}

const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DU'
}

const formatRole = (role) => {
  return role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'
}

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
}

const formatPlatform = (platform) => {
  const platforms = {
    twitter: 'Twitter',
    instagram: 'Instagram',
    spotify: 'Spotify',
    youtube: 'YouTube',
    soundcloud: 'SoundCloud'
  }
  return platforms[platform] || platform
}

const getSocialIcon = (platform) => {
  const icons = {
    twitter: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
    instagram: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zm1.5-4.87h.01',
    spotify: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.5c-.17 0-.33-.08-.43-.2-.24-.31-.18-.76.13-1.01 1.38-1.11 2.18-2.77 2.18-4.54 0-1.77-.8-3.43-2.18-4.54-.31-.25-.37-.7-.13-1.01.25-.31.7-.37 1.01-.13 1.74 1.4 2.75 3.49 2.75 5.68 0 2.19-1.01 4.28-2.75 5.68-.13.1-.28.15-.43.15-.17 0-.34-.06-.47-.16-.24-.31-.18-.76.13-1.01z',
    youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    soundcloud: 'M3 11v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zm3-3v5c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1s-1 .45-1 1zm3-3v8c0 .55.45 1 1 1s1-.45 1-1V5c0-.55-.45-1-1-1s-1 .45-1 1zm3-2v10c0 .55.45 1 1 1s1-.45 1-1V3c0-.55-.45-1-1-1s-1 .45-1 1zm3 2v8c0 .55.45 1 1 1s1-.45 1-1V5c0-.55-.45-1-1-1s-1 .45-1 1z'
  }
  return icons[platform] || 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
}

const saveProfile = async () => {
  try {
    const updateData = {
      full_name: editedProfile.full_name,
      bio: editedProfile.bio
    }
    
    const result = await apiService.update('user_profiles', profile.id, updateData)
    if (result.data) {
      Object.assign(profile, result.data)
      editMode.value = false
      showToast({ message: 'Profile updated successfully', type: 'success' })
    }
  } catch (error) {
    console.error('Failed to save profile:', error)
    showToast({ message: 'Failed to save profile', type: 'error' })
  }
}

const saveSocial = async () => {
  try {
    // Filter out empty links
    const socialLinks = {}
    Object.entries(editedSocial).forEach(([platform, url]) => {
      if (url && url.trim()) {
        socialLinks[platform] = url.trim()
      }
    })
    
    const result = await apiService.update('user_profiles', profile.id, { social_links: socialLinks })
    if (result.data) {
      profile.social_links = socialLinks
      editSocial.value = false
      showToast({ message: 'Social links updated successfully', type: 'success' })
    }
  } catch (error) {
    console.error('Failed to save social links:', error)
    showToast({ message: 'Failed to save social links', type: 'error' })
  }
}

const cancelSocialEdit = () => {
  editSocial.value = false
  // Reset edited social to current values
  Object.assign(editedSocial, profile.social_links || {})
}

const updatePreference = async (key, value) => {
  try {
    const result = await apiService.update('user_preferences', profile.id, { [key]: value })
    showToast({ message: 'Preference updated', type: 'success' })
  } catch (error) {
    console.error('Failed to update preference:', error)
    preferences[key] = !value // Revert on error
    showToast({ message: 'Failed to update preference', type: 'error' })
  }
}

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const uploadResult = await apiService.uploadFile('avatars', file)
    const result = await apiService.update('user_profiles', profile.id, { avatar_url: uploadResult.publicUrl })
    
    if (result.data) {
      profile.avatar_url = uploadResult.publicUrl
      showToast({ message: 'Avatar updated successfully', type: 'success' })
    }
    
    // Clear input
    event.target.value = ''
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    showToast({ message: 'Failed to upload avatar', type: 'error' })
  }
}

// Initialize edit forms
const initEditForms = () => {
  editedProfile.full_name = profile.full_name
  editedProfile.bio = profile.bio || ''
  Object.assign(editedSocial, profile.social_links || {})
}

onMounted(() => {
  loadProfile().then(() => {
    initEditForms()
  })
})
</script>

<style scoped>
.profile-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  overflow-y: auto;
}

.profile-header {
  position: relative;
  padding: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.profile-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 32px;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 600;
  color: white;
  border: 3px solid rgba(255, 255, 255, 0.1);
}

.change-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.change-avatar-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.4);
}

.change-avatar-btn svg {
  width: 18px;
  height: 18px;
  color: white;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 32px;
  font-weight: 300;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.profile-email {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 16px;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-badge.owner {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.role-badge.editor {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.join-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.profile-actions {
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.4);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.profile-body {
  flex: 1;
  padding: 48px;
}

.profile-sections {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.edit-section-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.edit-section-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.edit-section-btn svg {
  width: 16px;
  height: 16px;
}

.section-content {
  padding: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.info-value {
  font-size: 16px;
  color: white;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-actions {
  display: flex;
  gap: 12px;
}

.save-btn,
.cancel-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.save-btn:hover {
  background: rgba(34, 197, 94, 0.2);
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.save-btn svg {
  width: 16px;
  height: 16px;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.social-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.social-icon.twitter {
  background: rgba(29, 161, 242, 0.1);
  color: #1da1f2;
}

.social-icon.instagram {
  background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
  color: white;
}

.social-icon.spotify {
  background: rgba(30, 215, 96, 0.1);
  color: #1ed760;
}

.social-icon.youtube {
  background: rgba(255, 0, 0, 0.1);
  color: #ff0000;
}

.social-icon.soundcloud {
  background: rgba(255, 85, 0, 0.1);
  color: #ff5500;
}

.social-icon svg {
  width: 20px;
  height: 20px;
}

.social-platform {
  font-weight: 500;
  min-width: 100px;
}

.social-url {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
}

.social-url:hover {
  color: white;
  text-decoration: underline;
}

.empty-social {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 32px;
}

.edit-social {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preferences-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.preference-info {
  flex: 1;
}

.preference-label {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.preference-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  top: 2px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
}

input:checked + .toggle-slider {
  background: rgba(34, 197, 94, 0.3);
  border-color: #22c55e;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
  background: #22c55e;
}

.hidden-input {
  display: none;
}

@media (max-width: 768px) {
  .profile-header {
    padding: 32px 24px;
  }

  .profile-content {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }

  .profile-name {
    font-size: 28px;
  }

  .profile-body {
    padding: 32px 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
