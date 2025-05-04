import { NextApiRequest, NextApiResponse } from 'next';
import { mockedTasks } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return the mock tasks
  res.status(200).json(mockedTasks);
}