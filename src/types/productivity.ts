export type TaskType = 'A' | 'B' | 'C';

export interface ProductivityTask {
    id: string;
    user_id: string;
    title: string;
    task_type: TaskType;
    target_value: number | null;
    is_personal: boolean;
    created_at: string;
}

export interface TaskLog {
    id: string;
    task_id: string;
    date: string; // YYYY-MM-DD
    actual_value: number | null;
    completed: boolean | null;
    calculated_points: number;
}

export interface DailySummary {
    id: string;
    user_id: string;
    date: string;
    earned_points: number;
    possible_points: number;
    final_percentage: number;
    is_leave: boolean;
}

export interface ChallengeStats {
    id: string;
    user_id: string;
    streak_days: number;
    best_streak: number;
    last_success_date: string | null;
}

export interface LeaderboardEntry {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    final_percentage: number;
    is_leave: boolean;
}
