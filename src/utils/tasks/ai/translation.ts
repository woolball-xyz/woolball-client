import { TaskData, TaskResult } from '../types';

export async function translation(data: TaskData): Promise<TaskResult> {
  const { input, model, srcLang, tgtLang, ...options } = data;
  
  if (!input || !srcLang || !tgtLang) {
    throw new Error("Required parameters: input, srcLang and tgtLang");
  }
  
  const { pipeline } = await import('@huggingface/transformers');
  const pipe = await pipeline('translation', model, {
    dtype: data.dtype as any,
    device: 'wasm',
  });
  
  const translationOptions = {
    ...options
  } as any;
  
  translationOptions.src_lang = srcLang;
  translationOptions.tgt_lang = tgtLang;
  
  const result = await pipe(input, translationOptions);
  
  let translatedText = '';
  if (Array.isArray(result) && result.length > 0) {
    const firstResult = result[0];
    translatedText = (firstResult as any).translation_text || '';
  }
  
  await pipe.dispose();
  
  return { translatedText };
}