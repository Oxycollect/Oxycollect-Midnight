import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';

// Image compression utility - More aggressive compression
const compressImage = (dataUrl: string, callback: (compressedUrl: string) => void, quality = 0.3, maxWidth = 400) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    // Calculate new dimensions
    let { width, height } = img;
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw and compress
    ctx?.drawImage(img, 0, 0, width, height);
    const compressedUrl = canvas.toDataURL('image/jpeg', quality);
    callback(compressedUrl);
  };
  
  img.src = dataUrl;
};

interface PhotoInputFallbackProps {
  onCapture: (imageUrl: string) => void;
  onClose: () => void;
}

export default function PhotoInputFallback({ onCapture, onClose }: PhotoInputFallbackProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("📱 MOBILE PHOTO - File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error("📱 MOBILE PHOTO - Invalid file type:", file.type);
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("📱 MOBILE PHOTO - File too large:", file.size);
      alert('Image too large. Please select an image under 10MB');
      return;
    }

    console.log("📱 MOBILE PHOTO - Starting file reading and compression...");

    // Convert to compressed data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      console.log("📱 MOBILE PHOTO - File read complete, size:", imageUrl?.length);
      
      // Compress image before capturing
      compressImage(imageUrl, (compressedUrl) => {
        console.log("📱 MOBILE PHOTO - Compression complete:", {
          originalSize: imageUrl?.length,
          compressedSize: compressedUrl?.length,
          compressionRatio: imageUrl?.length ? ((imageUrl.length - compressedUrl.length) / imageUrl.length * 100).toFixed(1) + '%' : 'unknown'
        });
        
        onCapture(compressedUrl);
      });
    };
    
    reader.onerror = () => {
      console.error("📱 MOBILE PHOTO - Failed to read file");
      alert('Failed to read the selected image');
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Take Photo
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use your camera to capture a photo of litter
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3"
          >
            <Camera className="mr-2 h-4 w-4" />
            Open Camera
          </Button>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>• Position camera over litter</p>
            <p>• Ensure good lighting</p>
            <p>• Keep object in center of frame</p>
          </div>
        </div>
      </div>
    </div>
  );
}