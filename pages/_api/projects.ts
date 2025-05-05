import { NextApiRequest, NextApiResponse } from 'next';
import { mockedProjects } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  // Return the mock projects
  res.status(200).json(mockedProjects);
}