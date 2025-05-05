import { NextApiRequest, NextApiResponse } from 'next';
import { mockedProjects } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Parse the request body if it's a string
    const project = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // If the project doesn't have an ID, generate one
    if (!project.id) {
      project.id = `proj-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Return the project as if it was saved successfully
    res.status(200).json(project);
  } catch (error) {
    console.error('Error processing project update:', error);
    res.status(400).json({ error: 'Invalid project data format' });
  }
}