"use client";

import React, { useRef, useState } from 'react';
import { Download, Upload, Info, Check } from 'lucide-react';
import { Button } from './Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './Dialog';
import { FileDropzone } from './FileDropzone';
import { 
  exportData,
  importData,
  saveImportedData,
  generateExportFileName
} from '../lib/importExport';
import styles from './ImportExportPanel.module.css';

interface ImportExportPanelProps {
  tasks: any[];
  projects: any[];
  categories: any[];
  onDataImported: () => void;  // Callback when data is imported successfully
  className?: string;
}

export const ImportExportPanel = ({
  tasks,
  projects,
  categories,
  onDataImported,
  className = ''
}: ImportExportPanelProps) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      console.log('Exporting data...');
      const jsonString = exportData(tasks, projects, categories);
      
      // Create a blob and download it
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = generateExportFileName();
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportError(null);
    setImportSuccess(false);
  };

  const processImportFile = async (file: File) => {
    if (!file) return;
    
    // Clear previous states
    setImportError(null);
    setImportSuccess(false);
    
    // Validate file type
    if (!file.name.endsWith('.json')) {
      setImportError('Please select a valid JSON file (.json)');
      return;
    }
    
    try {
      console.log('Reading file:', file.name);
      const fileText = await file.text();
      
      if (!fileText.trim()) {
        setImportError('File is empty');
        return;
      }
      
      try {
        // Parse and process the imported data
        const importedData = importData(fileText);
        console.log('Imported data parsed successfully');
        
        // Save directly to localStorage
        const saveResult = saveImportedData(importedData);
        
        if (saveResult) {
          setImportSuccess(true);
          
          // Notify parent that data was imported
          onDataImported();
          
          // Close dialog after a short delay
          setTimeout(() => {
            setImportDialogOpen(false);
            setImportSuccess(false);
          }, 1500);
        } else {
          setImportError('Failed to save imported data');
        }
      } catch (importError: any) {
        console.error('Error processing import:', importError);
        setImportError(importError.message || 'Failed to process the import file');
      }
    } catch (error) {
      console.error('File reading error:', error);
      setImportError('Failed to read the import file');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processImportFile(file).finally(() => {
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const handleFileDrop = (files: File[]) => {
    if (files.length === 0) return;
    
    processImportFile(files[0]);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h3 className={styles.title}>Data Management</h3>
      
      <div className={styles.buttons}>
        <Button 
          onClick={handleExport}
          className={styles.exportButton}
        >
          <Download size={16} />
          Export Data
        </Button>
        
        <Button 
          onClick={handleImportClick}
          variant="outline"
          className={styles.importButton}
        >
          <Upload size={16} />
          Import Data
        </Button>
      </div>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Upload a TaskFlow export file (.json) to import your data
            </DialogDescription>
          </DialogHeader>
          
          <div className={styles.importContent}>
            <div className={styles.dropzoneContainer}>
              <FileDropzone 
                onFilesSelected={handleFileDrop}
                accept=".json"
                title="Drag and drop your export file here"
                subtitle="or click to browse"
                className={styles.dropzone}
              />
              
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className={styles.hiddenFileInput}
                id="import-file-input"
              />
            </div>
            
            <div className={styles.manualUpload}>
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Choose File
              </Button>
            </div>
            
            {importError && (
              <div className={styles.error}>
                <Info size={16} />
                {importError}
              </div>
            )}
            
            {importSuccess && (
              <div className={styles.success}>
                <Check size={16} />
                Import successful! Your data has been loaded.
              </div>
            )}
            
            <div className={styles.note}>
              <p><strong>Note:</strong> Importing data will replace your current tasks, projects, and categories.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};