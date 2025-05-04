import { NextApiRequest, NextApiResponse } from 'next';
import { mockedCategories } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return the mock categories
  res.status(200).json(mockedCategories);
}