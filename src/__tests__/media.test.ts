/**
 * Unit tests for the media utility functions
 */

import { processAudio } from '../utils/media';
import { WaveFile } from 'wavefile';

// Mock the wavefile library
jest.mock('wavefile', () => {
  const mockGetSamples = jest.fn();
  const mockFromBase64 = jest.fn();
  const mockToBitDepth = jest.fn();
  const mockToSampleRate = jest.fn();
  
  const MockWaveFile = jest.fn().mockImplementation(() => ({
    fromBase64: mockFromBase64,
    toBitDepth: mockToBitDepth,
    toSampleRate: mockToSampleRate,
    getSamples: mockGetSamples
  }));
  
  return {
    WaveFile: MockWaveFile,
    mockFromBase64,
    mockToBitDepth,
    mockToSampleRate,
    mockGetSamples
  };
});

// Get the mocks
const { mockFromBase64, mockToBitDepth, mockToSampleRate, mockGetSamples } = jest.requireMock('wavefile');

describe('Media Utilities', () => {
  let mockWaveFile: jest.Mocked<WaveFile>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockWaveFile = new WaveFile() as jest.Mocked<WaveFile>;
  });
  
  test('should process mono audio correctly', () => {
    // Arrange
    const mockSamples = new Float64Array([0.1, 0.2, 0.3]);
    mockGetSamples.mockReturnValue(mockSamples);
    
    // Act
    const result = processAudio('base64AudioData');
    
    // Assert
    expect(mockFromBase64).toHaveBeenCalledWith('base64AudioData');
    expect(mockToBitDepth).toHaveBeenCalledWith('32f');
    expect(mockToSampleRate).toHaveBeenCalledWith(16000);
    expect(result).toBe(mockSamples);
  });
  
  test('should process stereo audio correctly by averaging channels', () => {
    // Arrange
    const mockStereoSamples = [
      new Float64Array([0.1, 0.2, 0.3]), // Left channel
      new Float64Array([0.2, 0.3, 0.4])  // Right channel
    ];
    mockGetSamples.mockReturnValue(mockStereoSamples);
    
    // Act
    const result = processAudio('base64StereoAudioData');
    
    // Assert
    expect(mockFromBase64).toHaveBeenCalledWith('base64StereoAudioData');
    
    // Check if the result is a Float64Array
    expect(result).toBeInstanceOf(Float64Array);
    
    // Create a copy of the stereo samples for our expected calculation
    const expectedSamples = [
      new Float64Array([0.1, 0.2, 0.3]),
      new Float64Array([0.2, 0.3, 0.4])
    ];
    
    // Calculate expected values exactly as done in processAudio
    const SCALING_FACTOR = Math.sqrt(2);
    const expected = new Float64Array(3);
    for (let i = 0; i < 3; i++) {
      expected[i] = SCALING_FACTOR * (expectedSamples[0][i] + expectedSamples[1][i]) / 2;
    }
    
    // Compare the values
    expect(Array.from(result)).toEqual(Array.from(expected));
  });
});