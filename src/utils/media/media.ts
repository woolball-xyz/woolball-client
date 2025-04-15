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
