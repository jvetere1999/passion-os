-- SEED DATA FOR PASSION OS
-- Generated from SCHEMA_SPEC definitions
-- Run after migrations: psql -f seeds.sql

-- ==============================================
-- SKILL DEFINITIONS (6 core skills)
-- ==============================================
INSERT INTO skill_definitions (id, key, name, description, category, icon, max_level, stars_per_level, sort_order, created_at)
VALUES
    (gen_random_uuid(), 'focus', 'Focus', 'Your ability to concentrate and complete deep work sessions', 'mental', 'brain', 100, 10, 1, NOW()),
    (gen_random_uuid(), 'discipline', 'Discipline', 'Consistency in maintaining habits and routines', 'mental', 'target', 100, 10, 2, NOW()),
    (gen_random_uuid(), 'strength', 'Strength', 'Physical power and resistance training progress', 'physical', 'dumbbell', 100, 10, 3, NOW()),
    (gen_random_uuid(), 'endurance', 'Endurance', 'Cardiovascular fitness and stamina', 'physical', 'heart', 100, 10, 4, NOW()),
    (gen_random_uuid(), 'creativity', 'Creativity', 'Artistic expression and creative problem solving', 'creative', 'palette', 100, 10, 5, NOW()),
    (gen_random_uuid(), 'knowledge', 'Knowledge', 'Learning and intellectual growth', 'mental', 'book', 100, 10, 6, NOW())
ON CONFLICT (key) DO NOTHING;

