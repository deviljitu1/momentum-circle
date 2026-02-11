import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Play, Edit2, Trash2, Loader2 } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface Task {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  estimatedMins: number;
  completed: boolean;
  loggedMins: number;
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onStartTimer?: (id: string) => void;
  index: number;
}

const categoryColors: Record<string, string> = {
  Study: "from-primary to-primary/70",
  Coding: "from-success to-success/70",
  Gym: "from-accent to-accent/70",
  Work: "from-warning to-warning/70",
  Reading: "from-primary/80 to-accent/60",
};

const TaskCard = ({ task, onToggle, onStartTimer, index }: TaskCardProps) => {
  const { updateTask, deleteTask } = useTasks();
  const { categories: categoryData } = useCategories();
  const categories = categoryData?.length > 0 ? categoryData.map((c: any) => c.name) : ["Study", "Coding", "Gym", "Work", "Reading"];

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editMins, setEditMins] = useState(task.estimatedMins.toString());

  const gradientClass = categoryColors[task.category] || "from-primary to-accent";

  const handleEdit = async () => {
    if (!editTitle.trim()) return;

    await updateTask.mutateAsync({
      id: task.id,
      title: editTitle,
      category: editCategory,
      estimated_mins: parseInt(editMins) || 30,
    });
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask.mutateAsync(task.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 transition-all hover:shadow-elevated ${task.completed ? "opacity-60" : ""
        }`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradientClass}`} />

      <div className="flex items-center gap-3 pl-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
              ? "bg-success border-success text-success-foreground"
              : "border-muted-foreground/30 hover:border-primary"
            }`}
        >
          {task.completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
              <Check className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${gradientClass} text-primary-foreground font-medium`}>
              {task.category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {task.estimatedMins}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!task.completed && onStartTimer && (
            <button
              onClick={() => onStartTimer(task.id)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors mr-1"
              title="Start Timer"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
          )}

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <button className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c: string) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estimated Mins</Label>
                    <Input
                      type="number"
                      value={editMins}
                      onChange={(e) => setEditMins(e.target.value)}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="destructive" size="sm" onClick={handleDelete} className="mr-auto">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                  <Button onClick={handleEdit} disabled={updateTask.isPending}>
                    {updateTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
