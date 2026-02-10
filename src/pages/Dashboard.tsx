import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Flame, Zap, Target, TrendingUp, Loader2, Trophy, ArrowRight } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import FocusTimer from "@/components/FocusTimer";
import TaskCard from "@/components/TaskCard";
import StepTracker from "@/components/StepTracker";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { tasks, isLoading, toggleTask, addTask } = useTasks();
  const { createActivity } = useActivityFeed();
  const { leaderboard } = useLeaderboard(); // Fetch leaderboard
  const [showTimer, setShowTimer] = useState(false);
  const navigate = useNavigate();

  const todaysTasks = tasks.filter((t) => {
    const today = new Date().toISOString().split("T")[0];
    return t.created_at.startsWith(today);
  });

  const completedToday = todaysTasks.filter((t) => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
  const hoursToday = profile?.total_hours ? Number(profile.total_hours) : 0;
  const dailyGoal = 6;
  const streak = profile?.streak_days || 0;

  const handleToggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    toggleTask.mutate({ id, completed: task.completed });

    // If completing task, log activity and update stats
    if (!task.completed && user) {
      await createActivity("task_completed", `Completed: ${task.title}`, undefined, 10);

      // Update daily stats
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("daily_stats")
          .update({
            tasks_completed: (existing.tasks_completed || 0) + 1,
            points: (existing.points || 0) + 10,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("daily_stats").insert({
          user_id: user.id,
          date: today,
          tasks_completed: 1,
          points: 10,
        });
      }
    }
  }, [tasks, toggleTask, user, createActivity]);

  const handleTimerComplete = useCallback(async (seconds: number) => {
    if (!user) return;

    const hours = seconds / 3600;

    // Log focus session
    await supabase.from("focus_sessions").insert({
      user_id: user.id,
      duration_seconds: seconds,
      ended_at: new Date().toISOString(),
    });

    // Update daily stats
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const points = Math.floor(hours * 50);

    if (existing) {
      await supabase
        .from("daily_stats")
        .update({
          hours_focused: Number(existing.hours_focused || 0) + hours,
          points: (existing.points || 0) + points,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("daily_stats").insert({
        user_id: user.id,
        date: today,
        hours_focused: hours,
        points,
      });
    }

    // Update profile total hours
    await supabase
      .from("profiles")
      .update({ total_hours: Number(profile?.total_hours || 0) + hours })
      .eq("user_id", user.id);

    await createActivity("focus_session", `Focused for ${Math.floor(seconds / 60)} minutes`, undefined, points);

    setShowTimer(false);
  }, [user, profile, createActivity]);

  // Mock weekly data - in production this would come from daily_stats
  const weeklyHours = [
    { day: "Mon", hours: 4.5 },
    { day: "Tue", hours: 6.2 },
    { day: "Wed", hours: 3.8 },
    { day: "Thu", hours: 5.1 },
    { day: "Fri", hours: hoursToday },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()} 👋</p>
          <h1 className="text-2xl font-extrabold">{profile?.display_name || "Let's crush it!"}</h1>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-bold">{streak}d</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex justify-center py-4"
          >
            {showTimer ? (
              <FocusTimer onComplete={handleTimerComplete} />
            ) : (
              <ProgressRing progress={progress} size={220} strokeWidth={14}>
                <span className="text-5xl font-extrabold text-gradient-hero">{progress}%</span>
                <span className="text-sm text-muted-foreground mt-1">{completedToday}/{totalTasks} tasks</span>
              </ProgressRing>
            )}
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Zap, label: "Hours", value: `${hoursToday.toFixed(1)}h`, gradient: "gradient-primary" },
              { icon: Target, label: "Goal", value: `${Math.min(100, Math.round((hoursToday / dailyGoal) * 100))}%`, gradient: "gradient-accent" },
              { icon: TrendingUp, label: "Level", value: profile?.level || 1, gradient: "gradient-success" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
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

          {/* Focus Timer Toggle */}
          <Button
            onClick={() => setShowTimer(!showTimer)}
            className="w-full rounded-xl h-14 gradient-primary text-primary-foreground border-0 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            {showTimer ? "Back to Overview" : "🎯 Start Focus Session"}
          </Button>

          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-6 border border-border/50 shadow-card"
          >
            <h3 className="font-bold text-lg mb-4">Weekly Activity</h3>
            <div className="flex items-end justify-between gap-3 h-32">
              {weeklyHours.map((d, i) => {
                const height = Math.max(4, (d.hours / 8) * 100);
                const isToday = i === new Date().getDay() - 1;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className={`w-full rounded-t-lg transition-all ${isToday ? "gradient-hero shadow-lg shadow-primary/20" : "bg-muted hover:bg-primary/40"}`}
                    />
                    <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          <AISuggestionsCard />

          {/* Step Tracker */}
          <StepTracker />

          {/* Leaderboard Summary */}
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" /> Leaderboard
              </h3>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => navigate("/leaderboard")}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Join the competition!</p>
              ) : (
                leaderboard.slice(0, 3).map((entry, index) => {
                  const isYou = entry.user_id === user?.id;
                  return (
                    <div key={entry.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-6 text-center font-bold text-muted-foreground text-sm">
                        #{index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          entry.display_name[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold truncate ${isYou ? "text-primary" : ""}`}>
                            {isYou ? "You" : entry.display_name}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">{entry.total_points} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Today's Tasks</h3>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => navigate("/tasks")}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {todaysTasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-4xl mb-3">📝</p>
                <p className="font-medium">No tasks for today</p>
                <p className="text-sm mt-1">Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasks.slice(0, 5).map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={{
                      ...task,
                      categoryColor: "primary",
                      estimatedMins: task.estimated_mins,
                      loggedMins: task.logged_mins,
                    }}
                    onToggle={handleToggleTask}
                    index={i}
                  />
                ))}
                {todaysTasks.length > 5 && (
                  <Button variant="link" className="w-full text-muted-foreground" onClick={() => navigate("/tasks")}>
                    View all tasks
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
