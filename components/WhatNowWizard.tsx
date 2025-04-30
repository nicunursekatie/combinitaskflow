"use client";

import React, { useState } from 'react';
import { 
  Clock, 
  Battery, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  X,
  Star
} from 'lucide-react';
import styles from './WhatNowWizard.module.css';
import { 
  WizardState, 
  initialWizardState, 
  isWizardComplete, 
  TimeAvailable, 
  EnergyLevel,
  TaskSuggestion
} from '../helpers/TaskSuggester';
import { Task } from '../helpers/TaskStorage';
import { Button } from './Button';
import { Input } from './Input';
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup';

interface WhatNowWizardProps {
  onClose?: () => void;
  onTaskSelect: (task: Task) => void;
  suggestedTasks: TaskSuggestion[];
  onUpdateFilters: (filters: {
    timeAvailable: TimeAvailable | null;
    energyLevel: EnergyLevel | null;
    blockers: string[];
  }) => void;
  className?: string;
}

export const WhatNowWizard = ({
  onClose,
  onTaskSelect,
  suggestedTasks,
  onUpdateFilters,
  className = '',
}: WhatNowWizardProps) => {
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [blocker, setBlocker] = useState('');

  const handleTimeSelect = (time: TimeAvailable) => {
    setState(prev => ({
      ...prev,
      timeAvailable: time,
      step: 2
    }));
  };

  const handleEnergySelect = (energy: EnergyLevel) => {
    setState(prev => ({
      ...prev,
      energyLevel: energy,
      step: 3
    }));
  };

  const handleAddBlocker = () => {
    if (!blocker.trim()) return;
    
    setState(prev => ({
      ...prev,
      blockers: [...prev.blockers, blocker.trim()],
    }));
    
    setBlocker('');
  };

  const handleRemoveBlocker = (index: number) => {
    setState(prev => ({
      ...prev,
      blockers: prev.blockers.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    setState(prev => ({
      ...prev,
      step: prev.step + 1
    }));

    if (state.step === 3) {
      onUpdateFilters({
        timeAvailable: state.timeAvailable,
        energyLevel: state.energyLevel,
        blockers: state.blockers,
      });
    }
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      step: Math.max(1, prev.step - 1)
    }));
  };

  const handleReset = () => {
    setState(initialWizardState);
  };

  const renderTimeStep = () => (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>
        <Clock size={20} className={styles.stepIcon} />
        How much time do you have?
      </h3>
      
      <div className={styles.options}>
        <ToggleGroup type="single" value={state.timeAvailable || ''}>
          <ToggleGroupItem 
            value="short" 
            onClick={() => handleTimeSelect('short')}
          >
            Short (15-30 min)
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="medium" 
            onClick={() => handleTimeSelect('medium')}
          >
            Medium (30-90 min)
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="long" 
            onClick={() => handleTimeSelect('long')}
          >
            Long (2+ hours)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );

  const renderEnergyStep = () => (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>
        <Battery size={20} className={styles.stepIcon} />
        What's your energy level right now?
      </h3>
      
      <div className={styles.options}>
        <ToggleGroup type="single" value={state.energyLevel || ''}>
          <ToggleGroupItem 
            value="low" 
            onClick={() => handleEnergySelect('low')}
            className={styles.energyOption}
          >
            <div className={styles.energyOptionContent}>
              <span className={styles.energyOptionTitle}>Low</span>
              <span className={styles.energyOptionDescription}>
                Tired, unfocused, or mentally drained
              </span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="medium" 
            onClick={() => handleEnergySelect('medium')}
            className={styles.energyOption}
          >
            <div className={styles.energyOptionContent}>
              <span className={styles.energyOptionTitle}>Medium</span>
              <span className={styles.energyOptionDescription}>
                Moderately focused, somewhat motivated
              </span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="high" 
            onClick={() => handleEnergySelect('high')}
            className={styles.energyOption}
          >
            <div className={styles.energyOptionContent}>
              <span className={styles.energyOptionTitle}>High</span>
              <span className={styles.energyOptionDescription}>
                Alert, motivated, and mentally sharp
              </span>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className={styles.note}>
        <p>
          Your energy level helps match you with tasks that are appropriate for your current mental state.
        </p>
      </div>
    </div>
  );

  const renderBlockersStep = () => (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>
        <AlertTriangle size={20} className={styles.stepIcon} />
        Any blockers or constraints?
      </h3>
      
      <div className={styles.blockerInput}>
        <Input
          type="text"
          placeholder="Add a blocker (e.g., 'phone', 'computer')"
          value={blocker}
          onChange={(e) => setBlocker(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddBlocker();
            }
          }}
        />
        <Button onClick={handleAddBlocker} disabled={!blocker.trim()}>
          Add
        </Button>
      </div>
      
      {state.blockers.length > 0 && (
        <div className={styles.blockersList}>
          {state.blockers.map((item, index) => (
            <div key={index} className={styles.blockerItem}>
              <span>{item}</span>
              <button 
                className={styles.removeBlocker}
                onClick={() => handleRemoveBlocker(index)}
                aria-label="Remove blocker"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className={styles.note}>
        <p>
          Blockers are things that might prevent you from doing certain tasks.
          For example, if you don't have your laptop, add "computer" as a blocker.
        </p>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className={styles.step}>
      <h3 className={styles.stepTitle}>
        <Star size={20} className={styles.stepIcon} />
        Here's what you could work on now:
      </h3>
      
      <div className={styles.results}>
        {suggestedTasks.length > 0 ? (
          <div className={styles.suggestionsList}>
            {suggestedTasks.slice(0, 5).map((suggestion, index) => (
              <div 
                key={suggestion.task.id} 
                className={styles.suggestionItem}
                onClick={() => onTaskSelect(suggestion.task)}
              >
                <div className={styles.suggestionRank}>
                  {index === 0 ? (
                    <div className={styles.topSuggestion}>
                      <Star size={16} className={styles.starIcon} />
                      <span>Top pick</span>
                    </div>
                  ) : (
                    <span className={styles.rankNumber}>{index + 1}</span>
                  )}
                </div>
                
                <div className={styles.suggestionContent}>
                  <h4 className={styles.suggestionTitle}>
                    {suggestion.task.title}
                  </h4>
                  <p className={styles.suggestionReason}>
                    {suggestion.reason}
                  </p>
                  {(suggestion.task.energyLevel || suggestion.task.activationEnergy) && (
                    <div className={styles.energyTags}>
                      {suggestion.task.energyLevel && (
                        <span className={styles.energyTag}>
                          <Battery size={14} />
                          {suggestion.task.energyLevel} energy
                        </span>
                      )}
                      {suggestion.task.activationEnergy && (
                        <span className={styles.energyTag}>
                          <span className={styles.activationIcon}>⚡</span>
                          {suggestion.task.activationEnergy} to start
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <p>No matching tasks found. Try adjusting your criteria or add new tasks.</p>
          </div>
        )}
      </div>
      
      <div className={styles.resetSection}>
        <Button variant="outline" onClick={handleReset}>
          Start Over
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (state.step) {
      case 1:
        return renderTimeStep();
      case 2:
        return renderEnergyStep();
      case 3:
        return renderBlockersStep();
      case 4:
        return renderResultsStep();
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>What Now?</h2>
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.progress}>
          <div className={styles.progressSteps}>
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step}
                className={`${styles.progressStep} ${state.step >= step ? styles.active : ''} ${state.step === step ? styles.current : ''}`}
              >
                {state.step > step ? (
                  <Check size={16} />
                ) : (
                  <span>{step}</span>
                )}
              </div>
            ))}
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(state.step - 1) * 33.33}%` }}
            ></div>
          </div>
        </div>

        {renderCurrentStep()}

        {state.step < 4 && (
          <div className={styles.actions}>
            {state.step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext}
              disabled={
                (state.step === 1 && !state.timeAvailable) ||
                (state.step === 2 && !state.energyLevel)
              }
            >
              {state.step === 3 ? 'Find Tasks' : 'Next'}
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};