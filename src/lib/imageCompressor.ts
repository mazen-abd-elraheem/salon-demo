/**
 * Client-Side Image Compressor
 * Compresses customer screenshot receipts (InstaPay / Vodafone Cash)
 * to strictly stay under 100 KB before uploading to Supabase Storage.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  sizeKb: number;
}

export async function compressReceiptImage(
  file: File,
  maxSizeKb: number = 95,
  maxDimension: number = 1200,
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // If it's already an image and tiny, still sanitize via canvas to strip EXIF and normalize to JPEG
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Clean white background for receipts
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        const attemptCompression = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas export failed'));
                return;
              }

              const currentSizeKb = blob.size / 1024;
              if (currentSizeKb > maxSizeKb && q > 0.3) {
                // Step down quality
                attemptCompression(q - 0.15);
              } else {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  { type: 'image/jpeg' },
                );
                const dataUrl = canvas.toDataURL('image/jpeg', q);
                resolve({
                  file: compressedFile,
                  dataUrl,
                  sizeKb: Math.round(currentSizeKb),
                });
              }
            },
            'image/jpeg',
            q,
          );
        };

        attemptCompression(quality);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const compressImage = compressReceiptImage;

