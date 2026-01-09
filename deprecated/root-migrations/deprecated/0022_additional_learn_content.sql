-- ============================================================================
-- IGNITION ADDITIONAL LEARN CONTENT
-- More lessons and drills for comprehensive music education
-- ============================================================================

-- ============================================================================
-- ADDITIONAL LESSONS - Scales & Modes
-- ============================================================================

INSERT OR IGNORE INTO learn_lessons (id, topic_id, title, description, content_markdown, order_index, estimated_minutes, quiz_json, xp_reward, coin_reward, skill_id, skill_star_reward) VALUES

('lesson_scales_major', 'topic_scales', 'The Major Scale', 'The foundation of Western music',
'# The Major Scale

The **major scale** is the most important scale in Western music. It has 7 notes and a specific pattern of whole and half steps.

## The Pattern

**W-W-H-W-W-W-H**

Where W = Whole step (2 semitones) and H = Half step (1 semitone)

## C Major Scale

Starting from C (the easiest key - no sharps or flats):

C - D - E - F - G - A - B - C

## Building Major Scales

You can build a major scale from any note by following the W-W-H-W-W-W-H pattern:

- **G Major**: G - A - B - C - D - E - F# - G
- **D Major**: D - E - F# - G - A - B - C# - D
- **F Major**: F - G - A - Bb - C - D - E - F

## Practice Tip

Play the C major scale slowly on a keyboard or in your DAW. Listen to how each note relates to the tonic (C).',
1, 4,
'[{"q":"What is the pattern for a major scale?","options":["W-W-H-W-W-W-H","W-H-W-W-H-W-W","H-W-W-H-W-W-W","W-W-W-H-W-W-H"],"answer":0},{"q":"How many notes are in a major scale?","options":["5","6","7","8"],"answer":2}]',
20, 8, 'skill_theory', 2),

('lesson_scales_minor', 'topic_scales', 'The Minor Scales', 'Natural, harmonic, and melodic minor',
'# The Minor Scales

Minor scales have a different emotional quality - often described as sad, dark, or introspective.

## Natural Minor

The **natural minor** scale follows this pattern:

**W-H-W-W-H-W-W**

### A Natural Minor

A - B - C - D - E - F - G - A

Notice: A natural minor has no sharps or flats, just like C major. They are **relative** to each other.

## Harmonic Minor

Raise the 7th degree of natural minor by a half step:

A - B - C - D - E - F - G# - A

This creates a strong pull back to the tonic, used in classical and metal music.

## Melodic Minor

Raise both the 6th and 7th when ascending, natural minor when descending:

**Ascending**: A - B - C - D - E - F# - G# - A
**Descending**: A - G - F - E - D - C - B - A

## Relative Major/Minor

Every major scale has a relative minor (and vice versa):
- C major <-> A minor
- G major <-> E minor
- D major <-> B minor',
2, 5,
'[{"q":"What is the pattern for natural minor?","options":["W-W-H-W-W-W-H","W-H-W-W-H-W-W","H-W-W-H-W-W-W","W-W-W-H-W-W-H"],"answer":1},{"q":"Which scale raises the 7th degree?","options":["Natural minor","Melodic minor","Harmonic minor","Pentatonic minor"],"answer":2}]',
20, 8, 'skill_theory', 2),

('lesson_scales_modes', 'topic_scales', 'Introduction to Modes', 'Seven flavors of the major scale',
'# Introduction to Modes

**Modes** are scales derived from the major scale by starting on different degrees.

## The Seven Modes

Starting from C major:

1. **Ionian** (starts on 1st) - C D E F G A B - The major scale
2. **Dorian** (starts on 2nd) - D E F G A B C - Minor with raised 6th
3. **Phrygian** (starts on 3rd) - E F G A B C D - Minor with flat 2nd
4. **Lydian** (starts on 4th) - F G A B C D E - Major with raised 4th
5. **Mixolydian** (starts on 5th) - G A B C D E F - Major with flat 7th
6. **Aeolian** (starts on 6th) - A B C D E F G - Natural minor
7. **Locrian** (starts on 7th) - B C D E F G A - Diminished, rarely used

## Character of Each Mode

- **Dorian**: Jazzy minor (Think "So What" by Miles Davis)
- **Phrygian**: Spanish/flamenco feel
- **Lydian**: Dreamy, floating (Think film scores)
- **Mixolydian**: Bluesy major (Rock and blues)

## How to Use Modes

The easiest approach: think of the parent major scale.
- Want D Dorian? Think C major starting on D.
- Want G Mixolydian? Think C major starting on G.',
3, 5,
'[{"q":"Which mode is the natural minor scale?","options":["Dorian","Phrygian","Aeolian","Locrian"],"answer":2},{"q":"Which mode has a raised 4th?","options":["Ionian","Lydian","Mixolydian","Dorian"],"answer":1}]',
25, 10, 'skill_theory', 3);

