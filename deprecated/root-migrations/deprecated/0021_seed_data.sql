-- ============================================================================
-- IGNITION SEED DATA v2.0
-- Run after schema migration to populate initial data
-- Generated: 2026-01-05
-- ============================================================================

-- ============================================================================
-- ONBOARDING FLOWS & STEPS
-- ============================================================================

-- Main onboarding flow (involved, 14 steps, escapable)
INSERT INTO onboarding_flows (id, version, name, description, is_active, total_steps) VALUES
    ('flow_main_v1', 1, 'Welcome to Ignition', 'Complete onboarding experience for new users', 1, 14);

-- Onboarding steps
INSERT INTO onboarding_steps (id, flow_id, step_order, step_type, title, description, target_selector, target_route, fallback_content, options_json, allows_multiple, required, action_type, action_config_json) VALUES
    -- Step 1: Welcome
    ('step_welcome', 'flow_main_v1', 1, 'explain', 'Welcome to Ignition', 'Ignition is a starter engine. It helps you begin - not plan more, not do more - just start.', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL),

    -- Step 2: Today tour
    ('step_tour_today', 'flow_main_v1', 2, 'tour', 'This is Today', 'Your daily starting point. One clear next action, always ready.', '.starter-block', '/today', 'Today shows your next action and daily overview.', NULL, 0, 0, NULL, NULL),

    -- Step 3: Focus tour
    ('step_tour_focus', 'flow_main_v1', 3, 'tour', 'Focus Sessions', 'Short, timed work sessions. Start with 5 minutes. Build momentum.', '.focus-timer', '/focus', 'Focus helps you work in short, focused bursts.', NULL, 0, 0, NULL, NULL),

    -- Step 4: Quests tour
    ('step_tour_quests', 'flow_main_v1', 4, 'tour', 'Quests', 'Small tasks you can complete quickly. Check them off, earn rewards.', '.quest-list', '/quests', 'Quests are small tasks that earn you rewards.', NULL, 0, 0, NULL, NULL),

    -- Step 5: Interest selection
    ('step_interests', 'flow_main_v1', 5, 'choice', 'What brings you here?', 'Select 1-3 interests. This helps us personalize your experience.', NULL, NULL, NULL, '[{"key":"focus","label":"Focus & Deep Work","description":"Timed sessions, flow states"},{"key":"fitness","label":"Fitness & Movement","description":"Workouts, exercise tracking"},{"key":"learning","label":"Learning & Growth","description":"Courses, reading, skills"},{"key":"music_daw","label":"Music Production","description":"DAW shortcuts, theory, ear training"},{"key":"habits","label":"Daily Habits","description":"Routines, consistency"},{"key":"creativity","label":"Ideas & Creativity","description":"Capture thoughts, brainstorm"}]', 1, 1, NULL, NULL),

    -- Step 6: Nudge intensity
    ('step_intensity', 'flow_main_v1', 6, 'preference', 'How should we nudge you?', 'Choose your preferred intensity level.', NULL, NULL, NULL, '[{"key":"gentle","label":"Gentle","description":"Quiet suggestions, minimal prompts"},{"key":"standard","label":"Standard","description":"Balanced nudges, regular feedback"},{"key":"energetic","label":"Energetic","description":"Active prompts, frequent encouragement"}]', 0, 1, NULL, NULL),

    -- Step 7: Focus duration
    ('step_focus_duration', 'flow_main_v1', 7, 'preference', 'Default focus duration', 'How long should your default focus session be?', NULL, NULL, NULL, '[{"key":"300","label":"5 minutes","description":"Quick sprint"},{"key":"600","label":"10 minutes","description":"Short session"},{"key":"1500","label":"25 minutes","description":"Full pomodoro"},{"key":"custom","label":"Custom","description":"Set your own"}]', 0, 1, NULL, NULL),

    -- Step 8: Module weights
    ('step_modules', 'flow_main_v1', 8, 'preference', 'Customize your Today', 'Which modules should appear more often? Drag to reorder or toggle off.', NULL, NULL, NULL, '[{"key":"focus","label":"Focus","default_weight":80},{"key":"quests","label":"Quests","default_weight":70},{"key":"ignitions","label":"Quick Starts","default_weight":60},{"key":"learn","label":"Learn","default_weight":50},{"key":"ideas","label":"Ideas","default_weight":40},{"key":"wins","label":"Wins","default_weight":30},{"key":"plan","label":"Planner","default_weight":20},{"key":"market","label":"Rewards","default_weight":10}]', 1, 0, NULL, NULL),

    -- Step 9: Gamification visibility
    ('step_gamification', 'flow_main_v1', 9, 'preference', 'Rewards & Progress', 'How visible should XP, coins, and achievements be?', NULL, NULL, NULL, '[{"key":"always","label":"Always visible","description":"See points after every action"},{"key":"subtle","label":"Subtle","description":"Occasional feedback"},{"key":"hidden","label":"Hidden","description":"Focus on the work, not the score"}]', 0, 1, NULL, NULL),

    -- Step 10: Planner opt-in
    ('step_planner', 'flow_main_v1', 10, 'preference', 'Planning tools', 'Ignition is not a planner - but planning tools are available if you want them.', NULL, NULL, NULL, '[{"key":"visible","label":"Show planning","description":"Goals, habits, daily plans visible"},{"key":"collapsed","label":"Keep collapsed","description":"Available but not prominent"},{"key":"hidden","label":"Hide for now","description":"Pure starter engine mode"}]', 0, 1, NULL, NULL),

    -- Step 11: Points explanation
    ('step_explain_points', 'flow_main_v1', 11, 'explain', 'How rewards work', 'Coins buy treats in the Market. XP levels you up. Skill Stars unlock mastery. Complete actions to earn all three.', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL),

    -- Step 12: Streaks explanation
    ('step_explain_streaks', 'flow_main_v1', 12, 'explain', 'Streaks', 'Do something small every day to build your streak. Miss a day? No guilt - just start again tomorrow.', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL),

    -- Step 13: First action
    ('step_first_action', 'flow_main_v1', 13, 'action', 'Your first start', 'Let''s do a quick 5-minute focus session together. Ready?', NULL, NULL, NULL, NULL, 0, 0, 'focus', '{"duration":300,"mode":"focus","is_onboarding":true}'),

    -- Step 14: Complete
    ('step_complete', 'flow_main_v1', 14, 'explain', 'You''re ready!', 'That''s it. Ignition is here whenever you need to start. No pressure, no guilt - just begin.', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL);

