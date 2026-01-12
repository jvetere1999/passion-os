#!/usr/bin/env python3
"""
Build schema.json from root schema.json and SCHEMA_SPEC definitions.
Regenerates all tables with complete field definitions.
Output: tools/schema-generator/schema.json
"""

import json
import os

# All 79 tables from SCHEMA_SPEC_PART1.md and SCHEMA_SPEC_PART2.md
# Format: "field_name:TYPE:modifiers" where modifiers are PK, null, unique, fk

TABLES = {
    # ============================================
    # Migration 0001: Auth (6 tables)
    # ============================================
    "users": [
        "id:UUID:PK", "name:TEXT:null", "email:TEXT:unique", "email_verified:TIMESTAMPTZ:null",
        "image:TEXT:null", "role:TEXT", "approved:BOOLEAN", "age_verified:BOOLEAN",
        "tos_accepted:BOOLEAN", "tos_accepted_at:TIMESTAMPTZ:null", "tos_version:TEXT:null",
        "last_activity_at:TIMESTAMPTZ:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "accounts": [
        "id:UUID:PK", "user_id:UUID:fk", "type:TEXT", "provider:TEXT", "provider_account_id:TEXT",
        "refresh_token:TEXT:null", "access_token:TEXT:null", "expires_at:BIGINT:null",
        "token_type:TEXT:null", "scope:TEXT:null", "id_token:TEXT:null", "session_state:TEXT:null",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "sessions": [
        "id:UUID:PK", "user_id:UUID:fk", "token:TEXT:unique", "expires_at:TIMESTAMPTZ",
        "created_at:TIMESTAMPTZ", "last_activity_at:TIMESTAMPTZ:null", "user_agent:TEXT:null",
        "ip_address:TEXT:null", "rotated_from:UUID:null"
    ],
    "verification_tokens": [
        "identifier:TEXT", "token:TEXT:unique", "expires:TIMESTAMPTZ", "created_at:TIMESTAMPTZ"
    ],
    "authenticators": [
        "id:UUID:PK", "user_id:UUID:fk", "credential_id:TEXT:unique", "provider_account_id:TEXT",
        "credential_public_key:TEXT", "counter:BIGINT", "credential_device_type:TEXT",
        "credential_backed_up:BOOLEAN", "transports:TEXT[]", "created_at:TIMESTAMPTZ"
    ],
    "oauth_states": [
        "id:UUID:PK", "state:TEXT:unique", "provider:TEXT", "redirect_uri:TEXT:null",
        "created_at:TIMESTAMPTZ", "expires_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0002: RBAC (6 tables)
    # ============================================
    "roles": [
        "id:UUID:PK", "name:TEXT:unique", "description:TEXT:null", "parent_role_id:UUID:null",
        "created_at:TIMESTAMPTZ"
    ],
    "entitlements": [
        "id:UUID:PK", "name:TEXT:unique", "description:TEXT:null", "resource:TEXT",
        "action:TEXT", "created_at:TIMESTAMPTZ"
    ],
    "role_entitlements": [
        "role_id:UUID:fk", "entitlement_id:UUID:fk", "created_at:TIMESTAMPTZ"
    ],
    "user_roles": [
        "user_id:UUID:fk", "role_id:UUID:fk", "granted_by:UUID:null", "granted_at:TIMESTAMPTZ",
        "expires_at:TIMESTAMPTZ:null"
    ],
    "audit_log": [
        "id:UUID:PK", "user_id:UUID:null", "session_id:UUID:null", "event_type:TEXT",
        "resource_type:TEXT:null", "resource_id:UUID:null", "action:TEXT:null", "status:TEXT",
        "details:JSONB:null", "ip_address:TEXT:null", "user_agent:TEXT:null",
        "request_id:TEXT:null", "created_at:TIMESTAMPTZ"
    ],
    "activity_events": [
        "id:UUID:PK", "user_id:UUID:fk", "event_type:TEXT", "category:TEXT:null",
        "metadata:JSONB:null", "xp_earned:INTEGER", "coins_earned:INTEGER", "created_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0003: Gamification (8 tables)
    # ============================================
    "skill_definitions": [
        "id:UUID:PK", "key:TEXT:unique", "name:TEXT", "description:TEXT:null", "category:TEXT",
        "icon:TEXT:null", "max_level:INTEGER", "stars_per_level:INTEGER", "sort_order:INTEGER",
        "created_at:TIMESTAMPTZ"
    ],
    "user_skills": [
        "id:UUID:PK", "user_id:UUID:fk", "skill_key:TEXT", "current_stars:INTEGER",
        "current_level:INTEGER", "total_stars:INTEGER", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "achievement_definitions": [
        "id:UUID:PK", "key:TEXT:unique", "name:TEXT", "description:TEXT:null", "category:TEXT",
        "icon:TEXT:null", "trigger_type:TEXT", "trigger_config:JSONB", "reward_coins:INTEGER",
        "reward_xp:INTEGER", "is_hidden:BOOLEAN", "sort_order:INTEGER", "created_at:TIMESTAMPTZ"
    ],
    "user_achievements": [
        "id:UUID:PK", "user_id:UUID:fk", "achievement_key:TEXT", "earned_at:TIMESTAMPTZ",
        "notified:BOOLEAN"
    ],
    "user_progress": [
        "id:UUID:PK", "user_id:UUID:fk", "total_xp:INTEGER", "current_level:INTEGER",
        "xp_to_next_level:INTEGER", "total_skill_stars:INTEGER", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],
    "user_wallet": [
        "id:UUID:PK", "user_id:UUID:fk", "coins:INTEGER", "total_earned:INTEGER",
        "total_spent:INTEGER", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "points_ledger": [
        "id:UUID:PK", "user_id:UUID:fk", "event_type:TEXT", "event_id:UUID:null",
        "coins:INTEGER", "xp:INTEGER", "skill_stars:INTEGER:null", "skill_key:TEXT:null",
        "reason:TEXT:null", "idempotency_key:TEXT:null", "created_at:TIMESTAMPTZ"
    ],
    "user_streaks": [
        "id:UUID:PK", "user_id:UUID:fk", "streak_type:TEXT", "current_streak:INTEGER",
        "longest_streak:INTEGER", "last_activity_date:DATE:null", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0004: Focus (4 tables)
    # ============================================
    "focus_sessions": [
        "id:UUID:PK", "user_id:UUID:fk", "mode:TEXT", "duration_seconds:INTEGER",
        "started_at:TIMESTAMPTZ", "completed_at:TIMESTAMPTZ:null", "abandoned_at:TIMESTAMPTZ:null",
        "expires_at:TIMESTAMPTZ:null", "status:TEXT", "xp_awarded:INTEGER", "coins_awarded:INTEGER",
        "task_id:UUID:null", "task_title:TEXT:null", "created_at:TIMESTAMPTZ"
    ],
    "focus_pause_state": [
        "id:UUID:PK", "user_id:UUID:fk", "session_id:UUID:fk", "is_paused:BOOLEAN",
        "time_remaining_seconds:INTEGER:null", "paused_at:TIMESTAMPTZ:null",
        "resumed_at:TIMESTAMPTZ:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "focus_libraries": [
        "id:UUID:PK", "user_id:UUID:fk", "name:TEXT", "description:TEXT:null",
        "library_type:TEXT", "tracks_count:INTEGER", "is_favorite:BOOLEAN",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "focus_library_tracks": [
        "id:UUID:PK", "library_id:UUID:fk", "track_id:TEXT:null", "track_title:TEXT",
        "track_url:TEXT:null", "duration_seconds:INTEGER:null", "sort_order:INTEGER",
        "added_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0005: Habits & Goals (4 tables)
    # ============================================
    "habits": [
        "id:UUID:PK", "user_id:UUID:fk", "name:TEXT", "description:TEXT:null", "frequency:TEXT",
        "target_count:INTEGER", "custom_days:INTEGER[]:null", "icon:TEXT:null", "color:TEXT:null",
        "is_active:BOOLEAN", "current_streak:INTEGER", "longest_streak:INTEGER",
        "last_completed_at:TIMESTAMPTZ:null", "sort_order:INTEGER", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],
    "habit_completions": [
        "id:UUID:PK", "habit_id:UUID:fk", "user_id:UUID:fk", "completed_at:TIMESTAMPTZ",
        "completed_date:DATE", "notes:TEXT:null"
    ],
    "goals": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "description:TEXT:null",
        "category:TEXT:null", "target_date:DATE:null", "started_at:TIMESTAMPTZ:null",
        "completed_at:TIMESTAMPTZ:null", "status:TEXT", "progress:INTEGER", "priority:INTEGER",
        "sort_order:INTEGER", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "goal_milestones": [
        "id:UUID:PK", "goal_id:UUID:fk", "title:TEXT", "description:TEXT:null",
        "is_completed:BOOLEAN", "completed_at:TIMESTAMPTZ:null", "sort_order:INTEGER"
    ],

    # ============================================
    # Migration 0006: Quests (3 tables)
    # ============================================
    "universal_quests": [
        "id:UUID:PK", "title:TEXT", "description:TEXT:null", "type:TEXT", "xp_reward:INTEGER",
        "coin_reward:INTEGER", "target:INTEGER", "target_type:TEXT", "target_config:JSONB:null",
        "skill_key:TEXT:null", "is_active:BOOLEAN", "created_by:UUID:null", "sort_order:INTEGER",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "user_quests": [
        "id:UUID:PK", "user_id:UUID:fk", "source_quest_id:UUID:null", "title:TEXT",
        "description:TEXT:null", "category:TEXT:null", "difficulty:TEXT", "xp_reward:INTEGER",
        "coin_reward:INTEGER", "status:TEXT", "progress:INTEGER", "target:INTEGER",
        "is_active:BOOLEAN", "is_repeatable:BOOLEAN", "repeat_frequency:TEXT:null",
        "accepted_at:TIMESTAMPTZ", "completed_at:TIMESTAMPTZ:null", "claimed_at:TIMESTAMPTZ:null",
        "expires_at:TIMESTAMPTZ:null", "last_completed_date:DATE:null", "streak_count:INTEGER",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "user_quest_progress": [
        "id:UUID:PK", "user_id:UUID:fk", "quest_id:UUID:fk", "status:TEXT", "progress:INTEGER",
        "accepted_at:TIMESTAMPTZ", "completed_at:TIMESTAMPTZ:null", "claimed_at:TIMESTAMPTZ:null",
        "last_reset_at:TIMESTAMPTZ:null", "times_completed:INTEGER", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0007: Planning (3 tables)
    # ============================================
    "calendar_events": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "description:TEXT:null", "event_type:TEXT",
        "start_time:TIMESTAMPTZ", "end_time:TIMESTAMPTZ:null", "all_day:BOOLEAN", "timezone:TEXT:null",
        "location:TEXT:null", "workout_id:UUID:null", "habit_id:UUID:null", "goal_id:UUID:null",
        "recurrence_rule:TEXT:null", "recurrence_end:DATE:null", "parent_event_id:UUID:null",
        "color:TEXT:null", "reminder_minutes:INTEGER:null", "metadata:JSONB:null",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "daily_plans": [
        "id:UUID:PK", "user_id:UUID:fk", "date:DATE", "items:JSONB", "notes:TEXT:null",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "plan_templates": [
        "id:UUID:PK", "user_id:UUID:fk", "name:TEXT", "description:TEXT:null", "items:JSONB",
        "is_public:BOOLEAN", "category:TEXT:null", "use_count:INTEGER", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0008: Market (5 tables)
    # ============================================
    "market_items": [
        "id:UUID:PK", "key:TEXT:null", "name:TEXT", "description:TEXT:null", "category:TEXT",
        "cost_coins:INTEGER", "rarity:TEXT", "icon:TEXT:null", "icon_url:TEXT:null",
        "image_url:TEXT:null", "is_global:BOOLEAN", "is_available:BOOLEAN", "is_active:BOOLEAN",
        "is_consumable:BOOLEAN", "uses_per_purchase:INTEGER:null", "total_stock:INTEGER:null",
        "remaining_stock:INTEGER:null", "available_from:TIMESTAMPTZ:null",
        "available_until:TIMESTAMPTZ:null", "created_by_user_id:UUID:null", "sort_order:INTEGER",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "user_purchases": [
        "id:UUID:PK", "user_id:UUID:fk", "item_id:UUID:fk", "cost_coins:INTEGER", "quantity:INTEGER",
        "purchased_at:TIMESTAMPTZ", "redeemed_at:TIMESTAMPTZ:null", "uses_remaining:INTEGER:null",
        "status:TEXT", "refunded_at:TIMESTAMPTZ:null", "refund_reason:TEXT:null"
    ],
    "market_transactions": [
        "id:UUID:PK", "user_id:UUID:fk", "transaction_type:TEXT", "coins_amount:INTEGER",
        "item_id:UUID:null", "reason:TEXT:null", "created_at:TIMESTAMPTZ"
    ],
    "user_rewards": [
        "id:UUID:PK", "user_id:UUID:fk", "reward_type:TEXT", "source_id:UUID:null",
        "coins_earned:INTEGER", "xp_earned:INTEGER", "claimed:BOOLEAN", "claimed_at:TIMESTAMPTZ:null",
        "expires_at:TIMESTAMPTZ:null", "created_at:TIMESTAMPTZ"
    ],
    "market_recommendations": [
        "id:UUID:PK", "user_id:UUID:fk", "item_id:UUID:fk", "score:REAL", "reason:TEXT:null",
        "computed_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0009: Books (2 tables)
    # ============================================
    "books": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "author:TEXT:null", "total_pages:INTEGER:null",
        "current_page:INTEGER", "status:TEXT", "started_at:TIMESTAMPTZ:null",
        "completed_at:TIMESTAMPTZ:null", "rating:INTEGER:null", "notes:TEXT:null",
        "cover_url:TEXT:null", "isbn:TEXT:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "reading_sessions": [
        "id:UUID:PK", "book_id:UUID:fk", "user_id:UUID:fk", "pages_read:INTEGER",
        "start_page:INTEGER:null", "end_page:INTEGER:null", "duration_minutes:INTEGER:null",
        "started_at:TIMESTAMPTZ", "notes:TEXT:null", "xp_awarded:INTEGER", "coins_awarded:INTEGER"
    ],

    # ============================================
    # Migration 0010: Fitness (10 tables)
    # ============================================
    "exercises": [
        "id:UUID:PK", "name:TEXT", "description:TEXT:null", "category:TEXT", "muscle_groups:TEXT[]:null",
        "equipment:TEXT[]:null", "instructions:TEXT:null", "video_url:TEXT:null", "is_custom:BOOLEAN",
        "is_builtin:BOOLEAN", "user_id:UUID:null", "created_at:TIMESTAMPTZ"
    ],
    "workouts": [
        "id:UUID:PK", "user_id:UUID:fk", "name:TEXT", "description:TEXT:null",
        "estimated_duration:INTEGER:null", "difficulty:TEXT:null", "category:TEXT:null",
        "is_template:BOOLEAN", "is_public:BOOLEAN", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "workout_sections": [
        "id:UUID:PK", "workout_id:UUID:fk", "name:TEXT", "section_type:TEXT:null", "sort_order:INTEGER"
    ],
    "workout_exercises": [
        "id:UUID:PK", "workout_id:UUID:fk", "section_id:UUID:null", "exercise_id:UUID:fk",
        "sets:INTEGER:null", "reps:INTEGER:null", "weight:REAL:null", "duration:INTEGER:null",
        "rest_seconds:INTEGER:null", "notes:TEXT:null", "sort_order:INTEGER"
    ],
    "workout_sessions": [
        "id:UUID:PK", "user_id:UUID:fk", "workout_id:UUID:null", "started_at:TIMESTAMPTZ",
        "completed_at:TIMESTAMPTZ:null", "duration_seconds:INTEGER:null", "notes:TEXT:null",
        "rating:INTEGER:null", "xp_awarded:INTEGER", "coins_awarded:INTEGER"
    ],
    "exercise_sets": [
        "id:UUID:PK", "session_id:UUID:fk", "exercise_id:UUID:fk", "set_number:INTEGER",
        "reps:INTEGER:null", "weight:REAL:null", "duration:INTEGER:null", "is_warmup:BOOLEAN",
        "is_dropset:BOOLEAN", "rpe:INTEGER:null", "notes:TEXT:null", "completed_at:TIMESTAMPTZ"
    ],
    "personal_records": [
        "id:UUID:PK", "user_id:UUID:fk", "exercise_id:UUID:fk", "record_type:TEXT", "value:REAL",
        "reps:INTEGER:null", "achieved_at:TIMESTAMPTZ", "exercise_set_id:UUID:null",
        "previous_value:REAL:null", "created_at:TIMESTAMPTZ"
    ],
    "training_programs": [
        "id:UUID:PK", "user_id:UUID:fk", "name:TEXT", "description:TEXT:null", "duration_weeks:INTEGER",
        "goal:TEXT:null", "difficulty:TEXT:null", "is_active:BOOLEAN", "current_week:INTEGER",
        "started_at:TIMESTAMPTZ:null", "completed_at:TIMESTAMPTZ:null", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],
    "program_weeks": [
        "id:UUID:PK", "program_id:UUID:fk", "week_number:INTEGER", "name:TEXT:null",
        "is_deload:BOOLEAN", "notes:TEXT:null"
    ],
    "program_workouts": [
        "id:UUID:PK", "program_week_id:UUID:fk", "workout_id:UUID:fk", "day_of_week:INTEGER",
        "order_index:INTEGER", "intensity_modifier:REAL"
    ],

    # ============================================
    # Migration 0011: Learn (5 tables)
    # ============================================
    "learn_topics": [
        "id:UUID:PK", "key:TEXT:unique", "name:TEXT", "description:TEXT:null", "category:TEXT",
        "icon:TEXT:null", "color:TEXT:null", "sort_order:INTEGER", "is_active:BOOLEAN",
        "created_at:TIMESTAMPTZ"
    ],
    "learn_lessons": [
        "id:UUID:PK", "topic_id:UUID:fk", "key:TEXT:unique", "title:TEXT", "description:TEXT:null",
        "content_markdown:TEXT:null", "duration_minutes:INTEGER:null", "difficulty:TEXT",
        "quiz_json:JSONB:null", "xp_reward:INTEGER", "coin_reward:INTEGER", "skill_key:TEXT:null",
        "skill_star_reward:INTEGER", "audio_r2_key:TEXT:null", "video_url:TEXT:null",
        "sort_order:INTEGER", "is_active:BOOLEAN", "created_at:TIMESTAMPTZ"
    ],
    "learn_drills": [
        "id:UUID:PK", "topic_id:UUID:fk", "key:TEXT:unique", "title:TEXT", "description:TEXT:null",
        "drill_type:TEXT", "config_json:JSONB", "difficulty:TEXT", "duration_seconds:INTEGER:null",
        "xp_reward:INTEGER", "sort_order:INTEGER", "is_active:BOOLEAN", "created_at:TIMESTAMPTZ"
    ],
    "user_lesson_progress": [
        "id:UUID:PK", "user_id:UUID:fk", "lesson_id:UUID:fk", "status:TEXT",
        "started_at:TIMESTAMPTZ:null", "completed_at:TIMESTAMPTZ:null", "quiz_score:INTEGER:null",
        "attempts:INTEGER"
    ],
    "user_drill_stats": [
        "id:UUID:PK", "user_id:UUID:fk", "drill_id:UUID:fk", "total_attempts:INTEGER",
        "correct_answers:INTEGER", "best_score:INTEGER", "average_score:REAL",
        "current_streak:INTEGER", "best_streak:INTEGER", "last_attempt_at:TIMESTAMPTZ:null",
        "total_time_seconds:INTEGER"
    ],

    # ============================================
    # Migration 0012: Reference & Analysis (9 tables)
    # ============================================
    "reference_tracks": [
        "id:UUID:PK", "user_id:UUID:fk", "name:TEXT", "description:TEXT:null", "r2_key:TEXT",
        "file_size_bytes:BIGINT", "mime_type:TEXT", "duration_seconds:REAL:null", "artist:TEXT:null",
        "album:TEXT:null", "genre:TEXT:null", "bpm:REAL:null", "key_signature:TEXT:null",
        "tags:TEXT[]:null", "status:TEXT", "error_message:TEXT:null", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],
    "track_analyses": [
        "id:UUID:PK", "track_id:UUID:fk", "analysis_type:TEXT", "version:TEXT", "status:TEXT",
        "started_at:TIMESTAMPTZ:null", "completed_at:TIMESTAMPTZ:null", "error_message:TEXT:null",
        "summary:JSONB:null", "manifest:JSONB:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "track_annotations": [
        "id:UUID:PK", "track_id:UUID:fk", "user_id:UUID:fk", "start_time_ms:INTEGER",
        "end_time_ms:INTEGER:null", "title:TEXT", "content:TEXT:null", "category:TEXT:null",
        "color:TEXT:null", "is_private:BOOLEAN", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "track_regions": [
        "id:UUID:PK", "track_id:UUID:fk", "user_id:UUID:fk", "start_time_ms:INTEGER",
        "end_time_ms:INTEGER", "name:TEXT", "description:TEXT:null", "section_type:TEXT:null",
        "color:TEXT:null", "display_order:INTEGER", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "analysis_frame_manifests": [
        "id:UUID:PK", "analysis_id:UUID:fk", "manifest_version:INTEGER", "hop_ms:INTEGER",
        "frame_count:INTEGER", "duration_ms:INTEGER", "sample_rate:INTEGER", "bands:INTEGER",
        "bytes_per_frame:INTEGER", "frame_layout:JSONB", "events:JSONB:null", "fingerprint:TEXT:null",
        "analyzer_version:TEXT", "chunk_size_frames:INTEGER", "total_chunks:INTEGER",
        "created_at:TIMESTAMPTZ"
    ],
    "analysis_frame_data": [
        "id:UUID:PK", "manifest_id:UUID:fk", "chunk_index:INTEGER", "start_frame:INTEGER",
        "end_frame:INTEGER", "start_time_ms:INTEGER", "end_time_ms:INTEGER", "frame_data:BYTEA",
        "frame_count:INTEGER", "compressed:BOOLEAN", "compression_type:TEXT:null",
        "created_at:TIMESTAMPTZ"
    ],
    "analysis_events": [
        "id:UUID:PK", "analysis_id:UUID:fk", "time_ms:INTEGER", "duration_ms:INTEGER:null",
        "event_type:TEXT", "event_data:JSONB:null", "confidence:REAL:null", "created_at:TIMESTAMPTZ"
    ],
    "listening_prompt_templates": [
        "id:UUID:PK", "name:TEXT", "description:TEXT:null", "category:TEXT", "difficulty:TEXT",
        "prompt_text:TEXT", "hints:JSONB:null", "expected_observations:JSONB:null", "tags:TEXT[]:null",
        "display_order:INTEGER", "is_active:BOOLEAN", "created_by:UUID:null", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],
    "listening_prompt_presets": [
        "id:UUID:PK", "name:TEXT", "description:TEXT:null", "template_id:UUID:fk",
        "preset_type:TEXT", "config:JSONB", "is_active:BOOLEAN", "created_by:UUID:null",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],

    # ============================================
    # Migration 0013: Platform (14 tables)
    # ============================================
    "feedback": [
        "id:UUID:PK", "user_id:UUID:fk", "feedback_type:TEXT", "title:TEXT", "description:TEXT",
        "status:TEXT", "priority:TEXT:null", "admin_response:TEXT:null", "resolved_at:TIMESTAMPTZ:null",
        "metadata:JSONB:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "ideas": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "content:TEXT:null", "category:TEXT:null",
        "tags:TEXT[]:null", "is_pinned:BOOLEAN", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "infobase_entries": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "content:TEXT", "category:TEXT:null",
        "tags:TEXT[]:null", "is_pinned:BOOLEAN", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "onboarding_flows": [
        "id:UUID:PK", "name:TEXT:unique", "description:TEXT:null", "is_active:BOOLEAN",
        "total_steps:INTEGER", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "onboarding_steps": [
        "id:UUID:PK", "flow_id:UUID:fk", "step_order:INTEGER", "step_type:TEXT", "title:TEXT",
        "description:TEXT:null", "target_selector:TEXT:null", "target_route:TEXT:null",
        "fallback_content:TEXT:null", "options:JSONB:null", "allows_multiple:BOOLEAN",
        "required:BOOLEAN", "action_type:TEXT:null", "action_config:JSONB:null",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "user_onboarding_state": [
        "id:UUID:PK", "user_id:UUID:fk", "flow_id:UUID:fk", "current_step_id:UUID:null",
        "status:TEXT", "can_resume:BOOLEAN", "started_at:TIMESTAMPTZ:null",
        "completed_at:TIMESTAMPTZ:null", "skipped_at:TIMESTAMPTZ:null", "created_at:TIMESTAMPTZ",
        "updated_at:TIMESTAMPTZ"
    ],
    "user_onboarding_responses": [
        "id:UUID:PK", "user_id:UUID:fk", "step_id:UUID:fk", "response:JSONB", "created_at:TIMESTAMPTZ"
    ],
    "user_interests": [
        "id:UUID:PK", "user_id:UUID:fk", "interest_key:TEXT", "interest_label:TEXT",
        "created_at:TIMESTAMPTZ"
    ],
    "user_settings": [
        "id:UUID:PK", "user_id:UUID:fk", "notifications_enabled:BOOLEAN", "email_notifications:BOOLEAN",
        "push_notifications:BOOLEAN", "theme:TEXT", "timezone:TEXT:null", "locale:TEXT",
        "profile_public:BOOLEAN", "show_activity:BOOLEAN", "daily_reminder_time:TEXT:null",
        "soft_landing_until:TIMESTAMPTZ:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "inbox_items": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "description:TEXT:null", "item_type:TEXT",
        "tags:TEXT[]:null", "is_processed:BOOLEAN", "processed_at:TIMESTAMPTZ:null",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "user_references": [
        "id:UUID:PK", "user_id:UUID:fk", "title:TEXT", "content:TEXT:null", "url:TEXT:null",
        "category:TEXT:null", "tags:TEXT[]:null", "is_pinned:BOOLEAN", "is_archived:BOOLEAN",
        "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
    "feature_flags": [
        "id:UUID:PK", "flag_name:TEXT:unique", "enabled:BOOLEAN", "description:TEXT:null",
        "metadata:JSONB:null", "created_at:TIMESTAMPTZ", "updated_at:TIMESTAMPTZ"
    ],
}

# Type mappings: Postgres -> Rust -> TypeScript
TYPE_MAPPINGS = {
    "UUID": {"postgres": "UUID", "rust": "Uuid", "typescript": "string"},
    "TEXT": {"postgres": "TEXT", "rust": "String", "typescript": "string"},
    "INTEGER": {"postgres": "INTEGER", "rust": "i32", "typescript": "number"},
    "BIGINT": {"postgres": "BIGINT", "rust": "i64", "typescript": "number"},
    "REAL": {"postgres": "REAL", "rust": "f32", "typescript": "number"},
    "BOOLEAN": {"postgres": "BOOLEAN", "rust": "bool", "typescript": "boolean"},
    "TIMESTAMPTZ": {"postgres": "TIMESTAMPTZ", "rust": "chrono::DateTime<chrono::Utc>", "typescript": "string"},
    "DATE": {"postgres": "DATE", "rust": "chrono::NaiveDate", "typescript": "string"},
    "JSONB": {"postgres": "JSONB", "rust": "serde_json::Value", "typescript": "Record<string, unknown>"},
    "TEXT[]": {"postgres": "TEXT[]", "rust": "Vec<String>", "typescript": "string[]"},
    "INTEGER[]": {"postgres": "INTEGER[]", "rust": "Vec<i32>", "typescript": "number[]"},
    "BYTEA": {"postgres": "BYTEA", "rust": "Vec<u8>", "typescript": "Uint8Array"},
}

def to_pascal_case(snake_str: str) -> str:
    """Convert snake_case to PascalCase."""
    return "".join(word.capitalize() for word in snake_str.split("_"))

def parse_field(field_def: str) -> dict:
    """Parse a field definition string into a dict."""
    parts = field_def.split(":")
    field_name = parts[0]
    field_type = parts[1]
    modifiers = parts[2:] if len(parts) > 2 else []
    
    return {
        "type": field_type,
        "nullable": "null" in modifiers,
        "primary": "PK" in modifiers,
        "unique": "unique" in modifiers,
        "foreign_key": "fk" in modifiers
    }

def build_schema() -> dict:
    """Build the complete schema dictionary."""
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Passion OS Complete Schema",
        "description": "Generated from SCHEMA_SPEC_PART1.md and SCHEMA_SPEC_PART2.md",
        "version": "2.0.0",
        "generated_at": "2026-01-10",
        "tables": {},
        "type_mappings": TYPE_MAPPINGS
    }
    
    for table_name, field_defs in TABLES.items():
        table = {
            "fields": {},
            "rust_type": to_pascal_case(table_name),
            "ts_type": to_pascal_case(table_name)
        }
        
        for field_def in field_defs:
            parts = field_def.split(":")
            field_name = parts[0]
            table["fields"][field_name] = parse_field(field_def)
        
        schema["tables"][table_name] = table
    
    return schema

def main():
    # Build schema
    schema = build_schema()
    
    # Determine output path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "schema.json")
    
    # Write schema.json
    with open(output_path, "w") as f:
        json.dump(schema, f, indent=2)
    
    print(f"✅ Generated schema.json with {len(schema['tables'])} tables")
    print(f"   Location: {output_path}")
    
    # Print table summary by migration
    migrations = {
        "0001_auth": ["users", "accounts", "sessions", "verification_tokens", "authenticators", "oauth_states"],
        "0002_rbac": ["roles", "entitlements", "role_entitlements", "user_roles", "audit_log", "activity_events"],
        "0003_gamification": ["skill_definitions", "user_skills", "achievement_definitions", "user_achievements", 
                              "user_progress", "user_wallet", "points_ledger", "user_streaks"],
        "0004_focus": ["focus_sessions", "focus_pause_state", "focus_libraries", "focus_library_tracks"],
        "0005_habits_goals": ["habits", "habit_completions", "goals", "goal_milestones"],
        "0006_quests": ["universal_quests", "user_quests", "user_quest_progress"],
        "0007_planning": ["calendar_events", "daily_plans", "plan_templates"],
        "0008_market": ["market_items", "user_purchases", "market_transactions", "user_rewards", "market_recommendations"],
        "0009_books": ["books", "reading_sessions"],
        "0010_fitness": ["exercises", "workouts", "workout_sections", "workout_exercises", "workout_sessions",
                        "exercise_sets", "personal_records", "training_programs", "program_weeks", "program_workouts"],
        "0011_learn": ["learn_topics", "learn_lessons", "learn_drills", "user_lesson_progress", "user_drill_stats"],
        "0012_reference": ["reference_tracks", "track_analyses", "track_annotations", "track_regions",
                          "analysis_frame_manifests", "analysis_frame_data", "analysis_events",
                          "listening_prompt_templates", "listening_prompt_presets"],
        "0013_platform": ["feedback", "ideas", "infobase_entries", "onboarding_flows", "onboarding_steps",
                         "user_onboarding_state", "user_onboarding_responses", "user_interests", "user_settings",
                         "inbox_items", "user_references", "feature_flags"]
    }
    
    print("\n   Tables by migration:")
    for mig, tables in migrations.items():
        print(f"   - {mig}: {len(tables)} tables")

if __name__ == "__main__":
    main()
