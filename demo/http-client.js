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
    
    const response = await fetch(`${this.apiUrl}/api/v1/text-to-speech`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response;
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