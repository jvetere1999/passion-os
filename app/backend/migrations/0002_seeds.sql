-- GENERATED SEEDS FROM schema.json v2.0.0
-- Generated: 2026-01-10
--
-- Seed data for Passion OS. Run after schema migration.

-- ============================================================
-- WORKOUTS (8 records)
-- ============================================================
INSERT INTO workouts (id, created_at, updated_at, name, description, user_id, estimated_duration, is_template)
VALUES
    (gen_random_uuid(), NOW(), NOW(), 'Mobility: Posture Reset (APT + Upper Back)', 'Mobility routine targeting anterior pelvic tilt patterns and upper back/pec stiffness. Seeded from your posture table.', '00000000-0000-0000-0000-000000000000', 15, true),
    (gen_random_uuid(), NOW(), NOW(), 'Mobility: Generic Flexibility + Tension Reduction', 'General mobility routine focused on usable range, reduced baseline tension, and breath-linked control (high transfer to movement/social comfort).', '00000000-0000-0000-0000-000000000000', 15, true),
    (gen_random_uuid(), NOW(), NOW(), 'Mobility: Face + Expressiveness (Low-Tension Control)', 'Face/jaw/neck mobility + expressiveness drills aimed at reducing bracing and improving controlled facial range. Avoid pain/clicking; keep pressure gentle.', '00000000-0000-0000-0000-000000000000', 10, true),
    (gen_random_uuid(), NOW(), NOW(), 'Strength: Upper', 'Upper body routine seeded from your table.', '00000000-0000-0000-0000-000000000000', 60, true),
    (gen_random_uuid(), NOW(), NOW(), 'Strength: Lower', 'Lower body routine seeded from your table.', '00000000-0000-0000-0000-000000000000', 60, true),
    (gen_random_uuid(), NOW(), NOW(), 'Strength: Push', 'Push routine seeded from your table.', '00000000-0000-0000-0000-000000000000', 60, true),
    (gen_random_uuid(), NOW(), NOW(), 'Strength: Pull', 'Pull routine seeded from your table.', '00000000-0000-0000-0000-000000000000', 60, true),
    (gen_random_uuid(), NOW(), NOW(), 'Strength: Legs', 'Legs routine seeded from your table.', '00000000-0000-0000-0000-000000000000', 60, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- WORKOUT_SECTIONS (25 records)
-- ============================================================
INSERT INTO workout_sections (id, workout_id, name, sort_order)
VALUES
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', 'Warm-up', 1),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', 'Anterior pelvic tilt – mobility', 2),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', 'Upper back hump – mobility', 3),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', 'Integration and awareness', 4),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Warm-up', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Hips', 2),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Hamstrings', 3),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Calves', 4),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Thoracic', 5),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Shoulders', 6),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Chest', 7),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Spine', 8),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', 'Integration', 9),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Warm-up', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Jaw/TMJ', 2),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Neck/Throat', 3),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Lips/Cheeks', 4),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Eyes/Brow', 5),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Tongue', 6),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', 'Integration', 7),
    (gen_random_uuid(), '4e11e60e-fd51-5526-bc2a-9e598413f83b', 'Main', 1),
    (gen_random_uuid(), 'adb82dc0-9749-5a9c-bc67-7d1b1a2f3b70', 'Main', 1),
    (gen_random_uuid(), 'bab1bb00-1efa-518d-a143-49e16e549d5a', 'Main', 1),
    (gen_random_uuid(), '721970e3-10b7-5ca3-a616-bcc9e45c4bf5', 'Main', 1),
    (gen_random_uuid(), 'eb26b639-0b6d-5fec-97dd-a38d2ab88e86', 'Main', 1)
;

