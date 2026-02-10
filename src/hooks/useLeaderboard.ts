import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  total_hours: number;
  streak_days: number;
  level: number;
}

export const useLeaderboard = (circleId?: string, period: "daily" | "weekly" = "daily") => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard", circleId, period],
    queryFn: async () => {
      // Get date range
      const now = new Date();
      const startDate = period === "daily"
        ? now.toISOString().split("T")[0]
        : new Date(now.setDate(now.getDate() - 7)).toISOString().split("T")[0];

      // 1. Get Target Users
      let targetUserIds: string[] | null = null;
      if (circleId) {
        const { data: members } = await supabase
          .from("circle_members")
          .select("user_id")
          .eq("circle_id", circleId);

        if (!members || members.length === 0) return [];
        targetUserIds = members.map(m => m.user_id);
      }

      // 2. Fetch Profiles (Apply limit for global to avoid performance hit, e.g., 100)
      let profilesQuery = supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, level, streak_days, total_hours");

      if (targetUserIds) {
        profilesQuery = profilesQuery.in("user_id", targetUserIds);
      } else {
        profilesQuery = profilesQuery.limit(100); // Global limit
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      // 3. Fetch Stats for these users
      const profileIds = profiles.map(p => p.user_id);
      const { data: stats, error: statsError } = await supabase
        .from("daily_stats")
        .select("user_id, points, hours_focused, tasks_completed")
        .gte("date", startDate)
        .in("user_id", profileIds);

      if (statsError) throw statsError;

      // 4. Aggregate stats
      const userStats: Record<string, { points: number; hours: number; tasks: number }> = {};
      stats?.forEach((s) => {
        if (!userStats[s.user_id]) {
          userStats[s.user_id] = { points: 0, hours: 0, tasks: 0 };
        }
        userStats[s.user_id].points += s.points || 0;
        userStats[s.user_id].hours += Number(s.hours_focused) || 0;
        userStats[s.user_id].tasks += s.tasks_completed || 0;
      });

      // 5. Build Leaderboard
      const leaderboard: LeaderboardEntry[] = profiles.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        total_points: userStats[p.user_id]?.points || 0,
        total_hours: userStats[p.user_id]?.hours || 0,
        streak_days: p.streak_days || 0,
        level: p.level || 1,
      }));

      // Sort by points desc
      return leaderboard.sort((a, b) => b.total_points - a.total_points);
    },
    enabled: !!user,
  });

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_stats" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { leaderboard, isLoading };
};
