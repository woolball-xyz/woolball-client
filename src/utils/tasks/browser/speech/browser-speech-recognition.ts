import { TaskData, TaskResult } from '../../types';
import { SpeechRecognitionErrorEvent, SpeechRecognitionEvent } from '../../../../types/speech-api';

export async function browserSpeechRecognition(data: TaskData): Promise<TaskResult> {
  const { input, language = 'en-US', continuous = false, interimResults = false } = data;
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    throw new Error('Web Speech API is not supported in this browser.');
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = language;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  
  return new Promise((resolve, reject) => {
    let finalTranscript = '';
    
    if (input) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${input}`);
        audio.addEventListener('ended', () => {
          recognition.stop();
        });
        
        audio.play().catch((error: Error) => {
          reject(new Error(`Failed to play audio: ${error.message}`));
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        reject(new Error(`Failed to process audio input: ${errorMessage}`));
      }
    }
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimResults) {
        resolve({
          text: finalTranscript,
          interimText: interimTranscript,
          isFinal: false
        });
      }
    };
    
    recognition.onend = () => {
      resolve({
        text: finalTranscript,
        isFinal: true
      });
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };
    
    recognition.start();
    
    if (!input) {
      console.log('Listening via microphone...');
    }
  });
}