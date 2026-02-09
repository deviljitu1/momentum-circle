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

      // If we have a circle, get members first
      let userIds: string[] = [];
      if (circleId) {
        const { data: members } = await supabase
          .from("circle_members")
          .select("user_id")
          .eq("circle_id", circleId);
        
        userIds = members?.map(m => m.user_id) || [];
        if (userIds.length === 0) return [];
      }

      // Get daily stats aggregated
      let query = supabase
        .from("daily_stats")
        .select("user_id, points, hours_focused, tasks_completed")
        .gte("date", startDate);
      
      if (circleId && userIds.length > 0) {
        query = query.in("user_id", userIds);
      }

      const { data: stats, error: statsError } = await query;
      if (statsError) throw statsError;

      // Aggregate by user
      const userStats: Record<string, { points: number; hours: number; tasks: number }> = {};
      stats?.forEach((s) => {
        if (!userStats[s.user_id]) {
          userStats[s.user_id] = { points: 0, hours: 0, tasks: 0 };
        }
        userStats[s.user_id].points += s.points || 0;
        userStats[s.user_id].hours += Number(s.hours_focused) || 0;
        userStats[s.user_id].tasks += s.tasks_completed || 0;
      });

      // Get profile info
      const userIdsToFetch = Object.keys(userStats);
      if (userIdsToFetch.length === 0) {
        // No stats yet, just show profiles with 0 points
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, level, streak_days, total_hours")
          .limit(20);
        
        return (profiles || []).map(p => ({
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          total_points: 0,
          total_hours: Number(p.total_hours) || 0,
          streak_days: p.streak_days || 0,
          level: p.level || 1,
        }));
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, level, streak_days")
        .in("user_id", userIdsToFetch);
      
      if (profilesError) throw profilesError;

      // Combine and sort
      const leaderboard: LeaderboardEntry[] = (profiles || []).map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        total_points: userStats[p.user_id]?.points || 0,
        total_hours: userStats[p.user_id]?.hours || 0,
        streak_days: p.streak_days || 0,
        level: p.level || 1,
      }));

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
