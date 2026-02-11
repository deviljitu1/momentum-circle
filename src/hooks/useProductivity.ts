
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { ProductivityTask as Task, TaskLog, DailySummary, ChallengeStats, TaskType } from "@/types/productivity";

// Keys for query invalidation
const KEYS = {
    tasks: "productivity_tasks",
    logs: "productivity_logs",
    summary: "productivity_summary",
    leaderboard: "productivity_leaderboard",
    stats: "productivity_stats",
    history: "productivity_history",
};

// Fetch tasks for the current user
export const useProductivityTasks = (date: string) => {
    return useQuery({
        queryKey: [KEYS.tasks, date],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Get Tasks
            const { data: tasks, error: tasksError } = await supabase
                .from("tasks")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (tasksError) throw tasksError;

            const typedTasks = tasks as unknown as Task[];

            // 2. Get Logs for this date
            const { data: logs, error: logsError } = await supabase
                .from("task_logs")
                .select("*")
                .eq("date", date)
                .in("task_id", typedTasks.map(t => t.id));

            if (logsError) throw logsError;

            const typedLogs = logs as unknown as TaskLog[];

            // Merge
            return typedTasks.map(task => {
                const log = typedLogs?.find(l => l.task_id === task.id);
                return {
                    ...task,
                    log: log || null,
                };
            });
        },
    });
};

// Fetch daily summary for the current user
export const useDailySummary = (date: string) => {
    return useQuery({
        queryKey: [KEYS.summary, date],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("daily_summaries")
                .select("*")
                .eq("user_id", user.id)
                .eq("date", date)
                .maybeSingle();

            if (error) throw error;
            return data as unknown as DailySummary | null;
        },
    });
};

// Fetch history range
export const useProductivityHistory = (start: string, end: string) => {
    return useQuery({
        queryKey: [KEYS.history, start, end],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("daily_summaries")
                .select("*")
                .eq("user_id", user.id)
                .gte("date", start)
                .lte("date", end)
                .order("date", { ascending: true });

            if (error) throw error;
            return data as unknown as DailySummary[];
        },
    });
};

// Fetch challenge stats
export const useChallengeStats = () => {
    return useQuery({
        queryKey: [KEYS.stats],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("challenge_stats")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data as unknown as ChallengeStats | null;
        },
    });
};

// Fetch Leaderboard
export const useProductivityLeaderboard = (period: "daily" | "weekly" = "daily") => {
    return useQuery({
        queryKey: [KEYS.leaderboard, period],
        queryFn: async () => {
            const today = new Date();
            const dateStr = format(today, "yyyy-MM-dd");
            let startDate = dateStr;

            if (period === "weekly") {
                const start = new Date();
                start.setDate(today.getDate() - 6); // Last 7 days
                startDate = format(start, "yyyy-MM-dd");
            }

            // 1. Get all profiles (to show everyone)
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("user_id, display_name, avatar_url");

            if (profilesError) throw profilesError;

            // 2. Get summaries for the period
            const { data: summaries, error: summariesError } = await supabase
                .from("daily_summaries")
                .select("*")
                .gte("date", startDate)
                .lte("date", dateStr);

            if (summariesError) throw summariesError;

            // 3. Merge and Calculate
            const leaderboard = profiles.map(profile => {
                const userSummaries = summaries?.filter(s => s.user_id === profile.user_id) || [];

                let score = 0;
                let isLeave = false;
                let daysCounted = 0;

                if (period === "daily") {
                    const todaySummary = userSummaries.find(s => s.date === dateStr);
                    score = todaySummary?.final_percentage || 0;
                    isLeave = todaySummary?.is_leave || false;
                } else {
                    // Weekly: Average of final_percentage for non-leave days
                    // If all days are leave, score 0? Or maybe hide?
                    // User said: "if somone is on leave... it should not show as that peosion has not worked"
                    // i.e. Don't penalize.

                    const activeDays = userSummaries.filter(s => !s.is_leave);
                    if (activeDays.length > 0) {
                        const totalPct = activeDays.reduce((sum, s) => sum + (s.final_percentage || 0), 0);
                        score = totalPct / activeDays.length;
                    } else {
                        score = 0; // Or handle as special case
                    }

                    // Allow leave flag if today is leave? Or if strictly all week leave?
                    // Let's set leave flag if Today is leave, for display purposes.
                    const todaySummary = userSummaries.find(s => s.date === dateStr);
                    isLeave = todaySummary?.is_leave || false;
                }

                return {
                    user_id: profile.user_id,
                    display_name: profile.display_name || "Unknown",
                    avatar_url: profile.avatar_url,
                    final_percentage: score,
                    is_leave: isLeave,
                };
            });

            // Sort by score desc
            return leaderboard.sort((a, b) => b.final_percentage - a.final_percentage);
        },
    });
};

// Mutations
export const useProductivityMutations = () => {
    const queryClient = useQueryClient();

    const addTask = useMutation({
        mutationFn: async (newTask: { title: string; task_type: TaskType; target_value?: number }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            return await supabase.from("tasks").insert({
                user_id: user.id,
                ...newTask,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [KEYS.tasks] });
            toast.success("Task added!");
        },
        onError: (error) => toast.error(`Failed to add task: ${error.message}`),
    });

    const updateLog = useMutation({
        mutationFn: async (payload: { taskId: string; date: string; actualValue?: number; completed?: boolean }) => {
            const { taskId, date, actualValue, completed } = payload;

            const { data, error } = await supabase.from("task_logs").upsert(
                {
                    task_id: taskId,
                    date,
                    actual_value: actualValue,
                    completed: completed,
                },
                { onConflict: "task_id, date" }
            ).select();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: [KEYS.tasks, vars.date] });
            queryClient.invalidateQueries({ queryKey: [KEYS.summary, vars.date] });
            queryClient.invalidateQueries({ queryKey: [KEYS.stats] });
            queryClient.invalidateQueries({ queryKey: [KEYS.history] }); // History might update
        },
        onError: (error) => toast.error(`Failed to update progress: ${error.message}`),
    });

    const handleToggleLeave = async (date: string, isLeave: boolean, type?: string, reason?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if exists
        const { data: existing } = await supabase
            .from("daily_summaries")
            .select("id")
            .eq("user_id", user.id)
            .eq("date", date)
            .maybeSingle();

        let error;
        const payload = {
            is_leave: isLeave,
            leave_type: isLeave ? type || "Other" : null,
            leave_reason: isLeave ? reason || null : null,
        };

        if (existing) {
            const res = await supabase
                .from("daily_summaries")
                .update(payload)
                .eq("id", existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from("daily_summaries")
                .insert({
                    user_id: user.id,
                    date,
                    earned_points: 0,
                    possible_points: 0,
                    final_percentage: 0,
                    ...payload
                });
            error = res.error;
        }

        if (error) {
            toast.error("Failed to set leave status");
        } else {
            toast.success(isLeave ? "Marked as Leave" : "Marked as Active");
            queryClient.invalidateQueries({ queryKey: [KEYS.summary, date] });
            queryClient.invalidateQueries({ queryKey: [KEYS.stats] });
            queryClient.invalidateQueries({ queryKey: [KEYS.leaderboard] }); // Affects leaderboard
            queryClient.invalidateQueries({ queryKey: [KEYS.history] });
        }
    };

    return { addTask, updateLog, toggleLeave: handleToggleLeave };
};
