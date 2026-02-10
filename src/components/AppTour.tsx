import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

export const AppTour = () => {
    const { isActive, currentStepIndex, steps, endTour, nextStep, prevStep } = useTour();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = steps[currentStepIndex];

    useEffect(() => {
        if (!isActive || !step) return;

        const findTarget = () => {
            const element = document.getElementById(step.targetId);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
                // Scroll into view if needed
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                // If element not found, fallback to center or retry
                console.warn(`Tour target ${step.targetId} not found`);
                // Retry a bit later?
                setTimeout(() => {
                    const retryEl = document.getElementById(step.targetId);
                    if (retryEl) setTargetRect(retryEl.getBoundingClientRect());
                }, 500);
            }
        };

        findTarget();
        window.addEventListener("resize", findTarget);
        window.addEventListener("scroll", findTarget);

        return () => {
            window.removeEventListener("resize", findTarget);
            window.removeEventListener("scroll", findTarget);
        };
    }, [isActive, step]);

    if (!isActive || !step) return null;

    // Calculate position for tooltip
    let tooltipStyle: React.CSSProperties = {};
    if (targetRect) {
        const space = 10;
        const placement = step.placement || "bottom";

        if (placement === "bottom") {
            tooltipStyle = { top: targetRect.bottom + space, left: targetRect.left + targetRect.width / 2, transform: "translateX(-50%)" };
        } else if (placement === "top") {
            tooltipStyle = { bottom: window.innerHeight - targetRect.top + space, left: targetRect.left + targetRect.width / 2, transform: "translateX(-50%)" };
        } else if (placement === "left") {
            tooltipStyle = { top: targetRect.top + targetRect.height / 2, right: window.innerWidth - targetRect.left + space, transform: "translateY(-50%)" };
        } else if (placement === "right") {
            tooltipStyle = { top: targetRect.top + targetRect.height / 2, left: targetRect.right + space, transform: "translateY(-50%)" };
        } else {
            // Center
            tooltipStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
        }
    } else {
        // Fallback center if no target
        tooltipStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    // Safe check for viewport boundaries roughly? (Advanced logic omitted for now, basic implementation)

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop with Hole */}
            <svg className="absolute inset-0 w-full h-full text-black/60 fill-current">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <motion.rect
                                x={targetRect.left - 5}
                                y={targetRect.top - 5}
                                width={targetRect.width + 10}
                                height={targetRect.height + 10}
                                rx="8"
                                fill="black"
                                initial={false}
                                animate={{
                                    x: targetRect.left - 5,
                                    y: targetRect.top - 5,
                                    width: targetRect.width + 10,
                                    height: targetRect.height + 10
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" mask="url(#tour-mask)" />
            </svg>

            {/* Tooltip Card */}
            <motion.div
                className="absolute pointer-events-auto bg-card text-card-foreground p-4 rounded-xl shadow-xl border border-border max-w-xs w-full"
                style={tooltipStyle}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={currentStepIndex} // Remount on step change for animation
            >
                <button
                    onClick={endTour}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </button>

                <h3 className="font-bold text-lg mb-1 pr-6">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

                <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStepIndex ? "bg-primary" : "bg-muted"}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {currentStepIndex > 0 && (
                            <Button variant="outline" size="sm" onClick={prevStep}>
                                Back
                            </Button>
                        )}
                        <Button size="sm" onClick={nextStep}>
                            {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                            {currentStepIndex !== steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
