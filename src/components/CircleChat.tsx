import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCircleChat } from "@/hooks/useCircleChat"; // Assuming this hook is created
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const CircleChat = ({ circleId }: { circleId: string }) => {
    const { user } = useAuth();
    const { messages, loading, sendMessage } = useCircleChat(circleId);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

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
        try {
            await sendMessage(newMessage);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="p-3 border-b bg-muted/20">
                <h3 className="font-semibold text-sm">Circle Chat</h3>
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
                    messages.map((msg) => {
                        const isMe = msg.user_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                            >
                                <Avatar className="w-8 h-8 border border-border">
                                    <AvatarImage src={msg.profiles?.avatar_url || ""} />
                                    <AvatarFallback className="bg-muted text-xs">
                                        {msg.profiles?.display_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {msg.profiles?.display_name || "Unknown User"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/70">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div
                                        className={`rounded-2xl px-4 py-2 text-sm shadow-sm break-words w-full ${isMe
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-muted text-foreground rounded-tl-none"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-muted/30 border-t flex gap-2 items-center">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-background border-muted-foreground/20 focus-visible:ring-offset-0"
                    disabled={sending}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-full shadow-sm" // Removed 'shrink-0' as it's not a valid class for Button usually unless needed but 'shrink-0' is native tailwind
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </form>
        </div>
    );
};
