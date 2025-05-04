import { z } from "zod";
import { apiFetch } from "../helpers/api-helper";
import { PROJECTS_ENDPOINT } from "../helpers/apiEndpoints";
import { loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorageManager";

// No input schema needed for a GET request without parameters
export const schema = z.object({});

export type OutputType = Array<{
  id: string;
  name: string;
  description: string | null;
}>;

export const getProjects = async (init?: RequestInit): Promise<OutputType> => {
  // If we're in the browser and localStorage has data, use that first to avoid fetch issues
  if (typeof window !== 'undefined') {
    const storedProjects = loadFromLocalStorage<OutputType>(STORAGE_KEYS.PROJECTS, []);
    if (storedProjects.length > 0) {
      console.log('Using localStorage for projects (prefetch)');
      return storedProjects;
    }
  }

  try {
    // Use the consistent endpoint from apiEndpoints
    console.log(`Fetching projects from ${PROJECTS_ENDPOINT}...`);
    
    try {
      const data = await apiFetch<OutputType>(PROJECTS_ENDPOINT, {
        method: "GET",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
      
      console.log(`Successfully fetched projects from ${PROJECTS_ENDPOINT}`);
      return data;
    } catch (fetchError) {
      console.error(`Failed to fetch from ${PROJECTS_ENDPOINT}:`, fetchError);
      
      // For demo purposes, fallback to local storage if API fails
      if (typeof window !== 'undefined') {
        try {
          const storedProjects = loadFromLocalStorage<OutputType>(STORAGE_KEYS.PROJECTS, []);
          if (storedProjects.length > 0) {
            console.log('Falling back to localStorage for projects');
            return storedProjects;
          }
        } catch (storageError) {
          console.error('Failed to load from localStorage:', storageError);
        }
      }
      
      // Return empty array as ultimate fallback
      return [];
    }
  } catch (error) {
    console.error('Error in getProjects:', error);
    return [];
  }
};