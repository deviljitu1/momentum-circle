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
    <div className="pb-24 px-4 pt-6 max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground text-3xl font-extrabold shadow-lg shadow-primary/20">
            {profile?.display_name?.[0] || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{profile?.display_name || "Your Profile"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full gradient-primary text-primary-foreground font-semibold">
                Level {stats.level}
              </span>
              <span className="text-xs text-muted-foreground font-medium">{stats.xp}/{stats.nextLevelXp} XP</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleSignOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* XP Bar */}
      <div className="h-4 bg-muted/50 rounded-full overflow-hidden border border-border/50">
        <motion.div
          className="h-full rounded-full gradient-hero shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${levelProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
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
                className="bg-card rounded-xl p-5 border border-border/50 shadow-card text-center flex flex-col items-center justify-center hover:shadow-elevated transition-shadow"
              >
                <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-border/50 shadow-card"
          >
            <h3 className="font-bold text-lg mb-6">Weekly Hours</h3>
            <div className="flex items-end justify-between gap-3 h-40">
              {weeklyHours.map((d, i) => {
                const height = Math.max(4, (d.hours / 8) * 100);
                const isToday = i === 6;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    {d.hours > 0 && <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">{d.hours.toFixed(1)}h</span>}
                    <div className="w-full relative flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                        className={`w-full rounded-t-lg transition-all ${isToday ? "gradient-hero shadow-lg shadow-primary/20" : "bg-primary/20 hover:bg-primary/40"}`}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${isToday ? "text-primary bg-primary/10 px-2 py-0.5 rounded" : "text-muted-foreground"}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <h3 className="font-bold text-lg">Account</h3>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Signed in as:</span>
              <p className="font-medium truncate">{user?.email}</p>
            </div>

            {isAdmin && (
              <Button
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20"
                onClick={() => navigate("/admin")}
              >
                Access Admin Dashboard
              </Button>
            )}
          </div>

          {/* Badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h3 className="font-bold text-lg mb-4 px-1">Badges</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {defaultBadges.map((badge, i) => (
                <motion.div
                  key={badge.badge_name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.05, type: "spring", stiffness: 300 }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 text-center transition-all aspect-square justify-center ${badge.unlocked
                    ? "bg-card shadow-card hover:shadow-elevated hover:scale-105"
                    : "bg-muted/30 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                    }`}
                  title={badge.badge_name}
                >
                  <span className="text-3xl filter drop-shadow-sm">{badge.badge_emoji}</span>
                  <span className="text-[10px] font-bold leading-tight line-clamp-2">{badge.badge_name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
