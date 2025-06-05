import { TaskData, TaskResult } from '../types';

let musicRNN: any = null;
let musicVAE: any = null;

async function generateWithMusicRNN(sequence: any, steps: number = 64, temperature: number = 1.0): Promise<TaskResult> {
  const mm = await import('@magenta/music');
  
  if (!musicRNN) {
    musicRNN = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
    await musicRNN.initialize();
  }
  
  try {
    const result = await musicRNN.continueSequence(sequence, steps, temperature);
    
    const player = new mm.Player();
    
    return {
      generatedSequence: result,
      play: () => player.start(result),
      stop: () => player.stop(),
      midi: mm.sequenceProtoToMidi(result)
    };
  } catch (error) {
    throw error;
  }
}

async function generateWithMusicVAE(numOutputs: number = 1, temperature: number = 1.0, modelType: string = 'mel_4bar'): Promise<TaskResult> {
  const mm = await import('@magenta/music');
  
  if (!musicVAE) {
    musicVAE = new mm.MusicVAE(`https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/${modelType}`);
    await musicVAE.initialize();
  }
  
  try {
    const samples = await musicVAE.sample(numOutputs, temperature);
    
    const player = new mm.Player();
    
    return {
      generatedSequences: samples,
      play: (index: number = 0) => player.start(samples[index]),
      stop: () => player.stop(),
      midis: samples.map((sample: any) => mm.sequenceProtoToMidi(sample))
    };
  } catch (error) {
    throw error;
  }
}

export async function musicGeneration(data: TaskData): Promise<TaskResult> {
  const {
    input,
    model = 'music-rnn',
    temperature = 1.0,
    steps = 64,
    numOutputs = 1,
    modelType = 'mel_4bar',
    ...options
  } = data;
  
  try {
    const parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
    
    if (model === 'music-rnn') {
      return await generateWithMusicRNN(
        parsedInput.sequence,
        steps,
        temperature
      );
    } else if (model === 'music-vae') {
      return await generateWithMusicVAE(
        numOutputs,
        temperature,
        modelType
      );
    } else {
      throw new Error(`Modelo não suportado: ${model}. Use 'music-rnn' ou 'music-vae'.`);
    }
  } catch (error) {
    throw error;
  }
}