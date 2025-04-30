import React, { useState } from 'react';
import { SonnerToaster } from '../components/SonnerToaster';
import { Calendar as CalendarComponent } from '../components/Calendar';
import { ToggleGroup, ToggleGroupItem } from '../components/ToggleGroup';
import { Button } from '../components/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './calendar.module.css';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import type { Task } from '../helpers/TaskStorage';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isWithinInterval } from 'date-fns';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { CalendarTaskIndicator } from '../components/CalendarTaskIndicator';
import { Link } from 'react-router-dom';

type CalendarView = 'month' | 'week' | 'day';

const CalendarPage: React.FC = () => {
  const { tasks, updateTask, isLoaded } = useTaskDatabase();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Filter tasks with due dates
  const tasksWithDueDates = tasks.filter((task: Task) => task.dueDate);

  // Navigation functions
  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  // Get date range for current view
  const getDateRange = () => {
    if (view === 'month') {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
        title: format(currentDate, 'MMMM yyyy')
      };
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        start,
        end,
        title: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
      };
    } else {
      return {
        start: currentDate,
        end: currentDate,
        title: format(currentDate, 'EEEE, MMMM d, yyyy')
      };
    }
  };

  const dateRange = getDateRange();

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    return tasksWithDueDates.filter((task: Task) => task.dueDate && isSameDay(task.dueDate, date));
  };

  // Generate days for week view
  const generateWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      days.push(day);
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  // Generate time slots for day view
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Mark a task as completed
  const markTaskCompleted = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { completed });
      toast.success('Success', {
        description: completed ? 'Task marked as completed' : 'Task marked as incomplete'
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update task status'
      });
    }
  };

  // Render month view
  const renderMonthView = () => {
    return (
      <div className={styles.monthView}>
        <CalendarComponent
          mode="single"
          selected={currentDate}
          onSelect={(date) => date && setCurrentDate(date)}
          className={styles.monthCalendar}
        />
        <div className={styles.monthTasksOverlay}>
          {tasksWithDueDates.map((task: Task) => {
            if (!task.dueDate) return null;
            
            // Check if the task's due date is within the current month view
            const isInCurrentMonth = isWithinInterval(task.dueDate, {
              start: startOfMonth(currentDate),
              end: endOfMonth(currentDate)
            });
            
            if (!isInCurrentMonth) return null;
            
            const dayOfMonth = task.dueDate.getDate();
            const dayElement = document.querySelector(`.${styles.monthCalendar} [aria-label*="${dayOfMonth}"]`);
            
            if (!dayElement) return null;
            
            // This is a simplified approach - in a real app, you'd need more sophisticated positioning
            return (
              <CalendarTaskIndicator
                key={task.id}
                task={task}
                view="month"
              />
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    return (
      <div className={styles.weekView}>
        <div className={styles.weekHeader}>
          <div className={styles.weekTimeColumn}></div>
          {weekDays.map((day, index) => (
            <div key={index} className={styles.weekDay}>
              <div className={styles.weekDayName}>{format(day, 'EEE')}</div>
              <div className={styles.weekDayNumber}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        <div className={styles.weekBody}>
          <div className={styles.weekTimeColumn}>
            {timeSlots.map((time, index) => (
              <div key={index} className={styles.weekTimeSlot}>
                {time}
              </div>
            ))}
          </div>
          {weekDays.map((day, dayIndex) => (
            <div 
              key={dayIndex} 
              className={styles.weekDayColumn}
            >
              {timeSlots.map((time, timeIndex) => (
                <div 
                  key={timeIndex} 
                  className={styles.weekTimeBlock}
                >
                  {getTasksForDay(day).map((task: Task) => {
                    // Display task indicators in the week view
                    // This is a simplified approach - in a real app, you'd position based on actual time
                    const taskHour = task.dueDate ? task.dueDate.getHours().toString().padStart(2, '0') : '09';
                    const taskTime = `${taskHour}:00`;
                    
                    if (time === taskTime) {
                      return (
                        <CalendarTaskIndicator
                          key={task.id}
                          task={task}
                          view="week"
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    return (
      <div className={styles.dayView}>
        <div className={styles.dayHeader}>
          <div className={styles.dayDate}>{format(currentDate, 'EEEE, MMMM d')}</div>
        </div>
        <div className={styles.dayTimeGrid}>
          {timeSlots.map((time, index) => (
            <div 
              key={index} 
              className={styles.dayTimeSlot}
            >
              <div className={styles.timeLabel}>{time}</div>
              <div className={styles.timeContent}>
                {getTasksForDay(currentDate).map((task: Task) => {
                  // Display task indicators in the day view
                  // This is a simplified approach - in a real app, you'd position based on actual time
                  const taskHour = task.dueDate ? task.dueDate.getHours().toString().padStart(2, '0') : '09';
                  const taskTime = `${taskHour}:00`;
                  
                  if (time === taskTime) {
                    return (
                      <CalendarTaskIndicator
                        key={task.id}
                        task={task}
                        view="day"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.calendarPage}>
      <SonnerToaster />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Calendar</h1>
          <div className={styles.navigation}>
            <Button variant="ghost" size="icon-sm" onClick={goToPrevious}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={goToNext}>
              <ChevronRight size={16} />
            </Button>
            <span className={styles.currentPeriod}>{dateRange.title}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as CalendarView)}>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
          </ToggleGroup>
          <Link to="/daily-planner">
            <Button variant="outline" size="sm">
              Go to Daily Planner
            </Button>
          </Link>
        </div>
      </header>
      
      <div className={styles.calendarContainer}>
        <div className={styles.calendarMain}>
          {!isLoaded ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="lg" />
              <p>Loading calendar data...</p>
            </div>
          ) : (
            <>
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </>
          )}
        </div>
        
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Tasks with Due Dates</h2>
          </div>
          <div className={styles.taskList}>
            {!isLoaded ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {tasksWithDueDates.map((task: Task) => (
                  <div 
                    key={task.id} 
                    className={styles.taskItem}
                  >
                    <div className={styles.taskTitle}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => markTaskCompleted(task.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.taskCheckbox}
                      />
                      <span className={task.completed ? styles.taskCompleted : ''}>
                        {task.title}
                      </span>
                    </div>
                    {task.dueDate && (
                      <div className={styles.taskDueDate}>
                        {format(task.dueDate, 'MMM d, h:mm a')}
                      </div>
                    )}
                  </div>
                ))}
                {tasksWithDueDates.length === 0 && (
                  <div className={styles.emptyState}>
                    No tasks with due dates
                  </div>
                )}
              </>
            )}
          </div>
          <div className={styles.sidebarFooter}>
            <p className={styles.sidebarNote}>
              For time blocking, please use the <Link to="/daily-planner" className={styles.plannerLink}>Daily Planner</Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CalendarPage;