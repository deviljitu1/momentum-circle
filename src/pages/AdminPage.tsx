import { useAdmin } from "@/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Shield, ShieldAlert, Users, Circle as CircleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";

const AdminPage = () => {
    const {
        isAdmin,
        isAdminLoading,
        allUsers,
        usersLoading,
        allCircles,
        circlesLoading,
        deleteUser,
        deleteCircle,
        updateUserRole
    } = useAdmin();

    if (isAdminLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="container py-8 max-w-6xl space-y-8 pb-24">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage users, contents, and system integrity.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <p className="text-2xl font-bold">{allUsers?.length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-500/10 text-orange-600">
                            <CircleIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Active Circles</p>
                            <p className="text-2xl font-bold">{allCircles?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="w-4 h-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="circles" className="gap-2">
                        <CircleIcon className="w-4 h-4" /> Circles
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-muted/30">
                            <h3 className="font-semibold">User Management</h3>
                        </div>
                        {usersLoading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Stats</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers?.map((user: any) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                                                        {user.display_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{user.display_name}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email || "No email"}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? "destructive" : "secondary"}>
                                                    {user.role || 'user'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {user.created_at && formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex gap-3">
                                                    <span className="text-orange-500 font-bold">{user.xp || 0} XP</span>
                                                    <span className="text-muted-foreground">Lvl {user.level || 1}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete ${user.display_name}? This cannot be undone.`)) {
                                                            deleteUser.mutate(user.user_id);
                                                        }
                                                    }}
                                                    disabled={user.role === 'admin'} // Protect admins from deleting each other easily
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                {/* Add Edit Button here later or allow role toggling */}
                                                {user.role !== 'admin' && ( // Allow promoting to admin
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            if (confirm(`Promote ${user.display_name} to Admin?`)) {
                                                                updateUserRole.mutate({ userId: user.user_id, role: 'admin' });
                                                            }
                                                        }}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="circles" className="space-y-4">
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-muted/30">
                            <h3 className="font-semibold">Circle Management</h3>
                        </div>
                        {circlesLoading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allCircles?.map((circle: any) => (
                                        <TableRow key={circle.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div className="font-bold">{circle.name}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1">{circle.description}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {circle.invite_code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-muted-foreground" />
                                                    <span>{circle.member_count}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatDistanceToNow(new Date(circle.created_at), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete ${circle.name}?`)) {
                                                            deleteCircle.mutate(circle.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminPage;
