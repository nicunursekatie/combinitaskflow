import { z } from "zod";

// No input schema needed for a GET request without parameters

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

export type OutputType = Task[];

export const getTasks = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/tasks`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  
  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Failed to fetch tasks");
  }
  
  return result.json();
};