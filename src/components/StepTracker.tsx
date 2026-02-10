import { useState } from "react";
import { motion } from "framer-motion";
import { Footprints, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSteps } from "@/hooks/useSteps";

const StepTracker = () => {
  const { todaySteps, logSteps } = useSteps();
  const [inputSteps, setInputSteps] = useState("");
  const [showInput, setShowInput] = useState(false);

  const currentSteps = todaySteps?.steps || 0;
  const goal = todaySteps?.goal || 10000;
  const progress = Math.min(100, Math.round((currentSteps / goal) * 100));

  const handleLog = () => {
    const steps = parseInt(inputSteps);
    if (isNaN(steps) || steps < 0) return;
    logSteps.mutate(steps);
    setInputSteps("");
    setShowInput(false);
  };

  const handleQuickAdd = (amount: number) => {
    logSteps.mutate(currentSteps + amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <Footprints className="w-4 h-4 text-primary-foreground" />
          </div>
          <h3 className="font-bold text-sm">Steps Today</h3>
        </div>
        <span className="text-xs text-muted-foreground">{currentSteps.toLocaleString()} / {goal.toLocaleString()}</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full gradient-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => handleQuickAdd(1000)}
        >
          <Plus className="w-3 h-3 mr-1" /> 1K
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => handleQuickAdd(2500)}
        >
          <Plus className="w-3 h-3 mr-1" /> 2.5K
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => setShowInput(!showInput)}
        >
          Custom
        </Button>
      </div>

      {showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2 mt-2"
        >
          <input
            type="number"
            value={inputSteps}
            onChange={(e) => setInputSteps(e.target.value)}
            placeholder="Enter steps..."
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm"
          />
          <Button size="sm" onClick={handleLog} disabled={logSteps.isPending}>
            Log
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StepTracker;
