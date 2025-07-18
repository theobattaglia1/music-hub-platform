<template>
  <div class="team-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Team</span>
            <span class="title-count">{{ teamMembers.length }}</span>
          </h1>
          <p class="view-subtitle">Manage team members and permissions</p>
        </div>
        <button class="invite-btn" @click="inviteTeamMember">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          <span>Invite Member</span>
        </button>
      </div>

      <!-- Team Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{ activeMembers }}</div>
          <div class="stat-label">Active Members</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ pendingInvites }}</div>
          <div class="stat-label">Pending Invites</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ Object.keys(roleDistribution).length }}</div>
          <div class="stat-label">Different Roles</div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div class="search-container">
        <div class="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search team members..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <div class="custom-select">
          <select v-model="filterRole" class="filter-select">
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="artist">Artist</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div class="custom-select">
          <select v-model="filterStatus" class="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Team Members Grid -->
    <div class="team-container">
      <div v-if="filteredMembers.length > 0" class="team-grid">
        <div
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-card"
          :class="{ pending: member.status === 'pending', inactive: member.status === 'inactive' }"
        >
          <div class="member-avatar">
            <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
            <div v-else class="avatar-placeholder">
              <span>{{ getInitials(member.name) }}</span>
            </div>
            <div class="status-indicator" :class="member.status"></div>
          </div>

          <div class="member-info">
            <h3 class="member-name">{{ member.name }}</h3>
            <p class="member-email">{{ member.email }}</p>
            
            <div class="member-role">
              <span class="role-badge" :class="member.role">{{ formatRole(member.role) }}</span>
            </div>

            <div class="member-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>{{ formatJoinDate(member.joinedAt) }}</span>
              </div>
              
              <div v-if="member.lastActive" class="meta-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>{{ formatLastActive(member.lastActive) }}</span>
              </div>
            </div>

            <div v-if="member.projects?.length > 0" class="member-projects">
              <h4 class="projects-title">Projects</h4>
              <div class="project-tags">
                <span
                  v-for="project in member.projects.slice(0, 3)"
                  :key="project"
                  class="project-tag"
                >
                  {{ project }}
                </span>
                <span v-if="member.projects.length > 3" class="project-more">
                  +{{ member.projects.length - 3 }}
                </span>
              </div>
            </div>
          </div>

          <div class="member-actions">
            <button class="action-btn" @click="editMember(member)" :disabled="member.status === 'pending'">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            
            <button v-if="member.status === 'pending'" class="action-btn primary" @click="resendInvite(member)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>

            <button
              v-if="member.role !== 'owner'"
              class="action-btn danger"
              @click="removeMember(member)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="80" r="30" stroke="currentColor" stroke-width="2" opacity="0.3"/>
            <path d="M70 130c0-16.57 13.43-30 30-30s30 13.43 30 30" stroke="currentColor" stroke-width="2" opacity="0.3"/>
            <circle cx="60" cy="70" r="20" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <path d="M40 110c0-11.05 8.95-20 20-20s20 8.95 20 20" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <circle cx="140" cy="70" r="20" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <path d="M120 110c0-11.05 8.95-20 20-20s20 8.95 20 20" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ searchQuery || filterRole || filterStatus ? 'No team members found' : 'Build your team' }}</h3>
        <p class="empty-text">
          {{ searchQuery || filterRole || filterStatus ? 'Try adjusting your search or filters' : 'Invite team members to collaborate on projects' }}
        </p>
        <button v-if="!searchQuery && !filterRole && !filterStatus" class="invite-btn large" @click="inviteTeamMember">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          <span>Invite Your First Team Member</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { apiService } from '@/shared/services/api'

const showToast = inject('showToast', () => {})

// State
const teamMembers = ref([])
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// Mock data
const mockTeamMembers = [
  {
    id: 'member-1',
    name: 'Demo User',
    email: 'demo@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=64',
    role: 'owner',
    status: 'active',
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    projects: ['Midnight Dreams', 'Summer Tour', 'Holiday EP']
  },
  {
    id: 'member-2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=22c55e&color=fff&size=64',
    role: 'editor',
    status: 'active',
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    projects: ['Midnight Dreams', 'Summer Tour']
  },
  {
    id: 'member-3',
    name: 'Mike Rodriguez',
    email: 'mike@example.com',
    avatar: null,
    role: 'artist',
    status: 'active',
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    projects: ['Collaboration Track']
  },
  {
    id: 'member-4',
    name: 'Alex Chen',
    email: 'alex@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=f59e0b&color=fff&size=64',
    role: 'viewer',
    status: 'pending',
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: null,
    projects: []
  },
  {
    id: 'member-5',
    name: 'Jordan Taylor',
    email: 'jordan@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Jordan+Taylor&background=ef4444&color=fff&size=64',
    role: 'editor',
    status: 'inactive',
    joinedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    projects: ['Old Project']
  }
]

