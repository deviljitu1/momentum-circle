
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Crown, Trophy, AlertTriangle } from "lucide-react";
import { useProductivityLeaderboard } from "@/hooks/useProductivity";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const LeaderboardPage = () => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: leaderboard, isLoading } = useProductivityLeaderboard(date);
  const { user } = useAuth();

  const top3 = leaderboard?.slice(0, 3) || [];
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Rankings for {date === format(new Date(), "yyyy-MM-dd") ? "Today" : date}
        </p>
      </motion.div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 py-8">
          {podiumOrder.map((entry, i) => {
            if (!entry) return null;
            // Re-map index for height: Center (0 in podiumOrder?) No.
            // podiumOrder is [2nd, 1st, 3rd] usually.
            // But my logic: top3[1] (2nd), top3[0] (1st), top3[2] (3rd).
            const isFirst = entry === top3[0];
            const isSecond = entry === top3[1];
            const isThird = entry === top3[2];

            const height = isFirst ? "h-32" : isSecond ? "h-24" : "h-20";
            const color = isFirst ? "bg-yellow-100 border-yellow-300 text-yellow-700" :
              isSecond ? "bg-gray-100 border-gray-300 text-gray-700" :
                "bg-orange-50 border-orange-200 text-orange-700";

            return (
              <motion.div
                key={entry.user_id}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="mb-2 relative">
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center bg-background ${isFirst ? 'border-yellow-400' : 'border-border'}`}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg">{entry.display_name[0]}</span>
                    )}
                  </div>
                  {isFirst && <Crown className="w-5 h-5 text-yellow-500 absolute -top-3 left-1/2 -translate-x-1/2" />}
                </div>
                <div className="text-xs font-bold mb-1 max-w-[80px] truncate">{entry.display_name}</div>
                <div className={`w-16 ${height} ${color} rounded-t-xl border-t border-x flex items-end justify-center pb-2`}>
                  <span className="font-bold">{Math.round(entry.final_percentage)}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {leaderboard && leaderboard.length > 0 ? (
          <div className="divide-y">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 flex items-center gap-4 ${entry.user_id === user?.id ? "bg-primary/5" : ""}`}
              >
                <div className="w-8 font-bold text-muted-foreground text-center">#{i + 1}</div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold">{entry.display_name?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.user_id === user?.id ? "You" : entry.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.is_leave ? "On Leave" : ""}
                    </div>
                  </div>
                </div>

                <div className="w-32 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Progress</span>
                    <span>{Math.round(entry.final_percentage)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${entry.final_percentage}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <p>No active participants today.</p>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Users on leave are hidden from the ranking.</p>
      </div>
    </div>
  );
};

export default LeaderboardPage;
