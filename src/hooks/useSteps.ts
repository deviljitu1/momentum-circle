import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StepData {
  id: string;
  steps: number;
  goal: number;
  date: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  steps: number;
  profile: {
    display_name: string;
    avatar_url: string;
  } | null;
}

export const useSteps = () => {
  const { user } = useAuth();

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's steps with auto-refresh every 60s
  const { data: todaySteps, isLoading, isError, refetch } = useQuery({
    queryKey: ["daily_steps", user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("daily_steps")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as StepData | null;
    },
    enabled: !!user,
    refetchInterval: 60000, // Auto refresh every 60s
  });

  // Fetch weekly history
  const { data: weeklySteps = [] } = useQuery({
    queryKey: ["weekly_steps", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const { data, error } = await supabase
        .from("daily_steps")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", today)
        .order("date", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as StepData[];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Fetch Leaderboard (Global for today)
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["steps_leaderboard", today],
    queryFn: async () => {
      // 1. Fetch top 10 steps
      // Order by steps desc
      const { data: stepsData, error: stepsError } = await supabase
        .from("daily_steps")
        .select("user_id, steps")
        .eq("date", today)
        .order("steps", { ascending: false })
        .limit(10);

      if (stepsError) {
        console.error("Error fetching steps leaderboard:", stepsError);
        return [];
      }

      if (!stepsData || stepsData.length === 0) return [];

      const userIds = stepsData.map((s: any) => s.user_id);

      // 2. Fetch profiles. Assuming 'user_id' column in profiles matches auth.uid
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles for leaderboard:", profilesError);
        // Return fallback
        return stepsData.map((s: any) => ({
          user_id: s.user_id,
          steps: s.steps,
          profile: null
        }));
      }

      // 3. Merge
      return stepsData.map((s: any) => {
        const profile = profilesData?.find((p: any) => p.user_id === s.user_id);
        return {
          user_id: s.user_id,
          steps: s.steps,
          profile: profile ? {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url
          } : null
        };
      });
    },
    refetchInterval: 60000,
  });

  return { todaySteps, weeklySteps, leaderboard, isLoading, isError, refetch };
};
