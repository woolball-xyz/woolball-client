import { taskProcessors, TaskType } from '../../utils/tasks';

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
            throw new Error(`Tarefa não suportada: ${task}`);
        }
        
        const result = await processor(taskData);
        
        self.postMessage(result);

    } catch (e) {
        console.error('Erro no worker:', e);
        self.postMessage({ error: e instanceof Error ? e.message : String(e) });
    }
};

self.onmessage = (event: MessageEvent) => {
    process(event);
};
  
