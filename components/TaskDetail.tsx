"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Tag, 
  FolderKanban, 
  Trash2, 
  Plus,
  Check,
  X
} from 'lucide-react';
import { TaskEnergyEditor } from './TaskEnergyEditor';
import styles from './TaskDetail.module.css';
import { Task, Project, Category } from '../helpers/TaskStorage';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Badge } from './Badge';
import { Separator } from './Separator';

interface TaskDetailProps {
  task: Task | null;
  projects: Project[];
  categories: Category[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentId: string, subtask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose?: () => void;
  className?: string;
}

export const TaskDetail = ({
  task,
  projects,
  categories,
  onSave,
  onDelete,
  onAddSubtask,
  onClose,
  className = '',
}: TaskDetailProps) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Initialize form when task changes
  useEffect(() => {
    setEditedTask(task ? { ...task } : null);
  }, [task]);

  if (!editedTask) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyState}>
          <p>Select a task to view details</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditedTask(prev => {
      if (!prev) return null;
      return { ...prev, [name]: checked };
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEditedTask(prev => {
      if (!prev) return null;
      // Create date at noon to avoid timezone issues
      const date = value ? new Date(`${value}T12:00:00`) : undefined;
      return { ...prev, dueDate: date };
    });
  };

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
    }
  };

  const handleDelete = () => {
    if (editedTask) {
      onDelete(editedTask.id);
      if (onClose) onClose();
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !editedTask) return;

    onAddSubtask(editedTask.id, {
      title: newSubtaskTitle,
      completed: false,
      parentTaskId: editedTask.id,
      projectId: editedTask.projectId,
      categoryId: editedTask.categoryId,
    });

    setNewSubtaskTitle('');
  };

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    if (!editedTask || !editedTask.subtasks) return;

    const updatedSubtasks = editedTask.subtasks.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, completed } : subtask
    );

    setEditedTask({
      ...editedTask,
      subtasks: updatedSubtasks
    });
  };

  // Find the category for the current task
  const taskCategory = categories.find(cat => cat.id === editedTask.categoryId);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Task Details</h2>
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        )}
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <div className={styles.formRow}>
            <Checkbox 
              id="completed" 
              name="completed"
              checked={editedTask.completed} 
              onChange={handleCheckboxChange} 
            />
            <Input
              name="title"
              value={editedTask.title}
              onChange={handleChange}
              placeholder="Task title"
              className={styles.titleInput}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <Textarea
            name="description"
            value={editedTask.description || ''}
            onChange={handleChange}
            placeholder="Add description..."
            className={styles.description}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <CalendarIcon size={16} className={styles.labelIcon} />
              Due Date
            </label>
            <Input
              type="date"
              name="dueDate"
              value={editedTask.dueDate ? format(editedTask.dueDate, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FolderKanban size={16} className={styles.labelIcon} />
              Project
            </label>
            <select
              name="projectId"
              value={editedTask.projectId || ''}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Tag size={16} className={styles.labelIcon} />
              Category
            </label>
            <select
              name="categoryId"
              value={editedTask.categoryId || ''}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">No Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {taskCategory && (
          <div className={styles.categoryBadge}>
            <Badge 
              style={{ backgroundColor: taskCategory.color, color: 'white' }}
            >
              {taskCategory.title}
            </Badge>
          </div>
        )}

        <div className={styles.energySection}>
          <TaskEnergyEditor 
            task={editedTask} 
            onChange={(updates) => {
              setEditedTask(prev => prev ? { ...prev, ...updates } : null);
            }}
          />
        </div>

        <Separator />

        <div className={styles.subtasksSection}>
          <h3 className={styles.subtasksTitle}>Subtasks</h3>
          
          <div className={styles.subtasksList}>
            {editedTask.subtasks && editedTask.subtasks.length > 0 ? (
              editedTask.subtasks.map(subtask => (
                <div key={subtask.id} className={styles.subtaskItem}>
                  <Checkbox 
                    checked={subtask.completed}
                    onChange={(e) => handleSubtaskToggle(subtask.id, e.target.checked)}
                  />
                  <span className={`${styles.subtaskTitle} ${subtask.completed ? styles.completed : ''}`}>
                    {subtask.title}
                  </span>
                </div>
              ))
            ) : (
              <p className={styles.noSubtasks}>No subtasks yet</p>
            )}
          </div>

          <div className={styles.addSubtaskForm}>
            <Input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="New subtask..."
              className={styles.subtaskInput}
            />
            <Button 
              size="sm" 
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
            >
              <Plus size={16} /> Add
            </Button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 size={16} /> Delete
          </Button>
          <Button onClick={handleSave}>
            <Check size={16} /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};