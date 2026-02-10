import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useSteps = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: todaySteps, isLoading } = useQuery({
    queryKey: ["daily_steps", user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("daily_steps")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; steps: number; goal: number; date: string } | null;
    },
    enabled: !!user,
  });

  const { data: weeklySteps = [] } = useQuery({
    queryKey: ["weekly_steps", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const { data, error } = await (supabase as any)
        .from("daily_steps")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", today)
        .order("date");
      if (error) throw error;
      return (data || []) as { id: string; steps: number; goal: number; date: string }[];
    },
    enabled: !!user,
  });

  const logSteps = useMutation({
    mutationFn: async (steps: number) => {
      if (!user) throw new Error("Not authenticated");

      if (todaySteps) {
        const { error } = await (supabase as any)
          .from("daily_steps")
          .update({ steps })
          .eq("id", todaySteps.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("daily_steps")
          .insert({ user_id: user.id, date: today, steps });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_steps"] });
      queryClient.invalidateQueries({ queryKey: ["weekly_steps"] });
      toast({ title: "Steps logged! 🚶" });
    },
    onError: (error: any) => {
      toast({ title: "Error logging steps", description: error.message, variant: "destructive" });
    },
  });

  return { todaySteps, weeklySteps, isLoading, logSteps };
};
