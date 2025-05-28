import { useEffect, useRef, useState } from 'react';
import { WebSocketManager } from './WebSocketManager';
import './App.css';
import { API_URL } from './utils/env';

// Define specific types for each task category
interface SpeechRecognitionTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  language: string;
  includeTimestamps: boolean;
  enableStreaming: boolean;
}

interface TextToSpeechTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  voice: string;
  enableStreaming: boolean;
}

interface TranslationTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  srcLang: string;
  tgtLang: string;
}

interface TextGenerationTask {
  isProcessing: boolean;
  status: string;
  elapsedTime: number;
  model: string;
  dtype: string;
  provider: string;
  maxTokens: number;
  doSample: boolean;
  enableStreaming: boolean;
}

interface TaskStates {
  speechRecognition: SpeechRecognitionTask;
  textToSpeech: TextToSpeechTask;
  translation: TranslationTask;
  textGeneration: TextGenerationTask;
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connection, setConnection] = useState<'connected' | 'disconnected' | 'loading' | 'error'>('disconnected');
  const [running, setRunning] = useState(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [nodeCount, setNodeCount] = useState<number>(1);
  const [activeNodeCount, setActiveNodeCount] = useState<number>(0);
  const [displayedNodeCount, setDisplayedNodeCount] = useState<number>(0);
  const [isNodeCountChanging, setIsNodeCountChanging] = useState<boolean>(false);
  const [repoStars, setRepoStars] = useState<number | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Task categories and their processing states
  const [taskStates, setTaskStates] = useState<TaskStates>({
    speechRecognition: {
      isProcessing: false,
      status: '',
      elapsedTime: 0,
      model: 'onnx-community/whisper-small',
      dtype: 'q4',
      language: 'en',
      includeTimestamps: false,
      enableStreaming: true
    },
    textToSpeech: {
      isProcessing: false,
      status: '',
      elapsedTime: 0,
      model: 'Xenova/mms-tts-eng',
      dtype: 'q8',
      voice: 'af_heart',
      enableStreaming: false
    },
    translation: {
      isProcessing: false,
      status: '',
      elapsedTime: 0,
      model: 'Xenova/nllb-200-distilled-600M',
      dtype: 'q8',
      srcLang: 'eng_Latn',
      tgtLang: 'por_Latn'
    },
    textGeneration: {
      isProcessing: false,
      status: '',
      elapsedTime: 0,
      model: 'HuggingFaceTB/SmolLM2-135M-Instruct',
      dtype: 'fp16',
      provider: 'transformers',
      maxTokens: 250,
      doSample: false,
      enableStreaming: false
    }
  });

  // Timer references for each task
  const timerRefs = useRef({
    speechRecognition: null as number | null,
    textToSpeech: null as number | null,
    translation: null as number | null,
    textGeneration: null as number | null
  });

  // Node count debounce timer
  const nodeCountTimerRef = useRef<number | null>(null);

  // Model options for each task category
  const modelOptions = {
    speechRecognition: [
      { value: 'onnx-community/whisper-small', label: 'Whisper Small' },
      { value: 'onnx-community/whisper-base', label: 'Whisper Base' },
      { value: 'onnx-community/whisper-large-v3-turbo_timestamped', label: 'Whisper Large V3 Turbo' }
    ],
    textToSpeech: [
      // MMS Models (Multilingual)
      { value: 'Xenova/mms-tts-eng', label: 'English (MMS)' },
      { value: 'Xenova/mms-tts-spa', label: 'Spanish (MMS)' },
      { value: 'Xenova/mms-tts-por', label: 'Portuguese (MMS)' },
      { value: 'Xenova/mms-tts-fra', label: 'French (MMS)' },
      { value: 'Xenova/mms-tts-deu', label: 'German (MMS)' },
      { value: 'Xenova/mms-tts-rus', label: 'Russian (MMS)' },
      { value: 'Xenova/mms-tts-ara', label: 'Arabic (MMS)' },
      { value: 'Xenova/mms-tts-hin', label: 'Hindi (MMS)' },
      { value: 'Xenova/mms-tts-kor', label: 'Korean (MMS)' },
      { value: 'Xenova/mms-tts-vie', label: 'Vietnamese (MMS)' },
      { value: 'Xenova/mms-tts-ron', label: 'Romanian (MMS)' },
      { value: 'Xenova/mms-tts-yor', label: 'Yoruba (MMS)' },
      // Kokoro Models (High Quality)
      { value: 'onnx-community/Kokoro-82M-ONNX', label: 'Kokoro TTS' },
      { value: 'onnx-community/Kokoro-82M-v1.0-ONNX', label: 'Kokoro TTS v1.0' }
    ],
    translation: [
      { value: 'Xenova/nllb-200-distilled-600M', label: 'NLLB-200 Distilled 600M' }
    ],
    textGeneration: [
      // Transformers.js Models
      { value: 'HuggingFaceTB/SmolLM2-135M-Instruct', label: 'SmolLM2 135M (Transformers)', provider: 'transformers' },
      { value: 'HuggingFaceTB/SmolLM2-360M-Instruct', label: 'SmolLM2 360M (Transformers)', provider: 'transformers' },
      { value: 'Mozilla/Qwen2.5-0.5B-Instruct', label: 'Qwen2.5 0.5B (Transformers)', provider: 'transformers' },
      { value: 'onnx-community/Qwen2.5-Coder-0.5B-Instruct', label: 'Qwen2.5 Coder 0.5B (Transformers)', provider: 'transformers' },
      // WebLLM Models
      { value: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC', label: 'DeepSeek R1 Qwen 7B (WebLLM)', provider: 'webllm' },
      { value: 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC', label: 'DeepSeek R1 Llama 8B (WebLLM)', provider: 'webllm' },
      { value: 'SmolLM2-1.7B-Instruct-q4f32_1-MLC', label: 'SmolLM2 1.7B (WebLLM)', provider: 'webllm' },
      { value: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', label: 'Llama 3.1 8B (WebLLM)', provider: 'webllm' },
      { value: 'Qwen3-8B-q4f32_1-MLC', label: 'Qwen3 8B (WebLLM)', provider: 'webllm' },
      // MediaPipe Models
      { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma2-2b-it-cpu-int8.task', label: 'Gemma2 2B CPU (MediaPipe)', provider: 'mediapipe' },
      { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma2-2b-it-gpu-int8.bin', label: 'Gemma2 2B GPU (MediaPipe)', provider: 'mediapipe' },
      { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma3-1b-it-int4.task', label: 'Gemma3 1B (MediaPipe)', provider: 'mediapipe' },
      { value: 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma3-4b-it-int4-web.task', label: 'Gemma3 4B Web (MediaPipe)', provider: 'mediapipe' }
    ]
  };

  // Fixed URL for audio file
  const fixedAudioUrl = "https://ia600107.us.archive.org/1/items/whizbangv3n30_2503_librivox/whizbangv3n30_00_fawcett.mp3";
  
  // Fetch GitHub repository stars count
  useEffect(() => {
    async function fetchRepoStars() {
      try {
        const response = await fetch('https://api.github.com/repos/woolball-xyz/woolball-server');
        if (response.ok) {
          const data = await response.json();
          setRepoStars(data.stargazers_count);
        }
      } catch (error) {
        console.error('Error fetching repo stars:', error);
      }
    }
    
    fetchRepoStars();
    const interval = setInterval(fetchRepoStars, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(timerRef => {
        if (timerRef !== null) {
          clearInterval(timerRef);
        }
      });
      if (nodeCountTimerRef.current !== null) {
        clearTimeout(nodeCountTimerRef.current);
      }
    };
  }, []);

  // Handle smooth node count transitions with debounce
  useEffect(() => {
    // If this is the first update or we're not currently in a debounce period
    if (displayedNodeCount === 0 && activeNodeCount > 0) {
      // Show immediately for the first time
      setDisplayedNodeCount(activeNodeCount);
      return;
    }

    // If there's already a timer running, clear it (new event arrived)
    if (nodeCountTimerRef.current !== null) {
      clearTimeout(nodeCountTimerRef.current);
    }

    // Only apply debounce if the value actually changed
    if (activeNodeCount !== displayedNodeCount) {
      setIsNodeCountChanging(true);
      
      // Wait 1 second before updating to the latest value
      nodeCountTimerRef.current = window.setTimeout(() => {
        setDisplayedNodeCount(activeNodeCount);
        setIsNodeCountChanging(false);
      }, 1000);
    }

    return () => {
      if (nodeCountTimerRef.current !== null) {
        clearTimeout(nodeCountTimerRef.current);
      }
    };
  }, [activeNodeCount, displayedNodeCount]);

  useEffect(() => {
    if (running && containerRef.current) {
      containerRef.current.innerHTML = '';
      // WebSocketManager will listen for node_count: events and update activeNodeCount
      wsManagerRef.current = new WebSocketManager(
        containerRef.current, 
        setConnection, 
        setActiveNodeCount,
        nodeCount
      );
    }
    if (!running && wsManagerRef.current) {
      stopWebSocketManager();
    }
    
    return () => {
      if (wsManagerRef.current) {
        console.log('🧹 Cleaning up WebSocketManager');
        wsManagerRef.current.destroy();
        wsManagerRef.current = null;
      }
    };
  }, [running, nodeCount]);

  const stopWebSocketManager = () => {
    if (wsManagerRef.current) {
      console.log('📴 Stopping Woolball service');
      wsManagerRef.current.destroy();
      wsManagerRef.current = null;
    }
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    setConnection('disconnected');
    setActiveNodeCount(0);
    setDisplayedNodeCount(0);
    setIsNodeCountChanging(false);
  };

  const handleButton = () => {
    if (running) {
      console.log('🛑 Stopping Woolball service');
      stopWebSocketManager();
      setRunning(false);
    } else {
      console.log(`▶️ Starting Woolball service with ${nodeCount} node(s)`);
      setRunning(true);
    }
  };

  // Format elapsed time as seconds with one decimal place
  const formatElapsedTime = (ms: number): string => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  // Update task state helper
  const updateTaskState = <T extends keyof TaskStates>(
    taskType: T, 
    updates: Partial<TaskStates[T]>
  ) => {
    setTaskStates(prev => ({
      ...prev,
      [taskType]: { ...prev[taskType], ...updates }
    }));
  };

  // Start timer for a task
  const startTimer = (taskType: keyof TaskStates) => {
    const startTime = Date.now();
    timerRefs.current[taskType] = window.setInterval(() => {
      updateTaskState(taskType, { elapsedTime: Date.now() - startTime });
    }, 100);
  };

  // Stop timer for a task
  const stopTimer = (taskType: keyof TaskStates) => {
    if (timerRefs.current[taskType] !== null) {
      clearInterval(timerRefs.current[taskType]);
      timerRefs.current[taskType] = null;
    }
  };

  // Speech Recognition processing
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
    
    setTimeout(() => {
      updateTaskState(taskType, { status: 'Processing...' });
    }, 2000);
    
    try {
      console.log(`🎤 Fetching audio from fixed URL: ${fixedAudioUrl}`);
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

  const processAudioFile = async (file: File, task: SpeechRecognitionTask) => {
    const taskType = 'speechRecognition';
    
    try {
      console.log('🎤 Starting Speech Recognition process');
      console.log(`File: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);
      
      const formData = new FormData();
      formData.append('input', file);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      formData.append('language', 'en');
      formData.append('return_timestamps', 'true');
      formData.append('stream', 'true');

      console.log('📤 Sending request to API');

      const response = await fetch(API_URL + '/speech-recognition', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      console.log('✅ API response received, starting stream processing');
      updateTaskState(taskType, { status: 'Receiving data...' });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      let totalBytesReceived = 0;
      let chunkCounter = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('📝 Stream completed');
          updateTaskState(taskType, { 
            status: "Success, open DevTools to see results",
            isProcessing: false 
          });
          stopTimer(taskType);
          break;
        }
        
        chunkCounter++;
        if (value) {
          totalBytesReceived += value.length;
          updateTaskState(taskType, { status: `Receiving data: ${totalBytesReceived} bytes` });
        }
        
        const chunk = decoder.decode(value, {stream: true});
        console.log(`📦 Chunk #${chunkCounter} received: ${value?.length || 0} bytes`);
        
        if (chunk.trim()) {
          console.log(`🔽 Chunk content: ${chunk}`);
        }
      }
      
      console.log('🎉 Speech Recognition process completed successfully');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Speech Recognition process:', errorMessage);
      updateTaskState(taskType, { 
        status: `Error: ${errorMessage}`,
        isProcessing: false 
      });
      stopTimer(taskType);
    }
  };

  // Text to Speech processing
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
      console.log('🔊 Starting Text-to-Speech process');
      
      setTimeout(() => {
        updateTaskState(taskType, { status: 'Generating voice...' });
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      
      // Only include voice parameter if Kokoro is selected
      if (task.model.includes('Kokoro')) {
        formData.append('voice', task.voice);
      }
      
      console.log('📤 Sending TTS request');
      
      const response = await fetch(API_URL + '/text-to-speech', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ API response received, processing audio data');
      updateTaskState(taskType, { status: 'Processing audio data...' });
      
        const result = await response.json();
        
        if (Array.isArray(result)) {
          const audioItems = result.filter(item => item.audio);
          if (audioItems.length > 0) {
          const totalBytes = audioItems.reduce((total, item) => total + (item.audio ? item.audio.length : 0), 0);
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
      console.error('❌ Error in Text-to-Speech process:', errorMessage);
      updateTaskState(taskType, { 
        status: `Error: ${errorMessage}`,
        isProcessing: false 
      });
      stopTimer(taskType);
    }
  };

  // Translation processing
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
      console.log('🌐 Starting Translation process');
      
      setTimeout(() => {
        updateTaskState(taskType, { status: 'Translating...' });
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', task.model);
      formData.append('dtype', task.dtype);
      formData.append('srcLang', task.srcLang);
      formData.append('tgtLang', task.tgtLang);
      
      console.log('📤 Sending translation request');
      
      const response = await fetch(API_URL + '/translation', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ API response received, processing translation');
      
      const result = await response.json();
      
      if (result.translatedText) {
        console.log('🔤 Translation result:', result.translatedText);
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
      console.error('❌ Error in Translation process:', errorMessage);
      updateTaskState(taskType, { 
        status: `Error: ${errorMessage}`,
        isProcessing: false 
      });
      stopTimer(taskType);
    }
  };

  // Text Generation processing
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
      console.log('🤖 Starting Text Generation process');
      
      setTimeout(() => {
        updateTaskState(taskType, { status: 'Generating response...' });
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', JSON.stringify(messages));
      formData.append('model', task.model);
      
      // Add provider-specific parameters
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
      
      console.log('📤 Sending text generation request');
      
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
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ API response received, processing generated text');
      
      if (task.enableStreaming && (task.provider === 'webllm' || task.provider === 'mediapipe')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            console.log('Received chunk:', chunk);
          }
        }
      } else {
      const result = await response.json();
      
      if (result.generatedText) {
        console.log('📝 Generated text:', result.generatedText);
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
      console.error('❌ Error in Text Generation process:', errorMessage);
      updateTaskState(taskType, { 
        status: `Error: ${errorMessage}`,
        isProcessing: false 
      });
      stopTimer(taskType);
    }
  };

  // Generate cURL commands for each task
  const generateCurlCommand = (taskType: keyof TaskStates) => {
    const task = taskStates[taskType];
    const apiEndpoint = API_URL;
    
    switch (taskType) {
      case 'speechRecognition': {
        const speechTask = task as SpeechRecognitionTask;
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
  -F "dtype=${ttsTask.dtype}"`;
        if (ttsTask.model.includes('Kokoro')) {
          ttsCmd += ` \\
  -F "voice=${ttsTask.voice}"`;
        }
        return ttsCmd;
      }
  
      case 'translation': {
        const translationTask = task as TranslationTask;
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
        const textGenTask = task as TextGenerationTask;
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
        
      default:
        return '';
    }
  };

  // Copy cURL to clipboard
  const copyCurlToClipboard = (taskType: keyof TaskStates) => {
    navigator.clipboard.writeText(generateCurlCommand(taskType))
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };

  const statusText = {
    loading: 'Connecting to server... waiting for tasks',
    connected: `Connected to Woolball server`,
    disconnected: 'You are offline',
    error: 'Connection error'
  }[connection];

  // Render task card
  const renderTaskCard = (
    taskType: keyof TaskStates,
    title: string,
    onStart: () => void
  ) => {
    const task = taskStates[taskType];
    const models = modelOptions[taskType];

    return (
      <div className="http-test-card" key={taskType}>
        <div className="http-test-top-line">
          <div className="http-test-method">{title.toUpperCase()}</div>
          <span className="http-test-service-name">HTTP REQUEST</span>
        </div>
        
        <div className="task-controls-row">
          <select 
            value={task.model} 
            onChange={(e) => {
              const selectedModel = models.find(m => m.value === e.target.value);
              updateTaskState(taskType, { 
                model: e.target.value,
                ...(selectedModel && 'provider' in selectedModel ? { provider: selectedModel.provider } : {})
              });
            }}
            disabled={task.isProcessing}
            className="model-selector"
          >
            {models.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          
          <div className="card-actions">
            <button 
              className={`copy-curl-button ${copiedToClipboard ? 'copied' : ''}`}
              onClick={() => copyCurlToClipboard(taskType)}
              aria-label="Copy cURL command to clipboard"
            >
              <span className="copy-icon">
                {copiedToClipboard ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                  </svg>
                )}
              </span>
              <span className="tooltip">Copy cURL</span>
            </button>
            <button 
              className={`play-button ${task.isProcessing ? 'processing' : ''}`}
              onClick={onStart}
              aria-label="Run test"
              disabled={task.isProcessing}
            >
              <span className="play-icon">▶</span>
              <span className="tooltip">Run Test</span>
            </button>
          </div>
        </div>
       
        {task.isProcessing ? (
          <div className="processing-indicator">
            <span className="spinner"></span>
            {task.status}
            <span className="elapsed-time">{formatElapsedTime(task.elapsedTime)}</span>
          </div>
        ) : task.status?.includes("Success") ? (
          <div className="success-message">
            <span className="check-icon">✓</span>
            {task.status}
            <span className="elapsed-time">{formatElapsedTime(task.elapsedTime)}</span>
          </div>
        ) : task.status?.includes("Error") ? (
          <div className="error-message">
            <span className="error-icon">❌</span>
            {task.status}
            <span className="elapsed-time">{formatElapsedTime(task.elapsedTime)}</span>
          </div>
        ) : !running ? (
          <div className="waiting-message">
            <span className="info-icon">ℹ️</span>
            Press START to also be a node
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="main-bg central-layout">
      <header className="app-header">
        <span className={`logo-dot connection-${connection}`} title={statusText} />
        <h1 className="app-title">browser-based <span className="ai-gradient">AI</span> engine</h1>
        <button 
          onClick={() => setRightDrawerOpen(prev => !prev)}
          className="drawer-toggle"
          aria-label="Toggle right drawer"
        >
          ☰
        </button>
      </header>
      
      <div className="mobile-links">
        <a href="https://github.com/woolball-xyz/woolball-server" className="repo-link" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{marginRight: "4px"}}>
            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          <div style={{flex: 1}}>Woolball Server</div>
          {repoStars !== null && (
            <span className="stars-count">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
              </svg>
              {repoStars}
            </span>
          )}
        </a>
      </div>

      <div className={`central-content ${running ? 'running' : ''}`}>
        <div className="content-wrapper">
          <div className="main-content-area">
            {running ? (
              <div ref={containerRef} className="events-container">
              </div>
            ) : (
                <div className="config-section">
                  <div className="node-selector-container">
                    <h3 className="node-selector-title">Parallel Processing Nodes</h3>
                    <div className="node-controls">
                      <button 
                        className="node-control-btn" 
                        onClick={() => setNodeCount(prev => Math.max(1, prev - 1))}
                      >
                        -
                      </button>
                      <div className="node-count">
                        <span className="node-count-value">{nodeCount}</span>
                        <span className="node-count-label">node{nodeCount !== 1 ? 's' : ''}</span>
                      </div>
                      <button 
                        className="node-control-btn" 
                        onClick={() => setNodeCount(prev => Math.min(3, prev + 1))}
                      >
                        +
                      </button>
                    </div>
                    <div className="node-description">
                      Each node represents a separate instance running.
                      <span className="node-description-icon">🧶</span>
                    </div>
                  </div>
                </div>
            )}
          </div>
          
          <button
            className={`main-action-btn ${running ? 'stop' : 'start'}`}
            onClick={handleButton}
          >
            {running ? 'STOP' : 'START'}
          </button>
          
          <div className="status-main-text">
            <span className={`status-badge status-${connection} ${isNodeCountChanging ? 'node-count-changing' : ''}`}>
              {connection === 'connected' 
                ? `Connected to Woolball server${displayedNodeCount > 0 ? ` • ${displayedNodeCount} active node${displayedNodeCount !== 1 ? 's' : ''}` : ''}`
                : statusText}
            </span>
          </div>
        </div>

        <div className={`right-drawer ${rightDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-section">
            <h2 className="drawer-title">Links</h2>
            <div className="repo-links">
              <a href="https://github.com/woolball-xyz/woolball-server" className="repo-link" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{marginRight: "4px"}}>
                  <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                <div style={{flex: 1}}>Woolball Server</div>
                {repoStars !== null && (
                  <span className="stars-count">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
                    </svg>
                    {repoStars}
                  </span>
                )}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar with 4 main task categories */}
      <div className="fixed-bottom-bar">
        <div className="test-cards-container">
          {renderTaskCard('textGeneration', 'Text Generation', startTextGeneration)}
          {renderTaskCard('textToSpeech', 'Text to Speech', startTextToSpeech)}
          {renderTaskCard('speechRecognition', 'Speech Recognition', startSpeechRecognition)}
          {renderTaskCard('translation', 'Translation', startTranslation)}
        </div>
      </div>
    </div>
  );
}

export default App;