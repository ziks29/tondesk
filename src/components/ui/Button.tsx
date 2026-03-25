'use client';

import { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils'; // I'll create this helper

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  isLoading?: boolean;
}

export function Button({ className, isLoading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "w-full rounded-xl sm:rounded-2xl bg-[#0088cc] py-3.5 sm:py-4 text-base sm:text-sm font-bold text-white shadow-lg shadow-[#0088cc]/25 transition-all hover:bg-[#007ebd] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
