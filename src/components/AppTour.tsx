import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, X } from "lucide-react";

export const AppTour = () => {
    const { isActive, currentStepIndex, steps, endTour, nextStep, prevStep } = useTour();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = steps[currentStepIndex];

    // Update target rect
    useEffect(() => {
        if (!isActive || !step) return;

        const updateRect = () => {
            const element = document.getElementById(step.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);

                // Scroll logic
                const isInViewport = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );

                if (!isInViewport) {
                    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                }

            } else {
                setTargetRect(null);
            }
        };

        updateRect();

        // Track layout changes
        const interval = setInterval(updateRect, 100);
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, true);
        };
    }, [isActive, step]);

    if (!isActive || !step) return null;

    const getTooltipStyle = () => {
        if (!targetRect) {
            return { top: "50%", left: "50%", x: "-50%", y: "-50%" };
        }

        const placement = step.placement || "bottom";
        const isMobile = window.innerWidth < 768;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        let style: any = {};

        if (isMobile) {
            // Mobile: use CSS centering (left=0, right=0, margin=auto) to avoid transform conflicts
            const targetCenterY = targetRect.top + targetRect.height / 2;
            const isTopArea = targetCenterY < screenH * 0.6;

            style = {
                position: "fixed",
                left: 0,
                right: 0,
                margin: "0 auto",
                width: "90%",
                maxWidth: "400px",
                zIndex: 110,
            };
            width: "90%",
                maxWidth: "400px",
                    zIndex: 110,
                        margin: "0 auto",
            };

        if (isTopArea) {
            style.bottom = "20px";
            style.top = "auto";
        } else {
            style.top = "80px"; // Give space for header/notch
            style.bottom = "auto";
        }

        return style;
    }

    // DESKTOP LOGIC
    const space = 15;
    const tooltipHalfWidth = 160;
    const clampX = (x: number) => Math.max(tooltipHalfWidth + 20, Math.min(screenW - tooltipHalfWidth - 20, x));
    const centerX = targetRect.left + targetRect.width / 2;
    const safeCenterX = clampX(centerX);

    if (placement === "bottom") {
        style = { top: targetRect.bottom + space, left: safeCenterX, transform: "translateX(-50%)" };
    } else if (placement === "top") {
        style = { bottom: screenH - targetRect.top + space, left: safeCenterX, transform: "translateX(-50%)" };
    } else if (placement === "left") {
        style = { top: targetRect.top + targetRect.height / 2, right: screenW - targetRect.left + space, transform: "translateY(-50%)" };
    } else if (placement === "right") {
        style = { top: targetRect.top + targetRect.height / 2, left: targetRect.right + space, transform: "translateY(-50%)" };
    } else {
        style = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    return style;
};

const tooltipStyle = getTooltipStyle();

return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
                <mask id="tour-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {targetRect && (
                        <motion.rect
                            layoutId="highlight"
                            x={targetRect.left - 8}
                            y={targetRect.top - 8}
                            width={targetRect.width + 16}
                            height={targetRect.height + 16}
                            rx="12"
                            fill="black"
                            initial={false}
                            transition={{ type: "spring", stiffness: 250, damping: 30 }}
                        />
                    )}
                </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#tour-mask)" />

            {targetRect && (
                <motion.rect
                    x={targetRect.left - 8}
                    y={targetRect.top - 8}
                    width={targetRect.width + 16}
                    height={targetRect.height + 16}
                    rx="12"
                    fill="transparent"
                    stroke="white"
                    strokeWidth="2"
                    strokeOpacity="0.5"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.05, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            )}
        </svg>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <motion.div
                className="absolute pointer-events-auto bg-card text-card-foreground p-5 rounded-xl shadow-2xl border border-border w-80 max-w-[90vw]"
                style={tooltipStyle}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={currentStepIndex}
            >
                <button
                    onClick={endTour}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-4">
                    <h3 className="font-bold text-lg leading-tight mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.content}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-semibold text-muted-foreground">
                        {currentStepIndex + 1} / {steps.length}
                    </span>
                    <div className="flex gap-2">
                        {currentStepIndex > 0 && (
                            <Button variant="outline" size="sm" onClick={prevStep} className="h-8">
                                Back
                            </Button>
                        )}
                        <Button size="sm" onClick={nextStep} className="h-8 gap-1">
                            {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                            {currentStepIndex !== steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
);
};
