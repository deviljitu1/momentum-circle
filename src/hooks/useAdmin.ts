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
        enabled: !!isAdmin,
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

    // --- MUTATIONS ---

    // Use this generic helper to invalidate queries
    const onSuccess = (message: string, keys: string[]) => {
        keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
        toast({ title: message });
    };

    const onError = (error: Error, action: string) => {
        console.error(error);
        toast({ title: `Error ${action}`, description: error.message, variant: "destructive" });
    };

    // User Actions
    const deleteUser = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => onSuccess("User deleted", ["admin_users"]),
        onError: (e) => onError(e, "deleting user"),
    });

    const updateUserRole = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
            // @ts-ignore
            const { error } = await supabase.from("profiles").update({ role }).eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => onSuccess("User role updated", ["admin_users"]),
        onError: (e) => onError(e, "updating role"),
    });

    const updateUserName = useMutation({
        mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
            const { error } = await supabase.from("profiles").update({ display_name: name }).eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => onSuccess("User name updated", ["admin_users"]),
        onError: (e) => onError(e, "updating name"),
    });

    // Circle Actions
    const deleteCircle = useMutation({
        mutationFn: async (circleId: string) => {
            const { error } = await supabase.from("circles").delete().eq("id", circleId);
            if (error) throw error;
        },
        onSuccess: () => onSuccess("Circle deleted", ["admin_circles"]),
        onError: (e) => onError(e, "deleting circle"),
    });

    const updateCircle = useMutation({
        mutationFn: async ({ circleId, name, description }: { circleId: string; name: string; description?: string }) => {
            const { error } = await supabase.from("circles").update({ name, description }).eq("id", circleId);
            if (error) throw error;
        },
        onSuccess: () => onSuccess("Circle updated", ["admin_circles"]),
        onError: (e) => onError(e, "updating circle"),
    });

    // Circle Member Actions
    const addMemberToCircle = useMutation({
        mutationFn: async ({ circleId, userId }: { circleId: string; userId: string }) => {
            // First check if user exists
            const { data: userExist, error: userError } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", userId)
                .single();

            if (userError || !userExist) throw new Error("User not found (ID might be incorrect)");

            const { error } = await supabase
                .from("circle_members")
                .insert({ circle_id: circleId, user_id: userId });

            if (error) {
                if (error.code === '23505') throw new Error("User is already in this circle");
                throw error;
            }
        },
        onSuccess: () => onSuccess("Member added", ["admin_circles"]),
        onError: (e) => onError(e, "adding member"),
    });

    const removeMemberFromCircle = useMutation({
        mutationFn: async ({ circleId, userId }: { circleId: string; userId: string }) => {
            const { error } = await supabase
                .from("circle_members")
                .delete()
                .eq("circle_id", circleId)
                .eq("user_id", userId);
            if (error) throw error;
        },
        onSuccess: () => onSuccess("Member removed", ["admin_circles"]),
        onError: (e) => onError(e, "removing member"),
    });


    return {
        isAdmin,
        isAdminLoading,
        allUsers,
        usersLoading,
        allCircles,
        circlesLoading,
        // Actions
        deleteUser,
        updateUserRole,
        updateUserName,
        deleteCircle,
        updateCircle,
        addMemberToCircle,
        removeMemberFromCircle
    };
};
