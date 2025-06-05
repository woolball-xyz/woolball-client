import { TaskData, TaskResult } from '../types';

export async function translation(data: TaskData): Promise<TaskResult> {
  const { input, model, srcLang, tgtLang, provider, ...options } = data;
  
  if (!input || !srcLang || !tgtLang) {
    throw new Error("Required parameters: input, srcLang and tgtLang");
  }
  
  if (provider === 'prompt-api' && 'Translator' in self) {
    try {
      const translatorCapabilities = await (self as any).Translator.availability({
        sourceLanguage: srcLang,
        targetLanguage: tgtLang,
      });
      
      if (translatorCapabilities === 'available' || translatorCapabilities === 'downloadable') {
        const translator = await (self as any).Translator.create({
          sourceLanguage: srcLang,
          targetLanguage: tgtLang,
          monitor(m: any) {
            m.addEventListener('downloadprogress', (e: any) => {
              console.log(`Downloaded ${e.loaded * 100}%`);
            });
          },
        });
        
        const translatedText = await translator.translate(input);
        return { translatedText };
      }
    } catch (error) {
      console.error('Chrome Translator API error:', error);
    }
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