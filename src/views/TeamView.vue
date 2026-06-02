<template>
  <WorkspacePage
    class="team-view"
    eyebrow="People"
    title="Team"
    :count="teamMembers.length"
    subtitle="Manage team members and permissions"
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="openInviteModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        <span>Invite Member</span>
      </button>
    </template>

    <template #stats>
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
    </template>

    <template #toolbar>
      <div class="search-container">
        <div class="search-wrapper">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="search-icon"
          >
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
    </template>

    <!-- Team Members Grid -->
    <div class="team-container" @contextmenu.prevent="openTeamWorkspaceMenu">
      <div v-if="filteredMembers.length > 0" class="team-grid collection-grid-compact">
        <div
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-card"
          :class="{ pending: member.status === 'pending', inactive: member.status === 'inactive' }"
          @contextmenu.prevent.stop="openMemberContextMenu($event, member)"
        >
          <div class="member-avatar">
            <img v-if="hasCustomAvatar(member.avatar)" :src="member.avatar" :alt="member.name" />
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
                  <path
                    d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                  />
                </svg>
                <span>{{ formatJoinDate(member.joinedAt) }}</span>
              </div>

              <div v-if="member.lastActive" class="meta-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <span>{{ formatLastActive(member.lastActive) }}</span>
              </div>
            </div>

            <div v-if="member.projects?.length > 0" class="member-projects">
              <h4 class="projects-title">Projects</h4>
              <div class="project-tags">
                <span
                  v-for="project in member.projects.slice(0, 2)"
                  :key="project"
                  class="project-tag"
                >
                  {{ project }}
                </span>
                <span v-if="member.projects.length > 2" class="project-more">
                  +{{ member.projects.length - 2 }}
                </span>
              </div>
            </div>
          </div>

          <div class="member-actions">
            <button
              class="action-btn"
              @click="openEditMemberModal(member)"
              :disabled="member.status === 'pending'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
            </button>

            <button
              v-if="member.status === 'pending'"
              class="action-btn primary"
              @click="resendInvite(member)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>

            <button
              v-if="member.role !== 'owner'"
              class="action-btn danger"
              @click="removeMember(member)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="80" r="30" stroke="currentColor" stroke-width="2" opacity="0.3" />
            <path
              d="M70 130c0-16.57 13.43-30 30-30s30 13.43 30 30"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.3"
            />
            <circle cx="60" cy="70" r="20" stroke="currentColor" stroke-width="2" opacity="0.2" />
            <path
              d="M40 110c0-11.05 8.95-20 20-20s20 8.95 20 20"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.2"
            />
            <circle cx="140" cy="70" r="20" stroke="currentColor" stroke-width="2" opacity="0.2" />
            <path
              d="M120 110c0-11.05 8.95-20 20-20s20 8.95 20 20"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.2"
            />
          </svg>
        </div>
        <h3 class="empty-title">
          {{
            searchQuery || filterRole || filterStatus ? "No team members found" : "Build your team"
          }}
        </h3>
        <p class="empty-text">
          {{
            searchQuery || filterRole || filterStatus
              ? "Try adjusting your search or filters"
              : "Invite team members to collaborate on projects"
          }}
        </p>
        <button
          v-if="!searchQuery && !filterRole && !filterStatus"
          class="invite-btn large"
          @click="openInviteModal"
        >
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

    <teleport to="body">
      <transition name="fade">
        <div v-if="memberModalOpen" class="modal-overlay" @click.self="closeMemberModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>
                  {{ memberModalMode === "invite" ? "Invite Team Member" : "Edit Team Member" }}
                </h2>
                <p>
                  {{
                    memberModalMode === "invite"
                      ? "Prepare access for a new collaborator."
                      : "Adjust role and access details."
                  }}
                </p>
              </div>
              <button class="modal-close" @click="closeMemberModal">×</button>
            </div>

            <form class="modal-form" @submit.prevent="submitMemberModal">
              <div class="modal-grid">
                <label>
                  <span>Full Name</span>
                  <input v-model="memberDraft.name" type="text" placeholder="Jane Doe" required />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    v-model="memberDraft.email"
                    type="email"
                    placeholder="jane@example.com"
                    :disabled="memberModalMode === 'edit'"
                    required
                  />
                </label>
                <label>
                  <span>Role</span>
                  <select v-model="memberDraft.role">
                    <option value="owner">Owner</option>
                    <option value="editor">Editor</option>
                    <option value="artist">Artist</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select v-model="memberDraft.status">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <div class="modal-actions">
                <button type="button" class="ghost-btn" @click="closeMemberModal">Cancel</button>
                <button type="submit" class="primary-btn">
                  {{ memberModalMode === "invite" ? "Invite Member" : "Save Changes" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div
          v-if="removeMemberModalOpen"
          class="modal-overlay"
          @click.self="closeRemoveMemberModal"
        >
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Remove Team Member</h2>
                <p>Remove this collaborator from the current workspace.</p>
              </div>
              <button class="modal-close" @click="closeRemoveMemberModal">×</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ pendingRemovalMember?.name }}</strong>
              <p>{{ pendingRemovalMember?.email }}</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="ghost-btn" @click="closeRemoveMemberModal">
                Cancel
              </button>
              <button type="button" class="danger-btn" @click="confirmRemoveMember">
                Remove Member
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject, reactive } from "vue";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { apiService } from "@/shared/services/api";
import { getInitials, hasCustomAvatar } from "@/shared/utils/avatar";

