
import { useState, useRef } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    subMonths,
    addMonths,
    getDay,
} from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Plane, MoreHorizontal } from "lucide-react";
import { useProductivityHistory, useDailySummary, useProductivityMutations, useChallengeStats } from "@/hooks/useProductivity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ConsistencyCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    // Leave Dialog State
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [leaveType, setLeaveType] = useState("Sick Leave");
    const [leaveReason, setLeaveReason] = useState("");
    const [isMarkingLeave, setIsMarkingLeave] = useState(true); // true = turning leave ON, false = turning OFF

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
        // Toggle for TODAY specifically via Switch
        if (checked) {
            // Open dialog to fill details
            setSelectedDate(todayStr);
            setIsMarkingLeave(true);
            setLeaveDialogOpen(true);
        } else {
            // Just turn off
            toggleLeave(todayStr, false);
        }
    };

    // Long Press Logic
    const handleTouchStart = (dateStr: string, currentIsLeave: boolean, isFuture: boolean) => {
        if (isFuture) return;

        const timer = setTimeout(() => {
            // Provide tactile feedback
            if (navigator.vibrate) navigator.vibrate(50);

            setSelectedDate(dateStr);
            setIsMarkingLeave(!currentIsLeave);

            if (!currentIsLeave) {
                // Turning ON -> Show Dialog
                setLeaveDialogOpen(true);
            } else {
                // Turning OFF -> Immediate action
                toggleLeave(dateStr, false);
            }

        }, 600);
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const confirmLeave = () => {
        if (!selectedDate) return;
        toggleLeave(selectedDate, true, leaveType, leaveReason);
        setLeaveDialogOpen(false);
        setLeaveReason("");
        setLeaveType("Sick Leave");
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
                        const reason = effectiveRecord?.leave_reason;

                        return (
                            <motion.div
                                key={dateStr}
                                whileHover={!isFuture ? { scale: 1.1 } : undefined}
                                onPointerDown={() => handleTouchStart(dateStr, isLeave, isFuture)}
                                onPointerUp={handleTouchEnd}
                                onPointerLeave={handleTouchEnd}
                                className={cn(
                                    "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border cursor-default transition-colors relative group select-none",
                                    getColor(pct, isLeave, isFuture),
                                    isToday(day) && "ring-2 ring-primary ring-offset-2"
                                )}
                            >
                                {format(day, "d")}

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10 pointer-events-none">
                                    <div className="font-bold">{format(day, "MMM d")}</div>
                                    <div className="text-[10px]">{isLeave ? `On Leave (${effectiveRecord?.leave_type || 'Reason unspecified'})` : `${Math.round(pct)}% efficient`}</div>
                                    {isLeave && reason && <div className="text-[9px] italic opacity-80 max-w-[150px] truncate">"{reason}"</div>}
                                    <div className="text-[9px] opacity-70 font-normal mt-1 pt-1 border-t border-border/50">Long press to toggle leave</div>
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
                        <span className="text-[10px] text-muted-foreground">
                            {summary?.is_leave ? `Active: ${summary.leave_type || "Day Off"}` : "Don't break your streak on sick days"}
                        </span>
                    </div>
                </div>
                <Switch
                    checked={summary?.is_leave || false}
                    onCheckedChange={handleLeaveToggle}
                />
            </div>

            {/* Leave Details Dialog */}
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as Leave</DialogTitle>
                        <DialogDescription>
                            Mark {selectedDate} as a non-working day. This ensures your consistency streak is protected.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Leave Type</Label>
                            <Select value={leaveType} onValueChange={setLeaveType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sick Leave">Sick Leave 🤒</SelectItem>
                                    <SelectItem value="Vacation">Vacation ✈️</SelectItem>
                                    <SelectItem value="Personal Emergency">Personal Emergency 🚑</SelectItem>
                                    <SelectItem value="Rest Day">Rest Day 🛌</SelectItem>
                                    <SelectItem value="Other">Other 📝</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason (Optional)</Label>
                            <Input
                                placeholder="E.g. Not feeling well..."
                                value={leaveReason}
                                onChange={(e) => setLeaveReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmLeave}>Confirm Leave</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ConsistencyCalendar;
