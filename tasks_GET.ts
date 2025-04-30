import { db } from "../helpers/db";
import { tasks, taskCategories, categories, projects } from "../helpers/schema";
import { eq } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    // Fetch all tasks with their relationships
    const allTasks = await db.query.tasks.findMany({
      with: {
        project: true,
        taskCategories: {
          with: {
            category: true
          }
        },
        tasks: true // Get subtasks
      }
    });

    // Transform the data to include categories directly on tasks
    const transformedTasks = allTasks.map(task => {
      const { taskCategories, ...taskData } = task;
      return {
        ...taskData,
        categories: taskCategories.map(tc => tc.category)
      };
    });

    return Response.json(transformedTasks);
  } catch (error: unknown) {
    console.error("Error fetching tasks:", error);
    return Response.json(
      { 
        message: "Failed to fetch tasks", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}