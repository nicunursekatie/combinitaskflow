import { useMemo } from 'react';
import { Task } from './TaskStorage';
import { isToday, isPast, addHours } from 'date-fns';

export type EnergyLevel = 'high' | 'medium' | 'low';
export type TimeAvailable = 'short' | 'medium' | 'long';

export interface TaskSuggestion {
  task: Task;
  score: number;
  reason: string;
}

interface TaskSuggesterOptions {
  timeAvailable: TimeAvailable;
  energyLevel: EnergyLevel;
  blockers: string[];
}

// Convert time available to minutes (approximate)
const timeAvailableToMinutes = (timeAvailable: TimeAvailable): number => {
  switch (timeAvailable) {
    case 'short': return 30;
    case 'medium': return 90;
    case 'long': return 240;
    default: return 60;
  }
};

export const useTaskSuggester = (
  tasks: Task[],
  options: TaskSuggesterOptions
) => {
  const { timeAvailable, energyLevel, blockers } = options;

  // Flatten tasks including subtasks
  const flattenTasks = (tasks: Task[]): Task[] => {
    return tasks.reduce<Task[]>((acc, task) => {
      acc.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        acc.push(...flattenTasks(task.subtasks));
      }
      return acc;
    }, []);
  };

  // Get all incomplete tasks
  const incompleteTasks = useMemo(() => {
    const allTasks = flattenTasks(tasks);
    return allTasks.filter(task => !task.completed);
  }, [tasks]);

  // Score and sort tasks based on criteria
  const suggestedTasks = useMemo(() => {
    const timeInMinutes = timeAvailableToMinutes(timeAvailable);
    const now = new Date();
    const shortDeadline = addHours(now, 24); // Tasks due within 24 hours

    return incompleteTasks
      .map(task => {
        let score = 0;
        let reasons: string[] = [];

        // Overdue tasks get high priority
        if (task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate)) {
          score += 50;
          reasons.push('Task is overdue');
        }

        // Tasks due today get high priority
        if (task.dueDate && isToday(task.dueDate)) {
          score += 40;
          reasons.push('Task is due today');
        }

        // Tasks due soon get medium priority
        if (
          task.dueDate && 
          task.dueDate > now && 
          task.dueDate <= shortDeadline
        ) {
          score += 30;
          reasons.push('Task is due soon');
        }

        // Energy and activation energy considerations

        // Match task.energyLevel with user's energy
        if (task.energyLevel) {
          if (task.energyLevel === energyLevel) {
            score += 20;
            reasons.push(
              `Task requires ${task.energyLevel} energy which matches your current energy`
            );
          } else {
            const levels: EnergyLevel[] = ['low', 'medium', 'high'];
            const taskIdx = levels.indexOf(task.energyLevel);
            const userIdx = levels.indexOf(energyLevel);
            if (taskIdx > userIdx) {
              score -= 10;
              reasons.push(
                `Task requires ${task.energyLevel} energy which may be too demanding`
              );
            } else {
              score += 5;
              reasons.push(
                `Task requires ${task.energyLevel} energy which is below your current level`
              );
            }
          }
        }

        // Consider activationEnergy relative to user's energy
        if (task.activationEnergy) {
          if (energyLevel === 'low') {
            if (task.activationEnergy === 'low') {
              score += 20;
              reasons.push(
                'Low activation energy makes it easier to start with your current low energy'
              );
            } else {
              score -= 10;
              reasons.push(
                `Task activation energy (${task.activationEnergy}) may be too high for your current low energy`
              );
            }
          } else if (energyLevel === 'medium') {
            if (task.activationEnergy === 'medium') {
              score += 15;
              reasons.push('Medium activation energy fits your current energy');
            }
          } else if (energyLevel === 'high') {
            if (task.activationEnergy === 'high') {
              score += 20;
              reasons.push('High activation energy tasks are suitable for your high energy');
            }
          }
        }

        // Check for blockers
        const taskLowerCase = task.title.toLowerCase();
        const hasBlocker = blockers.some(blocker => 
          taskLowerCase.includes(blocker.toLowerCase())
        );
        
        if (hasBlocker) {
          score -= 30;
          reasons.push('This task may be blocked');
        }

        // Adjust score based on parent/child relationships
        if (task.parentTaskId) {
          // Check if parent task is completed
          const parentTask = incompleteTasks.find(t => t.id === task.parentTaskId);
          if (parentTask && !parentTask.completed) {
            score -= 10;
            reasons.push('Parent task is not completed yet');
          }
        }

        return {
          task,
          score,
          reason: reasons.length > 0 ? reasons[0] : 'Available task'
        } as TaskSuggestion;
      })
      .sort((a, b) => b.score - a.score);
  }, [incompleteTasks, timeAvailable, energyLevel, blockers]);

  return suggestedTasks;
};

// Wizard state management
export interface WizardState {
  step: number;
  timeAvailable: TimeAvailable | null;
  energyLevel: EnergyLevel | null;
  blockers: string[];
}

export const initialWizardState: WizardState = {
  step: 1,
  timeAvailable: null,
  energyLevel: null,
  blockers: [],
};

export const isWizardComplete = (state: WizardState): boolean => {
  return (
    state.step > 3 &&
    state.timeAvailable !== null &&
    state.energyLevel !== null
  );
};