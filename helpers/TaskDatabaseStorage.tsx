import { useState, useEffect, useCallback } from 'react';
import { db } from './db';
import {
  tasks as tasksTable,
  projects as projectsTable,
  categories as categoriesTable,
  taskCategories as taskCategoriesTable,
} from './schema';
import type {
  Task as LocalTask,
  Project as LocalProject,
  Category as LocalCategory,
} from './TaskStorage';

// Utility to generate IDs
const generateId = (): string =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// This helper provides the same interface as useTaskStorage but backed by PostgreSQL
export function TaskDatabaseStorage() {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all data from the database and normalize into local shapes
  const loadData = useCallback(async () => {
    // Fetch raw rows
    const dbTasks = await db.select().from(tasksTable);
    const dbProjects = await db.select().from(projectsTable);
    const dbCategories = await db.select().from(categoriesTable);
    const dbTaskCategories = await db.select().from(taskCategoriesTable);

    // Build task map
    const taskMap: Record<string, LocalTask> = {};
    dbTasks.forEach(row => {
      taskMap[row.id] = {
        id: row.id,
        title: row.title,
        description: undefined,
        completed: row.status === 'completed',
        dueDate: row.dueDate ?? undefined,
        projectId: row.projectId ?? undefined,
        categoryId: undefined, // to be filled from join
        parentTaskId: row.parentId ?? undefined,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Assign categoryId and subtasks
    dbTaskCategories.forEach(rel => {
      const t = taskMap[rel.taskId];
      if (t) {
        t.categoryId = rel.categoryId;
      }
    });
    Object.values(taskMap).forEach(t => {
      if (t.parentTaskId) {
        const parent = taskMap[t.parentTaskId];
        if (parent) parent.subtasks!.push(t);
      }
    });
    const topLevelTasks = Object.values(taskMap).filter(t => !t.parentTaskId);

    // Build projects
    const projList: LocalProject[] = dbProjects.map(row => ({
      id: row.id,
      title: row.name,
      description: row.description ?? undefined,
      tasks: dbTasks
        .filter(t => t.projectId === row.id)
        .map(t => t.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Build categories
    const catList: LocalCategory[] = dbCategories.map(row => ({
      id: row.id,
      title: row.name,
      color: row.color,
      tasks: dbTaskCategories
        .filter(rel => rel.categoryId === row.id)
        .map(rel => rel.taskId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    setTasks(topLevelTasks);
    setProjects(projList);
    setCategories(catList);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadData().catch(console.error);
  }, [loadData]);

  // CRUD and query operations
  const addTask = useCallback(
    async (
      data: Omit<
        LocalTask,
        'id' | 'createdAt' | 'updatedAt' | 'subtasks'
      >
    ): Promise<LocalTask> => {
      const id = generateId();
      await db
        .insert(tasksTable)
        .values({
          id,
          title: data.title,
          dueDate: data.dueDate ?? null,
          status: data.completed ? 'completed' : 'pending',
          parentId: data.parentTaskId ?? null,
          projectId: data.projectId ?? null,
        });
      if (data.categoryId) {
        await db
          .insert(taskCategoriesTable)
          .values({ taskId: id, categoryId: data.categoryId });
      }
      await loadData();
      const created = tasks.find(t => t.id === id);
      if (!created) {
        // fallback: construct minimal LocalTask
        return {
          id,
          title: data.title,
          description: undefined,
          completed: data.completed,
          dueDate: data.dueDate,
          projectId: data.projectId,
          categoryId: data.categoryId,
          parentTaskId: data.parentTaskId,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return created;
    },
    [loadData, tasks]
  );

  const updateTask = useCallback(
    async (
      id: string,
      updates: Partial<
        Omit<LocalTask, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>
      >
    ): Promise<LocalTask | null> => {
      const row = await db
        .update(tasksTable)
        .set({
          title: updates.title,
          dueDate:
            updates.dueDate !== undefined ? updates.dueDate : undefined,
          status:
            updates.completed !== undefined
              ? updates.completed
                ? 'completed'
                : 'pending'
              : undefined,
          projectId:
            updates.projectId !== undefined
              ? updates.projectId
              : undefined,
          parentId:
            updates.parentTaskId !== undefined
              ? updates.parentTaskId
              : undefined,
        })
        .where(tasksTable.id.eq(id))
        .returning();
      if (updates.categoryId !== undefined) {
        // clear old
        await db
          .delete(taskCategoriesTable)
          .where(taskCategoriesTable.taskId.eq(id));
        if (updates.categoryId) {
          await db
            .insert(taskCategoriesTable)
            .values({ taskId: id, categoryId: updates.categoryId });
        }
      }
      await loadData();
      return getTaskById(id);
    },
    [loadData]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      await db
        .delete(tasksTable)
        .where(tasksTable.id.eq(id));
      await loadData();
      return true;
    },
    [loadData]
  );

  const addProject = useCallback(
    async (
      data: Omit<LocalProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>
    ): Promise<LocalProject> => {
      const id = generateId();
      await db
        .insert(projectsTable)
        .values({
          id,
          name: data.title,
          description: data.description ?? null,
        });
      await loadData();
      return getProjectById(id)!;
    },
    [loadData]
  );

  const updateProject = useCallback(
    async (
      id: string,
      updates: Partial<
        Omit<LocalProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>
      >
    ): Promise<LocalProject | null> => {
      await db
        .update(projectsTable)
        .set({
          name: updates.title,
          description: updates.description ?? undefined,
        })
        .where(projectsTable.id.eq(id));
      await loadData();
      return getProjectById(id);
    },
    [loadData]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      await db
        .delete(projectsTable)
        .where(projectsTable.id.eq(id));
      await loadData();
      return true;
    },
    [loadData]
  );

  const addCategory = useCallback(
    async (
      data: Omit<
        LocalCategory,
        'id' | 'createdAt' | 'updatedAt' | 'tasks'
      >
    ): Promise<LocalCategory> => {
      const id = generateId();
      await db
        .insert(categoriesTable)
        .values({
          id,
          name: data.title,
          color: data.color,
        });
      await loadData();
      return getCategoryById(id)!;
    },
    [loadData]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      updates: Partial<
        Omit<LocalCategory, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>
      >
    ): Promise<LocalCategory | null> => {
      await db
        .update(categoriesTable)
        .set({
          name: updates.title,
          color: updates.color,
        })
        .where(categoriesTable.id.eq(id));
      await loadData();
      return getCategoryById(id);
    },
    [loadData]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      await db
        .delete(categoriesTable)
        .where(categoriesTable.id.eq(id));
      await loadData();
      return true;
    },
    [loadData]
  );

  // Query functions (sync from local state)
  const getTaskById = useCallback(
    (id: string): LocalTask | undefined =>
      tasks.find(t => t.id === id) ||
      tasks
        .flatMap(t => t.subtasks || [])
        .find(st => st.id === id),
    [tasks]
  );

  const getTasksByProject = useCallback(
    (projectId: string): LocalTask[] =>
      tasks.filter(t => t.projectId === projectId),
    [tasks]
  );

  const getTasksByCategory = useCallback(
    (categoryId: string): LocalTask[] =>
      tasks.filter(t => t.categoryId === categoryId),
    [tasks]
  );

  const getProjectById = useCallback(
    (id: string): LocalProject | undefined =>
      projects.find(p => p.id === id),
    [projects]
  );

  const getCategoryById = useCallback(
    (id: string): LocalCategory | undefined =>
      categories.find(c => c.id === id),
    [categories]
  );

  const resetAllData = useCallback(async () => {
    await db.delete(taskCategoriesTable);
    await db.delete(tasksTable);
    await db.delete(projectsTable);
    await db.delete(categoriesTable);
    await loadData();
  }, [loadData]);

  const loadSampleData = useCallback(async () => {
    await resetAllData();
    // Reuse local sample logic from TaskStorage
    const sampleCategories: Omit<
      LocalCategory,
      'createdAt' | 'updatedAt' | 'tasks'
    >[] = [
      { id: 'cat-1', title: 'Work', color: 'hsl(230, 65%, 60%)' },
      { id: 'cat-2', title: 'Personal', color: 'hsl(330, 65%, 60%)' },
      { id: 'cat-3', title: 'Health', color: 'hsl(145, 65%, 45%)' },
    ];
    const sampleProjects: Omit<
      LocalProject,
      'createdAt' | 'updatedAt' | 'tasks'
    >[] = [
      {
        id: 'proj-1',
        title: 'Website Redesign',
        description: 'Redesign the company website',
      },
      {
        id: 'proj-2',
        title: 'Home Renovation',
        description: 'Renovate the kitchen and bathroom',
      },
    ];
    const sampleTasks: Omit<
      LocalTask,
      'createdAt' | 'updatedAt' | 'subtasks'
    >[] = [
      {
        id: 'task-1',
        title: 'Create wireframes',
        completed: false,
        dueDate: new Date(Date.now() + 86400000 * 3),
        projectId: 'proj-1',
        categoryId: 'cat-1',
      },
      {
        id: 'task-2',
        title: 'Research contractors',
        completed: false,
        dueDate: new Date(Date.now() + 86400000 * 7),
        projectId: 'proj-2',
        categoryId: 'cat-2',
      },
      {
        id: 'task-3',
        title: 'Daily exercise',
        completed: false,
        categoryId: 'cat-3',
      },
    ];

    // insert categories & projects
    for (const c of sampleCategories) {
      await addCategory(c);
    }
    for (const p of sampleProjects) {
      await addProject(p);
    }
    for (const t of sampleTasks) {
      await addTask(t);
    }
    await loadData();
  }, [addCategory, addProject, addTask, loadData, resetAllData]);

  return {
    tasks,
    projects,
    categories,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    getTasksByProject,
    getTasksByCategory,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    resetAllData,
    loadSampleData,
  };
}