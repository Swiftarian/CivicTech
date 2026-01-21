import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  description?: string;
}

export function ImageUploader({
  onUploadSuccess,
  currentImageUrl,
  label = "上傳圖片",
  description = "支援 JPG、PNG、GIF、WebP 格式，檔案大小不超過 5MB",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      toast.success("圖片上傳成功");
      setPreview(data.url);
      onUploadSuccess(data.url);
    },
    onError: (error) => {
      toast.error(`上傳失敗：${error.message}`);
    },
  });

  const handleFileSelect = async (file: File) => {
    // 驗證檔案類型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("不支援的圖片格式");
      return;
    }

    // 驗證檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("檔案大小不能超過 5MB");
      return;
    }

    // 壓縮圖片
    const originalSize = file.size;
    let compressedFile = file;
    
    try {
      const options = {
        maxSizeMB: 1, // 最大 1MB
        maxWidthOrHeight: 1920, // 最大寬度或高度
        useWebWorker: true,
        fileType: file.type,
      };
      
      compressedFile = await imageCompression(file, options);
      
      const compressionRatio = ((1 - compressedFile.size / originalSize) * 100).toFixed(0);
      if (compressedFile.size < originalSize) {
        toast.success(`圖片壓縮成功，減少 ${compressionRatio}% 檔案大小`);
      }
    } catch (error) {
      console.error("圖片壓縮失敗，使用原始檔案", error);
      toast.warning("圖片壓縮失敗，將使用原始檔案上傳");
    }

    // 顯示預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(compressedFile);

    // 上傳檔案
    const base64Reader = new FileReader();
    base64Reader.onload = async (e) => {
      const base64String = (e.target?.result as string).split(",")[1];
      await uploadMutation.mutateAsync({
        base64Data: base64String,
        mimeType: compressedFile.type,
        originalName: compressedFile.name,
      });
    };
    base64Reader.readAsDataURL(compressedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Sanitize image URL to prevent XSS
  const getSafeImageUrl = (url: string | null): string | undefined => {
    if (!url) return undefined;
    
    // Only allow data URLs (base64) and https URLs
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    try {
      const parsedUrl = new URL(url, window.location.origin);
      // Only allow https protocol or relative URLs from same origin
      if (parsedUrl.protocol === 'https:' || parsedUrl.origin === window.location.origin) {
        return url;
      }
    } catch {
      // Invalid URL, return undefined
      return undefined;
    }
    
    return undefined;
  };

  const safePreview = getSafeImageUrl(preview);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-sm text-muted-foreground">{description}</p>

      {safePreview ? (
        <Card className="relative overflow-hidden">
          <img
            src={safePreview}
            alt="預覽"
            className="w-full h-64 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={uploadMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center p-12 text-center">
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">上傳中...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  拖放圖片到此處，或點擊選擇檔案
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  選擇檔案
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={uploadMutation.isPending}
      />
    </div>
  );
}
