import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Target, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ConsistencyCalendar from "@/components/productivity/ConsistencyCalendar";
import LeaveSummaryCard from "@/components/insights/LeaveSummaryCard";

const InsightsPage = () => {
  const { user, profile } = useAuth();
  const { suggestions, loading, fetchSuggestions } = useAISuggestions();

  const { data: weeklyStats = [] } = useQuery({
    queryKey: ["weekly_stats_insights", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      const { data } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", start.toISOString().split("T")[0])
        .order("date");
      return data || [];
    },
    enabled: !!user,
  });

  const totalWeeklyHours = weeklyStats.reduce((sum, d) => sum + Number(d.hours_focused || 0), 0);
  const totalWeeklyTasks = weeklyStats.reduce((sum, d) => sum + (d.tasks_completed || 0), 0);

  return (
    <div className="pb-24 px-4 pt-6 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-extrabold">Insights</h1>
        <p className="text-sm text-muted-foreground">AI-powered analysis & productivity tracking</p>
      </motion.div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: TrendingUp, label: "Hours", value: `${totalWeeklyHours.toFixed(1)}h`, gradient: "gradient-primary" },
          { icon: Target, label: "Tasks", value: totalWeeklyTasks.toString(), gradient: "gradient-accent" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-4 border border-border/50 shadow-card text-center flex flex-col items-center justify-center hover:shadow-elevated transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.gradient} flex items-center justify-center mb-2 shadow-sm`}>
              <stat.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-xl font-extrabold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 border border-border/50 shadow-card flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-base">AI Productivity Coach</h3>
                <p className="text-xs text-muted-foreground">Personalized insights based on your data</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={fetchSuggestions} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>

          {loading && suggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
              <span className="text-sm font-medium">Analyzing your patterns...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium">No insights yet</p>
              <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                Tap refresh to get AI-powered tips based on your recent activity!
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-3xl shrink-0 mt-1">{s.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column: Tracking */}
        <div className="space-y-6">
          {/* Consistency Calendar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <ConsistencyCalendar />
          </motion.div>

          {/* Leave Summary */}
          <LeaveSummaryCard />
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;
