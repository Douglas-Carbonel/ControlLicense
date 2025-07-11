import { useState, useCallback, useRef } from 'react';

export function useOptimizedState<T>(initialValue: T, delay: number = 100) {
  const [value, setValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<T>(initialValue);

  const setOptimizedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(lastValueRef.current)
      : newValue;

    lastValueRef.current = resolvedValue;

    timeoutRef.current = setTimeout(() => {
      setValue(resolvedValue);
    }, delay);
  }, [delay]);

  const setImmediateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(lastValueRef.current)
      : newValue;

    lastValueRef.current = resolvedValue;
    setValue(resolvedValue);
  }, []);

  return [value, setOptimizedValue, setImmediateValue] as const;
}