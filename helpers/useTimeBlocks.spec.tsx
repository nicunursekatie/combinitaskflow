import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useTimeBlocks, TimeBlock } from './useTimeBlocks';
import * as getApi from '../endpoints/timeBlocks_GET.schema';
import * as postApi from '../endpoints/timeBlocks_POST.schema';

describe('useTimeBlocks', () => {
  it('fetches and sets time blocks on mount', async () => {
    const mockBlocks: TimeBlock[] = [
      {
        id: '1',
        title: 'Block1',
        startTime: '08:00',
        endTime: '09:00',
        date: '2023-01-01',
        taskId: null,
        task: null,
      },
    ];
    spyOn(getApi, 'getTimeBlocks').and.returnValue(Promise.resolve(mockBlocks));

    const TestComp = () => {
      const { isLoading, timeBlocks } = useTimeBlocks();
      if (isLoading) return <>Loading</>;
      return <div data-testid="ids">{timeBlocks.map((b) => b.id).join(',')}</div>;
    };

    render(<TestComp />);
    await waitFor(() => {
      if (!screen.queryByTestId('ids')) throw new Error('not loaded yet');
    });
    expect(screen.getByTestId('ids').textContent).toBe('1');
  });

  it('creates a new time block', async () => {
    spyOn(getApi, 'getTimeBlocks').and.returnValue(Promise.resolve([]));
    const newBlock: TimeBlock = {
      id: '2',
      title: 'NewBlock',
      startTime: '10:00',
      endTime: '11:00',
      date: '2023-01-02',
      taskId: null,
      task: null,
    };
    spyOn(postApi, 'postTimeBlock').and.returnValue(Promise.resolve(newBlock));

    const TestComp = () => {
      const { isLoading, timeBlocks, createTimeBlock } = useTimeBlocks();
      React.useEffect(() => {
        if (!isLoading) {
          createTimeBlock({
            title: newBlock.title,
            startTime: newBlock.startTime,
            endTime: newBlock.endTime,
            date: newBlock.date,
            taskId: newBlock.taskId ?? undefined,
          });
        }
      }, [isLoading]);
      return <div data-testid="ids">{timeBlocks.map((b) => b.id).join(',')}</div>;
    };

    render(<TestComp />);
    await waitFor(() => {
      const el = screen.getByTestId('ids');
      if (el.textContent !== '2') throw new Error('not created yet');
    });
    expect(screen.getByTestId('ids').textContent).toBe('2');
  });

  it('updates an existing time block', async () => {
    const orig: TimeBlock = {
      id: '1',
      title: 'Old',
      startTime: '08:00',
      endTime: '09:00',
      date: '2023-01-01',
      taskId: null,
      task: null,
    };
    const updated: TimeBlock = { ...orig, title: 'Updated' };
    spyOn(getApi, 'getTimeBlocks').and.returnValue(Promise.resolve([orig]));
    spyOn(postApi, 'postTimeBlock').and.returnValue(Promise.resolve(updated));

    const TestComp = () => {
      const { isLoading, timeBlocks, updateTimeBlock } = useTimeBlocks();
      React.useEffect(() => {
        if (!isLoading) {
          updateTimeBlock(updated);
        }
      }, [isLoading]);
      return <div data-testid="titles">{timeBlocks.map((b) => b.title).join(',')}</div>;
    };

    render(<TestComp />);
    await waitFor(() => {
      const el = screen.getByTestId('titles');
      if (el.textContent !== 'Updated') throw new Error('not updated yet');
    });
    expect(screen.getByTestId('titles').textContent).toBe('Updated');
  });

  it('deletes a time block', async () => {
    const block1: TimeBlock = {
      id: '1',
      title: 'A',
      startTime: '08:00',
      endTime: '09:00',
      date: '2023-01-01',
      taskId: null,
      task: null,
    };
    const block2: TimeBlock = {
      id: '2',
      title: 'B',
      startTime: '09:00',
      endTime: '10:00',
      date: '2023-01-01',
      taskId: null,
      task: null,
    };
    spyOn(getApi, 'getTimeBlocks').and.returnValue(Promise.resolve([block1, block2]));
    spyOn(global, 'fetch').and.callFake(() =>
      Promise.resolve({ ok: true, json: async () => ({}) } as Response)
    );

    const TestComp = () => {
      const { isLoading, timeBlocks, deleteTimeBlock } = useTimeBlocks();
      React.useEffect(() => {
        if (!isLoading) {
          deleteTimeBlock('1');
        }
      }, [isLoading]);
      return <div data-testid="ids">{timeBlocks.map((b) => b.id).join(',')}</div>;
    };

    render(<TestComp />);
    await waitFor(() => {
      const el = screen.getByTestId('ids');
      if (el.textContent !== '2') throw new Error('not deleted yet');
    });
    expect(screen.getByTestId('ids').textContent).toBe('2');
  });
});