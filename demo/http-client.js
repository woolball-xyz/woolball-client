// HTTP client for AI tasks processing

export class HttpClient {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async loadDefaultAudio() {
    try {
      const response = await fetch('/demo/input.wav');
      if (response.ok) {
        const blob = await response.blob();
        return new File([blob], 'input.wav', { type: 'audio/wav' });
      }
      return null;
    } catch (error) {
      console.log('input.wav file not found, waiting for manual selection');
      return null;
    }
  }

  // Process audio for speech recognition
  async processAudio(file, options) {
    const formData = new FormData();
    formData.append('input', file);
    formData.append('model', options.model);
    formData.append('dtype', options.dtype);
    formData.append('language', options.language);
    formData.append('return_timestamps', options.timestamps ? 'true' : 'false');
    formData.append('stream', options.stream ? 'true' : 'false');

    const response = await fetch(`${this.apiUrl}/api/v1/speech-recognition`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Process text-to-speech
  async processTextToSpeech(text, options) {
    const formData = new FormData();
    formData.append('input', text);
    formData.append('model', options.model);
    formData.append('dtype', options.dtype);
    
    if (options.voice) {
      formData.append('voice', options.voice);
    }
    
    if (options.stream !== undefined) {
      formData.append('stream', options.stream ? 'true' : 'false');
    }
    
    console.log('Sending TTS request:', {
      text,
      model: options.model,
      dtype: options.dtype,
      voice: options.voice,
      stream: options.stream
    });
    
    const response = await fetch(`${this.apiUrl}/api/v1/text-to-speech`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Returns the original response to be processed by the caller
    return response;
  }
  
  // Helper method to create an audio object from base64
  createAudioFromBase64(base64String) {
    // Check if the base64 string is complete
    if (!base64String || typeof base64String !== 'string') {
      console.error('Invalid base64 string:', base64String);
      throw new Error('Invalid audio format');
    }
    
    console.log('Processing base64 audio (first 30 characters):', base64String.substring(0, 30));
    
    // Check for RIFF format (WAV header)
    if (!base64String.startsWith('UklGR') && !base64String.startsWith('RIFF')) {
      console.warn('Warning: The base64 string does not appear to start with a WAV header (RIFF)');
      console.log('Found prefix:', base64String.substring(0, 10));
      // Continue anyway, it might be another format
    }
    
    try {
      // Clean the string if it has a data URL prefix
      let cleanBase64 = base64String;
      if (base64String.includes(';base64,')) {
        cleanBase64 = base64String.split(';base64,')[1];
      }
      
      // Try to detect and fix malformed base64
      const regexInvalidChars = /[^A-Za-z0-9+/=]/g;
      if (regexInvalidChars.test(cleanBase64)) {
        console.warn('The base64 string contains invalid characters. Attempting to clean...');
        cleanBase64 = cleanBase64.replace(regexInvalidChars, '');
      }
      
      // Check if the length is a multiple of 4 (required for base64)
      if (cleanBase64.length % 4 !== 0) {
        console.warn('Warning: Base64 string length is not a multiple of 4.');
        // Add padding if necessary
        while (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '=';
        }
      }
      
      console.log('Base64 processed, converting to binary...');
      
      // Convert base64 to array buffer
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Detect MIME type from content
      let mimeType = 'audio/wav';
      if (bytes.length > 4) {
        const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (header === 'RIFF' || header === 'UklG') {
          mimeType = 'audio/wav';
        } else if (bytes[0] === 0xFF && bytes[1] === 0xFB) {
          mimeType = 'audio/mpeg'; // MP3
        } else if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
          mimeType = 'audio/mpeg'; // MP3 with ID3 tags
        }
      }
      
      console.log(`Detected MIME type: ${mimeType}, creating Blob...`);
      
      // Create a blob and URL
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      console.log('Audio processed successfully, URL created:', audioUrl);
      
      return {
        blob,
        url: audioUrl,
        mimeType
      };
    } catch (error) {
      console.error('Error processing base64 audio:', error);
      throw new Error(`Error processing audio: ${error.message}`);
    }
  }

  // Process translation
  async processTranslation(text, options) {
    const formData = new FormData();
    formData.append('input', text);
    formData.append('model', options.model);
    formData.append('dtype', options.dtype);
    formData.append('srcLang', options.srcLang);
    formData.append('tgtLang', options.tgtLang);

    const response = await fetch(`${this.apiUrl}/api/v1/translation`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Process text generation
  async processTextGeneration(messages, options) {
    const formData = new FormData();
    formData.append('input', JSON.stringify(messages));
    formData.append('model', options.model);
    formData.append('dtype', options.dtype);
    
    if (options.max_new_tokens) {
      formData.append('max_new_tokens', options.max_new_tokens);
    }
    
    if (options.do_sample !== undefined) {
      formData.append('do_sample', options.do_sample ? 'true' : 'false');
    }

    const response = await fetch(`${this.apiUrl}/api/v1/text-generation`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async handleStreamResponse(response, onChunk) {
    await response.body
      .pipeThrough(new TextDecoderStream())
      .pipeTo(new WritableStream({
        write(chunk) {
          onChunk(chunk);
        },
      }));
  }
}