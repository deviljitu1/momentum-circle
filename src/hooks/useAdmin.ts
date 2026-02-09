import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useAdmin = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 1. Check if current user is admin
    const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
        queryKey: ["is_admin", user?.id],
        queryFn: async () => {
            if (!user) return false;
            // @ts-ignore
            const { data, error } = await supabase.rpc("is_admin");
            if (error) {
                console.error("Error checking admin status:", error);
                return false;
            }
            return data;
        },
        enabled: !!user,
    });

    // 2. Fetch all users (profiles)
    const { data: allUsers, isLoading: usersLoading } = useQuery({
        queryKey: ["admin_users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!isAdmin, // Only fetch if admin
    });

    // 3. Fetch all circles
    const { data: allCircles, isLoading: circlesLoading } = useQuery({
        queryKey: ["admin_circles"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("circles")
                .select("*, circle_members(count)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data.map((c: any) => ({
                ...c,
                member_count: c.circle_members?.[0]?.count || 0,
            }));
        },
        enabled: !!isAdmin,
    });

    // Mutation: Delete User
    const deleteUser = useMutation({
        mutationFn: async (userId: string) => {
            // Deleting from auth.users requires service role key usually, 
            // but if we are just deleting the profile via RLS:
            const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
            toast({ title: "User deleted" });
        },
        onError: (error) => {
            toast({ title: "Error deleting user", description: error.message, variant: "destructive" });
        },
    });

    // Mutation: Delete Circle
    const deleteCircle = useMutation({
        mutationFn: async (circleId: string) => {
            const { error } = await supabase.from("circles").delete().eq("id", circleId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_circles"] });
            toast({ title: "Circle deleted" });
        },
        onError: (error) => {
            toast({ title: "Error deleting circle", description: error.message, variant: "destructive" });
        },
    });

    // Mutation: Update User Role
    const updateUserRole = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
            const { error } = await supabase
                .from("profiles")
                // @ts-ignore
                .update({ role })
                .eq("user_id", userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
            toast({ title: "User role updated" });
        },
        onError: (error) => {
            toast({ title: "Error updating role", description: error.message, variant: "destructive" });
        },
    });

    return {
        isAdmin,
        isAdminLoading,
        allUsers,
        usersLoading,
        allCircles,
        circlesLoading,
        deleteUser,
        deleteCircle,
        updateUserRole
    };
};
