import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={clsx(
          'flex w-full rounded-lg border border-border bg-background-card px-4 py-2.5 text-sm text-white',
          'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
