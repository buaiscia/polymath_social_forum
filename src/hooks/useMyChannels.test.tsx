import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import axios, { type AxiosResponse } from 'axios';
import { useMyChannels } from './useMyChannels';
import type { ChannelSummary } from '../components/ChannelCard';

vi.mock('axios');

const mockAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as AxiosResponse<T>['config'],
});

describe('useMyChannels', () => {
  const createdChannels: ChannelSummary[] = [
    {
      _id: 'channel-1',
      title: 'Created One',
      description: 'desc',
      tags: [],
      memberCount: 10,
    },
  ];

  const participatedChannels: ChannelSummary[] = [
    {
      _id: 'channel-2',
      title: 'Participated One',
      description: 'desc2',
      tags: [],
      memberCount: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches created and participated channels successfully', async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/channels/mine') {
        return Promise.resolve(mockAxiosResponse(createdChannels));
      }
      return Promise.resolve(mockAxiosResponse(participatedChannels));
    });

    const { result } = renderHook(() => useMyChannels(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.createdChannels).toEqual(createdChannels);
    expect(result.current.participatedChannels).toEqual(participatedChannels);
    expect(result.current.error).toBeNull();
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMyChannels(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Unable to load your channels right now.');
    expect(result.current.createdChannels).toEqual([]);
    expect(result.current.participatedChannels).toEqual([]);
  });

  it('respects the enabled flag', () => {
    const { result } = renderHook(() => useMyChannels(false));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.createdChannels).toEqual([]);
    expect(result.current.participatedChannels).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('supports manual refetching', async () => {
    const apiSpy = vi
      .mocked(axios.get)
      .mockResolvedValueOnce(mockAxiosResponse(createdChannels))
      .mockResolvedValueOnce(mockAxiosResponse(participatedChannels))
      .mockResolvedValueOnce(mockAxiosResponse(createdChannels))
      .mockResolvedValueOnce(mockAxiosResponse(participatedChannels));

    const { result } = renderHook(() => useMyChannels(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      await result.current.refetch();
    });
    expect(apiSpy).toHaveBeenCalledTimes(4);
  });
});
