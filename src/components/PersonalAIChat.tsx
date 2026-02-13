
import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, X, Maximize2, Minimize2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const PersonalAIChat = () => {
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: `Hi ${profile?.display_name || "there"}! 👋 I'm your Momentum AI coach. I can help you stay on track, suggest tasks, or just chat. How can I support you today?`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || !user) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Fetch some recent context (lite version for speed)
            const { data: recentTasks } = await supabase
                .from("tasks")
                .select("title, completed, category")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5);

            const { data: recentActivity } = await supabase
                .from("activity_feed")
                .select("title, description, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(3);

            const userContext = {
                name: profile?.display_name,
                level: profile?.level || 1,
                streak: profile?.streak_days || 0,
                totalHours: profile?.total_hours || 0,
                recentTasks,
                recentActivity,
                currentPage: location.pathname,
            };

            const { data, error } = await supabase.functions.invoke("ai-chat", {
                body: {
                    messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
                    userContext,
                },
            });

            if (error) throw error;

            const aiMsg: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.reply || "I'm having trouble thinking right now. Try again?",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Sorry, I encountered an error connecting to my brain. Please try again later.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`fixed bottom-20 right-4 z-50 flex flex-col bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto ${isMinimized ? "w-72 h-14" : "w-80 sm:w-96 h-[500px]"
                            }`}
                    >
                        {/* Header */}
                        <div
                            className="bg-primary/5 p-3 flex items-center justify-between border-b cursor-pointer"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Momentum Coach</h3>
                                    {!isMinimized && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                                    {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        {!isMinimized && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50" ref={scrollRef}>
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            {msg.role === "assistant" && (
                                                <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center shrink-0 mt-1">
                                                    <Bot className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none border"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                                                    <User className="w-3 h-3 text-accent" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-2 justify-start">
                                            <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center shrink-0 mt-1">
                                                <Loader2 className="w-3 h-3 text-white animate-spin" />
                                            </div>
                                            <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none text-xs text-muted-foreground italic">
                                                Thinking...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-3 border-t bg-card">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSend();
                                        }}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            placeholder="Ask for advice..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className="rounded-full bg-background"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            className="rounded-full gradient-primary shrink-0"
                                            disabled={!input.trim() || isLoading}
                                        >
                                            <Send className="w-4 h-4 ml-0.5" />
                                        </Button>
                                    </form>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                    className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full gradient-hero shadow-xl flex items-center justify-center text-white border-4 border-background"
                >
                    <Sparkles className="w-6 h-6" />
                </motion.button>
            )}
        </>
    );
};

export default PersonalAIChat;
