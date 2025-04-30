import { db } from "../helpers/db";
import { projects } from "../helpers/schema";
import { schema } from "./projects_POST.schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    if (!process.env.TASK_MANAGER_DATABASE_CONNECTION_STRING) {
      throw new Error("Database connection string is not set");
    }

    const json = await request.json();
    const validatedData = schema.parse(json);
    
    // Check if we're updating or creating
    if (validatedData.id) {
      // Update existing project
      const existingProject = await db.query.projects.findFirst({
        where: (projects, { eq: eqFunc }) => eqFunc(projects.id, validatedData.id as string)
      });
      
      if (!existingProject) {
        return Response.json(
          { message: `Project with ID ${validatedData.id} not found` },
          { status: 404 }
        );
      }
      
      await db
        .update(projects)
        .set({
          name: validatedData.name,
          description: validatedData.description
        })
        .where(eq(projects.id, validatedData.id));
      
      return Response.json({
        id: validatedData.id,
        name: validatedData.name,
        description: validatedData.description
      });
    } else {
      // Create new project
      const newId = uuidv4();
      
      await db.insert(projects).values({
        id: newId,
        name: validatedData.name,
        description: validatedData.description
      });
      
      return Response.json({
        id: newId,
        name: validatedData.name,
        description: validatedData.description
      });
    }
  } catch (error) {
    console.error("Error creating/updating project:", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "Failed to create/update project" },
      { status: 400 }
    );
  }
}