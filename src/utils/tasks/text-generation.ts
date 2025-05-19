import { TaskData, TaskResult } from './types';

// Define progress callback interface
interface ProgressCallback {
  progress: number;
  text: string;
  [key: string]: any;
}

// Store a single WebLLM engine instance
let webLLMEngine: any = null;

// Main text generation function
export async function textGeneration(data: TaskData): Promise<TaskResult> {
  const { 
    input, 
    model, 
    dtype, 
    max_new_tokens = 250, 
    do_sample = false, 
    provider = 'transformers', // Default provider is transformers.js
    temperature = 1.0,
    stream = false,
    ...options 
  } = data;
  
  // Parse the input as JSON - assuming it contains the full messages array
  const messages = JSON.parse(input);
  if (!Array.isArray(messages)) {
    throw new Error("Input must be a serialized array of messages");
  }
  
  // Use WebLLM if specified as provider
  if (provider === 'webllm') {
    try {
      console.log('[text-generation] Using WebLLM provider');
      
      // Dynamically import WebLLM
      const webllm = await import('@mlc-ai/web-llm');
      
      // Create or reuse the MLCEngine instance
      if (!webLLMEngine) {
        console.log(`[WebLLM] Initializing engine with model ${model}`);
        webLLMEngine = await webllm.CreateMLCEngine(
          model, 
          { 
            initProgressCallback: (progress: ProgressCallback) => {
              console.log(`WebLLM loading progress: ${progress.text} (${Math.round(progress.progress * 100)}%)`);
            }
          }
        );
      }
      
      // Simple chat request with minimal parameters
      const request = {
        n: 1,
        stream: !!stream,
        messages: messages,
        presence_penalty: 0.8,
        frequency_penalty: 0.8
      };
      
      if (stream) {
        // For streaming, return the generator
        const asyncChunkGenerator = await webLLMEngine.chat.completions.create(request);
        
        return { 
          streamingResponse: true,
          generator: asyncChunkGenerator,
          onComplete: async () => {
            return await webLLMEngine.getMessage();
          }
        };
      } else {
        // For non-streaming, wait for all responses and return the final message
        const asyncChunkGenerator = await webLLMEngine.chat.completions.create(request);
        
        // Consume all chunks (needed even in non-streaming mode)
        for await (const chunk of asyncChunkGenerator) {
          // Process is handled internally by WebLLM
        }
        
        // Get the complete message text
        const generatedText = await webLLMEngine.getMessage();
        
        return { generatedText };
      }
    } catch (error) {
      console.error('WebLLM text generation error:', error);
      throw error;
    }
  }
  
  // Default: Use transformers.js implementation
  console.log('[text-generation] Using transformers.js provider');
  
  // Load and configure the pipeline
  const { pipeline } = await import('@huggingface/transformers');
  const pipe = await pipeline('text-generation', model, {
    dtype: dtype as any,
    device: 'wasm'
  });
  
  // Execute the generation
  const result = await pipe(messages, { 
    max_new_tokens: max_new_tokens,
    do_sample: do_sample,
    ...options
  });
  
  // Extract the generated text
  const firstResult = result[0];
  const generated = (firstResult as any)?.generated_text;
  
  let generatedText = '';
  if (Array.isArray(generated) && generated.length > 0) {
    const lastMessage = generated[generated.length - 1];
    generatedText = lastMessage?.content || '';
  }
  
  // Free resources
  await pipe.dispose();
  
  // Return just the generated text
  return { generatedText };
} 