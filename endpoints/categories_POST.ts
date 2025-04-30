import { schema } from "./categories_POST.schema";
import { db } from "../helpers/db";
import { categories } from "../helpers/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const validatedData = schema.parse(json);
    
    // Check if we're updating an existing category or creating a new one
    if (validatedData.id) {
      // Update existing category
      const updatedCategory = await db
        .update(categories)
        .set({
          name: validatedData.name,
          color: validatedData.color
        })
        .where(eq(categories.id, validatedData.id))
        .returning();
      
      if (updatedCategory.length === 0) {
        return Response.json(
          { message: `Category with ID ${validatedData.id} not found` },
          { status: 404 }
        );
      }
      
      return Response.json(updatedCategory[0]);
    } else {
      // Create new category with a generated UUID
      const newCategoryId = uuidv4();
      const newCategory = await db
        .insert(categories)
        .values({
          id: newCategoryId,
          name: validatedData.name,
          color: validatedData.color
        })
        .returning();
      
      return Response.json(newCategory[0], { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error processing category:", error);
    return Response.json(
      { 
        message: "Failed to process category", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 400 }
    );
  }
}