import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface Question {
    question: string;
    options: string[];
    correctOption: number;
}

export interface Quiz {
    id: string;
    circle_id: string;
    created_by: string;
    title: string;
    description: string | null;
    category: string;
    questions: Question[];
    created_at: string;
}

export interface QuizAttempt {
    id: string;
    quiz_id: string;
    user_id: string;
    score: number;
    total_questions: number;
    created_at: string;
}

export const useQuizzes = (circleId: string) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ["quizzes", circleId],
        queryFn: async () => {
            if (!circleId) return [];
            const { data, error } = await supabase
                .from("quizzes")
                .select("*")
                .eq("circle_id", circleId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Parse questions JSON
            return data.map(q => ({
                ...q,
                questions: q.questions as unknown as Question[]
            })) as Quiz[];
        },
        enabled: !!circleId,
    });

    const { data: attempts = [] } = useQuery({
        queryKey: ["quiz_attempts", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("quiz_attempts")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;
            return data as QuizAttempt[];
        },
        enabled: !!user,
    });

    const createQuiz = useMutation({
        mutationFn: async (newQuiz: Omit<Quiz, "id" | "created_at" | "created_by">) => {
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("quizzes")
                .insert({
                    ...newQuiz,
                    created_by: user.id,
                    questions: newQuiz.questions as unknown as Json
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quizzes", circleId] });
            toast({ title: "Quiz created! 🧠" });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Error creating quiz", variant: "destructive" });
        },
    });

    const submitAttempt = useMutation({
        mutationFn: async ({ quizId, score, totalQuestions }: { quizId: string; score: number; totalQuestions: number }) => {
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("quiz_attempts")
                .insert({
                    quiz_id: quizId,
                    user_id: user.id,
                    score,
                    total_questions: totalQuestions
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["quiz_attempts"] });
            toast({
                title: "Quiz completed!",
                description: `You scored ${data.score}/${data.total_questions} (+${data.score * 10} XP)`
            });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Error submitting quiz", variant: "destructive" });
        },
    });

    return { quizzes, attempts, isLoading, createQuiz, submitAttempt };
};
