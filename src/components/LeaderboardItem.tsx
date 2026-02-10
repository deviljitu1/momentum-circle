import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  hours: number;
  streak: number;
}

interface LeaderboardItemProps {
  user: LeaderboardUser;
  rank: number;
  maxPoints: number;
  prevUserPoints?: number;
}

const rankIcons = [
  <Trophy className="w-5 h-5 text-warning" />,
  <Medal className="w-5 h-5 text-muted-foreground" />,
  <Award className="w-5 h-5 text-accent" />,
];

const LeaderboardItem = ({ user, rank, maxPoints, prevUserPoints }: LeaderboardItemProps) => {
  const barWidth = maxPoints > 0 ? (user.points / maxPoints) * 100 : 0;
  const isTop3 = rank <= 3;
  const pointsToNext = prevUserPoints ? prevUserPoints - user.points : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05, duration: 0.4 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isTop3 ? "bg-card shadow-card border border-border/50" : "hover:bg-muted/50"
        }`}
    >
      <div className="w-6 sm:w-8 flex justify-center shrink-0">
        {rank <= 3 ? rankIcons[rank - 1] : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>

      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm overflow-hidden shrink-0 shadow-sm">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          user.name[0]
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm truncate mr-2">{user.name}</span>
          <span className="text-sm font-bold text-primary shrink-0">{user.points} pts</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-hero"
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ delay: rank * 0.05 + 0.2, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {pointsToNext > 0 && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline-block">
              -{pointsToNext} to next
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{user.hours.toFixed(1)}h focused</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded border border-orange-500/20">🔥 {user.streak}d streak</span>
          {pointsToNext > 0 && (
            <span className="text-[10px] text-muted-foreground sm:hidden">
              ↑ {pointsToNext} pts
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { LeaderboardItem };
export type { LeaderboardUser };
