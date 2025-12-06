import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import type { ChannelSummary } from '../components/ChannelCard';

interface UseMyChannelsResult {
  createdChannels: ChannelSummary[];
  participatedChannels: ChannelSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMyChannels = (enabled = true): UseMyChannelsResult => {
  const [createdChannels, setCreatedChannels] = useState<ChannelSummary[]>([]);
  const [participatedChannels, setParticipatedChannels] = useState<ChannelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchChannels = useCallback(async () => {
    if (!enabled) {
      if (!isMountedRef.current) return;
      setCreatedChannels([]);
      setParticipatedChannels([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
      }
      const [createdResponse, participatedResponse] = await Promise.all([
        axios.get<ChannelSummary[]>('/channels/mine'),
        axios.get<ChannelSummary[]>('/channels/participated'),
      ]);
      if (!isMountedRef.current) return;
      setCreatedChannels(createdResponse.data);
      setParticipatedChannels(participatedResponse.data);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Unable to load your channels right now.'
        : 'Unable to load your channels right now.';
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    createdChannels,
    participatedChannels,
    isLoading,
    error,
    refetch: fetchChannels,
  };
};

export default useMyChannels;
