import { motion } from "framer-motion";
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useSteps } from "@/hooks/useSteps";

const WeeklyStepsChart = () => {
    const { weeklySteps, isLoading } = useSteps();

    const data = weeklySteps?.map(step => ({
        day: new Date(step.date).toLocaleDateString('en-US', { weekday: 'short' }),
        steps: step.steps,
        goal: step.goal
    })) || [];

    if (isLoading) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Loading chart...</div>;
    }

    if (data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No data for this week</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border mt-4"
        >
            <h3 className="text-lg font-bold mb-4">Weekly History</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 0, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                            contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid hsl(var(--border))",
                                backgroundColor: "hsl(var(--card))",
                                padding: "8px 12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                            formatter={(value: number) => [value.toLocaleString(), "Steps"]}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                        />
                        <Bar
                            dataKey="steps"
                            fill="hsl(var(--primary))"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default WeeklyStepsChart;
