# Component Catalog

**Last Updated**: January 17, 2026  
**Status**: Complete inventory of all major frontend components  
**Purpose**: Quick reference for finding and using components

---

## Quick Index

### [UI Components](#ui-components) (Reusable primitives)
### [Layout & Shell](#layout--shell) (Application structure)
### [Feature Components](#feature-components) (Domain-specific)
### [Providers](#providers) (State & Context)
### [Integration](#integration) (Browser, Debug, Ads)

---

## UI Components

Located in: `components/ui/`

These are low-level, reusable UI primitives with **no domain-specific logic**.

| Component | Purpose | Props | Status |
|-----------|---------|-------|--------|
| **Button** | Standard button element | `variant`, `size`, `disabled`, `onClick` | ✅ Production |
| **Card** | Container with styling | `variant`, `className`, `children` | ✅ Production |
| **Modal** | Modal dialog | `isOpen`, `onClose`, `title`, `children` | ✅ Production |
| **Input** | Text input field | `type`, `placeholder`, `value`, `onChange` | ✅ Production |
| **Select** | Dropdown selection | `options`, `value`, `onChange`, `placeholder` | ✅ Production |
| **Checkbox** | Checkbox input | `checked`, `onChange`, `label` | ✅ Production |
| **Radio** | Radio button group | `options`, `value`, `onChange` | ✅ Production |
| **Badge** | Status/tag badge | `variant`, `label`, `size` | ✅ Production |
| **Toast** | Notification toast | `type`, `message`, `duration`, `onClose` | ✅ Production |
| **LoadingState** | Loading indicator | `message`, `variant` | ✅ Production |
| **ErrorState** | Error display | `title`, `message`, `onRetry` | ✅ Production |
| **EmptyState** | Empty state UI | `title`, `message`, `action` | ✅ Production |
| **Skeleton** | Loading skeleton | `height`, `width`, `count` | ✅ Production |
| **Tabs** | Tab interface | `tabs`, `activeTab`, `onChange` | ✅ Production |
| **Accordion** | Collapsible accordion | `items`, `allowMultiple` | ✅ Production |
| **Pagination** | Page navigation | `total`, `current`, `onChange`, `pageSize` | ✅ Production |
| **Breadcrumb** | Breadcrumb navigation | `items`, `onClick` | ✅ Production |
| **Tooltip** | Tooltip popover | `content`, `position`, `trigger` | ✅ Production |
| **Dropdown** | Dropdown menu | `items`, `onSelect`, `trigger` | ✅ Production |
| **Alert** | Alert message | `type`, `title`, `message`, `onClose` | ✅ Production |

**Import Pattern**:
```typescript
import { Button, Card, Modal, Input } from '@/components/ui';
```

---

## Layout & Shell

Located in: `components/shell/`

These manage application-wide layout and structure.

| Component | Purpose | Status |
|-----------|---------|--------|
| **AppShell** | Main application wrapper | ✅ Production |
| **Header** | Top navigation bar | ✅ Production |
| **Sidebar** | Side navigation | ✅ Production |
| **BottomBar** | Bottom navigation (mobile) | ✅ Production |
| **Footer** | Footer section | ✅ Production |
| **Container** | Content container | ✅ Production |
| **Layout** | Generic page layout | ✅ Production |

**Usage**:
```typescript
import { AppShell, Header, Sidebar } from '@/components/shell';

<AppShell>
  <Header />
  <div className="flex">
    <Sidebar />
    <main>{children}</main>
  </div>
</AppShell>
```

---

## Feature Components

### Focus Module

Located in: `components/focus/`

Focus timer and session management UI.

| Component | Purpose | Status |
|-----------|---------|--------|
| **FocusTimer** | Main timer display | ✅ Production |
| **FocusControls** | Play/pause/stop controls | ✅ Production |
| **FocusHistory** | Past sessions list | ✅ Production |
| **TrackUpload** | Audio track upload | ✅ Production |
| **FocusIndicator** | Active session indicator | ✅ Production |
| **FocusTracks** | Track management | ✅ Production |

