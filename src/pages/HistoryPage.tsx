
import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    isSameMonth,
    addMonths,
    subMonths,
    getDay
} from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useProductivityHistory } from "@/hooks/useProductivity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HistoryPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data: history, isLoading } = useProductivityHistory(
        format(start, "yyyy-MM-dd"),
        format(end, "yyyy-MM-dd")
    );

    const days = eachDayOfInterval({ start, end });

    // Create a map for quick lookup
    const historyMap = new Map();
    history?.forEach(h => historyMap.set(h.date, h));

    const getColor = (percentage: number, isLeave: boolean) => {
        if (isLeave) return "bg-orange-100 text-orange-600 border-orange-200";
        if (percentage === 0) return "bg-muted text-muted-foreground";
        if (percentage < 50) return "bg-red-100 text-red-700 border-red-200";
        if (percentage < 80) return "bg-yellow-100 text-yellow-700 border-yellow-200";
        return "bg-green-100 text-green-700 border-green-200";
    };

    // Grid padding for starting day of week
    const startDay = getDay(start); // 0 = Sunday
    const padding = Array(startDay).fill(null);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="pb-24 px-4 pt-6 max-w-4xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-primary" /> History
                </h1>

                <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold w-32 text-center text-sm">
                        {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>

            {/* Calendar Grid */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {padding.map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square" />
                    ))}

                    {days.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const record = historyMap.get(dateStr);
                        const pct = record?.final_percentage || 0;
                        const isLeave = record?.is_leave || false;

                        return (
                            <motion.div
                                key={dateStr}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center border transition-all cursor-default",
                                    getColor(pct, isLeave),
                                    isToday(day) && "ring-2 ring-primary ring-offset-2"
                                )}
                            >
                                <span className="text-xs font-bold">{format(day, "d")}</span>
                                {record ? (
                                    <span className="text-[10px] font-medium">
                                        {isLeave ? "🤒" : `${Math.round(pct)}%`}
                                    </span>
                                ) : (
                                    <span className="text-[10px] opacity-0">-</span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted border"></div> 0%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> &lt;50%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div> 50-79%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div> 80%+</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div> Leave</div>
            </div>

            {/* Recent Summary List */}
            <div className="space-y-3 pt-4">
                <h3 className="font-bold text-lg">Detailed Log ({format(currentMonth, "MMMM")})</h3>
                {history && history.length > 0 ? (
                    <div className="bg-card border rounded-xl divide-y">
                        {history.map(h => (
                            <div key={h.date} className="p-4 flex items-center justify-between">
                                <div className="font-medium">{format(new Date(h.date), "EEE, MMM d")}</div>
                                <div className="flex items-center gap-3">
                                    {h.is_leave ? (
                                        <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">Leave</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{Math.round(h.earned_points)} pts</span>
                                            <span className={cn(
                                                "font-bold px-2 py-1 rounded text-sm",
                                                h.final_percentage >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {Math.round(h.final_percentage)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-6">No records found for this month.</p>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
