import { z } from "zod";

export const schema = z.object({
  startDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "startDate must be a valid date string" }
  ),
  endDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "endDate must be a valid date string" }
  )
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"]
  }
);

export type TimeBlock = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  taskId: string | null;
  task?: {
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    parentId: string | null;
    projectId: string | null;
  } | null;
};

export type OutputType = TimeBlock[];

export const getTimeBlocks = async (
  params?: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const queryParams = new URLSearchParams();
  
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/_api/timeBlocks${queryString ? `?${queryString}` : ''}`;
  
  const result = await fetch(endpoint, {
    method: "GET",
    ...init,
    headers: {
      ...init?.headers,
    },
  });
  
  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.error || "Failed to fetch time blocks");
  }
  
  return result.json();
};