import { db } from "../helpers/db";
import { categories } from "../helpers/schema";

export async function handle(request: Request) {
  try {
    // Fetch all categories from the database
    const allCategories = await db.query.categories.findMany();
    
    // Return the categories as JSON
    return Response.json(allCategories);
  } catch (error: unknown) {
    console.error("Error fetching categories:", error);
    return Response.json(
      { 
        message: "Failed to fetch categories", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}