const showToast = inject("showToast", () => {});
const showContextMenu = inject("showContextMenu", () => {});

// State
const teamMembers = ref([]);
const searchQuery = ref("");
const filterRole = ref("");
const filterStatus = ref("");
const TEAM_STORAGE_KEY = "musicHub.teamMembers";
const memberModalOpen = ref(false);
const memberModalMode = ref("invite");
const activeMemberId = ref("");
const removeMemberModalOpen = ref(false);
const pendingRemovalMember = ref(null);
const memberDraft = reactive({
  name: "",
  email: "",
  role: "viewer",
  status: "pending",
});

// Mock data
const mockTeamMembers = [
  {
    id: "member-1",
    name: "Demo User",
    email: "demo@example.com",
    avatar: "https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=64",
    role: "owner",
    status: "active",
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    projects: ["Midnight Dreams", "Summer Tour", "Holiday EP"],
  },
  {
    id: "member-2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=22c55e&color=fff&size=64",
    role: "editor",
    status: "active",
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    projects: ["Midnight Dreams", "Summer Tour"],
  },
  {
    id: "member-3",
    name: "Mike Rodriguez",
    email: "mike@example.com",
    avatar: null,
    role: "artist",
    status: "active",
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    projects: ["Collaboration Track"],
  },
  {
    id: "member-4",
    name: "Alex Chen",
    email: "alex@example.com",
    avatar: "https://ui-avatars.com/api/?name=Alex+Chen&background=f59e0b&color=fff&size=64",
    role: "viewer",
    status: "pending",
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: null,
    projects: [],
  },
  {
    id: "member-5",
    name: "Jordan Taylor",
    email: "jordan@example.com",
    avatar: "https://ui-avatars.com/api/?name=Jordan+Taylor&background=ef4444&color=fff&size=64",
    role: "editor",
    status: "inactive",
    joinedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    projects: ["Old Project"],
  },
];

// Computed
const filteredMembers = computed(() => {
  let result = [...teamMembers.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (member) =>
        member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query),
    );
  }

  // Role filter
  if (filterRole.value) {
    result = result.filter((member) => member.role === filterRole.value);
  }

  // Status filter
  if (filterStatus.value) {
    result = result.filter((member) => member.status === filterStatus.value);
  }

  return result.sort((a, b) => {
    // Owner first, then by status (active > pending > inactive), then by name
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (a.role !== "owner" && b.role === "owner") return 1;

    const statusOrder = { active: 0, pending: 1, inactive: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    return a.name.localeCompare(b.name);
  });
});

