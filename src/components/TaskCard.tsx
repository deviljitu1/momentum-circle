import { motion } from "framer-motion";
import { Check, Clock, Play } from "lucide-react";

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
  const gradientClass = categoryColors[task.category] || "from-primary to-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 transition-all hover:shadow-elevated ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradientClass}`} />

      <div className="flex items-center gap-3 pl-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed
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

        {!task.completed && onStartTimer && (
          <button
            onClick={() => onStartTimer(task.id)}
            className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Play className="w-4 h-4 ml-0.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
