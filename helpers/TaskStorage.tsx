import { useState, useEffect } from 'react';

// Define types for our data structures
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  projectId?: string;
  categoryId?: string;
  parentTaskId?: string;
  subtasks?: Task[];
  energyLevel?: 'low' | 'medium' | 'high';
  activationEnergy?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  tasks?: string[]; // Array of task IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  title: string;
  color: string;
  tasks?: string[]; // Array of task IDs
  createdAt: Date;
  updatedAt: Date;
}

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'tasks',
  PROJECTS: 'projects',
  CATEGORIES: 'categories',
};

// Helper functions
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Main TaskStorage hook
export const useTaskStorage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on initial mount
  useEffect(() => {
    const loadedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const loadedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const loadedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

    if (loadedTasks) {
      try {
        const parsedTasks = JSON.parse(loadedTasks, (key, value) => {
          // Convert date strings back to Date objects
          if (key === 'dueDate' || key === 'createdAt' || key === 'updatedAt') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing tasks from localStorage:', error);
        setTasks([]);
      }
    }

    if (loadedProjects) {
      try {
        const parsedProjects = JSON.parse(loadedProjects, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        setProjects(parsedProjects);
      } catch (error) {
        console.error('Error parsing projects from localStorage:', error);
        setProjects([]);
      }
    }

    if (loadedCategories) {
      try {
        const parsedCategories = JSON.parse(loadedCategories, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        setCategories(parsedCategories);
      } catch (error) {
        console.error('Error parsing categories from localStorage:', error);
        setCategories([]);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories, isLoaded]);

  // Task CRUD operations
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks(prevTasks => [...prevTasks, newTask]);

    // Update project if task is associated with one
    if (newTask.projectId) {
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === newTask.projectId
            ? { 
                ...project, 
                tasks: [...(project.tasks || []), newTask.id],
                updatedAt: new Date()
              }
            : project
        )
      );
    }

    // Update category if task is associated with one
    if (newTask.categoryId) {
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === newTask.categoryId
            ? { 
                ...category, 
                tasks: [...(category.tasks || []), newTask.id],
                updatedAt: new Date()
              }
            : category
        )
      );
    }

    // Update parent task if this is a subtask
    if (newTask.parentTaskId) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === newTask.parentTaskId
            ? { 
                ...task, 
                subtasks: [...(task.subtasks || []), newTask],
                updatedAt: new Date()
              }
            : task
        )
      );
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | null => {
    let updatedTask: Task | null = null;

    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => {
        if (task.id === id) {
          updatedTask = { 
            ...task, 
            ...updates, 
            updatedAt: new Date() 
          };
          return updatedTask;
        }
        
        // Check if this task contains the task to update as a subtask
        if (task.subtasks?.some(subtask => subtask.id === id)) {
          const updatedSubtasks = task.subtasks.map(subtask => {
            if (subtask.id === id) {
              updatedTask = { 
                ...subtask, 
                ...updates, 
                updatedAt: new Date() 
              };
              return updatedTask;
            }
            return subtask;
          });
          
          return { 
            ...task, 
            subtasks: updatedSubtasks,
            updatedAt: new Date()
          };
        }
        
        return task;
      });
      
      return newTasks;
    });

    return updatedTask;
  };

  const deleteTask = (id: string): boolean => {
    let deleted = false;
    
    // Remove task from tasks array
    setTasks(prevTasks => {
      // First check if it's a top-level task
      if (prevTasks.some(task => task.id === id)) {
        deleted = true;
        return prevTasks.filter(task => task.id !== id);
      }
      
      // Check if it's a subtask
      const newTasks = prevTasks.map(task => {
        if (task.subtasks?.some(subtask => subtask.id === id)) {
          deleted = true;
          return {
            ...task,
            subtasks: task.subtasks.filter(subtask => subtask.id !== id),
            updatedAt: new Date()
          };
        }
        return task;
      });
      
      return deleted ? newTasks : prevTasks;
    });
    
    // Remove task reference from projects
    if (deleted) {
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.tasks?.includes(id)) {
            return {
              ...project,
              tasks: project.tasks.filter(taskId => taskId !== id),
              updatedAt: new Date()
            };
          }
          return project;
        })
      );
      
      // Remove task reference from categories
      setCategories(prevCategories => 
        prevCategories.map(category => {
          if (category.tasks?.includes(id)) {
            return {
              ...category,
              tasks: category.tasks.filter(taskId => taskId !== id),
              updatedAt: new Date()
            };
          }
          return category;
        })
      );
    }
    
    return deleted;
  };

  // Project CRUD operations
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjects(prevProjects => [...prevProjects, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project | null => {
    let updatedProject: Project | null = null;

    setProjects(prevProjects => {
      const newProjects = prevProjects.map(project => {
        if (project.id === id) {
          updatedProject = { 
            ...project, 
            ...updates, 
            updatedAt: new Date() 
          };
          return updatedProject;
        }
        return project;
      });
      
      return newProjects;
    });

    return updatedProject;
  };

  const deleteProject = (id: string): boolean => {
    let deleted = false;
    
    setProjects(prevProjects => {
      if (prevProjects.some(project => project.id === id)) {
        deleted = true;
        return prevProjects.filter(project => project.id !== id);
      }
      return prevProjects;
    });
    
    // Update tasks that were in this project
    if (deleted) {
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.projectId === id) {
            return {
              ...task,
              projectId: undefined,
              updatedAt: new Date()
            };
          }
          return task;
        })
      );
    }
    
    return deleted;
  };

  // Category CRUD operations
  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category => {
    const newCategory: Category = {
      ...categoryData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCategories(prevCategories => [...prevCategories, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Category | null => {
    let updatedCategory: Category | null = null;

    setCategories(prevCategories => {
      const newCategories = prevCategories.map(category => {
        if (category.id === id) {
          updatedCategory = { 
            ...category, 
            ...updates, 
            updatedAt: new Date() 
          };
          return updatedCategory;
        }
        return category;
      });
      
      return newCategories;
    });

    return updatedCategory;
  };

  const deleteCategory = (id: string): boolean => {
    let deleted = false;
    
    setCategories(prevCategories => {
      if (prevCategories.some(category => category.id === id)) {
        deleted = true;
        return prevCategories.filter(category => category.id !== id);
      }
      return prevCategories;
    });
    
    // Update tasks that were in this category
    if (deleted) {
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.categoryId === id) {
            return {
              ...task,
              categoryId: undefined,
              updatedAt: new Date()
            };
          }
          return task;
        })
      );
    }
    
    return deleted;
  };

  // Query functions
  const getTaskById = (id: string): Task | undefined => {
    // First check top-level tasks
    const task = tasks.find(task => task.id === id);
    if (task) return task;
    
    // Then check subtasks
    for (const parentTask of tasks) {
      if (parentTask.subtasks) {
        const subtask = parentTask.subtasks.find(subtask => subtask.id === id);
        if (subtask) return subtask;
      }
    }
    
    return undefined;
  };

  const getTasksByProject = (projectId: string): Task[] => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getTasksByCategory = (categoryId: string): Task[] => {
    return tasks.filter(task => task.categoryId === categoryId);
  };

  const getProjectById = (id: string): Project | undefined => {
    return projects.find(project => project.id === id);
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(category => category.id === id);
  };

  // Reset all data (for testing or user reset)
  const resetAllData = () => {
    setTasks([]);
    setProjects([]);
    setCategories([]);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  };

  // Load sample data
  const loadSampleData = () => {
    // Sample categories
    const sampleCategories: Category[] = [
      {
        id: 'cat-1',
        title: 'Work',
        color: 'hsl(230, 65%, 60%)',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        title: 'Personal',
        color: 'hsl(330, 65%, 60%)',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-3',
        title: 'Health',
        color: 'hsl(145, 65%, 45%)',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Sample projects
    const sampleProjects: Project[] = [
      {
        id: 'proj-1',
        title: 'Website Redesign',
        description: 'Redesign the company website',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'proj-2',
        title: 'Home Renovation',
        description: 'Renovate the kitchen and bathroom',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

      // Sample tasks
      const sampleTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Create wireframes',
          description: 'Design wireframes for the new website',
          completed: false,
          dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
          projectId: 'proj-1',
          categoryId: 'cat-1',
          energyLevel: 'medium',
          activationEnergy: 'high',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          title: 'Research contractors',
          description: 'Find and contact potential contractors for the renovation',
          completed: false,
          dueDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
          projectId: 'proj-2',
          categoryId: 'cat-2',
          energyLevel: 'high',
          activationEnergy: 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-3',
          title: 'Daily exercise',
          description: '30 minutes of cardio',
          completed: false,
          categoryId: 'cat-3',
          energyLevel: 'high',
          activationEnergy: 'low',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

    // Update project and category task references
    sampleProjects[0].tasks = ['task-1'];
    sampleProjects[1].tasks = ['task-2'];
    
    sampleCategories[0].tasks = ['task-1'];
    sampleCategories[1].tasks = ['task-2'];
    sampleCategories[2].tasks = ['task-3'];

    // Set the sample data
    setCategories(sampleCategories);
    setProjects(sampleProjects);
    setTasks(sampleTasks);
  };

  return {
    // Data
    tasks,
    projects,
    categories,
    isLoaded,
    
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    getTasksByProject,
    getTasksByCategory,
    
    // Project operations
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    
    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    
    // Utility functions
    resetAllData,
    loadSampleData,
  };
};