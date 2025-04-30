import React, { MouseEvent } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ContextMenu';
import styles from './TimeBlockContextMenu.module.css';
import { Edit, Trash2, Unlink, Link } from 'lucide-react';
import type { TimeBlock } from '../helpers/useTimeBlocks';

interface TimeBlockContextMenuProps {
  block: TimeBlock;
  children: React.ReactNode;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
  onUnlinkTask?: (block: TimeBlock) => void;
}

export const TimeBlockContextMenu: React.FC<TimeBlockContextMenuProps> = ({
  block,
  children,
  onEdit,
  onDelete,
  onUnlinkTask,
}) => {
  const handleClick = (e: MouseEvent) => {
    // Only handle left clicks, let right clicks go to the context menu
    if (e.button === 0) {
      onEdit(block);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          className={`${styles.triggerWrapper} ${block.taskId ? styles.hasLinkedTask : ''}`} 
          onClick={handleClick}
        >
          {block.taskId && (
            <div className={styles.linkedTaskIndicator}>
              <Link size={14} />
            </div>
          )}
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(block)}>
          <Edit size={16} className={styles.menuIcon} />
          Edit Block
        </ContextMenuItem>
        
        {block.taskId && onUnlinkTask && (
          <>
            <ContextMenuItem onClick={() => onUnlinkTask(block)} className={styles.unlinkItem}>
              <Unlink size={16} className={styles.menuIcon} />
              Unlink Task
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        
        <ContextMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className={styles.deleteItem}
        >
          <Trash2 size={16} className={styles.menuIcon} />
          Delete Block
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};