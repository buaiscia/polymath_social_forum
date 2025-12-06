import { useCallback, useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    if (!enabled) {
      setCreatedChannels([]);
      setParticipatedChannels([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      const [createdResponse, participatedResponse] = await Promise.all([
        axios.get<ChannelSummary[]>('/channels/mine'),
        axios.get<ChannelSummary[]>('/channels/participated'),
      ]);
      setCreatedChannels(createdResponse.data);
      setParticipatedChannels(participatedResponse.data);
      setError(null);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Unable to load your channels right now.'
        : 'Unable to load your channels right now.';
      setError(message);
    } finally {
      setIsLoading(false);
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
