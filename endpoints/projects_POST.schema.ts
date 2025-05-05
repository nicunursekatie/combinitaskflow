import { z } from "zod";

export const schema = z.object({
  id: z.string().optional(), // Optional for creation, required for updates
  name: z.string().min(1, "Project name is required"),
  description: z.string().nullable().optional()
});

export type OutputType = {
  id: string;
  name: string;
  description: string | null;
};

export const postProjects = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  
  const result = await fetch(`/api/projects_POST`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  if (!result.ok) {
    try {
      const errorData = await result.json();
      throw new Error(errorData.message || "Failed to create/update project");
    } catch (jsonError) {
      throw new Error(`Failed to create/update project: ${result.statusText}`);
    }
  }
  
  return result.json();
};