import { motion } from "framer-motion";
import StepCard from "@/components/steps/StepCard";
import WeeklyStepsChart from "@/components/steps/WeeklyStepsChart";
import StepsLeaderboard from "@/components/steps/StepsLeaderboard";

const StepsWidget = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Today's Stats */}
      <StepCard />

      {/* Weekly Chart */}
      <WeeklyStepsChart />

      {/* Leaderboard */}
      <StepsLeaderboard />
    </motion.div>
  );
};

export default StepsWidget;
