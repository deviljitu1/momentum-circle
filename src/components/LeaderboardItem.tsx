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
}

const rankIcons = [
  <Trophy className="w-5 h-5 text-warning" />,
  <Medal className="w-5 h-5 text-muted-foreground" />,
  <Award className="w-5 h-5 text-accent" />,
];

const LeaderboardItem = ({ user, rank, maxPoints }: LeaderboardItemProps) => {
  const barWidth = maxPoints > 0 ? (user.points / maxPoints) * 100 : 0;
  const isTop3 = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.4 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        isTop3 ? "bg-card shadow-card border border-border/50" : ""
      }`}
    >
      <div className="w-8 flex justify-center">
        {rank <= 3 ? rankIcons[rank - 1] : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>

      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm overflow-hidden">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          user.name[0]
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm truncate">{user.name}</span>
          <span className="text-sm font-bold text-primary">{user.points} pts</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-hero"
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ delay: rank * 0.08 + 0.3, duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">{user.hours}h focused</span>
          <span className="text-xs text-muted-foreground">🔥 {user.streak}d streak</span>
        </div>
      </div>
    </motion.div>
  );
};

export { LeaderboardItem };
export type { LeaderboardUser };
