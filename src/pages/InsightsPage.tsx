import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Footprints, TrendingUp, Target, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useSteps } from "@/hooks/useSteps";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const InsightsPage = () => {
  const { user, profile } = useAuth();
  const { suggestions, loading, fetchSuggestions } = useAISuggestions();
  const { todaySteps, weeklySteps, logSteps } = useSteps();
  const [stepInput, setStepInput] = useState("");

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

  const totalWeeklySteps = weeklySteps.reduce((sum, d) => sum + (d.steps || 0), 0);
  const avgDailySteps = weeklySteps.length > 0 ? Math.round(totalWeeklySteps / weeklySteps.length) : 0;
  const totalWeeklyHours = weeklyStats.reduce((sum, d) => sum + Number(d.hours_focused || 0), 0);
  const totalWeeklyTasks = weeklyStats.reduce((sum, d) => sum + (d.tasks_completed || 0), 0);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build 7-day step chart
  const stepChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const dayData = weeklySteps.find(s => s.date === dateStr);
    return {
      day: days[date.getDay()],
      steps: dayData?.steps || 0,
      goal: dayData?.goal || 10000,
    };
  });

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-extrabold">Insights</h1>
        <p className="text-sm text-muted-foreground">AI-powered analysis & health tracking</p>
      </motion.div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, label: "Hours", value: `${totalWeeklyHours.toFixed(1)}h`, gradient: "gradient-primary" },
          { icon: Target, label: "Tasks", value: totalWeeklyTasks.toString(), gradient: "gradient-accent" },
          { icon: Footprints, label: "Avg Steps", value: avgDailySteps.toLocaleString(), gradient: "gradient-success" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-3 border border-border/50 shadow-card text-center"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.gradient} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-lg font-extrabold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Suggestions - Full */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Productivity Coach</h3>
              <p className="text-xs text-muted-foreground">Personalized insights based on your data</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSuggestions} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {loading && suggestions.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Analyzing your patterns...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap refresh to get AI-powered tips!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-2xl shrink-0">{s.emoji}</span>
                <div>
                  <p className="text-sm font-bold">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Step Tracking Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-sm">Weekly Steps</h3>
          </div>
          <span className="text-xs text-muted-foreground">{totalWeeklySteps.toLocaleString()} total</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-28">
          {stepChartData.map((d, i) => {
            const maxSteps = Math.max(...stepChartData.map(s => s.goal), ...stepChartData.map(s => s.steps));
            const height = Math.max(4, (d.steps / maxSteps) * 100);
            const goalHeight = (d.goal / maxSteps) * 100;
            const isToday = i === 6;
            const metGoal = d.steps >= d.goal;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                {d.steps > 0 && <span className="text-[9px] font-bold">{(d.steps / 1000).toFixed(1)}k</span>}
                <div className="w-full relative" style={{ height: "80%" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                    className={`w-full rounded-t-md absolute bottom-0 ${metGoal ? "gradient-success" : isToday ? "gradient-accent" : "bg-accent/20"}`}
                  />
                </div>
                <span className={`text-[10px] ${isToday ? "text-accent font-bold" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Log Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
      >
        <h3 className="font-bold text-sm mb-3">Quick Log Steps</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Today: {(todaySteps?.steps || 0).toLocaleString()} steps
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
            placeholder="Enter total steps..."
            className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
          />
          <Button
            onClick={() => {
              const steps = parseInt(stepInput);
              if (!isNaN(steps) && steps >= 0) {
                logSteps.mutate(steps);
                setStepInput("");
              }
            }}
            className="gradient-primary text-primary-foreground"
            disabled={!stepInput || logSteps.isPending}
          >
            Log
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default InsightsPage;