-- ============================================================
-- WORKOUT_EXERCISES (54 records)
-- ============================================================
INSERT INTO workout_exercises (id, workout_id, section_id, exercise_id, sets, reps, duration, rest_seconds, notes, sort_order)
VALUES
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, '8fb09ab5-fd67-51d8-822a-ba4447663fc3', 2, '10 slow cycles', NULL, 0, 'Core_star=Yes; Sets_raw=1–2; Key cues: Start neutral; gently round then extend; move with slow breathing.', 1),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, 'e49f4035-1a33-5cc8-80df-8197a6dcd71a', 3, '30–45 sec hold (per side)', 45, 0, 'Core_star=Yes; Sets_raw=2–3 per side; Key cues: Posteriorly tilt pelvis; squeeze glute on back leg; do not arch low back.', 1),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, '1c73cb5e-4b90-5b91-8182-870ef552593a', 2, '30 sec hold (per side)', 30, 0, 'Core_star=No; Sets_raw=2 per side; Key cues: Keep pelvis lightly tucked; bring heel toward glute; avoid pulling low back into arch.', 2),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, '3abf172b-0a99-5b01-885d-0b310613b295', 2, '30–45 sec hold (per side)', 45, 0, 'Core_star=No; Sets_raw=2 per side; Key cues: Lie on back; keep opposite leg straight on floor; raise leg until stretch not pain.', 3),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, '80c1edac-ebb7-5dcf-a674-80442f76a31a', 3, '20–30 sec hold', 30, 0, 'Core_star=No; Sets_raw=3; Key cues: Sit hips toward heels; gently round low back; relax shoulders.', 4),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, 'cb90f766-5a4d-5619-b06e-525ff6f77fcd', 1, '10 reps (per side)', NULL, 0, 'Core_star=No; Sets_raw=1 per side; Key cues: Slide arm under; rotate upper back; smooth and pain free.', 1),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, '9b088e77-c722-541f-b659-858095b407d7', 1, '10–15 reps', NULL, 0, 'Core_star=Yes; Sets_raw=1; Key cues: Roller across upper back; support head; gently extend over roller then return.', 2),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, 'e8fea4b5-bf67-58e4-a9be-a183715820b7', 3, '30 sec hold', 30, 0, 'Core_star=Yes; Sets_raw=3; Key cues: Elbows ~shoulder height; step through; avoid shoulder pain.', 3),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, 'ad14636d-2142-5a0f-8288-77c1ef8cfc9d', 1, '15–20 reps', NULL, 0, 'Core_star=No; Sets_raw=1; Key cues: Flatten low back then arch slightly; find neutral middle.', 1),
    (gen_random_uuid(), 'b0574d2c-a0a8-55f1-a40d-f5959b162867', NULL, 'a04b7dc5-4b64-574e-986f-a929edd6745d', 2, '30–45 sec hold', 45, 0, 'Core_star=No; Sets_raw=2; Key cues: Butt + mid back on wall; ribs down; light posterior pelvic tilt.', 2),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, 'd69c6675-2e27-527b-a326-c109c5d29491', 1, '60–90 sec total', 90, 0, 'Core_star=Yes; Key cues: Slow circles; pain-free; breathe normally.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '760d85b4-ba79-589a-bd92-17b10c0f1ff2', 2, '4–6 reps/side', NULL, 0, 'Core_star=Yes; Sets_raw=1–2 per side; Key cues: Long exhale in bottom; rotate from upper back.', 2),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '2489e7d0-8bee-5335-a28f-a4b0b5e2e3a5', 2, '6–10 reps', NULL, 0, 'Core_star=Yes; Key cues: Slow; stay tall; don''t force knee down.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, 'e9065e87-96ad-5eed-ba8b-a9df8ae454e9', 2, '30–60 sec hold (per side)', 60, 0, 'Core_star=No; Key cues: Hips square; ease off if knee pain.', 2),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, 'cff1ae38-efcb-55bb-a0b7-fd15b667eb9e', 2, '10 reps + 20 sec hold (per side)', 20, 0, 'Core_star=Yes; Key cues: Gentle extend/bend; avoid nerve pain.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '9a6d9a13-6270-5187-b949-4d6239d1ff8e', 2, '30 sec straight knee + 30 sec bent knee (per side)', 60, 0, 'Core_star=No; Key cues: Heel down; don''t collapse arch.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '70aee225-d593-537e-b4bc-8bef42369550', 1, '8–10 reps (per side)', NULL, 0, 'Core_star=Yes; Key cues: Exhale as you open; knees stacked.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '8e92ea1e-7040-5707-ab98-e9a77ab97cf5', 2, '8–12 reps', NULL, 0, 'Core_star=Yes; Key cues: Ribs down; forearms on wall; slow.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '94f53fc0-988a-5a4f-8a6a-02e8b5266bcd', 4, '30 sec hold (2 angles, 2 per angle)', 30, 0, 'Core_star=No; Key cues: Gentle step-through; avoid shoulder pain.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '63d1402d-bcac-5d37-8cc3-de9d711d0142', 2, '20–30 sec hold (per side)', 30, 0, 'Core_star=No; Key cues: Reach long; breathe into side ribs.', 1),
    (gen_random_uuid(), '0b9b7401-741a-5274-9a59-85d3b35066b8', NULL, '697cf84d-d150-5797-8140-f7187b708290', 1, '2–4 minutes', 240, 0, 'Core_star=Yes; Key cues: Long exhale; jaw unclenched; shoulders heavy.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, 'bc0f7386-bd97-590b-8c18-32dab44ae04e', 1, '60–90 sec', 90, 0, 'Core_star=Yes; Key cues: Lips closed; tongue on palate; jaw hangs.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, '15d28647-b0ba-5b48-b07d-36a3601bba1a', 2, '30–60 sec/side', 60, 0, 'Core_star=Yes; Key cues: Light pressure; stop if sharp pain.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, '0a2356a1-7a52-5314-8453-88099d225c81', 2, '6–10 reps', NULL, 0, 'Core_star=Yes; Key cues: Slow; track straight; no clicking.', 2),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, 'c39d757d-6184-5e65-b783-ffad12be6e20', 2, '6–10 reps', NULL, 0, 'Core_star=Yes; Key cues: Glide back; throat relaxed; breathe.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, 'd887df1b-f0d3-549b-ac8e-b3e7bca7da73', 2, '8–12 reps', NULL, 0, 'Core_star=Yes; Key cues: Slow smile to ~70%; relax fully to neutral.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, '3c96b0d1-ba8f-575e-a1d9-67ab9662fa9e', 2, '6–10 reps', NULL, 0, 'Core_star=No; Key cues: Raise brows then slight squint; relax fully.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, '5c996de9-dd4d-5692-95a8-b567176ba57c', 1, '60 sec', 60, 0, 'Core_star=No; Key cues: Tongue on palate; jaw relaxed; nasal breathe; do not force.', 1),
    (gen_random_uuid(), '64a038ec-19cf-568e-8322-8b003405d693', NULL, '59dee733-0cdf-5f13-8b1a-007cffb77e17', 1, '3 rounds', NULL, 0, 'Core_star=Yes; Key cues: Same sentence; change expression only; keep jaw loose.', 1),
    (gen_random_uuid(), '4e11e60e-fd51-5526-bc2a-9e598413f83b', NULL, '483863f8-c2e7-5e72-a4b7-670bbc363ca7', 3, '5-10', NULL, NULL, 'Equipment=Cable; Or more if you can.', 1),
    (gen_random_uuid(), '4e11e60e-fd51-5526-bc2a-9e598413f83b', NULL, '63e59dde-56c3-53e0-98f3-394f03688fd1', 3, '8-10', NULL, NULL, 'Equipment=Dumbbell', 2),
    (gen_random_uuid(), '4e11e60e-fd51-5526-bc2a-9e598413f83b', NULL, '4e49b255-b483-56fc-a786-f3662c4ef157', 3, '10-15', NULL, NULL, 'Equipment=Cable', 3),
    (gen_random_uuid(), '4e11e60e-fd51-5526-bc2a-9e598413f83b', NULL, '107a1fe0-bfcb-587e-a59c-0acc8d52a6a4', 3, '10-12', NULL, NULL, 'Equipment=Machine', 4),
    (gen_random_uuid(), '4e11e60e-fd51-5526-bc2a-9e598413f83b', NULL, 'c4848a64-2709-5e3f-8d3e-c03892e5b9a6', 4, '10-15', NULL, NULL, 'Equipment=Free; Or more; train close to failure.', 5),
    (gen_random_uuid(), 'adb82dc0-9749-5a9c-bc67-7d1b1a2f3b70', NULL, 'e8024b3d-d51d-513a-82cd-739b21afda9a', 3, '8-12', NULL, NULL, 'Equipment=Machine', 1),
    (gen_random_uuid(), 'adb82dc0-9749-5a9c-bc67-7d1b1a2f3b70', NULL, '6c9f0474-9d2b-5f69-8cb7-55b166b875f2', 3, '8-10', NULL, NULL, 'Equipment=Barbell', 2),
    (gen_random_uuid(), 'adb82dc0-9749-5a9c-bc67-7d1b1a2f3b70', NULL, 'f7424078-d61b-5edc-9421-617a4b92c1d3', 3, '12-15', NULL, NULL, 'Equipment=Machine', 3),
    (gen_random_uuid(), 'adb82dc0-9749-5a9c-bc67-7d1b1a2f3b70', NULL, '7d43270c-84e1-5989-bdc0-1baf3a96067e', 4, '12-20', NULL, NULL, 'Equipment=Machine', 4),
    (gen_random_uuid(), 'adb82dc0-9749-5a9c-bc67-7d1b1a2f3b70', NULL, 'c0e776e1-497d-5c83-bbf8-d84c42109ae4', 4, '12-15', NULL, NULL, 'Equipment=Cable', 5),
    (gen_random_uuid(), 'bab1bb00-1efa-518d-a143-49e16e549d5a', NULL, 'e6047f7e-d006-583c-8998-c64699ae5857', 3, '6-10', NULL, NULL, 'Equipment=Barbell', 1),
    (gen_random_uuid(), 'bab1bb00-1efa-518d-a143-49e16e549d5a', NULL, 'e418ca23-453d-5c3b-bc41-6341be06f07a', 3, '10-12', NULL, NULL, 'Equipment=Dumbbell', 2),
    (gen_random_uuid(), 'bab1bb00-1efa-518d-a143-49e16e549d5a', NULL, 'c308cb65-a8a2-5b7d-8fd7-30ff300cf81d', 3, '12-15', NULL, NULL, 'Equipment=Cable', 3),
    (gen_random_uuid(), 'bab1bb00-1efa-518d-a143-49e16e549d5a', NULL, 'fcfe9969-9126-57d7-9e03-5df9feee523b', 3, '12-15', NULL, NULL, 'Equipment=Dumbbell', 4),
    (gen_random_uuid(), 'bab1bb00-1efa-518d-a143-49e16e549d5a', NULL, '6d922f76-b731-5866-9b0b-330126d9d05a', 3, '12-15', NULL, NULL, 'Equipment=Cable', 5),
    (gen_random_uuid(), '721970e3-10b7-5ca3-a616-bcc9e45c4bf5', NULL, '066dfb37-10a0-5f4f-917e-b6a0714a566c', 3, '6-10', NULL, NULL, 'Equipment=Barbell', 1),
    (gen_random_uuid(), '721970e3-10b7-5ca3-a616-bcc9e45c4bf5', NULL, '483863f8-c2e7-5e72-a4b7-670bbc363ca7', 3, '8-12', NULL, NULL, 'Equipment=Cable', 2),
    (gen_random_uuid(), '721970e3-10b7-5ca3-a616-bcc9e45c4bf5', NULL, '1425bc62-6ad4-5e6b-ae4f-81c5d6c93221', 3, '12-15', NULL, NULL, 'Equipment=Dumbbell', 3),
    (gen_random_uuid(), '721970e3-10b7-5ca3-a616-bcc9e45c4bf5', NULL, '5650e623-d5e1-549b-be4f-d0d1fa12aa29', 3, '12-15', NULL, NULL, 'Equipment=Dumbbell', 4),
    (gen_random_uuid(), '721970e3-10b7-5ca3-a616-bcc9e45c4bf5', NULL, '090d5c55-b3fe-5d5f-9e03-df185e7eba53', 3, '15-25', NULL, NULL, 'Equipment=Cable', 5),
    (gen_random_uuid(), 'eb26b639-0b6d-5fec-97dd-a38d2ab88e86', NULL, '874f90e7-341a-5b9a-a7c8-ae7786b023fd', 3, '6-10', NULL, NULL, 'Equipment=Barbell', 1),
    (gen_random_uuid(), 'eb26b639-0b6d-5fec-97dd-a38d2ab88e86', NULL, '397afbb3-0921-5ca6-9d4b-26e4cdcdddb1', 3, '8-12', NULL, NULL, 'Equipment=Bodyweight/Machine', 2),
    (gen_random_uuid(), 'eb26b639-0b6d-5fec-97dd-a38d2ab88e86', NULL, '021cfde0-e613-5982-a0b8-278657da0a0e', 3, '10-15', NULL, NULL, 'Equipment=Dumbbell; Per side.', 3),
    (gen_random_uuid(), 'eb26b639-0b6d-5fec-97dd-a38d2ab88e86', NULL, '80dc4cf1-1d96-5d58-9f66-c8cd723e6f28', 3, '12-15', NULL, NULL, 'Equipment=Machine', 4),
    (gen_random_uuid(), 'eb26b639-0b6d-5fec-97dd-a38d2ab88e86', NULL, '651f090f-0d3f-52fd-8929-cd6e014377c9', 3, '8-12', NULL, NULL, 'Equipment=Smith Machine', 5)