**Usage**:
```typescript
import { FocusTimer, FocusControls } from '@/components/focus';

<FocusTimer duration={25} onComplete={handleComplete} />
<FocusControls isRunning={isRunning} onToggle={toggleTimer} />
```

### Audio Module

Located in: `components/audio/`

Audio playback and visualization.

| Component | Purpose | Status |
|-----------|---------|--------|
| **AudioPlayer** | Full audio player | ✅ Production |
| **AudioVisualizer** | Waveform visualization | ✅ Production |
| **VolumeControl** | Volume slider | ✅ Production |
| **PlaybackControls** | Play/pause/seek controls | ✅ Production |
| **AudioSegment** | Individual audio segment | ✅ Production |
| **Playlist** | Audio playlist display | ✅ Production |

**Usage**:
```typescript
import { AudioPlayer } from '@/components/audio';

<AudioPlayer src={trackUrl} title="Track Name" />
```

### Learning Module

Located in: `components/learn/`

Educational content and learning UI.

| Component | Purpose | Status |
|-----------|---------|--------|
| **LessonCard** | Individual lesson card | ✅ Production |
| **CourseList** | Available courses list | ✅ Production |
| **CourseDetail** | Course details page | ✅ Production |
| **LessonContent** | Lesson content display | ✅ Production |
| **LearningVisualizer** | Learning visualization | ✅ Production |
| **ProgressTracker** | Course progress tracking | ✅ Production |

**Usage**:
```typescript
import { CourseList, LessonCard } from '@/components/learn';

<CourseList courses={courses} />
<LessonCard lesson={lesson} />
```

### Progress Module

Located in: `components/progress/`

Progress visualization and level display.

| Component | Purpose | Status |
|-----------|---------|--------|
| **ProgressBar** | Linear progress indicator | ✅ Production |
| **LevelCard** | Current level display | ✅ Production |
| **XPCounter** | XP accumulation display | ✅ Production |
| **MilestoneChart** | Milestone progress | ✅ Production |
| **StatsDisplay** | Statistics display | ✅ Production |

**Usage**:
```typescript
import { LevelCard, ProgressBar } from '@/components/progress';

<LevelCard level={42} xp={150000} />
<ProgressBar current={75} max={100} label="XP to Level 43" />
```

### Settings Module

Located in: `components/settings/`

User preferences and settings.

| Component | Purpose | Status |
|-----------|---------|--------|
| **SettingsPanel** | Settings container | ✅ Production |
| **PreferencesForm** | User preferences form | ✅ Production |
| **NotificationSettings** | Notification configuration | ✅ Production |
| **AccessibilitySettings** | A11y settings | ✅ Production |
| **ThemeSettings** | Theme configuration | ✅ Production |
| **PrivacySettings** | Privacy options | ✅ Production |

**Usage**:
```typescript
import { SettingsPanel } from '@/components/settings';

<SettingsPanel user={user} onSave={handleSave} />
```

### Search Module

Located in: `components/search/`

Search interface and results.

| Component | Purpose | Status |
|-----------|---------|--------|
| **SearchInput** | Search field | ✅ Production |
| **SearchResults** | Results display | ✅ Production |
| **SearchFilters** | Search filters | ✅ Production |
| **SearchBox** | Full search UI | ✅ Production |
| **ResultItem** | Individual result | ✅ Production |

**Usage**:
```typescript
import { SearchInput, SearchResults } from '@/components/search';

<SearchInput placeholder="Search..." onChange={handleSearch} />
<SearchResults results={results} />
```

### Onboarding Module

Located in: `components/onboarding/`

First-run user onboarding.

