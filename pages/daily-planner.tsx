import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { EditTimeBlockModal } from '../components/EditTimeBlockModal';
import { SonnerToaster } from '../components/SonnerToaster';
import { useTimeBlocks, TimeBlock, TimeBlockTask } from '../helpers/useTimeBlocks';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import { format, parse, isToday, addDays, subDays } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, LinkIcon, MoreVertical } from 'lucide-react';
import { TimeBlockContextMenu } from '../components/TimeBlockContextMenu';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TaskSidebar } from '../components/TaskSidebar';
import { toast } from 'sonner';
import styles from './daily-planner.module.css';

const DailyPlannerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [dateInputValue, setDateInputValue] = useState<string>(format(selectedDate, 'yyyy-MM-dd'));
  const [activeDragTask, setActiveDragTask] = useState<string | null>(null);
  
  const {
    timeBlocks,
    isLoading: isLoadingTimeBlocks,
    error,
    fetchTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock
  } = useTimeBlocks();

  const {
    tasks,
    projects,
    categories,
    isLoaded: isTasksLoaded,
    updateTask,
  } = useTaskDatabase();

  // Format the selected date for display
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const isCurrentDay = isToday(selectedDate);

  // Filter time blocks for the selected date
  const timeBlocksForDay = timeBlocks.filter(block => {
    return block.date === format(selectedDate, 'yyyy-MM-dd');
  });

  // Sort time blocks by start time
  const sortedTimeBlocks = [...timeBlocksForDay].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  // Fetch time blocks for the selected date
  useEffect(() => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    fetchTimeBlocks({
      startDate: formattedDate,
      endDate: formattedDate
    });
  }, [selectedDate, fetchTimeBlocks]);
  
  // Fetch all time blocks to determine which tasks are scheduled
  const [allTimeBlocks, setAllTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoadingAllBlocks, setIsLoadingAllBlocks] = useState(false);
  
  useEffect(() => {
    const fetchAllTimeBlocks = async () => {
      setIsLoadingAllBlocks(true);
      try {
        // Fetch all time blocks without date filters
        const response = await fetch('/_api/timeBlocks');
        const data = await response.json();
        if (response.ok) {
          setAllTimeBlocks(data);
        }
      } catch (error) {
        console.error('Failed to fetch all time blocks:', error);
      } finally {
        setIsLoadingAllBlocks(false);
      }
    };
    
    fetchAllTimeBlocks();
  }, []);
  
  // Get unscheduled tasks (tasks that aren't linked to any time block)
  const unscheduledTasks = tasks.filter(task => {
    // Check if the task is already linked to a time block for ANY date
    const isLinked = allTimeBlocks.some(block => 
      block.tasks?.some(blockTask => blockTask.id === task.id)
    );
    
    // Return true only if the task is NOT linked to any time block
    return !isLinked;
  });

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error('Error', {
        description: error || 'Failed to load time blocks. Please try again.'
      });
    }
  }, [error]);

  // Handle date navigation
  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    setDateInputValue(format(newDate, 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    setDateInputValue(format(newDate, 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setDateInputValue(format(today, 'yyyy-MM-dd'));
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInputValue(e.target.value);
    try {
      const newDate = parse(e.target.value, 'yyyy-MM-dd', new Date());
      setSelectedDate(newDate);
    } catch (error) {
      // Invalid date format, ignore
    }
  };

  // Handle creating a new time block
  const handleCreateBlock = () => {
    // Default to current hour rounded to nearest hour
    const now = new Date();
    const hours = now.getHours();
    const startTime = `${hours.toString().padStart(2, '0')}:00`;
    const endTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
    
    setEditingBlock({
      id: 'new',
      title: 'New Time Block',
      startTime,
      endTime,
      date: format(selectedDate, 'yyyy-MM-dd'),
      tasks: []
    });
  };

  // Handle editing a time block
  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlock(block);
  };

  // Handle saving a time block
  const handleSaveBlock = async (updatedBlock: TimeBlock) => {
    try {
      if (updatedBlock.id === 'new') {
        await createTimeBlock({
          title: updatedBlock.title,
          startTime: updatedBlock.startTime,
          endTime: updatedBlock.endTime,
          date: updatedBlock.date,
          tasks: updatedBlock.tasks
        });
        toast.success('Success', {
          description: 'Time block created successfully'
        });
      } else {
        await updateTimeBlock(updatedBlock);
        toast.success('Success', {
          description: 'Time block updated successfully'
        });
      }
      
      // Refresh time blocks
      fetchTimeBlocks({
        startDate: format(selectedDate, 'yyyy-MM-dd'),
        endDate: format(selectedDate, 'yyyy-MM-dd')
      });
      
      // Close the modal
      setEditingBlock(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Handle deleting a time block
  const handleDeleteBlock = async (blockId: string) => {
    try {
      console.log('Attempting to delete time block with ID:', blockId);
      await deleteTimeBlock(blockId);
      toast.success('Success', {
        description: 'Time block deleted successfully'
      });
      
      // Refresh time blocks
      fetchTimeBlocks({
        startDate: format(selectedDate, 'yyyy-MM-dd'),
        endDate: format(selectedDate, 'yyyy-MM-dd')
      });
    } catch (error: any) {
      console.error('Failed to delete time block:', error);
      toast.error('Error', {
        description: error?.message || 'Failed to delete time block. Please try again.'
      });
    }
  };

  // Handle unlinking a task from a time block
  const handleUnlinkTask = async (block: TimeBlock, taskId: string) => {
    try {
      // Create a copy of the block with the task removed
      const updatedBlock = {
        ...block,
        tasks: block.tasks?.filter(t => t.id !== taskId) || []
      };
      
      await updateTimeBlock(updatedBlock);
      
      toast.success('Success', {
        description: 'Task unlinked from time block'
      });
      
      // Refresh time blocks
      fetchTimeBlocks({
        startDate: format(selectedDate, 'yyyy-MM-dd'),
        endDate: format(selectedDate, 'yyyy-MM-dd')
      });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Handle drag start
  const handleDragStart = (task: any) => {
    setActiveDragTask(task.id);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    
    // Add a visual indicator for the drop target
    const element = e.currentTarget as HTMLElement;
    element.classList.add(styles.dropTarget);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    // Remove the visual indicator
    const element = e.currentTarget as HTMLElement;
    element.classList.remove(styles.dropTarget);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, block: TimeBlock) => {
    e.preventDefault();
    
    // Remove the visual indicator
    const element = e.currentTarget as HTMLElement;
    element.classList.remove(styles.dropTarget);
    
    // Get the task ID from the drag data
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    // Find the task by ID
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      // Check if this task is already in the block
      const isTaskAlreadyLinked = block.tasks?.some(t => t.id === taskId);
      
      if (isTaskAlreadyLinked) {
        toast.info('Info', {
          description: 'This task is already linked to this time block'
        });
        return;
      }
      
      // Create a new task entry for the time block
      const newTimeBlockTask: TimeBlockTask = {
        id: taskId,
        title: task.title
      };
      
      // Update the time block with the new task added to the tasks array
      const updatedBlock = {
        ...block,
        tasks: [...(block.tasks || []), newTimeBlockTask]
      };
      
      // Update directly on the server
      await updateTimeBlock(updatedBlock);
      
      toast.success('Success', {
        description: 'Task linked to time block successfully'
      });
      
      // Refresh time blocks to ensure everything is in sync
      fetchTimeBlocks({
        startDate: format(selectedDate, 'yyyy-MM-dd'),
        endDate: format(selectedDate, 'yyyy-MM-dd')
      });
    } catch (error: any) {
      toast.error('Error', {
        description: error?.message || 'Failed to link task to time block. Please try again.'
      });
    } finally {
      setActiveDragTask(null);
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return time;
    }
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      let durationMinutes = endTotalMinutes - startTotalMinutes;
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Handle overnight blocks
      }
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (hours === 0) {
        return `${minutes} min`;
      } else if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    } catch (error) {
      return '';
    }
  };

  const isLoading = isLoadingTimeBlocks || !isTasksLoaded || isLoadingAllBlocks;

  return (
    <div className={styles.dailyPlannerPage}>
      <SonnerToaster />
      
      {/* Edit Modal */}
      {editingBlock && (
        <EditTimeBlockModal
          timeBlock={editingBlock}
          onSave={handleSaveBlock}
          onClose={() => setEditingBlock(null)}
          open={!!editingBlock}
        />
      )}
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Daily Planner</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.datePickerContainer}>
            <input
              type="date"
              value={dateInputValue}
              onChange={handleDateChange}
              className={styles.datePicker}
            />
            <CalendarIcon className={styles.calendarIcon} size={16} />
          </div>
          <Button onClick={handleCreateBlock}>
            <Plus size={16} /> Add Block
          </Button>
        </div>
      </header>
      
      {/* Date Navigation */}
      <div className={styles.dateNavigation}>
        <Button variant="ghost" size="icon-md" onClick={goToPreviousDay}>
          <ChevronLeft size={18} />
        </Button>
        <div className={styles.currentDate}>
          <h2 className={styles.dateHeading}>
            {formattedDate}
            {isCurrentDay && <span className={styles.todayBadge}>Today</span>}
          </h2>
        </div>
        <Button variant="ghost" size="icon-md" onClick={goToNextDay}>
          <ChevronRight size={18} />
        </Button>
        {!isCurrentDay && (
          <Button variant="outline" size="sm" onClick={goToToday} className={styles.todayButton}>
            Today
          </Button>
        )}
      </div>
      
      {/* Main Content with Sidebar */}
      <div className={styles.mainContent}>
        {/* Task Sidebar */}
        <div className={styles.sidebarContainer}>
          {isLoading ? (
            <div className={styles.sidebarPlaceholder}>
              <LoadingSpinner />
            </div>
          ) : (
            <TaskSidebar
              tasks={unscheduledTasks}
              projects={projects}
              categories={categories}
              selectedDate={selectedDate}
              onDragStart={handleDragStart}
            />
          )}
        </div>
        
        {/* Time Blocks */}
        <div className={styles.timeBlocksContainer}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
              <p>Loading your schedule...</p>
            </div>
          ) : sortedTimeBlocks.length > 0 ? (
            <div className={styles.timeBlocks}>
              {sortedTimeBlocks.map((block) => (
                <TimeBlockContextMenu
                  key={block.id}
                  block={block}
                  onEdit={handleEditBlock}
                  onDelete={handleDeleteBlock}
                  onUnlinkTask={handleUnlinkTask}
                >
                  <div 
                    className={`${styles.timeBlock} ${block.tasks.length > 0 ? styles.linkedBlock : ''} ${activeDragTask ? styles.dropZone : ''}`}
                    onDragOver={(e) => handleDragOver(e, block.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, block)}
                  >
                    <div className={styles.timeBlockHeader}>
                      <div className={styles.timeBlockTime}>
                        <Clock size={14} className={styles.timeIcon} />
                        <span>{formatTime(block.startTime)} - {formatTime(block.endTime)}</span>
                        <span className={styles.duration}>({calculateDuration(block.startTime, block.endTime)})</span>
                      </div>
                      <Button variant="ghost" size="icon-sm" className={styles.moreButton}>
                        <MoreVertical size={14} />
                      </Button>
                    </div>
                    <div className={styles.timeBlockContent}>
                      <h3 className={styles.timeBlockTitle}>
                        {block.title}
                      </h3>
                      {block.tasks && block.tasks.length > 0 && (
                        <div className={styles.linkedTasksContainer}>
                          {block.tasks.map(blockTask => {
                            // Find the full task data
                            const linkedTask = tasks.find(t => t.id === blockTask.id);
                            if (!linkedTask) return null;
                            
                            // Find project and category if they exist
                            const project = linkedTask.projectId ? projects.find(p => p.id === linkedTask.projectId) : null;
                            const category = linkedTask.categoryId ? categories.find(c => c.id === linkedTask.categoryId) : null;
                            
                            return (
                              <div key={linkedTask.id} className={styles.linkedTaskItem}>
                                <div className={styles.linkedTaskHeader}>
                                  <div className={styles.linkedTaskTitle}>
                                    {linkedTask.title}
                                  </div>
                                  <div className={styles.linkedTaskActions}>
                                    <Checkbox 
                                      checked={linkedTask.completed}
                                      onChange={async () => {
                                        try {
                                          await updateTask(linkedTask.id, { completed: !linkedTask.completed });
                                          toast.success('Task status updated');
                                        } catch (error) {
                                          toast.error('Failed to update task status');
                                        }
                                      }}
                                    />
                                    <Button 
                                      variant="ghost" 
                                      size="icon-xs" 
                                      className={styles.unlinkButton}
                                      onClick={() => handleUnlinkTask(block, linkedTask.id)}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18" />
                                        <path d="m6 6 12 12" />
                                      </svg>
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className={styles.linkedTaskMeta}>
                                  {category && (
                                    <div 
                                      className={styles.taskCategory}
                                      style={{ backgroundColor: `color-mix(in srgb, ${category.color} 15%, transparent)`, color: category.color }}
                                    >
                                      {category.title}
                                    </div>
                                  )}
                                  
                                  {project && (
                                    <div className={styles.taskProject}>
                                      {project.title}
                                    </div>
                                  )}
                                  
                                  {linkedTask.dueDate && (
                                    <div className={styles.taskDueDate}>
                                      {format(linkedTask.dueDate, 'MMM d')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </TimeBlockContextMenu>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateContent}>
                <Clock size={48} className={styles.emptyStateIcon} />
                <h3 className={styles.emptyStateTitle}>No time blocks for this day</h3>
                <p className={styles.emptyStateDescription}>
                  Start planning your day by adding time blocks to organize your schedule.
                </p>
                <Button onClick={handleCreateBlock}>
                  <Plus size={16} /> Add Your First Block
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyPlannerPage;