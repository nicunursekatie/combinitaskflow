import { db } from "../../helpers/db";
import { categories } from "../../helpers/schema";
import { schema } from "./delete_POST.schema";
import { eq } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    if (!process.env.TASK_MANAGER_DATABASE_CONNECTION_STRING) {
      throw new Error("Database connection string is not set");
    }

    const json = await request.json();
    const validatedData = schema.parse(json);
    
    // Check if category exists before attempting to delete
    const existingCategory = await db.query.categories.findFirst({
      where: (categories, { eq: eqFunc }) => eqFunc(categories.id, validatedData.categoryId)
    });
    
    if (!existingCategory) {
      return Response.json(
        { message: `Category with ID ${validatedData.categoryId} not found` },
        { status: 404 }
      );
    }
    
    // Delete the category
    await db
      .delete(categories)
      .where(eq(categories.id, validatedData.categoryId));
    
    return Response.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete category" 
      },
      { status: 400 }
    );
  }
}