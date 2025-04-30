import React, { forwardRef, LabelHTMLAttributes } from 'react';
import styles from './Label.module.css';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, "aria-disabled": ariaDisabled, ...props }, ref) => {
    const isDisabled = ariaDisabled === "true";
    
    return (
      <label
        ref={ref}
        className={`${styles.label} ${isDisabled ? styles.labelDisabled : ''} ${className || ''}`}
        aria-disabled={ariaDisabled}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';