import { TaskData, TaskResult, TaskType, taskProcessors } from '../utils/tasks';

export const BROWSER_TASKS = ['image-generation', 'char-to-image'];

export const isBrowserTask = (taskType: string): boolean => {
  return BROWSER_TASKS.includes(taskType);
};

export const process = async ({ data }: { data: any }): Promise<TaskResult> => {
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
      console.error(`[Browser] Error: Unsupported task: ${task}`);
      throw new Error(`Unsupported task: ${task}`);
    }

    try {
      const result = await processor(taskData);
      return result;
    } catch (processorError) {
      console.error(`[Browser] Error in ${task} processor:`, processorError);
      
      const errorMessage = processorError instanceof Error ? processorError.message : String(processorError);
      return { error: errorMessage };
    }

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : 'No stack trace available';
    
    console.error('[Browser] Error:', errorMessage);
    console.error('[Browser] Stack:', errorStack);
    
    return { error: errorMessage };
  }
};