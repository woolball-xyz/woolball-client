import { processAudio } from '../../utils/media';

/**
 * Process audio data and convert it to text using Hugging Face transformers
 * @param event MessageEvent containing audio data and model configuration
 */
export const process = async ({data}: MessageEvent) => {
   
    const {
        id,
        input,
        dtype,
        model,
        ...rest 
    } = data;
    try{

        
        const samples = processAudio(input);
        const { pipeline } = await import('@huggingface/transformers');
        const pipe = await pipeline('automatic-speech-recognition', model, {
            dtype: dtype,
            device: 'webgpu',
        });
        
        for (const key in rest) {
            if (rest[key] === 'true') {
                rest[key] = true;
            }
            if (rest[key] === 'false') {
                rest[key] = false;
            }
        }

        const result = await pipe(samples, rest);

        self.postMessage(result);
    }
    catch(e){
        console.log(e);
        self.postMessage(({error: e}));
    }
};

// Set up the worker message handler
self.onmessage = (event: MessageEvent) => {
    process(event);
};
  
