import { taskProcessors, TaskType } from '../utils/tasks';

export const process = async ({ data }: MessageEvent) => {
    const { task, ...taskData } = data;

    try {


        for (const key in taskData) {
            if (taskData[key] === 'true') {
                taskData[key] = true;
            }
            if (taskData[key] === 'false') {
                taskData[key] = false;
            }
        }
        
        const processor = taskProcessors[task as TaskType];
        if (!processor) {
            console.error(`[Worker] Error: Unsupported task: ${task}`);
            throw new Error(`Unsupported task: ${task}`);
        }
        
        console.log(`[Worker] Processing task ${task} with processor`);
        
        try {
            const result = await processor(taskData);
            console.log(`[Worker] Task ${task} completed successfully`);
            self.postMessage(result);
        } catch (processorError) {
            console.error(`[Worker] Error in ${task} processor:`, processorError);
            
            // Report error without specific filtering
            const errorMessage = processorError instanceof Error ? processorError.message : String(processorError);
            self.postMessage({ error: errorMessage });
            
            throw processorError; // Re-throw for logging
        }

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        const errorStack = e instanceof Error ? e.stack : 'No stack trace available';
        
        console.error('[Worker] Error:', errorMessage);
        console.error('[Worker] Stack:', errorStack);
        
        // We've already sent the message in the inner try/catch if it was a processor error
        if (!(e instanceof Error && e.message.includes('processor'))) {
            self.postMessage({ error: errorMessage });
        }
    }
};

self.onmessage = (event: MessageEvent) => {
    console.log('[Worker] Message received');
    process(event).catch(err => {
        console.error('[Worker] Unhandled error:', err);
    });
};
  
