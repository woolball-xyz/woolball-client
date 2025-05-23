import { TaskData, TaskResult } from './types';

// Define progress callback interface
interface ProgressCallback {
  progress: number;
  text: string;
  [key: string]: any;
}

// Store a single WebLLM engine instance
let webLLMEngine: any = null;
let mediaPipeLLM: any = null;

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
  
  const messages = JSON.parse(input);
  if (!Array.isArray(messages)) {
    throw new Error("Input must be a serialized array of messages");
  }
  
  if (provider === 'webllm') {
    try {
      console.log('[text-generation] Using WebLLM provider');
      
      const webllm = await import('@mlc-ai/web-llm');
      
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
        const response = await webLLMEngine.chat.completions.create(request);
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
          return { 
            streamingResponse: true,
            generator: response,
            onComplete: async () => {
              return await webLLMEngine.getMessage();
            }
          };
        } else {
          let generatedText = '';
          if (response && response.choices && response.choices.length > 0) {
            generatedText = response.choices[0].message?.content || '';
          } else {
            generatedText = await webLLMEngine.getMessage();
          }
          
          return { generatedText };
        }
      } else {
        const response = await webLLMEngine.chat.completions.create(request);
        
        let generatedText = '';
        if (response && response.choices && response.choices.length > 0) {
          generatedText = response.choices[0].message?.content || '';
        } else {
          generatedText = await webLLMEngine.getMessage();
        }
        
        return { generatedText };
      }
    } catch (error) {
      console.error('WebLLM text generation error:', error);
      throw error;
    }
  }
  
  if (provider === 'mediapipe') {
    try {
      
      const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');
      
      if (!mediaPipeLLM) {
        const genaiFileset = await FilesetResolver.forGenAiTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
        );
        const mediaPipeOptions: any = {
          baseOptions: { modelAssetPath: model }
        };

        if (options.maxTokens) mediaPipeOptions.maxTokens = parseInt(options.maxTokens);
        if (options.randomSeed) mediaPipeOptions.randomSeed = parseInt(options.randomSeed);
        if (options.topK) mediaPipeOptions.topK = parseInt(options.topK);
        if (temperature) mediaPipeOptions.temperature = parseFloat(temperature);

        mediaPipeLLM = await LlmInference.createFromOptions(genaiFileset, mediaPipeOptions);
      }

      const lastUserMessage = messages
        .filter((msg: any) => msg.role === 'user')
        .pop()?.content || '';

      if (stream) {
        const generator = (async function* () {
          let fullResponse = '';
          
          await mediaPipeLLM.generateResponse(
            lastUserMessage,
            (partialResults: string, complete: boolean) => {
              fullResponse += partialResults;
              if (complete) {
                return fullResponse;
              }
            }
          );

          return fullResponse;
        })();

        return {  
          streamingResponse: true,
          generator,
          onComplete: async () => {
            return await generator.next();
          }
        };
      } else {
        let fullResponse = '';
        await mediaPipeLLM.generateResponse(
          lastUserMessage,
          (partialResults: string, complete: boolean) => {
            fullResponse += partialResults;
          }
        );

        return { generatedText: fullResponse };
      }
    } catch (error) {
      console.error('MediaPipe text generation error:', error);
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