'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MunicipalityInfo,
    MunicipalJurisdiction,
    MunicipalOfficer,
    TriagePotholeItem,
    MunicipalStatus,
    DuplicateCandidateItem,
} from './types';
import { MunicipalityHeader } from './municipality-header';
import { JurisdictionMapView } from './jurisdiction-map-view';
import { TriageTable } from './triage-table';
import { TriageCardList } from './triage-card-list';
import { StatusTransitionModal } from './status-transition-modal';
import { OfficerAssignmentModal } from './officer-assignment-modal';
import { DuplicateComparisonModal } from './duplicate-comparison-modal';
import { DuplicateCandidateQueue } from './duplicate-candidate-queue';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
    Search,
    SlidersHorizontal,
    Table as TableIcon,
    LayoutGrid,
    Map as MapIcon,
    RefreshCw,
    X,
    Filter,
    Shield,
    CheckCircle2,
    Clock,
    Wrench,
    XCircle,
    ShieldCheck,
    GitMerge,
    Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface MunicipalityDashboardViewProps {
    initialMunicipality?: MunicipalityInfo;
    initialJurisdiction?: MunicipalJurisdiction | null;
    initialOfficers?: MunicipalOfficer[];
    initialPotholes?: TriagePotholeItem[];
    userRole?: string;
    userName?: string;
    userImage?: string | null;
    isDemo?: boolean;
}

