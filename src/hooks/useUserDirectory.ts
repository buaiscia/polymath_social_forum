import { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';

export interface UserDirectoryEntry {
  _id: string;
  username: string;
  email?: string;
}

interface UseUserDirectoryResult {
  usersById: Record<string, UserDirectoryEntry>;
  isLoading: boolean;
  error: string | null;
}

export const useUserDirectory = (enabled: boolean): UseUserDirectoryResult => {
  const [usersById, setUsersById] = useState<Record<string, UserDirectoryEntry>>({});
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUsersById({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get<UserDirectoryEntry[]>('/users');
        if (!cancelled) {
          const map = data.reduce<Record<string, UserDirectoryEntry>>((acc, user) => {
            acc[user._id] = user;
            return acc;
          }, {});
          setUsersById(map);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = isAxiosError(err)
            ? err.response?.data?.message || 'Unable to load users directory.'
            : 'Unable to load users directory.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { usersById, isLoading, error };
};

export default useUserDirectory;
