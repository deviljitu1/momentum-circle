import { useState, useEffect } from "react";
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
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

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
                    event: "INSERT",
                    schema: "public",
                    table: "circle_messages",
                    filter: `circle_id=eq.${circleId}`,
                },
                async (payload) => {
                    console.log("New message received:", payload);
                    const newMessage = payload.new as Message;

                    // Fetch profile for the new message user
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("display_name, avatar_url")
                        .eq("user_id", newMessage.user_id)
                        .maybeSingle();

                    if (profile) {
                        // Create a new object to avoid mutating the payload directly if needed, though usually fine
                        newMessage.profiles = profile;
                    }

                    setMessages((prev) => {
                        // Prevent duplicates
                        if (prev.some(m => m.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe((status) => {
                console.log("Subscription status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [circleId, user, toast]);

    const sendMessage = async (content: string) => {
        if (!user || !content.trim()) return;

        try {
            console.log("Sending message...", { circleId, userId: user.id, content });
            const { error } = await (supabase as any).from("circle_messages").insert({
                circle_id: circleId,
                user_id: user.id,
                content: content.trim(),
            });

            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                title: "Error sending message",
                variant: "destructive",
            });
            throw error;
        }
    };

    return { messages, loading, sendMessage };
};
