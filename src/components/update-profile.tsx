'use client';

import { Camera, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUploadThing } from '@/src/lib/uploadthing';
import { toast } from 'sonner';

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
import { getCroppedImg } from '@/src/components/cropimage';
import AvatarCropper from './avatar-cropper';

interface ProfileFormData {
    name: string;
    username: string;
    avatar?: string;
}

interface SettingsProfileProps {
    defaultValues?: Partial<ProfileFormData>;
    onSave?: (data: ProfileFormData) => void;
    className?: string;
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

const SettingsProfile = ({
    defaultValues = {},
    onSave,
    className,
}: SettingsProfileProps) => {
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [showCrop, setShowCrop] = useState(false);

    const [name, setName] = useState(defaultValues.name ?? '');
    const [username, setUsername] = useState(defaultValues.username ?? '');
    const [usernameStatus, setUsernameStatus] =
        useState<UsernameStatus>('idle');

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

    useEffect(() => {
        if (!username || username === defaultValues.username) {
            setUsernameStatus('idle');
            return;
        }

        setUsernameStatus('checking');

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/check-username?username=${username}`,
                );
                const data = await res.json();
                setUsernameStatus(data.available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [username, defaultValues.username]);

    const handleCropDone = async (croppedArea: any) => {
        if (!cropImage) return;

        const croppedFile = await getCroppedImg(cropImage, croppedArea);

        setAvatarFiles([croppedFile]);
        setCropImage(null);
        setShowCrop(false);
    };

    const handleCancel = () => {
        setName(defaultValues.name ?? '');
        setUsername(defaultValues.username ?? '');
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

            if (avatarUrl && avatarUrl !== defaultValues.avatar) {
                const res = await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ avatarUrl }),
                });

                if (!res.ok) {
                    throw new Error('Failed to update avatar');
                }
            }

            onSave?.({
                name,
                username,
                avatar: avatarUrl,
            });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    const initials = (name || '')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();

    const avatarSrc = avatarPreview;

    const isUnchanged =
        name === defaultValues.name &&
        username === defaultValues.username &&
        avatarFiles.length === 0;

    return (
        <>
            <Card className={cn('w-full max-w-lg', className)}>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        Update your personal information and profile picture
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
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
                        onFileReject={(files) => {
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
                                                onLoad={() =>
                                                    setImgLoaded(true)
                                                }
                                                className={`object-cover object-center transition-opacity duration-300 ${
                                                    imgLoaded
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                }`}
                                            />
                                        )}

                                        <AvatarFallback
                                            delayMs={imgLoaded ? 999999 : 200}
                                            className="bg-gradient-to-br from-gray-300 to-gray-500 text-white text-xl font-semibold"
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
                                <p className="text-sm font-medium">
                                    Profile Photo
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Click the avatar to upload a new photo
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG or GIF. Max 2MB.
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
                                            <p className="truncate text-sm font-medium">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)}{' '}
                                                KB
                                            </p>
                                        </div>

                                        <FileUploadItemDelete asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={(e) => {
                                                    setAvatarFiles([]);
                                                    setAvatarPreview(
                                                        defaultValues.avatar,
                                                    );
                                                    setImgLoaded(false);
                                                    setCropImage(null);
                                                    setShowCrop(false);
                                                }}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </FileUploadItemDelete>
                                    </FileUploadItem>
                                ))}
                            </FileUploadList>
                        )}
                    </FileUpload>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            {usernameStatus === 'checking' && (
                                <p className="text-xs text-muted-foreground">
                                    Checking...
                                </p>
                            )}
                            {usernameStatus === 'available' && (
                                <p className="text-xs text-green-500">
                                    ✓ Username is available
                                </p>
                            )}
                            {usernameStatus === 'taken' && (
                                <p className="text-xs text-red-500">
                                    ✗ Username is already taken
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={
                            isSaving ||
                            isUnchanged ||
                            usernameStatus === 'taken' ||
                            usernameStatus === 'checking'
                        }
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
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
