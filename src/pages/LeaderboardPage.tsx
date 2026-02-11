
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Crown, Trophy, Calendar, Zap, Users, UserPlus, Search, Check, X } from "lucide-react";
import { useProductivityLeaderboard, useSearchUsers, useProductivityMutations, useFollowingList } from "@/hooks/useProductivity";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [viewMode, setViewMode] = useState<"global" | "following">("global");

  const { data: leaderboard, isLoading } = useProductivityLeaderboard(period, viewMode);
  const { user } = useAuth();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery);
  const { followUser, unfollowUser } = useProductivityMutations();
  const { data: followingList } = useFollowingList();

  // Filter out users with 0% score ONLY if you want to hide inactive users?
  // User said "show all members". So we keep them.
  // However, for the Podium, we might want only active users.
  const activeLeaderboard = leaderboard?.filter(u => u.final_percentage > 0) || [];
  const top3 = activeLeaderboard.slice(0, 3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const handleFollow = (targetId: string) => {
    followUser.mutate(targetId);
  };

  const handleUnfollow = (targetId: string) => {
    unfollowUser.mutate(targetId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" /> Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Compare your progress with the community
        </p>

        <div className="flex flex-col items-center gap-4 pt-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "daily" | "weekly")} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Today</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "global" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("global")}
              className="text-xs"
            >
              Global
            </Button>
            <Button
              variant={viewMode === "following" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("following")}
              className="text-xs"
            >
              Following
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Podium Section - Only Active Users */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 py-4 h-48">
          {podiumOrder.map((entry, i) => {
            const rank = entry === top3[0] ? 1 : entry === top3[1] ? 2 : 3;
            const isFirst = rank === 1;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.1 }}
                className={`flex flex-col items-center ${isFirst ? "order-2 -mt-12" : rank === 2 ? "order-1" : "order-3"}`}
              >
                <div className="relative mb-3">
                  <div className={`rounded-full overflow-hidden border-4 ${isFirst ? "w-20 h-20 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]" : rank === 2 ? "w-16 h-16 border-gray-300" : "w-16 h-16 border-orange-300"}`}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={entry.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center font-bold text-xl">
                        {entry.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  {isFirst && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 fill-yellow-500" />}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm">
                    {rank}
                  </div>
                </div>

                <span className="font-bold text-sm max-w-[100px] truncate">{entry.display_name}</span>
                <span className={`text-xs font-bold ${isFirst ? "text-yellow-600" : "text-muted-foreground"}`}>
                  {Math.round(entry.final_percentage)}%
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* List View */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Rank & User</span>

          {viewMode === "following" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <UserPlus className="w-3 h-3" /> Add Friends
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Find Friends</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search people in your circles..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-[300px]">
                    {isSearching ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : searchResults?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {searchQuery.length < 2 ? "Type name to search..." : "No users found in your circles."}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {searchResults?.map(result => {
                          const isFollowing = followingList?.includes(result.user_id);
                          return (
                            <div key={result.user_id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={result.avatar_url || undefined} />
                                  <AvatarFallback>{result.display_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{result.display_name}</span>
                              </div>
                              {isFollowing ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs"
                                  onClick={() => handleUnfollow(result.user_id)}
                                  disabled={unfollowUser.isPending}
                                >
                                  Following
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleFollow(result.user_id)}
                                  disabled={followUser.isPending}
                                >
                                  Follow
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pr-2">Score</span>
        </div>

        <div className="divide-y divide-border/50">
          {leaderboard?.map((entry, index) => {
            const isMe = entry.user_id === user?.id;
            const hasScore = entry.final_percentage > 0;

            // Determine rank styles
            let rankDisplay = <span className="text-muted-foreground font-medium text-sm w-6 text-center">{index + 1}</span>;
            if (index === 0) rankDisplay = <Trophy className="w-5 h-5 text-yellow-500" />;
            if (index === 1) rankDisplay = <Trophy className="w-5 h-5 text-gray-400" />;
            if (index === 2) rankDisplay = <Trophy className="w-5 h-5 text-orange-400" />;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${isMe ? "bg-primary/5" : ""} ${entry.is_leave ? "opacity-70 grayscale" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    {rankDisplay}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
                        {entry.display_name?.[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className={`font-semibold text-sm ${isMe ? "text-primary" : ""}`}>
                      {entry.display_name} {isMe && "(You)"}
                    </span>
                    {entry.is_leave && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                        On Leave
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums">
                      {Math.round(entry.final_percentage)}
                    </span>
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>

                  {/* Simple bar for visual relative to 100% */}
                  {hasScore && (
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${entry.final_percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${entry.final_percentage >= 80 ? "bg-green-500" : entry.final_percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {leaderboard?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {viewMode === "following" ? (
                <div className="flex flex-col items-center gap-2">
                  <span>You aren't following anyone yet.</span>
                  <Button variant="outline" size="sm" className="h-8">Add Friends</Button>
                </div>
              ) : (
                "No participants found."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
