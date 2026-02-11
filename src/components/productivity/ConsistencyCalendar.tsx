
import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    subMonths,
    addMonths,
    getDay,
    subDays
} from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Plane } from "lucide-react";
import { useProductivityHistory, useDailySummary, useProductivityMutations, useChallengeStats } from "@/hooks/useProductivity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ConsistencyCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const { data: history, isLoading } = useProductivityHistory(
        format(start, "yyyy-MM-dd"),
        format(end, "yyyy-MM-dd")
    );

    const { data: summary } = useDailySummary(todayStr);
    const { toggleLeave } = useProductivityMutations();
    const { data: stats } = useChallengeStats();

    const days = eachDayOfInterval({ start, end });
    const historyMap = new Map();
    history?.forEach(h => historyMap.set(h.date, h));

    // Determine color based on productivity logic
    const getColor = (percentage: number, isLeave: boolean, isFuture: boolean) => {
        if (isFuture) return "bg-muted/20 text-muted-foreground/20 border-transparent";
        if (isLeave) return "bg-orange-100 text-orange-600 border-orange-200";
        if (percentage === 0) return "bg-muted text-muted-foreground";
        if (percentage < 50) return "bg-red-100 text-red-700 border-red-200";
        if (percentage < 80) return "bg-yellow-100 text-yellow-700 border-yellow-200";
        return "bg-green-100 text-green-700 border-green-200";
    };

    const startDay = getDay(start);
    const padding = Array(startDay).fill(null);

    const handleLeaveToggle = (checked: boolean) => {
        toggleLeave(todayStr, checked);
    };

    return (
        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Consistency Tracker</h3>
                        <p className="text-xs text-muted-foreground">
                            {stats ? `${stats.streak_days} day streak 🔥` : "Keep showing up!"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-semibold w-20 text-center">
                        {format(currentMonth, "MMM yyyy")}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-muted-foreground">{d}</div>
                    ))}

                    {padding.map((_, i) => <div key={`pad-${i}`} />)}

                    {days.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const isFuture = day > new Date();
                        const record = historyMap.get(dateStr);

                        // If today, use realtime summary if available, else record
                        const effectiveRecord = (isToday(day) && summary) ? summary : record;

                        const pct = effectiveRecord?.final_percentage || 0;
                        const isLeave = effectiveRecord?.is_leave || false;

                        return (
                            <motion.div
                                key={dateStr}
                                whileHover={{ scale: 1.1 }}
                                className={cn(
                                    "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border cursor-default transition-colors relative group",
                                    getColor(pct, isLeave, isFuture),
                                    isToday(day) && "ring-2 ring-primary ring-offset-2"
                                )}
                            >
                                {format(day, "d")}

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                                    {format(day, "MMM d")}: {isLeave ? "On Leave" : `${Math.round(pct)}%`}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Leave Toggle for Today */}
            <div className="pt-4 border-t border-dashed flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Plane className={cn("w-4 h-4", summary?.is_leave ? "text-orange-500" : "text-muted-foreground")} />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Emergency Leave</span>
                        <span className="text-[10px] text-muted-foreground">Don't break your streak on sick days</span>
                    </div>
                </div>
                <Switch
                    checked={summary?.is_leave || false}
                    onCheckedChange={handleLeaveToggle}
                />
            </div>
        </div>
    );
};

export default ConsistencyCalendar;
