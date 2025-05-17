import { bufferToBase64 } from '../media';
import { TaskData, TaskResult } from './types';

const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-ONNX';
const SUPPORTED_MODEL_PREFIXES = ['xenova/mms-tts-', 'onnx-community/kokoro'];

export async function tts(data: TaskData): Promise<TaskResult> {
  const { input, model, dtype, ...options } = data;
  
  console.log('TTS function called with:', { input, model, dtype, ...options });
  
  try {
    // Check supported models
    const isKokoro = model === KOKORO_MODEL_ID;
    const isSupportedModel = SUPPORTED_MODEL_PREFIXES.some(prefix => 
      model.toLowerCase().includes(prefix.toLowerCase())
    );
    
    console.log('Model analysis:', { isKokoro, isSupportedModel });
    
    // Warning for unrecognized models
    if (!isKokoro && !isSupportedModel) {
      console.warn('Model not explicitly recognized, trying to process:', model);
    }
    
    if (isKokoro) {
      console.log('Using Kokoro processor for TTS');
      return await processKokoroTTS(input, model, dtype, options);
    } else {
      console.log('Using Transformers processor for TTS with model:', model);
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
  console.log('processTransformersTTS started with:', { text, model, dtype });
  
  try {
    console.log('Importing pipeline from @huggingface/transformers');
    const { pipeline } = await import('@huggingface/transformers');
    
    console.log('Creating text-to-speech pipeline with model:', model);
    const pipe = await pipeline('text-to-speech', model, {
      dtype: dtype as any,
      device: 'wasm',
    });
    
    console.log('Pipeline created, processing text');
    const result = await pipe(text, options);
    console.log('Text processed successfully, encoding audio');
    
    const wavEncoder = await import('wav-encoder');
    const wavBuffer = await wavEncoder.encode({
      sampleRate: 16000,
      channelData: [result.audio]
    });
    
    await pipe.dispose();
    console.log('Audio encoded and pipeline released');
    
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
    console.log('Importing KokoroTTS');
    const { KokoroTTS } = await import('kokoro-js');
    
    console.log('Loading Kokoro model:', model);
    const tts = await KokoroTTS.from_pretrained(
      model,
      { dtype: dtype || 'q8' }
    );
    
    console.log('Generating audio with voice:', options.voice);
    const audio = await tts.generate(text, {
      voice: options.voice
    });
    
    tts.dispose?.();
    console.log('Audio generated and model released');
    console.log('audio.toBlob()', audio.toBlob());
    
    return {
      audio: bufferToBase64(audio.toBlob())
    };
  } catch (error) {
    console.error('Error in processKokoroTTS:', error);
    throw error;
  }
}