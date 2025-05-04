import { z } from "zod";
import { apiFetch } from "../helpers/api-helper";
import { TASKS_ENDPOINT } from "../helpers/apiEndpoints";
import { loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorageManager";

// No input schema needed for a GET request without parameters

export type TaskCategory = {
  id: string;
  name: string;
  color: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
};

export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  parentId: string | null;
  projectId: string | null;
  energyLevel?: "low" | "medium" | "high";
  activationEnergy?: "low" | "medium" | "high";
  project: Project | null;
  categories: TaskCategory[];
  tasks: Task[]; // Subtasks
};

export type OutputType = Task[];

export const getTasks = async (init?: RequestInit): Promise<OutputType> => {
  // If we're in the browser and localStorage has data, use that first to avoid fetch issues
  if (typeof window !== 'undefined') {
    const storedTasks = loadFromLocalStorage<OutputType>(STORAGE_KEYS.TASKS, []);
    if (storedTasks.length > 0) {
      console.log('Using localStorage for tasks (prefetch)');
      return storedTasks;
    }
  }
  
  try {
    // Use the consistent endpoint from apiEndpoints
    console.log(`Fetching tasks from ${TASKS_ENDPOINT}...`);
    
    try {
      const data = await apiFetch<OutputType>(TASKS_ENDPOINT, {
        method: "GET",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
      
      console.log(`Successfully fetched tasks from ${TASKS_ENDPOINT}`);
      return data;
    } catch (fetchError) {
      console.error(`Failed to fetch from ${TASKS_ENDPOINT}:`, fetchError);
      
      // For demo purposes, fallback to local storage if API fails
      if (typeof window !== 'undefined') {
        try {
          const storedTasks = loadFromLocalStorage<OutputType>(STORAGE_KEYS.TASKS, []);
          if (storedTasks.length > 0) {
            console.log('Falling back to localStorage for tasks');
            return storedTasks;
          }
        } catch (storageError) {
          console.error('Failed to load from localStorage:', storageError);
        }
      }
      
      // Return empty array as ultimate fallback
      return [];
    }
  } catch (error) {
    console.error('Error in getTasks:', error);
    return [];
  }
};