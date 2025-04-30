import React from 'react';
import { render } from '@testing-library/react';
import { Task } from './TaskStorage';
import { useTaskSuggester, TaskSuggestion, EnergyLevel, TimeAvailable } from './TaskSuggester';

interface TestProps {
  tasks: Task[];
  options: { timeAvailable: TimeAvailable; energyLevel: EnergyLevel; blockers: string[]; };
  onResult: (suggestions: TaskSuggestion[]) => void;
}

const TestComponent: React.FC<TestProps> = ({ tasks, options, onResult }) => {
  const suggestions = useTaskSuggester(tasks, options);
  // call onResult synchronously
  onResult(suggestions);
  return null;
};

describe('useTaskSuggester energy logic', () => {
  const base: Omit<Task, 'id' | 'title' | 'energyLevel' | 'activationEnergy'> = {
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tasks: Task[] = [
    {
      ...base,
      id: 't1',
      title: 'Easy Start',
      energyLevel: 'low',
      activationEnergy: 'low'
    },
    {
      ...base,
      id: 't2',
      title: 'Big Project',
      energyLevel: 'high',
      activationEnergy: 'high'
    },
    {
      ...base,
      id: 't3',
      title: 'Steady Work',
      energyLevel: 'medium',
      activationEnergy: 'medium'
    }
  ];

  it('prioritizes low activation & matching energy when energy is low', () => {
    let result: TaskSuggestion[] = [];
    render(
      <TestComponent
        tasks={tasks}
        options={{ timeAvailable: 'medium', energyLevel: 'low', blockers: [] }}
        onResult={s => { result = s; }}
      />
    );
    expect(result.length).toBe(3);
    // first should be the low-low task
    expect(result[0].task.id).toBe('t1');
    expect(result[0].reason).toContain('matches your current energy');
  });

  it('prioritizes high activation & matching energy when energy is high', () => {
    let result: TaskSuggestion[] = [];
    render(
      <TestComponent
        tasks={tasks}
        options={{ timeAvailable: 'medium', energyLevel: 'high', blockers: [] }}
        onResult={s => { result = s; }}
      />
    );
    expect(result.length).toBe(3);
    // first should be the high-high task
    expect(result[0].task.id).toBe('t2');
    expect(result[0].reason).toContain('matches your current energy');
  });
});