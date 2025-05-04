/**
 * A simple utility for managing localStorage data
 */

// Storage keys
export const STORAGE_KEYS = {
  TASKS: 'tasks',
  PROJECTS: 'projects',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
};

// Save data to localStorage with error handling
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

// Load data from localStorage with error handling
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    
    return JSON.parse(value, (k, v) => {
      // Handle date strings for specific properties known to be dates
      if (typeof v === 'string' && 
          (k === 'dueDate' || k === 'createdAt' || k === 'updatedAt')) {
        return new Date(v);
      }
      return v;
    });
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

// Clear all app data from localStorage
export function clearAllData(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

// Date reviver function for JSON parse
export function dateReviver(key: string, value: any): any {
  // Convert date strings back to Date objects
  if (typeof value === 'string' && 
      (key === 'dueDate' || key === 'createdAt' || key === 'updatedAt')) {
    return value ? new Date(value) : undefined;
  }
  return value;
}

// Improved localStorage implementation that handles dates
export function loadFromLocalStorageWithDates<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    
    if (!value) return defaultValue;
    
    const data = JSON.parse(value, dateReviver);
    return data;
  } catch (error) {
    console.error(`Error loading from localStorage with dates (${key}):`, error);
    return defaultValue;
  }
}