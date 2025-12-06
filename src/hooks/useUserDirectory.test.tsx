import { renderHook, waitFor, act } from '@testing-library/react';
import axios, { type AxiosResponse } from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserDirectory, type UserDirectoryEntry } from './useUserDirectory';

vi.mock('axios');

const mockAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as AxiosResponse<T>['config'],
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useUserDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and maps users when enabled', async () => {
    const users: UserDirectoryEntry[] = [
      { _id: 'user-1', username: 'Ada', email: 'ada@example.com' },
      { _id: 'user-2', username: 'Alan' },
    ];
    vi.mocked(axios.get).mockResolvedValue(mockAxiosResponse(users));

    const { result } = renderHook(() => useUserDirectory(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.usersById).toEqual({
      'user-1': users[0],
      'user-2': users[1],
    });
    expect(result.current.error).toBeNull();
  });

  it('returns an error message when the request fails', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserDirectory(true));

    await waitFor(() => {
      expect(result.current.error).toBe('Unable to load users directory.');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.usersById).toEqual({});
  });

  it('skips fetching when disabled', () => {
    const { result } = renderHook(() => useUserDirectory(false));

    expect(result.current.usersById).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('avoids state updates after unmount', async () => {
    const deferred = createDeferred<AxiosResponse<UserDirectoryEntry[]>>();
    vi.mocked(axios.get).mockReturnValue(deferred.promise);

    const { result, unmount } = renderHook(() => useUserDirectory(true));

    expect(result.current.isLoading).toBe(true);
    expect(axios.get).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      deferred.resolve(mockAxiosResponse([{ _id: 'user-3', username: 'Grace' }]));
      await deferred.promise;
    });

    expect(result.current.usersById).toEqual({});
    expect(result.current.isLoading).toBe(true);
  });
});
