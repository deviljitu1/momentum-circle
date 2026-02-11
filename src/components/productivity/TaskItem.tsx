import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Hash, Trash2, Edit2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductivityTask, TaskLog, TaskType } from "@/types/productivity";
import { useProductivityMutations } from "@/hooks/useProductivity";
import { cn } from "@/lib/utils";

interface TaskItemProps {
    task: ProductivityTask;
    log: TaskLog | null;
    date: string;
}

export const TaskItem = ({ task, log, date }: TaskItemProps) => {
    const { updateLog, deleteTask, editTask } = useProductivityMutations();
    const [val, setVal] = useState<string>(log?.actual_value?.toString() || "");
    const [completed, setCompleted] = useState<boolean>(log?.completed || false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Edit State
    const [editOpen, setEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editType, setEditType] = useState<TaskType>(task.task_type);
    const [editTarget, setEditTarget] = useState(task.target_value?.toString() || "");

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

    const handleEdit = async () => {
        if (!editTitle.trim()) return;

        await editTask.mutateAsync({
            id: task.id,
            title: editTitle,
            task_type: editType,
            target_value: editType === 'C' ? undefined : parseFloat(editTarget) || 1,
        });
        setEditOpen(false);
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
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Task</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Task Title"
                                    />
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <Select value={editType} onValueChange={(v: TaskType) => setEditType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Duration (Time)</SelectItem>
                                            <SelectItem value="B">Quantity (Units)</SelectItem>
                                            <SelectItem value="C">Binary (Yes/No)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {editType !== 'C' && (
                                    <div>
                                        <Label>Target {editType === 'A' ? '(Hours)' : '(Units)'}</Label>
                                        <Input
                                            type="number"
                                            value={editTarget}
                                            onChange={(e) => setEditTarget(e.target.value)}
                                            placeholder="e.g. 1.5"
                                        />
                                    </div>
                                )}
                                <Button onClick={handleEdit} disabled={editTask.isPending} className="w-full">
                                    {editTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask.mutate(task.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
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