| Component | Purpose | Status |
|-----------|---------|--------|
| **OnboardingFlow** | Main onboarding sequence | ✅ Production |
| **OnboardingModal** | Onboarding modal | ✅ Production |
| **OnboardingProvider** | Context provider | ✅ Production |
| **OnboardingGate** | Conditional gate | ✅ Production |
| **FeatureIntro** | Feature introduction | ✅ Production |
| **TutorialStep** | Tutorial step component | ✅ Production |

**Usage**:
```typescript
import { OnboardingFlow, OnboardingGate } from '@/components/onboarding';

<OnboardingGate>
  <DashboardPage />
</OnboardingGate>

<OnboardingFlow isNewUser={isNew} />
```

### References Module

Located in: `components/references/`

Reference library browser.

| Component | Purpose | Status |
|-----------|---------|--------|
| **ReferenceList** | References list | ✅ Production |
| **ReferenceDetail** | Reference details | ✅ Production |
| **ReferenceBrowser** | Browse references | ✅ Production |
| **ReferenceSearch** | Search references | ✅ Production |
| **ReferenceCard** | Reference card | ✅ Production |

**Usage**:
```typescript
import { ReferenceList } from '@/components/references';

<ReferenceList references={references} />
```

### Admin Module

Located in: `components/admin/`

Admin-only features and tools.

| Component | Purpose | Status |
|-----------|---------|--------|
| **AdminDashboard** | Admin overview | ✅ Production |
| **UserManagement** | Manage users | ✅ Production |
| **ApiTester** | API testing tool | ✅ Production |
| **SystemStatus** | System status display | ✅ Production |
| **Logs** | System logs viewer | ✅ Production |
| **Analytics** | Analytics dashboard | ✅ Production |

**Usage**:
```typescript
import { AdminDashboard } from '@/components/admin';

<AdminDashboard />
```

### Vault Module

Located in: `components/vault/`

Vault security and locking.

| Component | Purpose | Status |
|-----------|---------|--------|
| **VaultLock** | Vault lock UI | ✅ Production |
| **UnlockForm** | Unlock form | ✅ Production |
| **VaultStatus** | Vault status display | ✅ Production |

**Usage**:
```typescript
import { VaultLock } from '@/components/vault';

<VaultLock isLocked={isLocked} onUnlock={handleUnlock} />
```

---

## Providers

Located in: `components/providers/`

Context providers for global state management.

| Component | Purpose | Provides | Status |
|-----------|---------|----------|--------|
| **AuthProvider** | Authentication context | `useAuth()` | ✅ Production |
| **ThemeProvider** | Theme context | `useTheme()` | ✅ Production |
| **SyncStateProvider** | Sync state context | `useSyncState()` | ✅ Production |
| **OnboardingProvider** | Onboarding context | `useOnboarding()` | ✅ Production |
| **NotificationProvider** | Notifications context | `useNotification()` | ✅ Production |
| **OfflineProvider** | Offline state context | `useOffline()` | ✅ Production |

**Usage**:
```typescript
import { AuthProvider, ThemeProvider } from '@/components/providers';
import { useAuth } from '@/components/providers';

<AuthProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</AuthProvider>

// In a component:
const { user, login } = useAuth();
```

---

## Integration

### Browser Module

Located in: `components/browser/`

Browser detection and compatibility.

| Component | Purpose | Status |
|-----------|---------|--------|
| **BrowserDetect** | Browser detection | ✅ Production |
| **UnsupportedBrowser** | Unsupported message | ✅ Production |
| **ZenBrowserIntegration** | Zen Browser support | ✅ Production |

**Usage**:
```typescript
import { BrowserDetect } from '@/components/browser';

if (!BrowserDetect.isSupported()) {
  return <UnsupportedBrowser />;
}
```

### Debug Module

Located in: `components/debug/`

Development-only debugging utilities.

| Component | Purpose | Status |
|-----------|---------|--------|
| **DebugPanel** | Debug information | ✅ Dev-only |
| **StateInspector** | State inspection | ✅ Dev-only |
| **LogViewer** | Log viewer | ✅ Dev-only |

