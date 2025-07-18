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
| Owner     | Full access                                                         |
| Editor    | CRUD access to artist assets                                        |
| Invoicer  | Shared pattern with accounting tool (optional integration)          |
| Artist    | Access to their own workspace                                       |
| Viewer    | Read-only                                                           |

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

## ⚙️ Implementation Strategy

### Phase 1 – Foundation
- Supabase schema creation (RLS enabled)
- Auth extensions for music roles
- Basic routing & dashboard shell

### Phase 2 – Artist Hub
- Build `ArtistHubView.vue`
- Integrate Pinia stores (e.g. `artistHub.js`)
- Set up realtime data subscriptions

### Phase 3 – Feature Tabs
- Implement CalendarTab (FullCalendar)
- MediaTab with Supabase Storage upload
- Team management and role controls

### Phase 4 – Advanced Features
- Moodboards with Fabric.js
- Timeline and Notes with drag-and-drop
- Deep realtime collaboration (presence, logging)

---

## 🌐 Deployment Plan

| Stage     | Domain                                 |
|-----------|----------------------------------------|
| Dev       | `localhost:5173`                       |
| Staging   | `music-staging.allmyfriendsinc.com`    |
| Production| `creative.allmyfriendsinc.com`         |

Deployed via Render using CI/CD and GitHub Actions.

### Render Configuration
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

The `npm start` script runs `vite preview --host 0.0.0.0 --port ${PORT:-4173}` to properly bind the preview server to all interfaces and use Render's assigned port (with fallback to 4173).

---

## 🧠 Key Decisions

- **Calendar Library:** FullCalendar.js
- **Moodboard Canvas:** Fabric.js
- **Audio Playback:** TBD (likely Howler.js)
- **Data Migration:** Manual JSON export from SQLite → Supabase import

---

## 🧪 Success Metrics

- < 2s page load
- Real-time updates < 100ms
- Fully responsive across devices
- Zero data loss on concurrent edits
- Presence-aware collaboration

---

## 📂 File Structure (Sample)

src/
├── components/
│ └── MusicHub/
│ ├── ArtistHubView.vue
│ ├── tabs/
│ └── modals/
├── store/
├── views/
│ └── music/
├── router/

---

## 🔄 Migration Notes

- Desktop dependencies (Tauri, SQLite) removed
- Data transformed for PostgreSQL
- File access migrated to Supabase Storage
- Realtime via Supabase channels (not IPC)

---

## 🧳 Coming Soon

- Sentry integration for error tracking
- CI test pipeline
- API usage analytics
- Fine-grained file access logs

---

## 👋 Contributing

This is a private internal platform. Please contact [Theo Battaglia](https://allmyfriendsinc.com) to request access or collaboration.

---
