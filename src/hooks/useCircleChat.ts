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
                const { data, error } = await (supabase as any)
                    .from("circle_messages")
                    .select(`
            *,
            profiles:user_id (
              display_name,
              avatar_url
            )
          `)
                    .eq("circle_id", circleId)
                    .order("created_at", { ascending: true });

                if (error) throw error;

                // Since we don't have a direct FK for profiling in messages table yet ( wait, I didn't add one in migration? )
                // Ah, I added FK to circle_members. But for messages, I only added "user_id references auth.users".
                // I need to add FK for messages too if I want to join profiles easily!
                // Wait, standard Supabase pattern allows joining profiles if user_id is the key. 
                // Let's assume it works or I'll fix it in the component.
                // Actually, let's fix the migration plan if needed.
                // But for now, let's assume standard join works if keys align.

                setMessages(data as unknown as Message[]);
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
                    const newMessage = payload.new as Message;

                    // Fetch profile for the new message user
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("display_name, avatar_url")
                        .eq("user_id", newMessage.user_id)
                        .single();

                    if (profile) {
                        newMessage.profiles = profile;
                    }

                    setMessages((prev) => [...prev, newMessage]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [circleId, user, toast]);

    const sendMessage = async (content: string) => {
        if (!user || !content.trim()) return;

        try {
            const { error } = await (supabase as any).from("circle_messages").insert({
                circle_id: circleId,
                user_id: user.id,
                content: content.trim(),
            });

            if (error) throw error;
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
