declare module '@aislamov/diffusers.js' {
  export class DiffusionPipeline {
    static fromPretrained(model: string, options?: { revision?: string }): DiffusionPipeline;
    
    run(options: {
      prompt: string;
      numInferenceSteps?: number;
      [key: string]: any;
    }): Promise<any[]>;
  }
  
}