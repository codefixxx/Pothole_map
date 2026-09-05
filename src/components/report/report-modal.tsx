'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { MapView } from '@/src/components/map/map-view';
import { DEFAULT_MAP_CENTER, MapMarkerItem } from '@/src/lib/map-config';
import { useUploadThing } from '@/src/lib/uploadthing';
import { useSession } from '@/src/lib/auth-client';
import { toast } from 'sonner';
import {
    MapPin,
    Crosshair,
    Camera,
    AlertTriangle,
    ThumbsUp,
    CheckCircle2,
    Loader2,
    X,
    LogIn,
    ShieldAlert,
    Navigation,
    Info,
} from 'lucide-react';
import Link from 'next/link';

interface DuplicateCandidate {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: string;
    distanceInMeters: number;
    confidenceScore: number;
}

interface ReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialCoords?: [number, number]; // [lng, lat]
    onReportCreated?: (newMarker: MapMarkerItem) => void;
}

export function ReportModal({
    open,
    onOpenChange,
    initialCoords,
    onReportCreated,
}: ReportModalProps) {
    const { data: session } = useSession();

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

    // Coordinates & GPS acquisition state
    const [coords, setCoords] = useState<[number, number]>(initialCoords || DEFAULT_MAP_CENTER);
    const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
    const [locationSource, setLocationSource] = useState<'GPS' | 'MANUAL_ADJUSTMENT'>('GPS');
    const [isLocating, setIsLocating] = useState(false);

    // Image upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [uploadedStorageKey, setUploadedStorageKey] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Proximity duplicate check
    const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [dismissDuplicateAlert, setDismissDuplicateAlert] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Uploadthing hook
    const { startUpload } = useUploadThing('potholeImageUploader', {
        onUploadProgress: (progress) => {
            setUploadProgress(progress);
        },
        onClientUploadComplete: (res) => {
            if (res && res[0]) {
                const uploaded = res[0];
                setUploadedImageUrl(uploaded.ufsUrl || uploaded.url);
                setUploadedStorageKey(uploaded.key);
                toast.success('Photo uploaded successfully!');
            }
            setIsUploading(false);
        },
        onUploadError: (err) => {
            console.error('UploadThing error:', err);
            toast.error(err.message || 'Image upload failed. You may continue or retry.');
            setIsUploading(false);
        },
    });

    // Acquire GPS Coordinates
    const acquireGPS = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your device/browser.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newCoords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                setCoords(newCoords);
                setLocationAccuracy(Math.round(pos.coords.accuracy));
                setLocationSource('GPS');
                setIsLocating(false);
                toast.success(`GPS acquired (±${Math.round(pos.coords.accuracy)}m accuracy)`);
            },
            (err) => {
                console.warn('Geolocation acquisition error:', err);
                setIsLocating(false);
                toast.info('Could not auto-detect GPS. You can drag the pin on the map.');
            },
            { enableHighAccuracy: true, timeout: 9000, maximumAge: 10000 }
        );
    };

    // Auto-acquire GPS on modal open if not already set by props
    useEffect(() => {
        if (open) {
            if (initialCoords) {
                setCoords(initialCoords);
            } else {
                acquireGPS();
            }
        } else {
            // Reset modal state on close
            setTitle('');
            setDescription('');
            setSeverity('MEDIUM');
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadedImageUrl(null);
            setUploadedStorageKey(null);
            setUploadProgress(0);
            setIsUploading(false);
            setDuplicateCandidate(null);
            setDismissDuplicateAlert(false);
        }
    }, [open, initialCoords]);

    // Handle File Pick
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // If authenticated, start direct upload immediately in background
        if (session?.user) {
            setIsUploading(true);
            setUploadProgress(10);
            try {
                await startUpload([file]);
            } catch (err: any) {
                console.error('Direct upload failed:', err);
                setIsUploading(false);
            }
        }
    };

    // Remove photo
    const handleRemovePhoto = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setUploadedImageUrl(null);
        setUploadedStorageKey(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle Pin Movement in Mini-Map
    const handlePinMove = (newCoords: [number, number]) => {
        setCoords(newCoords);
        setLocationSource('MANUAL_ADJUSTMENT');
        setLocationAccuracy(null);
        setDismissDuplicateAlert(false);
    };

    // Check for duplicate candidates (Debounced proximity search)
    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(async () => {
            const [lng, lat] = coords;
            if (!lat || !lng) return;

            try {
                setIsCheckingDuplicates(true);
                const res = await fetch(`/api/potholes/duplicates?lat=${lat}&lng=${lng}&radius=100`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                        // Find closest active candidate
                        const candidate = json.data[0];
                        setDuplicateCandidate(candidate);
                    } else {
                        setDuplicateCandidate(null);
                    }
                }
            } catch {
                // Silently ignore duplicate check network errors
            } finally {
                setIsCheckingDuplicates(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [coords, open]);

    // Handle Upvote Existing Duplicate Instead
    const handleUpvoteDuplicate = async () => {
        if (!duplicateCandidate) return;

        try {
            const res = await fetch(`/api/potholes/${duplicateCandidate.id}/votes`, {
                method: 'POST',
            });
            if (res.ok) {
                toast.success('Confirmed existing pothole! Your upvote will accelerate repair priority.');
                onOpenChange(false);
            } else {
                toast.error('Could not record confirmation. Please check your login session.');
            }
        } catch {
            toast.error('Network error confirming existing pothole.');
        }
    };

    // Submit Report
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) {
            toast.error('Please log in before submitting a pothole report.');
            return;
        }

        if (title.trim().length < 3) {
            toast.error('Title must be at least 3 characters.');
            return;
        }

        if (description.trim().length < 5) {
            toast.error('Please provide a more descriptive summary (at least 5 characters).');
            return;
        }

        setIsSubmitting(true);

        try {
            // Map severity to integer score (LOW: 3, MEDIUM: 6, HIGH: 9)
            const severityScore = severity === 'HIGH' ? 9 : severity === 'MEDIUM' ? 6 : 3;

            const payload: any = {
                title: title.trim(),
                description: description.trim(),
                severity: severityScore,
                latitude: coords[1],
                longitude: coords[0],
                locationSource,
                locationAccuracy,
                captureTimestamp: new Date().toISOString(),
                imageUrl: uploadedImageUrl || previewUrl || undefined,
            };

            if (uploadedStorageKey) {
                payload.image = {
                    storageKey: uploadedStorageKey,
                    metadata: {
                        name: selectedFile?.name || 'capture.jpg',
                        size: selectedFile?.size || 0,
                    },
                };
            }

            const res = await fetch('/api/potholes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to submit report.');
            }

            const result = await res.json();
            const created = result.data;

            // Notify parent to add marker optimistically
            if (onReportCreated && created) {
                onReportCreated({
                    id: created.id,
                    latitude: created.latitude,
                    longitude: created.longitude,
                    title: created.title || title,
                    description: created.description || description,
                    status: 'PENDING',
                    severity: severity,
                    upvotesCount: 1,
                    imageUrl: uploadedImageUrl || previewUrl || undefined,
                });
            }

            toast.success('Pothole report filed successfully! Assigned to municipal patrol queue.');
            onOpenChange(false);
        } catch (err: any) {
            console.error('Submission error:', err);
            toast.error(err.message || 'An error occurred while filing the report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border/80 bg-background shadow-2xl">
                {/* Header Banner */}
                <div className="border-b bg-muted/30 px-6 py-4">
                    <DialogHeader className="gap-1">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-4" />
                            </div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Report Road Hazard
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Help keep roads safe. Capture photo and accurate location to dispatch repair teams.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Unauthenticated User Warning */}
                    {!session?.user && (
                        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                            <div className="flex items-center gap-2">
                                <Info className="size-4 shrink-0" />
                                <span>You must sign in to submit verified citizen reports.</span>
                            </div>
                            <Button asChild size="xs" variant="outline" className="h-7 text-xs border-amber-500/40">
                                <Link href="/auth/login">
                                    <LogIn className="size-3 mr-1" />
                                    Login
                                </Link>
                            </Button>
                        </div>
                    )}

                    {/* Section 1: Photo Capture / Upload */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Photo Evidence <span className="text-red-500">*</span>
                        </Label>

                        {previewUrl ? (
                            <div className="relative overflow-hidden rounded-xl border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewUrl}
                                    alt="Pothole preview"
                                    className="h-44 w-full object-cover"
                                />

                                {/* Uploading Overlay */}
                                {isUploading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white">
                                        <Loader2 className="size-6 animate-spin mb-2" />
                                        <span className="text-xs font-medium">Uploading ({uploadProgress}%)</span>
                                    </div>
                                )}

                                {/* Delete Photo Button */}
                                {!isUploading && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition-colors"
                                        aria-label="Remove photo"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}

                                {uploadedImageUrl && (
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                                        <CheckCircle2 className="size-3" />
                                        <span>Uploaded</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center hover:border-primary/60 hover:bg-muted/40 transition-all cursor-pointer"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform">
                                    <Camera className="size-6" />
                                </div>
                                <span className="mt-2 text-xs font-semibold text-foreground">
                                    Take a Photo or Select from Gallery
                                </span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">
                                    High-res photos help officers assess roadbed damage (Max 4MB)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Location & Draggable Mini-Map */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Location & Geotag
                            </Label>

                            <div className="flex items-center gap-2">
                                {/* Accuracy Badge */}
                                {locationSource === 'GPS' && locationAccuracy !== null && (
                                    <Badge
                                        variant="secondary"
                                        className={`text-[10px] font-mono ${
                                            locationAccuracy < 20
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : locationAccuracy < 50
                                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                        }`}
                                    >
                                        <Crosshair className="size-2.5 mr-1" />
                                        GPS ±{locationAccuracy}m
                                    </Badge>
                                )}

                                {locationSource === 'MANUAL_ADJUSTMENT' && (
                                    <Badge variant="outline" className="text-[10px] font-mono text-sky-600 dark:text-sky-400 border-sky-500/30">
                                        <MapPin className="size-2.5 mr-1" />
                                        Manual Adjustment
                                    </Badge>
                                )}

                                <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    onClick={acquireGPS}
                                    disabled={isLocating}
                                    className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                                >
                                    <Navigation className={`size-3 ${isLocating ? 'animate-spin' : ''}`} />
                                    <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Interactive Mini Map */}
                        <div className="h-44 w-full rounded-xl overflow-hidden border">
                            <MapView
                                center={coords}
                                zoom={15.5}
                                draggableMarkerCoord={coords}
                                onDraggableMarkerMove={handlePinMove}
                                showControls={false}
                                className="h-full w-full rounded-none border-none min-h-[175px]"
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-mono">
                            <span>Lat: {coords[1].toFixed(5)}</span>
                            <span>Lng: {coords[0].toFixed(5)}</span>
                            <span className="text-[10px] italic text-muted-foreground/80 font-sans">
                                Drag red pin to adjust exact location
                            </span>
                        </div>
                    </div>

                    {/* Proximity Duplicate Warning Alert */}
                    {duplicateCandidate && !dismissDuplicateAlert && (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                                    <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span>Nearby Report Detected ({Math.round(duplicateCandidate.distanceInMeters)}m away)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDismissDuplicateAlert(true)}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Dismiss duplicate notice"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">
                                &quot;{duplicateCandidate.title}&quot; was previously filed at this location. Confirming an existing report boosts priority with road crews faster than a duplicate!
                            </p>

                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleUpvoteDuplicate}
                                    className="gap-1.5 text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                                >
                                    <ThumbsUp className="size-3" />
                                    <span>Upvote Existing Instead</span>
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDismissDuplicateAlert(true)}
                                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                                >
                                    Report as Separate Hazard
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Section 3: Title & Description */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="report-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Road / Hazard Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="report-title"
                                placeholder="e.g., Deep asphalt crater near Metro Pillar 42"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="report-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Description & Details <span className="text-red-500">*</span>
                            </Label>
                            <textarea
                                id="report-desc"
                                rows={3}
                                placeholder="Describe the hazard size, impact on commuter lanes, or potential risk to two-wheelers..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/70"
                                required
                            />
                        </div>
                    </div>

                    {/* Section 4: Severity Level Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Estimated Severity
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setSeverity('LOW')}
                                className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                                    severity === 'LOW'
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black shadow-xs'
                                        : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                                }`}
                            >
                                <span className="text-xs font-bold">Low</span>
                                <span className="text-[10px] opacity-80 mt-0.5">Surface cracks</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSeverity('MEDIUM')}
                                className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                                    severity === 'MEDIUM'
                                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                                        : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                                }`}
                            >
                                <span className="text-xs font-bold">Medium</span>
                                <span className="text-[10px] opacity-80 mt-0.5">Noticeable bump</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSeverity('HIGH')}
                                className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                                    severity === 'HIGH'
                                        ? 'border-red-600 bg-red-600 text-white shadow-xs'
                                        : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                                }`}
                            >
                                <span className="text-xs font-bold">High</span>
                                <span className="text-[10px] opacity-80 mt-0.5">Deep tire danger</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="text-xs h-9"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || isUploading || !session?.user}
                            className="text-xs h-9 gap-1.5 font-medium px-4 shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Filing Report...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Submit Report</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
