import { processAudio } from '../../utils/media';

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

        const { pipeline } = await import('@huggingface/transformers');
        const pipe = await pipeline(task, model, {
            dtype: dtype,
            device: 'webgpu',
        });

        const result = await pipe(pipeInput, rest);
        
        // Dispose the pipeline after use
        await pipe.dispose();
        
        self.postMessage(result);

    } catch (e) {
        console.error('Erro no worker:', e);
        self.postMessage({ error: e instanceof Error ? e.message : String(e) });
    }
};

self.onmessage = (event: MessageEvent) => {
    process(event);
};
  
