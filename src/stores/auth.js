import { defineStore } from "pinia";
import { ref, computed } from "vue";

const MOCK_ACCESS_PROFILES = {
  owner: {
    role: "owner",
    shell_mode: "platform",
    assigned_artist_slugs: ["*"],
  },
  manager: {
    role: "manager",
    shell_mode: "platform",
    assigned_artist_slugs: ["taylor-swift", "the-weeknd"],
  },
  editor: {
    role: "editor",
    shell_mode: "platform",
    assigned_artist_slugs: ["taylor-swift", "billie-eilish"],
  },
  artist: {
    role: "artist",
    shell_mode: "artist",
    assigned_artist_slugs: ["taylor-swift"],
  },
  label: {
    role: "label",
    shell_mode: "artist",
    assigned_artist_slugs: ["taylor-swift"],
  },
  partner: {
    role: "partner",
    shell_mode: "artist",
    assigned_artist_slugs: ["taylor-swift"],
  },
};

const getStoredAccessPreset = () => {
  if (typeof window === "undefined") return "owner";
  const stored = window.localStorage.getItem("mhMockAccessPreset");
  return stored && MOCK_ACCESS_PROFILES[stored] ? stored : "owner";
};

const buildMockProfile = (presetKey = "owner") => {
  const preset = MOCK_ACCESS_PROFILES[presetKey] || MOCK_ACCESS_PROFILES.owner;
  return {
    id: "mock-user-123",
    email: "demo@example.com",
    full_name: "Demo User",
    avatar_url: "https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256",
    preferences: {},
    social_links: {},
    ...preset,
  };
};

