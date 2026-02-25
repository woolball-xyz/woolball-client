import { TaskData, TaskResult } from '../types';
import { base64ToBlob } from '../../media';

const SUPPORTED_MODELS = [
  'HuggingFaceTB/SmolVLM-256M-Instruct',
];

export async function imageTextToText(data: TaskData): Promise<TaskResult> {
  const {
    input,
    model = 'HuggingFaceTB/SmolVLM-256M-Instruct',
    dtype,
    max_new_tokens = 64,
    provider = 'transformers',
  } = data;

  const { image, text } = typeof input === 'string' ? JSON.parse(input) : input;

  if (!image || !text) {
    throw new Error('Input must contain image (base64) and text');
  }

  if (provider === 'prompt-api') {
    return await processPromptAPI(image, text);
  }

  return await processVision(image, text, model, max_new_tokens, dtype);
}

async function processPromptAPI(image: string, text: string): Promise<TaskResult> {
  if (typeof window.LanguageModel === 'undefined') {
    throw new Error('Prompt API is not available in this browser');
  }

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

  return { generatedText: result };
}

async function processVision(
  image: string,
  text: string,
  model: string,
  max_new_tokens: number,
  dtype?: string,
): Promise<TaskResult> {
  const { AutoProcessor, AutoModelForVision2Seq, RawImage, env } = await import('@huggingface/transformers');

  env.allowLocalModels = false;
  const { getTransformersDevice } = await import('../../../utils/environment.js');

  const processor = await AutoProcessor.from_pretrained(model);
  const visionModel = await AutoModelForVision2Seq.from_pretrained(model, {
    dtype: (dtype || 'q4') as any,
    device: getTransformersDevice('webgpu') as any,
  });

  const imgBlob = base64ToBlob(image);
  const img = await RawImage.fromBlob(imgBlob);

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image', source: img },
        { type: 'text', text },
      ]
    }
  ];

  const prompt = processor.apply_chat_template(messages as any, { add_generation_prompt: true });
  const inputs = await processor(prompt, [img]);

  const output = await visionModel.generate({
    ...inputs,
    max_new_tokens,
  } as any);

  const answer = processor.batch_decode(output as any, { skip_special_tokens: true });

  return { generatedText: answer[0] };
}
