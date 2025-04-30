"use client";

import React, { useState, useEffect } from 'react';
import { useTaskDatabase } from '../helpers/useTaskDatabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/Dialog';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import styles from './categories.module.css';
import { postCategory } from '../endpoints/categories_POST.schema';
import type { Category as StorageCategory } from '../helpers/TaskStorage';
import { Link } from 'react-router-dom';

// Form data type for category creation/editing
type CategoryFormData = {
  id?: string;
  name: string;
  color: string;
};

export default function CategoriesPage() {
  const { categories, tasks, isLoaded, deleteCategory } = useTaskDatabase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryFormData>({ name: '', color: '#3b82f6' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<StorageCategory | null>(null);

  // Count tasks per category
  const getTaskCountForCategory = (categoryId: string) => {
    return tasks.filter(task => task.categoryId === categoryId).length;
  };

  const handleCreateCategory = () => {
    setCurrentCategory({ name: '', color: '#3b82f6' });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: StorageCategory) => {
    setCurrentCategory({
      id: category.id,
      name: category.title,
      color: category.color
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (category: StorageCategory) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsLoading(true);
      await deleteCategory(categoryToDelete.id);
      setSuccessMessage(`Category "${categoryToDelete.title}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      setError("Failed to delete category. Please try again.");
      console.error("Error deleting category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCategory.name.trim()) {
      setError("Category name is required");
      return;
    }
    
    try {
      setIsLoading(true);
      await postCategory({
        id: currentCategory.id,
        name: currentCategory.name,
        color: currentCategory.color
      });
      
      setSuccessMessage(`Category ${isEditing ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} category. Please try again.`);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} category:`, err);
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
    return <div className={styles.loading}>Loading categories...</div>;
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
        <h1 className={styles.title}>Categories</h1>
        <Button onClick={handleCreateCategory} disabled={isLoading}>
          <Plus size={16} /> New Category
        </Button>
      </div>
      
      <div className={styles.categoriesGrid}>
        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No categories yet. Create your first category to get started!</p>
            <Button onClick={handleCreateCategory}>
              <Plus size={16} /> Create Category
            </Button>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryTitleWrapper}>
                  <div 
                    className={styles.colorIndicator} 
                    style={{ backgroundColor: category.color }}
                  />
                  <h2 className={styles.categoryTitle}>{category.title}</h2>
                </div>
                <div className={styles.categoryActions}>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleEditCategory(category)}
                    title="Edit category"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleDeleteClick(category)}
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <div className={styles.categoryMeta}>
                <span className={styles.taskCount}>
                  {getTaskCountForCategory(category.id)} tasks
                </span>
                <Link to={`/tasks?category=${category.id}`} className={styles.viewTasksLink}>
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
      
      {/* Category Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="categoryName" className={styles.label}>
                Category Name <span className={styles.required}>*</span>
              </label>
              <Input
                id="categoryName"
                value={currentCategory.name}
                onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                placeholder="Enter category name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="categoryColor" className={styles.label}>
                Color <span className={styles.required}>*</span>
              </label>
              <div className={styles.colorPickerWrapper}>
                <Input
                  id="categoryColor"
                  type="color"
                  value={currentCategory.color}
                  onChange={(e) => setCurrentCategory({...currentCategory, color: e.target.value})}
                  className={styles.colorPicker}
                />
                <div className={styles.colorPreview} style={{ backgroundColor: currentCategory.color }}>
                  {currentCategory.color}
                </div>
              </div>
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
                disabled={isLoading || !currentCategory.name.trim()}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          
          <p className={styles.deleteConfirmText}>
            Are you sure you want to delete the category "{categoryToDelete?.title}"? 
            This action cannot be undone.
          </p>
          
          <p className={styles.deleteWarning}>
            Note: This will not delete the tasks associated with this category.
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
              {isLoading ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}