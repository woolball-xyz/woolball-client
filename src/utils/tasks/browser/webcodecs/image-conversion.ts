import { TaskData, TaskResult } from '../../types';

export async function imageConversion(data: TaskData): Promise<TaskResult> {
  const {
    input,
    outputFormat = 'image/webp',
    quality = 0.8,
    maxWidth,
    maxHeight,
    ...options
  } = data;

  try {
    if (!('ImageDecoder' in globalThis)) {
      throw new Error('WebCodecs API (ImageDecoder) is not available in this browser.');
    }

    let inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    let imageData: ArrayBuffer;
    if (inputData.base64) {
      const base64String = inputData.base64.split(',')[1] || inputData.base64;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageData = bytes.buffer;
    } else if (inputData.buffer) {
      imageData = inputData.buffer;
    } else {
      throw new Error('Invalid input format. Provide an image as base64 or ArrayBuffer.');
    }

    const inputType = inputData.type || 'image/jpeg';
    
    const validFormats = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'];
    if (!validFormats.includes(outputFormat)) {
      throw new Error(`Invalid output format. Supported formats: ${validFormats.join(', ')}`);
    }

    const decoder = new ImageDecoder({
      data: imageData,
      type: inputType
    });

    await decoder.completed;
    
    const { image: frame } = await decoder.decode();
    
    let outputWidth = frame.displayWidth;
    let outputHeight = frame.displayHeight;
    
    if (maxWidth && outputWidth > maxWidth) {
      const ratio = maxWidth / outputWidth;
      outputWidth = maxWidth;
      outputHeight = Math.round(outputHeight * ratio);
    }
    
    if (maxHeight && outputHeight > maxHeight) {
      const ratio = maxHeight / outputHeight;
      outputHeight = maxHeight;
      outputWidth = Math.round(outputWidth * ratio);
    }

    const canvas = new OffscreenCanvas(outputWidth, outputHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context.');
    }
    
    ctx.drawImage(frame, 0, 0, outputWidth, outputHeight);
    
    frame.close();
    
    const blob = await canvas.convertToBlob({ type: outputFormat, quality });
    
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    
    const base64 = await base64Promise;

    return {
      image: base64,
      format: outputFormat,
      width: outputWidth,
      height: outputHeight,
      originalFormat: inputType,
      originalWidth: frame.displayWidth,
      originalHeight: frame.displayHeight
    };
  } catch (error) {
    throw error;
  }
}