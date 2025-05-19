import { processAudio } from '../media';
import { TaskData, TaskResult } from './types';

export async function asr(data: TaskData): Promise<TaskResult> {
  const { input, model, dtype, ...options } = data;
  
  const audioData = processAudio(input);
  
  const { pipeline } = await import('@huggingface/transformers');
  const pipe = await pipeline('automatic-speech-recognition', model, {
    dtype: dtype as any,
    device: 'webgpu',
  });
  
  const result = await pipe(audioData, options as any);
  
  await pipe.dispose();
  
  return result;
}