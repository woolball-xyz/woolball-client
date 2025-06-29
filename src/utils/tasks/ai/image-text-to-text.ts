import { TaskData, TaskResult } from '../types';
import { base64ToBlob } from '../../media';

const SUPPORTED_MODELS = [
  'llava-hf/llava-onevision-qwen2-0.5b-ov-hf'
];

export async function imageTextToText(data: TaskData): Promise<TaskResult> {
  const { 
    input,
    model = 'llava-hf/llava-onevision-qwen2-0.5b-ov-hf',
    dtype,
    max_new_tokens = 64,
    do_sample = false,
    provider = 'transformers',
    ...options 
  } = data;
  
  try {
    const { image, text } = typeof input === 'string' ? JSON.parse(input) : input;
    
    if (!image || !text) {
      throw new Error('Input must contain image (base64) and text');
    }
    
    if (provider === 'transformers' && !SUPPORTED_MODELS.includes(model)) {
      throw new Error(`Unsupported model: ${model}. Currently only the following models are supported: ${SUPPORTED_MODELS.join(', ')}`);
    }
    
    if (provider === 'prompt-api') {
      return await processPromptAPI(image, text);
    } else if (model.includes('llava-onevision')) {
      return await processLlavaOnevision(image, text, model, max_new_tokens, do_sample, dtype, provider, options);
    } else {
      throw new Error(`Model ${model} not implemented yet.`);
    }
  } catch (error) {
    console.error('[image-text-to-text] Error:', error);
    throw error;
  }
}

async function processPromptAPI(image: string, text: string): Promise<TaskResult> {
  if (typeof window.LanguageModel === 'undefined') {
    throw new Error('Prompt API is not available in this browser');
  }

  try {
    const session = await (window.LanguageModel as any).create({
      expectedInputs: [{ type: "image" }]
    });

    const imageBlob = await fetch(image).then(res => res.blob());
    const result = await session.prompt([{
      role: "user",
      content: [
        { type: "text", value: text },
        { type: "image", value: imageBlob }
      ]
    }]);

    return {
      generatedText: result
    };
  } catch (error) {
    console.error('[image-text-to-text] Error processing Prompt API:', error);
    throw error;
  }
}

async function processLlavaOnevision(
  image: string,
  text: string,
  model: string,
  max_new_tokens: number,
  do_sample: boolean,
  dtype?: string,
  provider: string = 'transformers',
  options: Record<string, any> = {}
): Promise<TaskResult> {
  try {
    const { AutoProcessor, AutoTokenizer, LlavaOnevisionForConditionalGeneration, RawImage, env } = await import('@huggingface/transformers');

    env.allowLocalModels = false;
    const tokenizer = await AutoTokenizer.from_pretrained(model);
    const processor = await AutoProcessor.from_pretrained(model, {});
    const modelPipe = await LlavaOnevisionForConditionalGeneration.from_pretrained(model, {
      dtype: {
        embed_tokens: 'q4f16',
        vision_encoder: 'q4f16',
        decoder_model_merged: 'q4f16',
      },
    });
    
    const messages = [
      { role: 'user', content: `<image>\n${text}` }
    ];
    
    const textTemplate = tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
    const text_inputs = tokenizer(textTemplate);
    
    const imgBlob = base64ToBlob(image);
    var img = await RawImage.fromBlob(imgBlob);
    img.resize(150, 150);
    const vision_inputs = await processor(img);
    
    const { sequences } = await modelPipe.generate({
      ...text_inputs,
      ...vision_inputs,
      do_sample: do_sample,
      max_new_tokens: max_new_tokens,
      return_dict_in_generate: true,
    }) as any;
    
    const result = tokenizer.decode(
      sequences.slice(0, [text_inputs.input_ids.dims[1], null]),
      { skip_special_tokens: true },
    );
    
    return {
      generatedText: result
    };
  } catch (error) {
    console.error('[image-text-to-text] Error processing Llava Onevision:', error);
    throw error;
  }
}