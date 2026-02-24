import { TaskStates } from '../types/tasks';
import { modelOptions } from '../constants/modelOptions';
import { TaskCard } from './TaskCard';

interface TaskBottomBarProps {
  tasks: {
    taskStates: TaskStates;
    copiedTaskType: keyof TaskStates | null;
    updateTaskState: <T extends keyof TaskStates>(taskType: T, updates: Partial<TaskStates[T]>) => void;
    startSpeechRecognition: () => void;
    startTextToSpeech: () => void;
    startTranslation: () => void;
    startTextGeneration: () => void;
    startImageTextToText: () => void;
    copyCurlToClipboard: (taskType: keyof TaskStates) => void;
    formatElapsedTime: (ms: number) => string;
  };
  running: boolean;
}

export function TaskBottomBar({ tasks, running }: TaskBottomBarProps) {
  const cards: { taskType: keyof TaskStates; title: string; onStart: () => void }[] = [
    { taskType: 'textGeneration', title: 'Text Generation', onStart: tasks.startTextGeneration },
    { taskType: 'textToSpeech', title: 'Text to Speech', onStart: tasks.startTextToSpeech },
    { taskType: 'speechRecognition', title: 'Speech Recognition', onStart: tasks.startSpeechRecognition },
    { taskType: 'translation', title: 'Translation', onStart: tasks.startTranslation },
    { taskType: 'imageTextToText', title: 'Image to Text', onStart: tasks.startImageTextToText }
  ];

  return (
    <div className="fixed-bottom-bar">
      <div className="test-cards-container">
        {cards.map(({ taskType, title, onStart }) => (
          <TaskCard
            key={taskType}
            taskType={taskType}
            title={title}
            task={tasks.taskStates[taskType]}
            models={modelOptions[taskType]}
            copiedTaskType={tasks.copiedTaskType}
            running={running}
            onStart={onStart}
            onCopyCurl={tasks.copyCurlToClipboard}
            onModelChange={tasks.updateTaskState}
            formatElapsedTime={tasks.formatElapsedTime}
          />
        ))}
      </div>
    </div>
  );
}
