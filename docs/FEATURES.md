# Passion OS - Feature Documentation

## Overview

Passion OS is a comprehensive productivity and music production assistant designed to help users stay focused, track progress, and improve their creative skills. The application combines gamification elements (XP, coins, quests) with practical tools for planning, learning, and creating.

---

## Core Features

### 1. Today Dashboard (`/today`)

**Purpose:** Central hub providing quick access to all features with personalized greeting.

**Features:**
- Time-based greeting (morning/afternoon/evening)
- Quick action cards organized by category:
  - **Get Started:** Focus, Planner, Quests, Exercise
  - **Production:** Shortcuts, Arrange, Reference, Templates
  - **Learn & Grow:** Learn, Infobase, Goals, Progress
- Rewards section linking to Market

**Data Storage:** N/A (static page with session data)

---

### 2. Focus Timer (`/focus`)

**Purpose:** Pomodoro-style focus sessions with customizable durations.

**Features:**
- Configurable focus/break/long break durations
- Visual countdown timer with progress ring
- Mode switching (Focus, Break, Long Break)
- Session history tracking
- Pause/resume functionality with cross-device sync
- Persistent focus indicator in bottom bar

**Data Storage:**
- D1: Focus sessions (`focus_sessions` table)
- D1: Pause state (`focus_pause_state` table) - syncs across devices
- LocalStorage: Settings (durations, sound preferences)

**APIs:**
- `GET/POST /api/focus` - Create and list sessions
- `GET /api/focus/active` - Get active session
- `POST /api/focus/[id]/complete` - Complete session
- `POST /api/focus/[id]/abandon` - Abandon session
- `GET/POST /api/focus/pause` - Cross-device pause sync

---

### 3. Planner (`/planner`)

**Purpose:** Calendar-based event management with multiple event types.

**Features:**
- Month/week/day calendar views
- Event types: Meeting, Appointment, Workout, Other
- Color-coded events
- Recurring events support
- Event modal for create/edit/delete
- Links workouts from Exercise tab

**Data Storage:** D1 (`calendar_events` table)

**APIs:**
- `GET /api/calendar` - List events (with date range filtering)
- `POST /api/calendar` - Create event
- `PUT /api/calendar` - Update event
- `DELETE /api/calendar` - Delete event

---

### 4. Quests (`/quests`)

**Purpose:** Daily and weekly challenges that reward XP and coins.

**Features:**
- Universal quests (admin-managed, available to all users)
- Daily and weekly quest types
- Progress tracking per quest
- XP and coin rewards
- Skill association for XP distribution

**Data Storage:**
- D1: Universal quests (`universal_quests` table)
- D1: User progress (`user_quest_progress` table)

**APIs:**
- `GET /api/quests` - List active quests with user progress
- `POST /api/quests` - Update quest progress, complete quests

---

### 5. Goals (`/goals`)

**Purpose:** Long-term goal tracking with milestones.

**Features:**
- Create goals with title, description, category, deadline
- Categories: Health, Career, Personal, Creative, Financial
- Milestone sub-tasks within goals
- Progress calculation based on milestone completion
- Cross-device sync via D1

**Data Storage:** D1 (`goals` table)

**APIs:**
- `GET /api/goals` - List user goals
- `POST /api/goals` - Create, update, delete, or sync goals

---

### 6. Exercise (`/exercise`)

**Purpose:** Workout and exercise tracking with personal records.

**Features:**
- Exercise library (built-in + custom)
- Workout templates
- Workout session logging
- Set tracking with weight, reps, RPE
- Personal record (PR) tracking
- Link workouts to planner events
- Link workouts to quests

**Data Storage:** D1 (`exercises`, `workouts`, `workout_sessions`, `exercise_sets`, `personal_records` tables)

**APIs:**
- `GET /api/exercise` - Get exercises, workouts, sessions, records, stats
- `POST /api/exercise` - Create exercises, workouts, sessions, sets
- `DELETE /api/exercise` - Delete exercises, workouts, sessions
- `POST /api/exercise/seed` - Seed built-in exercises

---

### 7. Progress (`/progress`)

