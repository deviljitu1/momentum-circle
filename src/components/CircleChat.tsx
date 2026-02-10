import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCircleChat } from "@/hooks/useCircleChat";
import { useCircles } from "@/hooks/useCircles";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ManageChatHistoryDialog = ({ open, onOpenChange, onClearAll, onClearBefore }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClearAll: () => void;
    onClearBefore: (date: Date) => void;
}) => {
    const [date, setDate] = useState<string>("");

    const handleClearBefore = () => {
        if (!date) return;
        if (confirm(`Are you sure you want to delete all messages sent before ${date}? This action cannot be undone.`)) {
            onClearBefore(new Date(date));
            onOpenChange(false);
            setDate("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Chat History</DialogTitle>
                    <DialogDescription>
                        Clear outdated messages to free up storage space.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Clear messages older than:</label>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="flex-1"
                            />
                            <Button variant="outline" onClick={handleClearBefore} disabled={!date} className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10">
                                Delete
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            All messages sent prior to the selected date (00:00) will be permanently removed.
                        </p>
                    </div>

                    <div className="pt-4 border-t relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                            OR
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full mt-2"
                            onClick={() => {
                                if (confirm("Are you sure you want to delete ALL messages in this chat? This cannot be undone.")) {
                                    onClearAll();
                                    onOpenChange(false);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Clear Entire Chat History
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const CircleChat = ({ circleId }: { circleId: string }) => {
    const { user } = useAuth();
    const { isAdmin } = useAdmin();
    const { messages, loading, sendMessage, clearChat, deleteMessagesBefore, typingUsers, sendTyping } = useCircleChat(circleId);
    const { circles } = useCircles(); // To check if creator
    const isCreator = circles.find(c => c.id === circleId)?.is_creator;

    const [newMessage, setNewMessage] = useState("");
    const [manageOpen, setManageOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [sending, setSending] = useState(false);
    const { toast } = useToast();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTyping(false); // Stop typing immediately

        try {
            await sendMessage(newMessage);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (e.target.value.trim().length > 0) {
            sendTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => sendTyping(false), 3000);
        } else {
            sendTyping(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Format typing users text
    const typingText = Array.from(typingUsers).join(", ");

    return (
        <div className="flex flex-col h-[600px] border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Circle Chat</h3>
                {(isCreator || isAdmin) && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setManageOpen(true)}
                            title="Manage Chat History"
                        >
                            <History className="w-4 h-4" />
                        </Button>
                        <ManageChatHistoryDialog
                            open={manageOpen}
                            onOpenChange={setManageOpen}
                            onClearAll={clearChat}
                            onClearBefore={deleteMessagesBefore}
                        />
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Send className="w-5 h-5 opacity-50" />
                        </div>
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user_id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? "mt-1" : "mt-4"}`}
                            >
                                <div className="w-8 flex-shrink-0">
                                    {showAvatar && (
                                        <Avatar className="w-8 h-8 border border-border">
                                            <AvatarImage src={msg.profiles?.avatar_url || ""} />
                                            <AvatarFallback className="bg-muted text-xs">
                                                {msg.profiles?.display_name?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>

                                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                                    {showAvatar && (
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {msg.profiles?.display_name || "Unknown User"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/70">
                                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={`rounded-2xl px-4 py-2 text-sm shadow-sm break-words w-full group relative ${isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none"
                                            }`}
                                        title={format(new Date(msg.created_at), "PPpp")}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
                <div className="px-4 py-1 text-xs text-muted-foreground animate-pulse">
                    <span className="font-medium">{typingText}</span> is typing...
                </div>
            )}

            <form onSubmit={handleSend} className="p-3 bg-muted/30 border-t flex gap-2 items-center">
                <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-background border-muted-foreground/20 focus-visible:ring-offset-0"
                    disabled={sending}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-full shadow-sm"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </form>
        </div>
    );
};