-- ============================================================================
-- SKILL DEFINITIONS
-- ============================================================================

INSERT INTO skill_definitions (id, name, description, category, max_level, stars_per_level) VALUES
    ('skill_focus', 'Focus Mastery', 'Deep work and concentration', 'focus', 10, 20),
    ('skill_endurance', 'Endurance', 'Longer focus sessions', 'focus', 10, 25),
    ('skill_consistency', 'Consistency', 'Daily activity streaks', 'productivity', 10, 15),
    ('skill_strength', 'Strength', 'Physical fitness progress', 'fitness', 10, 20),
    ('skill_cardio', 'Cardio', 'Cardiovascular endurance', 'fitness', 10, 20),
    ('skill_flexibility', 'Flexibility', 'Mobility and stretching', 'fitness', 10, 15),
    ('skill_theory', 'Music Theory', 'Understanding harmony and structure', 'music', 10, 25),
    ('skill_ear', 'Ear Training', 'Recognizing intervals, chords, scales', 'music', 10, 30),
    ('skill_production', 'Production', 'DAW and mixing skills', 'music', 10, 25),
    ('skill_reading', 'Reader', 'Books and articles consumed', 'learning', 10, 15),
    ('skill_learner', 'Learner', 'Courses and lessons completed', 'learning', 10, 20);

-- ============================================================================
-- ACHIEVEMENT DEFINITIONS
-- ============================================================================

