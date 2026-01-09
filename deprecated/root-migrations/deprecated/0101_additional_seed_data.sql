-- ============================================================================
-- ADDITIONAL SEED DATA
-- Run after 0100_master_reset.sql to populate content
-- ============================================================================

-- ============================================================================
-- LEARN LESSONS (Music Theory)
-- ============================================================================

INSERT INTO learn_lessons (id, topic_id, key, title, description, content_markdown, duration_minutes, difficulty, xp_reward, coin_reward, skill_key, skill_star_reward, sort_order) VALUES
-- Intervals lessons
('lesson_int_1', 'topic_intervals', 'intervals_intro', 'What Are Intervals?', 'Learn the basics of musical intervals',
'# What Are Intervals?

An **interval** is the distance between two notes. Understanding intervals is fundamental to:
- Reading music
- Playing by ear
- Understanding harmony

## Types of Intervals

Intervals are named by two parts:
1. **Quality** (major, minor, perfect, augmented, diminished)
2. **Number** (2nd, 3rd, 4th, 5th, etc.)

## Common Intervals

| Interval | Half Steps | Example |
|----------|-----------|---------|
| Minor 2nd | 1 | E to F |
| Major 2nd | 2 | C to D |
| Minor 3rd | 3 | A to C |
| Major 3rd | 4 | C to E |
| Perfect 4th | 5 | C to F |
| Perfect 5th | 7 | C to G |

## Practice Tip

Start by learning to recognize the Perfect 5th - it is the most stable and easiest to hear.
', 5, 'beginner', 20, 10, 'learning', 1, 1),

('lesson_int_2', 'topic_intervals', 'intervals_minor_major', 'Minor vs Major Intervals', 'Distinguish between minor and major qualities',
'# Minor vs Major Intervals

The difference between minor and major is **one half step**.

## The Rule

- **Major** intervals sound brighter, happier
- **Minor** intervals sound darker, sadder

## Examples

### Major 3rd (4 half steps)
- C to E
- Sounds like the beginning of a major chord

### Minor 3rd (3 half steps)
- C to Eb
- Sounds like the beginning of a minor chord

## Quick Test

Play these on your instrument:
1. C to E (major 3rd) - bright
2. C to Eb (minor 3rd) - dark

Can you hear the difference?
', 5, 'beginner', 20, 10, 'learning', 1, 2),

-- Chords lessons
('lesson_chord_1', 'topic_chords', 'chords_intro', 'Building Chords', 'Learn how chords are constructed',
'# Building Chords

A **chord** is three or more notes played together.

## Triads

The most basic chord is a **triad** - three notes:
1. **Root** - the note the chord is named after
2. **Third** - defines major or minor quality
3. **Fifth** - adds stability

## Triad Types

| Type | Formula | Sound |
|------|---------|-------|
| Major | 1 - 3 - 5 | Happy, bright |
| Minor | 1 - b3 - 5 | Sad, dark |
| Diminished | 1 - b3 - b5 | Tense, unstable |
| Augmented | 1 - 3 - #5 | Mysterious, unstable |

## Building a C Major Chord

1. Start with C (root)
2. Add E (major 3rd above C)
3. Add G (perfect 5th above C)

Result: C - E - G = C Major
', 7, 'beginner', 25, 12, 'learning', 1, 1),

('lesson_chord_2', 'topic_chords', 'chords_seventh', 'Seventh Chords', 'Add color with seventh chords',
'# Seventh Chords

Add a fourth note to create **seventh chords** - richer and more colorful.

## Common Seventh Chords

| Type | Symbol | Formula | Sound |
|------|--------|---------|-------|
| Major 7th | Maj7 | 1-3-5-7 | Dreamy, jazzy |
| Dominant 7th | 7 | 1-3-5-b7 | Bluesy, wants to resolve |
| Minor 7th | m7 | 1-b3-5-b7 | Warm, mellow |
| Half-Diminished | m7b5 | 1-b3-b5-b7 | Dark, unresolved |

## The Dominant 7th

This is the most important seventh chord:
- Creates tension that wants to resolve
- The backbone of blues and jazz
- Used in the V7 -> I progression

## Example: G7 to C

G7 (G-B-D-F) resolves naturally to C major.
The tritone (B-F) resolves inward to C-E.
', 8, 'intermediate', 30, 15, 'learning', 2, 2),

-- Scales lessons
('lesson_scale_1', 'topic_scales', 'scales_major', 'The Major Scale', 'Foundation of Western music',
'# The Major Scale

The major scale is the foundation of Western music.

## The Pattern

**W - W - H - W - W - W - H**

Where:
- W = Whole step (2 frets / 2 half steps)
- H = Half step (1 fret / 1 half step)

## C Major Scale

C - D - E - F - G - A - B - C

No sharps or flats - all white keys!

## Building Any Major Scale

1. Start on your root note
2. Follow the W-W-H-W-W-W-H pattern
3. Each letter name appears once

## Scale Degrees

| Degree | Name | Function |
|--------|------|----------|
| 1 | Tonic | Home base |
| 2 | Supertonic | Passing |
| 3 | Mediant | Defines major/minor |
| 4 | Subdominant | Pre-dominant |
| 5 | Dominant | Tension |
| 6 | Submediant | Relative minor |
| 7 | Leading tone | Pulls to tonic |
', 10, 'beginner', 30, 15, 'learning', 2, 1),

-- Rhythm lessons
('lesson_rhythm_1', 'topic_rhythm', 'rhythm_basics', 'Understanding Rhythm', 'Time signatures and note values',
'# Understanding Rhythm

Rhythm is the organization of music in time.

## Note Values

| Note | Beats (in 4/4) |
|------|----------------|
| Whole | 4 |
| Half | 2 |
| Quarter | 1 |
| Eighth | 1/2 |
| Sixteenth | 1/4 |

## Time Signatures

The two numbers tell you:
- **Top number**: Beats per measure
- **Bottom number**: Note value that gets one beat

### Common Time Signatures

- **4/4**: 4 quarter-note beats (most common)
- **3/4**: 3 quarter-note beats (waltz)
- **6/8**: 6 eighth-note beats (compound duple)

## Counting Practice

In 4/4 time, count:
- Quarter notes: 1 - 2 - 3 - 4
- Eighth notes: 1-and-2-and-3-and-4-and
- Sixteenth notes: 1-e-and-a-2-e-and-a...
', 8, 'beginner', 25, 12, 'learning', 1, 1),

-- Harmony lessons
('lesson_harm_1', 'topic_harmony', 'harmony_progressions', 'Common Chord Progressions', 'Learn the building blocks of songs',
'# Common Chord Progressions

Most popular songs use the same handful of progressions.

## The I-IV-V-I

The most fundamental progression in Western music.

In C major: **C - F - G - C**

This progression appears in thousands of songs.

## The I-V-vi-IV

The "pop punk" or "four chord" progression.

In C major: **C - G - Am - F**

Songs that use this:
- "Let It Be"
- "No Woman No Cry"
- "With or Without You"

## The ii-V-I

The backbone of jazz.

In C major: **Dm7 - G7 - Cmaj7**

This creates smooth voice leading and harmonic motion.

## Circle of Fifths Movement

Moving by 5ths creates strong harmonic motion:
- vi - ii - V - I
- In C: Am - Dm - G - C
', 10, 'intermediate', 35, 18, 'learning', 2, 1),

-- Production lessons
('lesson_prod_1', 'topic_production', 'production_arrangement', 'Song Arrangement Basics', 'Structure your tracks effectively',
'# Song Arrangement Basics

A well-arranged song keeps listeners engaged from start to finish.

## Common Song Sections

| Section | Purpose | Typical Length |
|---------|---------|----------------|
| Intro | Set the mood | 4-8 bars |
| Verse | Tell the story | 8-16 bars |
| Pre-Chorus | Build tension | 4-8 bars |
| Chorus | Main hook | 8-16 bars |
| Bridge | Contrast | 8 bars |
| Outro | Wind down | 4-8 bars |

## The Energy Arc

Build energy throughout the song:

1. **Intro**: 30% energy
2. **Verse 1**: 40% energy
3. **Chorus 1**: 70% energy
4. **Verse 2**: 50% energy
5. **Chorus 2**: 80% energy
6. **Bridge**: 60% energy
7. **Final Chorus**: 100% energy
8. **Outro**: Fade to 20%

## Layering Elements

Add and remove elements to create contrast:
- Verse: Drums + Bass + Pad
- Pre-Chorus: Add arpeggio
- Chorus: Add lead + full drums + more layers
', 12, 'intermediate', 40, 20, 'production', 2, 1);

-- ============================================================================
-- RECIPE TEMPLATES (Production Recipes)
-- ============================================================================

INSERT INTO recipe_templates (id, name, description, category, genre, steps_json, tips) VALUES
('recipe_lofi_beat', 'Lo-Fi Hip Hop Beat', 'Create a chill lo-fi beat from scratch', 'production', 'lo-fi',
'["Set tempo to 70-85 BPM","Create a dusty drum pattern with swing","Add a jazzy piano or Rhodes sample","Apply vinyl crackle and tape saturation","Add a mellow bass line","Layer ambient textures","Mix with lo-fi EQ (roll off highs)"]',
'Use sidechain compression on the keys for that pumping effect'),

('recipe_edm_drop', 'EDM Drop', 'Build tension and release with a powerful drop', 'production', 'edm',
'["Start with a 4-bar buildup","Use risers and snare rolls","Cut the bass before the drop","Hit hard with supersaws and heavy kick","Layer your leads for width","Add impact FX at the drop","Automate filters throughout"]',
'The silence before the drop is crucial - let it breathe'),

('recipe_trap_808', 'Trap 808 Pattern', 'Create hard-hitting 808 bass lines', 'production', 'trap',
'["Start with a punchy kick pattern","Add 808 bass following the kick","Use pitch bends for slides","Layer hi-hats with variation","Add snare on 2 and 4","Program triplet hi-hat rolls","Add subtle percs for movement"]',
'Sidechain the 808 to the kick for punch'),

('recipe_ambient_pad', 'Ambient Soundscape', 'Create evolving ambient textures', 'production', 'ambient',
'["Choose a warm, evolving pad sound","Add long reverb (5-10 seconds)","Create slow filter movements","Layer with field recordings","Add subtle granular textures","Use stereo width automation","Keep dynamics gentle"]',
'Less is more - leave space for the sounds to breathe'),

('recipe_chord_progression', 'Writing Chord Progressions', 'Develop emotional chord progressions', 'theory', 'general',
'["Choose your key","Start with I chord (home)","Move to IV or V for tension","Try adding vi for emotion","Experiment with inversions","Add 7ths for color","Test with a simple melody"]',
'The vi chord (relative minor) adds emotional depth');

-- ============================================================================
-- PLAN TEMPLATES
-- ============================================================================

INSERT INTO plan_templates (id, user_id, name, description, items_json, is_public, category) VALUES
('tpl_morning_focus', NULL, 'Morning Focus Routine', 'Start your day with intention',
'[{"id":"1","content":"Morning stretch (5 min)","completed":false},{"id":"2","content":"Set intention for the day","completed":false},{"id":"3","content":"Deep work block (90 min)","completed":false},{"id":"4","content":"Short break + water","completed":false},{"id":"5","content":"Review and adjust plan","completed":false}]',
1, 'productivity'),

('tpl_creative_session', NULL, 'Creative Session', 'Template for focused creative work',
'[{"id":"1","content":"Clear workspace","completed":false},{"id":"2","content":"Review reference material","completed":false},{"id":"3","content":"Warm-up exercise (10 min)","completed":false},{"id":"4","content":"Main creative work (60 min)","completed":false},{"id":"5","content":"Document progress and ideas","completed":false}]',
1, 'creative'),

('tpl_music_practice', NULL, 'Music Practice Session', 'Structured practice routine',
'[{"id":"1","content":"Warm-up scales (5 min)","completed":false},{"id":"2","content":"Technical exercises (15 min)","completed":false},{"id":"3","content":"New material study (20 min)","completed":false},{"id":"4","content":"Ear training drill (10 min)","completed":false},{"id":"5","content":"Free play / improvisation (10 min)","completed":false}]',
1, 'music'),

('tpl_weekly_review', NULL, 'Weekly Review', 'End-of-week reflection template',
'[{"id":"1","content":"Review completed tasks","completed":false},{"id":"2","content":"Note wins and progress","completed":false},{"id":"3","content":"Identify blockers","completed":false},{"id":"4","content":"Plan next week priorities","completed":false},{"id":"5","content":"Set one main goal","completed":false}]',
1, 'productivity'),

('tpl_workout', NULL, 'Workout Day', 'Template for exercise days',
'[{"id":"1","content":"Dynamic warm-up (10 min)","completed":false},{"id":"2","content":"Main workout","completed":false},{"id":"3","content":"Cool-down stretches","completed":false},{"id":"4","content":"Log workout in app","completed":false},{"id":"5","content":"Hydrate and refuel","completed":false}]',
1, 'fitness');

-- ============================================================================
-- INFOBASE ENTRIES (Knowledge Base)
-- ============================================================================

INSERT INTO infobase_entries (id, user_id, title, content, category, tags_json, is_public) VALUES
('info_eq_basics', NULL, 'EQ Fundamentals',
'## What is EQ?

Equalization (EQ) is the process of adjusting the balance of frequency components in an audio signal.

### Frequency Ranges

| Range | Frequencies | Character |
|-------|-------------|-----------|
| Sub Bass | 20-60 Hz | Felt more than heard |
| Bass | 60-250 Hz | Warmth, body |
| Low Mids | 250-500 Hz | Muddiness zone |
| Mids | 500 Hz - 2 kHz | Body, presence |
| Upper Mids | 2-4 kHz | Clarity, attack |
| Presence | 4-6 kHz | Definition |
| Brilliance | 6-20 kHz | Air, sparkle |

### EQ Tips

- Cut narrow, boost wide
- Use your ears, not your eyes
- High-pass filter everything that does not need bass
- Less is often more',
'production', '["mixing","eq","audio"]', 1),

('info_compression', NULL, 'Compression Explained',
'## What is Compression?

Compression reduces the dynamic range of audio - making loud parts quieter and quiet parts louder.

### Key Parameters

| Parameter | What it Does |
|-----------|--------------|
| Threshold | Level where compression starts |
| Ratio | Amount of compression (4:1 = moderate) |
| Attack | How fast compression engages |
| Release | How fast compression stops |
| Makeup Gain | Compensates for volume loss |

### Common Uses

1. **Vocals**: Smooth out dynamics
2. **Drums**: Add punch (fast attack) or sustain (slow attack)
3. **Bass**: Consistent low end
4. **Mix Bus**: Glue everything together

### The 1176 Trick

All buttons in mode (all ratios engaged) creates aggressive, characterful compression.',
'production', '["mixing","compression","dynamics"]', 1),

('info_circle_fifths', NULL, 'Circle of Fifths Guide',
'## The Circle of Fifths

The Circle of Fifths is a visual representation of key relationships.

### How to Read It

- Moving clockwise: up a perfect 5th, add one sharp
- Moving counter-clockwise: up a perfect 4th, add one flat
- Inner ring shows relative minors

### Uses

1. **Key Signatures**: Know sharps/flats for any key
2. **Chord Progressions**: Adjacent keys sound good together
3. **Modulation**: Plan key changes
4. **Camelot Mixing**: Match keys for DJ mixing

### Quick Reference

| Key | Sharps/Flats |
|-----|--------------|
| C | None |
| G | 1 sharp (F#) |
| D | 2 sharps (F#, C#) |
| F | 1 flat (Bb) |
| Bb | 2 flats (Bb, Eb) |',
'theory', '["theory","keys","harmony"]', 1),

('info_sidechain', NULL, 'Sidechain Compression',
'## Sidechain Compression

Sidechain compression uses one audio signal to control the compression of another.

### Classic Example: Kick & Bass

The kick drum triggers compression on the bass, creating the "pumping" effect.

### Setup

1. Insert compressor on bass track
2. Set sidechain input to kick drum
3. Adjust threshold so kick triggers compression
4. Set fast attack, medium release
5. Adjust ratio to taste (4:1 to 10:1)

### Creative Uses

- **EDM Pump**: Sidechain pads/synths to kick
- **Vocal Clarity**: Duck music under vocals
- **Ducking**: Auto-lower music for voiceover
- **Ghost Kick**: Trigger from silent kick for rhythm',
'production', '["mixing","compression","techniques"]', 1),

('info_song_keys', NULL, 'Choosing Song Keys',
'## How to Choose a Key

The key affects the mood and playability of your song.

### Mood by Key

| Key Type | General Mood |
|----------|--------------|
| Major keys | Happy, bright, uplifting |
| Minor keys | Sad, dark, emotional |
| Flat keys | Warmer, darker |
| Sharp keys | Brighter, edgier |

### Practical Considerations

1. **Vocal Range**: Match the key to your singer
2. **Instrument Friendliness**: Guitar loves E, A, D, G
3. **Genre Conventions**: EDM often uses A minor, F minor
4. **Camelot**: Consider DJ mixing compatibility

### Popular Producer Keys

- **A minor** (8A): The "producer key" - works on everything
- **C major** (8B): All white keys, easy to play
- **F minor** (4A): Dark, emotional, popular in hip-hop',
'production', '["theory","keys","songwriting"]', 1);

-- ============================================================================
-- MORE DAW SHORTCUTS
-- ============================================================================

INSERT INTO daw_shortcuts (id, daw, category, action, shortcut_mac, shortcut_win, description, sort_order) VALUES
-- FL Studio
('fl_play', 'fl_studio', 'transport', 'Play/Pause', 'Space', 'Space', 'Toggle playback', 1),
('fl_record', 'fl_studio', 'transport', 'Record', 'R', 'R', 'Start recording', 2),
('fl_pattern', 'fl_studio', 'navigation', 'Pattern/Song Mode', 'L', 'L', 'Switch between pattern and song mode', 3),
('fl_piano', 'fl_studio', 'tools', 'Piano Roll', 'F7', 'F7', 'Open piano roll', 4),
('fl_mixer', 'fl_studio', 'tools', 'Mixer', 'F9', 'F9', 'Open mixer', 5),

-- Logic Pro
('logic_play', 'logic_pro', 'transport', 'Play/Stop', 'Space', 'Space', 'Toggle playback', 1),
('logic_record', 'logic_pro', 'transport', 'Record', 'R', 'R', 'Start recording', 2),
('logic_loop', 'logic_pro', 'edit', 'Loop Selection', 'L', 'L', 'Loop selected region', 3),
('logic_split', 'logic_pro', 'edit', 'Split at Playhead', 'Cmd+T', 'Ctrl+T', 'Split region at playhead', 4),
('logic_quantize', 'logic_pro', 'edit', 'Quantize', 'Q', 'Q', 'Quantize selected notes', 5),

-- Pro Tools
('pt_play', 'pro_tools', 'transport', 'Play/Stop', 'Space', 'Space', 'Toggle playback', 1),
('pt_record', 'pro_tools', 'transport', 'Record', 'Num 3', 'Num 3', 'Start recording', 2),
('pt_loop', 'pro_tools', 'transport', 'Loop Playback', 'Cmd+Shift+L', 'Ctrl+Shift+L', 'Toggle loop playback', 3),
('pt_separate', 'pro_tools', 'edit', 'Separate Clip', 'Cmd+E', 'Ctrl+E', 'Separate clip at selection', 4),
('pt_fade', 'pro_tools', 'edit', 'Create Fades', 'Cmd+F', 'Ctrl+F', 'Create fades on selection', 5);

-- ============================================================================
-- MORE GLOSSARY TERMS
-- ============================================================================

INSERT INTO glossary_terms (id, term, definition, category, related_terms) VALUES
('gloss_daw', 'DAW', 'Digital Audio Workstation - software for recording, editing, and producing audio', 'production', 'Ableton,Logic,FL Studio'),
('gloss_midi', 'MIDI', 'Musical Instrument Digital Interface - protocol for communicating musical information', 'production', 'controller,notes,velocity'),
('gloss_vst', 'VST', 'Virtual Studio Technology - plugin format for software instruments and effects', 'production', 'plugin,instrument,effect'),
('gloss_gain_staging', 'Gain Staging', 'Managing signal levels throughout the audio chain to prevent clipping and noise', 'mixing', 'headroom,clipping,levels'),
('gloss_headroom', 'Headroom', 'The amount of space between the audio level and 0dB (clipping point)', 'mixing', 'gain staging,mastering'),
('gloss_transient', 'Transient', 'The initial attack portion of a sound, especially percussive sounds', 'mixing', 'attack,compression'),
('gloss_wet_dry', 'Wet/Dry', 'The balance between processed (wet) and unprocessed (dry) signal', 'mixing', 'effects,reverb,delay'),
('gloss_automation', 'Automation', 'Recording parameter changes over time for dynamic mixing', 'mixing', 'volume,pan,effects'),
('gloss_stem', 'Stem', 'A submix of related tracks (e.g., all drums, all vocals)', 'mixing', 'bounce,export,mastering'),
('gloss_limiter', 'Limiter', 'A compressor with an infinite ratio that prevents signal from exceeding a threshold', 'mastering', 'compression,loudness');

-- ============================================================================
-- MORE QUESTS (Universal)
-- ============================================================================

INSERT INTO quests (id, user_id, title, description, category, difficulty, xp_reward, coin_reward, is_universal, is_active, status) VALUES
('quest_journal', NULL, 'Write a Journal Entry', 'Document your thoughts or learning', 'learning', 'starter', 15, 5, 1, 1, 'available'),
('quest_read_15', NULL, 'Read for 15 Minutes', 'Spend time with a book', 'learning', 'starter', 20, 10, 1, 1, 'available'),
('quest_stretch', NULL, 'Stretch Break', 'Take 5 minutes to stretch', 'fitness', 'starter', 10, 5, 1, 1, 'available'),
('quest_water', NULL, 'Hydrate', 'Drink a full glass of water', 'health', 'starter', 5, 2, 1, 1, 'available'),
('quest_tidy', NULL, 'Quick Tidy', 'Spend 5 minutes tidying your space', 'productivity', 'starter', 10, 5, 1, 1, 'available'),
('quest_learn_lesson', NULL, 'Complete a Lesson', 'Finish one learning lesson', 'learning', 'easy', 25, 12, 1, 1, 'available'),
('quest_practice_30', NULL, '30-Minute Practice', 'Practice your instrument or skill', 'learning', 'medium', 40, 20, 1, 1, 'available'),
('quest_workout', NULL, 'Complete a Workout', 'Finish a full workout session', 'fitness', 'medium', 50, 25, 1, 1, 'available');

-- ============================================================================
-- MORE IGNITION PACKS
-- ============================================================================

INSERT INTO ignition_packs (id, key, name, description, category, items_json, icon, sort_order) VALUES
('pack_learning', 'learning_start', 'Learning Starter', 'Begin your learning journey', 'learning',
'["Open one lesson in Learn","Complete an ear training drill","Read the glossary for 5 minutes","Try one production recipe","Write down one thing you learned"]',
'book', 5),

('pack_productivity', 'productivity_boost', 'Productivity Boost', 'Get into work mode', 'productivity',
'["Close all social media tabs","Set a 25-minute timer","Write down your main task","Clear your desk surface","Put on focus music or silence"]',
'zap', 6),

('pack_evening', 'evening_wind', 'Evening Wind-Down', 'Transition to rest mode', 'wellness',
'["Review what you accomplished today","Write three things you are grateful for","Set tomorrow main priority","Put devices away","Take 5 deep breaths"]',
'moon', 7),

('pack_stuck', 'when_stuck', 'When You Feel Stuck', 'Break through mental blocks', 'mindset',
'["Take a 5-minute walk","Change your environment","Work on something easy first","Talk to someone briefly","Write down what is blocking you"]',
'unlock', 8);

-- Update db_metadata
UPDATE db_metadata SET value = '101', updated_at = datetime('now') WHERE key = 'db_version';
UPDATE db_metadata SET value = '0101_additional_seed_data', updated_at = datetime('now') WHERE key = 'db_version_name';

