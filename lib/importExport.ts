import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS, saveToLocalStorage, clearAllData } from './localStorageManager';

// Types for the data structures - simplified versions
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date | null;
  projectId?: string;
  categoryId?: string;
  parentTaskId?: string;
  energyLevel?: 'low' | 'medium' | 'high';
  activationEnergy?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  title: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Format for export data
export interface ExportDataFormat {
  version: string;
  timestamp: string;
  tasks: Task[];
  projects: Project[];
  categories: Category[];
}

/**
 * Validates an imported task
 */
function validateTask(task: any): Task {
  return {
    id: task.id || uuidv4(),
    title: task.title || 'Untitled Task',
    description: task.description,
    completed: Boolean(task.completed),
    dueDate: task.dueDate ? new Date(task.dueDate) : null,
    projectId: task.projectId,
    categoryId: task.categoryId,
    parentTaskId: task.parentTaskId,
    energyLevel: task.energyLevel,
    activationEnergy: task.activationEnergy,
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
  };
}

/**
 * Validates an imported project
 */
function validateProject(project: any): Project {
  return {
    id: project.id || uuidv4(),
    title: project.title || 'Untitled Project',
    description: project.description,
    createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
    updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
  };
}

/**
 * Validates an imported category
 */
function validateCategory(category: any): Category {
  return {
    id: category.id || uuidv4(),
    title: category.title || 'Untitled Category',
    color: category.color || '#808080',
    createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
    updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
  };
}

/**
 * Export task data to a JSON string
 */
export function exportData(
  tasks: Task[],
  projects: Project[],
  categories: Category[]
): string {
  const exportData: ExportDataFormat = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    tasks,
    projects,
    categories
  };
  
  return JSON.stringify(exportData, (key, value) => {
    // Handle Date objects for serialization
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
}

/**
 * Import task data from a JSON string and save directly to localStorage
 */
export function importData(jsonString: string): ExportDataFormat {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate the imported data structure
    if (!data.tasks || !data.projects || !data.categories) {
      throw new Error('Invalid data format: Missing required fields');
    }
    
    // Validate and clean up the data
    const cleanedData = {
      version: data.version || '1.0',
      timestamp: data.timestamp || new Date().toISOString(),
      tasks: Array.isArray(data.tasks) ? data.tasks.map(validateTask) : [],
      projects: Array.isArray(data.projects) ? data.projects.map(validateProject) : [],
      categories: Array.isArray(data.categories) ? data.categories.map(validateCategory) : [],
    };
    
    return cleanedData;
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data. The file format is invalid.');
  }
}

/**
 * Save imported data directly to localStorage
 */
export function saveImportedData(importedData: ExportDataFormat): boolean {
  try {
    // Clear existing data first
    clearAllData();
    
    // Save imported data
    saveToLocalStorage(STORAGE_KEYS.TASKS, importedData.tasks);
    saveToLocalStorage(STORAGE_KEYS.PROJECTS, importedData.projects);
    saveToLocalStorage(STORAGE_KEYS.CATEGORIES, importedData.categories);
    
    return true;
  } catch (error) {
    console.error('Error saving imported data:', error);
    return false;
  }
}

/**
 * Generate a file name for the export with date and time
 */
export function generateExportFileName(): string {
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0];
  const formattedTime = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  return `taskflow-export-${formattedDate}-${formattedTime}.json`;
}