'use client';

import heic2any from 'heic2any';

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    const conversionResult = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8,
    });

    const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    
    // Create a new file with the correct name and type
    const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([convertedBlob], fileName, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image.');
  }
};
