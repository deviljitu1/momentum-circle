import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Flame, Zap, Target, TrendingUp, Loader2 } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import FocusTimer from "@/components/FocusTimer";
import TaskCard from "@/components/TaskCard";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { tasks, isLoading, toggleTask, addTask } = useTasks();
  const { createActivity } = useActivityFeed();
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
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-6">
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

      {/* Progress Ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex justify-center"
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
      <div className="grid grid-cols-3 gap-3">
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

      {/* Focus Timer Toggle */}
      <Button
        onClick={() => setShowTimer(!showTimer)}
        className="w-full rounded-xl h-12 gradient-primary text-primary-foreground border-0 text-base font-bold"
      >
        {showTimer ? "Back to Overview" : "🎯 Start Focus Session"}
      </Button>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
      >
        <h3 className="font-bold text-sm mb-3">This Week</h3>
        <div className="flex items-end justify-between gap-2 h-24">
          {weeklyHours.map((d, i) => {
            const height = Math.max(4, (d.hours / 8) * 100);
            const isToday = i === new Date().getDay() - 1;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                  className={`w-full rounded-t-md ${isToday ? "gradient-hero" : "bg-primary/20"}`}
                />
                <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Today's Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Today's Tasks</h3>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/tasks")}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        {todaysTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border/50">
            <p className="text-3xl mb-2">📝</p>
            <p className="font-medium">No tasks for today</p>
            <p className="text-sm">Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysTasks.slice(0, 4).map((task, i) => (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
