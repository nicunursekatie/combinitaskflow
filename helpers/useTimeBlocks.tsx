import { useState, useEffect, useCallback } from 'react';
import type { z } from 'zod';
import {
  schema as getTimeBlocksSchema,
  getTimeBlocks,
} from '../endpoints/timeBlocks_GET.schema';
import type { TimeBlock as RemoteTimeBlock } from '../endpoints/timeBlocks_GET.schema';
import {
  schema as postTimeBlockSchema,
  postTimeBlock,
} from '../endpoints/timeBlocks_POST.schema';

export type TimeBlock = RemoteTimeBlock;
export type FetchParams = z.infer<typeof getTimeBlocksSchema>;

export const useTimeBlocks = () => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeBlocks = useCallback(
    async (params?: FetchParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const blocks = await getTimeBlocks(params);
        setTimeBlocks(blocks);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch time blocks');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createTimeBlock = useCallback(
    async (data: z.infer<typeof postTimeBlockSchema>) => {
      setIsLoading(true);
      setError(null);
      try {
        const body = { ...data, taskId: data.taskId ?? undefined };
        const newBlock = await postTimeBlock(body);
        setTimeBlocks((prev) => [...prev, newBlock]);
        return newBlock;
      } catch (err: any) {
        setError(err.message || 'Failed to create time block');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateTimeBlock = useCallback(
    async (data: TimeBlock) => {
      setIsLoading(true);
      setError(null);
      try {
        const body = {
          id: data.id,
          title: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          date: data.date,
          taskId: data.taskId ?? undefined,
        };
        const updated = await postTimeBlock(body);
        setTimeBlocks((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b))
        );
        return updated;
      } catch (err: any) {
        setError(err.message || 'Failed to update time block');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTimeBlock = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/_api/timeBlocks/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete time block');
        }
        setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
      } catch (err: any) {
        setError(err.message || 'Failed to delete time block');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // auto-fetch on mount
  useEffect(() => {
    fetchTimeBlocks();
  }, [fetchTimeBlocks]);

  return {
    timeBlocks,
    isLoading,
    error,
    fetchTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
  };
};