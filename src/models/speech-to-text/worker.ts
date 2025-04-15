import { processAudio } from '../../utils/media';

/**
 * Process audio data and convert it to text using Hugging Face transformers
 * @param event MessageEvent containing audio data and model configuration
 */
export const process = async (event: MessageEvent) => {
    const dictionary = JSON.parse(event.data);
    const {
        id,
        input,
        dtype,
        model,
        ...rest 
    } = dictionary;
    try{

        
        const samples = processAudio(input);
        const { pipeline } = await import('@huggingface/transformers');
        const pipe = await pipeline('automatic-speech-recognition', model, {
            dtype: dtype,
            device: 'webgpu',
            
        });
        
        const result = await pipe(samples, rest);
        
        const composition = {
            id: id,
            result: result,
        }
        self.postMessage(JSON.stringify(composition));
    }
    catch(e){
        self.postMessage(JSON.stringify({id:id, error:e}));
    }
};

// Set up the worker message handler
self.onmessage = (event: MessageEvent) => {
    process(event);
};
  