INSERT INTO achievement_definitions (id, name, description, category, condition_type, condition_json, reward_coins, reward_xp, reward_skill_stars, reward_skill_id, is_hidden) VALUES
    -- Focus achievements
    ('ach_first_focus', 'First Focus', 'Complete your first focus session', 'focus', 'first', '{"event_type":"focus_complete"}', 10, 25, 1, 'skill_focus', 0),
    ('ach_focus_5', 'Getting Started', 'Complete 5 focus sessions', 'focus', 'count', '{"event_type":"focus_complete","count":5}', 25, 50, 2, 'skill_focus', 0),
    ('ach_focus_25', 'Focus Apprentice', 'Complete 25 focus sessions', 'focus', 'count', '{"event_type":"focus_complete","count":25}', 50, 100, 5, 'skill_focus', 0),
    ('ach_focus_100', 'Focus Master', 'Complete 100 focus sessions', 'focus', 'count', '{"event_type":"focus_complete","count":100}', 100, 250, 10, 'skill_focus', 0),
    ('ach_focus_hour', 'Hour of Power', 'Complete 60 minutes of focus in one day', 'focus', 'milestone', '{"metric":"daily_focus_minutes","value":60}', 30, 75, 3, 'skill_endurance', 0),

    -- Streak achievements
    ('ach_streak_3', 'Three Day Streak', 'Maintain a 3-day activity streak', 'streaks', 'streak', '{"streak_type":"daily_activity","days":3}', 15, 30, 1, 'skill_consistency', 0),
    ('ach_streak_7', 'Week Warrior', 'Maintain a 7-day activity streak', 'streaks', 'streak', '{"streak_type":"daily_activity","days":7}', 35, 75, 3, 'skill_consistency', 0),
    ('ach_streak_30', 'Monthly Master', 'Maintain a 30-day activity streak', 'streaks', 'streak', '{"streak_type":"daily_activity","days":30}', 100, 200, 10, 'skill_consistency', 0),

    -- Quest achievements
    ('ach_first_quest', 'Quest Begun', 'Complete your first quest', 'quests', 'first', '{"event_type":"quest_complete"}', 10, 20, 0, NULL, 0),
    ('ach_quest_10', 'Quest Runner', 'Complete 10 quests', 'quests', 'count', '{"event_type":"quest_complete","count":10}', 30, 60, 0, NULL, 0),
    ('ach_quest_50', 'Quest Champion', 'Complete 50 quests', 'quests', 'count', '{"event_type":"quest_complete","count":50}', 75, 150, 0, NULL, 0),

    -- Learning achievements
    ('ach_first_lesson', 'Student', 'Complete your first lesson', 'learning', 'first', '{"event_type":"lesson_complete"}', 10, 25, 1, 'skill_learner', 0),
    ('ach_lesson_10', 'Eager Learner', 'Complete 10 lessons', 'learning', 'count', '{"event_type":"lesson_complete","count":10}', 40, 80, 3, 'skill_learner', 0),
    ('ach_drill_streak_7', 'Drill Sergeant', 'Complete ear training drills 7 days in a row', 'learning', 'streak', '{"streak_type":"learn","days":7}', 50, 100, 5, 'skill_ear', 0),

    -- Special/hidden
    ('ach_night_owl', 'Night Owl', 'Complete a focus session after midnight', 'special', 'milestone', '{"metric":"focus_hour","value":0}', 20, 40, 0, NULL, 1),
    ('ach_early_bird', 'Early Bird', 'Complete a focus session before 6 AM', 'special', 'milestone', '{"metric":"focus_hour","value":6}', 20, 40, 0, NULL, 1),
    ('ach_first_purchase', 'Treat Yourself', 'Make your first market purchase', 'special', 'first', '{"event_type":"market_purchase"}', 0, 25, 0, NULL, 0);

-- ============================================================================
-- MARKET ITEMS (Global defaults)
-- ============================================================================

INSERT INTO market_items (id, name, description, category, cost_coins, icon, is_global, is_active) VALUES
    -- Food & Drinks
    ('item_takeout', 'Order Takeout', 'Treat yourself to your favorite restaurant', 'food', 100, 'utensils', 1, 1),
    ('item_coffee', 'Fancy Coffee', 'Get that special latte you''ve been eyeing', 'food', 50, 'coffee', 1, 1),
    ('item_snack', 'Snack Run', 'Grab some treats from the store', 'food', 30, 'cookie', 1, 1),
    ('item_dessert', 'Dessert Time', 'Something sweet after a productive day', 'food', 40, 'cake', 1, 1),

    -- Entertainment
    ('item_movie', 'Movie Night', 'Watch a movie guilt-free', 'entertainment', 75, 'film', 1, 1),
    ('item_game', 'Gaming Session', '1 hour of uninterrupted gaming', 'entertainment', 60, 'gamepad', 1, 1),
    ('item_stream', 'Binge Episode', 'One episode of your current show', 'entertainment', 40, 'tv', 1, 1),
    ('item_music', 'New Album', 'Buy or stream a new album', 'entertainment', 50, 'music', 1, 1),

    -- Self Care
    ('item_sleep', 'Sleep In', 'Skip the early alarm tomorrow', 'selfcare', 80, 'moon', 1, 1),
    ('item_bath', 'Spa Time', 'Take a long relaxing bath', 'selfcare', 40, 'droplet', 1, 1),
    ('item_nap', 'Power Nap', 'Take a guilt-free 30min nap', 'selfcare', 25, 'bed', 1, 1),
    ('item_walk', 'Nature Walk', 'An unhurried walk outside', 'selfcare', 30, 'trees', 1, 1),

    -- Power-ups
    ('item_streak_shield', 'Streak Shield', 'Protect your streak for one missed day', 'powerup', 150, 'shield', 1, 1),
    ('item_xp_boost', 'XP Boost', 'Double XP for next 3 activities', 'powerup', 200, 'zap', 1, 1);

