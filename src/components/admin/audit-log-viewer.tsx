'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/components/ui/dialog';
import { Search, RefreshCw, ShieldAlert, FileText, ChevronLeft, ChevronRight, User as UserIcon, Calendar, Tag, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export interface AuditLogItem {
    id: string;
    actorId: string;
    actor: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        image: string | null;
    };
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    ipAddress: string | null;
    createdAt: string;
}

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

    const fetchAuditLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=15`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotalPages(data.totalPages || 1);
            } else {
                toast.error('Failed to load audit logs.');
            }
        } catch {
            toast.error('Network error loading audit logs.');
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    const filteredLogs = logs.filter((log) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
        return (
            log.action.toLowerCase().includes(q) ||
            log.entityType.toLowerCase().includes(q) ||
            log.actor.email.toLowerCase().includes(q) ||
            (log.actor.name && log.actor.name.toLowerCase().includes(q)) ||
            detailsStr.includes(q)
        );
    });

    const getLogSummary = (log: AuditLogItem): string | null => {
        const details = log.details || {};
        if (typeof details === 'string') return details;
        if (details.description) return details.description;
        if (details.oldStatus && details.newStatus) {
            let text = `${details.oldStatus} → ${details.newStatus}`;
            if (details.reason) text += `: "${details.reason}"`;
            return text;
        }
        if (details.fromStatus && details.toStatus) {
            let text = `${details.fromStatus} → ${details.toStatus}`;
            if (details.reason) text += `: "${details.reason}"`;
            return text;
        }
        if (details.officerEmail) {
            return `Assigned officer ${details.officerName ? `${details.officerName} (${details.officerEmail})` : details.officerEmail}`;
        }
        if (details.reason) return details.reason;
        if (details.notes) return details.notes;
        return null;
    };

    const getActionBadge = (action: string) => {
        let label = action;
        if (action.startsWith('STATUS_TRANSITION_')) {
            label = action.replace('STATUS_TRANSITION_', '').replace('_TO_', ' → ');
        } else if (action === 'OFFICER_ASSIGNED') {
            label = 'Officer Assigned';
        } else if (action === 'MUNICIPALITY_CREATED') {
            label = 'Municipality Created';
        }

        if (action.includes('TRANSITION') || action.includes('STATUS')) {
            return (
                <Badge
                    title={action}
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 max-w-[180px] truncate inline-block align-middle"
                >
                    {label}
                </Badge>
            );
        } else if (action.includes('ASSIGN')) {
            return (
                <Badge
                    title={action}
                    className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 max-w-[180px] truncate inline-block align-middle"
                >
                    {label}
                </Badge>
            );
        } else if (action.includes('DELETE') || action.includes('REJECT')) {
            return (
                <Badge
                    title={action}
                    className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 max-w-[180px] truncate inline-block align-middle"
                >
                    {label}
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" title={action} className="max-w-[180px] truncate inline-block align-middle">
                {label}
            </Badge>
        );
    };

    return (
        <Card className="border-border/60 shadow-sm w-full overflow-hidden">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ShieldAlert className="size-4 text-primary shrink-0" />
                        <span>Municipal & Platform Audit Logs</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Immutable audit trail of privileged status changes, officer assignments, and admin operations.
                    </CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAuditLogs}
                    disabled={isLoading}
                    className="gap-1.5 h-8 self-start sm:self-auto shrink-0"
                >
                    <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by action, entity, officer email, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs w-full"
                        />
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="block sm:hidden space-y-3">
                    {isLoading ? (
                        <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border bg-muted/20">
                            Loading audit logs...
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border bg-muted/20">
                            No audit records found.
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const summary = getLogSummary(log);
                            return (
                                <div
                                    key={log.id}
                                    className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2.5 shadow-2xs hover:bg-accent/20 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>{getActionBadge(log.action)}</div>
                                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                            {log.actor.name ? log.actor.name.charAt(0).toUpperCase() : <UserIcon className="size-3" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-xs text-foreground truncate">{log.actor.name || log.actor.email}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{log.actor.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                                        <Tag className="size-3 text-primary shrink-0" />
                                        <span className="font-bold text-foreground">{log.entityType}</span>
                                        <span className="truncate">#{log.entityId}</span>
                                    </div>

                                    {summary && (
                                        <p className="text-xs text-foreground/90 font-medium break-words line-clamp-2 pl-0.5">
                                            {summary}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedLog(log)}
                                            className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary/90"
                                        >
                                            <FileText className="size-3" />
                                            <span>Inspect Details</span>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop View: Full Responsive Table */}
                <div className="hidden sm:block w-full overflow-x-auto rounded-lg border border-border/60">
                    <Table className="w-full">
                        <TableHeader className="bg-muted/40 text-xs">
                            <TableRow>
                                <TableHead className="w-[150px] whitespace-nowrap">Timestamp</TableHead>
                                <TableHead className="w-[180px] min-w-[160px]">Actor / User</TableHead>
                                <TableHead className="w-[160px] min-w-[140px]">Action</TableHead>
                                <TableHead className="w-[130px] min-w-[110px]">Target Entity</TableHead>
                                <TableHead className="min-w-[200px]">Description / Summary</TableHead>
                                <TableHead className="text-right w-[90px] whitespace-nowrap">Inspect</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        Loading audit logs...
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => {
                                    const summary = getLogSummary(log);
                                    return (
                                        <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="max-w-[180px]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                                        {log.actor.name ? log.actor.name.charAt(0).toUpperCase() : <UserIcon className="size-3" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <p className="font-medium text-xs text-foreground truncate">{log.actor.name || log.actor.email}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate" title={log.actor.email}>
                                                            {log.actor.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-w-[140px]">{getActionBadge(log.action)}</TableCell>
                                            <TableCell className="font-mono text-[11px] whitespace-nowrap">
                                                <span className="font-semibold text-foreground/80">{log.entityType}</span>
                                                <span className="text-muted-foreground ml-1" title={log.entityId}>
                                                    #{log.entityId.slice(0, 8)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-[320px] min-w-[200px]">
                                                {summary ? (
                                                    <p className="text-xs text-foreground/90 font-medium break-words line-clamp-2" title={summary}>
                                                        {summary}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/60 italic">No description</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="h-7 px-2 text-xs gap-1 hover:text-primary"
                                                >
                                                    <FileText className="size-3.5 text-muted-foreground" />
                                                    <span>Inspect</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                    <p className="text-xs text-muted-foreground font-mono">
                        Page {page} of {totalPages} ({filteredLogs.length} entries shown)
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 gap-1 text-xs"
                        >
                            <ChevronLeft className="size-3.5" />
                            <span>Previous</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-8 gap-1 text-xs"
                        >
                            <span>Next</span>
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Inspect JSON Details Dialog */}
            <Dialog open={Boolean(selectedLog)} onOpenChange={(o) => !o && setSelectedLog(null)}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <ShieldAlert className="size-4 text-primary shrink-0" />
                            <span className="truncate">Audit Record #{selectedLog?.id}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs font-mono">
                            Recorded at {selectedLog ? new Date(selectedLog.createdAt).toLocaleString() : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 pt-2 overflow-y-auto max-h-[calc(80vh-80px)] pr-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs rounded-xl border bg-muted/30 p-3.5">
                                <div className="space-y-0.5 min-w-0">
                                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Actor Name / Email</span>
                                    <span className="font-semibold text-foreground block truncate" title={selectedLog.actor.email}>
                                        {selectedLog.actor.name || selectedLog.actor.email}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block truncate">{selectedLog.actor.email} ({selectedLog.actor.role})</span>
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Action Type</span>
                                    <span className="font-semibold text-foreground block break-all">{selectedLog.action}</span>
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Target Entity</span>
                                    <span className="font-mono text-foreground block break-all">{selectedLog.entityType} ({selectedLog.entityId})</span>
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">IP / Origin</span>
                                    <span className="font-mono text-foreground block">{selectedLog.ipAddress || 'Internal System'}</span>
                                </div>
                            </div>

                            {getLogSummary(selectedLog) && (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-1">
                                    <span className="text-primary font-bold text-[10px] uppercase tracking-wider block">Action Summary</span>
                                    <p className="font-medium text-foreground leading-relaxed break-words">{getLogSummary(selectedLog)}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Payload Metadata (JSON)</h4>
                                <pre className="rounded-xl bg-zinc-950 p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto overflow-y-auto max-h-64 border border-zinc-800 whitespace-pre-wrap break-all shadow-inner">
                                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
