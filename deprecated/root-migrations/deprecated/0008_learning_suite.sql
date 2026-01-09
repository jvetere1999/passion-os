-- Learning Suite Database Schema
-- Milestone 1: Core content + user progress tables

-- ============================================
-- COURSES (top-level learning tracks)
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  synth_scope TEXT NOT NULL CHECK (synth_scope IN ('serum', 'vital', 'both')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT NOT NULL,
  learning_outcomes TEXT, -- JSON array of strings
  estimated_hours INTEGER DEFAULT 0,
  tags TEXT, -- JSON array
  order_index INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_courses_synth ON courses(synth_scope);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);

-- ============================================
-- MODULES (themed groupings within courses)
-- ============================================
CREATE TABLE IF NOT EXISTS learn_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  prereq_module_ids TEXT, -- JSON array of module IDs
  order_index INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(course_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON learn_modules(course_id);

-- ============================================
-- LESSONS (individual learning units)
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES learn_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  mdx_content TEXT NOT NULL, -- MDX body
  widget_manifest TEXT, -- JSON: embedded visualizer configs
  quiz_spec TEXT, -- JSON: quiz questions
  troubleshooting TEXT, -- JSON: common mistakes
  concept_ids TEXT, -- JSON array of concept IDs
  synth_scope TEXT NOT NULL CHECK (synth_scope IN ('serum', 'vital', 'both')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(module_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_synth ON lessons(synth_scope);

-- ============================================
-- CONCEPTS (glossary/knowledge atoms)
-- ============================================
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  aliases TEXT, -- JSON array of alternate names
  category TEXT, -- e.g., 'oscillators', 'filters', 'modulation'
  related_concept_ids TEXT, -- JSON array
  prereq_concept_ids TEXT, -- JSON array
  confusion_concept_ids TEXT, -- JSON array (commonly confused with)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_concepts_category ON concepts(category);

-- ============================================
-- MAPPINGS (synth-specific implementations)
-- ============================================
CREATE TABLE IF NOT EXISTS synth_mappings (
  id TEXT PRIMARY KEY,
  concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  synth TEXT NOT NULL CHECK (synth IN ('serum', 'vital')),
  ui_area TEXT, -- e.g., 'OSC A', 'Filter 1', 'ENV 1'
  parameter_name TEXT,
  steps TEXT NOT NULL, -- JSON array of step strings
  gotchas TEXT, -- JSON array of common mistakes
  tips TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (concept_id IS NOT NULL OR lesson_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_mappings_concept ON synth_mappings(concept_id);
CREATE INDEX IF NOT EXISTS idx_mappings_lesson ON synth_mappings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_mappings_synth ON synth_mappings(synth);

-- ============================================
-- EXERCISES (practice with checklists)
-- ============================================
CREATE TABLE IF NOT EXISTS learn_exercises (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES learn_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  checklist TEXT NOT NULL, -- JSON array of steps
  rubric TEXT, -- JSON: grading criteria
  concept_ids TEXT, -- JSON array
  synth_scope TEXT NOT NULL CHECK (synth_scope IN ('serum', 'vital', 'both')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER DEFAULT 15,
  order_index INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(module_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_learn_exercises_module ON learn_exercises(module_id);

-- ============================================
-- PROJECTS (capstone assignments)
-- ============================================
CREATE TABLE IF NOT EXISTS learn_projects (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  brief TEXT NOT NULL, -- MDX description
  checklist TEXT NOT NULL, -- JSON array
  rubric TEXT, -- JSON
  concept_ids TEXT, -- JSON array
  recommended_lesson_ids TEXT, -- JSON array
  synth_scope TEXT NOT NULL CHECK (synth_scope IN ('serum', 'vital', 'both')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER DEFAULT 2,
  order_index INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(course_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_learn_projects_course ON learn_projects(course_id);

-- ============================================
-- RECIPE TEMPLATES (synthesis blueprints)
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  synth TEXT NOT NULL CHECK (synth IN ('serum', 'vital', 'both')),
  target_type TEXT NOT NULL CHECK (target_type IN ('bass', 'lead', 'pad', 'pluck', 'fx', 'arp')),
  descriptor_tags TEXT, -- JSON array: bright, dark, wide, gritty, etc.
  oscillator_setup TEXT NOT NULL, -- JSON
  filter_settings TEXT, -- JSON
  envelope_config TEXT, -- JSON
  lfo_config TEXT, -- JSON
  macro_mappings TEXT, -- JSON array
  explanation TEXT,
  variations TEXT, -- JSON array
  troubleshooting TEXT, -- JSON array
  is_published INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recipes_synth ON recipe_templates(synth);
CREATE INDEX IF NOT EXISTS idx_recipes_target ON recipe_templates(target_type);

-- ============================================
-- USER LEARNING SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS learn_user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  synth_preference TEXT CHECK (synth_preference IN ('serum', 'vital', 'both')) DEFAULT 'both',
  daily_review_target INTEGER DEFAULT 20,
  daily_lesson_target INTEGER DEFAULT 1,
  show_both_mappings INTEGER DEFAULT 0,
  diagnostic_completed INTEGER DEFAULT 0,
  diagnostic_results TEXT, -- JSON: weak concepts, recommended courses
  streak_current INTEGER DEFAULT 0,
  streak_longest INTEGER DEFAULT 0,
  streak_last_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- USER PROGRESS (lessons, exercises, projects)
-- ============================================
CREATE TABLE IF NOT EXISTS learn_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'module', 'lesson', 'exercise', 'project')),
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  progress_pct INTEGER DEFAULT 0,
  notes TEXT,
  confidence INTEGER, -- 1-5 self-rating
  started_at TEXT,
  completed_at TEXT,
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON learn_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_entity ON learn_progress(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON learn_progress(status);

-- ============================================
-- QUIZ ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- 0-100
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  answers TEXT NOT NULL, -- JSON: user answers
  missed_concept_ids TEXT, -- JSON array of concepts user got wrong
  time_taken_seconds INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_lesson ON quiz_attempts(lesson_id);

-- ============================================
-- REVIEW CARDS (spaced repetition)
-- ============================================
CREATE TABLE IF NOT EXISTS review_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('concept', 'quiz_miss', 'manual')),
  source_id TEXT, -- concept_id or quiz_attempt_id
  concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('definition', 'identification', 'application')) DEFAULT 'definition',
  front TEXT NOT NULL, -- Question or prompt
  back TEXT NOT NULL, -- Answer
  due_at TEXT NOT NULL,
  interval_days REAL DEFAULT 1,
  ease REAL DEFAULT 2.5,
  lapses INTEGER DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  last_reviewed_at TEXT,
  suspended INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_review_user ON review_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_review_due ON review_cards(due_at);
CREATE INDEX IF NOT EXISTS idx_review_concept ON review_cards(concept_id);

-- ============================================
-- REVIEW HISTORY (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS review_history (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES review_cards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 0 AND 3), -- 0=again, 1=hard, 2=good, 3=easy
  interval_before REAL,
  interval_after REAL,
  ease_before REAL,
  ease_after REAL,
  time_taken_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_review_hist_card ON review_history(card_id);
CREATE INDEX IF NOT EXISTS idx_review_hist_user ON review_history(user_id);

-- ============================================
-- SAVED RECIPES (user-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_recipes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  synth TEXT NOT NULL CHECK (synth IN ('serum', 'vital')),
  target_type TEXT,
  recipe_data TEXT NOT NULL, -- JSON: full recipe
  tags TEXT, -- JSON array
  notes TEXT,
  source_template_id TEXT REFERENCES recipe_templates(id),
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON saved_recipes(user_id);

-- ============================================
-- PATCH JOURNAL
-- ============================================
CREATE TABLE IF NOT EXISTS patch_journal (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  synth TEXT NOT NULL CHECK (synth IN ('serum', 'vital', 'other')),
  patch_name TEXT NOT NULL,
  tags TEXT, -- JSON array
  notes TEXT,
  what_learned TEXT,
  what_broke TEXT,
  preset_reference TEXT, -- string reference, no file
  related_lesson_ids TEXT, -- JSON array
  related_concept_ids TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON patch_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_synth ON patch_journal(synth);

-- ============================================
-- COMMUNITY: LESSON THREADS
-- ============================================
CREATE TABLE IF NOT EXISTS learn_threads (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  post_count INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  locked_by TEXT REFERENCES users(id),
  locked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_threads_lesson ON learn_threads(lesson_id);

-- ============================================
-- COMMUNITY: POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS learn_posts (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES learn_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL, -- sanitized markdown
  reply_to_id TEXT REFERENCES learn_posts(id),
  status TEXT NOT NULL CHECK (status IN ('visible', 'hidden', 'removed')) DEFAULT 'visible',
  edit_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_thread ON learn_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON learn_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON learn_posts(status);

-- ============================================
-- COMMUNITY: REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS learn_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES learn_posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'off_topic', 'misinformation', 'other')),
  detail TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')) DEFAULT 'pending',
  resolved_at TEXT,
  resolver_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_post ON learn_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON learn_reports(status);

-- ============================================
-- MODERATION: AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS learn_mod_actions (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'post_remove', 'post_restore', 'post_hide',
    'thread_lock', 'thread_unlock',
    'user_warn', 'user_mute', 'user_unmute',
    'report_dismiss', 'report_action'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'thread', 'user', 'report')),
  target_id TEXT NOT NULL,
  reason TEXT,
  metadata TEXT, -- JSON: additional context
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mod_actor ON learn_mod_actions(actor_id);
CREATE INDEX IF NOT EXISTS idx_mod_target ON learn_mod_actions(target_type, target_id);

-- ============================================
-- FULL-TEXT SEARCH: Lessons
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS lessons_fts USING fts5(
  title,
  description,
  mdx_content,
  content='lessons',
  content_rowid='rowid'
);

-- ============================================
-- FULL-TEXT SEARCH: Concepts
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS concepts_fts USING fts5(
  term,
  definition,
  aliases,
  content='concepts',
  content_rowid='rowid'
);

