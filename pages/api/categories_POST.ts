import { NextApiRequest, NextApiResponse } from 'next';
import { mockedCategories } from '../../mock-api-fix';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // In a real app, we would save the data to a database
  // For this demo, we'll just return what was sent
  const category = req.body;
  
  // If the category doesn't have an ID, generate one
  if (!category.id) {
    category.id = `cat-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  // Return the category as if it was saved successfully
  res.status(200).json(category);
}