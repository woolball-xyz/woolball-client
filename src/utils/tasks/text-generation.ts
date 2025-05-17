import { TaskData, TaskResult } from './types';

export async function textGeneration(data: TaskData): Promise<TaskResult> {
  const { input, model, dtype, max_new_tokens = 250, do_sample = false, ...options } = data;
  
  // Parse the input as JSON - assuming it contains the full messages array
  const messages = JSON.parse(input);
  if (!Array.isArray(messages)) {
    throw new Error("Input must be a serialized array of messages");
  }
  
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