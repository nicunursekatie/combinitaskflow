import React, { useState, useEffect } from 'react';
import { Calendar } from './Calendar';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './Select';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './Dialog';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './Popover';
import { TaskEnergyEditor } from './TaskEnergyEditor';
import { CalendarIcon, X } from 'lucide-react';
import { Task, Project, Category } from '../helpers/TaskStorage';
import styles from './QuickTaskDialog.module.css';

interface QuickTaskDialogProps {
  task?: Partial<Task>;
  projects: Project[];
  categories: Category[];
  onSave: (task: Partial<Task>) => void;
  onCancel?: () => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const QuickTaskDialog = ({
  task = {
    title: '',
    completed: false,
    energyLevel: 'medium',
    activationEnergy: 'medium'
  },
  projects,
  categories,
  onSave,
  onCancel,
  open,
  defaultOpen,
  onOpenChange,
  className = ''
}: QuickTaskDialogProps) => {
  const [taskData, setTaskData] = useState<Partial<Task>>(task);
  const [date, setDate] = useState<Date | undefined>(task.dueDate);

  // Reset form when task prop changes
  useEffect(() => {
    setTaskData(task);
    setDate(task.dueDate);
  }, [task.id, task.title, task.dueDate, task.projectId, task.categoryId, task.energyLevel, task.activationEnergy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...taskData, dueDate: date });
  };

  const handleChange = (field: keyof Task, value: any) => {
    setTaskData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskEnergyChange = (updates: Partial<Task>) => {
    setTaskData(prev => ({ ...prev, ...updates }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave({ ...taskData, dueDate: date });
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${styles.dialogContent} ${className}`}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              value={taskData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <Label htmlFor="task-date">Due Date</Label>
              <div className={styles.dateSelectionWrapper}>
                <div className={styles.dateButtonsGroup}>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      today.setHours(12, 0, 0, 0);
                      setDate(today);
                    }}
                  >
                    Today
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(12, 0, 0, 0);
                      setDate(tomorrow);
                    }}
                  >
                    Tomorrow
                  </Button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      id="task-date"
                      variant="outline" 
                      className={styles.dateButton}
                      type="button"
                    >
                      <CalendarIcon size={16} />
                      <span>{formatDate(date)}</span>
                      {date && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon-sm" 
                          className={styles.clearDateButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDate(undefined);
                          }}
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <Label htmlFor="task-project">Project</Label>
              <Select 
                value={taskData.projectId} 
                onValueChange={(value) => handleChange('projectId', value)}
              >
                <SelectTrigger id="task-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={styles.formGroup}>
              <Label htmlFor="task-category">Category</Label>
              <Select 
                value={taskData.categoryId} 
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger id="task-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className={styles.categoryOption}>
                        <span 
                          className={styles.categoryColor} 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TaskEnergyEditor 
            task={taskData as Task} 
            onChange={handleTaskEnergyChange}
            className={styles.energyEditor}
          />
        </form>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              if (onCancel) onCancel();
              if (onOpenChange) onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onSave({ ...taskData, dueDate: date });
              if (onOpenChange) onOpenChange(false);
            }}
          >
            Save Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};