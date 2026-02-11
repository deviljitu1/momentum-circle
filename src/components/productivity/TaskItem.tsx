
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Hash, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProductivityTask, TaskLog } from "@/types/productivity";
import { useProductivityMutations } from "@/hooks/useProductivity";
import { cn } from "@/lib/utils";

interface TaskItemProps {
    task: ProductivityTask;
    log: TaskLog | null;
    date: string;
}

export const TaskItem = ({ task, log, date }: TaskItemProps) => {
    const { updateLog } = useProductivityMutations();
    const [val, setVal] = useState<string>(log?.actual_value?.toString() || "");
    const [completed, setCompleted] = useState<boolean>(log?.completed || false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        setVal(log?.actual_value?.toString() || "");
        setCompleted(log?.completed || false);
    }, [log]);

    const handleValueChange = (v: string) => {
        setVal(v);
    };

    const handleBlur = () => {
        if (val === (log?.actual_value?.toString() || "")) return;

        const num = parseFloat(val);
        if (isNaN(num)) return;

        setIsSyncing(true);
        updateLog.mutate(
            { taskId: task.id, date, actualValue: num },
            { onSettled: () => setIsSyncing(false) }
        );
    };

    const handleCheck = (checked: boolean) => {
        setCompleted(checked);
        setIsSyncing(true);
        updateLog.mutate(
            { taskId: task.id, date, completed: checked },
            { onSettled: () => setIsSyncing(false) }
        );
    };

    // Calculate progress for display
    const progress = task.task_type === 'C'
        ? (completed ? 100 : 0)
        : Math.min(((parseFloat(val) || 0) / (task.target_value || 1)) * 100, 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-4 rounded-xl border bg-card/50 backdrop-blur-sm transition-all shadow-sm hover:shadow-md",
                completed || progress >= 100 ? "border-primary/50 bg-primary/5" : "border-border"
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        task.task_type === 'A' ? "bg-blue-100 text-blue-600" :
                            task.task_type === 'B' ? "bg-purple-100 text-purple-600" :
                                "bg-green-100 text-green-600"
                    )}>
                        {task.task_type === 'A' ? <Clock className="w-4 h-4" /> :
                            task.task_type === 'B' ? <Hash className="w-4 h-4" /> :
                                <Check className="w-4 h-4" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <p className="text-xs text-muted-foreground">
                            {task.task_type === 'A' ? `${task.target_value} hrs target` :
                                task.task_type === 'B' ? `${task.target_value} units target` :
                                    "Daily completion"}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
                </div>
            </div>

            <div className="space-y-2">
                <Progress value={progress} className="h-2" />

                <div className="flex items-center justify-between pt-2">
                    {task.task_type === 'C' ? (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={completed}
                                onCheckedChange={handleCheck}
                                id={`task-${task.id}`}
                            />
                            <label htmlFor={`task-${task.id}`} className="text-sm font-medium cursor-pointer">
                                Mark Completed
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={val}
                                onChange={(e) => handleValueChange(e.target.value)}
                                onBlur={handleBlur}
                                className="w-24 h-8 text-sm"
                                placeholder="0"
                            />
                            <span className="text-sm text-muted-foreground">
                                / {task.target_value} {task.task_type === 'A' ? 'hrs' : 'units'}
                            </span>
                        </div>
                    )}

                    {isSyncing && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
                </div>
            </div>
        </motion.div>
    );
};
