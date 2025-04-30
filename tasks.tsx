"use client";

import React, { useState, useEffect } from 'react';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TaskList } from '../components/TaskList';
import { TaskDetail } from '../components/TaskDetail';
import { QuickTaskDialog } from '../components/QuickTaskDialog';
import { Button } from '../components/Button';
import { Plus } from 'lucide-react';
import styles from './tasks.module.css';
import { Task } from '../helpers/TaskStorage';
import { Dialog, DialogContent } from '../components/Dialog';

export default function TasksPage() {
  const {
    tasks,
    projects,
    categories,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    assignCategoryToTasks
  } = useTaskDatabase();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  
  // Get URL query parameters
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Set initial project and category filters from URL query parameters
  useEffect(() => {
    const projectId = searchParams.get('project');
    const categoryId = searchParams.get('category');
    
    if (projectId) {
      setSelectedProject(projectId);
      
      // Find the project name
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProjectName(project.title);
      }
    } else {
      setSelectedProject(null);
      setSelectedProjectName(null);
    }
    
    if (categoryId) {
      setSelectedCategory(categoryId);
      
      // Find the category name
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategoryName(category.title);
      }
    } else {
      setSelectedCategory(null);
      setSelectedCategoryName(null);
    }
  }, [searchParams, projects, categories]);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      setIsLoading(true);
      await updateTask(taskId, { completed });
    } catch (err) {
      setError("Failed to update task status. Please try again.");
      console.error("Error toggling task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };
  
  const handleOpenQuickTaskDialog = () => {
    setIsQuickTaskDialogOpen(true);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      setIsLoading(true);
      await updateTask(updatedTask.id, updatedTask);
      setIsTaskDialogOpen(false);
    } catch (err) {
      setError("Failed to save task. Please try again.");
      console.error("Error saving task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      await deleteTask(taskId);
      setIsTaskDialogOpen(false);
    } catch (err) {
      setError("Failed to delete task. Please try again.");
      console.error("Error deleting task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubtask = async (parentId: string, subtaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      await addTask(subtaskData);
      
      // Refresh the selected task to show the new subtask
      const updatedTasks = tasks.filter(t => t.id === parentId);
      if (updatedTasks.length > 0) {
        setSelectedTask(updatedTasks[0]);
      }
    } catch (err) {
      setError("Failed to add subtask. Please try again.");
      console.error("Error adding subtask:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      setIsLoading(true);
      // Ensure title is not undefined before passing to addTask
      if (taskData.title) {
        await addTask({
          ...taskData,
          title: taskData.title,
          completed: taskData.completed ?? false
        });
      }
    } catch (err) {
      setError("Failed to add task. Please try again.");
      console.error("Error adding task:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }
  
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <div className={styles.errorMessage}>
        {error}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setError(null)}
          className={styles.dismissButton}
        >
          Dismiss
        </Button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderErrorMessage()}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>
            {selectedProjectName 
              ? `${selectedProjectName} Tasks` 
              : selectedCategoryName 
                ? `${selectedCategoryName} Tasks` 
                : 'All Tasks'}
          </h1>
          {(selectedProject || selectedCategory) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/tasks')}
              className={styles.clearFilterButton}
            >
              Clear filter
            </Button>
          )}
        </div>
        <Button 
          onClick={handleOpenQuickTaskDialog}
          disabled={isLoading}
        >
          <Plus size={16} /> New Task
        </Button>
      </div>
      
      <div className={styles.content}>
        <TaskList
          tasks={tasks}
          projects={projects}
          categories={categories}
          onTaskSelect={handleTaskSelect}
          onTaskToggle={handleTaskToggle}
          onAddTask={handleAddTask}
          assignCategoryToTasks={assignCategoryToTasks}
          className={styles.taskList}
          initialProjectFilter={selectedProject}
          initialCategoryFilter={selectedCategory}
        />
      </div>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className={styles.taskDetailDialog}>
          <TaskDetail
            task={selectedTask}
            projects={projects}
            categories={categories}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            onAddSubtask={handleAddSubtask}
            onClose={() => setIsTaskDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <QuickTaskDialog
        projects={projects}
        categories={categories}
        onSave={handleAddTask}
        open={isQuickTaskDialogOpen}
        onOpenChange={setIsQuickTaskDialogOpen}
      />
    </div>
  );
}