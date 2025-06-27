/**
 * Type definitions for Web Speech API
 * 
 * This file contains type definitions for the Web Speech API interfaces
 * used in the browser speech recognition and synthesis features.
 */

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    
    speechSynthesis: any;
    SpeechSynthesisUtterance: any;
    AudioContext: any;
  }
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): any;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export interface SpeechSynthesisErrorEvent extends Event {
  error: string;
}