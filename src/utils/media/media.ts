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
 * Converts a Blob to ArrayBuffer
 * Compatible with browser and Node.js environments
 * @param blob Blob to convert
 * @returns Promise<ArrayBuffer> Resulting ArrayBuffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  
  if (isBrowser) {
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
  } else {
    if (typeof blob.arrayBuffer === 'function') {
      return blob.arrayBuffer();
    } else {
      if (blob instanceof Buffer) {
        return Promise.resolve(blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength));
      } else {
        return Promise.resolve(Buffer.from(blob as any).buffer);
      }
    }
  }
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

/**
 * Converte uma string base64 para um objeto Blob
 * @param base64 String base64 para converter
 * @param tipo Tipo MIME do blob resultante
 * @returns Blob resultante
 */
export function base64ToBlob(base64: string, tipo = 'image/png'): Blob {
  const binario = atob(base64);
  const tamanho = binario.length;
  const bytes = new Uint8Array(tamanho);
  for (let i = 0; i < tamanho; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return new Blob([bytes], { type: tipo });
}
