
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface FocusTimerProps {
  onComplete?: (seconds: number) => void;
  compact?: boolean;
}

const FocusTimer = ({ onComplete, compact = false }: FocusTimerProps) => {
  const [targetMins, setTargetMins] = useState(25);
  const [customInput, setCustomInput] = useState("25");
  const [seconds, setSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Update seconds when targetMins changes (only if not running/paused mid-way?)
  // Actually, usually changing settings resets the timer.
  useEffect(() => {
    if (!isRunning && elapsed === 0) {
      setSeconds(targetMins * 60);
    }
  }, [targetMins, isRunning, elapsed]);

  const totalSeconds = targetMins * 60;

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

  const handleCustomSet = () => {
    const val = parseInt(customInput);
    if (!isNaN(val) && val > 0) {
      setTargetMins(val);
      setIsRunning(false);
      setSeconds(val * 60);
      setElapsed(0);
    }
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0;

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
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* SVG Ring */}
        <div className="absolute inset-0">
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
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center z-10">
          <AnimatePresence mode="wait">
            <motion.span
              key={mins}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl font-extrabold tabular-nums mb-2"
            >
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>

          {/* Settings Trigger */}
          {!isRunning && elapsed === 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary">
                  <Settings className="w-3 h-3 mr-1" />
                  {targetMins} min session
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Set Duration (mins)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="h-8"
                    />
                    <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleCustomSet}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1 justify-between">
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => { setCustomInput("25"); setTargetMins(25); setSeconds(25 * 60); }}>25</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => { setCustomInput("50"); setTargetMins(50); setSeconds(50 * 60); }}>50</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => { setCustomInput("60"); setTargetMins(60); setSeconds(60 * 60); }}>60</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={toggle}
          size="lg"
          className={`rounded-full px-8 h-12 text-lg ${isRunning ? "gradient-accent" : "gradient-primary"} text-primary-foreground border-0 shadow-lg`}
        >
          {isRunning ? <><Pause className="w-5 h-5 mr-2" /> Pause</> : <><Play className="w-5 h-5 mr-2" /> Start Focus</>}
        </Button>
        <Button onClick={reset} size="lg" variant="outline" className="rounded-full h-12 w-12 p-0 border-2">
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default FocusTimer;
