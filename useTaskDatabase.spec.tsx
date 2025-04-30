import React, { useState, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useTaskDatabase } from './useTaskDatabase';
import * as tasksApi from '../endpoints/tasks_GET.schema';
import * as tasksPostApi from '../endpoints/tasks_POST.schema';
import * as projectsApi from '../endpoints/projects_GET.schema';
import * as categoriesApi from '../endpoints/categories_GET.schema';

describe('useTaskDatabase', () => {
  it('fetches and loads tasks, projects, and categories', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Task1',
        dueDate: null,
        status: 'completed',
        parentId: null,
        projectId: null,
        project: null,
        categories: [],
        tasks: [],
      },
    ];
    const mockProjects = [{ id: 'p1', name: 'Proj1', description: null }];
    const mockCategories = [{ id: 'c1', name: 'Cat1', color: 'red' }];

    spyOn(tasksApi, 'getTasks').and.returnValue(Promise.resolve(mockTasks));
    spyOn(projectsApi, 'getProjects').and.returnValue(Promise.resolve(mockProjects));
    spyOn(categoriesApi, 'getCategories').and.returnValue(Promise.resolve(mockCategories));

    const TestComp = () => {
      const { isLoaded, tasks, projects, categories } = useTaskDatabase();
      if (!isLoaded) return <>Loading</>;
      return (
        <>
          <span data-testid="tasks">{tasks.map(t => t.title).join(',')}</span>
          <span data-testid="projects">{projects.map(p => p.title).join(',')}</span>
          <span data-testid="categories">{categories.map(c => c.title).join(',')}</span>
        </>
      );
    };

    render(<TestComp />);
    await waitFor(() => {
      if (!screen.queryByTestId('tasks')) throw new Error('not loaded yet');
    });
    expect(screen.getByTestId('tasks').textContent).toBe('Task1');
    expect(screen.getByTestId('projects').textContent).toBe('Proj1');
    expect(screen.getByTestId('categories').textContent).toBe('Cat1');
  });

  it('assigns a category to multiple tasks', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Task1',
        dueDate: null,
        status: 'pending',
        parentId: null,
        projectId: null,
        project: null,
        categories: [],
        tasks: [],
      },
      {
        id: '2',
        title: 'Task2',
        dueDate: null,
        status: 'completed',
        parentId: null,
        projectId: null,
        project: null,
        categories: [],
        tasks: [],
      },
    ];
    const mockProjects = [{ id: 'p1', name: 'Proj1', description: null }];
    const mockCategories = [{ id: 'c1', name: 'Cat1', color: 'red' }];

    spyOn(tasksApi, 'getTasks').and.returnValue(Promise.resolve(mockTasks));
    spyOn(projectsApi, 'getProjects').and.returnValue(Promise.resolve(mockProjects));
    spyOn(categoriesApi, 'getCategories').and.returnValue(Promise.resolve(mockCategories));

    // Prepare postTask to return updated remote tasks with the category assigned
    spyOn(tasksPostApi, 'postTask').and.callFake(async (payload: any, init?: any) => {
      const cats = payload.categories ?? [];
      return {
        id: payload.id!,
        title: payload.title,
        dueDate: payload.dueDate ?? null,
        status: payload.status,
        parentId: payload.parentId ?? null,
        projectId: payload.projectId ?? null,
        project: null,
        categories: cats.map((cid: string) => ({
          id: cid,
          name: 'Cat1',
          color: 'red',
        })),
        tasks: [],
      };
    });

    const TestComp = () => {
      const {
        isLoaded,
        tasks,
        assignCategoryToTasks,
      } = useTaskDatabase();
      const [done, setDone] = useState(false);

      useEffect(() => {
        if (isLoaded && !done) {
          assignCategoryToTasks(['1', '2'], 'c1').then(() => {
            setDone(true);
          });
        }
      }, [isLoaded, done, assignCategoryToTasks]);

      if (!isLoaded) return <>Loading</>;
      if (!done) return <>Assigning</>;

      return (
        <span data-testid="assigned">
          {tasks.map(t => `${t.id}:${t.categoryId}`).join(',')}
        </span>
      );
    };

    render(<TestComp />);
    await waitFor(() => {
      if (!screen.queryByTestId('assigned')) throw new Error('not assigned yet');
    });
    expect(screen.getByTestId('assigned').textContent).toBe('1:c1,2:c1');
  });
});