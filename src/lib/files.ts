/**
 * Strips EXIF data from images before upload to R2.
 * Critical for privacy — phone photos contain GPS coordinates.
 * Draws image to canvas and re-exports as clean image.
 *
 * Canvas redraw also sanitises any non-image data embedded in the file.
 */
export async function stripExif(file: File): Promise<File> {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Preserve original format — do not silently convert PNG to JPEG
      // Evidence integrity requires format consistency
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = file.type === 'image/png' ? undefined : 0.92;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const cleanFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now(),
          });

          resolve(cleanFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validates image file before upload.
 * Only JPEG/PNG accepted. Max 10MB. MIME type + extension check.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG and PNG photos are accepted.' };
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Invalid file extension.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Photo must be under 10MB.' };
  }

  return { valid: true };
}

/**
 * Validates audio file for voice recording.
 */
export function validateAudioFile(file: Blob): { valid: boolean; error?: string } {
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported audio format.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Voice recording must be under 25MB.' };
  }

  return { valid: true };
}
