import { z } from "zod";
import { categories } from "../helpers/schema";
import { apiFetch } from "../helpers/api-helper";
import { CATEGORIES_ENDPOINT } from "../helpers/apiEndpoints";
import { loadFromLocalStorage, STORAGE_KEYS } from "../lib/localStorageManager";

// No input schema needed for a GET request without parameters
export const schema = z.object({});

// Define the output type based on the categories table schema
export type OutputType = Array<{
  id: string;
  name: string;
  color: string;
}>;

export const getCategories = async (init?: RequestInit): Promise<OutputType> => {
  // If we're in the browser and localStorage has data, use that first to avoid fetch issues
  if (typeof window !== 'undefined') {
    const storedCategories = loadFromLocalStorage<OutputType>(STORAGE_KEYS.CATEGORIES, []);
    if (storedCategories.length > 0) {
      console.log('Using localStorage for categories (prefetch)');
      return storedCategories;
    }
  }

  try {
    // Use the consistent endpoint from apiEndpoints
    console.log(`Fetching categories from ${CATEGORIES_ENDPOINT}...`);
    
    try {
      const data = await apiFetch<OutputType>(CATEGORIES_ENDPOINT, {
        method: "GET",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
      
      console.log(`Successfully fetched categories from ${CATEGORIES_ENDPOINT}`);
      return data;
    } catch (fetchError) {
      console.error(`Failed to fetch from ${CATEGORIES_ENDPOINT}:`, fetchError);
      
      // For demo purposes, fallback to local storage if API fails
      if (typeof window !== 'undefined') {
        try {
          const storedCategories = loadFromLocalStorage<OutputType>(STORAGE_KEYS.CATEGORIES, []);
          if (storedCategories.length > 0) {
            console.log('Falling back to localStorage for categories');
            return storedCategories;
          }
        } catch (storageError) {
          console.error('Failed to load from localStorage:', storageError);
        }
      }
      
      // Return empty array as ultimate fallback
      return [];
    }
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
};