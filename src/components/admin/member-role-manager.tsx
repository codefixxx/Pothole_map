'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/src/components/ui/dialog';
import { UserCheck, Plus, Search, Shield, Trash2, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface StaffMember {
    id: string;
    userId: string;
    municipalityId: string;
    role: 'OFFICER' | 'MANAGER';
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        role: 'USER' | 'ADMIN';
        image: string | null;
    };
    municipality: {
        id: string;
        name: string;
    };
}

export interface UserSearchResult {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    municipalityMember?: {
        municipality: {
            name: string;
        };
    } | null;
}

interface MemberRoleManagerProps {
    municipalities: Array<{ id: string; name: string }>;
    members: StaffMember[];
    onRefresh: () => void;
    isLoading?: boolean;
}

export function MemberRoleManager({ municipalities, members, onRefresh, isLoading }: MemberRoleManagerProps) {
    const [filterQuery, setFilterQuery] = useState('');
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // User lookup state
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('');
    const [selectedRole, setSelectedRole] = useState<'OFFICER' | 'MANAGER'>('OFFICER');
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search users with debounce
    useEffect(() => {
        if (!userSearch.trim()) {
            setUserResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingUsers(true);
            try {
                const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}`);
                const data = await res.json();
                if (data.success) {
                    setUserResults(data.data);
                }
            } catch (err) {
                console.error('Failed to search users:', err);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [userSearch]);

    const filteredMembers = members.filter(
        (m) =>
            m.user.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
            m.user.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
            m.municipality.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const handleAssignMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            toast.error('Please select a user');
            return;
        }
        if (!selectedMunicipalityId) {
            toast.error('Please select a municipality');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/municipalities/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    municipalityId: selectedMunicipalityId,
                    role: selectedRole,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to assign staff member');
            }

            toast.success(`User "${selectedUser.name || selectedUser.email}" assigned as ${selectedRole}`);
            setIsAssignOpen(false);
            setSelectedUser(null);
            setUserSearch('');
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Error assigning staff member');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: 'OFFICER' | 'MANAGER') => {
        try {
            const res = await fetch(`/api/admin/municipalities/members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to update role');
            }

            toast.success(`Role updated to ${newRole}`);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Error updating role');
        }
    };

    const handleRemoveMember = async (memberId: string, userName: string) => {
        if (!confirm(`Are you sure you want to remove ${userName} from staff?`)) return;

        try {
            const res = await fetch(`/api/admin/municipalities/members/${memberId}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to remove member');
            }

            toast.success('Staff member removed successfully');
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Error removing staff member');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Action Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search staff by name, email, municipality..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 size-4" />
                            Assign Staff Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <form onSubmit={handleAssignMember}>
                            <DialogHeader>
                                <DialogTitle>Assign Municipal Staff</DialogTitle>
                                <DialogDescription>
                                    Promote a verified citizen account to Officer or Manager within a municipality.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                {/* Search User */}
                                <div className="space-y-2">
                                    <Label>Select User</Label>
                                    <Input
                                        placeholder="Search user by name or email..."
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setSelectedUser(null);
                                        }}
                                    />

                                    {selectedUser ? (
                                        <div className="flex items-center justify-between rounded-md border border-primary/50 bg-primary/5 p-2 text-xs">
                                            <div>
                                                <p className="font-semibold">{selectedUser.name || 'Unnamed'}</p>
                                                <p className="text-muted-foreground">{selectedUser.email}</p>
                                            </div>
                                            <Badge variant="outline">Selected</Badge>
                                        </div>
                                    ) : userResults.length > 0 ? (
                                        <div className="max-h-40 overflow-y-auto rounded-md border p-1 space-y-1">
                                            {userResults.map((u) => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => setSelectedUser(u)}
                                                    className="flex items-center justify-between rounded p-2 text-xs hover:bg-muted cursor-pointer"
                                                >
                                                    <div>
                                                        <p className="font-medium">{u.name || 'Unnamed'}</p>
                                                        <p className="text-muted-foreground">{u.email}</p>
                                                    </div>
                                                    {u.municipalityMember ? (
                                                        <span className="text-[10px] text-amber-500 font-medium">
                                                            Already staff
                                                        </span>
                                                    ) : !u.emailVerified ? (
                                                        <span className="text-[10px] text-red-500 font-medium">
                                                            Unverified Email
                                                        </span>
                                                    ) : (
                                                        <Badge variant="secondary">Select</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : userSearch && !isSearchingUsers ? (
                                        <p className="text-xs text-muted-foreground">No users found matching query.</p>
                                    ) : null}
                                </div>

                                {/* Select Municipality */}
                                <div className="space-y-2">
                                    <Label>Municipality</Label>
                                    <Select value={selectedMunicipalityId} onValueChange={setSelectedMunicipalityId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select target municipality..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {municipalities.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(v) => setSelectedRole(v as 'OFFICER' | 'MANAGER')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OFFICER">Officer (Triage & Field Dispatch)</SelectItem>
                                            <SelectItem value="MANAGER">Manager (Full Reassignment & Override)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAssignOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting || !selectedUser}>
                                    {isSubmitting ? 'Assigning...' : 'Assign Staff'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Members List Table / Cards */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserCheck className="size-4 text-primary" />
                        Active Municipal Staff Roster ({filteredMembers.length})
                    </CardTitle>
                    <CardDescription>
                        Manage personnel permissions and operational roles across municipalities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredMembers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            No staff members match the current filter.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMembers.map((mem) => (
                                <div
                                    key={mem.id}
                                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-muted font-bold text-sm">
                                            {mem.user.name ? mem.user.name[0]?.toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{mem.user.name || 'Unnamed Staff'}</p>
                                                <Badge
                                                    variant={mem.role === 'MANAGER' ? 'default' : 'secondary'}
                                                    className="text-[10px]"
                                                >
                                                    {mem.role}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{mem.user.email}</p>
                                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Building2 className="size-3 text-primary" />
                                                <span>{mem.municipality.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                                        <Select
                                            value={mem.role}
                                            onValueChange={(val) => handleUpdateRole(mem.id, val as 'OFFICER' | 'MANAGER')}
                                        >
                                            <SelectTrigger className="h-8 w-28 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OFFICER">OFFICER</SelectItem>
                                                <SelectItem value="MANAGER">MANAGER</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveMember(mem.id, mem.user.name || mem.user.email)}
                                            title="Remove from staff"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
