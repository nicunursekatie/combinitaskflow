import { NextApiRequest, NextApiResponse } from 'next';
import { mockedTasks } from '../../mock-api-fix';

// This file will handle all variations of the tasks API
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the full path
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  // Parse the path to extract the endpoint
  // Handle paths like /_api/tasks/
  if (pathname.includes('/_api/tasks') || pathname.includes('/api/tasks')) {
    if (req.method === 'GET') {
      res.status(200).json(mockedTasks);
    } else if (req.method === 'POST') {
      const task = req.body;
      
      // If the task doesn't have an ID, generate one
      if (!task.id) {
        task.id = `task-${Math.random().toString(36).substring(2, 10)}`;
      }
      
      // Return the task as if it was saved successfully
      res.status(200).json(task);
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
    return;
  }
  
  // If no handler matched, return 404
  res.status(404).json({ error: 'Not Found' });
}