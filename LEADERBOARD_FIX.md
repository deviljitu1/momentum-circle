# Leaderboard Task Completion Fix

## Problem
The leaderboard was not updating when tasks were completed in the Dashboard because:
1. The Dashboard uses the old task system (`useTasks` hook)
2. The Leaderboard uses the new productivity system (`useProductivityLeaderboard` hook)
3. These two systems were not synchronized

## Root Cause
- **Old System**: Tasks table → daily_stats table
- **New System**: Tasks table → task_logs table → daily_summaries table (via database triggers)
- The leaderboard reads from `daily_summaries.final_percentage`
- When tasks were completed in the Dashboard, only the old `tasks` table was updated
- The `daily_summaries` table was never updated, so the leaderboard showed 0%

## Solution
Modified `src/hooks/useTasks.ts` → `toggleTask` mutation to:

1. **Update the tasks table** (mark task as completed/uncompleted)

2. **Update daily_stats** (old leaderboard system - for backward compatibility)
   - Increment/decrement `tasks_completed` count
   - Add/subtract points

3. **Update daily_summaries** (new productivity system - for leaderboard)
   - Count total tasks for the user
   - Count completed tasks for the user
   - Calculate percentage: `(completed / total) × 100`
   - Update `earned_points`, `possible_points`, and `final_percentage`

## How It Works Now
When you complete a task in the Dashboard:
1. Task is marked as completed in the database
2. `daily_stats` is updated with task count and points
3. `daily_summaries` is updated with the completion percentage
4. Leaderboard automatically refreshes (via query invalidation)
5. Your percentage is displayed correctly on the leaderboard

## Technical Details
- **Percentage Calculation**: (Completed Tasks / Total Tasks) × 100
- **Points Calculation**: Each task = 100 points when completed
- **Real-time Updates**: Query invalidation triggers automatic refresh
- **Database Compatibility**: Works with existing cloud database schema (no migrations needed)

## Files Modified
- `src/hooks/useTasks.ts` - Added daily_summaries update logic
- `src/hooks/useProductivity.ts` - Added limit to profiles query for performance

## Testing
1. Go to Dashboard
2. Complete a task by checking the checkbox
3. Navigate to Leaderboard
4. Your percentage should now show correctly (e.g., if you have 3 tasks and completed 2, it shows 67%)
