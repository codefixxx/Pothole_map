'use client';

import Cropper from 'react-easy-crop';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Slider } from './ui/slider';
const AvatarCropper = ({ image, onCropDone, onCancel }: any) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
            <div className="relative w-[90vw] max-w-md h-[400px] bg-black">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => {
                        setCroppedAreaPixels(croppedAreaPixels);
                    }}
                />
            </div>

            <Slider
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={([val]) => setZoom(val)}
                className="mt-4 w-64"
            />

            <div className="flex gap-4 mt-4">
                <Button
                    onClick={() => onCropDone(croppedAreaPixels)}
                    className="bg-white px-4 py-2 rounded"
                >
                    Crop
                </Button>

                <Button
                    onClick={onCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default AvatarCropper;
