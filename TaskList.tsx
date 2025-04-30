"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  Tag,
  FolderKanban,
  CheckSquare,
  Square,
  X,
  Edit
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import styles from './TaskList.module.css';
import { Task, Project, Category, useTaskStorage } from '../helpers/TaskStorage';
import { Button } from './Button';
import { Input } from './Input';
import { Checkbox } from './Checkbox';
import { Badge } from './Badge';
import { QuickTaskDialog } from './QuickTaskDialog';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from './DropdownMenu';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  onTaskSelect: (task: Task) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  assignCategoryToTasks?: (taskIds: string[], categoryId: string) => Promise<Task[]>;
  className?: string;
  initialProjectFilter?: string | null;
  initialCategoryFilter?: string | null;
}

export const TaskList = ({
  tasks,
  projects,
  categories,
  onTaskSelect,
  onTaskToggle,
  onAddTask,
  assignCategoryToTasks,
  className = '',
  initialProjectFilter = null,
  initialCategoryFilter = null,
}: TaskListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(initialProjectFilter);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryFilter);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [quickTaskDialogOpen, setQuickTaskDialogOpen] = useState<boolean>(false);
  const [quickTaskData, setQuickTaskData] = useState<Partial<Task>>({
    title: '',
    completed: false,
    energyLevel: 'medium',
    activationEnergy: 'medium'
  });
  const [batchActionStatus, setBatchActionStatus] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });

  // Update selected project and category when initialProjectFilter or initialCategoryFilter changes
  useEffect(() => {
    if (initialProjectFilter !== null) {
      setSelectedProject(initialProjectFilter);
    }
  }, [initialProjectFilter]);
  
  useEffect(() => {
    if (initialCategoryFilter !== null) {
      setSelectedCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);
  
  // Clear selection mode when no tasks are selected
  useEffect(() => {
    if (selectedTasks.length === 0) {
      setIsSelectionMode(false);
    }
  }, [selectedTasks]);
  
  // Clear status message after 3 seconds
  useEffect(() => {
    if (batchActionStatus.type) {
      const timer = setTimeout(() => {
        setBatchActionStatus({ message: '', type: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [batchActionStatus]);

  // Filter tasks based on search, project, and category
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by project
      const matchesProject = selectedProject === null || task.projectId === selectedProject;
      
      // Filter by category
      const matchesCategory = selectedCategory === null || task.categoryId === selectedCategory;
      
      // Only include top-level tasks (not subtasks)
      const isTopLevel = !task.parentTaskId;
      
      return matchesSearch && matchesProject && matchesCategory && isTopLevel;
    });
  }, [tasks, searchTerm, selectedProject, selectedCategory]);

  // Group tasks by due date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      upcoming: [],
      someday: [],
    };

    filteredTasks.forEach(task => {
      if (!task.dueDate) {
        groups.someday.push(task);
      } else if (isPast(task.dueDate) && !isToday(task.dueDate)) {
        groups.overdue.push(task);
      } else if (isToday(task.dueDate)) {
        groups.today.push(task);
      } else if (isTomorrow(task.dueDate)) {
        groups.tomorrow.push(task);
      } else {
        groups.upcoming.push(task);
      }
    });

    // Sort tasks within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
    });

    return groups;
  }, [filteredTasks]);

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    // If in selection mode, don't toggle completion
    if (isSelectionMode) return;
    onTaskToggle(taskId, completed);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    // Set the quick task data and open the dialog
    setQuickTaskData({
      title: newTaskTitle,
      completed: false,
      projectId: selectedProject || undefined,
      categoryId: selectedCategory || undefined,
      energyLevel: 'medium',
      activationEnergy: 'medium'
    });
    setQuickTaskDialogOpen(true);
  };

  const handleQuickTaskSave = (task: Partial<Task>) => {
    onAddTask(task as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
    setQuickTaskDialogOpen(false);
    setNewTaskTitle('');
  };

  const handleQuickTaskCancel = () => {
    setQuickTaskDialogOpen(false);
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
    
    // Enter selection mode if not already
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      // Deselect all
      setSelectedTasks([]);
    } else {
      // Select all visible tasks
      const allTaskIds = getAllVisibleTaskIds(filteredTasks);
      setSelectedTasks(allTaskIds);
    }
  };
  
  const getAllVisibleTaskIds = (tasks: Task[]): string[] => {
    let ids: string[] = [];
    
    tasks.forEach(task => {
      ids.push(task.id);
      if (task.subtasks && expandedTasks[task.id]) {
        ids = [...ids, ...getAllVisibleTaskIds(task.subtasks)];
      }
    });
    
    return ids;
  };
  
  const exitSelectionMode = () => {
    setSelectedTasks([]);
    setIsSelectionMode(false);
  };
  
  const handleAssignCategory = async (categoryId: string) => {
    if (!assignCategoryToTasks || selectedTasks.length === 0) return;
    
    try {
      await assignCategoryToTasks(selectedTasks, categoryId);
      setBatchActionStatus({
        message: `Category assigned to ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}`,
        type: 'success'
      });
      // Exit selection mode after successful operation
      exitSelectionMode();
    } catch (error) {
      setBatchActionStatus({
        message: 'Failed to assign category',
        type: 'error'
      });
    }
  };

  const renderTask = (task: Task, level = 0) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTasks[task.id];
    const taskProject = projects.find(p => p.id === task.projectId);
    const taskCategory = categories.find(c => c.id === task.categoryId);
    const isSelected = selectedTasks.includes(task.id);

    return (
      <div key={task.id} className={styles.taskWrapper}>
        <div 
          className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${isSelected ? styles.selected : ''} ${isSelectionMode ? styles.selectionMode : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={isSelectionMode ? () => toggleTaskSelection(task.id) : undefined}
        >
          <div className={styles.taskMain}>
            {hasSubtasks && (
              <button 
                className={styles.expandButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskExpanded(task.id);
                }}
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            
            <Checkbox 
              checked={task.completed}
              onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
              className={styles.checkbox}
              disabled={isSelectionMode}
              onClick={(e) => isSelectionMode && e.stopPropagation()}
            />
            
            {isSelectionMode && isSelected && (
              <div className={styles.selectionIndicator}>
                <CheckSquare size={16} />
              </div>
            )}
            
            <div 
              className={styles.taskContent}
              onClick={(e) => {
                if (!isSelectionMode) {
                  e.stopPropagation();
                  onTaskSelect(task);
                }
              }}
            >
              <div className={styles.taskTitle}>
                {task.title}
              </div>
              
              <div className={styles.taskMeta}>
                {taskProject && (
                  <div className={styles.taskMetaItem}>
                    <FolderKanban size={14} />
                    <span>{taskProject.title}</span>
                  </div>
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
                  <div className={`${styles.taskMetaItem} ${getDueDateClass(task.dueDate)}`}>
                    <CalendarIcon size={14} />
                    <span>{formatDueDate(task.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {hasSubtasks && isExpanded && (
          <div className={styles.subtasks}>
            {task.subtasks!.map(subtask => renderTask(subtask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatDueDate = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getDueDateClass = (date: Date): string => {
    if (isPast(date) && !isToday(date)) return styles.overdue;
    if (isToday(date)) return styles.today;
    if (isTomorrow(date)) return styles.tomorrow;
    if (date < addDays(new Date(), 7)) return styles.upcoming;
    return '';
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tasks</h2>
        <div className={styles.headerButtons}>
          <Button 
            variant={isSelectionMode ? "primary" : "outline"}
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={styles.batchEditButton}
          >
            <Edit size={16} /> Batch Edit
          </Button>
          <Button onClick={() => onTaskSelect({ 
            id: '', 
            title: '', 
            completed: false, 
            createdAt: new Date(), 
            updatedAt: new Date() 
          })}>
            <Plus size={16} /> New Task
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterSelects}>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className={styles.filterSelect}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.quickAdd}>
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className={styles.quickAddInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddTask();
            }
          }}
        />
        <Button 
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim()}
          size="sm"
        >
          Add
        </Button>
      </div>

      {batchActionStatus.type && (
        <div className={`${styles.statusMessage} ${styles[batchActionStatus.type]}`}>
          {batchActionStatus.message}
        </div>
      )}
      
      {isSelectionMode && (
        <div className={styles.batchActions}>
          <div className={styles.batchActionsInfo}>
            <span>{selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSelectAll}
            >
              {selectedTasks.length === filteredTasks.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className={styles.batchActionsControls}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  Assign Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map(category => (
                  <DropdownMenuItem 
                    key={category.id}
                    onClick={() => handleAssignCategory(category.id)}
                  >
                    <div 
                      className={styles.categoryColorDot} 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={exitSelectionMode}
              aria-label="Exit selection mode"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}
      
      <div className={styles.taskList}>
        {groupedTasks.overdue.length > 0 && (
          <div className={styles.taskGroup}>
            <h3 className={`${styles.groupTitle} ${styles.overdueTitle}`}>Overdue</h3>
            {groupedTasks.overdue.map(task => renderTask(task))}
          </div>
        )}

        {groupedTasks.today.length > 0 && (
          <div className={styles.taskGroup}>
            <h3 className={`${styles.groupTitle} ${styles.todayTitle}`}>Today</h3>
            {groupedTasks.today.map(task => renderTask(task))}
          </div>
        )}

        {groupedTasks.tomorrow.length > 0 && (
          <div className={styles.taskGroup}>
            <h3 className={`${styles.groupTitle} ${styles.tomorrowTitle}`}>Tomorrow</h3>
            {groupedTasks.tomorrow.map(task => renderTask(task))}
          </div>
        )}

        {groupedTasks.upcoming.length > 0 && (
          <div className={styles.taskGroup}>
            <h3 className={`${styles.groupTitle} ${styles.upcomingTitle}`}>Upcoming</h3>
            {groupedTasks.upcoming.map(task => renderTask(task))}
          </div>
        )}

        {groupedTasks.someday.length > 0 && (
          <div className={styles.taskGroup}>
            <h3 className={`${styles.groupTitle} ${styles.somedayTitle}`}>Someday</h3>
            {groupedTasks.someday.map(task => renderTask(task))}
          </div>
        )}

      {Object.values(groupedTasks).every(group => group.length === 0) && (
          <div className={styles.emptyState}>
            <p>No tasks found. Add a new task to get started!</p>
          </div>
        )}
      </div>

      <QuickTaskDialog
        task={quickTaskData}
        projects={projects}
        categories={categories}
        onSave={handleQuickTaskSave}
        onCancel={handleQuickTaskCancel}
        open={quickTaskDialogOpen}
        onOpenChange={setQuickTaskDialogOpen}
      />
    </div>
  );
};