-- ============================================================================
-- LEARN TOPICS (Music Theory & Ear Training)
-- ============================================================================

INSERT INTO learn_topics (id, name, description, category, parent_id, order_index, estimated_minutes, difficulty) VALUES
    -- Theory basics
    ('topic_theory', 'Music Theory', 'Understanding the language of music', 'theory', NULL, 1, NULL, 'beginner'),
    ('topic_intervals', 'Intervals', 'The distance between notes', 'theory', 'topic_theory', 1, 15, 'beginner'),
    ('topic_scales', 'Scales & Modes', 'Major, minor, and modal scales', 'theory', 'topic_theory', 2, 30, 'beginner'),
    ('topic_chords', 'Chords', 'Triads, 7ths, and extensions', 'theory', 'topic_theory', 3, 25, 'beginner'),
    ('topic_progressions', 'Chord Progressions', 'Common harmonic patterns', 'theory', 'topic_theory', 4, 20, 'intermediate'),
    ('topic_circle', 'Circle of Fifths', 'The Camelot wheel of harmony', 'theory', 'topic_theory', 5, 15, 'beginner'),
    ('topic_rhythm', 'Rhythm & Time', 'Time signatures and subdivisions', 'theory', 'topic_theory', 6, 20, 'beginner'),

    -- Ear training
    ('topic_ear', 'Ear Training', 'Develop your musical ear', 'ear_training', NULL, 2, NULL, 'beginner'),
    ('topic_ear_intervals', 'Interval Recognition', 'Hear and identify intervals', 'ear_training', 'topic_ear', 1, 20, 'beginner'),
    ('topic_ear_chords', 'Chord Recognition', 'Major, minor, diminished, augmented', 'ear_training', 'topic_ear', 2, 25, 'beginner'),
    ('topic_ear_scales', 'Scale Recognition', 'Identify scales and modes by ear', 'ear_training', 'topic_ear', 3, 25, 'intermediate'),
    ('topic_ear_rhythm', 'Rhythm Training', 'Clapping and tapping patterns', 'ear_training', 'topic_ear', 4, 15, 'beginner'),
    ('topic_ear_melody', 'Melody Recall', 'Remember and reproduce melodies', 'ear_training', 'topic_ear', 5, 20, 'intermediate'),

    -- Production tie-ins
    ('topic_production', 'Production Basics', 'Apply theory in your DAW', 'production', NULL, 3, NULL, 'beginner'),
    ('topic_prod_harmony', 'Building Harmony', 'Create chord progressions', 'production', 'topic_production', 1, 30, 'beginner');

-- ============================================================================
-- LEARN LESSONS (Sample content)
-- ============================================================================

