import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Loader2 } from "lucide-react";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const { leaderboard, isLoading } = useLeaderboard(undefined, period);
  const { user } = useAuth();

  const maxPoints = leaderboard[0]?.total_points || 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="pb-24 px-4 pt-6 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-extrabold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Compete with your friends</p>
      </motion.div>

      {/* Period Toggle */}
      <div className="flex bg-muted rounded-xl p-1">
        {(["daily", "weekly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${period === p ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
              }`}
          >
            {p}
          </button>
        ))}
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">🏆</p>
          <p className="font-medium">No rankings yet</p>
          <p className="text-sm">Complete tasks and focus sessions to earn points!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-end justify-center gap-3 pt-4 pb-2"
            >
              {podiumOrder.map((entry, i) => {
                if (!entry) return null;
                const heights = [80, 100, 64];
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const isYou = entry.user_id === user?.id;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`relative ${i === 1 ? "w-[72px] h-[72px]" : "w-14 h-14"} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg mb-2`}>
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        entry.display_name[0]
                      )}
                      {actualRank === 1 && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Crown className="w-5 h-5 text-warning fill-warning" />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-semibold truncate max-w-[70px] text-center ${isYou ? "text-primary" : ""}`}>
                      {isYou ? "You" : entry.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.percentage !== undefined ? `${entry.percentage}%` : `${entry.total_points} pts`}
                    </span>
                    <div
                      className={`w-16 mt-2 rounded-t-lg ${actualRank === 1 ? "gradient-hero" : actualRank === 2 ? "bg-primary/30" : "bg-accent/30"}`}
                      style={{ height: heights[i] }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Full Ranking */}
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <LeaderboardItem
                key={entry.user_id}
                user={{
                  id: entry.user_id,
                  name: entry.user_id === user?.id ? "You" : entry.display_name,
                  avatar: entry.avatar_url || "",
                  points: entry.total_points,
                  hours: entry.total_hours,
                  streak: entry.streak_days,
                  percentage: entry.percentage,
                  target: entry.target_hours,
                }}
                rank={i + 1}
                maxPoints={maxPoints}
                prevUserPoints={i > 0 ? leaderboard[i - 1].total_points : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
