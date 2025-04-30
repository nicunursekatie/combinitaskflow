import { z } from "zod";

export const schema = z.object({
  id: z.string().optional(), // Optional for new time blocks, required for updates
  title: z.string().min(1, "Title is required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Date must be a valid date string"
  }),
  taskId: z.string().nullable().optional()
}).refine(
  (data) => {
    // Ensure end time is after start time
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    
    if (startHour > endHour) return false;
    if (startHour === endHour && startMinute >= endMinute) return false;
    
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

export type TimeBlock = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  taskId: string | null;
};

export type OutputType = TimeBlock;

export const postTimeBlock = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  
  const result = await fetch(`/_api/timeBlocks`, {
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
    throw new Error(errorData.error || "Failed to create or update time block");
  }
  
  return result.json();
};