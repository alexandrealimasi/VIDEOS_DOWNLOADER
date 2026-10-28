import React from 'react';
import { clsx } from 'clsx';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        className={clsx(
          'flex w-full rounded-lg border border-border bg-background-card px-4 py-2.5 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
          'appearance-none cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';
