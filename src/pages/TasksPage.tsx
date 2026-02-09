import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import { mockTasks, categories } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TasksPage = () => {
  const [tasks, setTasks] = useState(mockTasks);
  const [filter, setFilter] = useState("All");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Study");
  const [newMins, setNewMins] = useState("30");
  const [open, setOpen] = useState(false);

  const filtered = filter === "All" ? tasks : tasks.filter((t) => t.category === filter);
  const completed = tasks.filter((t) => t.completed).length;

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newTitle,
        category: newCategory,
        categoryColor: "primary",
        estimatedMins: parseInt(newMins) || 30,
        completed: false,
        loggedMins: 0,
      },
    ]);
    setNewTitle("");
    setNewMins("30");
    setOpen(false);
  };

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{completed}/{tasks.length} completed today</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-primary-foreground border-0">
              <Plus className="w-4 h-4 mr-1" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Task title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Minutes" value={newMins} onChange={(e) => setNewMins(e.target.value)} className="rounded-xl" />
              </div>
              <Button onClick={addTask} className="w-full rounded-xl gradient-primary text-primary-foreground border-0">Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === cat
                ? "gradient-primary text-primary-foreground"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((task, i) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">📋</p>
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm">Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