INSERT INTO learn_lessons (id, topic_id, title, description, content_markdown, order_index, estimated_minutes, quiz_json, xp_reward, coin_reward, skill_id, skill_star_reward) VALUES
    -- Intervals lessons
    ('lesson_intervals_intro', 'topic_intervals', 'What is an Interval?', 'The building block of all harmony',
    '# What is an Interval?

An **interval** is the distance between two notes. It''s the most fundamental concept in music theory.

## Why Intervals Matter

Every melody is a sequence of intervals. Every chord is intervals stacked together. Understanding intervals unlocks:

- How melodies move
- Why chords sound the way they do
- The emotional quality of music

## The Basics

We measure intervals by counting the distance in half-steps (semitones) or by their musical names:

| Interval | Half-steps | Sound |
|----------|------------|-------|
| Minor 2nd | 1 | Tense, close |
| Major 2nd | 2 | Step, walking |
| Minor 3rd | 3 | Sad, minor |
| Major 3rd | 4 | Happy, major |
| Perfect 4th | 5 | Open, hymn-like |
| Tritone | 6 | Unstable, tension |
| Perfect 5th | 7 | Powerful, open |

In the next lesson, we''ll learn to recognize each interval by ear.',
    1, 3,
    '[{"q":"How many half-steps in a Perfect 5th?","options":["5","6","7","8"],"answer":2},{"q":"Which interval sounds ''sad'' or ''minor''?","options":["Major 3rd","Minor 3rd","Perfect 4th","Major 2nd"],"answer":1}]',
    15, 5, 'skill_theory', 1),

    ('lesson_intervals_major_minor', 'topic_intervals', 'Major vs Minor Intervals', 'The emotional colors of music',
    '# Major vs Minor Intervals

The difference between major and minor intervals is just **one half-step** - but it changes everything.

## Major Intervals

Major intervals sound:
- Bright
- Happy
- Open
- Resolved

**Major 3rd** (4 half-steps): Think of the first two notes of "Kumbaya" or a major chord''s root to third.

## Minor Intervals

Minor intervals sound:
- Dark
- Sad
- Introspective
- Yearning

**Minor 3rd** (3 half-steps): Think of the beginning of "Greensleeves" or any minor chord.

## Quick Reference

| Major | Half-steps | Minor | Half-steps |
|-------|------------|-------|------------|
| Major 2nd | 2 | Minor 2nd | 1 |
| Major 3rd | 4 | Minor 3rd | 3 |
| Major 6th | 9 | Minor 6th | 8 |
| Major 7th | 11 | Minor 7th | 10 |

*Note: 4ths, 5ths, and octaves are "perfect" - they don''t have major/minor versions.*',
    2, 3,
    '[{"q":"A Major 3rd has how many half-steps?","options":["3","4","5","6"],"answer":1},{"q":"What''s the difference between major and minor intervals?","options":["2 half-steps","1 half-step","3 half-steps","No difference"],"answer":1}]',
    15, 5, 'skill_theory', 1),

    -- Circle of Fifths
    ('lesson_circle_intro', 'topic_circle', 'The Circle of Fifths', 'Your harmonic roadmap',
    '# The Circle of Fifths

The **Circle of Fifths** is a visual representation of how all 12 keys relate to each other.

## Why It Matters

- Keys next to each other sound good together
- It shows you which chords "fit" in each key
- DJs use it (as the Camelot Wheel) for harmonic mixing
- It reveals patterns in all of Western music

## How It Works

Starting from C and moving clockwise, each key is a **perfect 5th** higher:

C -> G -> D -> A -> E -> B -> F# -> Db -> Ab -> Eb -> Bb -> F -> C

Going counter-clockwise, each key is a **perfect 4th** higher (or a 5th lower).

## The Camelot System

DJs use a numbered version:
- Numbers 1-12 around the wheel
- A = minor keys, B = major keys
- Move by 1 = smooth harmonic transition
- Same number, different letter = relative major/minor

## Quick Rules

1. **Adjacent keys** share 6 of 7 notes
2. **Opposite keys** are very different (tritone apart)
3. **Inner/outer** pairs are relative major/minor',
    1, 3,
    '[{"q":"Moving clockwise on the Circle of Fifths, each key is a _____ higher","options":["Perfect 4th","Perfect 5th","Major 3rd","Minor 3rd"],"answer":1},{"q":"Adjacent keys on the circle share how many notes?","options":["4 of 7","5 of 7","6 of 7","All 7"],"answer":2}]',
    20, 8, 'skill_theory', 2);

-- ============================================================================
-- LEARN DRILLS (Ear Training)
-- ============================================================================

