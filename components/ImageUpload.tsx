'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  isOversized: boolean;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 5,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return { valid: false, error: `${file.name} 格式不支持，请使用 jpg、png、gif 或 webp` };
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `${file.name} 超过 ${maxSizeMB}MB 限制` };
      }
      return { valid: true };
    },
    [maxSizeMB]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newErrors: string[] = [];

      const validFiles: ImageFile[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
            isOversized: false,
          });
        } else {
          newErrors.push(validation.error || '无效文件');
        }
      }

      const currentValid = images.filter((img) => !img.isOversized);
      const totalValid = [...currentValid, ...validFiles].slice(0, maxImages);

      if (fileArray.length > maxImages || (currentValid.length >= maxImages && fileArray.length > 0)) {
        newErrors.push(`最多只能上传 ${maxImages} 张图片`);
      }

      if (validFiles.length > 0) {
        const oversizeFiles = validFiles.slice(maxImages - currentValid.length);
        const validForUpload = validFiles.slice(0, maxImages - currentValid.length);

        onImagesChange([...currentValid, ...validForUpload].concat(
          oversizeFiles.map((f) => ({ ...f, isOversized: true }))
        ));

        if (oversizeFiles.length > 0) {
          newErrors.push(`有 ${oversizeFiles.length} 张图片因超出数量限制未被导入`);
        }
      }

      setErrorMessages(newErrors);
      if (newErrors.length > 0) {
        setTimeout(() => setErrorMessages([]), 3000);
      }
    },
    [images, maxImages, onImagesChange, validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const handleRemoveImage = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      onImagesChange(images.filter((img) => img.id !== id));
    },
    [images, onImagesChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: File[] = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageItems.push(file);
          }
        }
      }

      if (imageItems.length > 0) {
        e.preventDefault();
        addFiles(imageItems);
      }
    },
    [addFiles, disabled]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('paste', handlePaste);
    return () => {
      container.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const activeImages = images.filter((img) => !img.isOversized);
  const oversizeImages = images.filter((img) => img.isOversized);

  return (
    <div ref={containerRef} className="relative">
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {activeImages.map((image) => (
            <div
              key={image.id}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-black/[0.08] bg-[#fafafa]"
            >
              <img
                src={image.preview}
                alt={image.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                disabled={disabled}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {oversizeImages.map((image) => (
            <div
              key={image.id}
              className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-red-500 bg-red-50"
              title={`${image.file.name} - 超过大小限制`}
            >
              <img
                src={image.preview}
                alt={image.file.name}
                className="h-full w-full object-cover opacity-50 grayscale"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {errorMessages.length > 0 && (
        <div className="mb-2 space-y-1">
          {errorMessages.map((msg, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || activeImages.length >= maxImages}
        className={cn(
          'rounded-md border border-dashed border-[#d4d4d4] px-4 py-2 text-sm text-[#737373] transition-colors',
          'hover:border-[#171717] hover:bg-[#fafafa] hover:text-[#171717]',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d4d4d4] disabled:hover:bg-transparent disabled:hover:text-[#737373]'
        )}
      >
        {activeImages.length >= maxImages ? `已达上限 (${maxImages}张)` : '添加图片'}
      </button>
    </div>
  );
}