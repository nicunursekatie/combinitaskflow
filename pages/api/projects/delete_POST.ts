import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // In a real app, we would delete from a database
  // For this demo, we'll just return success
  const { projectId } = req.body;
  
  // Return a success response
  res.status(200).json({ success: true, projectId });
}