const activeMembers = computed(() => {
  return teamMembers.value.filter((member) => member.status === "active").length;
});

const pendingInvites = computed(() => {
  return teamMembers.value.filter((member) => member.status === "pending").length;
});

const roleDistribution = computed(() => {
  const distribution = {};
  teamMembers.value.forEach((member) => {
    distribution[member.role] = (distribution[member.role] || 0) + 1;
  });
  return distribution;
});

// Methods
const loadTeamMembers = async () => {
  const cached = localStorage.getItem(TEAM_STORAGE_KEY);
  if (cached) {
    try {
      teamMembers.value = JSON.parse(cached);
      return;
    } catch {
      localStorage.removeItem(TEAM_STORAGE_KEY);
    }
  }

  try {
    const result = await apiService.getAll("artist_team");
    const mappedMembers = (result.data || [])
      .map((member) => {
        const profile = member.profiles || {};
        const displayName = profile.full_name || profile.email || member.name;
        if (!displayName) return null;
        return {
          id: member.id,
          name: displayName,
          email: profile.email || member.email || "",
          avatar: profile.avatar_url || null,
          role: member.role || "viewer",
          status: member.accepted_at ? "active" : "pending",
          joinedAt: member.created_at || member.invited_at || new Date().toISOString(),
          lastActive: member.updated_at || null,
          projects: [],
        };
      })
      .filter(Boolean);

    teamMembers.value = mappedMembers.length > 0 ? mappedMembers : mockTeamMembers;
  } catch (error) {
    console.error("Failed to load team members:", error);
    teamMembers.value = mockTeamMembers;
  }
};

const resetMemberDraft = () => {
  memberDraft.name = "";
  memberDraft.email = "";
  memberDraft.role = "viewer";
  memberDraft.status = "pending";
  activeMemberId.value = "";
};

const openInviteModal = () => {
  memberModalMode.value = "invite";
  resetMemberDraft();
  memberModalOpen.value = true;
};

const openEditMemberModal = (member) => {
  memberModalMode.value = "edit";
  activeMemberId.value = member.id;
  memberDraft.name = member.name || "";
  memberDraft.email = member.email || "";
  memberDraft.role = member.role || "viewer";
  memberDraft.status = member.status || "pending";
  memberModalOpen.value = true;
};

const closeMemberModal = () => {
  memberModalOpen.value = false;
  resetMemberDraft();
};

const submitMemberModal = () => {
  const name = memberDraft.name.trim();
  const email = memberDraft.email.trim().toLowerCase();
  const role = ["owner", "editor", "artist", "viewer"].includes(memberDraft.role)
    ? memberDraft.role
    : "viewer";
  const status = ["active", "pending", "inactive"].includes(memberDraft.status)
    ? memberDraft.status
    : "pending";

  if (!name) return;
  if (!email || !email.includes("@")) {
    showToast({ message: "Please enter a valid email address.", type: "error" });
    return;
  }

  if (memberModalMode.value === "invite") {
    const newMember = {
      id: `member-${Date.now()}`,
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff&size=64`,
      role,
      status,
      joinedAt: new Date().toISOString(),
      lastActive: status === "active" ? new Date().toISOString() : null,
      projects: [],
    };

    teamMembers.value.unshift(newMember);
    showToast({ message: `Invitation prepared for ${name}`, type: "success" });
    closeMemberModal();
    return;
  }

  const member = teamMembers.value.find((entry) => entry.id === activeMemberId.value);
  if (!member) return;

  Object.assign(member, {
    name,
    role,
    status,
    avatar:
      member.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff&size=64`,
    lastActive: status === "active" ? new Date().toISOString() : member.lastActive,
  });

  showToast({ message: `Updated ${name}`, type: "success" });
  closeMemberModal();
};

