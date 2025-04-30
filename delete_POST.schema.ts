import { z } from "zod";

export const schema = z.object({
  categoryId: z.string().min(1, "Category ID is required")
});

export type OutputType = {
  success: boolean;
  message: string;
};

export const deleteCategory = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  
  const result = await fetch(`/_api/categories/delete`, {
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
    throw new Error(errorData.message || "Failed to delete category");
  }
  
  return result.json();
};