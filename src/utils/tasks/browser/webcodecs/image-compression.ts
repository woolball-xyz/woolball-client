import { TaskData, TaskResult } from '../../types';

export async function imageCompression(data: TaskData): Promise<TaskResult> {
  const {
    input,
    format = 'image/webp',
    quality = 0.8,
    maxWidth,
    maxHeight,
    ...options
  } = data;

  try {
    if (!('ImageDecoder' in globalThis)) {
      throw new Error('WebCodecs API (ImageDecoder) não está disponível neste navegador.');
    }

    let inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    let imageData: ArrayBuffer;
    if (inputData.base64) {
      const binaryString = atob(inputData.base64.split(',')[1] || inputData.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageData = bytes.buffer;
    } else if (inputData.buffer) {
      imageData = inputData.buffer;
    } else {
      throw new Error('Formato de entrada inválido. Forneça uma imagem como base64 ou ArrayBuffer.');
    }

    const imageType = inputData.type || 'image/jpeg';
    const decoder = new ImageDecoder({
      data: imageData,
      type: imageType
    });

    await decoder.completed;
    
    const { image: firstFrame } = await decoder.decode();
    
    let outputWidth = firstFrame.displayWidth;
    let outputHeight = firstFrame.displayHeight;
    
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

    const frame = firstFrame;

    const canvas = new OffscreenCanvas(outputWidth, outputHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Não foi possível criar o contexto de canvas.');
    }
    
    ctx.drawImage(frame, 0, 0, outputWidth, outputHeight);
    
    frame.close();
    
    const blob = await canvas.convertToBlob({ type: format, quality });
    
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    
    const base64 = await base64Promise;

    return {
      image: base64
    };
  } catch (error) {
    throw error;
  }
}