/**
 * Aplicação de demonstração para o pacote browser-node
 * Converte arquivos de áudio em texto usando o worker de speech-to-text
 */
import Woolball from '../dist/woolball.js';


// Elementos da interface
const audioFileInput = document.getElementById('audioFile');
const convertBtn = document.getElementById('convertBtn');
const statusElement = document.getElementById('status');
const resultElement = document.getElementById('result');


// Converter o arquivo de áudio para base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Inicializar os eventos da interface
async function initEvents() {
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
      statusElement.textContent = 'Convertendo áudio para texto...';
      resultElement.textContent = 'Processando...';
      
      const base64Audio = await fileToBase64(file);
      const INPUT = {
        key: "speech-to-text",
        value: JSON.stringify({
          id: Date.now().toString(),
          input: base64Audio,
          model: "onnx-community/whisper-large-v3-turbo_timestamped",
          dtype: "q8",
          language: "en",
        })
      }
      const woolball = new Woolball.default();
      const result = await woolball.processEvent(INPUT);
      
      // Processar o resultado
      resultElement.textContent = JSON.stringify(result, null, 2);
      statusElement.textContent = 'Conversão concluída!';
      convertBtn.disabled = false; // Habilita o botão após a conclusão
    } catch (error) {
      statusElement.textContent = `Erro: ${error.message}`;
      console.error('Error processing audio:', error);
      convertBtn.disabled = false; // Habilita o botão após erro
    }
  });
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', function() {
  initEvents();
});