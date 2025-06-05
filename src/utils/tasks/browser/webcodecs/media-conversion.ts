import { TaskData, TaskResult } from '../../types';

let videoEncoder: VideoEncoder | null = null;
let audioEncoder: AudioEncoder | null = null;
let videoDecoder: VideoDecoder | null = null;
let audioDecoder: AudioDecoder | null = null;

export async function mediaConversion(data: TaskData): Promise<TaskResult> {
  const {
    input,
    videoOutputCodec = 'vp09.00.10.08',
    videoOutputBitrate = 2_000_000,
    videoOutputWidth,
    videoOutputHeight,
    videoOutputFramerate,
    videoKeyFrameInterval = 150,
    audioOutputCodec = 'opus',
    audioOutputBitrate = 128000,
    audioOutputSampleRate = 48000,
    audioOutputChannels = 2,
    outputFormat = 'webm',
    ...options
  } = data;

  try {
    if (!('VideoEncoder' in globalThis) || !('AudioEncoder' in globalThis) ||
        !('VideoDecoder' in globalThis) || !('AudioDecoder' in globalThis)) {
      throw new Error('WebCodecs API is not available in this browser.');
    }

    const inputData = typeof input === 'string' ? JSON.parse(input) : input;
    
    const validVideoCodecs = ['vp09.00.10.08', 'vp8', 'avc1.42001E', 'av01.0.04M.08'];
    const validAudioCodecs = ['opus', 'aac', 'mp3'];
    const validOutputFormats = ['webm', 'mp4'];
    
    if (!validVideoCodecs.includes(videoOutputCodec)) {
      throw new Error(`Invalid video codec. Supported codecs: VP9 (vp09.00.10.08), VP8 (vp8), H.264 (avc1.42001E), AV1 (av01.0.04M.08)`);
    }
    
    if (!validAudioCodecs.includes(audioOutputCodec)) {
      throw new Error(`Invalid audio codec. Supported codecs: ${validAudioCodecs.join(', ')}`);
    }
    
    if (!validOutputFormats.includes(outputFormat)) {
      throw new Error(`Invalid output format. Supported formats: ${validOutputFormats.join(', ')}`);
    }
    
    if (outputFormat === 'webm' && (videoOutputCodec === 'avc1.42001E' || audioOutputCodec === 'aac')) {
      throw new Error('WebM format does not support H.264 (avc1.42001E) or AAC codecs. Use VP8/VP9 for video and Opus for audio.');
    }
    
    if (outputFormat === 'mp4' && (videoOutputCodec === 'vp09.00.10.08' || videoOutputCodec === 'vp8' || audioOutputCodec === 'opus')) {
      throw new Error('MP4 format does not support VP8/VP9 or Opus codecs. Use H.264 (avc1.42001E) or AV1 for video and AAC for audio.');
    }

    let hasVideo = false;
    let hasAudio = false;
    
    let videoInputBuffer: ArrayBuffer | undefined;
    let videoInputCodec: string | undefined;
    let videoInputWidth: number | undefined;
    let videoInputHeight: number | undefined;
    let videoInputFramerate: number | undefined;
    
    let audioInputBuffer: ArrayBuffer | undefined;
    let audioInputCodec: string | undefined;
    let audioInputSampleRate: number | undefined;
    let audioInputChannels: number | undefined;
    
    if (inputData.video) {
      hasVideo = true;
      
      if (typeof inputData.video === 'string') {
        const base64String = inputData.video.split(',')[1] || inputData.video;
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        videoInputBuffer = bytes.buffer;
      } else if (inputData.video.buffer) {
        videoInputBuffer = inputData.video.buffer;
      }
      
      videoInputCodec = inputData.video.codec || 'vp09.00.10.08';
      videoInputWidth = inputData.video.width || 640;
      videoInputHeight = inputData.video.height || 480;
      videoInputFramerate = inputData.video.framerate || 30;
    }
    
    if (inputData.audio) {
      hasAudio = true;
      
      if (typeof inputData.audio === 'string') {
        const base64String = inputData.audio.split(',')[1] || inputData.audio;
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioInputBuffer = bytes.buffer;
      } else if (inputData.audio.buffer) {
        audioInputBuffer = inputData.audio.buffer;
      }
      
      audioInputCodec = inputData.audio.codec || 'opus';
      audioInputSampleRate = inputData.audio.sampleRate || 48000;
      audioInputChannels = inputData.audio.numberOfChannels || 2;
    }
    
    if (!hasVideo && !hasAudio) {
      throw new Error('No audio or video data provided.');
    }

    const finalVideoWidth = videoOutputWidth || videoInputWidth || 640;
    const finalVideoHeight = videoOutputHeight || videoInputHeight || 480;
    const finalVideoFramerate = videoOutputFramerate || videoInputFramerate || 30;

    const videoEncodedChunks: EncodedVideoChunk[] = [];
    const audioEncodedChunks: EncodedAudioChunk[] = [];
    
    if (hasVideo) {
      const videoEncoderConfig: VideoEncoderConfig = {
        codec: videoOutputCodec,
        width: finalVideoWidth,
        height: finalVideoHeight,
        bitrate: videoOutputBitrate,
        framerate: finalVideoFramerate,
        latencyMode: 'realtime',
        alpha: 'discard',
      };
      
      if (!videoEncoder) {
        videoEncoder = new VideoEncoder({
          output: (chunk, metadata) => {
            videoEncodedChunks.push(chunk);
          },
          error: (error) => {
            throw new Error(`Video encoder error: ${error.message}`);
          }
        });
      }
      
      videoEncoder.configure(videoEncoderConfig);
      
      if (inputData.video && inputData.video.encodedChunks) {
        const videoDecoderConfig: VideoDecoderConfig = {
          codec: videoInputCodec!,
          codedWidth: videoInputWidth!,
          codedHeight: videoInputHeight!
        };
        
        if (!videoDecoder) {
          videoDecoder = new VideoDecoder({
            output: (frame) => {
              videoEncoder?.encode(frame);
              frame.close();
            },
            error: (error) => {
              throw new Error(`Video decoder error: ${error.message}`);
            }
          });
        }
        
        videoDecoder.configure(videoDecoderConfig);
      }
    }
    
    if (hasAudio) {
      const audioEncoderConfig: AudioEncoderConfig = {
        codec: audioOutputCodec,
        sampleRate: audioOutputSampleRate,
        numberOfChannels: audioOutputChannels,
        bitrate: audioOutputBitrate
      };
      
      if (!audioEncoder) {
        audioEncoder = new AudioEncoder({
          output: (chunk, metadata) => {
            audioEncodedChunks.push(chunk);
          },
          error: (error) => {
            throw new Error(`Audio encoder error: ${error.message}`);
          }
        });
      }
      
      audioEncoder.configure(audioEncoderConfig);
      
      if (inputData.audio && inputData.audio.encodedChunks) {
        const audioDecoderConfig: AudioDecoderConfig = {
          codec: audioInputCodec!,
          sampleRate: audioInputSampleRate!,
          numberOfChannels: audioInputChannels!
        };
        
        if (!audioDecoder) {
          audioDecoder = new AudioDecoder({
            output: (frame) => {
              audioEncoder?.encode(frame);
              frame.close();
            },
            error: (error) => {
              throw new Error(`Audio decoder error: ${error.message}`);
            }
          });
        }
        
        audioDecoder.configure(audioDecoderConfig);
      }
    }

    if (hasVideo) {
      if (inputData.video.frames) {
        let frameCounter = 0;
        for (const frame of inputData.video.frames) {
          const videoFrame = new VideoFrame(frame.data, {
            timestamp: frame.timestamp,
            duration: frame.duration,
          });
          
          const keyFrame = frameCounter % videoKeyFrameInterval === 0;
          videoEncoder?.encode(videoFrame, { keyFrame });
          videoFrame.close();
          frameCounter++;
        }
      } else if (inputData.video.encodedChunks && videoDecoder) {
        for (const chunk of inputData.video.encodedChunks) {
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
      
      await videoEncoder?.flush();
    }
    
    if (hasAudio) {
      if (inputData.audio.frames) {
        for (const frame of inputData.audio.frames) {
          const audioData = new AudioData({
            format: frame.format || 'f32',
            sampleRate: frame.sampleRate || audioInputSampleRate!,
            numberOfChannels: frame.numberOfChannels || audioInputChannels!,
            numberOfFrames: frame.numberOfFrames,
            timestamp: frame.timestamp,
            data: frame.data
          });
          
          audioEncoder?.encode(audioData);
          audioData.close();
        }
      } else if (inputData.audio.encodedChunks && audioDecoder) {
        for (const chunk of inputData.audio.encodedChunks) {
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
      
      await audioEncoder?.flush();
    }

    const videoChunks = videoEncodedChunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });
    
    const audioChunks = audioEncodedChunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });
    
    let videoMimeType: string;
    let audioMimeType: string;
    
    if (outputFormat === 'webm') {
      videoMimeType = `video/webm; codecs=${videoOutputCodec}`;
      audioMimeType = `audio/webm; codecs=${audioOutputCodec}`;
    } else { // mp4
      videoMimeType = `video/mp4; codecs=${videoOutputCodec}`;
      audioMimeType = `audio/mp4; codecs=${audioOutputCodec}`;
    }
    
    let videoBlob: Blob | null = null;
    let audioBlob: Blob | null = null;
    
    if (hasVideo && videoChunks.length > 0) {
      videoBlob = new Blob(videoChunks, { type: videoMimeType });
    }
    
    if (hasAudio && audioChunks.length > 0) {
      audioBlob = new Blob(audioChunks, { type: audioMimeType });
    }
    
    let videoBase64: string | null = null;
    let audioBase64: string | null = null;
    
    if (videoBlob) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(videoBlob);
      videoBase64 = await base64Promise;
    }
    
    if (audioBlob) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      audioBase64 = await base64Promise;
    }
    
    const result: any = {
      format: outputFormat
    };
    
    if (videoBase64) {
      result.video = videoBase64;
      result.videoCodec = videoOutputCodec;
      result.width = finalVideoWidth;
      result.height = finalVideoHeight;
      result.framerate = finalVideoFramerate;
    }
    
    if (audioBase64) {
      result.audio = audioBase64;
      result.audioCodec = audioOutputCodec;
      result.sampleRate = audioOutputSampleRate;
      result.numberOfChannels = audioOutputChannels;
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}