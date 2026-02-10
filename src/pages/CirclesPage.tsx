import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Link, Copy, Check, MessageCircle, Loader2, Trash2 } from "lucide-react";
import { useCircles, Circle } from "@/hooks/useCircles";
import { useActivityFeed, ActivityItem } from "@/hooks/useActivityFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { CircleChat } from "@/components/CircleChat";
import { QuizzesTab } from "@/components/QuizzesTab";

const reactionEmojis = ["🔥", "💪", "👏", "🎉", "❤️", "🚀"];

const ActivityCard = ({ activity, onReact }: { activity: ActivityItem; onReact: (emoji: string) => void }) => {
  const { user } = useAuth();
  const profile = activity.profiles;
  const reactions = activity.reactions || [];

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = reactions.filter(r => r.user_id === user?.id).map(r => r.emoji);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
          {profile?.display_name?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{profile?.display_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-0.5">{activity.title}</p>
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
          )}
          {activity.points_earned > 0 && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium mt-2">
              +{activity.points_earned} pts
            </span>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${userReactions.includes(emoji)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted hover:bg-muted/80"
                  }`}
              >
                {emoji} {count}
              </button>
            ))}
            <div className="flex gap-0.5">
              {reactionEmojis
                .filter((e) => !groupedReactions[e])
                .slice(0, 3)
                .map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-sm opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {emoji}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CircleCard = ({ circle, onClick, memberCount }: { circle: Circle; onClick: () => void; memberCount: number }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(circle.invite_code);
    setCopied(true);
    toast({ title: "Invite code copied! 📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className="bg-card rounded-xl p-4 border border-border/50 shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-xl">
            👥
          </div>
          <div>
            <h3 className="font-bold">{circle.name}</h3>
            <p className="text-sm text-muted-foreground">{memberCount} members</p>
          </div>
        </div>
        <button
          onClick={copyCode}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Copy invite code"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      {circle.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{circle.description}</p>
      )}
    </motion.div>
  );
};

const MembersList = ({
  circleId,
  getCircleMembers,
  isCreator,
  onRemoveMember,
}: {
  circleId: string;
  getCircleMembers: (id: string) => Promise<import("@/hooks/useCircles").CircleMember[]>;
  isCreator: boolean;
  onRemoveMember: (userId: string) => void;
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<import("@/hooks/useCircles").CircleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getCircleMembers(circleId)
      .then((data) => {
        setMembers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load members:", err);
        setError("Failed to load members");
        setLoading(false);
      });
  }, [circleId, getCircleMembers]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
        <Button variant="link" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No members found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {members.map((member, index) => (
        <div
          key={member.id}
          className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm overflow-hidden">
            {member.profiles?.avatar_url ? (
              <img src={member.profiles.avatar_url} alt={member.profiles.display_name} className="w-full h-full object-cover" />
            ) : (
              <span>{member.profiles?.display_name?.[0] || "?"}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate">{member.profiles?.display_name || "Unknown Member"}</span>
              {index === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-bold border border-yellow-500/20">
                  Leader
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-orange-500">
                <span>{member.profiles?.streak_days || 0}</span>
                <span>🔥</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Lvl {member.profiles?.level || 1}
              </div>
            </div>
            {isCreator && user?.id !== member.user_id && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 -mr-2"
                onClick={() => onRemoveMember(member.user_id)}
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

const CirclesPage = () => {
  const { user } = useAuth();
  const { circles, isLoading, createCircle, joinCircle, getCircleMembers, removeMember } = useCircles();
  const [selectedCircle, setSelectedCircle] = useState<(Circle & { is_creator?: boolean }) | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const { activities, addReaction } = useActivityFeed(selectedCircle?.id);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCircle.mutateAsync({ name: newName, description: newDesc });
    setNewName("");
    setNewDesc("");
    setCreateOpen(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    await joinCircle.mutateAsync(inviteCode);
    setInviteCode("");
    setJoinOpen(false);
  };

  const handleReact = (activityId: string, emoji: string) => {
    addReaction.mutate({ activityId, emoji });
  };

  if (selectedCircle) {
    return (
      <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
          <button onClick={() => setSelectedCircle(null)} className="text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold">{selectedCircle.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedCircle.member_count || 0} members</p>
          </div>
        </motion.div>

        {/* Invite Code */}
        <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Invite Code</p>
            <p className="font-mono font-bold text-lg">{selectedCircle.invite_code}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(selectedCircle.invite_code)}
          >
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm">Complete tasks to share progress!</p>
              </div>
            ) : (
              activities.map((a) => (
                <ActivityCard key={a.id} activity={a} onReact={(emoji) => handleReact(a.id, emoji)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-3">
            <MembersList
              circleId={selectedCircle.id}
              getCircleMembers={getCircleMembers}
              isCreator={!!selectedCircle.is_creator}
              onRemoveMember={(userId) => removeMember.mutate({ circleId: selectedCircle.id, userId })}
            />
          </TabsContent>

          <TabsContent value="chat" className="space-y-3">
            <CircleChat circleId={selectedCircle.id} />
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-3">
            <QuizzesTab circleId={selectedCircle.id} />
          </TabsContent>
        </Tabs>
      </div >
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Circles</h1>
          <p className="text-sm text-muted-foreground">Compete with friends</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full">
                <Link className="w-4 h-4 mr-1" /> Join
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Join a Circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Enter invite code..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="rounded-xl font-mono text-center text-lg"
                />
                <Button
                  onClick={handleJoin}
                  disabled={joinCircle.isPending}
                  className="w-full rounded-xl gradient-primary text-primary-foreground border-0"
                >
                  {joinCircle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Circle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gradient-primary text-primary-foreground border-0">
                <Plus className="w-4 h-4 mr-1" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create a Circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Circle name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  onClick={handleCreate}
                  disabled={createCircle.isPending}
                  className="w-full rounded-xl gradient-primary text-primary-foreground border-0"
                >
                  {createCircle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Circle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : circles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-lg">No circles yet</p>
          <p className="text-sm">Create one or join with an invite code!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {circles.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onClick={() => setSelectedCircle(circle)}
              memberCount={circle.member_count || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CirclesPage;
