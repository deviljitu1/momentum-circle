import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCircleChat } from "@/hooks/useCircleChat";
import { useCircles } from "@/hooks/useCircles";
import { useAdmin } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export const CircleChat = ({ circleId }: { circleId: string }) => {
    const { user } = useAuth();
    const { isAdmin } = useAdmin();
    const { messages, loading, sendMessage, clearChat, typingUsers, sendTyping } = useCircleChat(circleId);
    const { circles } = useCircles(); // To check if creator
    const isCreator = circles.find(c => c.id === circleId)?.is_creator;

    const [newMessage, setNewMessage] = useState("");
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

    const handleClearChat = async () => {
        if (confirm("Are you sure you want to clear the entire chat history? This cannot be undone.")) {
            await clearChat();
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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={handleClearChat}
                        title="Clear Chat History"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
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
