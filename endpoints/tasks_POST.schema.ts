import { z } from "zod";

export const schema = z.object({
  id: z.string().optional(), // Optional for new tasks, required for updates
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().nullable().optional(),
  status: z.string().min(1, "Status is required"),
  parentId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  energyLevel: z.enum(["low", "medium", "high"]).optional(),
  activationEnergy: z.enum(["low", "medium", "high"]).optional(),
  categories: z.array(z.string()).optional() // Array of category IDs
});

export type TaskCategory = {
  id: string;
  name: string;
  color: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
};

export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  parentId: string | null;
  projectId: string | null;
  energyLevel?: "low" | "medium" | "high";
  activationEnergy?: "low" | "medium" | "high";
  project: Project | null;
  categories: TaskCategory[];
  tasks: Task[]; // Subtasks
};

export type OutputType = Task;

export const postTask = async (body: z.infer<typeof schema>, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tasks`, {
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
    throw new Error(errorData.message || "Failed to create or update task");
  }
  
  return result.json();
};