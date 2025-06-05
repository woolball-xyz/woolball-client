import { TaskData, TaskResult } from '../../types';

let videoEncoder: VideoEncoder | null = null;
let videoDecoder: VideoDecoder | null = null;

export async function videoCompression(data: TaskData): Promise<TaskResult> {
  const {
    input,
    codec = 'vp09.00.10.08',
    bitrate = 2_000_000,
    width,
    height,
    framerate,
    keyFrameInterval = 150,
    ...options
  } = data;

  try {
    if (!('VideoEncoder' in globalThis) || !('VideoDecoder' in globalThis)) {
      throw new Error('WebCodecs API não está disponível neste navegador.');
    }

    const inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    const encoderConfig: VideoEncoderConfig = {
      codec,
      width: width || inputData.width,
      height: height || inputData.height,
      bitrate,
      framerate: framerate || 30,
      latencyMode: 'realtime',
      alpha: 'discard',
    };

    const encodedChunks: EncodedVideoChunk[] = [];
    
    if (!videoEncoder) {
      videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => {
          encodedChunks.push(chunk);
        },
        error: (error) => {
          throw new Error(`Erro no encoder: ${error.message}`);
        }
      });
    }

    videoEncoder.configure(encoderConfig);

    if (inputData.frames) {
      let frameCounter = 0;
      for (const frame of inputData.frames) {
        const videoFrame = new VideoFrame(frame.data, {
          timestamp: frame.timestamp,
          duration: frame.duration,
        });
        
        const keyFrame = frameCounter % keyFrameInterval === 0;
        videoEncoder.encode(videoFrame, { keyFrame });
        videoFrame.close();
        frameCounter++;
      }
    } else if (inputData.encodedChunks) {
    }

    await videoEncoder.flush();

    const chunks = encodedChunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });
    
    const blob = new Blob(chunks, { type: `video/webm; codecs=${codec}` });
    
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    
    const base64 = await base64Promise;
    
    return {
      video: base64
    };
  } catch (error) {
    throw error;
  }
}