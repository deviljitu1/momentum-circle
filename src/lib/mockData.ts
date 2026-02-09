import { Task } from "@/components/TaskCard";
import { LeaderboardUser } from "@/components/LeaderboardItem";

export const mockTasks: Task[] = [
  { id: "1", title: "Review React hooks documentation", category: "Study", categoryColor: "primary", estimatedMins: 45, completed: false, loggedMins: 20 },
  { id: "2", title: "Build Momentum Circle UI", category: "Coding", categoryColor: "success", estimatedMins: 120, completed: false, loggedMins: 60 },
  { id: "3", title: "Morning workout - Upper body", category: "Gym", categoryColor: "accent", estimatedMins: 60, completed: true, loggedMins: 55 },
  { id: "4", title: "Write weekly report", category: "Work", categoryColor: "warning", estimatedMins: 30, completed: false, loggedMins: 0 },
  { id: "5", title: "Read 'Atomic Habits' chapter 5", category: "Reading", categoryColor: "primary", estimatedMins: 25, completed: false, loggedMins: 0 },
  { id: "6", title: "Practice TypeScript challenges", category: "Coding", categoryColor: "success", estimatedMins: 40, completed: true, loggedMins: 40 },
  { id: "7", title: "Prepare presentation slides", category: "Work", categoryColor: "warning", estimatedMins: 90, completed: false, loggedMins: 15 },
];

export const mockLeaderboard: LeaderboardUser[] = [
  { id: "1", name: "Alex Chen", avatar: "", points: 2450, hours: 32, streak: 14 },
  { id: "2", name: "Sarah Kim", avatar: "", points: 2180, hours: 28, streak: 21 },
  { id: "3", name: "You", avatar: "", points: 1920, hours: 24, streak: 7 },
  { id: "4", name: "Mike Johnson", avatar: "", points: 1680, hours: 20, streak: 5 },
  { id: "5", name: "Emma Wilson", avatar: "", points: 1450, hours: 18, streak: 12 },
  { id: "6", name: "James Lee", avatar: "", points: 1200, hours: 15, streak: 3 },
  { id: "7", name: "Priya Patel", avatar: "", points: 980, hours: 12, streak: 9 },
];

export const mockBadges = [
  { id: "1", name: "Early Bird", emoji: "🌅", description: "Started 5 sessions before 8am", unlocked: true },
  { id: "2", name: "Week Warrior", emoji: "⚔️", description: "7-day streak completed", unlocked: true },
  { id: "3", name: "Century Club", emoji: "💯", description: "100 tasks completed", unlocked: true },
  { id: "4", name: "Deep Focus", emoji: "🧠", description: "5 uninterrupted hours", unlocked: false },
  { id: "5", name: "Team Player", emoji: "🤝", description: "React to 50 friend updates", unlocked: false },
  { id: "6", name: "Night Owl", emoji: "🦉", description: "10 late-night sessions", unlocked: true },
  { id: "7", name: "Speedster", emoji: "⚡", description: "Complete 10 tasks in one day", unlocked: false },
  { id: "8", name: "Consistent", emoji: "📈", description: "30-day streak", unlocked: false },
];

export const weeklyHours = [
  { day: "Mon", hours: 4.5 },
  { day: "Tue", hours: 6.2 },
  { day: "Wed", hours: 3.8 },
  { day: "Thu", hours: 5.1 },
  { day: "Fri", hours: 7.0 },
  { day: "Sat", hours: 2.5 },
  { day: "Sun", hours: 3.2 },
];

export const heatmapData: number[][] = Array.from({ length: 7 }, () =>
  Array.from({ length: 12 }, () => Math.floor(Math.random() * 5))
);

export const categories = ["Study", "Coding", "Gym", "Work", "Reading"];
