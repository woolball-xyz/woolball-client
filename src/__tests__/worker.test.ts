/**
 * Unit tests for the speech-to-text worker
 */

import { process } from '../models/speech-to-text/worker';
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

describe('Speech-to-text Worker', () => {
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
      id: '12345',
      input: 'base64AudioData',
      dtype: 'q8',
      model: 'test-model',
      language: 'en',
    };
    
    const mockEvent = {
      data: JSON.stringify(mockEventData),
    } as MessageEvent;

    // Act
    await process(mockEvent);

    // Assert
    expect(processAudio).toHaveBeenCalledWith('base64AudioData');
    expect(mockPostMessage).toHaveBeenCalled();
    
    // Verify the structure of the posted message
    const postedMessage = JSON.parse(mockPostMessage.mock.calls[0][0]);
    expect(postedMessage).toHaveProperty('id', '12345');
    expect(postedMessage).toHaveProperty('result');
    expect(postedMessage.result).toHaveProperty('text', 'mocked transcription result');
  });

  test('should handle errors and send error message', async () => {
    // Arrange
    const mockEventData = {
      id: '12345',
      input: 'base64AudioData',
      dtype: 'q8',
      model: 'test-model',
      language: 'en',
    };
    
    const mockEvent = {
      data: JSON.stringify(mockEventData),
    } as MessageEvent;

    // Mock processAudio to throw an error
    (processAudio as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    // Act
    await process(mockEvent);

    // Assert
    expect(mockPostMessage).toHaveBeenCalled();
    
    // Verify the error message structure
    const postedMessage = JSON.parse(mockPostMessage.mock.calls[0][0]);
    expect(postedMessage).toHaveProperty('id', '12345');
    expect(postedMessage).toHaveProperty('error');
  });

  test('should handle worker message event', () => {
    // Arrange
    const processSpy = jest.spyOn(require('../models/speech-to-text/worker'), 'process').mockImplementation(() => Promise.resolve());
    const mockEvent = { data: JSON.stringify({ id: '12345' }) } as MessageEvent;
    
    // Act
    self.onmessage!(mockEvent);
    
    // Assert
    expect(processSpy).toHaveBeenCalledWith(mockEvent);
    
    // Cleanup
    processSpy.mockRestore();
  });
});