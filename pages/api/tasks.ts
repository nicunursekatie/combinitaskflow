import { NextApiRequest, NextApiResponse } from 'next';
import { mockedTasks } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return mock data for demo purposes
  res.status(200).json(mockedTasks);
}