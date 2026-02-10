import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AISuggestion {
  emoji: string;
  title: string;
  description: string;
}

export const useAISuggestions = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Gather user data
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];

      const [tasksRes, statsRes, stepsRes] = await Promise.all([
        supabase.from("tasks").select("title, completed, category, created_at").eq("user_id", user.id).gte("created_at", weekAgo.toISOString()),
        supabase.from("daily_stats").select("*").eq("user_id", user.id).gte("date", weekAgoStr),
        (supabase as any).from("daily_steps").select("*").eq("user_id", user.id).gte("date", weekAgoStr),
      ]);

      const { data: functionData, error: functionError } = await supabase.functions.invoke("ai-suggestions", {
        body: {
          tasks: tasksRes.data || [],
          dailyStats: statsRes.data || [],
          steps: stepsRes.data || [],
          profile,
        },
      });

      if (functionError) throw functionError;

      if (functionData?.error) {
        if (functionData.error.includes("Rate limited")) {
          toast({ title: "AI is busy", description: "Please try again in a moment.", variant: "destructive" });
        } else {
          throw new Error(functionData.error);
        }
        return;
      }

      setSuggestions(functionData?.suggestions || []);
    } catch (error: any) {
      console.error("AI suggestions error:", error);
      toast({ title: "Couldn't get AI suggestions", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, fetchSuggestions };
};
