import { z } from "zod";
import { categories } from "../helpers/schema";

// No input schema needed for a GET request without parameters
export const schema = z.object({});

// Define the output type based on the categories table schema
export type OutputType = Array<{
  id: string;
  name: string;
  color: string;
}>;

export const getCategories = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/categories`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Failed to fetch categories");
  }
  
  return result.json();
};