
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, ThumbsUp, Heart, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DailyWellness = ({ onComplete }: { onComplete: () => void }) => {
    const { user } = useAuth();
    const [step, setStep] = useState<"mood" | "breathe" | "complete">("mood");
    const [mood, setMood] = useState<string | null>(null);
    const [seconds, setSeconds] = useState(4);
    const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
    const [cycle, setCycle] = useState(0);

    // Breathing logic
    useEffect(() => {
        if (step !== "breathe") return;

        const interval = setInterval(() => {
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
                        setCycle(c => c + 1);
                        return 4;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [step, phase]);

    // Auto-advance after 3 breathing cycles
    useEffect(() => {
        if (cycle >= 3) {
            setStep("complete");
        }
    }, [cycle]);

    const handleMoodSelect = async (selectedMood: string) => {
        setMood(selectedMood);

        // Save mood if user is logged in
        if (user) {
            // We could save this to a 'daily_checkins' table ideally
            // keeping it simple for now, maybe just firing an event or logging
            console.log("User mood:", selectedMood);
        }

        // Small delay before breathing
        setTimeout(() => setStep("breathe"), 500);
    };

    const handleComplete = () => {
        localStorage.setItem("wellness_completed_date", new Date().toDateString());
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8"
            >
                <AnimatePresence mode="wait">
                    {step === "mood" && (
                        <motion.div
                            key="mood"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center space-y-6"
                        >
                            <h2 className="text-2xl font-extrabold mb-2">How are you feeling today?</h2>
                            <p className="text-muted-foreground">Take a moment to check in with yourself.</p>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Energized", icon: "⚡" },
                                    { label: "Calm", icon: "😌" },
                                    { label: "Stressed", icon: "🤯" },
                                    { label: "Tired", icon: "😴" },
                                ].map((m) => (
                                    <button
                                        key={m.label}
                                        onClick={() => handleMoodSelect(m.label)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:bg-muted/50 transition-all hover:scale-105"
                                    >
                                        <span className="text-4xl mb-2">{m.icon}</span>
                                        <span className="font-medium text-sm">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === "breathe" && (
                        <motion.div
                            key="breathe"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-6 text-center"
                        >
                            <h3 className="text-xl font-bold">Let's take 3 deep breaths</h3>
                            <div className="relative flex items-center justify-center w-48 h-48">
                                <motion.div
                                    animate={{
                                        scale: phase === "Inhale" ? 1.5 : phase === "Exhale" ? 1 : 1.5,
                                    }}
                                    transition={{ duration: seconds, ease: "linear" }}
                                    className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                                />
                                <motion.div
                                    className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center bg-card z-10 relative"
                                    animate={{
                                        scale: phase === "Inhale" ? 1.2 : phase === "Exhale" ? 1 : 1.2,
                                    }}
                                    transition={{ duration: seconds, ease: "easeInOut" }}
                                >
                                    <span className="text-2xl font-black">{seconds}</span>
                                </motion.div>
                            </div>
                            <p className="text-lg font-medium text-primary">{phase}...</p>
                            <p className="text-sm text-muted-foreground">{3 - cycle} breaths to go</p>
                        </motion.div>
                    )}

                    {step === "complete" && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                                <ThumbsUp className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-extrabold">You're ready!</h2>
                            <p className="text-muted-foreground">
                                Have a productive and balanced day.
                            </p>
                            <Button onClick={handleComplete} className="w-full rounded-full gradient-hero text-lg font-bold h-12">
                                Go to Dashboard
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default DailyWellness;