// Computed
const filteredMembers = computed(() => {
  let result = [...teamMembers.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(member =>
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (filterRole.value) {
    result = result.filter(member => member.role === filterRole.value)
  }

  // Status filter
  if (filterStatus.value) {
    result = result.filter(member => member.status === filterStatus.value)
  }

  return result.sort((a, b) => {
    // Owner first, then by status (active > pending > inactive), then by name
    if (a.role === 'owner' && b.role !== 'owner') return -1
    if (a.role !== 'owner' && b.role === 'owner') return 1
    
    const statusOrder = { active: 0, pending: 1, inactive: 2 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    
    return a.name.localeCompare(b.name)
  })
})

const activeMembers = computed(() => {
  return teamMembers.value.filter(member => member.status === 'active').length
})

const pendingInvites = computed(() => {
  return teamMembers.value.filter(member => member.status === 'pending').length
})

const roleDistribution = computed(() => {
  const distribution = {}
  teamMembers.value.forEach(member => {
    distribution[member.role] = (distribution[member.role] || 0) + 1
  })
  return distribution
})

// Methods
const loadTeamMembers = async () => {
  try {
    const result = await apiService.getAll('team_members')
    teamMembers.value = result.data?.length > 0 ? result.data : mockTeamMembers
  } catch (error) {
    console.error('Failed to load team members:', error)
    teamMembers.value = mockTeamMembers
  }
}

const inviteTeamMember = () => {
  showToast({ message: 'Team invite form coming soon', type: 'info' })
}

const editMember = (member) => {
  showToast({ message: `Editing ${member.name} (form coming soon)`, type: 'info' })
}

const resendInvite = (member) => {
  showToast({ message: `Resending invite to ${member.email}`, type: 'success' })
}

const removeMember = async (member) => {
  if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
    try {
      await apiService.delete('team_members', member.id)
      teamMembers.value = teamMembers.value.filter(m => m.id !== member.id)
      showToast({ message: `${member.name} removed from team`, type: 'success' })
    } catch (error) {
      console.error('Failed to remove team member:', error)
      showToast({ message: 'Failed to remove team member', type: 'error' })
    }
  }
}

const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'
}

const formatRole = (role) => {
  const roles = {
    owner: 'Owner',
    editor: 'Editor',
    artist: 'Artist',
    viewer: 'Viewer'
  }
  return roles[role] || role
}

const formatJoinDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
}

const formatLastActive = (isoString) => {
  if (!isoString) return 'Never'
  
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

onMounted(() => {
  loadTeamMembers()
})
</script>

<style scoped>
.team-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  overflow: hidden;
}

/* Header styles - reusing patterns */
.view-header {
  position: relative;
  padding: 48px 48px 0;
  margin-bottom: 32px;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
  pointer-events: none;
  animation: pulse 20s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.title-section {
  flex: 1;
}

.view-title {
  display: flex;
  align-items: baseline;
  gap: 16px;
  font-size: 48px;
  font-weight: 200;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.title-count {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.invite-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.invite-btn.large {
  padding: 16px 32px;
  font-size: 16px;
}

.invite-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.btn-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.invite-btn:hover .btn-bg {
  width: 200%;
  height: 200%;
}

.invite-btn svg {
  width: 20px;
  height: 20px;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* Controls */
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
  margin-bottom: 32px;
  gap: 32px;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 48px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.custom-select {
  position: relative;
}

.filter-select {
  padding: 10px 40px 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  min-width: 120px;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Team Container */
.team-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.member-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.member-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.member-card.pending {
  border-left: 3px solid #f59e0b;
}

.member-card.inactive {
  opacity: 0.6;
  border-left: 3px solid #6b7280;
}

.member-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #000;
}

.status-indicator.active {
  background: #22c55e;
}

.status-indicator.pending {
  background: #f59e0b;
}

.status-indicator.inactive {
  background: #6b7280;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}

.member-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 12px;
}

.member-role {
  margin-bottom: 16px;
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

.role-badge.artist {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.role-badge.viewer {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.member-projects {
  margin-bottom: 16px;
}

.projects-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.project-tag {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.project-more {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.member-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.member-card:hover .member-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 0.2);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-illustration {
  width: 160px;
  height: 160px;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.1);
}

.empty-title {
  font-size: 24px;
  font-weight: 300;
  margin: 0 0 8px;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 24px;
  max-width: 320px;
}

/* Responsive */
@media (max-width: 768px) {
  .view-header {
    padding: 32px 24px 0;
  }

  .header-content {
    flex-direction: column;
    gap: 24px;
  }

  .view-title {
    font-size: 36px;
  }

  .stats-bar {
    gap: 24px;
  }

  .controls-section {
    flex-direction: column;
    padding: 0 24px;
    gap: 16px;
  }

  .search-container {
    max-width: none;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .team-container {
    padding: 0 24px 24px;
  }

  .team-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stat-divider {
    display: none;
  }
}
</style>