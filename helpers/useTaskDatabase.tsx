import { useState, useEffect } from 'react';
import type {
  Task as LocalTask,
  Project as LocalProject,
  Category as LocalCategory,
} from './TaskStorage';
import { getTasks } from '../endpoints/tasks_GET.schema';
import type { Task as RemoteTask } from '../endpoints/tasks_GET.schema';
import { getProjects } from '../endpoints/projects_GET.schema';
import type { OutputType as RemoteProjectArray } from '../endpoints/projects_GET.schema';
import { getCategories } from '../endpoints/categories_GET.schema';
import type { OutputType as RemoteCategoryArray } from '../endpoints/categories_GET.schema';
import { postTask } from '../endpoints/tasks_POST.schema';
import { postProjects } from '../endpoints/projects_POST.schema';
import { deleteProject as deleteProjectRemote } from '../endpoints/projects/delete_POST.schema';
import { postCategory } from '../endpoints/categories_POST.schema';
import { deleteCategory as deleteCategoryRemote } from '../endpoints/projects/delete_POST.schema';

export const useTaskDatabase = () => {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [remoteTasks, remoteProjects, remoteCategories] = await Promise.all([
          getTasks(),
          getProjects(),
          getCategories(),
        ]);
        // map tasks (including subtasks)
        const localTasks = remoteTasks.map(mapRemoteTask);
        setTasks(localTasks);
        // map projects
        setProjects(
          remoteProjects.map(rp => ({
            id: rp.id,
            title: rp.name,
            description: rp.description ?? undefined,
            tasks: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
        // map categories
        setCategories(
          remoteCategories.map(rc => ({
            id: rc.id,
            title: rc.name,
            color: rc.color,
            tasks: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchAll();
  }, []);

  function mapRemoteTask(rt: RemoteTask): LocalTask {
    const subtasks = rt.tasks?.map(mapRemoteTask);
    const firstCategoryId =
      rt.categories && rt.categories.length > 0 ? rt.categories[0].id : undefined;
    return {
      id: rt.id,
      title: rt.title,
      description: undefined,
      completed: rt.status === 'completed',
      dueDate: rt.dueDate ? new Date(rt.dueDate) : undefined,
      projectId: rt.projectId != null ? String(rt.projectId) : undefined,
      categoryId: firstCategoryId,
      parentTaskId: rt.parentId ?? undefined,
      energyLevel: rt.energyLevel,
      activationEnergy: rt.activationEnergy,
      subtasks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Task CRUD operations using remote endpoint
  const addTask = async (
    taskData: Omit<LocalTask, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>
  ): Promise<LocalTask> => {
    const payload = {
      title: taskData.title,
      dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : null,
      status: taskData.completed ? 'completed' : 'pending',
      parentId: taskData.parentTaskId ?? null,
      projectId: taskData.projectId ?? null,
      energyLevel: taskData.energyLevel,
      activationEnergy: taskData.activationEnergy,
      categories: taskData.categoryId ? [taskData.categoryId] : [],
    };
    const remote = await postTask(payload);
    const local = mapRemoteTask(remote);

    setTasks(prev =>
      local.parentTaskId
        ? prev.map(t =>
            t.id === local.parentTaskId
              ? { ...t, subtasks: [...(t.subtasks || []), local] }
              : t
          )
        : [...prev, local]
    );
    return local;
  };

  const updateTask = async (
    id: string,
    updates: Partial<Omit<LocalTask, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>>
  ): Promise<LocalTask> => {
    const existing = getTaskById(id);
    if (!existing) {
      throw new Error(`Task with id ${id} not found`);
    }
    const payload = {
      id,
      title: updates.title ?? existing.title,
      dueDate:
        updates.dueDate !== undefined
          ? updates.dueDate
            ? updates.dueDate.toISOString()
            : null
          : existing.dueDate
          ? existing.dueDate.toISOString()
          : null,
      status:
        updates.completed !== undefined
          ? updates.completed
            ? 'completed'
            : 'pending'
          : existing.completed
          ? 'completed'
          : 'pending',
      parentId:
        updates.parentTaskId !== undefined
          ? updates.parentTaskId
          : existing.parentTaskId ?? null,
      projectId:
        updates.projectId !== undefined
          ? updates.projectId
          : existing.projectId ?? null,
      energyLevel:
        updates.energyLevel !== undefined
          ? updates.energyLevel
          : existing.energyLevel,
      activationEnergy:
        updates.activationEnergy !== undefined
          ? updates.activationEnergy
          : existing.activationEnergy,
      categories:
        updates.categoryId !== undefined
          ? updates.categoryId
            ? [updates.categoryId]
            : []
          : existing.categoryId
          ? [existing.categoryId]
          : [],
    };
    const remote = await postTask(payload);
    const local = mapRemoteTask(remote);

    // replace in tasks or nested subtasks
    const replaceInList = (list: LocalTask[]): LocalTask[] =>
      list.map(t => {
        if (t.id === local.id) {
          return local;
        }
        if (t.subtasks) {
          return { ...t, subtasks: replaceInList(t.subtasks) };
        }
        return t;
      });

    setTasks(prev => replaceInList(prev));
    return local;
  };

  const deleteTask = async (id: string): Promise<void> => {
    const existing = getTaskById(id);
    if (!existing) {
      throw new Error(`Task with id ${id} not found`);
    }
    // mark as deleted remotely
    await postTask({
      id,
      title: existing.title,
      dueDate: existing.dueDate ? existing.dueDate.toISOString() : null,
      status: 'deleted',
      parentId: existing.parentTaskId ?? null,
      projectId: existing.projectId ?? null,
      categories: existing.categoryId ? [existing.categoryId] : [],
    });
    // remove locally
    setTasks(prev =>
      prev
        .filter(t => t.id !== id)
        .map(t =>
          t.subtasks
            ? { ...t, subtasks: t.subtasks.filter(st => st.id !== id) }
            : t
        )
    );
  };

  // Project CRUD operations using remote endpoint
  const addProject = async (
    projectData: Omit<LocalProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>
  ): Promise<LocalProject> => {
    const payload = {
      name: projectData.title,
      description: projectData.description ?? null,
    };
    const remote = await postProjects(payload);
    const local: LocalProject = {
      id: remote.id,
      title: remote.name,
      description: remote.description ?? undefined,
      tasks: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [...prev, local]);
    return local;
  };

  const updateProject = async (
    id: string,
    updates: Partial<Omit<LocalProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>
  ): Promise<LocalProject> => {
    const existing = getProjectById(id);
    if (!existing) {
      throw new Error(`Project with id ${id} not found`);
    }
    const payload = {
      id,
      name: updates.title ?? existing.title,
      description: updates.description ?? existing.description ?? null,
    };
    const remote = await postProjects(payload);
    const local: LocalProject = {
      id: remote.id,
      title: remote.name,
      description: remote.description ?? undefined,
      tasks: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => prev.map(p => (p.id === local.id ? local : p)));
    return local;
  };

  const deleteProject = async (id: string): Promise<void> => {
    const existing = getProjectById(id);
    if (!existing) {
      throw new Error(`Project with id ${id} not found`);
    }
    // delete remotely
    await deleteProjectRemote({ projectId: id });
    // remove locally
    setProjects(prev => prev.filter(p => p.id !== id));
    // clear project link from tasks
    const removeFromTask = (t: LocalTask): LocalTask => {
      const updated = t.projectId === id ? { ...t, projectId: undefined } : t;
      if (updated.subtasks) {
        return { ...updated, subtasks: updated.subtasks.map(removeFromTask) };
      }
      return updated;
    };
    setTasks(prev => prev.map(removeFromTask));
  };

  // Category CRUD operations using remote endpoint
  const addCategory = async (
    categoryData: Omit<LocalCategory, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>
  ): Promise<LocalCategory> => {
    const payload = {
      name: categoryData.title,
      color: categoryData.color,
    };
    const remote = await postCategory(payload);
    const local: LocalCategory = {
      id: remote.id,
      title: remote.name,
      color: remote.color,
      tasks: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCategories(prev => [...prev, local]);
    return local;
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Omit<LocalCategory, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>
  ): Promise<LocalCategory> => {
    const existing = getCategoryById(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }
    const payload = {
      id,
      name: updates.title ?? existing.title,
      color: updates.color ?? existing.color,
    };
    const remote = await postCategory(payload);
    const local: LocalCategory = {
      id: remote.id,
      title: remote.name,
      color: remote.color,
      tasks: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCategories(prev => prev.map(c => (c.id === local.id ? local : c)));
    return local;
  };

  const deleteCategory = async (id: string): Promise<void> => {
    const existing = getCategoryById(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }
    // delete remotely
    await deleteCategoryRemote({ categoryId: id });
    // remove locally
    setCategories(prev => prev.filter(c => c.id !== id));
    // clear category link from tasks
    const removeFromTask = (t: LocalTask): LocalTask => {
      const updated = t.categoryId === id ? { ...t, categoryId: undefined } : t;
      if (updated.subtasks) {
        return { ...updated, subtasks: updated.subtasks.map(removeFromTask) };
      }
      return updated;
    };
    setTasks(prev => prev.map(removeFromTask));
  };

  // Query helpers
  const getTaskById = (id: string) => {
    const top = tasks.find(t => t.id === id);
    if (top) return top;
    return tasks.flatMap(t => t.subtasks || []).find(st => st.id === id);
  };
  const getTasksByProject = (projectId: string) =>
    tasks.filter(t => t.projectId === projectId);
  const getTasksByCategory = (categoryId: string) =>
    tasks.filter(t => t.categoryId === categoryId);
  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  /**
   * Batch assign a category to multiple tasks.
   * Updates both remote and local state.
   */
  const assignCategoryToTasks = async (
    taskIds: string[],
    categoryId: string
  ): Promise<LocalTask[]> => {
    // Ensure tasks exist
    const existingTasks = taskIds.map(id => {
      const t = getTaskById(id);
      if (!t) {
        throw new Error(`Task with id ${id} not found`);
      }
      return t;
    });
    // Send updates in parallel
    const remotes = await Promise.all(
      existingTasks.map(existing => {
      const payload = {
        id: existing.id,
        title: existing.title,
        dueDate: existing.dueDate
          ? existing.dueDate.toISOString()
          : null,
        status: existing.completed ? 'completed' : 'pending',
        parentId: existing.parentTaskId ?? null,
        projectId: existing.projectId ?? null,
        energyLevel: existing.energyLevel,
        activationEnergy: existing.activationEnergy,
        categories: categoryId ? [categoryId] : [],
      };
        return postTask(payload);
      })
    );
    // Map to local tasks
    const updatedLocals = remotes.map(mapRemoteTask);
    // Replace in local state
    const replaceInList = (list: LocalTask[]): LocalTask[] =>
      list.map(t => {
        const replacement = updatedLocals.find(u => u.id === t.id);
        if (replacement) {
          return replacement;
        }
        if (t.subtasks) {
          return { ...t, subtasks: replaceInList(t.subtasks) };
        }
        return t;
      });
    setTasks(prev => replaceInList(prev));
    return updatedLocals;
  };

  // Utilities
  const resetAllData = () => {
    setTasks([]);
    setProjects([]);
    setCategories([]);
  };
  const loadSampleData = () => {
    throw new Error('loadSampleData is not implemented in useTaskDatabase');
  };

  return {
    tasks,
    projects,
    categories,
    isLoaded,

    addTask,
    updateTask,
    deleteTask,
    assignCategoryToTasks,
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
};