import {WaveFile} from 'wavefile';

/**
 * Processes audio data by converting base64 to Float64Array with specific sample rate and bit depth
 * @param data Base64 encoded audio data
 * @returns Float64Array Processed audio samples
 */
export function processAudio(data: string): Float64Array {
  let wav = new WaveFile();
  wav.fromBase64(data);  
  wav.toBitDepth('32f'); 
  wav.toSampleRate(16000); 
  
  let samples = wav.getSamples();
  if (Array.isArray(samples) && samples.length > 1) {
    const SCALING_FACTOR = Math.sqrt(2);
    for (let i = 0; i < samples[0].length; ++i) {
      samples[0][i] = SCALING_FACTOR * (samples[0][i] + samples[1][i]) / 2;
    }
    samples = samples[0];
  }
  return samples;
}

/**
 * Converte um Blob para ArrayBuffer
 * @param blob Blob para converter
 * @returns Promise<ArrayBuffer> ArrayBuffer resultante
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Converte um ArrayBuffer para string base64
 * @param buffer ArrayBuffer para converter
 * @returns String base64
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
