import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FocusTimerProps {
  onComplete?: (seconds: number) => void;
  compact?: boolean;
}

const FocusTimer = ({ onComplete, compact = false }: FocusTimerProps) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const totalSeconds = 25 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
        setElapsed((e) => e + 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      onComplete?.(elapsed);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds, elapsed, onComplete]);

  const toggle = useCallback(() => setIsRunning((r) => !r), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(totalSeconds);
    setElapsed(0);
  }, [totalSeconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <span className="font-bold text-lg tabular-nums">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <motion.circle
            cx="100" cy="100" r="88" fill="none"
            stroke="url(#timerGrad)"
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={553}
            animate={{ strokeDashoffset: 553 - (progress / 100) * 553 }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(250, 84%, 54%)" />
              <stop offset="100%" stopColor="hsl(16, 85%, 61%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={mins}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-extrabold tabular-nums"
            >
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={toggle}
          size="lg"
          className={`rounded-full px-8 ${isRunning ? "gradient-accent" : "gradient-primary"} text-primary-foreground border-0`}
        >
          {isRunning ? <><Pause className="w-5 h-5 mr-2" /> Pause</> : <><Play className="w-5 h-5 mr-2" /> Focus</>}
        </Button>
        <Button onClick={reset} size="lg" variant="outline" className="rounded-full">
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default FocusTimer;
