import { db } from "../helpers/db";
import { timeBlocks } from "../helpers/schema";
import { schema } from "./timeBlocks_GET.schema";
import { and, gte, lte } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    // Parse URL to get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    
    // Validate query parameters
    const validatedParams = schema.parse({
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
    
    // Build query conditions
    let conditions = [];
    
    if (validatedParams.startDate) {
      conditions.push(gte(timeBlocks.date, validatedParams.startDate));
    }
    
    if (validatedParams.endDate) {
      conditions.push(lte(timeBlocks.date, validatedParams.endDate));
    }
    
    // Query the database
    const result = conditions.length > 0
      ? await db.query.timeBlocks.findMany({
          where: and(...conditions),
          with: {
            task: true
          }
        })
      : await db.query.timeBlocks.findMany({
          with: {
            task: true
          }
        });
    
    return Response.json(result);
  } catch (error) {
    console.error("Error fetching time blocks:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 400 }
    );
  }
}