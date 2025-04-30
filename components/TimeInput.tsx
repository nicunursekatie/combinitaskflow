import React from 'react';
import { Input } from './Input';
import styles from './TimeInput.module.css';

interface TimeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  id,
  value,
  onChange,
  required = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      id={id}
      type="time"
      value={value}
      onChange={handleChange}
      required={required}
      className={styles.timeInput}
    />
  );
};