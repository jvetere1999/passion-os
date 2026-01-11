# Database Schema Desynchronization Report

**Status**: CONFIRMED DESYNC - Backend code expects schema that doesn't exist

## Issue Summary

TOS modal reappears because sync endpoint returns 500. Sync endpoint fails due to missing columns/tables.

## Error Vectors Identified

### 1. inbox_items.is_read Column MISSING
- **Location**: `app/backend/crates/api/src/routes/sync.rs` line 349
- **Query**: `SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_read = false`
- **Problem**: Column `is_read` does not exist in migration
- **Schema Definition**: inbox_items in schema.json has `is_processed` (boolean), NOT `is_read`
- **Source Mismatch**:
  - Schema.json: ✓ has `is_processed` column
  - Migration (0001_schema.sql): ✓ creates `is_processed` column  
  - Backend code: ✗ queries for `is_read` column
  - Frontend types: ✗ expects `is_read` field

### 2. daily_plans.completed_count Column MISSING
- **Location**: `app/backend/crates/api/src/routes/sync.rs` line 288-297
- **Query**: `SELECT COALESCE(completed_count, 0), COALESCE(total_count, 0) FROM daily_plans WHERE user_id = $1 AND date = $2`
- **Problem**: Columns `completed_count` and `total_count` do not exist in migration
- **Schema Definition**: daily_plans in schema.json only has: id, user_id, date, items (JSONB), notes, created_at, updated_at
- **Correct Design**: Items stored as JSONB array in `items` column, not as separate table
- **Source Mismatch**:
  - Schema.json: ✓ defines simple daily_plans with items JSONB
  - Migration: ✓ creates daily_plans with items JSONB (no count columns)
  - Backend code: ✗ queries for non-existent `completed_count`, `total_count` columns
  - Frontend types: ✗ expects these count fields

### 3. daily_plan_items Table MISSING
- **Location**: `app/backend/crates/api/src/routes/today.rs` lines 167, 256
- **Query**: `SELECT id, items, ... FROM daily_plan_items`
- **Problem**: Table `daily_plan_items` does not exist anywhere in schema
- **Schema Design**: Items are stored as JSONB array in `daily_plans.items`, not as separate table
- **Source Mismatch**:
  - Schema.json: ✗ does NOT define daily_plan_items table
  - Migration: ✗ does NOT create daily_plan_items table
  - Backend code: ✗ queries this non-existent table
  - Frontend types: ✗ expects separate items with individual IDs

### 4. Operator Mismatch: date = text
- **Location**: Connection pool testing error
- **Error**: `operator does not exist: date = text`
- **Cause**: Code passing text string where DATE type expected
- **Location**: `fetch_plan_status` line 288: `AND date = $2` where $2 is formatted as string "2026-01-11"
- **Fix**: Should use explicit cast: `AND date = $2::date` or parse as DATE type

## Root Cause Analysis

**Authority Problem**: The migration (0001_schema.sql) was generated from schema.json v2.0.0, but backend code in routes/ was written for a DIFFERENT schema version.

**Timeline**:
1. Schema.json v2.0.0 defines: inbox_items with `is_processed`, daily_plans with `items` JSONB
2. Migration 0001_schema.sql correctly implements schema.json v2.0.0
3. BUT: Backend code (routes/*.rs) was written for OLD schema with: `is_read` column, `completed_count`/`total_count` columns, `daily_plan_items` table
4. Frontend types were ALSO generated for old schema

**Evidence**: 
- Old schema referenced in `deprecated/` folder has `is_read` column
- Current migration is "new" v2.0.0 but backend code wasn't updated to match

## Impact

### Broken Endpoints (500 errors)
1. `GET /api/sync/poll` - fails on unread_inbox count
2. `GET /api/sync/badges` - fails on unread_inbox count  
3. `GET /api/today` - fails on daily_plan_items queries
4. `GET /api/sync/plan-status` - fails on date type mismatch and missing columns

### User Impact
- TOS modal keeps reappearing (sync endpoint returns 500)
- Daily plan not loading
- No badge counts showing

## Required Fixes (in order)

### Option A: Update Backend Code (RECOMMENDED - schema.json is authoritative)
**Rationale**: schema.json v2.0.0 is cleaner design (no redundant count columns)

**Changes needed**:
1. `routes/sync.rs` line 349: Change `is_read` to `is_processed`
2. `routes/sync.rs` line 288-297: Remove count column queries, parse from `items` JSONB
3. `routes/today.rs` lines 167, 256: Remove daily_plan_items queries, use daily_plans.items JSONB
4. `db/inbox_models.rs`: Change `is_read` field to `is_processed`
5. Add type casting for date comparisons

### Option B: Update Schema (NOT RECOMMENDED - requires large migration)
Change schema.json back to include:
- `inbox_items.is_read` (instead of is_processed)
- `daily_plans.completed_count`, `daily_plans.total_count` (denormalized for performance)
- Create `daily_plan_items` table (add complexity)

Then regenerate migration and reapply to database.

## Baseline Established

**Source of Truth**: schema.json v2.0.0 in `tools/schema-generator/`
**Current State**: 
- ✓ schema.json is internally consistent
- ✓ Migration matches schema.json 
- ✗ Backend code does not match schema.json
- ✗ Frontend types do not match schema.json

**Next Step**: Update backend code to match the schema.json that migration implements.
