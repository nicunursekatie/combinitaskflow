import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import styles from './CalendarTaskIndicator.module.css';
import type { Task } from '../helpers/TaskStorage';

interface CalendarTaskIndicatorProps {
  task: Task;
  view: 'month' | 'week' | 'day';
  onClick?: (taskId: string) => void;
}

export const CalendarTaskIndicator: React.FC<CalendarTaskIndicatorProps> = ({
  task,
  view,
  onClick
}) => {
  if (!task.dueDate) return null;

  const handleClick = () => {
    if (onClick) onClick(task.id);
  };

  return (
    <div 
      className={`${styles.taskIndicator} ${styles[view]}`}
      onClick={handleClick}
    >
      <div className={styles.taskTitle}>
        {task.title}
      </div>
      {view !== 'month' && (
        <div className={styles.taskDueDate}>
          <CalendarIcon size={12} />
          {format(task.dueDate, 'h:mm a')}
        </div>
      )}
    </div>
  );
};