'use client';

import { Camera, X, Loader2, CheckCircle2, ShieldCheck, User, Mail, ArrowLeft, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUploadThing } from '@/src/lib/uploadthing';
import { toast } from 'sonner';
import Link from 'next/link';

import {
    FileUpload,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadList,
    FileUploadTrigger,
} from '@/src/components/ui/file-upload';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from './cropimage';
import AvatarCropper from './avatar-cropper';

export interface ProfileFormData {
    name: string;
    email?: string;
    role?: string;
    municipalityName?: string;
    emailVerified?: boolean;
    avatar?: string;
}

interface SettingsProfileProps {
    defaultValues?: Partial<ProfileFormData>;
    onSave?: (data: ProfileFormData) => void;
    className?: string;
}

const SettingsProfile = ({
    defaultValues = {},
    onSave,
    className,
}: SettingsProfileProps) => {
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [showCrop, setShowCrop] = useState(false);

    const [name, setName] = useState(defaultValues.name ?? '');
    const userEmail = defaultValues.email ?? '';
    const userRole = defaultValues.role ?? 'USER';
    const municipalityName = defaultValues.municipalityName;
    const isEmailVerified = defaultValues.emailVerified ?? false;

    const [avatarFiles, setAvatarFiles] = useState<File[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
        defaultValues.avatar,
    );

    const [isSaving, setIsSaving] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const { startUpload } = useUploadThing('imageUploader');

    useEffect(() => {
        if (avatarFiles.length === 0) return;

        const file = avatarFiles[0];
        const objectUrl = URL.createObjectURL(file);

        setAvatarPreview(objectUrl);
        setImgLoaded(false);

        return () => URL.revokeObjectURL(objectUrl);
    }, [avatarFiles]);

    const handleCropDone = async (croppedArea: any) => {
        if (!cropImage) return;

        const croppedFile = await getCroppedImg(cropImage, croppedArea);

        setAvatarFiles([croppedFile]);
        setCropImage(null);
        setShowCrop(false);
    };

    const handleCancel = () => {
        setName(defaultValues.name ?? '');
        setAvatarFiles([]);
        setAvatarPreview(defaultValues.avatar);
        setImgLoaded(false);
        setCropImage(null);
        setShowCrop(false);
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            let avatarUrl = defaultValues.avatar;

            if (avatarFiles.length > 0) {
                const file = avatarFiles[0];

                if (!file.type.startsWith('image/')) {
                    throw new Error('Only image files are allowed');
                }

                const compressed = await imageCompression(file, {
                    maxSizeMB: 0.2,
                    maxWidthOrHeight: 512,
                    useWebWorker: true,
                    fileType: 'image/webp',
                    initialQuality: 0.8,
                });

                const optimizedFile = new File(
                    [compressed],
                    file.name.replace(/\.\w+$/, '.webp'),
                    { type: 'image/webp' },
                );

                const uploaded = await startUpload([optimizedFile]);
                const uploadedFile = uploaded?.[0];

                if (!uploadedFile) {
                    throw new Error('Upload failed');
                }

                avatarUrl = uploadedFile.url ?? uploadedFile.ufsUrl;

                setAvatarPreview(avatarUrl);
                setAvatarFiles([]);
                setImgLoaded(false);
            }

            // Update user profile name and/or avatar via real API
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name !== defaultValues.name ? name : undefined,
                    avatarUrl: avatarUrl !== defaultValues.avatar ? avatarUrl : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            toast.success('Profile updated successfully!');

            onSave?.({
                name,
                email: userEmail,
                role: userRole,
                emailVerified: isEmailVerified,
                avatar: avatarUrl,
            });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    const initials = (name || userEmail || 'U')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const avatarSrc = avatarPreview;

    const isUnchanged =
        name === defaultValues.name && avatarFiles.length === 0;

    const formattedRole = userRole === 'ADMIN'
        ? 'Super Admin'
        : userRole === 'MANAGER'
        ? 'Municipality Manager'
        : userRole === 'OFFICER'
        ? 'Municipal Patrol Officer'
        : 'Citizen Reporter';

    return (
        <>
            <Card className={cn('w-full max-w-lg shadow-xl border-border/80 bg-card', className)}>
                <CardHeader className="relative pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold">Account Profile</CardTitle>
                            <CardDescription className="text-xs">
                                Manage your personal account details and profile photo
                            </CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                            <Link href="/map">
                                <ArrowLeft className="size-3.5" />
                                <span>Map</span>
                            </Link>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Avatar Upload Section */}
                    <FileUpload
                        key="upload"
                        value={avatarFiles}
                        onValueChange={(files) => {
                            if (!files || files.length === 0) return;

                            const file = files[0];
                            const preview = URL.createObjectURL(file);

                            setCropImage(preview);

                            setTimeout(() => {
                                setShowCrop(true);
                            }, 0);
                        }}
                        onFileReject={() => {
                            toast.error('Image must be less than 2MB');
                            setCropImage(null);
                            setShowCrop(false);
                            setAvatarFiles([]);
                        }}
                        accept="image/png, image/jpeg, image/webp"
                        maxFiles={1}
                        maxSize={2 * 1024 * 1024}
                    >
                        <div className="flex items-center gap-4">
                            <FileUploadTrigger asChild>
                                <button
                                    type="button"
                                    className="group relative size-20 shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                    <Avatar className="size-20 overflow-hidden rounded-full border border-muted shadow-sm">
                                        {avatarSrc && (
                                            <AvatarImage
                                                src={avatarSrc}
                                                alt={name}
                                                onLoad={() => setImgLoaded(true)}
                                                className={`object-cover object-center transition-opacity duration-300 ${
                                                    imgLoaded ? 'opacity-100' : 'opacity-0'
                                                }`}
                                            />
                                        )}

                                        <AvatarFallback
                                            delayMs={imgLoaded ? 999999 : 200}
                                            className="bg-gradient-to-br from-amber-500 to-amber-700 text-white text-xl font-bold"
                                        >
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        {isSaving ? (
                                            <Loader2 className="size-5 text-white animate-spin" />
                                        ) : (
                                            <Camera className="size-6 text-white" />
                                        )}
                                    </div>
                                </button>
                            </FileUploadTrigger>

                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Profile Photo</p>
                                <p className="text-xs text-muted-foreground">
                                    Click avatar to upload & crop a new picture
                                </p>
                                <p className="text-[11px] text-muted-foreground/80">
                                    Supports JPG, PNG or WebP (Max 2MB)
                                </p>
                            </div>
                        </div>

                        {avatarFiles.length > 0 && (
                            <FileUploadList className="mt-3">
                                {avatarFiles.map((file, index) => (
                                    <FileUploadItem
                                        key={index}
                                        value={file}
                                        className="rounded-lg border bg-muted/30 p-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium">
                                                {file.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>

                                        <FileUploadItemDelete asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                onClick={() => {
                                                    setAvatarFiles([]);
                                                    setAvatarPreview(defaultValues.avatar);
                                                    setImgLoaded(false);
                                                    setCropImage(null);
                                                    setShowCrop(false);
                                                }}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </FileUploadItemDelete>
                                    </FileUploadItem>
                                ))}
                            </FileUploadList>
                        )}
                    </FileUpload>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold flex items-center gap-1.5">
                                <User className="size-3.5 text-muted-foreground" />
                                <span>Full Name</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className="h-9 text-xs"
                            />
                        </div>

                        {userEmail && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-muted-foreground" />
                                        <span>Email Address</span>
                                    </Label>
                                    {isEmailVerified ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="size-3" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                            Unverified
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="email"
                                    value={userEmail}
                                    readOnly
                                    disabled
                                    className="h-9 text-xs bg-muted/50 cursor-not-allowed text-muted-foreground"
                                />
                            </div>
                        )}

                        {/* Role & Context Card */}
                        <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <ShieldCheck className="size-3.5 text-primary" />
                                    <span>Civic Platform Status</span>
                                </span>
                                <Badge variant={userRole === 'OFFICER' || userRole === 'MANAGER' || userRole === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px] font-mono">
                                    {formattedRole}
                                </Badge>
                            </div>
                            {municipalityName && (
                                <div className="flex items-center gap-1.5 text-xs text-foreground font-medium pt-0.5">
                                    <Building2 className="size-3.5 text-blue-500 shrink-0" />
                                    <span>Jurisdiction: <strong className="text-primary font-semibold">{municipalityName}</strong></span>
                                </div>
                            )}
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {userRole === 'OFFICER' || userRole === 'MANAGER'
                                    ? 'Your account is authorized for official municipal triage: verifying road hazards, assigning field crews, and managing lifecycle status transitions.'
                                    : userRole === 'ADMIN'
                                    ? 'Your account has global platform management rights across all municipal bodies, users, and jurisdiction boundaries.'
                                    : 'Your account is enabled for instant GPS road hazard reporting, upvoting community issues, and receiving live status resolution notifications.'}
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving} className="h-9 text-xs">
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || isUnchanged}
                        className="h-9 text-xs font-semibold px-5"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {showCrop && cropImage && (
                <AvatarCropper
                    image={cropImage}
                    onCropDone={handleCropDone}
                    onCancel={() => {
                        setShowCrop(false);
                        setCropImage(null);
                    }}
                />
            )}
        </>
    );
};

export { SettingsProfile };
