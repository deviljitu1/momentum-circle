import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect } from "react";

export interface ActivityItem {
  id: string;
  user_id: string;
  circle_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  points_earned: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
  reactions?: {
    id: string;
    emoji: string;
    user_id: string;
  }[];
}

export const useActivityFeed = (circleId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity_feed", circleId],
    queryFn: async () => {
      // 1. Fetch activities
      let query = supabase
        .from("activity_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (circleId) {
        query = query.eq("circle_id", circleId);
      }

      const { data: activitiesData, error: activitiesError } = await query;
      if (activitiesError) throw activitiesError;

      if (!activitiesData || activitiesData.length === 0) return [];

      // 2. Fetch profiles
      const userIds = [...new Set(activitiesData.map(a => a.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]));

      // 3. Fetch reactions
      const activityIds = activitiesData.map(a => a.id);
      const { data: reactions, error: reactionsError } = await supabase
        .from("activity_reactions")
        .select("id, emoji, user_id, activity_id")
        .in("activity_id", activityIds);

      if (reactionsError) throw reactionsError;

      // Group reactions by activity_id
      const reactionsMap = new Map<string, any[]>();
      reactions?.forEach(r => {
        const existing = reactionsMap.get(r.activity_id) || [];
        existing.push(r);
        reactionsMap.set(r.activity_id, existing);
      });

      // 4. Merge
      return activitiesData.map(a => ({
        ...a,
        profiles: profilesMap.get(a.user_id),
        reactions: reactionsMap.get(a.id) || []
      })) as ActivityItem[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("activity-feed-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_feed" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activity_feed"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_reactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activity_feed"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const addReaction = useMutation({
    mutationFn: async ({ activityId, emoji }: { activityId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("activity_reactions")
        .select("id")
        .eq("activity_id", activityId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase.from("activity_reactions").delete().eq("id", existing.id);
      } else {
        // Add reaction
        await supabase.from("activity_reactions").insert({
          activity_id: activityId,
          user_id: user.id,
          emoji,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_feed"] });
    },
  });

  const createActivity = useCallback(async (
    type: "task_completed" | "focus_session" | "streak_milestone" | "badge_earned" | "joined_circle" | "level_up",
    title: string,
    description?: string,
    points?: number,
    circleId?: string
  ) => {
    if (!user) return;

    await supabase.from("activity_feed").insert({
      user_id: user.id,
      circle_id: circleId || null,
      activity_type: type,
      title,
      description: description || null,
      points_earned: points || 0,
    });
  }, [user]);

  return { activities, isLoading, addReaction, createActivity };
};
