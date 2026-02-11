
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

// Search users in my circles
export const useSearchUsers = (query: string) => {
    return useQuery({
        queryKey: ["search_users", query],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            if (!query || query.length < 2) return [];

            // 1. Find circles I am in
            const { data: myCircles } = await supabase
                .from("circle_members")
                .select("circle_id")
                .eq("user_id", user.id);

            if (!myCircles || myCircles.length === 0) return [];
            const circleIds = myCircles.map(c => c.circle_id);

            // 2. Find members of those circles who match the query
            // This is a bit complex in Supabase without a join function or view
            // Strategy: Get all members of my circles, then filter by profile display name
            // Limit to avoid perf issues.

            // Get all user_ids in my circles
            const { data: circleMembers } = await supabase
                .from("circle_members")
                .select("user_id")
                .in("circle_id", circleIds);

            if (!circleMembers) return [];
            const memberIds = [...new Set(circleMembers.map(m => m.user_id).filter(id => id !== user.id))];

            if (memberIds.length === 0) return [];

            // Search profiles
            const { data: profiles } = await supabase
                .from("profiles")
                .select("user_id, display_name, avatar_url")
                .in("user_id", memberIds)
                .ilike("display_name", `%${query}%`)
                .limit(10);

            return profiles || [];
        },
        enabled: query.length >= 2
    });
};

// Check who I follow
export const useFollowingList = () => {
    return useQuery({
        queryKey: ["following_list"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data } = await supabase
                .from("user_follows")
                .select("following_id")
                .eq("follower_id", user.id);

            return data?.map(f => f.following_id) || [];
        }
    });
}

// Fetch Leaderboard
export const useProductivityLeaderboard = (period: "daily" | "weekly" = "daily", filter: "global" | "following" = "global") => {
    return useQuery({
        queryKey: [KEYS.leaderboard, period, filter],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const today = new Date();
            const dateStr = format(today, "yyyy-MM-dd");
            let startDate = dateStr;

            if (period === "weekly") {
                const start = new Date();
                start.setDate(today.getDate() - 6); // Last 7 days
                startDate = format(start, "yyyy-MM-dd");
            }

            // Determine which users to fetch
            let targetUserIds: string[] = [];

            if (filter === "following" && user) {
                // Get following list + self
                const { data: follows } = await supabase
                    .from("user_follows")
                    .select("following_id")
                    .eq("follower_id", user.id);

                targetUserIds = follows?.map(f => f.following_id) || [];
                targetUserIds.push(user.id);
            }

            // 1. Get profiles
            let profilesQuery = supabase
                .from("profiles")
                .select("user_id, display_name, avatar_url");

            if (filter === "following" && targetUserIds.length > 0) {
                profilesQuery = profilesQuery.in("user_id", targetUserIds);
            } else if (filter === "following" && targetUserIds.length === 0) {
                return []; // Following no one
            }

            const { data: profiles, error: profilesError } = await profilesQuery;
            if (profilesError) throw profilesError;

            // 2. Get summaries
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

                if (period === "daily") {
                    const todaySummary = userSummaries.find(s => s.date === dateStr);
                    score = todaySummary?.final_percentage || 0;
                    isLeave = todaySummary?.is_leave || false;
                } else {
                    const activeDays = userSummaries.filter(s => !s.is_leave);
                    if (activeDays.length > 0) {
                        const totalPct = activeDays.reduce((sum, s) => sum + (s.final_percentage || 0), 0);
                        score = totalPct / activeDays.length;
                    } else {
                        score = 0;
                    }
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
            queryClient.invalidateQueries({ queryKey: [KEYS.history] });
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
            queryClient.invalidateQueries({ queryKey: [KEYS.leaderboard] });
            queryClient.invalidateQueries({ queryKey: [KEYS.history] });
        }
    };

    const followUser = useMutation({
        mutationFn: async (userId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("user_follows").insert({
                follower_id: user.id,
                following_id: userId
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["following_list"] });
            queryClient.invalidateQueries({ queryKey: [KEYS.leaderboard] });
            toast.success("User added to your leaderboard");
        },
        onError: (e) => toast.error("Failed to follow user")
    });

    const unfollowUser = useMutation({
        mutationFn: async (userId: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from("user_follows").delete()
                .eq("follower_id", user.id)
                .eq("following_id", userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["following_list"] });
            queryClient.invalidateQueries({ queryKey: [KEYS.leaderboard] });
            toast.success("User removed from your leaderboard");
        },
        onError: (e) => toast.error("Failed to unfollow user")
    });

    const deleteTask = useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await supabase.from("tasks").delete().eq("id", taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [KEYS.tasks] });
            queryClient.invalidateQueries({ queryKey: [KEYS.summary] });
            toast.success("Task deleted");
        },
        onError: (error) => toast.error(`Failed to delete task: ${error.message}`),
    });

    const handleBulkLeave = async (dates: string[], isLeave: boolean, type?: string, reason?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        for (const date of dates) {
            const { data: existing } = await supabase
                .from("daily_summaries")
                .select("id")
                .eq("user_id", user.id)
                .eq("date", date)
                .maybeSingle();

            const payload = {
                is_leave: isLeave,
                leave_type: isLeave ? type || "Other" : null,
                leave_reason: isLeave ? reason || null : null,
            };

            if (existing) {
                await supabase.from("daily_summaries").update(payload).eq("id", existing.id);
            } else {
                await supabase.from("daily_summaries").insert({
                    user_id: user.id,
                    date,
                    earned_points: 0,
                    possible_points: 0,
                    final_percentage: 0,
                    ...payload,
                });
            }
        }

        toast.success(isLeave ? `Marked ${dates.length} day(s) as Leave` : "Leave cancelled");
        queryClient.invalidateQueries({ queryKey: [KEYS.summary] });
        queryClient.invalidateQueries({ queryKey: [KEYS.stats] });
        queryClient.invalidateQueries({ queryKey: [KEYS.leaderboard] });
        queryClient.invalidateQueries({ queryKey: [KEYS.history] });
    };

    return { addTask, updateLog, toggleLeave: handleToggleLeave, bulkLeave: handleBulkLeave, deleteTask, followUser, unfollowUser };
};
