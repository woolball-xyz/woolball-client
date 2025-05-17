// Declaração para wav-encoder
declare module 'wav-encoder' {
  export function encode(options: {
    sampleRate: number;
    channelData: Array<Float32Array | Float64Array>
  }): Promise<ArrayBuffer>;
}

// Declaração para kokoro-js
declare module 'kokoro-js' {
  export class KokoroTTS {
    static from_pretrained(
      model_id: string,
      options?: { dtype?: string }
    ): Promise<KokoroTTS>;

    generate(
      text: string,
      options?: { voice?: string }
    ): Promise<any>;

    list_voices(): string[];

    dispose?(): void;
  }
} 