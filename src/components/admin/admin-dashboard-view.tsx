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
import {
    ShieldCheck,
    Building2,
    Users,
    Globe,
    Activity,
    RefreshCw,
    LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminDashboardViewProps {
    userName?: string;
    isDemo?: boolean;
}

// Fallback Mock Data for Demo mode or initial render
const MOCK_STATS: AdminStats = {
    totalPotholes: 42,
    pendingCount: 12,
    verifiedCount: 15,
    ongoingCount: 8,
    fixedCount: 5,
    rejectedCount: 2,
    escalatedCount: 3,
    totalMunicipalities: 4,
    totalUsers: 128,
    totalStaff: 18,
    jurisdictionCount: 4,
    resolutionRate: 12,
};

const MOCK_MUNICIPALITIES: MunicipalityItem[] = [
    {
        id: 'muni_mumbai_01',
        name: 'Brihanmumbai Municipal Corporation (BMC)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memberCount: 8,
        potholeCount: 24,
        jurisdiction: {
            id: 'jur_mumbai_01',
            name: 'BMC Boundary',
            boundary: [
                [
                    [72.82, 18.92],
                    [72.95, 18.92],
                    [72.95, 19.18],
                    [72.82, 19.18],
                    [72.82, 18.92],
                ],
            ],
        },
    },
    {
        id: 'muni_thane_02',
        name: 'Thane Municipal Corporation (TMC)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memberCount: 5,
        potholeCount: 12,
        jurisdiction: {
            id: 'jur_thane_02',
            name: 'TMC Boundary',
            boundary: [
                [
                    [72.95, 19.18],
                    [73.05, 19.18],
                    [73.05, 19.25],
                    [72.95, 19.25],
                    [72.95, 19.18],
                ],
            ],
        },
    },
];

const MOCK_MEMBERS: StaffMember[] = [
    {
        id: 'mem_01',
        userId: 'u_01',
        municipalityId: 'muni_mumbai_01',
        role: 'MANAGER',
        createdAt: new Date().toISOString(),
        user: {
            id: 'u_01',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@bmc.gov.in',
            role: 'USER',
            image: null,
        },
        municipality: {
            id: 'muni_mumbai_01',
            name: 'Brihanmumbai Municipal Corporation (BMC)',
        },
    },
    {
        id: 'mem_02',
        userId: 'u_02',
        municipalityId: 'muni_mumbai_01',
        role: 'OFFICER',
        createdAt: new Date().toISOString(),
        user: {
            id: 'u_02',
            name: 'Priya Sharma',
            email: 'priya.sharma@bmc.gov.in',
            role: 'USER',
            image: null,
        },
        municipality: {
            id: 'muni_mumbai_01',
            name: 'Brihanmumbai Municipal Corporation (BMC)',
        },
    },
];

const MOCK_JURISDICTIONS: JurisdictionItem[] = [
    {
        id: 'jur_mumbai_01',
        name: 'BMC Zone 1 Jurisdiction',
        municipalityId: 'muni_mumbai_01',
        municipalityName: 'Brihanmumbai Municipal Corporation (BMC)',
        boundary: [
            [
                [72.82, 18.92],
                [72.95, 18.92],
                [72.95, 19.18],
                [72.82, 19.18],
                [72.82, 18.92],
            ],
        ],
    },
];

export function AdminDashboardView({ userName = 'Super Admin', isDemo = false }: AdminDashboardViewProps) {
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
            else if (isDemo) setStats(MOCK_STATS);

            if (muniRes?.success) setMunicipalities(muniRes.data);
            else if (isDemo) setMunicipalities(MOCK_MUNICIPALITIES);

            if (memRes?.success) setMembers(memRes.data);
            else if (isDemo) setMembers(MOCK_MEMBERS);

            if (jurRes?.success) setJurisdictions(jurRes.data);
            else if (isDemo) setJurisdictions(MOCK_JURISDICTIONS);
        } catch (err) {
            console.error('Failed to load admin data:', err);
            if (isDemo) {
                setStats(MOCK_STATS);
                setMunicipalities(MOCK_MUNICIPALITIES);
                setMembers(MOCK_MEMBERS);
                setJurisdictions(MOCK_JURISDICTIONS);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isDemo]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Top Navigation Bar Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
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
                            {isDemo && (
                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    Demo Mode
                                </Badge>
                            )}
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
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
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
                        Jurisdiction Map
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
            </Tabs>
        </div>
    );
}
