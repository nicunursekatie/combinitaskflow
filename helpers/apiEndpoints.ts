/**
 * This helper file contains all the API endpoint paths used in the application.
 * This ensures consistency and makes it easy to update all endpoint URLs in one place.
 */

// Base API URL - adjust this if needed
export const API_BASE_URL = '/api';  // Use this for Next.js API routes

// Task endpoints
export const TASKS_ENDPOINT = `${API_BASE_URL}/tasks`;
export const TASKS_POST_ENDPOINT = `${API_BASE_URL}/tasks_POST`;

// Project endpoints
export const PROJECTS_ENDPOINT = `${API_BASE_URL}/projects`;
export const PROJECTS_POST_ENDPOINT = `${API_BASE_URL}/projects_POST`;
export const PROJECT_DELETE_ENDPOINT = `${API_BASE_URL}/projects/delete_POST`;

// Category endpoints
export const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;
export const CATEGORIES_POST_ENDPOINT = `${API_BASE_URL}/categories_POST`;
export const CATEGORY_DELETE_ENDPOINT = `${API_BASE_URL}/categories/delete_POST`;

// TimeBlock endpoints
export const TIMEBLOCKS_ENDPOINT = `${API_BASE_URL}/timeBlocks`;
export const TIMEBLOCKS_POST_ENDPOINT = `${API_BASE_URL}/timeBlocks_POST`;
export const TIMEBLOCK_DELETE_ENDPOINT = `${API_BASE_URL}/timeBlocks/delete_POST`;

/**
 * Helper function to ensure API URLs are formatted correctly
 * This converts any /_api/ prefixes to /api/ for compatibility with Next.js
 */
export function fixApiPath(path: string): string {
  // Replace /_api/ with /api/
  if (path.startsWith('/_api/')) {
    return '/api/' + path.slice(6);
  }
  return path;
}