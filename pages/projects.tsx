"use client";

import React, { useState, useEffect } from 'react';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/Dialog';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import styles from './projects.module.css';
import { postProjects } from '../endpoints/projects_POST.schema';
import type { Project as StorageProject } from '../helpers/TaskStorage';
import { Link } from 'react-router-dom';

// Define the API Project type that matches the schema from projects_POST.schema
type ApiProject = {
  id: string;
  name: string;
  description: string | null;
};

// Form data type for project creation/editing
type ProjectFormData = {
  id?: string;
  name: string;
  description: string | null;
};

export default function ProjectsPage() {
  const { projects, tasks, isLoaded, deleteProject } = useTaskDatabase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectFormData>({ name: '', description: null });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<StorageProject | null>(null);

  // Count tasks per project
  const getTaskCountForProject = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId).length;
  };

  const handleCreateProject = () => {
    setCurrentProject({ name: '', description: null });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Convert StorageProject to ProjectFormData
  const handleEditProject = (project: StorageProject) => {
    setCurrentProject({
      id: project.id,
      name: project.title, // Map title to name
      description: project.description || null
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (project: StorageProject) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    try {
      setIsLoading(true);
      await deleteProject(projectToDelete.id);
      setSuccessMessage(`Project "${projectToDelete.title}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      setError("Failed to delete project. Please try again.");
      console.error("Error deleting project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProject.name.trim()) {
      setError("Project name is required");
      return;
    }
    
    try {
      setIsLoading(true);
      await postProjects({
        id: currentProject.id,
        name: currentProject.name,
        description: currentProject.description
      });
      
      setSuccessMessage(`Project ${isEditing ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} project. Please try again.`);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} project:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!isLoaded) {
    return <div className={styles.loading}>Loading projects...</div>;
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className={styles.dismissButton}
          >
            Dismiss
          </Button>
        </div>
      )}
      
      {successMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}
      
      <div className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <Button onClick={handleCreateProject} disabled={isLoading}>
          <Plus size={16} /> New Project
        </Button>
      </div>
      
      <div className={styles.projectsGrid}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No projects yet. Create your first project to get started!</p>
            <Button onClick={handleCreateProject}>
              <Plus size={16} /> Create Project
            </Button>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h2 className={styles.projectTitle}>{project.title}</h2>
                <div className={styles.projectActions}>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleEditProject(project)}
                    title="Edit project"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleDeleteClick(project)}
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <p className={styles.projectDescription}>
                {project.description || 'No description'}
              </p>
              
              <div className={styles.projectMeta}>
                <span className={styles.taskCount}>
                  {getTaskCountForProject(project.id)} tasks
                </span>
                <Link to={`/tasks?project=${project.id}`} className={styles.viewTasksLink}>
                  <Button 
                    variant="link" 
                    className={styles.viewTasksButton}
                  >
                    View tasks <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Project Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="projectName" className={styles.label}>
                Project Name <span className={styles.required}>*</span>
              </label>
              <Input
                id="projectName"
                value={currentProject.name}
                onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})}
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="projectDescription" className={styles.label}>
                Description
              </label>
              <Textarea
                id="projectDescription"
                value={currentProject.description || ''}
                onChange={(e) => setCurrentProject({...currentProject, description: e.target.value || null})}
                placeholder="Enter project description (optional)"
                rows={4}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !currentProject.name.trim()}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          
          <p className={styles.deleteConfirmText}>
            Are you sure you want to delete the project "{projectToDelete?.title}"? 
            This action cannot be undone.
          </p>
          
          <p className={styles.deleteWarning}>
            Note: This will not delete the tasks associated with this project.
          </p>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}