import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Message {
    id: string;
    circle_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        display_name: string;
        avatar_url: string | null;
    };
}

export const useCircleChat = (circleId: string) => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!circleId || !user) return;

        const fetchMessages = async () => {
            try {
                // 1. Get messages
                const { data: messagesData, error: messagesError } = await (supabase as any)
                    .from("circle_messages")
                    .select("*")
                    .eq("circle_id", circleId)
                    .order("created_at", { ascending: true });

                if (messagesError) {
                    console.error("Supabase error fetching messages:", messagesError);
                    throw messagesError;
                }

                if (!messagesData || messagesData.length === 0) {
                    setMessages([]);
                    return;
                }

                // 2. Get profiles (safe fetch)
                const userIds = [...new Set(messagesData.map((m: any) => m.user_id))] as string[];
                let profilesMap = new Map();

                try {
                    const { data: profiles, error: profilesError } = await supabase
                        .from("profiles")
                        .select("user_id, display_name, avatar_url")
                        .in("user_id", userIds);

                    if (profiles) {
                        profilesMap = new Map(profiles.map((p) => [p.user_id, p]));
                    }
                    if (profilesError) console.warn("Error fetching profiles for chat:", profilesError);
                } catch (err) {
                    console.warn("Failed to fetch profiles:", err);
                }

                // 3. Merge
                const combinedMessages = messagesData.map((m: any) => ({
                    ...m,
                    profiles: profilesMap.get(m.user_id) || { display_name: "User", avatar_url: null }
                }));

                setMessages(combinedMessages as Message[]);
            } catch (error) {
                console.error("Error fetching messages:", error);
                toast({
                    title: "Error fetching messages",
                    description: "Could not load chat history.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel(`circle_chat:${circleId}`)
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to all events (INSERT, DELETE)
                    schema: "public",
                    table: "circle_messages",
                    filter: `circle_id=eq.${circleId}`,
                },
                async (payload) => {
                    console.log("Realtime payload:", payload);

                    if (payload.eventType === "INSERT") {
                        const newMessage = payload.new as Message;

                        // Notification if not from self
                        if (newMessage.user_id !== user.id) {
                            toast({
                                title: "New Message",
                                description: "Someone sent a message in the circle.",
                            });
                        }

                        // Fetch profile for the new message user
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("display_name, avatar_url")
                            .eq("user_id", newMessage.user_id)
                            .maybeSingle();

                        if (profile) {
                            newMessage.profiles = profile;
                        }

                        setMessages((prev) => {
                            if (prev.some(m => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage];
                        });
                    } else if (payload.eventType === "DELETE") {
                        const deletedId = payload.old.id;
                        setMessages((prev) => prev.filter(m => m.id !== deletedId));
                    }
                }
            )
            .on("presence", { event: "sync" }, () => {
                const newState = channel.presenceState();
                const typing = new Set<string>();
                for (const key in newState) {
                    const users = newState[key] as any[];
                    users.forEach(u => {
                        if (u.user_id !== user.id && u.isTyping) {
                            typing.add(u.display_name || "Someone");
                        }
                    });
                }
                setTypingUsers(typing);
            })
            .on("presence", { event: "join" }, ({ key, newPresences }) => {
                // handle join if needed
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    channelRef.current = channel; // Store channel in ref
                    // Initialize presence state for the current user
                    await channel.track({ user_id: user.id, display_name: user.user_metadata?.display_name || "You", isTyping: false });
                }
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [circleId, user, toast]);

    const sendMessage = async (content: string) => {
        if (!user || !content.trim()) return;

        try {
            console.log("Sending message...", { circleId, userId: user.id, content });

            // Insert and retrieve the message
            const { data: newMessage, error } = await (supabase as any)
                .from("circle_messages")
                .insert({
                    circle_id: circleId,
                    user_id: user.id,
                    content: content.trim(),
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }

            // Attach profile data for UI immediately
            const messageWithProfile: Message = {
                ...newMessage,
                profiles: {
                    display_name: profile?.display_name || user.user_metadata?.display_name || "You",
                    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null
                }
            };

            // Update state immediately
            setMessages((prev) => [...prev, messageWithProfile]);

        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                title: "Error sending message",
                variant: "destructive",
            });
            throw error;
        }
    };

    const clearChat = async () => {
        if (!user) return;
        try {
            const { error } = await (supabase as any).from("circle_messages").delete().eq("circle_id", circleId);
            if (error) {
                console.error("Failed to clear chat:", error);
                throw error;
            }
            setMessages([]); // Optimistic clear
            toast({ title: "Chat cleared", description: "All messages have been deleted." });
        } catch (error) {
            toast({ title: "Error clearing chat", description: "Could not delete messages.", variant: "destructive" });
            throw error;
        }
    };

    const deleteMessagesBefore = async (date: Date) => {
        if (!user) return;
        try {
            const { error } = await (supabase as any)
                .from("circle_messages")
                .delete()
                .eq("circle_id", circleId)
                .lt("created_at", date.toISOString());

            if (error) throw error;
            toast({ title: "History Cleared", description: "Messages older than selected date deleted." });
        } catch (error) {
            console.error("Delete error:", error);
            toast({ title: "Error", description: "Failed to delete messages.", variant: "destructive" });
        }
    };

    const sendTyping = async (isTyping: boolean) => {
        if (!user || !channelRef.current) return;
        await channelRef.current.track({ user_id: user.id, display_name: user.user_metadata?.display_name || "You", isTyping });
    };

    return { messages, loading, sendMessage, clearChat, deleteMessagesBefore, typingUsers, sendTyping };
};
