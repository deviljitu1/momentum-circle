import { useAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Shield, ShieldAlert, Users, Circle as CircleIcon, Edit, Plus, ListTodo, Eye, EyeOff, X } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
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
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminPage = () => {
    const { toast } = useToast();
    const {
        isAdmin,
        isAdminLoading,
        allUsers,
        usersLoading,
        allCircles,
        circlesLoading,
        deleteUser,
        deleteCircle,
        updateUserRole,
        updateUserName,
        updateCircle,
        addMemberToCircle,
        removeMemberFromCircle,
        createNewUser,
        getCircleMembers
    } = useAdmin();

    const { categories, addCategory, deleteCategory } = useCategories();
    const [newTaskCategory, setNewTaskCategory] = useState("");

    const [editUserOpen, setEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newUserName, setNewUserName] = useState("");

    const [editCircleOpen, setEditCircleOpen] = useState(false);
    const [selectedCircle, setSelectedCircle] = useState<any>(null);
    const [newCircleName, setNewCircleName] = useState("");
    const [newCircleDesc, setNewCircleDesc] = useState("");

    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [selectedCircleForMember, setSelectedCircleForMember] = useState<any>(null);
    const [newMemberId, setNewMemberId] = useState("");

    const [viewMembersOpen, setViewMembersOpen] = useState(false);
    const [selectedCircleForView, setSelectedCircleForView] = useState<any>(null);

    // Fetch members for selected circle
    // Fetch members for selected circle
    const { data: circleMembers, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
        queryKey: ["circle_members", selectedCircleForView?.id],
        queryFn: () => {
            console.log("REFETCHING MEMBERS FOR:", selectedCircleForView?.id);
            return getCircleMembers(selectedCircleForView?.id)
        },
        enabled: !!selectedCircleForView?.id,
    });

    const [addUserOpen, setAddUserOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPass, setNewUserPass] = useState("");
    const [newUserDisplayName, setNewUserDisplayName] = useState("");
    const [newUserShowPassword, setNewUserShowPassword] = useState(false);

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

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setNewUserName(user.display_name);
        setEditUserOpen(true);
    };

    const handleSaveUser = () => {
        if (selectedUser && newUserName.trim()) {
            updateUserName.mutate({ userId: selectedUser.user_id, name: newUserName });
            setEditUserOpen(false);
        }
    };

    const handleEditCircle = (circle: any) => {
        setSelectedCircle(circle);
        setNewCircleName(circle.name);
        setNewCircleDesc(circle.description || "");
        setEditCircleOpen(true);
    };

    const handleSaveCircle = () => {
        if (selectedCircle && newCircleName.trim()) {
            updateCircle.mutate({
                circleId: selectedCircle.id,
                name: newCircleName,
                description: newCircleDesc
            });
            setEditCircleOpen(false);
        }
    };

    const handleAddMember = (circle: any) => {
        setSelectedCircleForMember(circle);
        setNewMemberId("");
        setAddMemberOpen(true);
    };

    const handleSaveMember = () => {
        if (selectedCircleForMember && newMemberId.trim()) {
            addMemberToCircle.mutate({
                circleId: selectedCircleForMember.id,
                userId: newMemberId.trim()
            }, {
                onSuccess: () => refetchMembers() // Refresh list if viewing
            });
            setAddMemberOpen(false);
        }
    };

    const handleViewMembers = (circle: any) => {
        console.log("User clicked view members for:", circle.id, circle.name);
        setSelectedCircleForView(circle);
        // Add a small timeout to allow state to settle or force dialog open separately? 
        // Typically React batching handles this, but let's be explicit
        setViewMembersOpen(true);
    };

    const handleRemoveMember = (userId: string) => {
        if (!selectedCircleForView) return;
        if (confirm("Are you sure you want to remove this member?")) {
            removeMemberFromCircle.mutate({
                circleId: selectedCircleForView.id,
                userId
            }, {
                onSuccess: () => refetchMembers() // Refresh list immediately
            });
        }
    };

    const handleSaveNewUser = async () => {
        if (newUserEmail && newUserPass && newUserDisplayName) {
            await createNewUser.mutateAsync({
                email: newUserEmail,
                password: newUserPass,
                name: newUserDisplayName
            });
            setAddUserOpen(false);
            setNewUserEmail("");
            setNewUserPass("");
            setNewUserDisplayName("");
        }
    };

    return (
        <div className="container py-8 max-w-6xl space-y-8 pb-24">
            {/* Header Stats... (unchanged) */}
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
                    <TabsTrigger value="categories" className="gap-2">
                        <ListTodo className="w-4 h-4" /> Categories
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        {/* User Table Header... */}
                        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                            <h3 className="font-semibold">User Management</h3>
                            <Button size="sm" onClick={() => setAddUserOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" /> Add User
                            </Button>
                        </div>
                        {usersLoading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User (ID)</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Circles</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead>Stats</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allUsers?.map((user: any) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    <div>{user.display_name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{user.user_id.substring(0, 8)}...</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'admin' ? "destructive" : "outline"}>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {user.joined_circles && user.joined_circles.length > 0 ? (
                                                            user.joined_circles.map((c: any) => (
                                                                <div key={c.id} className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground gap-1 group">
                                                                    {c.name}
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-all w-3.5 h-3.5 flex items-center justify-center"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm(`Remove ${user.display_name} from ${c.name}?`)) {
                                                                                removeMemberFromCircle.mutate({ circleId: c.id, userId: user.user_id });
                                                                            }
                                                                        }}
                                                                        title="Remove from circle"
                                                                    >
                                                                        <X className="h-2.5 w-2.5" />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs opacity-50">-</span>
                                                        )}
                                                    </div>
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
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditUser(user)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>

                                                        {/* Promote/Demote Toggle */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 ${user.role === 'admin' ? 'text-destructive' : 'text-primary'}`}
                                                            onClick={() => {
                                                                const newRole = user.role === 'admin' ? 'user' : 'admin';
                                                                if (confirm(`Change ${user.display_name}'s role to ${newRole}?`)) {
                                                                    updateUserRole.mutate({ userId: user.user_id, role: newRole });
                                                                }
                                                            }}
                                                            disabled={user.email === 'admin@momentum.com'} // Prevent blocking super admin
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                if (confirm(`Delete ${user.display_name}? This cannot be undone.`)) {
                                                                    deleteUser.mutate(user.user_id);
                                                                }
                                                            }}
                                                            disabled={user.role === 'admin'}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </TabsContent >

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
                            <div className="overflow-x-auto">
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
                                                {/* ... rest of columns ... */}
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {circle.invite_code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group py-1"
                                                        onClick={() => handleViewMembers(circle)}
                                                        title="Click to manage members"
                                                    >
                                                        <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-md group-hover:bg-primary/10">
                                                            <Users className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                                                            <span className="font-medium">{circle.member_count}</span>
                                                        </div>
                                                        <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDistanceToNow(new Date(circle.created_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleViewMembers(circle)}
                                                            title="View Members"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleAddMember(circle)}
                                                            title="Add Member"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditCircle(circle)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                if (confirm(`Delete ${circle.name}?`)) {
                                                                    deleteCircle.mutate(circle.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden p-6 space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg">Manage Task Categories</h3>
                            <p className="text-sm text-muted-foreground">Add or remove task types available to users.</p>
                        </div>

                        <div className="flex gap-2 max-w-sm">
                            <Input
                                placeholder="New Category (e.g. Meditation)"
                                value={newTaskCategory}
                                onChange={(e) => setNewTaskCategory(e.target.value)}
                            />
                            <Button
                                onClick={() => {
                                    if (newTaskCategory.trim()) {
                                        addCategory.mutate(newTaskCategory.trim(), {
                                            onSuccess: () => setNewTaskCategory("")
                                        });
                                    }
                                }}
                                disabled={!newTaskCategory.trim()}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categories.map((cat: any) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                    <span className="font-medium">{cat.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            if (confirm(`Delete category "${cat.name}"?`)) {
                                                deleteCategory.mutate(cat.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No categories found. Add one above!
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs >

            {/* Edit User Dialog */}
            < Dialog open={editUserOpen} onOpenChange={setEditUserOpen} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                        </div>
                        <Button onClick={handleSaveUser} className="w-full">Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Edit Circle Dialog */}
            < Dialog open={editCircleOpen} onOpenChange={setEditCircleOpen} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Circle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={newCircleName} onChange={(e) => setNewCircleName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={newCircleDesc} onChange={(e) => setNewCircleDesc(e.target.value)} />
                        </div>
                        <Button onClick={handleSaveCircle} className="w-full">Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog >

            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Member to {selectedCircleForMember?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Search and add users who are not yet in this circle.
                        </p>

                        {/* Search Input */}
                        <div className="relative">
                            <Users className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or short ID..."
                                value={newMemberId} // Reusing this state for search query
                                onChange={(e) => setNewMemberId(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* User List */}
                        <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto bg-muted/10">
                            {usersLoading ? (
                                <div className="p-4 flex justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {allUsers
                                        ?.filter((u: any) => {
                                            // 1. Must not be in the current circle
                                            const isInCircle = u.joined_circles?.some((c: any) => c.id === selectedCircleForMember?.id);
                                            if (isInCircle) return false;

                                            // 2. Filter by search query (Name or Short ID)
                                            if (!newMemberId) return true;
                                            const query = newMemberId.toLowerCase();
                                            const shortId = u.user_id.substring(0, 8).toLowerCase();
                                            return (
                                                u.display_name?.toLowerCase().includes(query) ||
                                                shortId.includes(query)
                                            );
                                        })
                                        .map((u: any) => (
                                            <div key={u.user_id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                                                        {u.display_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{u.display_name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                                            ID: <span className="bg-muted px-1 rounded text-foreground">{u.user_id.substring(0, 8).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-xs gap-1 hover:bg-primary hover:text-primary-foreground"
                                                    onClick={() => {
                                                        addMemberToCircle.mutate({
                                                            circleId: selectedCircleForMember.id,
                                                            userId: u.user_id
                                                        }, {
                                                            onSuccess: () => {
                                                                toast({ title: `Added ${u.display_name} to circle!` });
                                                                // Don't close immediately so they can add more
                                                                // But we triggers a re-render because 'allUsers' query invalidation might be needed 
                                                                // typically handled by the mutation onSuccess in useAdmin
                                                            }
                                                        });
                                                    }}
                                                    disabled={addMemberToCircle.isPending}
                                                >
                                                    {addMemberToCircle.isPending ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3 h-3" /> Add
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ))}

                                    {/* Empty State */}
                                    {allUsers?.filter((u: any) => !u.joined_circles?.some((c: any) => c.id === selectedCircleForMember?.id)).length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            All users are already in this circle!
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Done</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            < Dialog open={addUserOpen} onOpenChange={setAddUserOpen} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <div className="relative">
                                <Input
                                    type={newUserShowPassword ? "text" : "password"}
                                    value={newUserPass}
                                    onChange={(e) => setNewUserPass(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                    onClick={() => setNewUserShowPassword(!newUserShowPassword)}
                                >
                                    {newUserShowPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input
                                value={newUserDisplayName}
                                onChange={(e) => setNewUserDisplayName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <Button
                            onClick={handleSaveNewUser}
                            className="w-full"
                            disabled={createNewUser.isPending}
                        >
                            {createNewUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog >

            {/* View Members Dialog */}
            < Dialog open={viewMembersOpen} onOpenChange={setViewMembersOpen} >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Members of {selectedCircleForView?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {membersLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                {circleMembers?.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center font-bold text-xs border">
                                                {member.display_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{member.display_name}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    ID: {member.user_id}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    // We can re-use the handleEditUser function from the parent scope
                                                    // But we need to make sure the user object has the right shape.
                                                    // The member object from getCircleMembers usually has the profile fields directly 
                                                    // OR nested in `profiles`? 
                                                    // In useAdmin.ts: `return data.map((m: any) => m.profiles);`
                                                    // So `member` IS the profile object.
                                                    handleEditUser(member);
                                                }}
                                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                title="Edit User Details"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="text-destructive hover:bg-destructive/10 h-8 px-2"
                                                title="Remove from Circle"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {circleMembers?.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No members found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog >

        </div >
    );
};

export default AdminPage;
