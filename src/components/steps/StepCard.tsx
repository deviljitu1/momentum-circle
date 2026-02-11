import { motion } from "framer-motion";
import { Footprints, RefreshCw, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useSteps } from "@/hooks/useSteps";

const StepCard = () => {
    const { todaySteps, isLoading, isError, refetch } = useSteps();

    const steps = todaySteps?.steps || 0;
    const goal = todaySteps?.goal || 10000;
    const progress = Math.min(100, Math.round((steps / goal) * 100));
    const lastSynced = todaySteps?.updated_at ? new Date(todaySteps.updated_at) : null;

    if (isError) {
        return (
            <div className="p-4 border border-destructive/50 rounded-xl bg-destructive/10 text-destructive text-center">
                <p>Failed to load step data.</p>
                <Button variant="link" onClick={() => refetch()} className="text-destructive underline">Retry</Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-sm relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Footprints className="w-32 h-32 -rotate-12" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                            <Footprints className="w-5 h-5 text-primary" /> Today's Steps
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-5xl font-extrabold tracking-tight text-foreground">
                                {isLoading ? "..." : steps.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">/ {goal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        {lastSynced && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                                <RefreshCw className="w-3 h-3 animate-pulse" />
                                {formatDistanceToNow(lastSynced, { addSuffix: true })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-4 rounded-full" indicatorClassName="gradient-primary" />
                </div>

                {progress >= 100 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-600 dark:text-yellow-400"
                    >
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold text-sm">Daily Goal Achieved! Great job!</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default StepCard;
