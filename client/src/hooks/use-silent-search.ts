import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from './use-debounce';

interface SilentSearchOptions {
  debounceMs?: number;
  onSearchChange?: (searchTerm: string) => void;
}

export function useSilentSearch(options: SilentSearchOptions = {}) {
  const { debounceMs = 300, onSearchChange } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep callback ref updated
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set searching state briefly without showing loading indicators
    setIsSearching(true);
    
    // Clear searching state after debounce period
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
    }, debounceMs);
    
    // Call the callback immediately for responsive UI
    if (onSearchChangeRef.current) {
      onSearchChangeRef.current(value);
    }
  }, [debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (onSearchChangeRef.current) {
      onSearchChangeRef.current('');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    handleSearchChange,
    clearSearch
  };
}