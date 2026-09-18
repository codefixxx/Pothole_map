'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/src/components/ui/dialog';
import { Building2, Plus, Users, MapPin, AlertCircle, Search, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface MunicipalityItem {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    potholeCount: number;
    members?: Array<{
        id: string;
        role: 'OFFICER' | 'MANAGER';
        user: {
            id: string;
            name: string | null;
            email: string;
            image: string | null;
        };
    }>;
    jurisdiction?: {
        id: string;
        name: string;
        boundary: number[][][];
    } | null;
}

interface MunicipalityManagerProps {
    municipalities: MunicipalityItem[];
    onRefresh: () => void;
    isLoading?: boolean;
}

export function MunicipalityManager({ municipalities, onRefresh, isLoading }: MunicipalityManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newMunicipalityName, setNewMunicipalityName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selected municipality for members modal
    const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityItem | null>(null);

    const filteredMunicipalities = municipalities.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateMunicipality = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMunicipalityName.trim()) {
            toast.error('Municipality name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/municipalities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newMunicipalityName.trim() }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to create municipality');
            }

            toast.success(`Municipality "${data.data.name}" created successfully`);
            setNewMunicipalityName('');
            setIsCreateOpen(false);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || 'Error creating municipality');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter municipalities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                        <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 size-4" />
                                Add Municipality
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreateMunicipality}>
                                <DialogHeader>
                                    <DialogTitle>Create New Municipality</DialogTitle>
                                    <DialogDescription>
                                        Add a civic administrative jurisdiction for road maintenance dispatch.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="muniName">Municipality Name</Label>
                                        <Input
                                            id="muniName"
                                            placeholder="e.g., Greater Mumbai Municipal Corporation"
                                            value={newMunicipalityName}
                                            onChange={(e) => setNewMunicipalityName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating...' : 'Create Municipality'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Municipalities Grid */}
            {filteredMunicipalities.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-8 text-center">
                    <Building2 className="size-12 text-muted-foreground/50 mb-3" />
                    <CardTitle className="text-lg">No Municipalities Found</CardTitle>
                    <CardDescription className="max-w-xs mt-1">
                        {searchQuery
                            ? 'No municipalities match your search criteria.'
                            : 'Get started by creating your first municipality.'}
                    </CardDescription>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMunicipalities.map((muni) => (
                        <Card key={muni.id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                            <Building2 className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{muni.name}</CardTitle>
                                            <span className="text-[10px] text-muted-foreground">
                                                ID: {muni.id.slice(0, 10)}...
                                            </span>
                                        </div>
                                    </div>

                                    {muni.jurisdiction ? (
                                        <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]">
                                            <CheckCircle className="size-3" />
                                            Bound Boundary
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1 text-[11px]">
                                            <AlertCircle className="size-3 text-amber-500" />
                                            No Polygon
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-0">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-md border bg-muted/30 p-2.5">
                                        <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                                            <Users className="size-3.5" />
                                            <span>Staff Members</span>
                                        </div>
                                        <span className="text-lg font-bold">{muni.memberCount}</span>
                                    </div>

                                    <div className="rounded-md border bg-muted/30 p-2.5">
                                        <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                                            <MapPin className="size-3.5" />
                                            <span>Reports Routed</span>
                                        </div>
                                        <span className="text-lg font-bold">{muni.potholeCount}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => setSelectedMunicipality(muni)}
                                >
                                    <Users className="mr-2 size-3.5" />
                                    Manage Members ({muni.memberCount})
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Members Dialog */}
            <Dialog open={!!selectedMunicipality} onOpenChange={(open) => !open && setSelectedMunicipality(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="size-5 text-primary" />
                            {selectedMunicipality?.name} Members
                        </DialogTitle>
                        <DialogDescription>
                            Assigned municipal officers and managers for this jurisdiction.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
                        {!selectedMunicipality?.members || selectedMunicipality.members.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No staff members currently assigned to this municipality.
                            </div>
                        ) : (
                            selectedMunicipality.members.map((mem) => (
                                <div key={mem.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-semibold">{mem.user.name || 'Unnamed User'}</p>
                                        <p className="text-xs text-muted-foreground">{mem.user.email}</p>
                                    </div>
                                    <Badge variant={mem.role === 'MANAGER' ? 'default' : 'secondary'}>
                                        {mem.role}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
