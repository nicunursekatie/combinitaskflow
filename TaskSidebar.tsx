import React, { useState } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Button } from './Button';
import { Task } from '../helpers/TaskStorage';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import styles from './TaskSidebar.module.css';

type TaskFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'overdue';
type ProjectFilter = string | null;
type CategoryFilter = string | null;

interface TaskSidebarProps {
  tasks: Task[];
  projects: Array<{ id: string; title: string }>;
  categories: Array<{ id: string; title: string; color: string }>;
  selectedDate: Date;
  onDragStart: (task: Task) => void;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  tasks,
  projects,
  categories,
  selectedDate,
  onDragStart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Due date filter
    if (taskFilter !== 'all' && task.dueDate) {
      if (taskFilter === 'today' && !isToday(task.dueDate)) return false;
      if (taskFilter === 'tomorrow' && !isTomorrow(task.dueDate)) return false;
      if (taskFilter === 'week' && !isThisWeek(task.dueDate)) return false;
      if (taskFilter === 'overdue' && !isPast(task.dueDate)) return false;
    }

    // Project filter
    if (projectFilter && task.projectId !== projectFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter && task.categoryId !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'link';
    
    // Set a drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.classList.add(styles.dragImage);
    dragImage.textContent = task.title;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 10, 10);
    
    // Clean up the drag image after drag ends
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
    
    onDragStart(task);
  };

  // Reset all filters
  const resetFilters = () => {
    setTaskFilter('all');
    setProjectFilter(null);
    setCategoryFilter(null);
  };

  return (
    <div className={styles.sidebar}>
  <div className={styles.sidebarHeader}>
    <h2 className={styles.sidebarTitle}>Unscheduled Tasks</h2>
    <p className={styles.sidebarDescription}>
      Tasks with due dates that aren't linked to time blocks
    </p>
        <div className={styles.searchContainer}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.filterButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>
      
      {showFilters && (
        <div className={styles.filtersContainer}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Due Date</h3>
            <div className={styles.filterOptions}>
              <Button 
                variant={taskFilter === 'all' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setTaskFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={taskFilter === 'today' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setTaskFilter('today')}
              >
                Today
              </Button>
              <Button 
                variant={taskFilter === 'tomorrow' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setTaskFilter('tomorrow')}
              >
                Tomorrow
              </Button>
              <Button 
                variant={taskFilter === 'week' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setTaskFilter('week')}
              >
                This Week
              </Button>
              <Button 
                variant={taskFilter === 'overdue' ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => setTaskFilter('overdue')}
              >
                Overdue
              </Button>
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Project</h3>
            <select 
              className={styles.selectFilter}
              value={projectFilter || ''}
              onChange={(e) => setProjectFilter(e.target.value || null)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Category</h3>
            <select 
              className={styles.selectFilter}
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className={styles.resetButton}
          >
            <X size={14} />
            Reset Filters
          </Button>
        </div>
      )}
      
      <div className={styles.taskList}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={styles.taskItem}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
            >
              <div className={styles.taskContent}>
                <h3 className={styles.taskTitle}>{task.title}</h3>
                {task.dueDate && (
                  <div className={styles.taskDueDate}>
                    <Calendar size={12} />
                    {format(task.dueDate, 'MMM d, yyyy')}
                  </div>
                )}
              </div>
              <div className={styles.dragHandle}>
                <span className={styles.dragIcon}></span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No unscheduled tasks with due dates match your filters</p>
            {(searchQuery || taskFilter !== 'all' || projectFilter || categoryFilter) && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.instructions}>
        <h3 className={styles.instructionsTitle}>How to use</h3>
        <p>Drag tasks from this sidebar and drop them onto time blocks to schedule them. Only tasks with due dates that aren't already scheduled appear here.</p>
      </div>
    </div>
  );
};