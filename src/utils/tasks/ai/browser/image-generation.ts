import { TaskData, TaskResult } from '../../types';

let diffusionPipeline: any = null;

export async function imageGeneration(data: TaskData): Promise<TaskResult> {
  const { 
    input, 
    model = 'aislamov/stable-diffusion-2-1-base-onnx', 
    numInferenceSteps = 30,
    provider = 'diffusers',
    revision = 'auto',
    ...options 
  } = data;
  
  try {
    const { DiffusionPipeline } = await import('@aislamov/diffusers.js');
    
    if (!diffusionPipeline) {
      const hasWebGPU = 'gpu' in navigator;
      const pipelineOptions = hasWebGPU ? { revision } : { revision: 'cpu' };
      
      diffusionPipeline = DiffusionPipeline.fromPretrained(model, pipelineOptions);
    }
    
    const images = await diffusionPipeline.run({
      prompt: input,
      numInferenceSteps,
      ...options
    });
    
    const image = images[0];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    const imageData = await image.toImageData({ tensorLayout: 'NCWH', format: 'RGB' });
    ctx.putImageData(imageData, 0, 0);
    
    const base64Image = canvas.toDataURL('image/png');
    
    return {
      image: base64Image
    };
    
  } catch (error) {
    throw error;
  }
}