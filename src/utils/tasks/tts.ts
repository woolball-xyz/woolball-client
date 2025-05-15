import { bufferToBase64 } from '../media';
import { TaskData, TaskResult } from './types';

const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-ONNX';

export async function tts(data: TaskData): Promise<TaskResult> {
  const { input, model, dtype, ...options } = data;
  
  if (model === KOKORO_MODEL_ID) {
    return await processKokoroTTS(input, model, dtype, options);
  } else {
    return await processTransformersTTS(input, model, dtype, options);
  }
}

async function processTransformersTTS(
  text: string,
  model: string,
  dtype?: string,
  options: Record<string, any> = {}
): Promise<TaskResult> {
  const { pipeline } = await import('@huggingface/transformers');
  const pipe = await pipeline('text-to-speech', model, {
    dtype: dtype as any,
    device: 'wasm',
  });
  
  const result = await pipe(text, options);
  
  const wavEncoder = await import('wav-encoder');
  const wavBuffer = await wavEncoder.encode({
    sampleRate: 16000,
    channelData: [result.audio]
  });
  
  await pipe.dispose();
  
  return {
    audio: bufferToBase64(wavBuffer)
  };
}

async function processKokoroTTS(
  text: string,
  model: string,
  dtype?: string,
  options: Record<string, any> = {}
): Promise<TaskResult> {
  const { KokoroTTS } = await import('kokoro-js');
  const tts = await KokoroTTS.from_pretrained(
    model,
    { dtype: dtype || 'q8' }
  );
  
  const audio = await tts.generate(text, {
    voice: options.voice
  });
  
  tts.dispose?.();
  
  return {
    audio: bufferToBase64(audio.buffer)
  };
}