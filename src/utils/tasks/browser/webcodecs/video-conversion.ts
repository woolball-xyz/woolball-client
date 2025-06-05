import { TaskData, TaskResult } from '../../types';

let videoEncoder: VideoEncoder | null = null;
let videoDecoder: VideoDecoder | null = null;

export async function videoConversion(data: TaskData): Promise<TaskResult> {
  const {
    input,
    outputCodec = 'vp09.00.10.08',
    outputBitrate = 2_000_000,
    outputWidth,
    outputHeight,
    outputFramerate = 30,
    keyFrameInterval = 150,
    ...options
  } = data;

  try {
    if (!('VideoEncoder' in globalThis) || !('VideoDecoder' in globalThis)) {
      throw new Error('WebCodecs API is not available in this browser.');
    }

    const inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    const validCodecs = ['vp09.00.10.08', 'vp8', 'avc1.42001E', 'av01.0.04M.08'];
    if (!validCodecs.includes(outputCodec)) {
      throw new Error(`Invalid output codec. Supported codecs: VP9 (vp09.00.10.08), VP8 (vp8), H.264 (avc1.42001E), AV1 (av01.0.04M.08)`);
    }

    let inputBuffer: ArrayBuffer;
    let inputCodec: string;
    let inputWidth: number;
    let inputHeight: number;
    let inputFramerate: number;
    
    if (inputData.base64) {
      const base64String = inputData.base64.split(',')[1] || inputData.base64;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      inputBuffer = bytes.buffer;
      inputCodec = inputData.codec || 'vp09.00.10.08';
      inputWidth = inputData.width || 640;
      inputHeight = inputData.height || 480;
      inputFramerate = inputData.framerate || 30;
    } else if (inputData.buffer) {
      inputBuffer = inputData.buffer;
      inputCodec = inputData.codec || 'vp09.00.10.08';
      inputWidth = inputData.width || 640;
      inputHeight = inputData.height || 480;
      inputFramerate = inputData.framerate || 30;
    } else {
      throw new Error('Invalid input format. Provide video as base64 or ArrayBuffer.');
    }

    const finalWidth = outputWidth || inputWidth;
    const finalHeight = outputHeight || inputHeight;
    const finalFramerate = outputFramerate || inputFramerate;

    const decoderConfig: VideoDecoderConfig = {
      codec: inputCodec,
      codedWidth: inputWidth,
      codedHeight: inputHeight
    };

    const encoderConfig: VideoEncoderConfig = {
      codec: outputCodec,
      width: finalWidth,
      height: finalHeight,
      bitrate: outputBitrate,
      framerate: finalFramerate,
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
          throw new Error(`Encoder error: ${error.message}`);
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
      if (!videoDecoder) {
        videoDecoder = new VideoDecoder({
          output: (frame) => {
            videoEncoder?.encode(frame);
            frame.close();
          },
          error: (error) => {
            throw new Error(`Decoder error: ${error.message}`);
          }
        });
      }
      
      videoDecoder.configure(decoderConfig);
      
      for (const chunk of inputData.encodedChunks) {
        const encodedChunk = new EncodedVideoChunk({
          type: chunk.type || 'key',
          timestamp: chunk.timestamp || 0,
          duration: chunk.duration,
          data: chunk.data
        });
        
        videoDecoder.decode(encodedChunk);
      }
      
      await videoDecoder.flush();
    }

    await videoEncoder.flush();

    const chunks = encodedChunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });
    
    let mimeType: string;
    switch (outputCodec) {
      case 'vp09.00.10.08':
        mimeType = 'video/webm; codecs=vp09.00.10.08';
        break;
      case 'vp8':
        mimeType = 'video/webm; codecs=vp8';
        break;
      case 'avc1.42001E':
        mimeType = 'video/mp4; codecs=avc1.42001E';
        break;
      case 'av01.0.04M.08':
        mimeType = 'video/mp4; codecs=av01.0.04M.08';
        break;
      default:
        mimeType = `video/webm; codecs=${outputCodec}`;
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
      video: base64,
      codec: outputCodec,
      width: finalWidth,
      height: finalHeight,
      framerate: finalFramerate,
      originalCodec: inputCodec,
      originalWidth: inputWidth,
      originalHeight: inputHeight,
      originalFramerate: inputFramerate
    };
  } catch (error) {
    throw error;
  }
}