/**
 * Dynamic Help Page
 * Renders markdown documentation for each topic
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";

// Topic metadata
const topics: Record<string, { title: string; description: string }> = {
  "getting-started": { title: "Getting Started", description: "First steps with Ignition" },
  "today": { title: "Today Dashboard", description: "Your daily command center" },
  "focus": { title: "Focus Timer", description: "Pomodoro-style focus sessions" },
  "planner": { title: "Planner", description: "Calendar and event management" },
  "quests": { title: "Quests", description: "Daily and weekly challenges" },
  "habits": { title: "Habits", description: "Build consistent routines" },
  "goals": { title: "Goals", description: "Long-term objectives with milestones" },
  "exercise": { title: "Exercise & Workouts", description: "Fitness tracking and PRs" },
  "programs": { title: "Training Programs", description: "Multi-week training plans" },
  "progress": { title: "Progress & XP", description: "Gamification and leveling" },
  "market": { title: "Market", description: "Spend coins on rewards" },
  "production": { title: "Production Tools", description: "DAW shortcuts, arrange view, and more" },
  "learning": { title: "Learning Suite", description: "Courses, flashcards, and journal" },
  "settings": { title: "Settings", description: "Customize your experience" },
  "mobile": { title: "Mobile App", description: "iOS/iPadOS PWA usage" },
  "shortcuts": { title: "Keyboard Shortcuts", description: "Navigate faster with shortcuts" },
  "books": { title: "Book Tracker", description: "Track your reading progress" },
};

// Markdown content (embedded for static rendering)
const content: Record<string, string> = {
  "getting-started": `
## Welcome to Ignition

Ignition is a starter engine for focus, movement, and learning. Begin with one thing. Build momentum naturally.

### First Steps

1. **Sign In** - Use Google or Microsoft authentication
2. **Age Verification** - Confirm you are 16 or older
3. **Approval** - Wait for admin approval (usually within 24 hours)
4. **Start** - Pick one thing from the Today dashboard

### Core Features

- **Focus Sessions** - Timed work blocks with break reminders
- **Planner** - Calendar for scheduling events and workouts
- **Quests** - Daily and weekly challenges for XP
- **Exercise** - Track workouts and personal records
- **Habits** - Build routines at your own pace
- **Goals** - Set and track long-term objectives

### Earning Rewards

- Complete focus sessions: 25 XP + 10 coins
- Finish workouts: 50 XP + 20 coins
- Complete quests: Variable XP + coins
`,
  "today": `
## Today Dashboard

The Today page is your daily command center, showing what needs attention right now.

### Daily Plan

Click "Plan My Day" to generate a personalized checklist of:
- 1-3 active quests
- A focus session
- A scheduled workout (if any)
- A learning item

### Quick Actions

- **Start Focus** - Begin a focus session
- **Plan Day** - Open the planner
- **Quests** - View your quest log
- **Exercise** - Access workouts

### Tips

- Check Today every morning
- Complete items in order of priority
- Use the Start button on each item to deep-link
`,
  "focus": `
## Focus Timer

Deep work sessions using the Pomodoro technique.

### Session Types

- **Focus** (25 min default) - Concentrated work time
- **Short Break** (5 min) - Quick rest between sessions
- **Long Break** (15 min) - Extended rest after 4 sessions

### Starting a Session

1. Click "Start Focus" from Today or Focus page
2. Select session type and duration
3. Begin working when timer starts
4. Take breaks when prompted

### Rewards

- Focus sessions earn 25 XP
- Bonus XP for completing without pause
- Streak bonuses for consecutive days
`,
  "planner": `
## Planner

Calendar view for managing your schedule.

### Adding Events

1. Double-click on a time slot
2. Enter event details
3. Set recurrence if needed
4. Save the event

### Event Types

- **Meetings** - Standard calendar events
- **Workouts** - Linked to Exercise module
- **Focus Blocks** - Scheduled deep work
- **Appointments** - External commitments

### Recurrence Options

- One time
- Daily
- Weekly (Mon/Wed/Fri or Tue/Thu/Sat)
- Every 2 weeks
`,
  "quests": `
## Quests

Daily and weekly challenges that reward XP and coins.

### Quest Types

- **Daily** - Reset each day at midnight
- **Weekly** - Reset every Monday
- **One-time** - Complete once for permanent reward

### Universal Quests

Admin-created quests available to all users:
- "Complete 3 focus sessions"
- "Log a workout"
- "Read for 30 minutes"

### Custom Quests

Create your own quests with custom XP values:
1. Go to Quests page
2. Click "Create Quest"
3. Set title, description, XP, and schedule
`,
  "habits": `
## Habits

Build consistent daily routines with streak tracking.

### Creating Habits

1. Go to Habits page
2. Click "New Habit"
3. Enter name and target frequency
4. Set reminder time (optional)

### Tracking

- Check off habits when completed
- View your current streak
- Track completion percentage

### Streak Protection

Purchase "Streak Shield" from Market to protect one missed day.
`,
  "goals": `
## Goals

Long-term objectives with milestone tracking.

### Creating Goals

1. Go to Goals page
2. Click "Add Goal"
3. Set title, target date, and milestones
4. Assign skill category

### Milestones

Break large goals into smaller checkpoints:
- Each milestone can have its own due date
- Completing milestones awards XP
- Visual progress bar shows overall completion

### Skills

Goals contribute to five skills:
- Knowledge
- Guts
- Proficiency
- Kindness
- Charm
`,
  "exercise": `
## Exercise & Workouts

Track workouts, log sets, and hit personal records.

### Exercise Library

Over 800 exercises from exercises.json:
- Filter by category (strength, cardio, etc.)
- Filter by muscle group
- Search by name

### Creating Workouts

1. Click "Create Workout"
2. Add sections (Warmup, Main, Cooldown, Superset, Circuit)
3. Add exercises to each section
4. Set target sets and reps

### Logging a Session

1. Click "Start Workout"
2. Select workout or go freeform
3. Log each set with weight, reps, and RPE
4. Complete to earn XP

### Personal Records

PRs are automatically tracked when you lift heavier than before.
`,
  "programs": `
## Training Programs

Multi-week training plans that auto-schedule to your planner.

### How Programs Work

1. Program defines weekly workout structure
2. Workouts auto-schedule to Planner
3. Progressive overload built-in
4. Deload weeks included

### Available Programs

- Strength Builder (4 weeks)
- HIIT Circuit (6 weeks)
- Hypertrophy (8 weeks)

### Starting a Program

1. Go to Exercise > Programs tab
2. Select a program
3. Choose start date
4. Workouts appear in Planner
`,
  "progress": `
## Progress & XP

Gamification system with levels and skills.

### XP Sources

- Focus sessions: 25 XP
- Workouts: 50 XP
- Lessons: 30 XP
- Quests: Variable
- Habits: 10 XP each

### Level Calculation

Total XP determines your level:
- Level 1: 0-99 XP
- Level 2: 100-299 XP
- Each level requires more XP

### Skill Star

Five skills displayed in a radar chart:
- Grow each skill through related activities
- Balance all five for maximum potential
`,
  "market": `
## Market

Spend coins on personal rewards.

### Earning Coins

Coins earned alongside XP for all activities:
- Focus: 10 coins
- Workout: 20 coins
- Quest: Variable

### Rewards

Create custom rewards:
- "Order takeout" - 100 coins
- "Movie night" - 50 coins
- "Streak Shield" - 200 coins

### Purchasing

1. Go to Market
2. Select reward
3. Confirm purchase
4. Mark as redeemed when used
`,
  "production": `
## Production Tools

DAW shortcuts, arrange view, and reference tracks.

### DAW Shortcuts

Browse keyboard shortcuts for:
- Ableton Live
- Logic Pro
- FL Studio
- Pro Tools
- And more

Filter by category or search by action.

### Arrange View

Piano roll and drum sequencer:
- Create MIDI patterns
- Adjust velocity
- Export patterns

### Reference Tracks

Load audio files from your local library:
- Analyze BPM and key
- Set marker points
- A/B comparison
`,
  "learning": `
## Learning Suite

Courses, flashcards, recipes, and journal.

### Courses

Structured learning paths:
- Browse available courses
- Track lesson completion
- Earn XP for each lesson

### Flashcard Review

Spaced repetition system:
- Create decks for any topic
- Review due cards daily
- Track retention rate

### Recipes

Production techniques:
- Step-by-step guides
- Save favorites
- Add personal notes

### Journal

Daily reflection entries:
- What went well
- What to improve
- Goals for tomorrow
`,
  "settings": `
## Settings

Customize your Ignition experience.

### Theme

- Light / Dark / System
- Accent color options
- Compact mode

### Notifications

- Focus reminders
- Quest deadlines
- Workout schedules

### Privacy

- Data export
- Account deletion
- Cookie preferences
`,
  "mobile": `
## Mobile App

Install Ignition as a PWA on iOS/iPadOS.

### Installation

1. Open ignition.ecent.online in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Launch from home screen

### Features

- Full offline support
- Native app feel
- Push notifications (iOS 16.4+)
- Safe area handling

### Tips

- Use in standalone mode for best experience
- Data syncs when online
- All features available
`,
  "shortcuts": `
## Keyboard Shortcuts

Navigate faster with keyboard.

### Global

- **Cmd/Ctrl + K** - Command palette
- **Cmd/Ctrl + /** - Toggle sidebar
- **Cmd/Ctrl + .** - Quick settings

### Navigation

- **G then T** - Go to Today
- **G then F** - Go to Focus
- **G then P** - Go to Planner
- **G then Q** - Go to Quests

### Focus Timer

- **Space** - Play/Pause
- **R** - Reset
- **S** - Skip to break
`,
  "books": `
## Book Tracker

Track your reading progress and build reading habits.

### Adding Books

1. Go to Books page
2. Click "Add Book"
3. Enter title, author, pages, and genre
4. Book starts in "Want to Read"

### Reading Progress

1. Click "Start Reading" on a book
2. Log reading sessions with pages read
3. Track progress with visual progress bar
4. Mark complete when finished

### Stats

- Books completed this year
- Pages read this month
- Current reading streak
- Average rating

### Session Logging

Track each reading session:
- Pages read
- Time spent
- Notes
`,
};

export function generateStaticParams() {
  return Object.keys(topics).map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: topicSlug } = await params;
  const topic = topics[topicSlug];
  if (!topic) return { title: "Not Found" };
  return {
    title: `${topic.title} - Help - Ignition`,
    description: topic.description,
  };
}

export default async function HelpTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: topicSlug } = await params;
  const topic = topics[topicSlug];
  const markdown = content[topicSlug];

  if (!topic || !markdown) {
    notFound();
  }

  // Simple markdown to HTML (basic conversion)
  const html = markdown
    .replace(/^## (.+)$/gm, '<h2 class="' + styles.mdH2 + '">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="' + styles.mdH3 + '">$1</h3>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/<\/li>\n<li>/g, '</li><li>');

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/help">Help</Link>
        <span> / </span>
        <span>{topic.title}</span>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{topic.title}</h1>
        <p className={styles.subtitle}>{topic.description}</p>
      </header>

      <article
        className={styles.article}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className={styles.articleFooter}>
        <Link href="/help" className={styles.backLink}>
          Back to Help Center
        </Link>
      </footer>
    </div>
  );
}

