import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: string;
  estimated_mins: number;
  completed: boolean;
  logged_mins: number;
  completed_at: string | null;
  created_at: string;
}

export const useTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  const addTask = useMutation({
    mutationFn: async ({ title, category, estimated_mins }: { title: string; category: string; estimated_mins: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ user_id: user.id, title, category, estimated_mins })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Task added! 📝" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const newCompletedStatus = !completed;
      const today = new Date().toISOString().split("T")[0];

      // Get the task details first
      const { data: taskData } = await supabase
        .from("tasks")
        .select("title, user_id")
        .eq("id", id)
        .single();

      if (!taskData) throw new Error("Task not found");

      // Update the task in the tasks table
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: newCompletedStatus,
          completed_at: newCompletedStatus ? new Date().toISOString() : null
        })
        .eq("id", id);

      if (error) throw error;

      // Update both old and new productivity tracking systems
      if (user) {
        // 1. Update daily_stats (old leaderboard system)
        const { data: existingStats } = await supabase
          .from("daily_stats")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        const tasksCompletedDelta = newCompletedStatus ? 1 : -1;
        const pointsDelta = newCompletedStatus ? 10 : -10;

        if (existingStats) {
          await supabase
            .from("daily_stats")
            .update({
              tasks_completed: Math.max(0, (existingStats.tasks_completed || 0) + tasksCompletedDelta),
              points: Math.max(0, (existingStats.points || 0) + pointsDelta),
              updated_at: new Date().toISOString()
            })
            .eq("id", existingStats.id);
        } else {
          await supabase
            .from("daily_stats")
            .insert({
              user_id: user.id,
              date: today,
              tasks_completed: newCompletedStatus ? 1 : 0,
              points: newCompletedStatus ? 10 : 0,
              hours_focused: 0
            });
        }

        // 2. Update productivity system (new leaderboard system)
        // Directly update daily_summaries instead of creating task_logs
        // This avoids schema conflicts with the tasks table
        const { data: existingSummary } = await supabase
          .from("daily_summaries")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        // Count total tasks for the user
        const { count: totalTasks } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Count completed tasks for today
        const { count: completedTasks } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true);

        const tasksCount = totalTasks || 0;
        const completedCount = completedTasks || 0;

        // Calculate percentage: (completed tasks / total tasks) * 100
        const finalPercentage = tasksCount > 0 ? (completedCount / tasksCount) * 100 : 0;
        const earnedPoints = completedCount * 100;
        const possiblePoints = tasksCount * 100;

        // Update daily_summaries (for Leaderboard)
        if (existingSummary) {
          // Update existing summary
          await supabase
            .from("daily_summaries")
            .update({
              earned_points: earnedPoints,
              possible_points: possiblePoints,
              final_percentage: finalPercentage
            })
            .eq("id", existingSummary.id);
        } else {
          // Create new summary
          await supabase
            .from("daily_summaries")
            .insert({
              user_id: user.id,
              date: today,
              earned_points: earnedPoints,
              possible_points: possiblePoints,
              final_percentage: finalPercentage,
              is_leave: false
            });
        }

        // 3. Update profiles (for XP/Level display)
        // Add 15 XP for completing a task, remove 15 if unchecking
        // Also update total tasks completed count
        const xpDelta = newCompletedStatus ? 15 : -15;
        const itemsCompletedDelta = newCompletedStatus ? 1 : -1;

        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, tasks_completed, level")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          const newXp = Math.max(0, (profile.xp || 0) + xpDelta);
          const newTasksCompleted = Math.max(0, (profile.tasks_completed || 0) + itemsCompletedDelta);

          // Simple level calculation: Level up every 100 XP
          const newLevel = Math.floor(newXp / 100) + 1;

          await supabase
            .from("profiles")
            .update({
              xp: newXp,
              tasks_completed: newTasksCompleted,
              level: newLevel,
              last_active_date: today
            })
            .eq("user_id", user.id);
        }
      }
    },
    onMutate: async ({ id, completed }) => {
      // 1. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks", user?.id] });

      // 2. Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", user?.id]);

      // 3. Optimistically update to the new value
      queryClient.setQueryData<Task[]>(["tasks", user?.id], (old) => {
        if (!old) return [];
        return old.map((task) =>
          task.id === id
            ? { ...task, completed: !completed, completed_at: !completed ? new Date().toISOString() : null }
            : task
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", user?.id], context.previousTasks);
      }
      toast({ title: "Failed to update task", variant: "destructive" });
    },
    onSuccess: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["productivity_leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["productivity_summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, title, category, estimated_mins }: { id: string; title: string; category: string; estimated_mins: number }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ title, category, estimated_mins })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Task updated! ✨" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { tasks, isLoading, addTask, toggleTask, deleteTask, updateTask };
};
