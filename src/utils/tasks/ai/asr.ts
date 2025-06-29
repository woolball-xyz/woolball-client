import { processAudio } from '../../media';
import { TaskData, TaskResult } from '../types';

export async function asr(data: TaskData): Promise<TaskResult> {
  return handle(data);
}

async function handle(data : TaskResult){
  const { input, model, dtype, ...options } = data;
  
  const audioData = processAudio(input);
  
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  const { getTransformersDevice } = await import('../../../utils/environment.js');
  const pipe = await pipeline('automatic-speech-recognition', model, {
    dtype: dtype as any,
    device: getTransformersDevice('webgpu') as any,
  });
  
  const result = await pipe(audioData, options as any);
  
  await pipe.dispose();
  
  return result;
}