import { TaskData, TaskResult } from '../../types';

let audioEncoder: AudioEncoder | null = null;
let audioDecoder: AudioDecoder | null = null;

export async function audioConversion(data: TaskData): Promise<TaskResult> {
  const {
    input,
    outputCodec = 'opus',
    outputBitrate = 128000,
    outputSampleRate = 48000,
    outputChannels = 2,
    ...options
  } = data;

  try {
    if (!('AudioEncoder' in globalThis) || !('AudioDecoder' in globalThis)) {
      throw new Error('WebCodecs API is not available in this browser.');
    }

    const inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    const validCodecs = ['opus', 'aac', 'mp3'];
    if (!validCodecs.includes(outputCodec)) {
      throw new Error(`Invalid output codec. Supported codecs: ${validCodecs.join(', ')}`);
    }

    let inputBuffer: ArrayBuffer;
    let inputCodec: string;
    let inputSampleRate: number;
    let inputChannels: number;
    
    if (inputData.base64) {
      const base64String = inputData.base64.split(',')[1] || inputData.base64;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      inputBuffer = bytes.buffer;
      inputCodec = inputData.codec || 'opus';
      inputSampleRate = inputData.sampleRate || 48000;
      inputChannels = inputData.numberOfChannels || 2;
    } else if (inputData.buffer) {
      inputBuffer = inputData.buffer;
      inputCodec = inputData.codec || 'opus';
      inputSampleRate = inputData.sampleRate || 48000;
      inputChannels = inputData.numberOfChannels || 2;
    } else {
      throw new Error('Invalid input format. Provide audio as base64 or ArrayBuffer.');
    }

    const decoderConfig: AudioDecoderConfig = {
      codec: inputCodec,
      sampleRate: inputSampleRate,
      numberOfChannels: inputChannels
    };

    const encoderConfig: AudioEncoderConfig = {
      codec: outputCodec,
      sampleRate: outputSampleRate,
      numberOfChannels: outputChannels,
      bitrate: outputBitrate
    };

    const encodedChunks: EncodedAudioChunk[] = [];
    
    if (!audioEncoder) {
      audioEncoder = new AudioEncoder({
        output: (chunk, metadata) => {
          encodedChunks.push(chunk);
        },
        error: (error) => {
          throw new Error(`Encoder error: ${error.message}`);
        }
      });
    }

    audioEncoder.configure(encoderConfig);

    if (inputData.frames) {
      for (const frame of inputData.frames) {
        const audioData = new AudioData({
          format: frame.format || 'f32',
          sampleRate: frame.sampleRate || inputSampleRate,
          numberOfChannels: frame.numberOfChannels || inputChannels,
          numberOfFrames: frame.numberOfFrames,
          timestamp: frame.timestamp,
          data: frame.data
        });
        
        audioEncoder.encode(audioData);
        audioData.close();
      }
    } else if (inputData.encodedChunks) {
      if (!audioDecoder) {
        audioDecoder = new AudioDecoder({
          output: (frame) => {
            audioEncoder?.encode(frame);
            frame.close();
          },
          error: (error) => {
            throw new Error(`Decoder error: ${error.message}`);
          }
        });
      }
      
      audioDecoder.configure(decoderConfig);
      
      for (const chunk of inputData.encodedChunks) {
        const encodedChunk = new EncodedAudioChunk({
          type: chunk.type || 'key',
          timestamp: chunk.timestamp || 0,
          duration: chunk.duration,
          data: chunk.data
        });
        
        audioDecoder.decode(encodedChunk);
      }
      
      await audioDecoder.flush();
    }

    await audioEncoder.flush();

    const chunks = encodedChunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });
    
    let mimeType: string;
    switch (outputCodec) {
      case 'opus':
        mimeType = 'audio/webm; codecs=opus';
        break;
      case 'aac':
        mimeType = 'audio/mp4; codecs=mp4a.40.2';
        break;
      case 'mp3':
        mimeType = 'audio/mpeg';
        break;
      default:
        mimeType = `audio/webm; codecs=${outputCodec}`;
    }
    
    const blob = new Blob(chunks, { type: mimeType });
    
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    
    const base64 = await base64Promise;
    
    return {
      audio: base64,
      codec: outputCodec,
      sampleRate: outputSampleRate,
      numberOfChannels: outputChannels,
      originalCodec: inputCodec,
      originalSampleRate: inputSampleRate,
      originalNumberOfChannels: inputChannels
    };
  } catch (error) {
    throw error;
  }
}