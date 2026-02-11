import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star } from "lucide-react";
import { useSteps } from "@/hooks/useSteps";

const StepsLeaderboard = () => {
    const { leaderboard, isLoading } = useSteps();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted" />
                        <div className="flex-1 bg-muted h-4 rounded" />
                        <div className="w-12 bg-muted h-4 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!leaderboard || leaderboard.length === 0) {
        return <div className="text-center p-4 text-muted-foreground">No leaderboard data available</div>;
    }

    return (
        <div className="mt-8 bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
            </h3>
            <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                    <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 border ${index === 0 ? "border-yellow-500/30 bg-yellow-500/5" :
                                index === 1 ? "border-slate-400/30 bg-slate-400/5" :
                                    index === 2 ? "border-orange-400/30 bg-orange-400/5" :
                                        "border-transparent"
                            }`}
                    >
                        <div className="w-6 text-center text-sm font-bold flex justify-center">
                            {index === 0 ? <Trophy className="w-5 h-5 text-yellow-500" /> :
                                index === 1 ? <Medal className="w-5 h-5 text-slate-400" /> :
                                    index === 2 ? <Medal className="w-5 h-5 text-orange-400" /> :
                                        <span className="text-muted-foreground">#{index + 1}</span>}
                        </div>
                        <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                            <AvatarImage src={entry.profile?.avatar_url} />
                            <AvatarFallback>{entry.profile?.display_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{entry.profile?.display_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground">{entry.steps.toLocaleString()} steps</p>
                        </div>
                        {index < 3 && <Star className={`w-4 h-4 ${index === 0 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default StepsLeaderboard;