const resendInvite = (member) => {
  member.status = "pending";
  member.joinedAt = new Date().toISOString();
  showToast({ message: `Resent invite to ${member.email}`, type: "success" });
};

const removeMember = async (member) => {
  pendingRemovalMember.value = member;
  removeMemberModalOpen.value = true;
};

const setMemberRole = (member, role) => {
  member.role = role;
  showToast({ message: `${member.name} is now ${formatRole(role)}`, type: "success" });
};

const setMemberStatus = (member, status) => {
  member.status = status;
  if (status === "active") {
    member.lastActive = new Date().toISOString();
  }
  showToast({ message: `${member.name} marked ${status}`, type: "success" });
};

const openMemberContextMenu = (event, member) => {
  const actions = [{ label: "Edit Member", handler: () => openEditMemberModal(member) }];

  if (member.status === "pending") {
    actions.push({ label: "Resend Invite", handler: () => resendInvite(member) });
  }

  if (member.role !== "owner" && member.role !== "editor") {
    actions.push({ label: "Make Editor", handler: () => setMemberRole(member, "editor") });
  }

  if (member.role !== "owner" && member.role !== "viewer") {
    actions.push({ label: "Make Viewer", handler: () => setMemberRole(member, "viewer") });
  }

  if (member.status !== "active") {
    actions.push({ label: "Mark Active", handler: () => setMemberStatus(member, "active") });
  }

  if (member.status !== "inactive") {
    actions.push({ label: "Mark Inactive", handler: () => setMemberStatus(member, "inactive") });
  }

  if (member.role !== "owner") {
    actions.push(
      { separator: true },
      {
        label: "Remove Member",
        destructive: true,
        handler: () => removeMember(member),
      },
    );
  }

  showContextMenu(event, actions, "custom");
};

const openTeamWorkspaceMenu = (event) => {
  if (event.target.closest(".member-card")) return;

  showContextMenu(
    event,
    [
      { label: "Invite Member", handler: () => openInviteModal() },
      {
        label: "Show All Members",
        handler: () => {
          searchQuery.value = "";
          filterRole.value = "";
          filterStatus.value = "";
        },
      },
      {
        label: "Show Editors",
        handler: () => {
          filterRole.value = "editor";
        },
      },
      {
        label: "Show Pending Invites",
        handler: () => {
          filterStatus.value = "pending";
        },
      },
    ],
    "custom",
  );
};

const closeRemoveMemberModal = () => {
  removeMemberModalOpen.value = false;
  pendingRemovalMember.value = null;
};

const confirmRemoveMember = async () => {
  if (!pendingRemovalMember.value) return;

  const member = pendingRemovalMember.value;
  try {
    try {
      await apiService.delete("artist_team", member.id);
    } catch {
      // Local-only removal is acceptable in demo mode.
    }
    teamMembers.value = teamMembers.value.filter((m) => m.id !== member.id);
    showToast({ message: `${member.name} removed from team`, type: "success" });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    showToast({ message: "Failed to remove team member", type: "error" });
  } finally {
    closeRemoveMemberModal();
  }
};

const formatRole = (role) => {
  const roles = {
    owner: "Owner",
    editor: "Editor",
    artist: "Artist",
    viewer: "Viewer",
  };
  return roles[role] || role;
};

const formatJoinDate = (isoString) => {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
};

const formatLastActive = (isoString) => {
  if (!isoString) return "Never";

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

onMounted(() => {
  loadTeamMembers();
});

watch(
  teamMembers,
  (members) => {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
  },
  { deep: true },
);
</script>

<style scoped>
.team-view {
  min-height: 100%;
  background: transparent;
  color: var(--color-text);
}

/* Team Container */
.team-container {
  flex: 1;
  padding: 0 0 48px;
  overflow-y: auto;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(var(--collection-card-min), 100%), var(--collection-card-min))
  );
  justify-content: start;
  gap: var(--collection-grid-gap);
}

