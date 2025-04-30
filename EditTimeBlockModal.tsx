import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { TimeBlock } from '../helpers/useTimeBlocks';
import { LoadingSpinner } from './LoadingSpinner';
import { LinkIcon, Unlink } from 'lucide-react';
import styles from './EditTimeBlockModal.module.css';

interface EditTimeBlockModalProps {
  timeBlock: TimeBlock;
  onSave: (timeBlock: TimeBlock) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export const EditTimeBlockModal: React.FC<EditTimeBlockModalProps> = ({
  timeBlock,
  onSave,
  onClose,
  open
}) => {
  const [title, setTitle] = useState(timeBlock.title);
  const [startTime, setStartTime] = useState(timeBlock.startTime);
  const [endTime, setEndTime] = useState(timeBlock.endTime);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(!!timeBlock.taskId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(timeBlock.title);
      setStartTime(timeBlock.startTime);
      setEndTime(timeBlock.endTime);
      setIsLinked(!!timeBlock.taskId);
    }
  }, [timeBlock, open]);

  // Validate time whenever start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      if (startTime >= endTime) {
        setError('End time must be after start time');
      } else {
        setError(null);
      }
    }
  }, [startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSave({
        ...timeBlock,
        title,
        startTime,
        endTime,
        taskId: isLinked ? timeBlock.taskId : null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = () => {
    setIsLinked(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLinked ? (
              <div className={styles.linkedTitle}>
                <LinkIcon size={16} className={styles.linkIcon} />
                Edit Linked Time Block
              </div>
            ) : (
              'Edit Time Block'
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this time block"
                required
              />
            </div>
            
            <div className={styles.timeFields}>
              <div className={styles.formField}>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formField}>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            
            {timeBlock.taskId && (
              <div className={styles.linkedTaskInfo}>
                <div className={styles.linkedTaskLabel}>
                  <LinkIcon size={14} className={styles.linkIcon} />
                  Linked to task
                </div>
                {isLinked ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUnlink}
                    className={styles.unlinkButton}
                  >
                    <Unlink size={14} className={styles.unlinkIcon} />
                    Unlink
                  </Button>
                ) : (
                  <div className={styles.unlinkMessage}>
                    This block will be unlinked from the task when saved
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className={styles.footer}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};