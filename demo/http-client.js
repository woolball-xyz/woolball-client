/**
 * Cliente HTTP para processamento de arquivos de áudio
 */

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
      console.log('Arquivo input.wav não encontrado, aguardando seleção manual');
      return null;
    }
  }

  async processAudio(file, options) {
    
    const formData = new FormData();
    formData.append('input', file);
    formData.append('task', 'automatic-speech-recognition');
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
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
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