import React, { useMemo } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Unlink, FolderKanban, Calendar, Tag } from 'lucide-react';
import { Task, Project, Category } from '../helpers/TaskStorage';
import { Checkbox } from './Checkbox';
import { Button } from './Button';
import { Badge } from './Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './TimeBlockTaskList.module.css';

export interface TimeBlockTaskListProps {
  timeBlockId: string;
  tasks: Task[];
  projects?: Project[];
  categories?: Category[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskUnlink: (taskId: string, timeBlockId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const TimeBlockTaskList = ({
  timeBlockId,
  tasks,
  projects = [],
  categories = [],
  onTaskToggle,
  onTaskUnlink,
  isLoading = false,
  className = '',
}: TimeBlockTaskListProps) => {
  // Filter tasks that are linked to this time block
  const linkedTasks = useMemo(() => {
    return tasks.filter(task => task.timeBlockIds?.includes(timeBlockId));
  }, [tasks, timeBlockId]);

  // Format due date with appropriate label
  const formatDueDate = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  // Get CSS class for due date status
  const getDueDateClass = (date: Date): string => {
    if (isPast(date) && !isToday(date)) return styles.overdue;
    if (isToday(date)) return styles.today;
    if (isTomorrow(date)) return styles.tomorrow;
    return styles.upcoming;
  };

  // Handle task completion toggle
  const handleTaskToggle = (taskId: string, completed: boolean) => {
    onTaskToggle(taskId, completed);
  };

  // Handle unlinking a task from the time block
  const handleUnlink = (taskId: string) => {
    onTaskUnlink(taskId, timeBlockId);
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loading}>
          <LoadingSpinner size="md" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (linkedTasks.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyState}>
          <p>No tasks linked to this time block</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <h3 className={styles.title}>Linked Tasks</h3>
      <ul className={styles.taskList}>
        {linkedTasks.map(task => {
          const taskProject = projects.find(p => p.id === task.projectId);
          const taskCategory = categories.find(c => c.id === task.categoryId);

          return (
            <li key={task.id} className={styles.taskItem}>
              <div className={styles.taskMain}>
                <Checkbox 
                  checked={task.completed}
                  onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                  className={styles.checkbox}
                />
                
                <div className={styles.taskContent}>
                  <div className={`${styles.taskTitle} ${task.completed ? styles.completed : ''}`}>
                    {task.title}
                  </div>
                  
                  <div className={styles.taskMeta}>
                    {taskProject && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={styles.taskMetaItem}>
                              <FolderKanban size={14} />
                              <span className={styles.metaText}>{taskProject.title}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Project: {taskProject.title}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {taskCategory && (
                      <Badge 
                        className={styles.categoryBadge}
                        style={{ backgroundColor: taskCategory.color, color: 'white' }}
                      >
                        {taskCategory.title}
                      </Badge>
                    )}
                    
                    {task.dueDate && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`${styles.taskMetaItem} ${getDueDateClass(task.dueDate)}`}>
                              <Calendar size={14} />
                              <span className={styles.metaText}>{formatDueDate(task.dueDate)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Due: {format(task.dueDate, 'PPP')}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={() => handleUnlink(task.id)}
                      className={styles.unlinkButton}
                      aria-label="Unlink task"
                    >
                      <Unlink size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Unlink task from time block</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          );
        })}
      </ul>
    </div>
  );
};