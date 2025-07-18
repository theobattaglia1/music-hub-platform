# Music Hub Platform

A modern web-based collaborative music workspace for artists, managers, and creative teams — built with Vue 3, Supabase, and Pinia.

## 🚀 Overview

**Music Hub** is the web transformation of a previously desktop-only music management app. It converts static artist profiles into dynamic collaborative dashboards where team members can manage calendars, media, timelines, moodboards, notes, and more — all in real time.

This project inherits proven architecture patterns from the [All My Friends Invoice Tracker](https://accounting.allmyfriendsinc.com) — including authentication, role-based permissions, and a glassmorphic dark UI — and builds on them to serve the needs of the modern music industry.

---

## 🛠 Tech Stack

| Layer       | Tech                                        |
|------------|---------------------------------------------|
| Frontend    | Vue 3 (Composition API), Pinia, Vue Router |
| Backend     | Supabase (PostgreSQL, Auth, Storage, RLS)  |
| Styling     | Tailwind CSS, dark mode glassmorphism      |
| Hosting     | Render (static site deployment)            |
| Auth        | Supabase magic link + role-based guards    |
| Realtime    | Supabase Channels (WebSocket-based)        |

---

## 🔐 Roles & Permissions

| Role      | Permissions                                                         |
|-----------|---------------------------------------------------------------------|
| Owner     | Full access to everything                                           |
| Editor    | CRUD access to artist assets, team management                      |
| Artist    | Upload content, manage their own workspace                         |
| Viewer    | Read-only access                                                    |
| Invoicer  | Shared pattern with accounting tool (optional integration)         |

---

## 🎨 Feature Overview

### ✅ Core Artist Hub

- Hero section with artist data + role badges
- Tabbed navigation
- Real-time activity feed + updates
- Team presence + collaboration indicators

### 🧩 Tabs

| Tab         | Functionality                                                    |
|-------------|------------------------------------------------------------------|
| Overview    | Stats, recent activity, quick actions                            |
| Calendar    | Full event scheduling, invite flow, recurring support            |
| Media       | Audio/image/video library with drag-and-drop upload              |
| Moodboards  | Visual canvas for aesthetic collaboration (Fabric.js-based)      |
| Timeline    | Career timeline / release log                                    |
| Notes       | Kanban board for tasks, ideas, notes                             |
| Team        | Invite users, assign roles, manage access                        |

---

## ⚙️ Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_URL=https://creative.allmyfriendsinc.com
VITE_APP_NAME=Music Hub Platform
```

### Getting Supabase Credentials

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your Project URL and anon/public key
4. Add them to your `.env` file

---

## 🗄️ Database Setup

### 1. Run Database Migrations

The database schema is located in `/database/migrations/`. Run these in your Supabase SQL Editor:

1. **Schema Migration**: `001_comprehensive_schema.sql`
   - Creates all tables (profiles, artists, media, events, notes, etc.)
   - Sets up enums for user roles and content types
   - Adds proper indexes and foreign key relationships
   - Includes automatic profile creation trigger

2. **RLS Policies**: `002_rls_policies.sql`
   - Implements Row Level Security for multi-tenant access
   - Sets up role-based permissions
   - Configures automatic profile creation for new users

### 2. Storage Buckets

Create these storage buckets in the Supabase Dashboard:

- **media** (Private) - For audio, video, documents
- **avatars** (Public) - For user profile pictures  
- **covers** (Public) - For album/playlist covers

Then run the storage policies from the database README.

### 3. Data Model Overview

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles (user info + role)
    ↓ (1:many via artist_team)
artists (band/artist profiles)
    ↓ (1:many)
├── media (files: audio, video, images, docs)
├── events (calendar scheduling)
├── notes (kanban task management)
├── moodboard_items (visual collaboration)
├── timeline_events (career milestones)
└── playlists (music collections)

media ↓ (1:many) file_access_logs (audit trail)
```

See `/database/README.md` for detailed schema documentation.

---

## 🚀 Development

### Prerequisites

- Node.js 18+ 
- npm 7+
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone https://github.com/theobattaglia1/music-hub-platform.git
cd music-hub-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations (see Database Setup above)

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run linters
```

---

## 🌐 Deployment

### Production Deployment via Render

| Stage     | Domain                                 |
|-----------|----------------------------------------|
| Dev       | `localhost:5173`                       |
| Staging   | `music-staging.allmyfriendsinc.com`    |
| Production| `creative.allmyfriendsinc.com`         |

#### Render Configuration

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment Variables:** Set all `VITE_*` variables

The `npm start` script runs `vite preview --host 0.0.0.0 --port ${PORT:-4173}` to properly bind the preview server.

### Manual Deployment Steps

1. **Supabase Setup:**
   - Create project and configure environment variables
   - Run database migrations
   - Set up storage buckets and policies
   - Configure auth providers if needed

2. **Render.com Setup:**
   - Connect GitHub repository
   - Set environment variables
   - Configure build/start commands
   - Set up custom domain

3. **Post-Deployment:**
   - Test authentication flows
   - Verify database connections
   - Test file upload functionality
   - Validate real-time features

---

## 🔧 Architecture

### State Management

- **Pinia stores** for reactive state management
- **TanStack Vue Query** for server state and caching
- **Real-time subscriptions** via Supabase channels

### Key Stores

| Store | Purpose |
|-------|---------|
| `enhancedAuth` | User authentication and profile management |
| `calendar` | Event scheduling and calendar management |
| `library` | Media file management and uploads |
| `playlists` | Music playlist creation and management |
| `notes` | Kanban-style task and note management |
| `moodboards` | Visual collaboration and mood boarding |
| `timeline` | Career timeline and milestone tracking |
| `team` | Team member and permission management |
| `activity` | Activity feed and audit logging |

### API Layer

- **apiService** - Centralized API client with retry logic
- **Real-time subscriptions** for collaborative features
- **File upload handling** via Supabase Storage
- **Error handling** with proper user feedback

---

## 🧠 Key Decisions

- **Calendar Library:** FullCalendar.js
- **Moodboard Canvas:** Fabric.js  
- **Audio Playback:** TBD (likely Howler.js)
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth with magic links
- **Real-time:** Supabase Channels (WebSocket)
- **File Storage:** Supabase Storage with CDN

---

## 🧪 Testing & Quality

### Success Metrics

- < 2s page load time
- Real-time updates < 100ms latency
- Fully responsive across devices
- Zero data loss on concurrent edits
- Presence-aware collaboration

### Security Features

- Row Level Security (RLS) for multi-tenant data isolation
- Role-based access control (RBAC)
- File access logging and audit trails
- Secure file upload with type validation
- Magic link authentication (no passwords)

---

## 🔄 Migration Notes

### From Desktop to Web

- Desktop dependencies (Tauri, SQLite) removed
- Data transformed for PostgreSQL
- File access migrated to Supabase Storage  
- Real-time via Supabase channels (not IPC)
- Authentication moved to Supabase Auth

### Data Migration Process

1. Export data from SQLite desktop app
2. Transform schema for PostgreSQL
3. Import via Supabase SQL Editor
4. Validate data integrity
5. Set up proper RLS policies

---

## 🧳 Coming Soon

- Advanced audio player with waveform visualization
- Video streaming and annotation tools
- Advanced moodboard templates and sharing
- Integration with music distribution platforms
- Advanced analytics and insights
- Mobile app (React Native + Supabase)

---

## 👥 Team & Contributing

This is a private internal platform for All My Friends Inc. and associated artists.

For access requests or collaboration inquiries, contact:
- **Theo Battaglia** - [theo@allmyfriendsinc.com](mailto:theo@allmyfriendsinc.com)
- **Website:** [allmyfriendsinc.com](https://allmyfriendsinc.com)

---

## 📄 License

Private and proprietary software. All rights reserved.

---
