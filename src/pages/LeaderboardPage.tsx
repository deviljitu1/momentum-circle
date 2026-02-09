import { useState } from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { mockLeaderboard } from "@/lib/mockData";

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const sorted = [...mockLeaderboard].sort((a, b) => b.points - a.points);
  const maxPoints = sorted[0]?.points || 1;

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-extrabold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Compete with your circle</p>
      </motion.div>

      {/* Period Toggle */}
      <div className="flex bg-muted rounded-xl p-1">
        {(["daily", "weekly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              period === p ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-end justify-center gap-3 pt-4 pb-2"
      >
        {[sorted[1], sorted[0], sorted[2]].map((user, i) => {
          if (!user) return null;
          const heights = [80, 100, 64];
          const sizes = ["w-14 h-14", "w-18 h-18", "w-12 h-12"];
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          return (
            <motion.div
              key={user.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className={`relative ${i === 1 ? "w-[72px] h-[72px]" : "w-14 h-14"} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg mb-2`}>
                {user.name[0]}
                {actualRank === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Crown className="w-5 h-5 text-warning fill-warning" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold truncate max-w-[70px] text-center">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.points} pts</span>
              <div
                className={`w-16 mt-2 rounded-t-lg ${actualRank === 1 ? "gradient-hero" : actualRank === 2 ? "bg-primary/30" : "bg-accent/30"}`}
                style={{ height: heights[i] }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Full Ranking */}
      <div className="space-y-2">
        {sorted.map((user, i) => (
          <LeaderboardItem key={user.id} user={user} rank={i + 1} maxPoints={maxPoints} />
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
