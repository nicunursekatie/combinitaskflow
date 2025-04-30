import { z } from "zod";

export const schema = z.object({
  id: z.string().optional(), // Optional for new categories, required for updates
  name: z.string().min(1, "Category name is required"),
  color: z.string().min(1, "Color is required")
});

export type OutputType = {
  id: string;
  name: string;
  color: string;
};

export const postCategory = async (
  body: z.infer<typeof schema>, 
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  
  const result = await fetch(`/_api/categories`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Failed to create or update category");
  }
  
  return result.json();
};