;

-- ============================================================
-- SKILL_DEFINITIONS (6 records)
-- ============================================================
INSERT INTO skill_definitions (id, created_at, key, name, description, category, icon, max_level, stars_per_level, sort_order)
VALUES
    (gen_random_uuid(), NOW(), 'focus', 'Focus', 'Your ability to concentrate and complete deep work sessions', 'mental', 'brain', 100, 10, 1),
    (gen_random_uuid(), NOW(), 'discipline', 'Discipline', 'Consistency in maintaining habits and routines', 'mental', 'target', 100, 10, 2),
    (gen_random_uuid(), NOW(), 'strength', 'Strength', 'Physical power and resistance training progress', 'physical', 'dumbbell', 100, 10, 3),
    (gen_random_uuid(), NOW(), 'endurance', 'Endurance', 'Cardiovascular fitness and stamina', 'physical', 'heart', 100, 10, 4),
    (gen_random_uuid(), NOW(), 'creativity', 'Creativity', 'Artistic expression and creative problem solving', 'creative', 'palette', 100, 10, 5),
    (gen_random_uuid(), NOW(), 'knowledge', 'Knowledge', 'Learning and intellectual growth', 'mental', 'book', 100, 10, 6)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ACHIEVEMENT_DEFINITIONS (15 records)
