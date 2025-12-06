import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import type { ChannelSummary } from '../components/ChannelCard';

interface UseMyChannelsResult {
  createdChannels: ChannelSummary[];
  participatedChannels: ChannelSummary[];
  isLoading: boolean;
  error: string | null;
  requiresReauth: boolean;
  refetch: () => Promise<void>;
}

export const useMyChannels = (enabled = true): UseMyChannelsResult => {
  const [createdChannels, setCreatedChannels] = useState<ChannelSummary[]>([]);
  const [participatedChannels, setParticipatedChannels] = useState<ChannelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [requiresReauth, setRequiresReauth] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchChannels = useCallback(async () => {
    if (!enabled) {
      setCreatedChannels([]);
      setParticipatedChannels([]);
      setIsLoading(false);
      setError(null);
      setRequiresReauth(false);
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
      setRequiresReauth(false);
    } catch (err) {
      if (!isMountedRef.current) return;
      const unauthorized = isAxiosError(err) && err.response?.status === 401;
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Unable to load your channels right now.'
        : 'Unable to load your channels right now.';
      setError(message);
      setRequiresReauth(unauthorized);
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
    requiresReauth,
    refetch: fetchChannels,
  };
};

export default useMyChannels;
