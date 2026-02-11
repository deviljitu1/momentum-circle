import React from "react";
import { motion } from "framer-motion";
import { Footprints, RefreshCw, Trophy, Smartphone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useSteps } from "@/hooks/useSteps";
import { toast } from "sonner";

// Extend Window interface for Android Bridge
declare global {
    interface Window {
        Android?: {
            connect: () => void;
        };
    }
}

const StepCard = () => {
    const { todaySteps, isLoading, isError, refetch, logSteps } = useSteps();

    const steps = todaySteps?.steps || 0;
    const goal = todaySteps?.goal || 10000;
    const progress = Math.min(100, Math.round((steps / goal) * 100));
    const lastSynced = todaySteps?.updated_at ? new Date(todaySteps.updated_at) : null;

    // Bridge Listener
    React.useEffect(() => {
        // Expose function for Android to call
        (window as any).syncDailySteps = (androidSteps: number) => {
            toast.success(`Received ${androidSteps} steps from Health Connect!`);
            logSteps.mutate(androidSteps);
        };

        return () => {
            delete (window as any).syncDailySteps;
        };
    }, [logSteps]);

    const handleSync = () => {
        if (window.Android && window.Android.connect) {
            toast.info("Syncing with Samsung Health...");
            window.Android.connect();
        } else {
            toast.error("Please use our Android App to sync steps!", {
                description: "This feature requires the mobile app.",
                action: {
                    label: "Download",
                    onClick: () => window.open("/download", "_blank") // Placeholder
                }
            });
        }
    };

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
                    <div className="flex flex-col items-end gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                            onClick={handleSync}
                        >
                            <Smartphone className="w-3 h-3" /> Sync Steps
                        </Button>
                        {lastSynced && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
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
