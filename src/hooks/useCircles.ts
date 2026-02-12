import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Circle {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string | null;
  created_at: string;
  member_count?: number;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    level: number;
    streak_days: number;
  };
}

export const useCircles = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: circles = [], isLoading } = useQuery({
    queryKey: ["circles", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get circles user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const circleIds = memberData.map((m) => m.circle_id);
      if (circleIds.length === 0) return [];

      const { data, error } = await supabase
        .from("circles")
        .select("*, circle_members(count)")
        .in("id", circleIds);

      if (error) throw error;

      return data.map((c: any) => ({
        ...c,
        member_count: c.circle_members?.[0]?.count || 0,
        is_creator: c.created_by === user.id
      })) as (Circle & { is_creator: boolean })[];
    },
    enabled: !!user,
  });

  const createCircle = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error("Not authenticated");

      console.log("Creating circle:", { name, description, user_id: user.id });

      // Create circle
      const { data: circle, error: circleError } = await supabase
        .from("circles")
        .insert({ name, description, created_by: user.id })
        .select()
        .single();

      if (circleError) {
        console.error("Error creating circle:", circleError);
        throw circleError;
      }

      console.log("Circle created:", circle);

      // Add creator as member
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({ circle_id: circle.id, user_id: user.id });

      if (memberError) {
        console.error("Error adding member:", memberError);
        // Try to cleanup if possible, or just throw
        throw memberError;
      }

      // Create activity (best effort)
      try {
        await supabase.from("activity_feed").insert({
          user_id: user.id,
          circle_id: circle.id,
          activity_type: "joined_circle",
          title: `Created ${name}`,
          description: "Started a new circle!",
          points_earned: 50,
        });
      } catch (activityError) {
        console.warn("Failed to log activity:", activityError);
      }

      return circle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      toast({ title: "Circle created! 🎉" });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const joinCircle = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error("Not authenticated");

      // Find circle by invite code
      const { data: circle, error: findError } = await supabase
        .from("circles")
        .select("*")
        .eq("invite_code", inviteCode.toLowerCase().trim())
        .maybeSingle();

      if (findError) throw findError;
      if (!circle) throw new Error("Circle not found. Check the invite code.");

      // Check if already a member
      const { data: existing } = await supabase
        .from("circle_members")
        .select("id")
        .eq("circle_id", circle.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) throw new Error("You're already in this circle!");

      // Join circle
      const { error: joinError } = await supabase
        .from("circle_members")
        .insert({ circle_id: circle.id, user_id: user.id });

      if (joinError) throw joinError;

      // Create activity
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        circle_id: circle.id,
        activity_type: "joined_circle",
        title: `Joined ${circle.name}`,
        description: `${profile?.display_name || "A new member"} joined the circle!`,
        points_earned: 25,
      });

      return circle;
    },
    onSuccess: (circle) => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      toast({ title: `Joined ${circle.name}! 🙌` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getCircleMembers = async (circleId: string): Promise<CircleMember[]> => {
    // 1. Get members
    const { data: members, error: membersError } = await supabase
      .from("circle_members")
      .select("*")
      .eq("circle_id", circleId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    // 2. Get profiles
    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, level, streak_days")
      .in("user_id", userIds);

    if (profilesError) throw profilesError;

    // 3. Merge
    const profilesMap = new Map(profiles.map((p) => [p.user_id, p]));

    return members.map((m) => ({
      ...m,
      profiles: profilesMap.get(m.user_id),
    })) as CircleMember[];
  };

  const removeMember = useMutation({
    mutationFn: async ({ circleId, userId }: { circleId: string; userId: string }) => {
      const { error } = await supabase
        .from("circle_members")
        .delete()
        .eq("circle_id", circleId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      toast({ title: "Member removed 👋" });
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Error removing member", description: "You might not have permission.", variant: "destructive" });
    },
  });

  return { circles, isLoading, createCircle, joinCircle, getCircleMembers, removeMember };
};
