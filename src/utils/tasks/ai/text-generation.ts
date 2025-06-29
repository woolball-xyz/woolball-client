declare global {
  interface Window {
    LanguageModel?: {
      create(options: { initialPrompts: any[] }): Promise<{
        prompt(text: string): Promise<string>;
      }>;
    };
  }
}

import { TaskData, TaskResult } from '../types';

let webLLMEngine: any = null;
let mediaPipeLLM: any = null;

async function handlePromptAPI(messages: any[]): Promise<TaskResult> {
  if (typeof window === 'undefined' || typeof window.LanguageModel === 'undefined') {
    return { generatedText: 'Prompt API is not supported in this environment. Please use Google Chrome Canary with the Prompt API flag enabled.' };
  }
  
  const session = await (window.LanguageModel as any).create({ 
    initialPrompts: messages.slice(0, -1)
  });
  
  const response = await session.prompt(messages[messages.length - 1].content || '');
  return { generatedText: response };
}

async function handleWebLLM(messages: any[], model: string, stream: boolean, temperature: number, options: any): Promise<TaskResult> {
  const webllm = await import('@mlc-ai/web-llm');
  
  if (!webLLMEngine) {
    webLLMEngine = await webllm.CreateMLCEngine(model, {});
  }
  
  const request: any = {
    n: 1,
    stream: !!stream,
    messages,
    temperature,
    ...options
  };

  if (stream) {
    const response = await webLLMEngine.chat.completions.create(request);
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      return { 
        streamingResponse: true,
        generator: response,
        onComplete: async () => await webLLMEngine.getMessage()
      };
    }
    return { generatedText: await webLLMEngine.getMessage() };
  }
  
  const response = await webLLMEngine.chat.completions.create(request);
  return { 
    generatedText: response?.choices?.[0]?.message?.content || await webLLMEngine.getMessage() 
  };
}

async function handleMediaPipe(messages: any[], model: string, stream: boolean, temperature: number, options: any): Promise<TaskResult> {
  try {
    const { FilesetResolver, LlmInference } = await import('@mediapipe/tasks-genai');
    
    if (!mediaPipeLLM) {
      
      const wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm';
      
      const genaiFileset = await FilesetResolver.forGenAiTasks(wasmPath);
      const mediaPipeOptions: any = {
        baseOptions: { modelAssetPath: model },
        temperature: parseFloat(temperature.toString()),
        ...Object.fromEntries(
          Object.entries(options)
            .filter(([key]) => ['maxTokens', 'randomSeed', 'topK'].includes(key))
            .map(([key, value]) => [key, parseInt(value as string)])
        )
      };
      
      mediaPipeLLM = await LlmInference.createFromOptions(genaiFileset, mediaPipeOptions);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('importScripts')) {
      throw error;
    }
    throw new Error(`MediaPipe initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const lastUserMessage = messages.filter((msg: any) => msg.role === 'user').pop()?.content || '';

  if (stream) {
    const generator = (async function* () {
      let fullResponse = '';
      await mediaPipeLLM.generateResponse(lastUserMessage, (partialResults: string) => {
        fullResponse += partialResults;
      });
      return fullResponse;
    })();

    return {  
      streamingResponse: true,
      generator,
      onComplete: async () => await generator.next()
    };
  }
  
  let fullResponse = '';
  await mediaPipeLLM.generateResponse(lastUserMessage, (partialResults: string) => {
    fullResponse += partialResults;
  });
  return { generatedText: fullResponse };
}

async function handleTransformers(messages: any[], model: string, dtype: any, options: any): Promise<TaskResult> {

  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;

  const { getTransformersDevice } = await import('../../../utils/environment.js');
  const device = getTransformersDevice('wasm');
  
  const pipe = await pipeline('text-generation', model, { dtype, device: device  as any});

  const result = await pipe(messages, options);
  const generated = (result[0] as any)?.generated_text;
  
  let generatedText = '';
  if (Array.isArray(generated) && generated.length > 0) {
    generatedText = generated[generated.length - 1]?.content || '';
  }
  
  await pipe.dispose();
  return { generatedText };
}

export async function textGeneration(data: TaskData): Promise<TaskResult> {
  const { 
    input, 
    model, 
    dtype, 
    max_new_tokens = 250, 
    do_sample = false, 
    provider = 'transformers',
    temperature = 1.0,
    stream = false,
    ...options 
  } = data;
  
  const messages = JSON.parse(input);
  if (!Array.isArray(messages)) {
    throw new Error("Input must be a serialized array of messages");
  }
  
  try {
    switch (provider) {
      case 'prompt-api':
        return await handlePromptAPI(messages);
      case 'webllm':
        return await handleWebLLM(messages, model, stream, temperature, options);
      case 'mediapipe':
        return await handleMediaPipe(messages, model, stream, temperature, options);
      default:
        return await handleTransformers(messages, model, dtype, {
          max_new_tokens,
          do_sample,
          temperature,
          ...options
        });
    }
  } catch (error) {
    throw error;
  }
}