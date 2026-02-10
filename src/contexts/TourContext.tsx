import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface TourStep {
    targetId: string;
    title: string;
    content: string;
    placement?: "top" | "bottom" | "left" | "right" | "center";
}

interface TourContextType {
    isActive: boolean;
    currentStepIndex: number;
    steps: TourStep[];
    startTour: (tours: TourStep[]) => void;
    endTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error("useTour must be used within a TourProvider");
    }
    return context;
};

export const TourProvider = ({ children }: { children: ReactNode }) => {
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const startTour = (newSteps: TourStep[]) => {
        if (newSteps.length === 0) return;
        setSteps(newSteps);
        setCurrentStepIndex(0);
        setIsActive(true);
    };

    const endTour = () => {
        setIsActive(false);
        setSteps([]);
        setCurrentStepIndex(0);
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            endTour();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    return (
        <TourContext.Provider
            value={{
                isActive,
                currentStepIndex,
                steps,
                startTour,
                endTour,
                nextStep,
                prevStep,
            }}
        >
            {children}
        </TourContext.Provider>
    );
};