-- ==============================================
-- ACHIEVEMENT DEFINITIONS (15 starter achievements)
-- ==============================================
INSERT INTO achievement_definitions (id, key, name, description, category, icon, trigger_type, trigger_config, reward_coins, reward_xp, is_hidden, sort_order, created_at)
VALUES
    -- Focus achievements
    (gen_random_uuid(), 'first_focus', 'First Focus', 'Complete your first focus session', 'focus', 'zap', 'event', '{"event": "focus_complete", "count": 1}', 10, 25, false, 1, NOW()),
    (gen_random_uuid(), 'focus_10', 'Focus Beginner', 'Complete 10 focus sessions', 'focus', 'zap', 'threshold', '{"event": "focus_complete", "count": 10}', 25, 100, false, 2, NOW()),
    (gen_random_uuid(), 'focus_100', 'Focus Master', 'Complete 100 focus sessions', 'focus', 'crown', 'threshold', '{"event": "focus_complete", "count": 100}', 100, 500, false, 3, NOW()),
    (gen_random_uuid(), 'deep_work', 'Deep Worker', 'Complete a 60+ minute focus session', 'focus', 'clock', 'event', '{"event": "focus_complete", "min_duration": 3600}', 50, 100, false, 4, NOW()),
    
    -- Streak achievements
    (gen_random_uuid(), 'streak_3', 'Getting Started', 'Maintain a 3-day streak', 'streak', 'flame', 'threshold', '{"streak_type": "daily", "count": 3}', 15, 50, false, 10, NOW()),
    (gen_random_uuid(), 'streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'streak', 'flame', 'threshold', '{"streak_type": "daily", "count": 7}', 35, 150, false, 11, NOW()),
    (gen_random_uuid(), 'streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'streak', 'fire', 'threshold', '{"streak_type": "daily", "count": 30}', 150, 500, false, 12, NOW()),
    (gen_random_uuid(), 'streak_100', 'Legendary Streak', 'Maintain a 100-day streak', 'streak', 'trophy', 'threshold', '{"streak_type": "daily", "count": 100}', 500, 2000, true, 13, NOW()),
    
    -- Habit achievements
    (gen_random_uuid(), 'first_habit', 'Habit Formed', 'Complete a habit for the first time', 'habit', 'check', 'event', '{"event": "habit_complete", "count": 1}', 10, 25, false, 20, NOW()),
    (gen_random_uuid(), 'habit_streak_7', 'Habit Builder', 'Complete a habit 7 days in a row', 'habit', 'repeat', 'threshold', '{"event": "habit_streak", "count": 7}', 50, 150, false, 21, NOW()),
    
    -- Reading achievements
    (gen_random_uuid(), 'first_book', 'Bookworm', 'Finish your first book', 'reading', 'book', 'event', '{"event": "book_complete", "count": 1}', 50, 200, false, 30, NOW()),
    (gen_random_uuid(), 'books_10', 'Library Builder', 'Finish 10 books', 'reading', 'library', 'threshold', '{"event": "book_complete", "count": 10}', 200, 1000, false, 31, NOW()),
    
    -- Fitness achievements
    (gen_random_uuid(), 'first_workout', 'Gym Rat', 'Complete your first workout', 'fitness', 'dumbbell', 'event', '{"event": "workout_complete", "count": 1}', 25, 50, false, 40, NOW()),
    (gen_random_uuid(), 'first_pr', 'Personal Best', 'Set your first personal record', 'fitness', 'medal', 'event', '{"event": "personal_record", "count": 1}', 50, 100, false, 41, NOW()),
    
    -- Learning achievements
    (gen_random_uuid(), 'first_lesson', 'Student', 'Complete your first lesson', 'learning', 'graduation', 'event', '{"event": "lesson_complete", "count": 1}', 15, 50, false, 50, NOW())
ON CONFLICT (key) DO NOTHING;

-- ==============================================
-- ROLES (RBAC system)
-- ==============================================
INSERT INTO roles (id, name, description, parent_role_id, created_at)
VALUES
    (gen_random_uuid(), 'user', 'Standard user with basic access', NULL, NOW()),
    (gen_random_uuid(), 'premium', 'Premium user with additional features', NULL, NOW()),
    (gen_random_uuid(), 'moderator', 'Community moderator', NULL, NOW()),
    (gen_random_uuid(), 'admin', 'Full administrative access', NULL, NOW()),
    (gen_random_uuid(), 'super_admin', 'Super administrator with all permissions', NULL, NOW())
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- ENTITLEMENTS (Permissions)
-- ==============================================
INSERT INTO entitlements (id, name, description, resource, action, created_at)
VALUES
    -- User management
    (gen_random_uuid(), 'users:read', 'View user profiles', 'users', 'read', NOW()),
    (gen_random_uuid(), 'users:update', 'Update user profiles', 'users', 'update', NOW()),
    (gen_random_uuid(), 'users:delete', 'Delete users', 'users', 'delete', NOW()),
    (gen_random_uuid(), 'users:manage', 'Full user management', 'users', 'manage', NOW()),
    
    -- Content management
    (gen_random_uuid(), 'content:create', 'Create content', 'content', 'create', NOW()),
    (gen_random_uuid(), 'content:update', 'Update content', 'content', 'update', NOW()),
    (gen_random_uuid(), 'content:delete', 'Delete content', 'content', 'delete', NOW()),
    (gen_random_uuid(), 'content:moderate', 'Moderate user content', 'content', 'moderate', NOW()),
    
    -- Market management
    (gen_random_uuid(), 'market:manage', 'Manage shop items', 'market', 'manage', NOW()),
    (gen_random_uuid(), 'market:create_items', 'Create new shop items', 'market', 'create', NOW()),
    
    -- System
    (gen_random_uuid(), 'system:admin', 'System administration', 'system', 'admin', NOW()),
    (gen_random_uuid(), 'system:config', 'Modify system configuration', 'system', 'config', NOW()),
    (gen_random_uuid(), 'analytics:view', 'View analytics dashboards', 'analytics', 'read', NOW())
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- FEATURE FLAGS (Default disabled)
-- ==============================================
INSERT INTO feature_flags (id, flag_name, enabled, description, metadata, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'social_features', false, 'Enable social/community features', '{"rollout_percentage": 0}', NOW(), NOW()),
    (gen_random_uuid(), 'ai_coach', false, 'Enable AI coaching features', '{"model": "gpt-4"}', NOW(), NOW()),
    (gen_random_uuid(), 'premium_content', true, 'Enable premium content access', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'beta_fitness', false, 'Beta fitness tracking features', '{"min_version": "2.0.0"}', NOW(), NOW()),
    (gen_random_uuid(), 'music_analysis', true, 'Enable music analysis features', NULL, NOW(), NOW())
ON CONFLICT (flag_name) DO NOTHING;

-- ==============================================
-- UNIVERSAL QUESTS (Daily/Weekly system quests)
-- ==============================================
INSERT INTO universal_quests (id, title, description, type, xp_reward, coin_reward, target, target_type, target_config, skill_key, is_active, sort_order, created_at, updated_at)
VALUES
    -- Daily quests
    (gen_random_uuid(), 'Daily Focus', 'Complete 25 minutes of focused work', 'daily', 50, 10, 25, 'focus_minutes', NULL, 'focus', true, 1, NOW(), NOW()),
    (gen_random_uuid(), 'Habit Check', 'Complete at least one habit today', 'daily', 25, 5, 1, 'habits_completed', NULL, 'discipline', true, 2, NOW(), NOW()),
    (gen_random_uuid(), 'Active Minutes', 'Log 15 minutes of exercise', 'daily', 40, 8, 15, 'exercise_minutes', NULL, 'endurance', true, 3, NOW(), NOW()),
    
    -- Weekly quests
    (gen_random_uuid(), 'Focus Champion', 'Complete 3 hours of focused work this week', 'weekly', 200, 50, 180, 'focus_minutes', NULL, 'focus', true, 10, NOW(), NOW()),
    (gen_random_uuid(), 'Habit Warrior', 'Complete all habits for 5 days', 'weekly', 150, 35, 5, 'perfect_habit_days', NULL, 'discipline', true, 11, NOW(), NOW()),
    (gen_random_uuid(), 'Workout Week', 'Complete 3 workouts this week', 'weekly', 175, 40, 3, 'workouts_completed', NULL, 'strength', true, 12, NOW(), NOW()),
    (gen_random_uuid(), 'Bookworm', 'Read for 60 minutes this week', 'weekly', 100, 25, 60, 'reading_minutes', NULL, 'knowledge', true, 13, NOW(), NOW()),
    
    -- Monthly quests
    (gen_random_uuid(), 'Marathon Focus', 'Complete 20 hours of focused work this month', 'monthly', 500, 150, 1200, 'focus_minutes', NULL, 'focus', true, 20, NOW(), NOW()),
    (gen_random_uuid(), 'Perfect Month', 'Maintain a 30-day streak', 'monthly', 750, 200, 30, 'streak_days', NULL, 'discipline', true, 21, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==============================================
-- LEARN TOPICS (Core learning categories)
-- ==============================================
INSERT INTO learn_topics (id, key, name, description, category, icon, color, sort_order, is_active, created_at)
VALUES
    (gen_random_uuid(), 'productivity', 'Productivity', 'Master time management and deep work techniques', 'theory', 'clock', '#3B82F6', 1, true, NOW()),
    (gen_random_uuid(), 'habits', 'Habit Science', 'Understand the science of habit formation', 'theory', 'repeat', '#10B981', 2, true, NOW()),
    (gen_random_uuid(), 'fitness_basics', 'Fitness Fundamentals', 'Learn proper form and training principles', 'practice', 'dumbbell', '#EF4444', 3, true, NOW()),
    (gen_random_uuid(), 'mindfulness', 'Mindfulness', 'Develop focus and mental clarity', 'practice', 'brain', '#8B5CF6', 4, true, NOW()),
    (gen_random_uuid(), 'music_theory', 'Music Theory', 'Understand the building blocks of music', 'theory', 'music', '#F59E0B', 5, true, NOW())
ON CONFLICT (key) DO NOTHING;

-- ==============================================
-- ONBOARDING FLOW (Default welcome flow)
-- ==============================================
INSERT INTO onboarding_flows (id, name, description, is_active, total_steps, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'welcome', 'New user welcome and setup flow', true, 5, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- MARKET ITEMS (Starter shop items)
-- ==============================================
INSERT INTO market_items (id, key, name, description, category, cost_coins, rarity, icon, is_global, is_available, is_active, is_consumable, sort_order, created_at, updated_at)
VALUES
    -- Themes
    (gen_random_uuid(), 'theme_dark', 'Dark Mode Theme', 'A sleek dark interface theme', 'theme', 0, 'common', 'moon', true, true, true, false, 1, NOW(), NOW()),
    (gen_random_uuid(), 'theme_ocean', 'Ocean Theme', 'Calm blue tones inspired by the sea', 'theme', 50, 'common', 'waves', true, true, true, false, 2, NOW(), NOW()),
    (gen_random_uuid(), 'theme_forest', 'Forest Theme', 'Earthy greens for a natural feel', 'theme', 50, 'common', 'tree', true, true, true, false, 3, NOW(), NOW()),
    (gen_random_uuid(), 'theme_sunset', 'Sunset Theme', 'Warm oranges and purples', 'theme', 100, 'rare', 'sunset', true, true, true, false, 4, NOW(), NOW()),
    
    -- Boosts
    (gen_random_uuid(), 'xp_boost_1h', '1-Hour XP Boost', 'Double XP for 1 hour', 'boost', 25, 'common', 'zap', true, true, true, true, 10, NOW(), NOW()),
    (gen_random_uuid(), 'xp_boost_24h', '24-Hour XP Boost', 'Double XP for 24 hours', 'boost', 100, 'rare', 'zap', true, true, true, true, 11, NOW(), NOW()),
    (gen_random_uuid(), 'streak_shield', 'Streak Shield', 'Protect your streak for one missed day', 'boost', 150, 'rare', 'shield', true, true, true, true, 12, NOW(), NOW()),
    
    -- Avatar items
    (gen_random_uuid(), 'avatar_crown', 'Golden Crown', 'A crown fit for royalty', 'avatar', 500, 'epic', 'crown', true, true, true, false, 20, NOW(), NOW()),
    (gen_random_uuid(), 'avatar_wings', 'Angel Wings', 'Majestic feathered wings', 'avatar', 750, 'epic', 'feather', true, true, true, false, 21, NOW(), NOW()),
    (gen_random_uuid(), 'avatar_halo', 'Golden Halo', 'A glowing halo of achievement', 'avatar', 1000, 'legendary', 'star', true, true, true, false, 22, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '✅ Seeds inserted successfully';
    RAISE NOTICE '   - 6 skill definitions';
    RAISE NOTICE '   - 15 achievements';
    RAISE NOTICE '   - 5 roles';
    RAISE NOTICE '   - 13 entitlements';
    RAISE NOTICE '   - 5 feature flags';
    RAISE NOTICE '   - 9 universal quests';
    RAISE NOTICE '   - 5 learn topics';
    RAISE NOTICE '   - 1 onboarding flow';
    RAISE NOTICE '   - 10 market items';
END $$;