**Purpose:** Gamification dashboard showing XP, level, and skill development.

**Features:**
- Overall level and XP display
- Skill wheel visualization (Persona 5 style)
- Five skill categories: Knowledge, Guts, Proficiency, Kindness, Charm
- Coin balance display
- Recent activity feed
- Focus session statistics

**Data Storage:** D1 (`user_progress`, `user_skills` tables)

---

### 8. Market (`/market`)

**Purpose:** Reward redemption store using earned coins.

**Features:**
- Personal reward items
- Coin-based purchasing
- Custom reward creation (admin/personal)

**Data Storage:** D1 (`market_items`, `user_purchases` tables)

---

## Production Tools

### 9. Shortcuts Hub (`/hub`, `/hub/[dawId]`)

**Purpose:** DAW keyboard shortcut reference and learning.

**Features:**
- Support for 9+ DAWs (Ableton, Logic, FL Studio, Pro Tools, Cubase, Reaper, Bitwig, Studio One, Reason)
- Category-based shortcut organization
- Search and filter functionality
- Mac/PC keyboard toggle
- Visual keyboard representation
- Used/unused DAW filters
- Cookie-based preference storage

**Data Storage:** Static JSON data + localStorage for preferences

---

### 10. Arrange View (`/arrange`)

**Purpose:** Interactive music arrangement workspace.

**Features:**
- Piano roll with octave range (C-1 to C6)
- Drum machine with multiple drum sounds
- Grid-based note placement
- Playback with Web Audio API
- Split view options (1/4, 1/8, 1/16, 1/32 notes)
- Adjustable bar length (4-16 bars)

**Data Storage:** LocalStorage (arrangement data)

---

### 11. Templates (`/templates`)

**Purpose:** Music production templates and patterns.

**Features:**
- Chord progression templates
- Drum pattern templates
- Melody templates
- Genre-based organization

**Data Storage:** Static data

---

### 12. Reference Tracks (`/reference`)

**Purpose:** Audio reference library for A/B comparison.

**Features:**
- Local file library management
- Audio analysis (BPM, key detection)
- Waveform visualization
- Marker points for sections
- Analysis caching

**Data Storage:**
- D1: Analysis cache (`track_analysis_cache` table)
- Browser: File references (IndexedDB/File System Access API)

---

### 13. Infobase (`/infobase`)

**Purpose:** Personal knowledge base for notes and information.

**Features:**
- Create, edit, delete entries
- Category organization (Mixing, Sound Design, Music Theory, Workflow, Tips, Resources)
- Tag support
- Full-text search
- Markdown content

**Data Storage:** LocalStorage (with D1 sync planned via `infobase_entries` table)

---

## Learning Suite

### 14. Learn Dashboard (`/learn`)

**Purpose:** Central hub for learning features.

**Features:**
- Course progress overview
- Spaced repetition review queue
- Practice suggestions
- Learning statistics

---

### 15. Courses (`/learn/courses`)

**Purpose:** Structured learning modules.

**Features:**
- Course catalog
- Lesson progression
- Quiz assessments
- Progress tracking

**Data Storage:** D1 (`learn_courses`, `learn_lessons`, `learn_progress` tables)

---

### 16. Review (`/learn/review`)

**Purpose:** Spaced repetition flashcard system.

**Features:**
- Flashcard review interface
- SM-2 algorithm for spacing
- Difficulty ratings
- Statistics tracking

**Data Storage:** D1 (`learn_flashcards`, `learn_reviews` tables)

---

### 17. Recipes (`/learn/recipes`)

**Purpose:** Production workflow recipes and techniques.

**Features:**
- Step-by-step production guides
- Category organization
- Favorite/bookmark system

---

### 18. Glossary (`/learn/glossary`)

**Purpose:** Music production terminology dictionary.

**Features:**
- Searchable term database
- Category filtering
- Cross-references

**Data Storage:** Static JSON data

---

### 19. Journal (`/learn/journal`)

**Purpose:** Personal learning and production journal.

**Features:**
- Daily entry creation
- Tag support
- Search and filter

