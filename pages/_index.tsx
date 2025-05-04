"use client";

import React, { useState } from 'react';
import { Task } from '../helpers/TaskStorage';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import { 
  useTaskSuggester, 
  TimeAvailable, 
  EnergyLevel, 
  TaskSuggestion 
} from '../helpers/TaskSuggester';
import { TaskList } from '../components/TaskList';
import { TaskDetail } from '../components/TaskDetail';
import { WhatNowWizard } from '../components/WhatNowWizard';
import { ImportExportPanel } from '../components/ImportExportPanel';
import { clearAllData } from '../lib/localStorageManager';
import { Button } from '../components/Button';
import { HelpCircle } from 'lucide-react';
import styles from './_index.module.css';
import { useIsMobile } from '../helpers/useIsMobile';

export default function Dashboard() {
  const {
    tasks,
    projects,
    categories,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    addCategory,
    resetAllData
  } = useTaskDatabase();
  


  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardFilters, setWizardFilters] = useState<{
    timeAvailable: TimeAvailable | null;
    energyLevel: EnergyLevel | null;
    blockers: string[];
  }>({
    timeAvailable: null,
    energyLevel: null,
    blockers: [],
  });

  const isMobile = useIsMobile();
  const [activePanel, setActivePanel] = useState<'list' | 'detail' | 'wizard' | 'import-export'>(
    'list'
  );

  // Get task suggestions based on wizard filters
  const suggestedTasks = useTaskSuggester(
    tasks,
    {
      timeAvailable: wizardFilters.timeAvailable || 'medium',
      energyLevel: wizardFilters.energyLevel || 'medium',
      blockers: wizardFilters.blockers,
    }
  );

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    if (isMobile) {
      setActivePanel('detail');
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await updateTask(taskId, { completed });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleSaveTask = async (task: Task) => {
    try {
      await updateTask(task.id, task);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddSubtask = async (
    parentId: string,
    subtask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await addTask({
        ...subtask,
        parentTaskId: parentId
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleOpenWizard = () => {
    setShowWizard(true);
    if (isMobile) {
      setActivePanel('wizard');
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    if (isMobile) {
      setActivePanel('list');
    }
  };

  const handleUpdateWizardFilters = (filters: {
    timeAvailable: TimeAvailable | null;
    energyLevel: EnergyLevel | null;
    blockers: string[];
  }) => {
    setWizardFilters(filters);
  };

  const handleBackToList = () => {
    setActivePanel('list');
  };

  // Determine what to render in the main and side panels based on mobile state
  const renderContent = () => {
    if (isMobile) {
      switch (activePanel) {
        case 'list':
          return (
            <>
              <div className={styles.mobileActions} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Show the import/export panel for mobile
                    setActivePanel('import-export');
                  }}
                >
                  Data Management
                </Button>
                <Button onClick={handleOpenWizard}>
                  <HelpCircle size={16} /> What Now?
                </Button>
              </div>
              <TaskList
                tasks={tasks}
                projects={projects}
                categories={categories}
                onTaskSelect={handleTaskSelect}
                onTaskToggle={handleTaskToggle}
                onAddTask={addTask}
                className={styles.taskList}
              />
            </>
          );
        case 'detail':
          return (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToList}
                className={styles.backButton}
              >
                Back to List
              </Button>
              <TaskDetail
                task={selectedTask}
                projects={projects}
                categories={categories}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                onAddSubtask={handleAddSubtask}
                onClose={handleBackToList}
                className={styles.taskDetail}
              />
            </>
          );
        case 'wizard':
          return (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToList}
                className={styles.backButton}
              >
                Back to List
              </Button>
              <WhatNowWizard
                onClose={handleCloseWizard}
                onTaskSelect={handleTaskSelect}
                suggestedTasks={suggestedTasks}
                onUpdateFilters={handleUpdateWizardFilters}
                className={styles.wizard}
              />
            </>
          );
        case 'import-export':
          return (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToList}
                className={styles.backButton}
              >
                Back to List
              </Button>
              <div className={styles.mobileImportExport}>
                <ImportExportPanel
                  tasks={tasks}
                  projects={projects}
                  categories={categories}
                  onDataImported={handleDataImported}
                  className={styles.importExportPanel}
                />
              </div>
            </>
          );
      }
    } else {
      return (
        <>
          <div className={styles.mainPanel}>
            <div className={styles.wizardButton}>
              <Button onClick={handleOpenWizard}>
                <HelpCircle size={16} /> What Now?
              </Button>
            </div>
            <TaskList
              tasks={tasks}
              projects={projects}
              categories={categories}
              onTaskSelect={handleTaskSelect}
              onTaskToggle={handleTaskToggle}
              onAddTask={addTask}
              className={styles.taskList}
            />
          </div>
          <div className={styles.sidePanel}>
            {showWizard ? (
              <WhatNowWizard
                onClose={handleCloseWizard}
                onTaskSelect={handleTaskSelect}
                suggestedTasks={suggestedTasks}
                onUpdateFilters={handleUpdateWizardFilters}
                className={styles.wizard}
              />
            ) : (
              <TaskDetail
                task={selectedTask}
                projects={projects}
                categories={categories}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                onAddSubtask={handleAddSubtask}
                className={styles.taskDetail}
              />
            )}
          </div>
        </>
      );
    }
  };

  if (!isLoaded) {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  // Simple reload handler for when data is imported
  const handleDataImported = () => {
    // Force reload the page to refresh data from localStorage
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {renderContent()}
      </div>
      
      {!isMobile && (
        <div className={styles.dataManagementSection}>
          <ImportExportPanel
            tasks={tasks}
            projects={projects}
            categories={categories}
            onDataImported={handleDataImported}
            className={styles.importExportPanel}
          />
        </div>
      )}
    </div>
  );
}