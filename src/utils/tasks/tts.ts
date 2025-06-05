import { bufferToBase64, blobToArrayBuffer } from '../media';
import { TaskData, TaskResult } from './types';

const SUPPORTED_MODEL_PREFIXES = ['xenova/mms-tts-', 'onnx-community/kokoro'];

export async function tts(data: TaskData): Promise<TaskResult> {
  const { input, model, dtype, provider = 'transformers', ...options } = data;

  try {
    const isSupportedModel = SUPPORTED_MODEL_PREFIXES.some(prefix => 
      model.toLowerCase().includes(prefix.toLowerCase())
    );

    if (!isSupportedModel) {
      console.warn('Model not explicitly recognized, trying to process:', model);
    }
    if (provider === 'kokoro') {
      return await processKokoroTTS(input, model, dtype, options);
    } else {
      return await processTransformersTTS(input, model, dtype, options);
    }
  } catch (error) {
    console.error('Error in tts():', error);
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error in text-to-speech processing';
    
    console.error('TTS error details:', errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    throw error;
  }
}

async function processTransformersTTS(
  text: string,
  model: string,
  dtype?: string,
  options: Record<string, any> = {}
): Promise<TaskResult> {
  try {
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
  } catch (error) {
    console.error('Error in processTransformersTTS:', error);
    
    // Generic error messages for any problem
    if (error instanceof Error) {
      if (error.message.includes('Unsupported model type') || 
          error.message.includes('AutoModel')) {
        console.error('Unsupported model type error');
        throw new Error(`Unsupported model type: ${model}. Please use Xenova/mms-tts-* or Kokoro.`);
      }
    }
    
    throw error;
  }
}

async function processKokoroTTS(
  text: string,
  model: string,
  dtype?: string,
  options: Record<string, any> = {}
): Promise<TaskResult> {
  console.log('processKokoroTTS started with:', { text, model, dtype, options });
  
  try {
    const { KokoroTTS } = await import('kokoro-js');
    
    const tts = await KokoroTTS.from_pretrained(
      model,
      { dtype: dtype || 'q8' }  as any
    );
    
    const audio = await tts.generate(text, {
      voice: options.voice
    });

    const audioBlob = audio.toBlob();
    const arrayBuffer = await blobToArrayBuffer(audioBlob);
    const base64Audio = bufferToBase64(arrayBuffer);
    
    return {
      audio: base64Audio
    };
  } catch (error) {
    console.error('Error in processKokoroTTS:', error);
    throw error;
  }
}