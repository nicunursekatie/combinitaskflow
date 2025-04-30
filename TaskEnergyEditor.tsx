import React from 'react';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './RadioGroup';
import { Label } from './Label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';
import { Task } from '../helpers/TaskStorage';
import styles from './TaskEnergyEditor.module.css';
import { useIsMobile } from '../helpers/useIsMobile';

interface TaskEnergyEditorProps {
  task: Task;
  onChange: (updates: Partial<Task>) => void;
  className?: string;
}

export const TaskEnergyEditor = ({ 
  task, 
  onChange, 
  className = '' 
}: TaskEnergyEditorProps) => {
  const isMobile = useIsMobile();
  
  const handleEnergyLevelChange = (value: string) => {
    onChange({ 
      energyLevel: value as 'low' | 'medium' | 'high' 
    });
  };

  const handleActivationEnergyChange = (value: string) => {
    onChange({ 
      activationEnergy: value as 'low' | 'medium' | 'high' 
    });
  };

  const renderEnergyIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <BatteryLow size={isMobile ? 16 : 18} className={styles.lowIcon} />;
      case 'medium':
        return <BatteryMedium size={isMobile ? 16 : 18} className={styles.mediumIcon} />;
      case 'high':
        return <BatteryFull size={isMobile ? 16 : 18} className={styles.highIcon} />;
      default:
        return <Battery size={isMobile ? 16 : 18} />;
    }
  };

  const renderActivationIcon = (level: string) => {
    const levelClass = level === 'low' ? styles.zapLow : 
                       level === 'medium' ? styles.zapMedium : 
                       level === 'high' ? styles.zapHigh : '';
    
    return <Zap 
      size={isMobile ? 16 : 18} 
      className={`${styles.zapIcon} ${levelClass}`} 
    />;
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <TooltipProvider>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Energy Level Required</h3>
            <Tooltip>
              <TooltipTrigger className={styles.infoTrigger}>?</TooltipTrigger>
              <TooltipContent>
                <p>How much energy do you need to complete this task?</p>
                <ul className={styles.tooltipList}>
                  <li><strong>Low:</strong> Can do when tired or distracted</li>
                  <li><strong>Medium:</strong> Requires some focus and energy</li>
                  <li><strong>High:</strong> Needs full concentration and energy</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <RadioGroup 
            value={task.energyLevel || 'medium'} 
            onValueChange={handleEnergyLevelChange}
            className={styles.radioGroup}
          >
            <div className={styles.optionsContainer}>
              <div className={styles.option}>
                <RadioGroupItem value="low" id="energy-low" />
                <Label htmlFor="energy-low" className={styles.radioLabel}>
                  {renderEnergyIcon('low')}
                  <span>Low</span>
                </Label>
              </div>
              
              <div className={styles.option}>
                <RadioGroupItem value="medium" id="energy-medium" />
                <Label htmlFor="energy-medium" className={styles.radioLabel}>
                  {renderEnergyIcon('medium')}
                  <span>Medium</span>
                </Label>
              </div>
              
              <div className={styles.option}>
                <RadioGroupItem value="high" id="energy-high" />
                <Label htmlFor="energy-high" className={styles.radioLabel}>
                  {renderEnergyIcon('high')}
                  <span>High</span>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Activation Energy</h3>
            <Tooltip>
              <TooltipTrigger className={styles.infoTrigger}>?</TooltipTrigger>
              <TooltipContent>
                <p>How difficult is it to get started on this task?</p>
                <ul className={styles.tooltipList}>
                  <li><strong>Low:</strong> Easy to start, minimal resistance</li>
                  <li><strong>Medium:</strong> Some initial resistance to overcome</li>
                  <li><strong>High:</strong> Difficult to start, significant resistance</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <RadioGroup 
            value={task.activationEnergy || 'medium'} 
            onValueChange={handleActivationEnergyChange}
            className={styles.radioGroup}
          >
            <div className={styles.optionsContainer}>
              <div className={styles.option}>
                <RadioGroupItem value="low" id="activation-low" />
                <Label htmlFor="activation-low" className={styles.radioLabel}>
                  {renderActivationIcon('low')}
                  <span>Low</span>
                </Label>
              </div>
              
              <div className={styles.option}>
                <RadioGroupItem value="medium" id="activation-medium" />
                <Label htmlFor="activation-medium" className={styles.radioLabel}>
                  {renderActivationIcon('medium')}
                  <span>Medium</span>
                </Label>
              </div>
              
              <div className={styles.option}>
                <RadioGroupItem value="high" id="activation-high" />
                <Label htmlFor="activation-high" className={styles.radioLabel}>
                  {renderActivationIcon('high')}
                  <span>High</span>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </TooltipProvider>
    </div>
  );
};