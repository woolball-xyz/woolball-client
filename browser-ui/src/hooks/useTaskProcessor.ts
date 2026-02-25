import { useEffect, useRef, useState } from 'react';
import { TaskStates, SpeechRecognitionTask, TextToSpeechTask, ImageTextToTextTask } from '../types/tasks';
import { DEFAULT_TASK_STATES, fixedAudioUrl } from '../constants/modelOptions';
import { API_URL } from '../utils/env';

export function useTaskProcessor() {
  const [taskStates, setTaskStates] = useState<TaskStates>(DEFAULT_TASK_STATES);
  const [copiedTaskType, setCopiedTaskType] = useState<keyof TaskStates | null>(null);

  const timerRefs = useRef({
    speechRecognition: null as number | null,
    textToSpeech: null as number | null,
    translation: null as number | null,
    textGeneration: null as number | null,
    imageTextToText: null as number | null
  });

  const statusTimeoutRefs = useRef({
    speechRecognition: null as ReturnType<typeof setTimeout> | null,
    textToSpeech: null as ReturnType<typeof setTimeout> | null,
    translation: null as ReturnType<typeof setTimeout> | null,
    textGeneration: null as ReturnType<typeof setTimeout> | null,
    imageTextToText: null as ReturnType<typeof setTimeout> | null
  });

  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStatusTimeout = (taskType: keyof TaskStates) => {
    if (statusTimeoutRefs.current[taskType] !== null) {
      clearTimeout(statusTimeoutRefs.current[taskType]!);
      statusTimeoutRefs.current[taskType] = null;
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    const rafRefs = timerRefs.current;
    const stRefs = statusTimeoutRefs.current;
    return () => {
      Object.values(rafRefs).forEach(timerRef => {
        if (timerRef !== null) {
          cancelAnimationFrame(timerRef);
        }
      });
      Object.values(stRefs).forEach(timerRef => {
        if (timerRef !== null) {
          clearTimeout(timerRef);
        }
      });
      if (copiedTimeoutRef.current !== null) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const updateTaskState = <T extends keyof TaskStates>(
    taskType: T,
    updates: Partial<TaskStates[T]>
  ) => {
    setTaskStates(prev => ({
      ...prev,
      [taskType]: { ...prev[taskType], ...updates }
    }));
  };

  const lastDisplayedRef = useRef({
    speechRecognition: 0,
    textToSpeech: 0,
    translation: 0,
    textGeneration: 0,
    imageTextToText: 0
  });

  const startTimer = (taskType: keyof TaskStates) => {
    const startTime = Date.now();
    lastDisplayedRef.current[taskType] = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const displayedTime = Math.floor(elapsed / 100) * 100;
      if (displayedTime !== lastDisplayedRef.current[taskType]) {
        lastDisplayedRef.current[taskType] = displayedTime;
        updateTaskState(taskType, { elapsedTime: elapsed });
      }
      timerRefs.current[taskType] = requestAnimationFrame(animate);
    };
    timerRefs.current[taskType] = requestAnimationFrame(animate);
  };

  const stopTimer = (taskType: keyof TaskStates) => {
    if (timerRefs.current[taskType] !== null) {
      cancelAnimationFrame(timerRefs.current[taskType]!);
      timerRefs.current[taskType] = null;
    }
    clearStatusTimeout(taskType);
  };

  const formatElapsedTime = (ms: number): string => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const processAudioFile = async (file: File, task: SpeechRecognitionTask) => {
    const taskType = 'speechRecognition';

    try {
      console.log('Starting Speech Recognition process');
      console.log(`File: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);

      const formData = new FormData();
      formData.append('input', file);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      formData.append('language', 'en');
      formData.append('return_timestamps', 'true');
      formData.append('stream', 'true');

      console.log('Sending request to API');

      const response = await fetch(API_URL + '/speech-recognition', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('API response received, starting stream processing');
      updateTaskState(taskType, { status: 'Receiving data...' });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let totalBytesReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream completed');
          updateTaskState(taskType, {
            status: "Success, open DevTools to see results",
            isProcessing: false
          });
          stopTimer(taskType);
          break;
        }

        if (value) {
          totalBytesReceived += value.length;
          updateTaskState(taskType, { status: `Receiving data: ${totalBytesReceived} bytes` });
        }

        decoder.decode(value, {stream: true});
      }

      console.log('Speech Recognition process completed successfully');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in Speech Recognition process:', errorMessage);
      updateTaskState(taskType, {
        status: `Error: ${errorMessage}`,
        isProcessing: false
      });
      stopTimer(taskType);
    }
  };

  const startSpeechRecognition = async () => {
    const taskType = 'speechRecognition';
    const task = taskStates[taskType];

    updateTaskState(taskType, {
      isProcessing: true,
      status: 'Distributing tasks...',
      elapsedTime: 0
    });
    startTimer(taskType);

    const fetchPromise = fetch(fixedAudioUrl);

    clearStatusTimeout(taskType);
    statusTimeoutRefs.current[taskType] = setTimeout(() => {
      statusTimeoutRefs.current[taskType] = null;
      updateTaskState(taskType, { status: 'Processing...' });
    }, 2000);

    try {
      console.log(`Fetching audio from fixed URL: ${fixedAudioUrl}`);
      const response = await fetchPromise;
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = fixedAudioUrl.split('/').pop() || 'audio-file.mp3';
      const file = new File([blob], fileName, { type: 'audio/mpeg' });

      await processAudioFile(file, task);

    } catch (error) {
      console.error('Error fetching file from URL:', error);
      updateTaskState(taskType, {
        status: `Error fetching file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isProcessing: false
      });
      stopTimer(taskType);
    }
  };

  const startTextToSpeech = async () => {
    const taskType = 'textToSpeech';
    const task = taskStates[taskType];

    updateTaskState(taskType, {
      isProcessing: true,
      status: 'Preparing voice synthesis...',
      elapsedTime: 0
    });
    startTimer(taskType);

    const fixedText = "Hello, this is a test of the text to speech system. Running AI models directly in your browser is now possible.";

    try {
      console.log('Starting Text-to-Speech process');

      clearStatusTimeout(taskType);
      statusTimeoutRefs.current[taskType] = setTimeout(() => {
        statusTimeoutRefs.current[taskType] = null;
        updateTaskState(taskType, { status: 'Generating voice...' });
      }, 1000);

      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      formData.append('provider', task.provider);

      if (task.provider === 'kokoro') {
        formData.append('voice', task.voice);
      }

      console.log('Sending TTS request');

      const response = await fetch(API_URL + '/text-to-speech', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('API response received, processing audio data');
      updateTaskState(taskType, { status: 'Processing audio data...' });

      const result = await response.json();

      if (Array.isArray(result)) {
        const audioItems = result.filter((item: { audio?: string }) => item.audio);
        if (audioItems.length > 0) {
          const totalBytes = audioItems.reduce((total: number, item: { audio?: string }) => total + (item.audio ? item.audio.length : 0), 0);
          console.log(`Received audio data: ${totalBytes} bytes (${(totalBytes / 1024).toFixed(2)} KB)`);
          updateTaskState(taskType, {
            status: "Success, open DevTools to see results",
            isProcessing: false
          });
        } else {
          throw new Error('No audio found in API response');
        }
      } else if (result.audio) {
        const audioBytes = result.audio.length;
        console.log(`Received audio data: ${audioBytes} bytes (${(audioBytes / 1024).toFixed(2)} KB)`);
        updateTaskState(taskType, {
          status: "Success, open DevTools to see results",
          isProcessing: false
        });
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        throw new Error('API response does not contain audio data');
      }

      stopTimer(taskType);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in Text-to-Speech process:', errorMessage);
      updateTaskState(taskType, {
        status: `Error: ${errorMessage}`,
        isProcessing: false
      });
      stopTimer(taskType);
    }
  };

  const startTranslation = async () => {
    const taskType = 'translation';
    const task = taskStates[taskType];

    updateTaskState(taskType, {
      isProcessing: true,
      status: 'Preparing translation...',
      elapsedTime: 0
    });
    startTimer(taskType);

    const fixedText = "The quick brown fox jumps over the lazy dog. Machine learning has transformed how we process natural language.";

    try {
      console.log('Starting Translation process');

      clearStatusTimeout(taskType);
      statusTimeoutRefs.current[taskType] = setTimeout(() => {
        statusTimeoutRefs.current[taskType] = null;
        updateTaskState(taskType, { status: 'Translating...' });
      }, 1000);

      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      formData.append('srcLang', task.srcLang);
      formData.append('tgtLang', task.tgtLang);

      console.log('Sending translation request');

      const response = await fetch(API_URL + '/translation', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('API response received, processing translation');

      const result = await response.json();

      if (result.translatedText) {
        updateTaskState(taskType, {
          status: "Success, open DevTools to see results",
          isProcessing: false
        });
      } else if (result.error) {
        throw new Error(result.error);
      }

      stopTimer(taskType);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in Translation process:', errorMessage);
      updateTaskState(taskType, {
        status: `Error: ${errorMessage}`,
        isProcessing: false
      });
      stopTimer(taskType);
    }
  };

  const startTextGeneration = async () => {
    const taskType = 'textGeneration';
    const task = taskStates[taskType];

    updateTaskState(taskType, {
      isProcessing: true,
      status: 'Preparing AI model...',
      elapsedTime: 0
    });
    startTimer(taskType);

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is the capital of Brazil?" }
    ];

    try {
      console.log('Starting Text Generation process');

      clearStatusTimeout(taskType);
      statusTimeoutRefs.current[taskType] = setTimeout(() => {
        statusTimeoutRefs.current[taskType] = null;
        updateTaskState(taskType, { status: 'Generating response...' });
      }, 1000);

      const formData = new FormData();
      formData.append('input', JSON.stringify(messages));
      formData.append('model', task.model);

      if (task.provider === 'transformers') {
        formData.append('dtype', task.dtype);
        formData.append('max_new_tokens', task.maxTokens.toString());
        formData.append('do_sample', task.doSample.toString());
      } else if (task.provider === 'webllm') {
        formData.append('provider', 'webllm');
        formData.append('stream', task.enableStreaming.toString());
      } else if (task.provider === 'mediapipe') {
        formData.append('provider', 'mediapipe');
        formData.append('maxTokens', task.maxTokens.toString());
        formData.append('stream', task.enableStreaming.toString());
      }

      console.log('Sending text generation request');

      const headers: HeadersInit = {};
      if (task.provider !== 'transformers') {
        headers['X-Provider'] = task.provider;
      }

      const response = await fetch(API_URL + '/text-generation', {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('API response received, processing generated text');

      if (task.enableStreaming && (task.provider === 'webllm' || task.provider === 'mediapipe')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            decoder.decode(value, { stream: true });
          }
        }
      } else {
        const result = await response.json();

        if (result.generatedText) {
          // success
        } else if (result.error) {
          throw new Error(result.error);
        }
      }

      updateTaskState(taskType, {
        status: "Success, open DevTools to see results",
        isProcessing: false
      });
      stopTimer(taskType);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in Text Generation process:', errorMessage);
      updateTaskState(taskType, {
        status: `Error: ${errorMessage}`,
        isProcessing: false
      });
      stopTimer(taskType);
    }
  };

  const startImageTextToText = async () => {
    const taskType = 'imageTextToText';
    const task = taskStates[taskType];

    updateTaskState(taskType, {
      isProcessing: true,
      status: 'Preparing vision model...',
      elapsedTime: 0
    });
    startTimer(taskType);

    // 64x64 red PNG for testing
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAb0lEQVR4nO3PAQkAAAyEwO9feoshgnABdLep8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3I8QUNyPEFDcjxBQ3IPanc8OLDQitxAAAAAElFTkSuQmCC";

    const fixedInput = JSON.stringify({
      image: testImageBase64,
      text: "What is in this image?"
    });

    try {
      console.log('Starting Image-Text-to-Text process');

      clearStatusTimeout(taskType);
      statusTimeoutRefs.current[taskType] = setTimeout(() => {
        statusTimeoutRefs.current[taskType] = null;
        updateTaskState(taskType, { status: 'Generating response...' });
      }, 1000);

      const formData = new FormData();
      formData.append('input', fixedInput);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      formData.append('max_new_tokens', task.maxTokens.toString());
      formData.append('do_sample', task.doSample.toString());

      console.log('Sending image-text-to-text request');

      const response = await fetch(API_URL + '/image-text-to-text', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('API response received, processing generated text');

      const result = await response.json();

      if (result.generatedText) {
        // success
      } else if (result.error) {
        throw new Error(result.error);
      }

      updateTaskState(taskType, {
        status: "Success, open DevTools to see results",
        isProcessing: false
      });
      stopTimer(taskType);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in Image-Text-to-Text process:', errorMessage);
      updateTaskState(taskType, {
        status: `Error: ${errorMessage}`,
        isProcessing: false
      });
      stopTimer(taskType);
    }
  };

  const generateCurlCommand = (taskType: keyof TaskStates) => {
    const task = taskStates[taskType];
    const apiEndpoint = API_URL;

    switch (taskType) {
      case 'speechRecognition': {
        const speechTask = task as typeof taskStates.speechRecognition;
        return `curl -X POST \\
  "${apiEndpoint}/speech-recognition" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=@your-audio-file.mp3" \\
  -F "model=${speechTask.model}" \\
  -F "dtype=${speechTask.dtype}" \\
  -F "language=${speechTask.language}" \\
  -F "return_timestamps=${speechTask.includeTimestamps}" \\
  -F "stream=${speechTask.enableStreaming}"`;
      }

      case 'textToSpeech': {
        const ttsTask = task as TextToSpeechTask;
        let ttsCmd = `curl -X POST \\
  "${apiEndpoint}/text-to-speech" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=your text to synthesize" \\
  -F "model=${ttsTask.model}" \\
  -F "dtype=${ttsTask.dtype}" \\
  -F "provider=${ttsTask.provider}"`;
        if (ttsTask.provider === 'kokoro') {
          ttsCmd += ` \
  -F "voice=${ttsTask.voice}"`;
        }
        return ttsCmd;
      }

      case 'translation': {
        const translationTask = task as typeof taskStates.translation;
        return `curl -X POST \\
  "${apiEndpoint}/translation" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=your text to translate" \\
  -F "model=${translationTask.model}" \\
  -F "dtype=${translationTask.dtype}" \\
  -F "srcLang=${translationTask.srcLang}" \\
  -F "tgtLang=${translationTask.tgtLang}"`;
      }

      case 'textGeneration': {
        const textGenTask = task as typeof taskStates.textGeneration;
        let genCmd = `curl -X POST \\
  "${apiEndpoint}/text-generation" \\
  -H "Content-Type: multipart/form-data"`;

        if (textGenTask.provider !== 'transformers') {
          genCmd += ` \\
  -H "X-Provider: ${textGenTask.provider}"`;
        }

        genCmd += ` \\
  -F 'input=[{"role":"system","content":"You are a helpful assistant."},{"role":"user","content":"Your question here"}]' \\
  -F "model=${textGenTask.model}"`;

        if (textGenTask.provider === 'transformers') {
          genCmd += ` \\
  -F "dtype=${textGenTask.dtype}" \\
  -F "max_new_tokens=${textGenTask.maxTokens}" \\
  -F "do_sample=${textGenTask.doSample}"`;
        } else if (textGenTask.provider === 'mediapipe') {
          genCmd += ` \\
  -F "maxTokens=${textGenTask.maxTokens}" \\
  -F "stream=${textGenTask.enableStreaming}"`;
        } else if (textGenTask.provider === 'webllm') {
          genCmd += ` \\
  -F "stream=${textGenTask.enableStreaming}"`;
        }

        return genCmd;
      }

      case 'imageTextToText': {
        const visionTask = task as ImageTextToTextTask;
        return `curl -X POST \\
  "${apiEndpoint}/image-text-to-text" \\
  -H "Content-Type: multipart/form-data" \\
  -F 'input={"image":"base64data...","text":"What is in this image?"}' \\
  -F "model=${visionTask.model}" \\
  -F "dtype=${visionTask.dtype}" \\
  -F "max_new_tokens=${visionTask.maxTokens}" \\
  -F "do_sample=${visionTask.doSample}"`;
      }

      default:
        return '';
    }
  };

  const copyCurlToClipboard = (taskType: keyof TaskStates) => {
    navigator.clipboard.writeText(generateCurlCommand(taskType))
      .then(() => {
        setCopiedTaskType(taskType);
        if (copiedTimeoutRef.current !== null) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => {
          copiedTimeoutRef.current = null;
          setCopiedTaskType(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };

  return {
    taskStates,
    copiedTaskType,
    updateTaskState,
    startSpeechRecognition,
    startTextToSpeech,
    startTranslation,
    startTextGeneration,
    startImageTextToText,
    copyCurlToClipboard,
    formatElapsedTime
  };
}
