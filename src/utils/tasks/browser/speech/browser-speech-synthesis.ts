import { TaskData, TaskResult } from '../../types';
import { bufferToBase64 } from '../../../media';
import { SpeechSynthesisErrorEvent } from '../../../../types/speech-api';

export async function browserSpeechSynthesis(data: TaskData): Promise<TaskResult> {
  const { 
    input, 
    language = 'en-US', 
    voice = '', 
    rate = 1, 
    pitch = 1, 
    volume = 1 
  } = data;
  
  if (!('speechSynthesis' in window)) {
    throw new Error('Web Speech Synthesis API is not supported in this browser.');
  }
  
  return new Promise((resolve, reject) => {
    try {
      const utterance = new window.SpeechSynthesisUtterance(input);
      
      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      if (voice) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => 
          v.name.toLowerCase() === voice.toLowerCase() || 
          v.voiceURI.toLowerCase() === voice.toLowerCase()
        );
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          console.warn(`Voice "${voice}" not found. Using default voice.`);
        }
      }
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64Audio = bufferToBase64(arrayBuffer);
          
          resolve({
            audio: base64Audio,
            format: 'wav',
            sampleRate: audioContext.sampleRate,
            channels: 1
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Failed to process audio data: ${errorMessage}`));
        }
      };
      
      mediaRecorder.start();
      
      utterance.onend = () => {
        mediaRecorder.stop();
        audioContext.close();
      };
      
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        mediaRecorder.stop();
        audioContext.close();
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      window.speechSynthesis.speak(utterance);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      reject(new Error(`Failed to synthesize speech: ${errorMessage}`));
    }
  });
}