-- ============================================================================
-- ADDITIONAL LESSONS - Chords
-- ============================================================================

INSERT OR IGNORE INTO learn_lessons (id, topic_id, title, description, content_markdown, order_index, estimated_minutes, quiz_json, xp_reward, coin_reward, skill_id, skill_star_reward) VALUES

('lesson_chords_triads', 'topic_chords', 'Building Triads', 'Major, minor, diminished, augmented',
'# Building Triads

A **triad** is a three-note chord built by stacking thirds.

## The Four Triad Types

| Type | Formula | Sound |
|------|---------|-------|
| Major | 1 - 3 - 5 | Happy, stable |
| Minor | 1 - b3 - 5 | Sad, introspective |
| Diminished | 1 - b3 - b5 | Tense, unstable |
| Augmented | 1 - 3 - #5 | Mysterious, unresolved |

## In Half-Steps

- **Major**: Root + 4 + 3 (C-E-G)
- **Minor**: Root + 3 + 4 (C-Eb-G)
- **Diminished**: Root + 3 + 3 (C-Eb-Gb)
- **Augmented**: Root + 4 + 4 (C-E-G#)

## Practice Building Triads

1. Pick a root note
2. Count up the half-steps
3. Play all three notes together

Try building C major, A minor, B diminished, and F augmented.',
1, 4,
'[{"q":"What intervals make a major triad?","options":["1-3-5","1-b3-5","1-3-#5","1-b3-b5"],"answer":0},{"q":"What quality is a 1-b3-b5 chord?","options":["Major","Minor","Diminished","Augmented"],"answer":2}]',
20, 8, 'skill_theory', 2),

('lesson_chords_7ths', 'topic_chords', 'Seventh Chords', 'Adding color with the 7th',
'# Seventh Chords

Seventh chords add a fourth note - the 7th degree - for richer harmony.

## Common Seventh Chords

| Name | Formula | Example |
|------|---------|---------|
| Major 7th | 1 - 3 - 5 - 7 | Cmaj7: C-E-G-B |
| Dominant 7th | 1 - 3 - 5 - b7 | C7: C-E-G-Bb |
| Minor 7th | 1 - b3 - 5 - b7 | Cm7: C-Eb-G-Bb |
| Half-Dim 7th | 1 - b3 - b5 - b7 | Cm7b5: C-Eb-Gb-Bb |
| Diminished 7th | 1 - b3 - b5 - bb7 | Cdim7: C-Eb-Gb-A |

## Sound Character

- **Major 7th**: Smooth, jazzy, sophisticated
- **Dominant 7th**: Bluesy, wants to resolve
- **Minor 7th**: Mellow, melancholic
- **Half-Diminished**: Yearning, unstable
- **Diminished 7th**: Very tense, dramatic

## In Practice

In a major key, the naturally occurring 7th chords are:
- I: Major 7th
- ii: Minor 7th
- iii: Minor 7th
- IV: Major 7th
- V: Dominant 7th
- vi: Minor 7th
- vii: Half-diminished 7th',
2, 5,
'[{"q":"What is the formula for a dominant 7th chord?","options":["1-3-5-7","1-3-5-b7","1-b3-5-b7","1-b3-b5-b7"],"answer":1},{"q":"Which 7th chord is built on the V degree?","options":["Major 7th","Dominant 7th","Minor 7th","Diminished 7th"],"answer":1}]',
25, 10, 'skill_theory', 2);

-- ============================================================================
-- ADDITIONAL LESSONS - Circle of Fifths
-- ============================================================================

INSERT OR IGNORE INTO learn_lessons (id, topic_id, title, description, content_markdown, order_index, estimated_minutes, quiz_json, xp_reward, coin_reward, skill_id, skill_star_reward) VALUES

('lesson_circle_basics', 'topic_circle', 'Understanding the Circle', 'The map of all keys',
'# The Circle of Fifths

The **Circle of Fifths** is a visual representation of how all 12 keys relate to each other.

## How It Works

- Moving **clockwise** adds a sharp
- Moving **counter-clockwise** adds a flat
- **Adjacent keys** are closely related (easy transitions)

## The Outer Ring (Major Keys)

Starting from C (no sharps/flats):
- C -> G -> D -> A -> E -> B -> F# (adding sharps)
- C -> F -> Bb -> Eb -> Ab -> Db -> Gb (adding flats)

## The Inner Ring (Minor Keys)

Each major key has a relative minor:
- A minor (relative to C major)
- E minor (relative to G major)
- D minor (relative to F major)

## DJ Mixing (Camelot Wheel)

DJs use a simplified version called the **Camelot Wheel**:
- Same number = same key signature
- A = minor, B = major
- Adjacent numbers mix well

Example: 8A (Am) mixes well with 7A, 9A, or 8B.',
1, 4,
'[{"q":"Moving clockwise on the Circle of Fifths...","options":["Adds a flat","Adds a sharp","Stays the same","Removes a sharp"],"answer":1},{"q":"What is the relative minor of C major?","options":["E minor","D minor","A minor","G minor"],"answer":2}]',
20, 8, 'skill_theory', 2);

-- ============================================================================
-- ADDITIONAL DRILLS
-- ============================================================================

INSERT OR IGNORE INTO learn_drills (id, topic_id, name, description, drill_type, difficulty, config_json, initial_interval_hours) VALUES

-- More interval drills
('drill_intervals_compound', 'topic_ear_intervals', 'Compound Intervals', 'Intervals beyond an octave', 'interval', 'advanced',
'{"intervals":["minor9th","major9th","minor10th","major10th"],"ascending":true,"descending":true,"count":10}', 48),

('drill_intervals_speed', 'topic_ear_intervals', 'Speed Intervals', 'Quick recognition challenge', 'interval', 'intermediate',
'{"intervals":["minor2nd","major2nd","minor3rd","major3rd","perfect4th","perfect5th","minor6th","major6th","minor7th","major7th"],"ascending":true,"timeLimit":3,"count":20}', 24),

-- More chord drills
('drill_chords_7ths', 'topic_ear_chords', 'Seventh Chords', 'Major 7, Minor 7, Dom 7', 'chord', 'intermediate',
'{"chordTypes":["major7","minor7","dominant7"],"rootNotes":["C","D","E","F","G","A","B"],"count":10}', 24),

('drill_chords_extended', 'topic_ear_chords', 'Extended Chords', '9ths, 11ths, and 13ths', 'chord', 'advanced',
'{"chordTypes":["major9","minor9","dominant9","major11","minor11"],"count":10}', 48),

-- Scale drills
('drill_scales_major', 'topic_ear_scales', 'Major Scale Recognition', 'Identify major scales', 'scale', 'beginner',
'{"scaleTypes":["major"],"rootNotes":["C","D","E","F","G","A","B"],"count":8}', 24),

('drill_scales_minor', 'topic_ear_scales', 'Minor Scale Recognition', 'Natural, harmonic, melodic', 'scale', 'intermediate',
'{"scaleTypes":["natural_minor","harmonic_minor","melodic_minor"],"rootNotes":["A","D","E"],"count":10}', 24),

('drill_scales_modes', 'topic_ear_scales', 'Mode Recognition', 'Dorian, Phrygian, Lydian, Mixolydian', 'scale', 'advanced',
'{"scaleTypes":["dorian","phrygian","lydian","mixolydian"],"count":12}', 48),

-- Rhythm drills
('drill_rhythm_subdivisions', 'topic_ear_rhythm', 'Rhythm Subdivisions', 'Quarter, eighth, sixteenth', 'rhythm', 'beginner',
'{"subdivisions":["quarter","eighth","sixteenth"],"timeSignature":"4/4","bars":2,"count":8}', 24),

('drill_rhythm_syncopation', 'topic_ear_rhythm', 'Syncopation Patterns', 'Off-beat accents', 'rhythm', 'intermediate',
'{"patterns":["offbeat","anticipated","delayed"],"timeSignature":"4/4","count":10}', 24),

-- Melody drills
('drill_melody_short', 'topic_ear_melody', 'Short Melody Recall', '4-note patterns', 'melody', 'beginner',
'{"length":4,"range":"octave","stepwise":true,"count":8}', 24),

('drill_melody_long', 'topic_ear_melody', 'Longer Melody Recall', '8-note patterns', 'melody', 'intermediate',
'{"length":8,"range":"tenth","stepwise":false,"count":6}', 48);

-- ============================================================================
-- ADDITIONAL IGNITION PACKS
-- ============================================================================

INSERT OR IGNORE INTO ignition_packs (id, name, description, category, items_json, is_active) VALUES

('pack_creative', 'Creative Spark', 'Ignitions for getting creative juices flowing', 'creativity',
'[{"title":"Open a blank project","action":"Just open your DAW and stare at it for 30 seconds"},{"title":"Set a 10-minute timer","action":"Make any sound. Any sound at all."},{"title":"Copy a beat","action":"Pick a song, recreate the first 4 bars"},{"title":"Sound design one shot","action":"Create one interesting sound from scratch"}]', 1),

('pack_learning', 'Learning Mode', 'Ignitions for skill building', 'learning',
'[{"title":"Watch one tutorial","action":"Pick a 5-10 minute tutorial on any topic"},{"title":"Read one article","action":"Find and read something about your craft"},{"title":"Practice one technique","action":"Spend 5 minutes on a specific skill"},{"title":"Take notes","action":"Document one thing you learned recently"}]', 1),

('pack_organization', 'Quick Organize', 'Ignitions for tidying up', 'organization',
'[{"title":"Name 5 files","action":"Go through your downloads and name things properly"},{"title":"Delete 3 things","action":"Remove projects or files you will never touch again"},{"title":"Back up one project","action":"Copy one important project to a safe place"},{"title":"Organize one folder","action":"Sort files in one messy folder"}]', 1);

