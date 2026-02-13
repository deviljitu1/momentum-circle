
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Coffee, Moon, Play, Pause, RotateCcw, ArrowLeft, Volume2, CloudRain, Sun, Leaf, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

// Breathing Exercise Component
const BreathingExercise = () => {
    const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
    const [seconds, setSeconds] = useState(4);
    const [isActive, setIsActive] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);

    // 4-7-8 Breathing Technique
    // Inhale: 4s
    // Hold: 7s
    // Exhale: 8s

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                setSeconds((prev) => {
                    if (prev === 1) {
                        if (phase === "Inhale") {
                            setPhase("Hold");
                            return 7;
                        } else if (phase === "Hold") {
                            setPhase("Exhale");
                            return 8;
                        } else {
                            setPhase("Inhale");
                            setCycleCount(c => c + 1);
                            return 4;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, phase]);

    const handleToggle = () => {
        setIsActive(!isActive);
        if (!isActive) {
            setPhase("Inhale");
            setSeconds(4);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-8">
            <div className="relative flex items-center justify-center w-64 h-64">
                {/* Outer Ring */}
                <motion.div
                    animate={{
                        scale: phase === "Inhale" ? 1.5 : phase === "Exhale" ? 1 : 1.5,
                        opacity: phase === "Hold" ? 0.8 : 0.5,
                    }}
                    transition={{ duration: seconds, ease: "linear" }}
                    className="absolute w-40 h-40 rounded-full bg-blue-400/30 blur-2xl"
                />

                {/* Breathing Circle */}
                <motion.div
                    animate={{
                        scale: phase === "Inhale" ? 1.3 : phase === "Exhale" ? 1 : 1.3,
                        borderColor: phase === "Hold" ? "hsl(var(--primary))" : "hsl(var(--accent))",
                    }}
                    transition={{ duration: seconds, ease: "easeInOut" }}
                    className="w-48 h-48 rounded-full border-4 flex items-center justify-center bg-card shadow-lg z-10 relative overflow-hidden"
                >
                    <div className="text-center z-10">
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            {isActive ? phase : "Ready?"}
                        </p>
                        <p className="text-4xl font-black tabular-nums mt-1">{isActive ? seconds : "4-7-8"}</p>
                    </div>

                    {/* Fill Animation */}
                    <motion.div
                        animate={{ height: phase === "Inhale" ? "100%" : phase === "Exhale" ? "0%" : "100%" }}
                        transition={{ duration: seconds, ease: "linear" }}
                        className="absolute bottom-0 left-0 right-0 bg-primary/10 w-full"
                    />
                </motion.div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                    {phase === "Inhale" && "Breathe in deeply through your nose..."}
                    {phase === "Hold" && "Hold your breath..."}
                    {phase === "Exhale" && "Exhale slowly through your mouth..."}
                    {!isActive && "Press start to begin the 4-7-8 relaxation technique."}
                </p>
                <div className="flex gap-4 mt-4">
                    <Button
                        size="lg"
                        onClick={handleToggle}
                        className={`rounded-full px-8 ${isActive ? "bg-muted text-foreground hover:bg-muted/80" : "gradient-primary text-primary-foreground"}`}
                    >
                        {isActive ? "Pause" : "Start Breathing"}
                    </Button>
                </div>
                {cycleCount > 0 && <p className="text-xs text-muted-foreground mt-2">Cycles completed: {cycleCount}</p>}
            </div>
        </div>
    );
};

// Meditation Timer
const MeditationTimer = () => {
    const [duration, setDuration] = useState(5); // minutes
    const [timeLeft, setTimeLeft] = useState(5 * 60);
    const [isActive, setIsActive] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            toast({ title: "Meditation Complete", description: "Great session! You've taken a moment for yourself. 🧘" });
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, toast]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(duration * 60);
    };

    const setSessionDuration = (mins: number) => {
        setDuration(mins);
        setTimeLeft(mins * 60);
        setIsActive(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-full max-w-sm grid grid-cols-3 gap-2">
                {[3, 5, 10, 15, 20, 30].map(mins => (
                    <Button
                        key={mins}
                        variant={duration === mins ? "default" : "outline"}
                        onClick={() => setSessionDuration(mins)}
                        className={`w-full ${duration === mins ? "gradient-accent border-0" : ""}`}
                    >
                        {mins}m
                    </Button>
                ))}
            </div>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 animate-pulse" />
                <div className="text-8xl font-thin tabular-nums tracking-tighter z-10">
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="flex gap-4">
                <Button size="icon" variant="outline" className="w-12 h-12 rounded-full" onClick={resetTimer}>
                    <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                    size="lg"
                    className="rounded-full px-12 h-12 text-lg gradient-primary"
                    onClick={toggleTimer}
                >
                    {isActive ? "Pause" : "Start"}
                </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center max-w-xs">
                Focus on your breath. If your mind wanders, gently bring it back.
            </p>
        </div>
    );
};

// Soundscapes (Visual Placeholder for now)
const Soundscapes = () => {
    return (
        <div className="grid grid-cols-2 gap-4 py-4">
            {[
                { name: "Rain", icon: CloudRain, color: "bg-blue-500/10 text-blue-500" },
                { name: "Forest", icon: Leaf, color: "bg-green-500/10 text-green-500" },
                { name: "White Noise", icon: Wind, color: "bg-gray-500/10 text-gray-500" },
                { name: "Waves", icon: Volume2, color: "bg-cyan-500/10 text-cyan-500" },
            ].map((sound) => (
                <Card key={sound.name} className="cursor-pointer hover:shadow-md transition-all group overflow-hidden border-border/50">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-32">
                        <div className={`p-3 rounded-full ${sound.color} group-hover:scale-110 transition-transform`}>
                            <sound.icon className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-sm">{sound.name}</span>
                        <span className="text-xs text-muted-foreground">Coming Soon</span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const WellnessPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-24 pt-6 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-extrabold">Wellness Space</h1>
                        <p className="text-sm text-muted-foreground">Recharge, reset, and relax.</p>
                    </div>
                </motion.div>

                <Tabs defaultValue="breathe" className="w-full">
                    <div className="flex justify-center mb-6">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="breathe" className="gap-2"><Wind className="w-4 h-4" /> Breathe</TabsTrigger>
                            <TabsTrigger value="meditate" className="gap-2"><Moon className="w-4 h-4" /> Meditate</TabsTrigger>
                            <TabsTrigger value="sounds" className="gap-2"><Volume2 className="w-4 h-4" /> Sounds</TabsTrigger>
                        </TabsList>
                    </div>

                    <Card className="border-border/50 shadow-sm min-h-[400px]">
                        <CardContent className="p-6">
                            <TabsContent value="breathe" className="mt-0">
                                <BreathingExercise />
                            </TabsContent>

                            <TabsContent value="meditate" className="mt-0">
                                <MeditationTimer />
                            </TabsContent>

                            <TabsContent value="sounds" className="mt-0">
                                <div className="text-center mb-4">
                                    <h3 className="font-bold text-lg">Ambient Sounds</h3>
                                    <p className="text-sm text-muted-foreground">Block out distractions while studying.</p>
                                </div>
                                <Soundscapes />
                            </TabsContent>
                        </CardContent>
                    </Card>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-900/50">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="p-2 bg-orange-200 dark:bg-orange-900/50 rounded-lg text-orange-700 dark:text-orange-400">
                                    <Coffee className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-orange-900 dark:text-orange-100">Quick Break Ideas</h4>
                                    <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">
                                        • Drink a glass of water<br />
                                        • Stretch your neck and shoulders<br />
                                        • Look at something 20ft away for 20s
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900/50">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="p-2 bg-blue-200 dark:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-400">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">Creative Reset</h4>
                                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
                                        Feeling stuck?<br />
                                        • Doodle for 2 minutes<br />
                                        • Listen to one favorite song<br />
                                        • Tidy your workspace
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default WellnessPage;
