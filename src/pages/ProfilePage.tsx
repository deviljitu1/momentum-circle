import { motion } from "framer-motion";
import { Flame, Clock, CheckCircle2, Star, Settings, LogOut } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { mockBadges, weeklyHours, heatmapData } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

const ProfilePage = () => {
  const stats = {
    totalHours: 124,
    tasksCompleted: 287,
    streak: 7,
    level: 12,
    xp: 1920,
    nextLevelXp: 2500,
  };

  const levelProgress = (stats.xp / stats.nextLevelXp) * 100;

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground text-2xl font-extrabold">
            Y
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Your Profile</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full gradient-primary text-primary-foreground font-semibold">
                Level {stats.level}
              </span>
              <span className="text-xs text-muted-foreground">{stats.xp}/{stats.nextLevelXp} XP</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* XP Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-hero"
          initial={{ width: 0 }}
          animate={{ width: `${levelProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: "Hours", value: `${stats.totalHours}h`, color: "text-primary" },
          { icon: CheckCircle2, label: "Tasks", value: stats.tasksCompleted.toString(), color: "text-success" },
          { icon: Flame, label: "Streak", value: `${stats.streak}d`, color: "text-accent" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-4 border border-border/50 shadow-card text-center"
          >
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
      >
        <h3 className="font-bold text-sm mb-3">Weekly Hours</h3>
        <div className="flex items-end justify-between gap-2 h-20">
          {weeklyHours.map((d, i) => {
            const height = (d.hours / 8) * 100;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold">{d.hours}h</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                  className="w-full rounded-t-md gradient-primary"
                />
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
      >
        <h3 className="font-bold text-sm mb-3">Activity Heatmap</h3>
        <div className="grid grid-cols-12 gap-1">
          {heatmapData.flat().map((val, i) => {
            const opacity = val === 0 ? "bg-muted" : val === 1 ? "bg-primary/20" : val === 2 ? "bg-primary/40" : val === 3 ? "bg-primary/60" : "bg-primary";
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.005 }}
                className={`aspect-square rounded-sm ${opacity}`}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="font-bold text-sm mb-3">Badges</h3>
        <div className="grid grid-cols-4 gap-3">
          {mockBadges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.05, type: "spring", stiffness: 300 }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-border/50 ${
                badge.unlocked ? "bg-card shadow-card" : "bg-muted/50 opacity-40"
              }`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-[10px] font-semibold text-center leading-tight">{badge.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
