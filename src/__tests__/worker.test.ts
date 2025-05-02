/**
 * Unit tests for the transformers-js worker
 */

import { process } from '../providers/transformers-js/worker';
import { processAudio } from '../utils/media';
import { setupWorkerMock, cleanupWorkerMock } from './mocks/worker-mock';

// Mock dependencies
jest.mock('../utils/media', () => ({
  processAudio: jest.fn().mockReturnValue(new Float64Array([0.1, 0.2, 0.3])),
}));

// Mock Hugging Face transformers
jest.mock('@huggingface/transformers', () => {
  const mockPipeline = jest.fn().mockImplementation(() => {
    return jest.fn().mockResolvedValue({ text: 'mocked transcription result' });
  });
  return {
    pipeline: mockPipeline,
  };
});

// Mock postMessage for worker environment
const mockPostMessage = jest.fn();

describe('Transformers-js Worker', () => {
  beforeAll(() => {
    // Setup worker mocks
    setupWorkerMock();
    // Override postMessage with our mock
    global.self.postMessage = mockPostMessage;
  });
  
  afterAll(() => {
    // Clean up worker mocks
    cleanupWorkerMock();
  });
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should process audio data and return transcription result', async () => {
    // Arrange
    const mockEventData = {
      input: 'base64AudioData',
      task: 'automatic-speech-recognition',
      dtype: 'q8',
      model: 'test-model',
      language: 'en',
    };
    
    const mockEvent = {
      data: mockEventData,
    } as MessageEvent;

    // Act
    await process(mockEvent);

    // Assert
    expect(processAudio).toHaveBeenCalledWith('base64AudioData');
    expect(mockPostMessage).toHaveBeenCalledWith({ text: 'mocked transcription result' });
  });

  test('should handle errors and send error message', async () => {
    // Arrange
    const mockEventData = {
      input: 'base64AudioData',
      task: 'invalid-task',
      dtype: 'q8',
      model: 'test-model',
      language: 'en',
    };
    
    const mockEvent = {
      data: mockEventData,
    } as MessageEvent;

    // Act
    await process(mockEvent);

    // Assert
    expect(mockPostMessage).toHaveBeenCalledWith({ error: 'invalid task' });
  });
});