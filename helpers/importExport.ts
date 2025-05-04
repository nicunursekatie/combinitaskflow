import { Task, Project, Category } from './TaskStorage';

/**
 * Interface for exported data format
 */
export interface ExportDataFormat {
  version: string;
  timestamp: string;
  tasks: Task[];
  projects: Project[];
  categories: Category[];
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
 * Import task data from a JSON string
 */
export function importData(jsonString: string): ExportDataFormat {
  try {
    const data = JSON.parse(jsonString, (key, value) => {
      // Convert date strings back to Date objects
      if (
        typeof value === 'string' &&
        (key === 'dueDate' || key === 'createdAt' || key === 'updatedAt') &&
        value
      ) {
        return new Date(value);
      }
      return value;
    });
    
    // Validate the imported data structure
    if (!data.tasks || !data.projects || !data.categories) {
      throw new Error('Invalid data format: Missing required fields');
    }
    
    return data;
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data. The file format is invalid.');
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