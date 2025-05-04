import { NextApiRequest, NextApiResponse } from 'next';
import { mockedProjects } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return the mock projects
  res.status(200).json(mockedProjects);
}