INSERT INTO learn_drills (id, topic_id, name, description, drill_type, difficulty, config_json, initial_interval_hours) VALUES
    -- Interval drills
    ('drill_intervals_asc_easy', 'topic_ear_intervals', 'Ascending Intervals (Easy)', 'Identify ascending intervals: 2nds, 3rds, 5ths', 'interval',  'beginner',
    '{"direction":"ascending","intervals":["m2","M2","m3","M3","P5"],"num_questions":10}', 24),

    ('drill_intervals_asc_all', 'topic_ear_intervals', 'Ascending Intervals (All)', 'Identify all ascending intervals', 'interval', 'intermediate',
    '{"direction":"ascending","intervals":["m2","M2","m3","M3","P4","TT","P5","m6","M6","m7","M7","P8"],"num_questions":12}', 48),

    ('drill_intervals_desc', 'topic_ear_intervals', 'Descending Intervals', 'Identify descending intervals', 'interval', 'intermediate',
    '{"direction":"descending","intervals":["m2","M2","m3","M3","P4","P5","m6","M6"],"num_questions":10}', 48),

    -- Chord drills
    ('drill_chords_triads', 'topic_ear_chords', 'Triad Recognition', 'Major, minor, diminished, augmented', 'chord', 'beginner',
    '{"chord_types":["major","minor","diminished","augmented"],"num_questions":10}', 24),

    ('drill_chords_7ths', 'topic_ear_chords', 'Seventh Chords', 'Maj7, min7, dom7, dim7', 'chord', 'intermediate',
    '{"chord_types":["maj7","min7","dom7","m7b5","dim7"],"num_questions":10}', 48),

    -- Scale drills
    ('drill_scales_basic', 'topic_ear_scales', 'Major vs Minor', 'Distinguish major and minor scales', 'scale', 'beginner',
    '{"scale_types":["major","natural_minor"],"num_questions":8}', 24),

    ('drill_scales_modes', 'topic_ear_scales', 'Common Modes', 'Dorian, Mixolydian, and more', 'scale', 'intermediate',
    '{"scale_types":["major","dorian","mixolydian","natural_minor"],"num_questions":10}', 72),

    -- Rhythm drills
    ('drill_rhythm_basic', 'topic_ear_rhythm', 'Basic Rhythms', 'Quarter notes, eighth notes, rests', 'rhythm', 'beginner',
    '{"time_signature":"4/4","subdivisions":["quarter","eighth"],"bars":2,"num_questions":8}', 24),

    ('drill_rhythm_syncopation', 'topic_ear_rhythm', 'Syncopation', 'Off-beat rhythms and ties', 'rhythm', 'intermediate',
    '{"time_signature":"4/4","subdivisions":["quarter","eighth","sixteenth"],"include_syncopation":true,"bars":2,"num_questions":8}', 48);

-- ============================================================================
-- IGNITION PACKS (Quick start suggestions)
-- ============================================================================

INSERT INTO ignition_packs (id, name, description, category, items_json, is_active) VALUES
    ('pack_focus', 'Focus Starters', 'Quick ways to begin focused work', 'focus',
    '[{"id":"ign_focus_5","title":"5-Minute Sprint","description":"Just 5 minutes. That''s it.","action":{"type":"focus","duration":300}},{"id":"ign_focus_10","title":"10-Minute Session","description":"A short but solid block.","action":{"type":"focus","duration":600}},{"id":"ign_focus_25","title":"Full Pomodoro","description":"The classic 25-minute session.","action":{"type":"focus","duration":1500}}]', 1),

    ('pack_quick', 'Quick Wins', 'Small actions to build momentum', 'general',
    '[{"id":"ign_water","title":"Drink Water","description":"Hydrate. Simple.","action":{"type":"complete"}},{"id":"ign_stretch","title":"30-Second Stretch","description":"Stand up and stretch.","action":{"type":"complete"}},{"id":"ign_breathe","title":"3 Deep Breaths","description":"Pause. Breathe. Reset.","action":{"type":"complete"}},{"id":"ign_clear","title":"Clear One Thing","description":"Clean one small area.","action":{"type":"complete"}}]', 1),

    ('pack_creative', 'Creative Sparks', 'Get the creative juices flowing', 'creativity',
    '[{"id":"ign_idea","title":"Capture an Idea","description":"Write down one thought.","action":{"type":"navigate","route":"/ideas"}},{"id":"ign_daw","title":"Open Your DAW","description":"Just open it. See what happens.","action":{"type":"complete"}},{"id":"ign_listen","title":"Listen to a Track","description":"Active listening for 3 minutes.","action":{"type":"focus","duration":180}}]', 1),

    ('pack_learn', 'Learn Something', 'Quick learning opportunities', 'learning',
    '[{"id":"ign_drill","title":"2-Minute Drill","description":"Quick ear training exercise.","action":{"type":"navigate","route":"/learn"}},{"id":"ign_lesson","title":"One Lesson","description":"Complete a short lesson.","action":{"type":"navigate","route":"/learn"}},{"id":"ign_read","title":"Read 5 Pages","description":"A few pages of your current book.","action":{"type":"navigate","route":"/books"}}]', 1);

-- ============================================================================
-- INITIAL METADATA
-- ============================================================================

UPDATE db_metadata SET value = '20', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0020_full_reset_v2_seeded', updated_at = datetime('now') WHERE key = 'db_version_name';

