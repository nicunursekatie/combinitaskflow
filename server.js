const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Sample API mocks
const mockedTasks = [
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

const mockedProjects = [
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

const mockedCategories = [
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

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Handle API routes
    if (pathname === '/_api/tasks/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockedTasks));
      return;
    }

    if (pathname === '/_api/projects/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockedProjects));
      return;
    }

    if (pathname === '/_api/categories/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockedCategories));
      return;
    }

    // Handle POST requests
    if (pathname === '/_api/tasks' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const task = JSON.parse(body);
        if (!task.id) {
          task.id = `task-${Math.random().toString(36).substring(2, 10)}`;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(task));
      });
      return;
    }

    if (pathname === '/_api/projects' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const project = JSON.parse(body);
        if (!project.id) {
          project.id = `proj-${Math.random().toString(36).substring(2, 10)}`;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(project));
      });
      return;
    }

    if (pathname === '/_api/categories' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const category = JSON.parse(body);
        if (!category.id) {
          category.id = `cat-${Math.random().toString(36).substring(2, 10)}`;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(category));
      });
      return;
    }

    // Let Next.js handle everything else
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});