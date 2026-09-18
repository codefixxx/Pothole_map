'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/components/ui/dialog';
import { Search, RefreshCw, ShieldAlert, FileText, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
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
        return (
            log.action.toLowerCase().includes(q) ||
            log.entityType.toLowerCase().includes(q) ||
            log.actor.email.toLowerCase().includes(q) ||
            (log.actor.name && log.actor.name.toLowerCase().includes(q))
        );
    });

    const getActionBadge = (action: string) => {
        if (action.includes('TRANSITION') || action.includes('STATUS')) {
            return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">{action}</Badge>;
        } else if (action.includes('ASSIGN')) {
            return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">{action}</Badge>;
        } else if (action.includes('DELETE') || action.includes('REJECT')) {
            return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">{action}</Badge>;
        }
        return <Badge variant="secondary">{action}</Badge>;
    };

    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ShieldAlert className="size-4 text-primary" />
                        <span>Municipal & Platform Audit Logs</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                        Immutable audit trail of privileged status changes, officer assignments, and admin operations.
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={isLoading} className="gap-1.5 h-8">
                    <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by action, entity, or officer email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>
                </div>

                {/* Logs Table */}
                <div className="rounded-md border border-border/60 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/40 text-xs">
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Actor / User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Target Entity</TableHead>
                                <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Loading audit logs...
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                                    {log.actor.name ? log.actor.name.charAt(0).toUpperCase() : <UserIcon className="size-3" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium leading-none text-foreground">{log.actor.name || log.actor.email}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{log.actor.role}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell className="font-mono text-[11px]">
                                            <span className="font-semibold text-foreground/80">{log.entityType}</span>
                                            <span className="text-muted-foreground ml-1">#{log.entityId.slice(0, 8)}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                                className="h-7 px-2 text-xs gap-1"
                                            >
                                                <FileText className="size-3.5 text-muted-foreground" />
                                                <span>Inspect</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground font-mono">
                        Page {page} of {totalPages}
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

            {/* Inspect JSON Details Modal */}
            <Dialog open={Boolean(selectedLog)} onOpenChange={(o) => !o && setSelectedLog(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <ShieldAlert className="size-4 text-primary" />
                            <span>Audit Record #{selectedLog?.id.slice(0, 8)}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Recorded at {selectedLog ? new Date(selectedLog.createdAt).toLocaleString() : ''}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-2 text-xs rounded-lg border bg-muted/30 p-3">
                                <div>
                                    <span className="text-muted-foreground font-medium block">Actor</span>
                                    <span className="font-semibold text-foreground">{selectedLog.actor.name || selectedLog.actor.email}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-medium block">Action</span>
                                    <span className="font-semibold text-foreground">{selectedLog.action}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-medium block">Target Entity</span>
                                    <span className="font-mono text-foreground">{selectedLog.entityType} ({selectedLog.entityId})</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-medium block">IP Address</span>
                                    <span className="font-mono text-foreground">{selectedLog.ipAddress || 'Internal'}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Payload Metadata</h4>
                                <pre className="rounded-lg bg-zinc-950 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 border">
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
