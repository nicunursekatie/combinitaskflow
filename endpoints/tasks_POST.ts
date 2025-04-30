import { db } from "../helpers/db";
import { tasks, taskCategories } from "../helpers/schema";
import { schema } from "./tasks_POST.schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const validatedData = schema.parse(json);
    
    const { categories: taskCategoryIds, ...taskData } = validatedData;
    
    // Determine if this is an update or create operation
    const isUpdate = !!taskData.id;
    
    if (isUpdate && taskData.id) {
      // Update existing task
      await db.update(tasks)
        .set({
          title: taskData.title,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          status: taskData.status,
          parentId: taskData.parentId,
          projectId: taskData.projectId,
          energyLevel: taskData.energyLevel,
          activationEnergy: taskData.activationEnergy,
        })
        .where(eq(tasks.id, taskData.id));
      
      // Handle categories if provided
      if (taskCategoryIds) {
        // Delete existing category associations
        await db.delete(taskCategories)
          .where(eq(taskCategories.taskId, taskData.id));
        
        // Add new category associations
        if (taskCategoryIds.length > 0) {
          await db.insert(taskCategories)
            .values(
              taskCategoryIds.map(categoryId => ({
                taskId: taskData.id!,
                categoryId
              }))
            );
        }
      }
      
      // Fetch the updated task with its relationships
      const updatedTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskData.id),
        with: {
          project: true,
          taskCategories: {
            with: {
              category: true
            }
          },
          tasks: true
        }
      });
      
      if (!updatedTask) {
        return Response.json({ message: "Task not found after update" }, { status: 404 });
      }
      
      // Transform the data to include categories directly
      const { taskCategories: taskCats, ...taskDetails } = updatedTask;
      const transformedTask = {
        ...taskDetails,
        categories: taskCats.map(tc => tc.category)
      };
      
      return Response.json(transformedTask);
      
    } else {
      // Create new task
      const newTaskId = taskData.id || uuidv4();
      
      await db.insert(tasks)
        .values({
          id: newTaskId,
          title: taskData.title,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          status: taskData.status,
          parentId: taskData.parentId,
          projectId: taskData.projectId,
          energyLevel: taskData.energyLevel,
          activationEnergy: taskData.activationEnergy,
        });
      
      // Add category associations if provided
      if (taskCategoryIds && taskCategoryIds.length > 0) {
        await db.insert(taskCategories)
          .values(
            taskCategoryIds.map(categoryId => ({
              taskId: newTaskId,
              categoryId
            }))
          );
      }
      
      // Fetch the newly created task with its relationships
      const newTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, newTaskId),
        with: {
          project: true,
          taskCategories: {
            with: {
              category: true
            }
          },
          tasks: true
        }
      });
      
      if (!newTask) {
        return Response.json({ message: "Failed to retrieve created task" }, { status: 500 });
      }
      
      // Transform the data to include categories directly
      const { taskCategories: taskCats, ...taskDetails } = newTask;
      const transformedTask = {
        ...taskDetails,
        categories: taskCats.map(tc => tc.category)
      };
      
      return Response.json(transformedTask, { status: 201 });
    }
    
  } catch (error: unknown) {
    console.error("Error creating/updating task:", error);
    return Response.json(
      { 
        message: "Failed to create or update task", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 400 }
    );
  }
}