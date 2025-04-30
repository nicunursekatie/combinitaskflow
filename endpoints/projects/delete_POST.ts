import { db } from "../../helpers/db";
import { projects } from "../../helpers/schema";
import { schema } from "../../delete_POST.schema";
import { eq } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    if (!process.env.TASK_MANAGER_DATABASE_CONNECTION_STRING) {
      throw new Error("Database connection string is not set");
    }

    const json = await request.json();
    const validatedData = schema.parse(json);
    
    // Check if project exists before attempting to delete
    const existingProject = await db.query.projects.findFirst({
      where: (projects, { eq: eqFunc }) => eqFunc(projects.id, validatedData.projectId)
    });
    
    if (!existingProject) {
      return Response.json(
        { message: `Project with ID ${validatedData.projectId} not found` },
        { status: 404 }
      );
    }
    
    // Delete the project
    await db
      .delete(projects)
      .where(eq(projects.id, validatedData.projectId));
    
    return Response.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return Response.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete project" 
      },
      { status: 400 }
    );
  }
}