import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Flame, Zap, Target, TrendingUp } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import FocusTimer from "@/components/FocusTimer";
import TaskCard from "@/components/TaskCard";
import { mockTasks, weeklyHours } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [showTimer, setShowTimer] = useState(false);

  const completedToday = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
  const hoursToday = 4.2;
  const dailyGoal = 6;
  const streak = 7;

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good morning 👋</p>
          <h1 className="text-2xl font-extrabold">Let's crush it today!</h1>
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
          <FocusTimer onComplete={() => setShowTimer(false)} />
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
          { icon: Zap, label: "Hours", value: `${hoursToday}h`, gradient: "gradient-primary" },
          { icon: Target, label: "Goal", value: `${Math.round((hoursToday / dailyGoal) * 100)}%`, gradient: "gradient-accent" },
          { icon: TrendingUp, label: "Points", value: "1,920", gradient: "gradient-success" },
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
            const height = (d.hours / 8) * 100;
            const isToday = i === 4;
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
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 4).map((task, i) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
