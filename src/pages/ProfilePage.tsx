import { motion } from "framer-motion";
import { Flame, Clock, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

const ProfilePage = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const { data: badges = [] } = useQuery({
    queryKey: ["badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: weeklyStats = [] } = useQuery({
    queryKey: ["weekly_stats", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const { data } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date");

      return data || [];
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    totalHours: Number(profile?.total_hours || 0),
    tasksCompleted: profile?.tasks_completed || 0,
    streak: profile?.streak_days || 0,
    level: profile?.level || 1,
    xp: profile?.xp || 0,
    nextLevelXp: (profile?.level || 1) * 500,
  };

  const levelProgress = stats.nextLevelXp > 0 ? (stats.xp / stats.nextLevelXp) * 100 : 0;

  // Build weekly hours from stats
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyHours = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStats = weeklyStats.find(s => s.date === date.toISOString().split("T")[0]);
    return {
      day: days[date.getDay()],
      hours: Number(dayStats?.hours_focused || 0),
    };
  });

  // Default badges if none earned
  const defaultBadges = [
    { badge_name: "Early Bird", badge_emoji: "🌅", unlocked: badges.some(b => b.badge_name === "Early Bird") },
    { badge_name: "Week Warrior", badge_emoji: "⚔️", unlocked: badges.some(b => b.badge_name === "Week Warrior") },
    { badge_name: "Century Club", badge_emoji: "💯", unlocked: badges.some(b => b.badge_name === "Century Club") },
    { badge_name: "Deep Focus", badge_emoji: "🧠", unlocked: badges.some(b => b.badge_name === "Deep Focus") },
    { badge_name: "Team Player", badge_emoji: "🤝", unlocked: badges.some(b => b.badge_name === "Team Player") },
    { badge_name: "Night Owl", badge_emoji: "🦉", unlocked: badges.some(b => b.badge_name === "Night Owl") },
    { badge_name: "Speedster", badge_emoji: "⚡", unlocked: badges.some(b => b.badge_name === "Speedster") },
    { badge_name: "Consistent", badge_emoji: "📈", unlocked: badges.some(b => b.badge_name === "Consistent") },
  ];

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground text-2xl font-extrabold">
            {profile?.display_name?.[0] || "?"}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{profile?.display_name || "Your Profile"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full gradient-primary text-primary-foreground font-semibold">
                Level {stats.level}
              </span>
              <span className="text-xs text-muted-foreground">{stats.xp}/{stats.nextLevelXp} XP</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut}>
          <LogOut className="w-5 h-5" />
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
          { icon: Clock, label: "Hours", value: `${stats.totalHours.toFixed(1)}h`, color: "text-primary" },
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
            const height = Math.max(4, (d.hours / 8) * 100);
            const isToday = i === 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                {d.hours > 0 && <span className="text-[10px] font-bold">{d.hours.toFixed(1)}h</span>}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                  className={`w-full rounded-t-md ${isToday ? "gradient-hero" : "gradient-primary"}`}
                />
                <span className={`text-[10px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="font-bold text-sm mb-3">Badges</h3>
        <div className="grid grid-cols-4 gap-3">
          {defaultBadges.map((badge, i) => (
            <motion.div
              key={badge.badge_name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.05, type: "spring", stiffness: 300 }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-border/50 ${badge.unlocked ? "bg-card shadow-card" : "bg-muted/50 opacity-40"
                }`}
            >
              <span className="text-2xl">{badge.badge_emoji}</span>
              <span className="text-[10px] font-semibold text-center leading-tight">{badge.badge_name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Account Info */}
      <div className="bg-card rounded-xl p-4 border border-border/50 text-sm text-muted-foreground space-y-3">
        <p>Signed in as: {user?.email}</p>

        {isAdmin && (
          <Button
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => navigate("/admin")}
          >
            Access Admin Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
