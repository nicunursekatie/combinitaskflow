import { db } from "../helpers/db";
import { projects } from "../helpers/schema";

export async function handle(request: Request) {
  try {
    if (!process.env.TASK_MANAGER_DATABASE_CONNECTION_STRING) {
      throw new Error("Database connection string is not set");
    }

    const allProjects = await db.query.projects.findMany();
    
    return Response.json(allProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500 }
    );
  }
}