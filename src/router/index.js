import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Auth views
const LoginView = () => import('@/views/auth/LoginView.vue')
const SignupView = () => import('@/views/auth/SignupView.vue')
const AuthCallbackView = () => import('@/views/auth/AuthCallbackView.vue')
const ForgotPasswordView = () => import('@/views/auth/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@/views/auth/ResetPasswordView.vue')

// Main app views
const DashboardView = () => import('@/views/DashboardView.vue')
const ArtistsView = () => import('@/views/ArtistsView.vue')
const ArtistHubView = () => import('@/views/ArtistHubView.vue')
const MediaLibraryView = () => import('@/views/MediaLibraryView.vue')
const CalendarView = () => import('@/views/CalendarView.vue')
const FilesView = () => import('@/views/FilesView.vue')
const MoodboardsView = () => import('@/views/MoodboardsView.vue')
const TimelineView = () => import('@/views/TimelineView.vue')
const NotesView = () => import('@/views/NotesView.vue')
const TeamView = () => import('@/views/TeamView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const PreferencesView = () => import('@/views/PreferencesView.vue')

const routes = [
  // Root redirect
  {
    path: '/',
    redirect: '/dashboard'
  },

  // Authentication routes
  {
    path: '/auth',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: LoginView,
        meta: {
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'signup',
        name: 'Signup',
        component: SignupView,
        meta: {
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'callback',
        name: 'AuthCallback',
        component: AuthCallbackView,
        meta: { requiresAuth: false }
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: ForgotPasswordView,
        meta: {
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'reset-password',
        name: 'ResetPassword',
        component: ResetPasswordView,
        meta: { requiresAuth: false }
      }
    ]
  },

  // Main application routes
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/artists',
    name: 'Artists',
    component: ArtistsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/artists/:slug',
    name: 'ArtistHub',
    component: ArtistHubView,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/files',
    name: 'Files',
    component: FilesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/media',
    name: 'MediaLibrary',
    component: MediaLibraryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/moodboards',
    name: 'Moodboards',
    component: MoodboardsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: TimelineView,
    meta: { requiresAuth: true }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: NotesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/team',
    name: 'Team',
    component: TeamView,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/preferences',
    name: 'Preferences',
    component: PreferencesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/media-library',
    name: 'media-library',
    component: () => import('../views/MediaLibraryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/songs',
    name: 'songs',
    component: () => import('../views/SongsLibraryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/playlists',
    name: 'playlists',
    component: () => import('../views/PlaylistsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/playlists/:id',
    name: 'playlist-detail',
    component: () => import('../views/PlaylistDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('../views/CalendarView.vue'),
    meta: { requiresAuth: true }
  },

  // 404 catch all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards - MOCK MODE: Bypass auth checks for UI testing
router.beforeEach(async (to, from, next) => {
  console.log('🎭 MOCK MODE: Router navigation to', to.path)
  
  const authStore = useAuthStore()

  // Wait for auth initialization
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const hideForAuthenticated = to.matched.some(record => record.meta.hideForAuthenticated)
  
  // MOCK MODE: Always consider user authenticated
  const isAuthenticated = true

  if (requiresAuth && !isAuthenticated) {
    // This shouldn't happen in mock mode, but keeping for consistency
    console.log('🎭 MOCK MODE: Auth required but not authenticated (should not happen)')
    next('/auth/login')
  } else if (hideForAuthenticated && isAuthenticated) {
    // Redirect to dashboard if already authenticated and trying to access auth pages
    console.log('🎭 MOCK MODE: Already authenticated, redirecting to dashboard')
    next('/dashboard')
  } else {
    // Proceed normally
    next()
  }
})

// Error handling
router.onError((error) => {
  console.error('Router error:', error)
})

export default router
