import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple health check API route
 * Used to validate if fetch requests are working properly
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}