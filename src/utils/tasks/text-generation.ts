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
      
      const request: any = {
        n: 1,
        stream: !!stream,
        messages: messages,
      };

      // Only add parameters if they exist in options
      if (options.context_window_size !== undefined) request.context_window_size = options.context_window_size;
      if (options.sliding_window_size !== undefined) request.sliding_window_size = options.sliding_window_size;
      if (options.attention_sink_size !== undefined) request.attention_sink_size = options.attention_sink_size;
      if (options.repetition_penalty !== undefined) request.repetition_penalty = options.repetition_penalty;
      if (options.frequency_penalty !== undefined) request.frequency_penalty = options.frequency_penalty;
      if (options.presence_penalty !== undefined) request.presence_penalty = options.presence_penalty;
      if (options.top_p !== undefined) request.top_p = options.top_p;
      if (temperature !== undefined) request.temperature = temperature;
      if (options.bos_token_id !== undefined) request.bos_token_id = options.bos_token_id;
      
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
  const generationOptions: any = {};
  
  // Only add parameters if they exist
  if (max_new_tokens !== undefined) generationOptions.max_new_tokens = max_new_tokens;
  if (do_sample !== undefined) generationOptions.do_sample = do_sample;
  if (temperature !== undefined) generationOptions.temperature = temperature;
  if (options.top_p !== undefined) generationOptions.top_p = options.top_p;
  if (options.repetition_penalty !== undefined) generationOptions.repetition_penalty = options.repetition_penalty;
  
  const result = await pipe(messages, generationOptions);
  
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