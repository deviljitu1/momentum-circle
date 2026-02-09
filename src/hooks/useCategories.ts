import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCategories = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["task_categories"],
        queryFn: async () => {
            // @ts-ignore
            const { data, error } = await supabase
                .from("task_categories")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching categories:", error);
                // Fallback or empty if table doesn't exist yet (before migration runs)
                return [];
            }
            return data as any;
        },
    });

    const addCategory = useMutation({
        mutationFn: async (name: string) => {
            // @ts-ignore
            const { error } = await supabase.from("task_categories").insert({ name });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["task_categories"] });
            toast({ title: "Category added" });
        },
        onError: (error) => {
            toast({ title: "Error adding category", description: error.message, variant: "destructive" });
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            // @ts-ignore
            const { error } = await supabase.from("task_categories").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["task_categories"] });
            toast({ title: "Category deleted" });
        },
        onError: (error) => {
            toast({ title: "Error deleting category", description: error.message, variant: "destructive" });
        },
    });

    return {
        categories,
        isLoading,
        addCategory,
        deleteCategory,
    };
};
