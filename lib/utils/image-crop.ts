// Image cropping utility functions
// Used to convert a crop area to an actual image file

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Create a cropped image file from the source image and crop area
export const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area,
  fileName = 'cropped-image.jpg',
  quality = 0.9
): Promise<File> => {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Cannot create canvas context'));
        return;
      }

      // Set canvas size to the crop area size
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Draw the cropped image onto the canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Convert canvas to Blob, then to File
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Canvas conversion failed'));
            return;
          }

          const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(file);
        },
        'image/jpeg',
        quality
      );
    };

    image.onerror = () => {
      reject(new Error('Image loading failed'));
    };

    image.src = imageSrc;
  });
};

// Get the natural dimensions of an image
export const getImageDimensions = (
  imageSrc: string
): Promise<{
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      reject(new Error('Cannot get image dimensions'));
    };
    image.src = imageSrc;
  });
};
