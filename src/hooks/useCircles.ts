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
  const { user } = useAuth();
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
        .select("*")
        .in("id", circleIds);
      
      if (error) throw error;
      return data as Circle[];
    },
    enabled: !!user,
  });

  const createCircle = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Create circle
      const { data: circle, error: circleError } = await supabase
        .from("circles")
        .insert({ name, description, created_by: user.id })
        .select()
        .single();
      
      if (circleError) throw circleError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({ circle_id: circle.id, user_id: user.id });
      
      if (memberError) throw memberError;

      // Create activity
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        circle_id: circle.id,
        activity_type: "joined_circle",
        title: `Created ${name}`,
        description: "Started a new circle!",
        points_earned: 50,
      });

      return circle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      toast({ title: "Circle created! 🎉" });
    },
    onError: (error: Error) => {
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
        description: "A new member joined the circle!",
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
    const { data, error } = await supabase
      .from("circle_members")
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          level,
          streak_days
        )
      `)
      .eq("circle_id", circleId);
    
    if (error) throw error;
    return data as unknown as CircleMember[];
  };

  return { circles, isLoading, createCircle, joinCircle, getCircleMembers };
};
