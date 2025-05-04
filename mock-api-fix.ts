// This file will mock the API endpoints for local development
// Since this is a demo app, we're just creating the necessary stubs for our endpoints

export const mockedTasks = [
  {
    id: 'task-1',
    title: 'Create wireframes',
    status: 'pending',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    parentId: null,
    projectId: 'proj-1',
    energyLevel: 'medium',
    activationEnergy: 'high',
    categories: [{ id: 'cat-1' }],
  },
  {
    id: 'task-2',
    title: 'Research contractors',
    status: 'pending',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    parentId: null,
    projectId: 'proj-2',
    energyLevel: 'high',
    activationEnergy: 'medium',
    categories: [{ id: 'cat-2' }],
  },
  {
    id: 'task-3',
    title: 'Daily exercise',
    status: 'pending',
    dueDate: null,
    parentId: null,
    projectId: null,
    energyLevel: 'high',
    activationEnergy: 'low',
    categories: [{ id: 'cat-3' }],
  },
];

export const mockedProjects = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Redesign the company website',
  },
  {
    id: 'proj-2',
    name: 'Home Renovation',
    description: 'Renovate the kitchen and bathroom',
  },
];

export const mockedCategories = [
  {
    id: 'cat-1',
    name: 'Work',
    color: 'hsl(230, 65%, 60%)',
  },
  {
    id: 'cat-2',
    name: 'Personal',
    color: 'hsl(330, 65%, 60%)',
  },
  {
    id: 'cat-3',
    name: 'Health',
    color: 'hsl(145, 65%, 45%)',
  },
];