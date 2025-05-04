import { z } from "zod";
import { apiFetch, isExtensionBlockingFetch } from "../helpers/api-helper";
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from "../lib/localStorageManager";
import { TASKS_POST_ENDPOINT } from "../helpers/apiEndpoints";

export const schema = z.object({
  id: z.string().optional(), // Optional for new tasks, required for updates
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().nullable().optional(),
  status: z.string().min(1, "Status is required"),
  parentId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  energyLevel: z.enum(["low", "medium", "high"]).optional(),
  activationEnergy: z.enum(["low", "medium", "high"]).optional(),
  categories: z.array(z.string()).optional() // Array of category IDs
});

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

export type OutputType = Task;

export const postTask = async (body: z.infer<typeof schema>, init?: RequestInit): Promise<OutputType> => {
  try {
    const validatedInput = schema.parse(body);
    
    // First, update in localStorage regardless of API success to ensure UI responsiveness
    let localStorageResult: OutputType | null = null;
    if (typeof window !== 'undefined') {
      localStorageResult = updateTaskInLocalStorage(validatedInput);
      console.log('Task updated in localStorage:', localStorageResult.id);
    }
    
    // Skip API attempt if extension is blocking
    if (typeof window !== 'undefined' && isExtensionBlockingFetch()) {
      console.warn('Detected extension blocking fetch, using localStorage directly for task update');
      return localStorageResult || createFallbackTask(validatedInput);
    }
    
    try {
      // Attempt API update (with multiple endpoint variations via apiFetch helper)
      console.log('Attempting to update task via API:', validatedInput.id);
      const data = await apiFetch<OutputType>(TASKS_POST_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(validatedInput),
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
      
      console.log('Successfully updated task via API:', data.id);
      return data;
    } catch (fetchError) {
      console.error(`Failed to send task update to API:`, fetchError);
      
      // We've already updated localStorage, so just return that result
      if (localStorageResult) {
        console.log('Using localStorage update as fallback');
        return localStorageResult;
      }
      
      // If we're not in a browser, return a minimal valid task as fallback
      return createFallbackTask(validatedInput);
    }
  } catch (error) {
    console.error('Error in postTask:', error);
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid task data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    // Even if we encounter an error, try to provide a meaningful response
    // so the UI doesn't break
    if (typeof window !== 'undefined' && body.id) {
      try {
        // Try to get the task from localStorage if it exists
        const tasks = loadFromLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
        const existingTask = tasks.find(t => t.id === body.id);
        if (existingTask) {
          return {
            ...existingTask,
            project: null,
            categories: [],
            tasks: []
          };
        }
      } catch (localStorageError) {
        console.error('Error fallback to localStorage:', localStorageError);
      }
    }
    
    throw error;
  }
};

/**
 * Updates a task in localStorage
 */
function updateTaskInLocalStorage(taskData: z.infer<typeof schema>, apiResponse?: OutputType): OutputType {
  try {
    // Load tasks from localStorage
    const tasks = loadFromLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    
    // If it's an update (has ID), find and update the task
    if (taskData.id) {
      const taskIndex = tasks.findIndex(t => t.id === taskData.id);
      
      if (taskIndex >= 0) {
        // Update the existing task
        const updatedTask = {
          ...tasks[taskIndex],
          title: taskData.title,
          dueDate: taskData.dueDate,
          status: taskData.status,
          parentId: taskData.parentId,
          projectId: taskData.projectId,
          energyLevel: taskData.energyLevel,
          activationEnergy: taskData.activationEnergy,
        };
        
        tasks[taskIndex] = updatedTask;
        
        // Save the updated tasks back to localStorage
        saveToLocalStorage(STORAGE_KEYS.TASKS, tasks);
        
        // If we have an API response, return that, otherwise return our updated task
        return apiResponse || {
          ...updatedTask,
          project: null,
          categories: [], // We don't have category details here
          tasks: [] // We don't have subtasks here
        };
      }
    }
    
    // If it's a new task or we couldn't find the task to update
    const newTask = createFallbackTask(taskData);
    
    // Add the new task to the array
    tasks.push(newTask);
    
    // Save the updated tasks back to localStorage
    saveToLocalStorage(STORAGE_KEYS.TASKS, tasks);
    
    return apiResponse || newTask;
  } catch (error) {
    console.error('Error updating task in localStorage:', error);
    return createFallbackTask(taskData);
  }
}

/**
 * Creates a minimal valid task from the input data
 */
function createFallbackTask(taskData: z.infer<typeof schema>): Task {
  return {
    id: taskData.id || `task-${Date.now()}`,
    title: taskData.title,
    dueDate: taskData.dueDate,
    status: taskData.status,
    parentId: taskData.parentId,
    projectId: taskData.projectId,
    energyLevel: taskData.energyLevel,
    activationEnergy: taskData.activationEnergy,
    project: null,
    categories: [],
    tasks: []
  };
}