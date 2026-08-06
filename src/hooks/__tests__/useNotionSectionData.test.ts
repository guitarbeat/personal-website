import { renderHook } from '@testing-library/react';
import { useNotionSectionData } from '../useNotionSectionData';
import { useNotion } from '../../contexts/NotionContext';
import type { NotionData } from '../../types/content';

// Mock the NotionContext
jest.mock('../../contexts/NotionContext', () => ({
  useNotion: jest.fn(),
}));

describe('useNotionSectionData', () => {
  const mockContextDb = {
    work: [],
    projects: [],
  } as unknown as Partial<NotionData>;

  const mockPropsDb = {
    work: [{ id: '1', properties: {} }],
  } as unknown as Partial<NotionData>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use context data when propsDb is undefined', () => {
    (useNotion as jest.Mock).mockReturnValue({
      db: mockContextDb,
      loading: true,
    });

    const { result } = renderHook(() => useNotionSectionData());

    expect(result.current.db).toBe(mockContextDb);
    expect(result.current.isLoading).toBe(true);
  });

  it('should use context data and not be loading when context loading is false', () => {
    (useNotion as jest.Mock).mockReturnValue({
      db: mockContextDb,
      loading: false,
    });

    const { result } = renderHook(() => useNotionSectionData());

    expect(result.current.db).toBe(mockContextDb);
    expect(result.current.isLoading).toBe(false);
  });

  it('should use propsDb when provided and set isLoading to false even if context is loading', () => {
    (useNotion as jest.Mock).mockReturnValue({
      db: mockContextDb,
      loading: true,
    });

    const { result } = renderHook(() => useNotionSectionData(mockPropsDb));

    expect(result.current.db).toBe(mockPropsDb);
    expect(result.current.isLoading).toBe(false);
  });

  it('should use propsDb when provided and context is not loading', () => {
    (useNotion as jest.Mock).mockReturnValue({
      db: mockContextDb,
      loading: false,
    });

    const { result } = renderHook(() => useNotionSectionData(mockPropsDb));

    expect(result.current.db).toBe(mockPropsDb);
    expect(result.current.isLoading).toBe(false);
  });
});