export const useAuthStore = defineStore("auth", () => {
  // State - MOCK MODE: Always authenticated with demo user
  const user = ref(null);
  const profile = ref(null);
  const loading = ref(false); // Start with false since we're mocked
  const isInitialized = ref(false);
  const accessPreset = ref(getStoredAccessPreset());

  // Mock user data
  const MOCK_USER = {
    id: "mock-user-123",
    email: "demo@example.com",
    user_metadata: {
      full_name: "Demo User",
      avatar_url: "https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256",
    },
  };

  // Computed
  const isAuthenticated = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email || "");
  const userName = computed(() => profile.value?.full_name || userEmail.value || "User");
  const userRole = computed(() => profile.value?.role || "artist");
  const shellMode = computed(() => {
    if (profile.value?.shell_mode) return profile.value.shell_mode;
    return ["artist", "label", "partner"].includes(userRole.value) ? "artist" : "platform";
  });
  const assignedArtistSlugs = computed(() => {
    return Array.isArray(profile.value?.assigned_artist_slugs)
      ? profile.value.assigned_artist_slugs.filter(Boolean)
      : [];
  });
  const isArtistScoped = computed(() => shellMode.value === "artist");
  const isPlatformScoped = computed(() => shellMode.value === "platform");
  const hasAllArtistsAccess = computed(() => {
    return isPlatformScoped.value && assignedArtistSlugs.value.includes("*");
  });
  const isManager = computed(() =>
    ["manager", "admin", "owner", "editor"].includes(userRole.value),
  );
  const userAvatar = computed(() => profile.value?.avatar_url || ""); // empty string instead of null

  // Role-based permissions
  const canCreateArtist = computed(() => {
    return ["owner", "admin", "manager"].includes(userRole.value);
  });

  const canManageUsers = computed(() => {
    return ["owner", "admin"].includes(userRole.value);
  });

  // Actions
  const initialize = async () => {
    try {
      loading.value = true;

      // MOCK MODE: Immediately set mock user as authenticated
      console.log("🎭 MOCK MODE: Auto-authenticating demo user");
      user.value = MOCK_USER;
      profile.value = buildMockProfile(accessPreset.value);

      isInitialized.value = true;
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      loading.value = false;
    }
  };

  // All auth methods are mocked to work locally
  const signInWithMagicLink = async (email) => {
    try {
      loading.value = true;
      console.log("🎭 MOCK MODE: Magic link sign in for", email);

      // Auto-authenticate with mock user
      user.value = MOCK_USER;
      profile.value = buildMockProfile(accessPreset.value);

      return { success: true };
    } catch (error) {
      console.error("Magic link error:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const signInWithPassword = async (email, _password) => {
    try {
      loading.value = true;
      console.log("🎭 MOCK MODE: Password sign in for", email);

      // Auto-authenticate with mock user
      user.value = MOCK_USER;
      profile.value = buildMockProfile(accessPreset.value);

      return { success: true, user: MOCK_USER };
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const signUp = async (email, _password, _metadata = {}) => {
    try {
      loading.value = true;
      console.log("🎭 MOCK MODE: Sign up for", email);

      // Auto-authenticate with mock user
      user.value = MOCK_USER;
      profile.value = buildMockProfile(accessPreset.value);

      return { success: true, user: MOCK_USER };
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    try {
      loading.value = true;
      console.log("🎭 MOCK MODE: Sign out called, but staying authenticated for testing");

      // In mock mode, don't actually sign out
      // Just simulate the action
      return true;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user.value) throw new Error("No user logged in");

      // MOCK MODE: Update local profile data
      profile.value = {
        ...profile.value,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      console.log("🎭 MOCK MODE: Profile updated locally", updates);
      return profile.value;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const updatePassword = async (_currentPassword, _newPassword) => {
    try {
      console.log("🎭 MOCK MODE: Password update simulated");
      return { success: true };
    } catch (error) {
      console.error("Password update error:", error);
      throw error;
    }
  };

  const uploadAvatar = async (file) => {
    try {
      if (!user.value) throw new Error("No user logged in");

      console.log("🎭 MOCK MODE: Avatar upload simulated for", file.name);

      // Generate a mock URL
      const publicUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.value)}&background=6366f1&color=fff&size=256`;

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      throw error;
    }
  };

  // Artist access control helpers
  const filterAccessibleArtists = (artists = []) => {
    if (!Array.isArray(artists)) return [];
    if (hasAllArtistsAccess.value) return artists;

    const allowed = new Set(assignedArtistSlugs.value);
    return artists.filter((artist) => {
      const slug = typeof artist?.slug === "string" ? artist.slug : "";
      const id = typeof artist?.id === "string" ? artist.id : "";
      return allowed.has(slug) || allowed.has(id);
    });
  };

  const getDefaultArtistSlug = (artists = []) => {
    const assignedSlug = assignedArtistSlugs.value.find((value) => value && value !== "*");
    if (assignedSlug) return assignedSlug;
    return filterAccessibleArtists(artists)[0]?.slug || "";
  };

  const canAccessArtist = (artistIdentifier) => {
    if (!artistIdentifier) return false;
    if (hasAllArtistsAccess.value) return true;
    return assignedArtistSlugs.value.includes(artistIdentifier);
  };

  const canEditArtist = (_artistId) => {
    return isAuthenticated.value;
  };

  const canDeleteArtist = (_artistId) => {
    return ["owner", "admin"].includes(userRole.value);
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      console.log("🎭 MOCK MODE: Password reset simulated for", email);
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const setMockAccessPreset = (presetKey) => {
    if (!MOCK_ACCESS_PROFILES[presetKey]) return;
    accessPreset.value = presetKey;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mhMockAccessPreset", presetKey);
    }

    if (user.value) {
      profile.value = buildMockProfile(presetKey);
    }
  };

  return {
    // State
    user,
    profile,
    loading,
    isInitialized,

    // Computed
    isAuthenticated,
    userEmail,
    userName,
    userRole,
    shellMode,
    assignedArtistSlugs,
    isArtistScoped,
    isPlatformScoped,
    hasAllArtistsAccess,
    isManager,
    userAvatar,
    canCreateArtist,
    canManageUsers,
    accessPreset,

    // Actions
    initialize,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    uploadAvatar,
    resetPassword,
    setMockAccessPreset,
    filterAccessibleArtists,
    getDefaultArtistSlug,
    canAccessArtist,
    canEditArtist,
    canDeleteArtist,
  };
});
