import { TaskData, TaskResult } from '../../types';

let audioEncoder: AudioEncoder | null = null;
let audioDecoder: AudioDecoder | null = null;

export async function audioCompression(data: TaskData): Promise<TaskResult> {
  const {
    input,
    codec = 'opus',
    bitrate = 128000,
    sampleRate = 48000,
    numberOfChannels = 2,
    ...options
  } = data;

  try {
    if (!('AudioEncoder' in globalThis) || !('AudioDecoder' in globalThis)) {
      throw new Error('WebCodecs API não está disponível neste navegador.');
    }

    const inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    const encoderConfig: AudioEncoderConfig = {
      codec,
      sampleRate: sampleRate || inputData.sampleRate,
      numberOfChannels: numberOfChannels || inputData.numberOfChannels,
      bitrate
    };

    const encodedChunks: EncodedAudioChunk[] = [];
    
    if (!audioEncoder) {
      audioEncoder = new AudioEncoder({
        output: (chunk, metadata) => {
          encodedChunks.push(chunk);
        },
        error: (error) => {
          throw new Error(`Erro no encoder: ${error.message}`);
        }
      });
    }

    audioEncoder.configure(encoderConfig);

    if (inputData.frames) {
      for (const frame of inputData.frames) {
        const audioData = new AudioData({
          format: frame.format || 'f32',
          sampleRate: frame.sampleRate || sampleRate,
          numberOfChannels: frame.numberOfChannels || numberOfChannels,
          numberOfFrames: frame.numberOfFrames,
          timestamp: frame.timestamp,
          data: frame.data
        });
        
        audioEncoder.encode(audioData);
        audioData.close();
      }
    } else if (inputData.encodedChunks) {
    }

    await audioEncoder.flush();

    const chunks = encodedChunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });
    
    const blob = new Blob(chunks, { type: `audio/webm; codecs=${codec}` });
    
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    
    const base64 = await base64Promise;
    
    return {
      audio: base64
    };
  } catch (error) {
    throw error;
  }
}