import { TaskData, TaskResult } from '../../types';

export async function charToImage(data: TaskData): Promise<TaskResult> {
  const { input } = data;
  
  try {
    const canvas = document.createElement('canvas');
    const size = 128; // Tamanho da imagem em pixels
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    ctx.font = `${size - 10}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(input, size / 2, size / 2);
    
    const base64Image = canvas.toDataURL('image/png');
    
    return {
      image: base64Image
    };
  } catch (error) {
    throw error;
  }
}