.member-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.member-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.member-card.pending {
  border-left: 3px solid var(--color-warning);
}

.member-card.inactive {
  opacity: 0.6;
  border-left: 3px solid #6b7280;
}

.member-avatar {
  position: relative;
  width: 52px;
  height: 52px;
  margin-bottom: 12px;
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
  background: linear-gradient(135deg, var(--color-accent) 0%, #201d1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--placeholder-initial-avatar);
  font-weight: 600;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #000;
}

.status-indicator.active {
  background: var(--color-accent);
}

.status-indicator.pending {
  background: var(--color-danger);
}

.status-indicator.inactive {
  background: var(--color-text-tertiary);
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.member-email {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 10px;
}

.member-role {
  margin-bottom: 10px;
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
  background: rgba(17, 16, 15, 0.08);
  color: var(--color-info);
  border: 1px solid rgba(17, 16, 15, 0.14);
}

.role-badge.editor {
  background: rgba(232, 90, 25, 0.12);
  color: var(--color-accent);
  border: 1px solid rgba(232, 90, 25, 0.2);
}

.role-badge.artist {
  background: rgba(201, 78, 23, 0.1);
  color: var(--color-warning);
  border: 1px solid rgba(201, 78, 23, 0.18);
}

.role-badge.viewer {
  background: rgba(17, 16, 15, 0.04);
  color: var(--color-text-secondary);
  border: 1px solid rgba(17, 16, 15, 0.08);
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.member-projects {
  margin-bottom: 0;
}

.projects-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.project-tag {
  padding: 3px 7px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.project-more {
  padding: 3px 7px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.member-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.member-card:hover .member-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
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
  background: rgba(232, 90, 25, 0.12);
  border-color: rgba(232, 90, 25, 0.22);
  color: var(--color-accent);
}

.action-btn.primary:hover {
  background: rgba(232, 90, 25, 0.18);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn svg {
  width: 14px;
  height: 14px;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.76);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.modal-card {
  width: min(640px, 100%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.4);
  padding: 22px;
}

.modal-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 12px;
  margin-bottom: 18px;
}

.modal-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 320;
}

.modal-head p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.58);
}

.modal-close,
.ghost-btn,
.primary-btn,
.danger-btn {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.modal-close {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 22px;
}

.modal-form {
  display: grid;
  gap: 14px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.modal-form label {
  display: grid;
  gap: 8px;
}

.modal-form span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.modal-form input,
.modal-form select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font: inherit;
  padding: 12px 14px;
}

.confirm-copy {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.confirm-copy strong,
.confirm-copy p {
  margin: 0;
}

.confirm-copy p {
  color: rgba(255, 255, 255, 0.58);
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ghost-btn,
.primary-btn,
.danger-btn {
  min-height: 42px;
  padding: 0 16px;
  font-weight: 600;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.primary-btn {
  background: #fff;
  color: #000;
  border-color: transparent;
}

.danger-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #ffb4b4;
  border-color: rgba(239, 68, 68, 0.35);
}

/* Responsive */
@media (max-width: 768px) {
  .team-container {
    padding: 0 0 24px;
  }

  .team-grid {
    grid-template-columns: 1fr;
  }

  .modal-grid,
  .modal-actions {
    grid-template-columns: 1fr;
  }
}

/* Theme override */
.team-view {
  color: var(--color-text);
  background: transparent;
}

.team-view .member-card,
.team-view .empty-state {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.76)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: none;
}

.team-view .modal-card {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.76)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
}

.team-view .member-email,
.team-view .meta-item,
.team-view .confirm-copy p {
  color: var(--color-text-secondary);
}

.team-view .projects-title {
  color: var(--color-text);
}

.team-view .project-tag {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-secondary);
  box-shadow: none;
}

.team-view .member-name,
.team-view .confirm-copy strong {
  color: var(--color-text);
}
</style>
