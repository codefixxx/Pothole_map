'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { SignOutButton } from '@/src/components/ui/signout-button';
import { AdminStatsOverview, AdminStats } from './admin-stats-overview';
import { MunicipalityManager, MunicipalityItem } from './municipality-manager';
import { MemberRoleManager, StaffMember } from './member-role-manager';
import { JurisdictionVisualizer, JurisdictionItem } from './jurisdiction-visualizer';
import { AuditLogViewer } from './audit-log-viewer';
import {
    ShieldCheck,
    Building2,
    Users,
    Globe,
    Activity,
    RefreshCw,
    LogOut,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/src/components/motion';

interface AdminDashboardViewProps {
    userName?: string;
}

export function AdminDashboardView({ userName = 'Super Admin' }: AdminDashboardViewProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);

    // Data state
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [municipalities, setMunicipalities] = useState<MunicipalityItem[]>([]);
    const [members, setMembers] = useState<StaffMember[]>([]);
    const [jurisdictions, setJurisdictions] = useState<JurisdictionItem[]>([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, muniRes, memRes, jurRes] = await Promise.all([
                fetch('/api/admin/stats').then((r) => r.json()).catch(() => null),
                fetch('/api/admin/municipalities').then((r) => r.json()).catch(() => null),
                fetch('/api/admin/municipalities/members').then((r) => r.json()).catch(() => null),
                fetch('/api/admin/jurisdictions').then((r) => r.json()).catch(() => null),
            ]);

            if (statsRes?.success) setStats(statsRes.data);
            if (muniRes?.success) setMunicipalities(muniRes.data);
            if (memRes?.success) setMembers(memRes.data);
            if (jurRes?.success) setJurisdictions(jurRes.data);
        } catch (err) {
            console.error('Failed to load admin data:', err);
            toast.error('Failed to load admin dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <PageTransition className="container mx-auto space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl">
            {/* Top Dashboard Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">Super Admin Portal</h1>
                            <Badge variant="default" className="text-[10px] bg-primary">
                                Platform Control
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Welcome back, <strong className="text-foreground">{userName}</strong>. System-wide jurisdiction & member management.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                    <SignOutButton />
                </div>
            </div>

            {/* Dashboard Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full max-w-4xl">
                    <TabsTrigger value="overview" className="gap-2 text-xs">
                        <Activity className="size-3.5" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="municipalities" className="gap-2 text-xs">
                        <Building2 className="size-3.5" />
                        Municipalities ({municipalities.length})
                    </TabsTrigger>
                    <TabsTrigger value="members" className="gap-2 text-xs">
                        <Users className="size-3.5" />
                        Staff Roster ({members.length})
                    </TabsTrigger>
                    <TabsTrigger value="jurisdictions" className="gap-2 text-xs">
                        <Globe className="size-3.5" />
                        Jurisdictions
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="gap-2 text-xs">
                        <ShieldAlert className="size-3.5" />
                        Audit Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <AdminStatsOverview stats={stats} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="municipalities">
                    <MunicipalityManager
                        municipalities={municipalities}
                        onRefresh={fetchData}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="members">
                    <MemberRoleManager
                        municipalities={municipalities.map((m) => ({ id: m.id, name: m.name }))}
                        members={members}
                        onRefresh={fetchData}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="jurisdictions">
                    <JurisdictionVisualizer
                        jurisdictions={jurisdictions}
                        onRefresh={fetchData}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="audit">
                    <AuditLogViewer />
                </TabsContent>
            </Tabs>
        </PageTransition>
    );
}
