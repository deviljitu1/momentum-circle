
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
export const useProductivityLeaderboard = (date: string) => {
    return useQuery({
        queryKey: [KEYS.leaderboard, date],
        queryFn: async () => {
            // Join summaries with profiles
            const { data, error } = await supabase
                .from("daily_summaries")
                .select(`
          user_id,
          final_percentage,
          is_leave,
          profiles:user_id ( display_name, avatar_url )
        `)
                .eq("date", date)
                .eq("is_leave", false)
                .order("final_percentage", { ascending: false });

            if (error) throw error;

            return data.map((entry: any) => ({
                user_id: entry.user_id,
                display_name: entry.profiles?.display_name || "Unknown",
                avatar_url: entry.profiles?.avatar_url,
                final_percentage: entry.final_percentage,
                is_leave: entry.is_leave,
            }));
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

    const handleToggleLeave = async (date: string, isLeave: boolean) => {
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
        if (existing) {
            const res = await supabase
                .from("daily_summaries")
                .update({ is_leave: isLeave })
                .eq("id", existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from("daily_summaries")
                .insert({
                    user_id: user.id,
                    date,
                    is_leave: isLeave,
                    earned_points: 0,
                    possible_points: 0,
                    final_percentage: 0
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