-- ============================================================
INSERT INTO achievement_definitions (id, created_at, key, name, description, category, icon, trigger_type, trigger_config, reward_coins, reward_xp, is_hidden, sort_order)
VALUES
    (gen_random_uuid(), NOW(), 'first_focus', 'First Focus', 'Complete your first focus session', 'focus', 'zap', 'event', '{"event": "focus_complete", "count": 1}', 10, 25, false, 1),
    (gen_random_uuid(), NOW(), 'focus_10', 'Focus Beginner', 'Complete 10 focus sessions', 'focus', 'zap', 'threshold', '{"event": "focus_complete", "count": 10}', 25, 100, false, 2),
    (gen_random_uuid(), NOW(), 'focus_100', 'Focus Master', 'Complete 100 focus sessions', 'focus', 'crown', 'threshold', '{"event": "focus_complete", "count": 100}', 100, 500, false, 3),
    (gen_random_uuid(), NOW(), 'deep_work', 'Deep Worker', 'Complete a 60+ minute focus session', 'focus', 'clock', 'event', '{"event": "focus_complete", "min_duration": 3600}', 50, 100, false, 4),
    (gen_random_uuid(), NOW(), 'streak_3', 'Getting Started', 'Maintain a 3-day streak', 'streak', 'flame', 'threshold', '{"streak_type": "daily", "count": 3}', 15, 50, false, 10),
    (gen_random_uuid(), NOW(), 'streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'streak', 'flame', 'threshold', '{"streak_type": "daily", "count": 7}', 35, 150, false, 11),
    (gen_random_uuid(), NOW(), 'streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'streak', 'fire', 'threshold', '{"streak_type": "daily", "count": 30}', 150, 500, false, 12),
    (gen_random_uuid(), NOW(), 'streak_100', 'Legendary Streak', 'Maintain a 100-day streak', 'streak', 'trophy', 'threshold', '{"streak_type": "daily", "count": 100}', 500, 2000, true, 13),
    (gen_random_uuid(), NOW(), 'first_habit', 'Habit Formed', 'Complete a habit for the first time', 'habit', 'check', 'event', '{"event": "habit_complete", "count": 1}', 10, 25, false, 20),
    (gen_random_uuid(), NOW(), 'habit_streak_7', 'Habit Builder', 'Complete a habit 7 days in a row', 'habit', 'repeat', 'threshold', '{"event": "habit_streak", "count": 7}', 50, 150, false, 21),
    (gen_random_uuid(), NOW(), 'first_book', 'Bookworm', 'Finish your first book', 'reading', 'book', 'event', '{"event": "book_complete", "count": 1}', 50, 200, false, 30),
    (gen_random_uuid(), NOW(), 'books_10', 'Library Builder', 'Finish 10 books', 'reading', 'library', 'threshold', '{"event": "book_complete", "count": 10}', 200, 1000, false, 31),
    (gen_random_uuid(), NOW(), 'first_workout', 'Gym Rat', 'Complete your first workout', 'fitness', 'dumbbell', 'event', '{"event": "workout_complete", "count": 1}', 25, 50, false, 40),
    (gen_random_uuid(), NOW(), 'first_pr', 'Personal Best', 'Set your first personal record', 'fitness', 'medal', 'event', '{"event": "personal_record", "count": 1}', 50, 100, false, 41),
    (gen_random_uuid(), NOW(), 'first_lesson', 'Student', 'Complete your first lesson', 'learning', 'graduation', 'event', '{"event": "lesson_complete", "count": 1}', 15, 50, false, 50)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROLES (5 records)
-- ============================================================
INSERT INTO roles (id, created_at, name, description, parent_role_id)
VALUES
    (gen_random_uuid(), NOW(), 'user', 'Standard user with basic access', NULL),
    (gen_random_uuid(), NOW(), 'premium', 'Premium user with additional features', NULL),
    (gen_random_uuid(), NOW(), 'moderator', 'Community moderator', NULL),
    (gen_random_uuid(), NOW(), 'admin', 'Full administrative access', NULL),
    (gen_random_uuid(), NOW(), 'super_admin', 'Super administrator with all permissions', NULL)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ENTITLEMENTS (13 records)
-- ============================================================
INSERT INTO entitlements (id, created_at, name, description, resource, action)
VALUES
    (gen_random_uuid(), NOW(), 'users:read', 'View user profiles', 'users', 'read'),
    (gen_random_uuid(), NOW(), 'users:update', 'Update user profiles', 'users', 'update'),
    (gen_random_uuid(), NOW(), 'users:delete', 'Delete users', 'users', 'delete'),
    (gen_random_uuid(), NOW(), 'users:manage', 'Full user management', 'users', 'manage'),
    (gen_random_uuid(), NOW(), 'content:create', 'Create content', 'content', 'create'),
    (gen_random_uuid(), NOW(), 'content:update', 'Update content', 'content', 'update'),
    (gen_random_uuid(), NOW(), 'content:delete', 'Delete content', 'content', 'delete'),
    (gen_random_uuid(), NOW(), 'content:moderate', 'Moderate user content', 'content', 'moderate'),
    (gen_random_uuid(), NOW(), 'market:manage', 'Manage shop items', 'market', 'manage'),
    (gen_random_uuid(), NOW(), 'market:create_items', 'Create new shop items', 'market', 'create'),
    (gen_random_uuid(), NOW(), 'system:admin', 'System administration', 'system', 'admin'),
    (gen_random_uuid(), NOW(), 'system:config', 'Modify system configuration', 'system', 'config'),
    (gen_random_uuid(), NOW(), 'analytics:view', 'View analytics dashboards', 'analytics', 'read')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FEATURE_FLAGS (5 records)
-- ============================================================
INSERT INTO feature_flags (id, created_at, updated_at, flag_name, enabled, description, metadata)
VALUES
    (gen_random_uuid(), NOW(), NOW(), 'social_features', false, 'Enable social/community features', '{"rollout_percentage": 0}'),
    (gen_random_uuid(), NOW(), NOW(), 'ai_coach', false, 'Enable AI coaching features', '{"model": "gpt-4"}'),
    (gen_random_uuid(), NOW(), NOW(), 'premium_content', true, 'Enable premium content access', NULL),
    (gen_random_uuid(), NOW(), NOW(), 'beta_fitness', false, 'Beta fitness tracking features', '{"min_version": "2.0.0"}'),
    (gen_random_uuid(), NOW(), NOW(), 'music_analysis', true, 'Enable music analysis features', NULL)
ON CONFLICT (flag_name) DO NOTHING;

-- ============================================================
-- UNIVERSAL_QUESTS (9 records)
-- ============================================================
INSERT INTO universal_quests (id, created_at, updated_at, title, description, type, xp_reward, coin_reward, target, target_type, target_config, skill_key, is_active, sort_order)
VALUES
    (gen_random_uuid(), NOW(), NOW(), 'Daily Focus', 'Complete 25 minutes of focused work', 'daily', 50, 10, 25, 'focus_minutes', NULL, 'focus', true, 1),
    (gen_random_uuid(), NOW(), NOW(), 'Habit Check', 'Complete at least one habit today', 'daily', 25, 5, 1, 'habits_completed', NULL, 'discipline', true, 2),
    (gen_random_uuid(), NOW(), NOW(), 'Active Minutes', 'Log 15 minutes of exercise', 'daily', 40, 8, 15, 'exercise_minutes', NULL, 'endurance', true, 3),
    (gen_random_uuid(), NOW(), NOW(), 'Focus Champion', 'Complete 3 hours of focused work this week', 'weekly', 200, 50, 180, 'focus_minutes', NULL, 'focus', true, 10),
    (gen_random_uuid(), NOW(), NOW(), 'Habit Warrior', 'Complete all habits for 5 days', 'weekly', 150, 35, 5, 'perfect_habit_days', NULL, 'discipline', true, 11),
    (gen_random_uuid(), NOW(), NOW(), 'Workout Week', 'Complete 3 workouts this week', 'weekly', 175, 40, 3, 'workouts_completed', NULL, 'strength', true, 12),
    (gen_random_uuid(), NOW(), NOW(), 'Bookworm', 'Read for 60 minutes this week', 'weekly', 100, 25, 60, 'reading_minutes', NULL, 'knowledge', true, 13),
    (gen_random_uuid(), NOW(), NOW(), 'Marathon Focus', 'Complete 20 hours of focused work this month', 'monthly', 500, 150, 1200, 'focus_minutes', NULL, 'focus', true, 20),
    (gen_random_uuid(), NOW(), NOW(), 'Perfect Month', 'Maintain a 30-day streak', 'monthly', 750, 200, 30, 'streak_days', NULL, 'discipline', true, 21)
;

-- ============================================================
-- LEARN_TOPICS (5 records)
-- ============================================================
INSERT INTO learn_topics (id, created_at, key, name, description, category, icon, color, sort_order, is_active)
VALUES
    (gen_random_uuid(), NOW(), 'productivity', 'Productivity', 'Master time management and deep work techniques', 'theory', 'clock', '#3B82F6', 1, true),
    (gen_random_uuid(), NOW(), 'habits', 'Habit Science', 'Understand the science of habit formation', 'theory', 'repeat', '#10B981', 2, true),
    (gen_random_uuid(), NOW(), 'fitness_basics', 'Fitness Fundamentals', 'Learn proper form and training principles', 'practice', 'dumbbell', '#EF4444', 3, true),
    (gen_random_uuid(), NOW(), 'mindfulness', 'Mindfulness', 'Develop focus and mental clarity', 'practice', 'brain', '#8B5CF6', 4, true),
    (gen_random_uuid(), NOW(), 'music_theory', 'Music Theory', 'Understand the building blocks of music', 'theory', 'music', '#F59E0B', 5, true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ONBOARDING_FLOWS (1 records)
-- ============================================================
INSERT INTO onboarding_flows (id, created_at, updated_at, name, description, is_active, total_steps)
VALUES
    (gen_random_uuid(), NOW(), NOW(), 'welcome', 'New user welcome and setup flow', true, 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- MARKET_ITEMS (10 records)
-- ============================================================
INSERT INTO market_items (id, created_at, updated_at, key, name, description, category, cost_coins, rarity, icon, is_global, is_available, is_active, is_consumable, sort_order)
VALUES
    (gen_random_uuid(), NOW(), NOW(), 'theme_dark', 'Dark Mode Theme', 'A sleek dark interface theme', 'theme', 0, 'common', 'moon', true, true, true, false, 1),
    (gen_random_uuid(), NOW(), NOW(), 'theme_ocean', 'Ocean Theme', 'Calm blue tones inspired by the sea', 'theme', 50, 'common', 'waves', true, true, true, false, 2),
    (gen_random_uuid(), NOW(), NOW(), 'theme_forest', 'Forest Theme', 'Earthy greens for a natural feel', 'theme', 50, 'common', 'tree', true, true, true, false, 3),
    (gen_random_uuid(), NOW(), NOW(), 'theme_sunset', 'Sunset Theme', 'Warm oranges and purples', 'theme', 100, 'rare', 'sunset', true, true, true, false, 4),
    (gen_random_uuid(), NOW(), NOW(), 'xp_boost_1h', '1-Hour XP Boost', 'Double XP for 1 hour', 'boost', 25, 'common', 'zap', true, true, true, true, 10),
    (gen_random_uuid(), NOW(), NOW(), 'xp_boost_24h', '24-Hour XP Boost', 'Double XP for 24 hours', 'boost', 100, 'rare', 'zap', true, true, true, true, 11),
    (gen_random_uuid(), NOW(), NOW(), 'streak_shield', 'Streak Shield', 'Protect your streak for one missed day', 'boost', 150, 'rare', 'shield', true, true, true, true, 12),
    (gen_random_uuid(), NOW(), NOW(), 'avatar_crown', 'Golden Crown', 'A crown fit for royalty', 'avatar', 500, 'epic', 'crown', true, true, true, false, 20),
    (gen_random_uuid(), NOW(), NOW(), 'avatar_wings', 'Angel Wings', 'Majestic feathered wings', 'avatar', 750, 'epic', 'feather', true, true, true, false, 21),
    (gen_random_uuid(), NOW(), NOW(), 'avatar_halo', 'Golden Halo', 'A glowing halo of achievement', 'avatar', 1000, 'legendary', 'star', true, true, true, false, 22)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- GOALS (3 records)
-- ============================================================
INSERT INTO goals (id, created_at, updated_at, user_id, title, description, category, priority, status, progress, sort_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Social Confidence Through Reps (No Shrinking)', 'Build social confidence by repeating approach behaviors while anxious and dropping "make myself small" safety behaviors. Success = I stayed present and took normal space, not "I felt confident."', 'Social / Confidence', 5, 'active', 0, 1),
    ('a0000000-0000-0000-0000-000000000002', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Sober Rave Freedom (Disinhibition Without Substances)', 'Retrain my nervous system to move freely at raves while sober by interrupting stiffening, redirecting attention outward, and doing controlled "embarrassment exposures."', 'Movement / Social / Embodiment', 5, 'active', 0, 2),
    ('a0000000-0000-0000-0000-000000000003', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Dating Presence (Connection Over Performance)', 'Improve dating confidence by staying present, showing preferences, escalating gently, and tolerating awkwardness without self-correction or checking for approval.', 'Dating / Confidence', 4, 'active', 0, 3)
;

-- ============================================================
-- USER_QUESTS (6 records)
-- ============================================================
INSERT INTO user_quests (id, created_at, updated_at, user_id, title, description, category, difficulty, xp_reward, coin_reward, status, progress, target, is_active, is_repeatable)
VALUES
    ('b0000000-0000-0000-0000-000000000001', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Anti-Shrinking Week (Body Takes Normal Space)', 'For 7-14 days, identify 2 "shrinking" safety behaviors and drop them on purpose (examples: quiet voice, hunching, apologizing, over-smiling, compressing arms). Track reps; success is compliance, not comfort.

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Duration:** 1-2 weeks
**Success Criteria:** Complete minimum 10 reps of anti-shrinking behaviors', 'Social / CBT', 'medium', 250, 50, 'not_started', 0, 10, true, false),
    ('b0000000-0000-0000-0000-000000000002', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '12 Social Openers (Tiny Starts)', 'Complete 12 micro-interactions (friends, strangers, staff, coworkers): one opener + one follow-up question. Leave the interaction without evaluating performance.

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Duration:** 1-2 weeks
**Success Criteria:** 12 completed micro-interactions', 'Social / Exposure', 'medium', 250, 50, 'not_started', 0, 12, true, false),
    ('b0000000-0000-0000-0000-000000000003', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Embarrassment Tolerance Training (No Fixing)', 'Do 8 deliberate "mild awkward" reps (ask a simple question, admit slight nerves, let silence happen, make a slightly bold compliment). Do not repair, explain, or backpedal. Stay present through the discomfort.

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Duration:** 2-4 weeks
**Success Criteria:** 8 embarrassment tolerance reps completed', 'CBT / Exposure', 'hard', 500, 100, 'not_started', 0, 8, true, false),
    ('b0000000-0000-0000-0000-000000000004', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Sober Movement Conditioning (7 Songs)', 'Move continuously for 7 full songs across the quest (alone or in public). No mirror. No judging. The goal is "continuous movement," not dance quality.

**Linked Goal:** Sober Rave Freedom (Disinhibition Without Substances)
**Duration:** 1-4 weeks
**Success Criteria:** 7 full songs with continuous movement', 'Movement / Conditioning', 'easy', 100, 25, 'not_started', 0, 7, true, false),
    ('b0000000-0000-0000-0000-000000000005', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Rave Reset Mastery (Stiffness -> Release Sequence)', 'Practice and deploy a 20-second reset when stiffness appears: jaw drop + exhale; shoulder roll x2; hip sway 4 counts; resume movement. Do this 10 times across practice or real events.

**Linked Goal:** Sober Rave Freedom (Disinhibition Without Substances)
**Duration:** 1-4 weeks
**Success Criteria:** 10 completed reset sequences', 'Movement / Somatic', 'medium', 250, 50, 'not_started', 0, 10, true, false),
    ('b0000000-0000-0000-0000-000000000006', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Dating Reps (3 Invites + 2 Dates)', 'Send 3 low-pressure invites and complete 2 in-person dates/hangouts. Focus on presence + showing preferences, not being impressive.

**Linked Goal:** Dating Presence (Connection Over Performance)
**Duration:** 2-4 weeks
**Success Criteria:** 3 invites sent + 2 dates completed', 'Dating / Exposure', 'epic', 1000, 200, 'not_started', 0, 5, true, false)
;

-- ============================================================
-- HABITS (12 records)
-- ============================================================
INSERT INTO habits (id, created_at, updated_at, user_id, name, description, frequency, target_count, icon, color, sort_order, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Social Rep (Approach While Anxious)', 'Do one approach behavior despite discomfort (start convo, join group, send invite, ask someone about themselves). Log a single sentence: "What I did."

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Target:** 3x per week', 'weekly', 3, '💬', '#4F46E5', 1, true),
    ('c0000000-0000-0000-0000-000000000002', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Drop One Safety Behavior (Anti-Shrink)', 'Choose 1 safety behavior today and do the opposite (speak 10% slower, shoulders open, no apologizing, don''t hide hands, don''t look down).

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Target:** 4x per week', 'weekly', 4, '🛡️', '#DC2626', 2, true),
    ('c0000000-0000-0000-0000-000000000003', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Embarrassment Rep (No Repair)', 'Do something mildly awkward on purpose and do not "fix" it (no explaining, no over-talking, no apology). Stay in the interaction 20-60 seconds.

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Target:** 2x per week', 'weekly', 2, '😳', '#F59E0B', 3, true),
    ('c0000000-0000-0000-0000-000000000004', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'One Preference Spoken (Micro-Assertiveness)', 'State one preference out loud (food, music, plan, opinion). Short. No justification.

**Linked Goal:** Social Confidence Through Reps (No Shrinking)
**Target:** 3x per week', 'weekly', 3, '🎯', '#10B981', 4, true),
    ('c0000000-0000-0000-0000-000000000005', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Continuous Movement Song (No Mirror)', 'Put on one song and move continuously until it ends. The only rule: keep moving.

**Linked Goal:** Sober Rave Freedom (Disinhibition Without Substances)
**Target:** 4x per week', 'weekly', 4, '🎵', '#8B5CF6', 5, true),
    ('c0000000-0000-0000-0000-000000000006', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Stiffness Reset Drill (20 seconds)', 'Practice: jaw drop + exhale; shoulder roll x2; hip sway 4 counts; resume. Count it as done when you complete the sequence.

**Linked Goal:** Sober Rave Freedom (Disinhibition Without Substances)
**Target:** 5x per week', 'weekly', 5, '🔄', '#EC4899', 6, true),
    ('c0000000-0000-0000-0000-000000000007', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Outward Attention Loop (Sound/Light/Body)', 'For 60 seconds, rotate attention: bass -> lights -> feet/weight. If you catch self-monitoring, restart the loop.

**Linked Goal:** Sober Rave Freedom (Disinhibition Without Substances)
**Target:** 5x per week', 'weekly', 5, '👁️', '#06B6D4', 7, true),
    ('c0000000-0000-0000-0000-000000000008', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Controlled "Too Much" Move (Disinhibition Rep)', 'For 10 seconds, intentionally move bigger than comfortable (arms, shoulders, head). Stay present after.

**Linked Goal:** Sober Rave Freedom (Disinhibition Without Substances)
**Target:** 2x per week', 'weekly', 2, '🔥', '#F97316', 8, true),
    ('c0000000-0000-0000-0000-000000000009', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Send One Invite', 'Invite someone to something simple (coffee, walk, show, event). Low pressure.

**Linked Goal:** Dating Presence (Connection Over Performance)
**Target:** 1x per week', 'weekly', 1, '📨', '#EF4444', 9, true),
    ('c0000000-0000-0000-0000-000000000010', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '2-Step Conversation (Ask + Follow-up)', 'Ask one open question, then one follow-up about a detail. Do not pivot to performance.

**Linked Goal:** Dating Presence (Connection Over Performance)
**Target:** 4x per week', 'weekly', 4, '🗣️', '#3B82F6', 10, true),
    ('c0000000-0000-0000-0000-000000000011', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Warmth Signal (Compliment or Appreciation)', 'Give one sincere compliment/appreciation to a friend/date. One sentence.

**Linked Goal:** Dating Presence (Connection Over Performance)
**Target:** 2x per week', 'weekly', 2, '💝', '#EC4899', 11, true),
    ('c0000000-0000-0000-0000-000000000012', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'Tiny Vulnerability (One Honest Sentence)', 'Share one small honest thing ("I''m a bit tired today," "I get nervous sometimes," "I''m excited about this"). No over-explaining.

**Linked Goal:** Dating Presence (Connection Over Performance)
**Target:** 2x per week', 'weekly', 2, '💭', '#A855F7', 12, true)
;

-- ============================================================
-- EXERCISES (53 records)
-- ============================================================
INSERT INTO exercises (id, created_at, name, description, category, muscle_groups, equipment, is_builtin, is_custom, user_id)
VALUES
    (gen_random_uuid(), NOW(), 'Cat–cow on hands and knees', 'General warm-up for spine.

Key cues: Start neutral; gently round then extend; move with slow breathing.
Guide: https://www.youtube.com/watch?v=RKN24fpS-as', 'mobility_posture', ARRAY['spine', 'thoracic'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Half-kneeling hip-flexor stretch', 'Primary hip-flexor stretch to reduce anterior tilt.

Key cues: Posteriorly tilt pelvis; squeeze glute on back leg; do not arch low back.
Guide: https://youtu.be/_xU-wIiMxpI?si=3gzdQi19tQCYRrIB', 'mobility_posture', ARRAY['hips', 'hip_flexors', 'glutes'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Standing or side-lying quad stretch', 'Targets rectus femoris which is often tight in anterior tilt.

Key cues: Keep pelvis lightly tucked; bring heel toward glute; avoid pulling low back into arch.
Guide: https://youtu.be/_xU-wIiMxpI?si=aUz39djZMQNdG9DX', 'mobility_posture', ARRAY['quads', 'hips'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Supine hamstring stretch', 'Improves hamstring flexibility if they feel tight.

Key cues: Lie on back; keep opposite leg straight on floor; raise leg until stretch not pain.
Guide: https://www.youtube.com/watch?v=Il1L75v6gq0a', 'mobility_posture', ARRAY['hamstrings'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Child''s pose with posterior pelvic tilt focus', 'Encourages lumbar flexion to counter constant extension.

Key cues: Sit hips toward heels; gently round low back; relax shoulders.
Guide: https://www.youtube.com/watch?v=_ZX_zTOBgp8', 'mobility_posture', ARRAY['spine', 'low_back', 'lats'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Thread the needle from hands and knees', 'Improves thoracic rotation and general upper back mobility.

Key cues: From quadruped slide arm under; rotate upper back; keep movement smooth and pain free.
Guide: https://www.youtube.com/watch?v=7C8-zj3nRro', 'mobility_posture', ARRAY['thoracic', 'shoulders'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Foam-roller thoracic extension', 'Improves thoracic extension and reduces stiffness.

Key cues: Roller across upper back; support head; gently extend over roller then return.
Guide: https://www.youtube.com/watch?v=W_6_swxc-cI', 'mobility_posture', ARRAY['thoracic'], ARRAY['foam_roller'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Doorway pec stretch', 'Opens tight chest and front shoulders that pull posture forward.

Key cues: Elbows at about shoulder height; step through door until chest stretch; do not push into shoulder pain.
Guide: https://www.youtube.com/watch?v=M850sCj9LHQ', 'mobility_posture', ARRAY['chest', 'front_delts'], ARRAY['doorway'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Supine pelvic tilt to neutral', 'Trains control of pelvic position and awareness of neutral.

Key cues: Lie on back with knees bent; gently tilt pelvis to flatten low back then arch slightly; find middle neutral.
Guide: https://www.youtube.com/watch?v=U0dfnyfhpwk', 'mobility_posture', ARRAY['core', 'pelvis', 'low_back'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Wall alignment drill', 'Reinforces stacked neutral posture for daily standing.

Key cues: Heels a short distance from wall; butt and mid back on wall; gently draw ribs down and lightly tuck pelvis.
Guide: https://www.youtube.com/watch?v=hQLU6m7GNwU', 'mobility_posture', ARRAY['posture', 'core', 'thoracic'], ARRAY['wall'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Joint circles (neck/shoulders/hips/ankles)', 'General joint prep; reduces baseline bracing.

Key cues: Slow circles; stay pain-free; breathe normally.
Guide: https://www.youtube.com/watch?v=6v7p7s6Kk4Y', 'mobility_generic', ARRAY['neck', 'shoulders', 'hips', 'ankles'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'World''s greatest stretch (lunge + T-spine reach)', 'Full-body opener; high carryover.

Key cues: Long exhale in the bottom; reach rotates from upper back.
Guide: https://www.youtube.com/watch?v=Fsa3n5g8fYI', 'mobility_generic', ARRAY['hips', 'thoracic', 'hamstrings', 'hip_flexors'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), '90/90 hip switches (controlled)', 'Builds hip IR/ER control, not just stretch.

Key cues: Move slowly; stay tall; don''t force knee down.
Guide: https://www.youtube.com/watch?v=H9m3qTt7n3E', 'mobility_generic', ARRAY['hips'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Pigeon pose (or figure-4 on back)', 'Glute/hip external rotators.

Key cues: Hips square; ease off if knee pain.
Guide: https://www.youtube.com/watch?v=2vPqM7q3QXo', 'mobility_generic', ARRAY['glutes', 'hips'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Supine hamstring floss (band/towel)', 'Flossing often transfers better than long static.

Key cues: Alternate gentle extend/bend; no nerve pain.
Guide: https://www.youtube.com/watch?v=G3Zp6jPp3xM', 'mobility_generic', ARRAY['hamstrings'], ARRAY['band_or_towel'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Wall calf stretch (gastroc/soleus)', 'Supports ankle range for squats/dance.

Key cues: Heel down; don''t collapse arch.
Guide: https://www.youtube.com/watch?v=Yj3bQn9pVxg', 'mobility_generic', ARRAY['calves', 'ankles'], ARRAY['wall'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Open book thoracic rotation', 'Reduces upper back stiffness.

Key cues: Exhale as you open; keep knees stacked.
Guide: https://www.youtube.com/watch?v=0uK4pYq1m1A', 'mobility_generic', ARRAY['thoracic'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Wall slides (scap control)', 'Shoulder mobility + control (less bracing).

Key cues: Ribs down; forearms stay on wall; slow.
Guide: https://www.youtube.com/watch?v=Z6Lw9xQw8lI', 'mobility_generic', ARRAY['shoulders', 'upper_back'], ARRAY['wall'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Doorway pec stretch (low + mid angle)', 'Two angles improves transfer.

Key cues: No shoulder pain; gentle step-through.
Guide: https://www.youtube.com/watch?v=SV7l1sfEmO0', 'mobility_generic', ARRAY['chest', 'front_delts'], ARRAY['doorway'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Child''s pose with side reach', 'Good downshift finisher.

Key cues: Reach long; breathe into side ribs.
Guide: https://www.youtube.com/watch?v=I8m3l9kV3Wg', 'mobility_generic', ARRAY['spine', 'lats'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Constructive rest breathing (knees bent)', 'Locks in tension reduction / state change.

Key cues: Long exhale; jaw unclenched; shoulders heavy.
Guide: https://www.youtube.com/watch?v=4pLUleLdwY4', 'mobility_generic', ARRAY['breathing', 'recovery'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Nasal breathing + jaw unclench check', 'Downshifts bracing; sets baseline.

Key cues: Lips gently closed; tongue rests on palate; jaw hangs.
Guide: https://www.youtube.com/watch?v=RzVvThhjAKw', 'face_mobility', ARRAY['jaw', 'breathing'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Masseter release (gentle self-massage)', 'Targets jaw clenching tension.

Key cues: Light pressure; slow circles; stop if sharp pain.
Guide: https://www.youtube.com/watch?v=EM18snVgV_c', 'face_mobility', ARRAY['jaw'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Controlled jaw open/close (midline)', 'Motor control for jaw tracking.

Key cues: Open slowly; keep jaw tracking straight; no clicking.
Guide: https://www.youtube.com/watch?v=7b73yE0U2t0', 'face_mobility', ARRAY['jaw'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Chin tucks (deep neck flexors)', 'Reduces forward-head tension that feeds face bracing.

Key cues: Glide head back; keep throat relaxed; breathe.
Guide: https://www.youtube.com/watch?v=2jvB6K3pGxA', 'face_mobility', ARRAY['neck', 'posture'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Smile–neutral control reps', 'Trains expressiveness without over-control.

Key cues: Slow smile to ~70%; relax fully back to neutral.
Guide: https://www.youtube.com/watch?v=0TjGQw4h9iI', 'face_mobility', ARRAY['face', 'cheeks', 'lips'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Brow raise + gentle squint combo', 'Improves expressive range (upper face).

Key cues: Raise brows then add slight squint; relax fully.
Guide: https://www.youtube.com/watch?v=6y2ZQp7a5iQ', 'face_mobility', ARRAY['face', 'brow', 'eyes'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Tongue posture drill (light)', 'Supports jaw relaxation; do not force.

Key cues: Tongue on palate; jaw relaxed; nasal breathe.
Guide: https://www.youtube.com/watch?v=3Z_Fp9lGrGY', 'face_mobility', ARRAY['tongue', 'jaw', 'breathing'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Speak one sentence with 3 expressions', 'Transfers to real social expression control.

Key cues: Same sentence; change expression only; keep jaw loose.
Guide: https://www.youtube.com/watch?v=2Hc9Yw6h2u0', 'face_mobility', ARRAY['face', 'expression'], ARRAY[], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Lat pulldown', 'Guide: (none)

Notes: Or more if you can.', 'strength_upper', ARRAY['lats', 'upper_back', 'biceps'], ARRAY['cable'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Incline Bench Press', 'Guide: (none)', 'strength_upper', ARRAY['chest_upper', 'triceps', 'front_delts'], ARRAY['dumbbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Straight Arm Lat Pulldown', 'Guide: (none)', 'strength_upper', ARRAY['lats', 'shoulders', 'upper_back'], ARRAY['cable'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Seated Shoulder Press', 'Guide: (none)', 'strength_upper', ARRAY['shoulders', 'triceps'], ARRAY['machine'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Bench', 'Guide: (none)

Notes: Or more; train close to failure.', 'strength_upper', ARRAY['chest', 'triceps', 'front_delts'], ARRAY['free_weights'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Leg Press', 'Guide: (none)', 'strength_lower', ARRAY['quads', 'glutes'], ARRAY['machine'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Romanian Deadlift', 'Guide: (none)', 'strength_lower', ARRAY['hamstrings', 'glutes', 'low_back'], ARRAY['barbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Leg Extension', 'Guide: (none)', 'strength_lower', ARRAY['quads'], ARRAY['machine'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Seated Calf Raise', 'Guide: (none)', 'strength_lower', ARRAY['calves'], ARRAY['machine'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Cable Crunch', 'Guide: (none)', 'strength_lower', ARRAY['abs', 'core'], ARRAY['cable'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Bench Press', 'Guide: (none)', 'strength_push', ARRAY['chest', 'triceps', 'front_delts'], ARRAY['barbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Shoulder Press', 'Guide: (none)', 'strength_push', ARRAY['shoulders', 'triceps'], ARRAY['dumbbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Low Cable Fly Crossovers', 'Guide: (none)', 'strength_push', ARRAY['chest', 'front_delts'], ARRAY['cable'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Triceps Extension', 'Guide: (none)', 'strength_push', ARRAY['triceps'], ARRAY['dumbbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Triceps Rope Pushdown', 'Guide: (none)', 'strength_push', ARRAY['triceps'], ARRAY['cable'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Bent Over Row', 'Guide: (none)', 'strength_pull', ARRAY['upper_back', 'lats', 'biceps'], ARRAY['barbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Bicep Curl', 'Guide: (none)', 'strength_pull', ARRAY['biceps'], ARRAY['dumbbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Hammer Curl', 'Guide: (none)', 'strength_pull', ARRAY['biceps', 'forearms'], ARRAY['dumbbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Face Pull', 'Guide: (none)', 'strength_pull', ARRAY['rear_delts', 'upper_back', 'rotator_cuff'], ARRAY['cable'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Squat', 'Guide: (none)', 'strength_legs', ARRAY['quads', 'glutes', 'core'], ARRAY['barbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Glute Ham Raise', 'Guide: (none)', 'strength_legs', ARRAY['hamstrings', 'glutes'], ARRAY['bodyweight_or_machine'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Lunge', 'Guide: (none)

Notes: Per side.', 'strength_legs', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['dumbbell'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Lying Leg Curl', 'Guide: (none)', 'strength_legs', ARRAY['hamstrings'], ARRAY['machine'], true, false, NULL),
    (gen_random_uuid(), NOW(), 'Standing Calf Raise', 'Guide: (none)', 'strength_legs', ARRAY['calves'], ARRAY['smith_machine'], true, false, NULL)
ON CONFLICT (name) DO NOTHING;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '  ✓ skill_definitions: 6 records';
    RAISE NOTICE '  ✓ achievement_definitions: 15 records';
    RAISE NOTICE '  ✓ roles: 5 records';
    RAISE NOTICE '  ✓ entitlements: 13 records';
    RAISE NOTICE '  ✓ feature_flags: 5 records';
    RAISE NOTICE '  ✓ universal_quests: 9 records';
    RAISE NOTICE '  ✓ learn_topics: 5 records';
    RAISE NOTICE '  ✓ onboarding_flows: 1 records';
    RAISE NOTICE '  ✓ market_items: 10 records';
    RAISE NOTICE '  ✓ goals: 3 records';
    RAISE NOTICE '  ✓ user_quests: 6 records';
    RAISE NOTICE '  ✓ habits: 12 records';
    RAISE NOTICE '  ✓ exercises: 53 records';
    RAISE NOTICE '  ✓ workouts: 8 records';
    RAISE NOTICE '  ✓ workout_sections: 25 records';
    RAISE NOTICE '  ✓ workout_exercises: 54 records';
END $$;