**Usage**:
```typescript
{process.env.NODE_ENV === 'development' && <DebugPanel />}
```

### Ads Module

Located in: `components/ads/`

Advertisement integration.

| Component | Purpose | Status |
|-----------|---------|--------|
| **AdContainer** | Ad display wrapper | ✅ Production |
| **AdLoader** | Ad loading | ✅ Production |

**Usage**:
```typescript
import { AdContainer } from '@/components/ads';

<AdContainer slot="home-banner" />
```

---

## Legacy/Deprecated

### Player Module (DEPRECATED)

Located in: `components/player/`

**Status**: 🚫 Deprecated - Use `audio/` instead

Plan migration to consolidated `audio/` folder.

### Search Module (Legacy)

Located in: `components/Search/` (capital S - old naming)

**Status**: 🚫 Deprecated - Use `search/` instead

Plan consolidation with `search/` folder.

---

## Component Creation Checklist

When adding a new component:

- [ ] Placed in correct folder (use README.md decision tree)
- [ ] Named in PascalCase
- [ ] Props interface created and exported
- [ ] Exported from folder's `index.ts`
- [ ] CSS module created if needed
- [ ] Updated this catalog
- [ ] Documentation comment added
- [ ] No deep imports used
- [ ] Follows existing patterns

---

## Import Reference

### By Category

**UI Components**:
```typescript
import { Button, Card, Modal, Input, Select } from '@/components/ui';
```

**Layout**:
```typescript
import { AppShell, Header, Sidebar } from '@/components/shell';
```

**Focus**:
```typescript
import { FocusTimer, FocusControls } from '@/components/focus';
```

**Audio**:
```typescript
import { AudioPlayer, AudioVisualizer } from '@/components/audio';
```

**Learning**:
```typescript
import { CourseList, LessonCard } from '@/components/learn';
```

**Progress**:
```typescript
import { LevelCard, ProgressBar } from '@/components/progress';
```

**Settings**:
```typescript
import { SettingsPanel } from '@/components/settings';
```

**Search**:
```typescript
import { SearchInput, SearchResults } from '@/components/search';
```

**Onboarding**:
```typescript
import { OnboardingFlow, OnboardingGate } from '@/components/onboarding';
```

**Providers**:
```typescript
import { AuthProvider, useAuth } from '@/components/providers';
```

**Admin**:
```typescript
import { AdminDashboard } from '@/components/admin';
```

---

## Statistics

| Category | Count | Status |
|----------|-------|--------|
| UI Components | 20+ | ✅ Production |
| Layout & Shell | 7 | ✅ Production |
| Focus Module | 6 | ✅ Production |
| Audio Module | 6 | ✅ Production |
| Learning Module | 6 | ✅ Production |
| Progress Module | 5 | ✅ Production |
| Settings Module | 6 | ✅ Production |
| Search Module | 5 | ✅ Production |
| Onboarding Module | 6 | ✅ Production |
| References Module | 5 | ✅ Production |
| Admin Module | 6 | ✅ Production |
| Vault Module | 3 | ✅ Production |
| Providers | 6 | ✅ Production |
| Browser Module | 3 | ✅ Production |
| Debug Module | 3 | ✅ Dev-only |
| Ads Module | 2 | ✅ Production |
| **TOTAL** | **115+** | ✅ |

---

## Related Documentation

- **[README.md](./README.md)**: Folder structure and organization principles
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Component architecture patterns
- **[../lib/hooks/README.md](../lib/hooks/README.md)**: Custom hooks
- **[../lib/utils/README.md](../lib/utils/README.md)**: Utility functions

---

## Last Updated

**Date**: January 17, 2026  
**Updated By**: FRONT-001 Implementation  
**Task**: Component Organization  
**Status**: ✅ Complete
