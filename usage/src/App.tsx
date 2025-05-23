import { useEffect, useRef, useState } from 'react';
import { WebSocketManager } from './WebSocketManager';
import './App.css';
import { WEBSOCKET_URL, API_URL } from './utils/env';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connection, setConnection] = useState<'connected' | 'disconnected' | 'loading' | 'error'>('disconnected');
  const [running, setRunning] = useState(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [fileError, setFileError] = useState<string>('');
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [nodeCount, setNodeCount] = useState<number>(1);
  const [repoStars, setRepoStars] = useState<number | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerIntervalRef = useRef<number | null>(null);

  // States for new AI tasks
  const [isTtsProcessing, setIsTtsProcessing] = useState(false);
  const [ttsStatus, setTtsStatus] = useState('');
  const [ttsElapsedTime, setTtsElapsedTime] = useState<number>(0);
  const ttsTimerRef = useRef<number | null>(null);
  
  const [isTranslationProcessing, setIsTranslationProcessing] = useState(false);
  const [translationStatus, setTranslationStatus] = useState('');
  const [translationElapsedTime, setTranslationElapsedTime] = useState<number>(0);
  const translationTimerRef = useRef<number | null>(null);
  
  const [isTextGenProcessing, setIsTextGenProcessing] = useState(false);
  const [textGenStatus, setTextGenStatus] = useState('');
  const [textGenElapsedTime, setTextGenElapsedTime] = useState<number>(0);
  const textGenTimerRef = useRef<number | null>(null);

  // States for Kokoro TTS
  const [isKokoroProcessing, setIsKokoroProcessing] = useState(false);
  const [kokoroStatus, setKokoroStatus] = useState('');
  const [kokoroElapsedTime, setKokoroElapsedTime] = useState<number>(0);
  const kokoroTimerRef = useRef<number | null>(null);

  // States for WebLLM
  const [isWebLLMProcessing, setIsWebLLMProcessing] = useState(false);
  const [webLLMStatus, setWebLLMStatus] = useState('');
  const [webLLMElapsedTime, setWebLLMElapsedTime] = useState<number>(0);
  const webLLMTimerRef = useRef<number | null>(null);

  // States for MediaPipe
  const [isMediaPipeProcessing, setIsMediaPipeProcessing] = useState(false);
  const [mediaPipeStatus, setMediaPipeStatus] = useState('');
  const [mediaPipeElapsedTime, setMediaPipeElapsedTime] = useState<number>(0);
  const mediaPipeTimerRef = useRef<number | null>(null);

  // Fixed URL for audio file
  const fixedAudioUrl = "https://ia600107.us.archive.org/1/items/whizbangv3n30_2503_librivox/whizbangv3n30_00_fawcett.mp3";
  
  // State for storing text blocks with colors
  const [textBlocks, setTextBlocks] = useState<Array<{text: string, color: string}>>([]);

  // Criar uma ref para o botão
  const testButtonRef = useRef<HTMLButtonElement>(null);
  
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
    
    // Set up an interval to refresh the star count periodically (every 5 minutes)
    const interval = setInterval(fetchRepoStars, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (ttsTimerRef.current !== null) {
        clearInterval(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
      if (translationTimerRef.current !== null) {
        clearInterval(translationTimerRef.current);
        translationTimerRef.current = null;
      }
      if (textGenTimerRef.current !== null) {
        clearInterval(textGenTimerRef.current);
        textGenTimerRef.current = null;
      }
      if (kokoroTimerRef.current !== null) {
        clearInterval(kokoroTimerRef.current);
        kokoroTimerRef.current = null;
      }
      if (webLLMTimerRef.current !== null) {
        clearInterval(webLLMTimerRef.current);
        webLLMTimerRef.current = null;
      }
      if (mediaPipeTimerRef.current !== null) {
        clearInterval(mediaPipeTimerRef.current);
        mediaPipeTimerRef.current = null;
      }
    };
  }, []);

  // Forcefully disable the button if there's no file
  useEffect(() => {
    if (testButtonRef.current) {
      if (!audioFile) {
        testButtonRef.current.setAttribute('disabled', 'true');
        testButtonRef.current.classList.add('disabled');
      } else if (!isProcessing) {
        testButtonRef.current.removeAttribute('disabled');
        testButtonRef.current.classList.remove('disabled');
      }
    }
  }, [audioFile, isProcessing]);

  // Function to pre-load the audio file
  const loadDefaultAudio = async () => {
    try {
      // Try to load a default audio file from the public folder
      const response = await fetch('/input.wav');
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'input.wav', { type: 'audio/wav' });
        setAudioFile(file);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Default audio file not found, waiting for manual selection');
      return false;
    }
  };

  useEffect(() => {
    // Try to load the default audio file on initialization
    loadDefaultAudio();
  }, []);

  useEffect(() => {
    if (running && containerRef.current) {
      containerRef.current.innerHTML = '';
      console.log(`🚀 Starting Woolball with ${nodeCount} node(s)`);
      console.log(`🔌 WebSocket URL from env: ${WEBSOCKET_URL}`);
      wsManagerRef.current = new WebSocketManager(containerRef.current, setConnection, nodeCount);
      
      console.log(`📊 Node count: ${nodeCount}`);
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

  // Adding a useEffect to monitor the audioFile state
  useEffect(() => {
    console.log("Audio file state changed:", audioFile ? audioFile.name : "null");
  }, [audioFile]);

  // Helper function to properly stop and clean up the WebSocketManager
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
  };

  const startProcessing = async () => {
    // Reset estados
    setIsProcessing(true);
    setFileError('');
    setProcessingStatus('Distributing tasks...');
    setElapsedTime(0);
    
    // Start the timer
    const startTime = Date.now();
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);
    
    // Inicia o fetch imediatamente em paralelo
    const fetchPromise = fetch(fixedAudioUrl);
    
    // Atualizações de estado em paralelo com o fetch
    console.log('Step 1: Distributing tasks...');
    
    // Atualiza para o segundo estado após um pequeno delay
    setTimeout(() => {
      console.log('Step 2: Processing...');
      setProcessingStatus('Processing...');
    }, 2000);
    
    // Continua com o processamento sem esperar pelos timeouts
    try {
      console.log(`🎤 Fetching audio from fixed URL: ${fixedAudioUrl}`);
      
      // Aguarda apenas o resultado do fetch que já foi iniciado
      const response = await fetchPromise;
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = fixedAudioUrl.split('/').pop() || 'audio-file.mp3';
      const file = new File([blob], fileName, { type: 'audio/mpeg' });
      
      setAudioFile(file);
      
      // Processar o arquivo
      await processAudioFile(file);
      
    } catch (error) {
      console.error('Error fetching file from URL:', error);
      setFileError(`Error fetching file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const processAudioFile = async (file: File) => {
    try {
      console.log('🎤 Starting Speech Recognition process');
      console.log(`File: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);
      
      // Reset text blocks
      setTextBlocks([]);
      
      const formData = new FormData();
      formData.append('input', file);
      formData.append('model', 'onnx-community/whisper-small');
      formData.append('dtype', 'q4');
      formData.append('language', 'en');
      formData.append('return_timestamps', 'false');
      formData.append('stream', 'true');

      console.log('📤 Sending request to API:', {
        model: 'onnx-community/whisper-small',
        dtype: 'q4',
        language: 'en',
        return_timestamps: false,
        stream: true
      });

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
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        console.error('❌ Failed to get response reader');
        throw new Error('Failed to get response reader');
      }
      
      console.log('Step 3: Receiving data...');
      
      let totalBytesReceived = 0;
      
      let chunkCounter = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('📝 Stream completed');
          setProcessingStatus("Completed: Success, open DevTools to see results");
          
          // Stop the timer when stream is complete
          if (timerIntervalRef.current !== null) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          break;
        }
        
        chunkCounter++;
        
        if (value) {
          totalBytesReceived += value.length;
          updateBytesDisplay(totalBytesReceived);
        }
        
        const chunk = decoder.decode(value, {stream: true});
        console.log(`📦 Chunk #${chunkCounter} received: ${value?.length || 0} bytes`);
        
        if (chunk.trim()) {
          console.log(`🔽 Chunk content: ${chunk}`);
        }
      }
      
      console.log('🎉 Speech Recognition process completed successfully');
      
      setProcessingStatus("Success, open DevTools to see results");
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Speech Recognition process:', errorMessage);
      setFileError(`Error: ${errorMessage}`);
      setTextBlocks([]);
      
      // Clear the timer interval on error
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  function updateBytesDisplay(bytes: number) {
    setProcessingStatus(`Receiving data: ${bytes} bytes`);
  }


  const statusText = {
    loading: 'Connecting to server... waiting for tasks',
    connected: `Connected to Woolball server`,
    disconnected: 'You are offline',
    error: 'Connection error'
  }[connection];

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

  // Function to generate cURL command
  const generateCurlCommand = () => {
    const apiEndpoint = API_URL + '/speech-recognition';
    return `curl -X POST \\
  "${apiEndpoint}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=@your-audio-file.mp3" \\
  -F "model=onnx-community/whisper-small" \\
  -F "dtype=q4" \\
  -F "language=en" \\
  -F "return_timestamps=false" \\
  -F "stream=true"`;
  };
  
  // Function to generate TTS cURL command
  const generateTtsCurlCommand = () => {
    const apiEndpoint = API_URL + '/text-to-speech';
    return `curl -X POST \\
  "${apiEndpoint}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=your text to synthesize" \\
  -F "model=Xenova/mms-tts-eng" \\
  -F "dtype=q8"`;
  };
  
  // Function to generate Translation cURL command
  const generateTranslationCurlCommand = () => {
    const apiEndpoint = API_URL + '/translation';
    return `curl -X POST \\
  "${apiEndpoint}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "input=your text to translate" \\
  -F "model=Xenova/nllb-200-distilled-600M" \\
  -F "dtype=q8" \\
  -F "srcLang=eng_Latn" \\
  -F "tgtLang=por_Latn"`;
  };
  
  // Function to generate Text Generation cURL command
  const generateTextGenCurlCommand = () => {
    const apiEndpoint = API_URL + '/text-generation';
    return `curl -X POST \\
  "${apiEndpoint}" \\
  -H "Content-Type: multipart/form-data" \\
  -F 'input=[{"role":"system","content":"You are a helpful assistant."},{"role":"user","content":"Your question here"}]' \\
  -F "model=HuggingFaceTB/SmolLM2-135M-Instruct" \\
  -F "dtype=fp16" \\
  -F "max_new_tokens=250" \\
  -F "do_sample=false"`;
  };

  // Function to copy cURL to clipboard
  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(generateCurlCommand())
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };
  
  // Function to copy TTS cURL to clipboard
  const copyTtsCurlToClipboard = () => {
    navigator.clipboard.writeText(generateTtsCurlCommand())
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };
  
  // Function to copy Translation cURL to clipboard
  const copyTranslationCurlToClipboard = () => {
    navigator.clipboard.writeText(generateTranslationCurlCommand())
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };
  
  // Function to copy Text Generation cURL to clipboard
  const copyTextGenCurlToClipboard = () => {
    navigator.clipboard.writeText(generateTextGenCurlCommand())
      .then(() => {
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };

  // Process text to speech
  const startTtsProcessing = async () => {
    // Reset states
    setIsTtsProcessing(true);
    setTtsStatus('Preparing voice synthesis...');
    setTtsElapsedTime(0);
    
    // Start the timer
    const startTime = Date.now();
    ttsTimerRef.current = window.setInterval(() => {
      setTtsElapsedTime(Date.now() - startTime);
    }, 100);
    
    // Fixed text for TTS
    const fixedText = "Hello, this is a test of the text to speech system. Running AI models directly in your browser is now possible.";
    
    try {
      console.log('🔊 Starting Text-to-Speech process');
      console.log(`Fixed text: "${fixedText}"`);
      
      // Update status for UI
      setTimeout(() => {
        console.log('Step 2: Generating voice...');
        setTtsStatus('Generating voice...');
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', 'Xenova/mms-tts-eng');
      formData.append('dtype', 'q8');
      
      console.log('📤 Sending TTS request:', {
        text: fixedText,
        model: 'Xenova/mms-tts-eng',
        dtype: 'q8'
      });
      
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
      setTtsStatus('Processing audio data...');
      
      try {
        const result = await response.json();
        
        // Verificar se a resposta é um array
        if (Array.isArray(result)) {
          const audioItems = result.filter(item => item.audio);
          
          if (audioItems.length > 0) {
            // Calcular o tamanho total dos dados de áudio
            const totalBytes = audioItems.reduce((total, item) => {
              return total + (item.audio ? item.audio.length : 0);
            }, 0);
            console.log(`Received audio data: ${totalBytes} bytes (${(totalBytes / 1024).toFixed(2)} KB)`);
            setTtsStatus("Success, open DevTools to see results");
          } else {
            throw new Error('Nenhum áudio encontrado na resposta da API');
          }
        } else if (result.audio) {
          const audioBytes = result.audio.length;
          console.log(`Received audio data: ${audioBytes} bytes (${(audioBytes / 1024).toFixed(2)} KB)`);
          setTtsStatus("Success, open DevTools to see results");
        } else if (result.error) {
          throw new Error(result.error);
        } else {
          throw new Error('Resposta da API não contém dados de áudio');
        }
      } catch (parseError: unknown) {
        throw new Error(`Erro ao processar resposta: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Clear the timer interval
      if (ttsTimerRef.current !== null) {
        clearInterval(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Text-to-Speech process:', errorMessage);
      setTtsStatus(`Error: ${errorMessage}`);
      
      // Clear the timer interval on error
      if (ttsTimerRef.current !== null) {
        clearInterval(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }
    } finally {
      setIsTtsProcessing(false);
    }
  };
  
  // Process text translation
  const startTranslationProcessing = async () => {
    // Reset states
    setIsTranslationProcessing(true);
    setTranslationStatus('Preparing translation...');
    setTranslationElapsedTime(0);
    
    // Start the timer
    const startTime = Date.now();
    translationTimerRef.current = window.setInterval(() => {
      setTranslationElapsedTime(Date.now() - startTime);
    }, 100);
    
    // Fixed text for translation
    const fixedText = "The quick brown fox jumps over the lazy dog. Machine learning has transformed how we process natural language.";
    
    try {
      console.log('🌐 Starting Translation process');
      console.log(`Text to translate: "${fixedText}"`);
      
      // Update status for UI
      setTimeout(() => {
        console.log('Step 2: Translating...');
        setTranslationStatus('Translating...');
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', 'Xenova/nllb-200-distilled-600M');
      formData.append('dtype', 'q8');
      formData.append('srcLang', 'eng_Latn');
      formData.append('tgtLang', 'por_Latn');
      
      console.log('📤 Sending translation request:', {
        text: fixedText,
        model: 'Xenova/nllb-200-distilled-600M',
        dtype: 'q8',
        srcLang: 'eng_Latn',
        tgtLang: 'por_Latn'
      });
      
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
        setTranslationStatus("Success, open DevTools to see results");
      } else if (result.error) {
        throw new Error(result.error);
      }
      
      // Clear the timer interval
      if (translationTimerRef.current !== null) {
        clearInterval(translationTimerRef.current);
        translationTimerRef.current = null;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Translation process:', errorMessage);
      setTranslationStatus(`Error: ${errorMessage}`);
      
      // Clear the timer interval on error
      if (translationTimerRef.current !== null) {
        clearInterval(translationTimerRef.current);
        translationTimerRef.current = null;
      }
    } finally {
      setIsTranslationProcessing(false);
    }
  };
  
  // Process text generation
  const startTextGenProcessing = async () => {
    // Reset states
    setIsTextGenProcessing(true);
    setTextGenStatus('Preparing AI model...');
    setTextGenElapsedTime(0);
    
    // Start the timer
    const startTime = Date.now();
    textGenTimerRef.current = window.setInterval(() => {
      setTextGenElapsedTime(Date.now() - startTime);
    }, 100);
    
    // Fixed messages for text generation
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is the capital of Brazil?" }
    ];
    
    try {
      console.log('🤖 Starting Text Generation process');
      console.log('Messages:', messages);
      
      // Update status for UI
      setTimeout(() => {
        console.log('Step 2: Generating response...');
        setTextGenStatus('Generating response...');
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', JSON.stringify(messages));
      formData.append('model', 'HuggingFaceTB/SmolLM2-135M-Instruct');
      formData.append('dtype', 'fp16');
      formData.append('max_new_tokens', '250');
      formData.append('do_sample', 'false');
      
      console.log('📤 Sending text generation request:', {
        messages,
        model: 'HuggingFaceTB/SmolLM2-135M-Instruct',
        dtype: 'fp16',
        max_new_tokens: 250,
        do_sample: false
      });
      
      const response = await fetch(API_URL + '/text-generation', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ API response received, processing generated text');
      
      const result = await response.json();
      
      if (result.generatedText) {
        console.log('📝 Generated text:', result.generatedText);
        setTextGenStatus("Success, open DevTools to see results");
      } else if (result.error) {
        throw new Error(result.error);
      }
      
      // Clear the timer interval
      if (textGenTimerRef.current !== null) {
        clearInterval(textGenTimerRef.current);
        textGenTimerRef.current = null;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Text Generation process:', errorMessage);
      setTextGenStatus(`Error: ${errorMessage}`);
      
      // Clear the timer interval on error
      if (textGenTimerRef.current !== null) {
        clearInterval(textGenTimerRef.current);
        textGenTimerRef.current = null;
      }
    } finally {
      setIsTextGenProcessing(false);
    }
  };

  // Process Kokoro TTS
  const startKokoroProcessing = async () => {
    setIsKokoroProcessing(true);
    setKokoroStatus('Preparing Kokoro TTS...');
    setKokoroElapsedTime(0);
    
    const startTime = Date.now();
    kokoroTimerRef.current = window.setInterval(() => {
      setKokoroElapsedTime(Date.now() - startTime);
    }, 100);
    
    const fixedText = "Hello, this is a test of the Kokoro text to speech system.";
    
    try {
      console.log('🎵 Starting Kokoro TTS process');
      
      setTimeout(() => {
        setKokoroStatus('Generating voice...');
      }, 1000);
      
      const formData = new FormData();
      formData.append('input', fixedText);
      formData.append('model', 'onnx-community/Kokoro-82M-ONNX');
      formData.append('dtype', 'q8');
      formData.append('voice', 'af_heart');
      
      const response = await fetch(API_URL + '/text-to-speech', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      setKokoroStatus("Success, open DevTools to see results");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in Kokoro TTS process:', errorMessage);
      setKokoroStatus(`Error: ${errorMessage}`);
    } finally {
      if (kokoroTimerRef.current !== null) {
        clearInterval(kokoroTimerRef.current);
        kokoroTimerRef.current = null;
      }
      setIsKokoroProcessing(false);
    }
  };

  // Process WebLLM Text Generation
  const startWebLLMProcessing = async () => {
    setIsWebLLMProcessing(true);
    setWebLLMStatus('Preparing WebLLM...');
    setWebLLMElapsedTime(0);
    
    const startTime = Date.now();
    webLLMTimerRef.current = window.setInterval(() => {
      setWebLLMElapsedTime(Date.now() - startTime);
    }, 100);
    
    try {
      console.log('🧠 Starting WebLLM process');
      
      setTimeout(() => {
        setWebLLMStatus('Generating response...');
      }, 1000);
      
      const messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is the capital of Brazil?" }
      ];
      
      const formData = new FormData();
      formData.append('input', JSON.stringify(messages));
      formData.append('model', 'SmolLM2-1.7B-Instruct-q4f32_1-MLC');
      formData.append('provider', 'webllm');
      formData.append('stream', 'false');
      
      const response = await fetch(API_URL + '/text-generation', {
        method: 'POST',
        headers: {
          'X-Provider': 'webllm'
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);
        }
      }
      
      setWebLLMStatus("Success, open DevTools to see results");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in WebLLM process:', errorMessage);
      setWebLLMStatus(`Error: ${errorMessage}`);
    } finally {
      if (webLLMTimerRef.current !== null) {
        clearInterval(webLLMTimerRef.current);
        webLLMTimerRef.current = null;
      }
      setIsWebLLMProcessing(false);
    }
  };

  // Process MediaPipe Text Generation
  const startMediaPipeProcessing = async () => {
    setIsMediaPipeProcessing(true);
    setMediaPipeStatus('Preparing MediaPipe...');
    setMediaPipeElapsedTime(0);
    
    const startTime = Date.now();
    mediaPipeTimerRef.current = window.setInterval(() => {
      setMediaPipeElapsedTime(Date.now() - startTime);
    }, 100);
    
    try {
      console.log('🤖 Starting MediaPipe process');
      
      setTimeout(() => {
        setMediaPipeStatus('Generating response...');
      }, 1000);
      
      const messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is the capital of Brazil?" }
      ];
      
      const formData = new FormData();
      formData.append('input', JSON.stringify(messages));
      formData.append('model', 'https://woolball.sfo3.cdn.digitaloceanspaces.com/gemma3-1b-it-int4.task');
      formData.append('provider', 'mediapipe');
      formData.append('maxTokens', '1000');
      formData.append('randomSeed', '101');
      formData.append('topK', '40');
      formData.append('temperature', '0.8');
      formData.append('stream', 'false');
      
      const response = await fetch(API_URL + '/text-generation', {
        method: 'POST',
        headers: {
          'X-Provider': 'mediapipe'
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);
        }
      }
      
      setMediaPipeStatus("Success, open DevTools to see results");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('❌ Error in MediaPipe process:', errorMessage);
      setMediaPipeStatus(`Error: ${errorMessage}`);
    } finally {
      if (mediaPipeTimerRef.current !== null) {
        clearInterval(mediaPipeTimerRef.current);
        mediaPipeTimerRef.current = null;
      }
      setIsMediaPipeProcessing(false);
    }
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
      
      {/* Mobile links positioned below header for consistent visibility */}
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
              // Show the configuration UI only when not running
              <>
                {/* Node selector section */}
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
              </>
            )}
          </div>
          
          <button
            className={`main-action-btn ${running ? 'stop' : 'start'}`}
            onClick={handleButton}
          >
            {running ? 'STOP' : 'START'}
          </button>
          
          <div className="status-main-text">
            <span className={`status-badge status-${connection}`}>
              {connection === 'connected' 
                ? `Connected to Woolball server with ${nodeCount} node${nodeCount !== 1 ? 's' : ''}` 
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

      {/* Fixed bottom bar replacing the left drawer */}
      <div className="fixed-bottom-bar">
        <div className="test-cards-container">
          {/* Speech Recognition Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">SPEECH TO TEXT</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">onnx-community/whisper-small</span>
              <div className="card-actions">
                <button 
                  className={`copy-curl-button ${copiedToClipboard ? 'copied' : ''}`}
                  onClick={copyCurlToClipboard}
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
                  className={`play-button ${isProcessing ? 'processing' : ''}`}
                  onClick={startProcessing}
                  aria-label="Run test with default audio file"
                  disabled={isProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {processingStatus}
                <span className="elapsed-time">{formatElapsedTime(elapsedTime)}</span>
              </div>
            ) : textBlocks.length > 0 || processingStatus?.includes("Success") ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {processingStatus}
                <span className="elapsed-time">{formatElapsedTime(elapsedTime)}</span>
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
            
            {fileError && <div className="file-error">{fileError}</div>}
          </div>
          
          {/* Text-to-Speech Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">TEXT TO SPEECH</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">Xenova/mms-tts-eng</span>
              <div className="card-actions">
                <button 
                  className={`copy-curl-button ${copiedToClipboard ? 'copied' : ''}`}
                  onClick={copyTtsCurlToClipboard}
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
                  className={`play-button ${isTtsProcessing ? 'processing' : ''}`}
                  onClick={startTtsProcessing}
                  aria-label="Run TTS test"
                  disabled={isTtsProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isTtsProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {ttsStatus ? ttsStatus : 'Processando...'}
                <span className="elapsed-time">{formatElapsedTime(ttsElapsedTime)}</span>
              </div>
            ) : ttsStatus ? (
              ttsStatus.includes("Success") ? (
                <div className="success-message">
                  <span className="check-icon">✓</span>
                  {ttsStatus}
                  <span className="elapsed-time">{formatElapsedTime(ttsElapsedTime)}</span>
                </div>
              ) : ttsStatus.includes("Error") ? (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {ttsStatus}
                  <span className="elapsed-time">{formatElapsedTime(ttsElapsedTime)}</span>
                </div>
              ) : (
                <div className="info-message">
                  <span className="info-icon">ℹ️</span>
                  {ttsStatus}
                  <span className="elapsed-time">{formatElapsedTime(ttsElapsedTime)}</span>
                </div>
              )
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
          </div>
          
          {/* Translation Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">TRANSLATION</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">Xenova/nllb-200-distilled-600M</span>
              <div className="card-actions">
                <button 
                  className={`copy-curl-button ${copiedToClipboard ? 'copied' : ''}`}
                  onClick={copyTranslationCurlToClipboard}
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
                  className={`play-button ${isTranslationProcessing ? 'processing' : ''}`}
                  onClick={startTranslationProcessing}
                  aria-label="Run translation test"
                  disabled={isTranslationProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isTranslationProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {translationStatus}
                <span className="elapsed-time">{formatElapsedTime(translationElapsedTime)}</span>
              </div>
            ) : translationStatus?.includes("Success") ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {translationStatus}
                <span className="elapsed-time">{formatElapsedTime(translationElapsedTime)}</span>
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
          </div>
          
          {/* Text Generation Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">TEXT GENERATION</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">HuggingFaceTB/SmolLM2-135M-Instruct</span>
              <div className="card-actions">
                <button 
                  className={`copy-curl-button ${copiedToClipboard ? 'copied' : ''}`}
                  onClick={copyTextGenCurlToClipboard}
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
                  className={`play-button ${isTextGenProcessing ? 'processing' : ''}`}
                  onClick={startTextGenProcessing}
                  aria-label="Run text generation test"
                  disabled={isTextGenProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isTextGenProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {textGenStatus}
                <span className="elapsed-time">{formatElapsedTime(textGenElapsedTime)}</span>
              </div>
            ) : textGenStatus?.includes("Success") ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {textGenStatus}
                <span className="elapsed-time">{formatElapsedTime(textGenElapsedTime)}</span>
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
          </div>

          {/* Kokoro TTS Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">KOKORO TTS</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">onnx-community/Kokoro-82M-ONNX</span>
              <div className="card-actions">
                <button 
                  className={`play-button ${isKokoroProcessing ? 'processing' : ''}`}
                  onClick={startKokoroProcessing}
                  aria-label="Run Kokoro TTS test"
                  disabled={isKokoroProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isKokoroProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {kokoroStatus}
                <span className="elapsed-time">{formatElapsedTime(kokoroElapsedTime)}</span>
              </div>
            ) : kokoroStatus?.includes("Success") ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {kokoroStatus}
                <span className="elapsed-time">{formatElapsedTime(kokoroElapsedTime)}</span>
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
          </div>

          {/* WebLLM Text Generation Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">WEBLLM</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">SmolLM2-1.7B-Instruct-q4f32_1-MLC</span>
              <div className="card-actions">
                <button 
                  className={`play-button ${isWebLLMProcessing ? 'processing' : ''}`}
                  onClick={startWebLLMProcessing}
                  aria-label="Run WebLLM test"
                  disabled={isWebLLMProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isWebLLMProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {webLLMStatus}
                <span className="elapsed-time">{formatElapsedTime(webLLMElapsedTime)}</span>
              </div>
            ) : webLLMStatus?.includes("Success") ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {webLLMStatus}
                <span className="elapsed-time">{formatElapsedTime(webLLMElapsedTime)}</span>
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
          </div>

          {/* MediaPipe Text Generation Test Card */}
          <div className="http-test-card">  
            <div className="http-test-top-line">
              <div className="http-test-method">MEDIAPIPE</div>
              <span className="http-test-service-name">HTTP REQUEST</span>
            </div>
            <div className="http-test-header">
              <span className="http-test-title">gemma3-1b-it-int4</span>
              <div className="card-actions">
                <button 
                  className={`play-button ${isMediaPipeProcessing ? 'processing' : ''}`}
                  onClick={startMediaPipeProcessing}
                  aria-label="Run MediaPipe test"
                  disabled={isMediaPipeProcessing}
                >
                  <span className="play-icon">▶</span>
                  <span className="tooltip">Run Test</span>
                </button>
              </div>
            </div>
           
            {isMediaPipeProcessing ? (
              <div className="processing-indicator">
                <span className="spinner"></span>
                {mediaPipeStatus}
                <span className="elapsed-time">{formatElapsedTime(mediaPipeElapsedTime)}</span>
              </div>
            ) : mediaPipeStatus?.includes("Success") ? (
              <div className="success-message">
                <span className="check-icon">✓</span>
                {mediaPipeStatus}
                <span className="elapsed-time">{formatElapsedTime(mediaPipeElapsedTime)}</span>
              </div>
            ) : !running ? (
              <div className="waiting-message">
                <span className="info-icon">ℹ️</span>
                Press START to also be a node
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;