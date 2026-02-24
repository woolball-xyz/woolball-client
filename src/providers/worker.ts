import { taskProcessors, TaskType } from '../utils/tasks';

export const process = async ({ data }: MessageEvent) => {
    const { task, ...taskData } = data;

    try {
        const processor = taskProcessors[task as TaskType];
        if (!processor) {
            self.postMessage({ error: `Unsupported task: ${task}` });
            return;
        }

        console.log(`[Worker] Processing task ${task} with processor`);
        const result = await processor(taskData);
        console.log(`[Worker] Task ${task} completed successfully`);
        self.postMessage(result);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error('[Worker] Error:', errorMessage);
        self.postMessage({ error: errorMessage });
    }
};

self.onmessage = (event: MessageEvent) => {
    console.log('[Worker] Message received');
    process(event).catch(err => {
        console.error('[Worker] Unhandled error:', err);
    });
};
