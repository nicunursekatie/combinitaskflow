import { z } from "zod";

// No input schema needed for a GET request without parameters
export const schema = z.object({});

export type OutputType = Array<{
  id: string;
  name: string;
  description: string | null;
}>;

export const getProjects = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/projects`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Failed to fetch projects");
  }
  
  return result.json();
};