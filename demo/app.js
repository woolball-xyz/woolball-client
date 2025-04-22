/**
 * Aplicação de demonstração para o pacote browser-node
 * Converte arquivos de áudio em texto usando o worker de speech-to-text
 */
import Woolball from '../dist/woolball.js';

const API_URL = 'http://localhost:9002'

// Elementos da interface
const audioFileInput = document.getElementById('audioFile');
const convertBtn = document.getElementById('convertBtn');
const statusElement = document.getElementById('status');
const resultElement = document.getElementById('result');
const timestampCheckbox = document.getElementById('timestampCheckbox');
const streamCheckbox = document.getElementById('streamCheckbox');


// Inicializar os eventos da interface
async function initEvents() {
  // Inicializar o Woolball para receber os resultados via WebSocket
  const woolball = new Woolball.default();
    
  // Configurar um listener para receber os resultados do processamento via WebSocket
  woolball.wsConnection.addEventListener('message', (event) => {
    try {
      if(event.data === 'ping') {
        return;
      }
      const data = JSON.parse(event.data);
      if (data.type === 'speech-to-text-result') {
        if (streamCheckbox.checked) {
          resultElement.textContent += JSON.stringify(data.result, null, 2) + '\n';
        } else {
          resultElement.textContent = JSON.stringify(data.result, null, 2);
        }
        statusElement.textContent = 'Conversão concluída!';
        convertBtn.disabled = false; 
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do WebSocket:', error);
    }
  });

  // Tentar carregar o arquivo input.wav automaticamente
  try {
    const response = await fetch('/demo/input.wav');
    if (response.ok) {
      const blob = await response.blob();
      const file = new File([blob], 'input.wav', { type: 'audio/wav' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      audioFileInput.files = dataTransfer.files;
      convertBtn.disabled = false;
      statusElement.textContent = 'Arquivo input.wav carregado automaticamente';
    }
  } catch (error) {
    console.log('Arquivo input.wav não encontrado, aguardando seleção manual');
  }
  // Habilitar o botão quando um arquivo for selecionado
  audioFileInput.addEventListener('change', function() {
    convertBtn.disabled = !this.files.length; // Habilita o botão quando um arquivo for selecionado
    if (this.files.length) {
      statusElement.textContent = `Arquivo selecionado: ${this.files[0].name}`;
    } else {
      statusElement.textContent = 'Selecione um arquivo de áudio para começar.';
    }
  });
  
  // Processar o arquivo quando o botão for clicado
  convertBtn.addEventListener('click', async function() {
    if (!audioFileInput.files.length) return;
    
    try {
      const file = audioFileInput.files[0];
      convertBtn.disabled = true;
      statusElement.textContent = 'Enviando áudio para processamento...';
      resultElement.textContent = 'Processando...';
      
      // Criar um FormData para enviar o arquivo para a API
      const formData = new FormData();
      formData.append('input', file);
      formData.append('model', 'onnx-community/whisper-large-v3-turbo_timestamped');
      formData.append('dtype', 'q4');
      formData.append('language', 'pt');
      formData.append('return_timestamps', timestampCheckbox.checked ? 'true' : 'false');
      formData.append('stream', streamCheckbox.checked ? 'true' : 'false');
      
      // Enviar o arquivo para a API
      const response = await fetch(`${API_URL}/api/v1/speech-recognition`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      if (streamCheckbox.checked) {
        statusElement.textContent = 'Streaming results...';
        resultElement.textContent = '';



        await response.body
        .pipeThrough(new TextDecoderStream())
        .pipeTo(new WritableStream({
          write(chunk) {
            statusElement.textContent = 'Streaming results...';
            resultElement.textContent += chunk;
          },
        }))

        statusElement.textContent = 'Conversão concluída!';
        convertBtn.disabled = false;
        
      } else {
        const results = await response.json();
        statusElement.textContent = 'Sucesso...';
        resultElement.textContent = JSON.stringify(results);
        convertBtn.disabled = false;
      }
      
          } catch (error) {
      statusElement.textContent = `Erro: ${error.message}`;
      console.error('Error processing audio:', error);
      convertBtn.disabled = false; 
    }
  });
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', function() {
  initEvents();
});