**Data Storage:** D1 (`learn_journal_entries` table)

---

## System Features

### 20. Settings (`/settings`)

**Purpose:** User preferences and app configuration.

**Features:**
- Theme selection (Dark, Light, System)
- Notification preferences
- DAW preferences
- Account management

**Data Storage:** LocalStorage + D1 (`user_settings` table)

---

### 21. Admin Console (`/admin`)

**Purpose:** Administrative interface for system management.

**Access:** Restricted to admin emails (jvetere1999@gmail.com)

**Features:**
- User management (approval, levels, skills)
- Universal quest management (create, edit, delete)
- Skill configuration
- Feedback review
- System statistics

**Data Storage:** D1 (various tables)

---

### 22. Authentication

**Purpose:** User authentication and authorization.

**Features:**
- OAuth providers: Google, Microsoft (Azure AD)
- Age verification (16+ requirement)
- User approval workflow
- JWT sessions with D1 adapter fallback

**Flow:**
1. Landing page -> Age verification
2. OAuth sign-in
3. Pending approval (new users)
4. Admin approval
5. Full app access

---

### 23. Mobile PWA (`/m/*`)

**Purpose:** Mobile-optimized progressive web app.

**Features:**
- Native-like mobile experience
- Bottom tab navigation
- Standalone mode support
- Safe area handling for notch/home indicator
- Offline support (service worker)

**Routes:**
- `/m` - Mobile home
- `/m/focus` - Focus timer
- `/m/quests` - Quest list
- `/m/progress` - Progress view
- `/m/more` - Settings and more

---

## Command Palette

**Trigger:** `Cmd/Ctrl + K`

**Features:**
- Global search across pages
- Quick navigation
- Command execution
- Recent items
- Keyboard navigation

---

## Data Persistence Summary

| Feature | D1 Database | LocalStorage | Static Data |
|---------|-------------|--------------|-------------|
| Focus Sessions | Yes | Settings | - |
| Focus Pause State | Yes | Backup | - |
| Planner Events | Yes | - | - |
| Quests | Yes | - | - |
| Goals | Yes | Backup | - |
| Exercise | Yes | - | Seed data |
| Progress/XP | Yes | - | - |
| Market | Yes | - | - |
| Shortcuts | - | Preferences | JSON |
| Arrange | - | Arrangement | - |
| Templates | - | - | JSON |
| Reference Tracks | Analysis cache | - | - |
| Infobase | Planned | Current | - |
| Learning | Yes | - | Seed data |
| Settings | Yes | Backup | - |

---

## API Summary

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | Authentication |
| `/api/auth/approval-status` | GET | Check user approval |
| `/api/calendar` | GET, POST, PUT, DELETE | Planner events |
| `/api/exercise` | GET, POST, DELETE | Exercise management |
| `/api/exercise/seed` | POST | Seed exercise library |
| `/api/feedback` | GET, POST | User feedback |
| `/api/focus` | GET, POST | Focus sessions |
| `/api/focus/active` | GET | Active session |
| `/api/focus/[id]/complete` | POST | Complete session |
| `/api/focus/[id]/abandon` | POST | Abandon session |
| `/api/focus/pause` | GET, POST | Pause state sync |
| `/api/goals` | GET, POST | Goal management |
| `/api/quests` | GET, POST | Quest management |
| `/api/learn` | GET | Learning data |
| `/api/learn/progress` | GET, POST | Learning progress |
| `/api/learn/review` | GET, POST | Spaced repetition |
| `/api/analysis` | GET, POST | Track analysis |
| `/api/blobs/upload` | POST | R2 blob upload |
| `/api/blobs/[id]` | GET, DELETE | R2 blob management |
| `/api/admin/*` | Various | Admin operations |

---

## Technology Stack

- **Frontend:** Next.js 16, React 19, TypeScript 5.7
- **Styling:** CSS Modules, Design tokens
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (blobs)
- **Auth:** Auth.js (NextAuth v5)
- **Deployment:** Cloudflare Workers via OpenNext
- **Audio:** Web Audio API, Tone.js

---

## Version

Last updated: January 4, 2026

