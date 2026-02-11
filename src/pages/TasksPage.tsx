
import { useState } from "react";
import {
  format,
  addDays,
  subDays,
  isSameDay
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Calendar as CalendarIcon,
  Loader2,
  Trophy,
  Plane
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Ensure this exists or use input type="date"
// If Calendar component doesn't exist, I'll fallback to native date input or simple controls.

import { TaskItem } from "@/components/productivity/TaskItem";
import { useProductivityTasks, useDailySummary, useChallengeStats, useProductivityMutations } from "@/hooks/useProductivity";
import { TaskType } from "@/types/productivity";

const TasksPage = () => {
  const [date, setDate] = useState(new Date());
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: tasks, isLoading: tasksLoading } = useProductivityTasks(dateStr);
  const { data: summary, isLoading: summaryLoading } = useDailySummary(dateStr);
  const { data: stats } = useChallengeStats();
  const { addTask, toggleLeave } = useProductivityMutations();

  // New Task State
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<TaskType>("A");
  const [newTarget, setNewTarget] = useState("");

  const handleAdd = async () => {
    if (!newTitle.trim()) return;

    await addTask.mutateAsync({
      title: newTitle,
      task_type: newType,
      target_value: newType === 'C' ? undefined : parseFloat(newTarget) || 1,
    });

    setNewTitle("");
    setNewTarget("");
    setOpen(false);
  };

  const handleLeaveToggle = async (checked: boolean) => {
    await toggleLeave(dateStr, checked);
  };

  const isLoading = tasksLoading || summaryLoading;

  return (
    <div className="pb-24 px-4 pt-6 max-w-4xl mx-auto space-y-8">

      {/* Header & Date Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            Daily Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            {stats ? `Current Streak: ${stats.streak_days} days 🔥 (Best: ${stats.best_streak})` : "Start your streak today!"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card p-1 rounded-full border shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setDate(subDays(date, 1))} className="rounded-full">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 font-semibold min-w-[140px] text-center">
            {isSameDay(date, new Date()) ? "Today" : format(date, "MMM dd, yyyy")}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} className="rounded-full">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Daily Progress & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20 relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Daily Score</p>
              <h2 className="text-5xl font-black text-primary">
                {summary?.is_leave ? "N/A" : `${Math.round(summary?.final_percentage || 0)}%`}
              </h2>
              {summary?.is_leave && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mt-2">
                  <Plane className="w-3 h-3" /> ON LEAVE
                </span>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Points Earned</p>
              <p className="text-2xl font-bold">{Math.round(summary?.earned_points || 0)} <span className="text-sm font-normal text-muted-foreground">/ {Math.round(summary?.possible_points || 0)}</span></p>
            </div>
          </div>

          <div className="mt-6">
            <Progress value={summary?.final_percentage || 0} className="h-3 bg-background/50" />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full h-14 text-lg rounded-xl shadow-lg gradient-primary hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5 mr-2" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Read 30 mins"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={(v: TaskType) => setNewType(v)}>
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

                {newType !== 'C' && (
                  <div>
                    <Label>Target {newType === 'A' ? '(Hours)' : '(Units)'}</Label>
                    <Input
                      type="number"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      placeholder="e.g. 1.5"
                    />
                  </div>
                )}

                <Button onClick={handleAdd} disabled={!newTitle} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="bg-card border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-sm">Emergency Leave</span>
            </div>
            <Switch
              checked={summary?.is_leave || false}
              onCheckedChange={handleLeaveToggle}
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl">Your Tasks</h3>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  log={task.log}
                  date={dateStr}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
            <p className="text-muted-foreground">No tasks specifically for this day.</p>
            <Button variant="link" onClick={() => setOpen(true)}>Create one now</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
