import { NextApiRequest, NextApiResponse } from 'next';
import { mockedProjects } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return mock data for demo purposes
  res.status(200).json(mockedProjects);
}