export function MunicipalityDashboardView({
    initialMunicipality,
    initialJurisdiction,
    initialOfficers = [],
    initialPotholes = [],
    userRole = 'MANAGER',
    userName = 'Senior Officer Sharma',
    userImage = null,
    isDemo = false,
}: MunicipalityDashboardViewProps) {
    const [municipality, setMunicipality] = useState<MunicipalityInfo>(
        initialMunicipality || {
            id: 'demo-munc-ndmc',
            name: 'New Delhi Municipal Council (NDMC)',
            code: 'NDMC-ZONE-1',
        }
    );
    const [jurisdiction, setJurisdiction] = useState<MunicipalJurisdiction | null>(
        initialJurisdiction || null
    );
    const [officers, setOfficers] = useState<MunicipalOfficer[]>(initialOfficers);
    const [potholes, setPotholes] = useState<TriagePotholeItem[]>(initialPotholes);
    const [loading, setLoading] = useState(initialPotholes.length === 0);
    const [refreshing, setRefreshing] = useState(false);

    // Filters and Display state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'priority' | 'severity' | 'age'>('priority');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [showMap, setShowMap] = useState(true);

    // Dashboard Top-Level Navigation
    const [dashboardTab, setDashboardTab] = useState<'triage' | 'duplicates'>('triage');

    // Duplicate Candidates State
    const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidateItem[]>([]);
    const [loadingDuplicates, setLoadingDuplicates] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidateItem | null>(null);
    const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

    // Selection & Modals
    const [selectedPotholeId, setSelectedPotholeId] = useState<string | null>(null);
    const [transitionModalPothole, setTransitionModalPothole] = useState<TriagePotholeItem | null>(null);
    const [transitionModalOpen, setTransitionModalOpen] = useState(false);
    const [assignModalPothole, setAssignModalPothole] = useState<TriagePotholeItem | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    // Fetch duplicate candidates
    const fetchDuplicateCandidates = useCallback(async () => {
        setLoadingDuplicates(true);
        try {
            const queryParams = new URLSearchParams();
            if (isDemo) queryParams.set('demo', 'true');
            queryParams.set('status', 'POTENTIAL');

            const res = await fetch(`/api/municipality/duplicates?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to load duplicate candidates');

            const json = await res.json();
            if (json?.data) {
                setDuplicateCandidates(json.data);
            }
        } catch (err: any) {
            console.error('Error loading duplicate candidates:', err);
        } finally {
            setLoadingDuplicates(false);
        }
    }, [isDemo]);

    // Fetch dashboard data from API
    const fetchDashboardData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (isDemo) queryParams.set('demo', 'true');
            if (sortBy) queryParams.set('sortBy', sortBy);

            const res = await fetch(`/api/municipality/dashboard?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to load municipality triage data');

            const json = await res.json();
            if (json?.data) {
                if (json.data.municipality) setMunicipality(json.data.municipality);
                if (json.data.jurisdiction) setJurisdiction(json.data.jurisdiction);
                if (json.data.officers) setOfficers(json.data.officers);
                if (json.data.potholes) setPotholes(json.data.potholes);
            }
        } catch (err: any) {
            console.error('Error loading municipality triage dashboard:', err);
            toast.error('Failed to refresh triage queue');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isDemo, sortBy]);

    useEffect(() => {
        if (initialPotholes.length === 0) {
            fetchDashboardData(false);
        }
        fetchDuplicateCandidates();
    }, [fetchDashboardData, fetchDuplicateCandidates, initialPotholes.length]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchDashboardData(true), fetchDuplicateCandidates()]);
        toast.info('Triage queue and duplicate candidates updated');
    };

    const handleDuplicateResolved = (candidateId: string, resolution: 'CONFIRMED' | 'REJECTED') => {
        setDuplicateCandidates((prev) => prev.filter((c) => c.id !== candidateId));

        if (resolution === 'CONFIRMED') {
            const candidate = duplicateCandidates.find((c) => c.id === candidateId);
            if (candidate) {
                setPotholes((prev) =>
                    prev.map((p) => {
                        if (p.id === candidate.duplicateId) {
                            return { ...p, status: 'REJECTED' };
                        }
                        if (p.id === candidate.potholeId) {
                            const addedVotes = candidate.duplicate.votesCount || 0;
                            return {
                                ...p,
                                votesCount: (p.votesCount || p.votes?.length || 0) + addedVotes,
                            };
                        }
                        return p;
                    })
                );
            }
        }
    };

    const handleQuickResolveDuplicate = async (candidateId: string, resolution: 'CONFIRMED' | 'REJECTED') => {
        try {
            const res = await fetch(`/api/potholes/duplicates/${candidateId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: resolution }),
            });
            if (!res.ok) throw new Error('Failed to resolve duplicate candidate');
            toast.success(
                resolution === 'CONFIRMED'
                    ? 'Duplicate candidate confirmed & merged'
                    : 'Candidate dismissed as false positive'
            );
            handleDuplicateResolved(candidateId, resolution);
        } catch (err: any) {
            toast.error('Resolution failed', { description: err.message });
        }
    };

    // Filtered and sorted potholes
    const filteredPotholes = useMemo(() => {
        return potholes.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (severityFilter === 'HIGH' && item.severity < 4) {
                return false;
            }
            if (severityFilter === 'MEDIUM' && item.severity !== 3) {
                return false;
            }
            if (severityFilter === 'LOW' && item.severity > 2) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchDesc = item.description.toLowerCase().includes(q);
                const matchCity = item.city?.toLowerCase().includes(q);
                const matchId = item.id.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchCity && !matchId) {
                    return false;
                }
            }
            return true;
        });
    }, [potholes, statusFilter, severityFilter, searchQuery]);

    // Handlers for state transition modal
    const handleOpenTransitionModal = (pothole: TriagePotholeItem) => {
        setTransitionModalPothole(pothole);
        setTransitionModalOpen(true);
    };

    const handleStatusTransitionSuccess = (
        potholeId: string,
        newStatus: MunicipalStatus,
        reason?: string
    ) => {
        setPotholes((prev) =>
            prev.map((p) => (p.id === potholeId ? { ...p, status: newStatus } : p))
        );
    };

    // Handlers for officer assignment modal
    const handleOpenAssignModal = (pothole: TriagePotholeItem) => {
        setAssignModalPothole(pothole);
        setAssignModalOpen(true);
    };

    const handleAssignSuccess = (
        potholeId: string,
        officerId: string,
        officerName: string
    ) => {
        setPotholes((prev) =>
            prev.map((p) =>
                p.id === potholeId
                    ? {
                          ...p,
                          assignedOfficerId: officerId,
                          assignedOfficer: { id: officerId, name: officerName },
                          status: p.status === 'PENDING' || p.status === 'VERIFIED' ? 'ONGOING' : p.status,
                      }
                    : p
            )
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header with Municipality Identity & KPI Stats */}
            <MunicipalityHeader
                municipality={municipality}
                potholes={potholes}
                userRole={userRole}
                userName={userName}
                userImage={userImage}
            />

            {/* Main Dashboard Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Primary Navigation Tabs: Triage Queue vs. Duplicate Candidates */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setDashboardTab('triage')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                dashboardTab === 'triage'
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                        >
                            <Shield className="size-3.5" />
                            <span>Triage Reports</span>
                            <Badge
                                variant={dashboardTab === 'triage' ? 'outline' : 'secondary'}
                                className="ml-0.5 text-[10px] px-1.5 py-0"
                            >
                                {potholes.length}
                            </Badge>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDashboardTab('duplicates')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                dashboardTab === 'duplicates'
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                        >
                            <GitMerge className="size-3.5" />
                            <span>Duplicate Candidates</span>
                            {duplicateCandidates.length > 0 && (
                                <Badge
                                    className={`ml-0.5 text-[10px] px-1.5 py-0 ${
                                        dashboardTab === 'duplicates'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-amber-500 text-white hover:bg-amber-600'
                                    }`}
                                >
                                    {duplicateCandidates.length}
                                </Badge>
                            )}
                        </button>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                        {dashboardTab === 'triage'
                            ? 'Reviewing citizen reports within jurisdictional boundaries'
                            : 'AI & proximity matching pairs ready for consolidation'}
                    </div>
                </div>

                {dashboardTab === 'duplicates' ? (
                    /* Dedicated Duplicate Resolution Queue */
                    <section aria-label="Duplicate Candidates Queue">
                        <DuplicateCandidateQueue
                            candidates={duplicateCandidates}
                            loading={loadingDuplicates}
                            onReviewCandidate={(cand) => {
                                setSelectedCandidate(cand);
                                setComparisonModalOpen(true);
                            }}
                            onQuickResolve={handleQuickResolveDuplicate}
                        />
                    </section>
                ) : (
                    <>
                        {/* Jurisdictional Map Section */}
                        {showMap && (
                            <section aria-label="Jurisdiction Boundary & Live Map">
                                <JurisdictionMapView
                                    jurisdiction={jurisdiction}
                                    potholes={filteredPotholes}
                                    selectedPotholeId={selectedPotholeId}
                                    onSelectPothole={(p) => setSelectedPotholeId(p.id)}
                                />
                            </section>
                        )}

                        {/* Triage Control Toolbar */}
                        <section aria-label="Triage Queue Controls" className="space-y-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                {/* Search Input */}
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter by report title, street, or case ID..."
                                        className="pl-9 pr-8 text-xs h-9"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* View & Map Toggles */}
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    {/* Toggle Map */}
                                    <Button
                                        variant={showMap ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => setShowMap(!showMap)}
                                        className="h-9 text-xs gap-1.5 font-medium"
                                        id="toggle-map-btn"
                                    >
                                        <MapIcon className="size-3.5" />
                                        <span className="hidden sm:inline">{showMap ? 'Hide Map' : 'Show Map'}</span>
                                    </Button>

                                    {/* View Mode Switcher */}
                                    <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30">
                                        <Button
                                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('table')}
                                            className="h-7 px-2.5 text-xs gap-1"
                                            title="Table view"
                                            id="view-mode-table-btn"
                                        >
                                            <TableIcon className="size-3.5" />
                                            <span className="hidden sm:inline">Table</span>
                                        </Button>
                                        <Button
                                            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setViewMode('cards')}
                                            className="h-7 px-2.5 text-xs gap-1"
                                            title="Card grid view"
                                            id="view-mode-cards-btn"
                                        >
                                            <LayoutGrid className="size-3.5" />
                                            <span className="hidden sm:inline">Cards</span>
                                        </Button>
                                    </div>

                                    {/* Refresh Button */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleRefresh}
                                        disabled={refreshing || loading}
                                        className="size-9 text-muted-foreground hover:text-foreground"
                                        title="Refresh triage queue"
                                    >
                                        <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Pills & Sort Selector */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
                                {/* Status Filter Buttons */}
                                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                                    {[
                                        { label: 'All Statuses', value: 'ALL' },
                                        { label: 'Pending', value: 'PENDING', icon: Clock },
                                        { label: 'Verified', value: 'VERIFIED', icon: ShieldCheck },
                                        { label: 'Ongoing', value: 'ONGOING', icon: Wrench },
                                        { label: 'Fixed', value: 'FIXED', icon: CheckCircle2 },
                                        { label: 'Rejected', value: 'REJECTED', icon: XCircle },
                                    ].map((tab) => {
                                        const isSelected = statusFilter === tab.value;
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.value}
                                                onClick={() => setStatusFilter(tab.value)}
                                                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                                    isSelected
                                                        ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                                                        : 'border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {Icon && <Icon className="size-3" />}
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Sort selector */}
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground hidden sm:inline">Sort by:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="h-8 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="priority">Priority Score (High → Low)</option>
                                        <option value="severity">Severity (Critical First)</option>
                                        <option value="age">Age (Oldest Unresolved First)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Triage Queue List / Table */}
                        <section aria-label="Triage Queue Content">
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center rounded-xl border bg-card/60 gap-3">
                                    <RefreshCw className="size-6 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground font-medium">
                                        Loading municipal triage reports...
                                    </span>
                                </div>
                            ) : viewMode === 'table' ? (
                                <TriageTable
                                    potholes={filteredPotholes}
                                    selectedPotholeId={selectedPotholeId}
                                    onSelectPothole={(p) => setSelectedPotholeId(p.id)}
                                    onOpenTransitionModal={handleOpenTransitionModal}
                                    onOpenAssignModal={handleOpenAssignModal}
                                    isManagerOrAdmin={userRole === 'MANAGER' || userRole === 'ADMIN'}
                                    duplicateCandidates={duplicateCandidates}
                                    onOpenDuplicateReview={(cand) => {
                                        setSelectedCandidate(cand);
                                        setComparisonModalOpen(true);
                                    }}
                                />
                            ) : (
                                <TriageCardList
                                    potholes={filteredPotholes}
                                    selectedPotholeId={selectedPotholeId}
                                    onSelectPothole={(p) => setSelectedPotholeId(p.id)}
                                    onOpenTransitionModal={handleOpenTransitionModal}
                                    onOpenAssignModal={handleOpenAssignModal}
                                    isManagerOrAdmin={userRole === 'MANAGER' || userRole === 'ADMIN'}
                                    duplicateCandidates={duplicateCandidates}
                                    onOpenDuplicateReview={(cand) => {
                                        setSelectedCandidate(cand);
                                        setComparisonModalOpen(true);
                                    }}
                                />
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* Lifecycle State Machine Transition Modal */}
            <StatusTransitionModal
                pothole={transitionModalPothole}
                open={transitionModalOpen}
                onOpenChange={setTransitionModalOpen}
                onSuccess={handleStatusTransitionSuccess}
            />

            {/* Officer Assignment Modal */}
            <OfficerAssignmentModal
                pothole={assignModalPothole}
                officers={officers}
                open={assignModalOpen}
                onOpenChange={setAssignModalOpen}
                onSuccess={handleAssignSuccess}
            />

            {/* Side-by-Side Duplicate Candidate Comparison Modal */}
            <DuplicateComparisonModal
                candidate={selectedCandidate}
                open={comparisonModalOpen}
                onOpenChange={setComparisonModalOpen}
                onResolved={handleDuplicateResolved}
            />
        </div>
    );
}
