import { db } from "../helpers/db";
import { timeBlocks } from "../helpers/schema";
import { schema } from "./timeBlocks_POST.schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const validatedData = schema.parse(json);
    
    // Check if we're updating an existing time block or creating a new one
    if (validatedData.id) {
      // Update existing time block
      const existingTimeBlock = await db.query.timeBlocks.findFirst({
        where: eq(timeBlocks.id, validatedData.id)
      });
      
      if (!existingTimeBlock) {
        return Response.json(
          { error: `Time block with ID ${validatedData.id} not found` },
          { status: 404 }
        );
      }
      
      const updatedTimeBlock = await db
        .update(timeBlocks)
        .set({
          title: validatedData.title,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          date: validatedData.date,
          taskId: validatedData.taskId === null ? null : validatedData.taskId || null
        })
        .where(eq(timeBlocks.id, validatedData.id))
        .returning();
      
      return Response.json(updatedTimeBlock[0]);
    } else {
      // Create new time block
      const newTimeBlock = await db
        .insert(timeBlocks)
        .values({
          id: uuidv4(),
          title: validatedData.title,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          date: validatedData.date,
          taskId: validatedData.taskId === null ? null : validatedData.taskId || null
        })
        .returning();
      
      return Response.json(newTimeBlock[0]);
    }
  } catch (error) {
    console.error("Error processing time block:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 400 }
    );
  }
}