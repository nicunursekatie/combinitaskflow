/**
 * This file defines all the routes for the application
 * Use this for consistent navigation paths throughout the app
 */

export const ROUTES = {
  HOME: '/',
  TASKS: '/tasks',
  PROJECTS: '/projects',
  CATEGORIES: '/categories',
  CALENDAR: '/calendar',
  DAILY_PLANNER: '/daily-planner',
};

// Get the route name from a pathname
export function getRouteNameFromPath(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  
  // Convert path like '/tasks' to 'Tasks'
  return pathname.slice(1).split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
}