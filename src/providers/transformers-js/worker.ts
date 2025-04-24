
import { processAudio } from '../../utils/media';

const pipelineCache = new Map<string, { pipe: any; timerId: NodeJS.Timeout }>();
const INACTIVITY_TIMEOUT = 1 * 60 * 1000;

const generateCacheKey = (task: string, model: string, dtype: string): string => {
    return `${task}-${model}-${dtype}`;
};


const getPipeline = async (task: any, model: string, dtype: any): Promise<any> => {
    const key = generateCacheKey(task, model, dtype);
    let cachedItem = pipelineCache.get(key);
    
    if (cachedItem) {
        clearTimeout(cachedItem.timerId);
    } else {
        const { pipeline } = await import('@huggingface/transformers');
        const pipe = await pipeline(task, model, {
            dtype: dtype,
            device: 'webgpu',
        });
        cachedItem = { pipe, timerId: null as any };
        pipelineCache.set(key, cachedItem);
    }

    cachedItem.timerId = setTimeout(async () => {
        await cachedItem.pipe.dispose(); 
        pipelineCache.delete(key);
    }, INACTIVITY_TIMEOUT);

    return cachedItem.pipe;
};

export const process = async ({ data }: MessageEvent) => {
    const {
        input,
        task,
        dtype,
        model,
        ...rest
    } = data;

    try {
        let pipeInput;

        if(task === 'automatic-speech-recognition'){
            pipeInput = processAudio(input);
        }

        if(pipeInput === undefined){
            throw new Error('invalid task');
        }

        for (const key in rest) {
            if (rest[key] === 'true') {
                rest[key] = true;
            }
            if (rest[key] === 'false') {
                rest[key] = false;
            }
        }

        const pipe = await getPipeline(task, model, dtype);

        const result = await pipe(pipeInput, rest);
        self.postMessage(result);

    } catch (e) {
        console.error('Erro no worker:', e);
        self.postMessage({ error: e instanceof Error ? e.message : String(e) });
    }
};

self.onmessage = (event: MessageEvent) => {
    process(event);
};
  
