import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarOff, Palmtree, Stethoscope, GraduationCap, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

const leaveTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  Vacation: { icon: Palmtree, color: "text-accent" },
  Sick: { icon: Stethoscope, color: "text-destructive" },
  Personal: { icon: CalendarOff, color: "text-primary" },
  Study: { icon: GraduationCap, color: "text-warning" },
  Other: { icon: MoreHorizontal, color: "text-muted-foreground" },
};

const LeaveSummaryCard = () => {
  const { user } = useAuth();

  const { data: leaveDays = [] } = useQuery({
    queryKey: ["leave_history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_leave", true)
        .order("date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Breakdown by type
  const typeCounts: Record<string, number> = {};
  leaveDays.forEach((d) => {
    const type = d.leave_type || "Other";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const recentLeaves = leaveDays.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-xl p-6 border border-border/50 shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-destructive/10">
          <CalendarOff className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-bold text-base">Leave Summary</h3>
          <p className="text-xs text-muted-foreground">Total & breakdown</p>
        </div>
        <span className="ml-auto text-2xl font-extrabold">{leaveDays.length}</span>
        <span className="text-xs text-muted-foreground">days</span>
      </div>

      {/* Type breakdown */}
      {Object.keys(typeCounts).length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(typeCounts).map(([type, count]) => {
            const config = leaveTypeConfig[type] || leaveTypeConfig.Other;
            const Icon = config.icon;
            return (
              <div
                key={type}
                className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-1.5 border border-border/30"
              >
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                <span className="text-xs font-semibold">{type}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">No leave days recorded yet.</p>
      )}

      {/* Recent history */}
      {recentLeaves.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</p>
          {recentLeaves.map((leave) => {
            const type = leave.leave_type || "Other";
            const config = leaveTypeConfig[type] || leaveTypeConfig.Other;
            const Icon = config.icon;
            return (
              <div
                key={leave.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/20 border border-border/20"
              >
                <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{format(parseISO(leave.date), "MMM d, yyyy")}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {type}
                    </Badge>
                  </div>
                  {leave.leave_reason && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{leave.leave_reason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default LeaveSummaryCard;
