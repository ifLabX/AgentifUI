'use client';

import { cn } from '@lib/utils';
import { type Area, createCroppedImage } from '@lib/utils/image-crop';
import { Crop, Loader2, RotateCcw } from 'lucide-react';
import Cropper from 'react-easy-crop';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

// Avatar cropper component interface
interface AvatarCropperProps {
  imageUrl: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
  isUploading?: boolean;
  isDark?: boolean;
  colors: any;
}

// Crop state interface
interface CropState {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: Area | null;
}

export function AvatarCropper({
  imageUrl,
  onConfirm,
  onCancel,
  isUploading = false,
  isDark = false,
  colors,
}: AvatarCropperProps) {
  const t = useTranslations('pages.settings.avatarModal');

  const [cropState, setCropState] = useState<CropState>({
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
  });

  // Simplify slider style - connected design
  const sliderStyles = `
    .custom-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: ${isDark ? '#44403c' : '#d6d3d1'};
      outline: none;
      cursor: pointer;
    }
    
    .custom-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${isDark ? '#78716c' : '#57534e'};
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .custom-slider::-webkit-slider-thumb:hover {
      background: ${isDark ? '#a8a29e' : '#44403c'};
      transform: scale(1.1);
    }
    
    .custom-slider::-moz-range-track {
      width: 100%;
      height: 4px;
      cursor: pointer;
      background: ${isDark ? '#44403c' : '#d6d3d1'};
      border-radius: 2px;
      border: none;
    }
    
    .custom-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${isDark ? '#78716c' : '#57534e'};
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .custom-slider::-moz-range-thumb:hover {
      background: ${isDark ? '#a8a29e' : '#44403c'};
      transform: scale(1.1);
    }
  `;

  // Crop complete callback
  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCropState(prev => ({
        ...prev,
        croppedAreaPixels,
      }));
    },
    []
  );

  // Confirm crop
  const handleConfirm = useCallback(async () => {
    if (!cropState.croppedAreaPixels) return;

    try {
      const croppedFile = await createCroppedImage(
        imageUrl,
        cropState.croppedAreaPixels,
        'cropped-avatar.jpg'
      );
      onConfirm(croppedFile);
    } catch (error) {
      console.error('Crop failed:', error);
    }
  }, [imageUrl, cropState.croppedAreaPixels, onConfirm]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      {/* Cropper container */}
      <div className="relative h-80 w-full overflow-hidden rounded-lg bg-black">
        <Cropper
          image={imageUrl}
          crop={cropState.crop}
          zoom={cropState.zoom}
          aspect={1} // 1:1 circular avatar ratio
          onCropChange={crop => setCropState(prev => ({ ...prev, crop }))}
          onZoomChange={zoom => setCropState(prev => ({ ...prev, zoom }))}
          onCropComplete={onCropComplete}
          cropShape="round"
          showGrid={false}
        />
      </div>

      {/* Crop control area */}
      <div className="space-y-4">
        {/* Zoom control */}
        <div className="space-y-2">
          <label
            className={cn('text-sm font-medium', colors.textColor.tailwind)}
          >
            {t('crop.zoom')}
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={cropState.zoom}
            onChange={e =>
              setCropState(prev => ({ ...prev, zoom: Number(e.target.value) }))
            }
            className="custom-slider"
          />
        </div>

        {/* Crop operation button */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-serif text-sm transition-colors duration-150',
              'border disabled:cursor-not-allowed disabled:opacity-50',
              colors.buttonBackground.tailwind,
              colors.buttonBorder.tailwind,
              colors.buttonText.tailwind,
              colors.buttonHover.tailwind
            )}
          >
            <RotateCcw className="h-4 w-4" />
            {t('crop.cancel')}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isUploading || !cropState.croppedAreaPixels}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-serif text-sm transition-colors duration-150',
              'border disabled:cursor-not-allowed disabled:opacity-50',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-100 hover:border-stone-500 hover:bg-stone-600'
                : 'border-stone-400 bg-stone-600 text-white hover:border-stone-500 hover:bg-stone-700'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crop className="h-4 w-4" />
            )}
            {isUploading ? t('crop.uploading') : t('crop.confirm')}
          </button>
        </div>
      </div>
    </>
  );
}
