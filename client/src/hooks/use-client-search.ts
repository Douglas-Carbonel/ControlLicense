
import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './use-debounce';

interface Cliente {
  code: string;
  nomeCliente: string;
}

export function useClientSearch(clientes: Cliente[] = []) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  const filteredClientes = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    if (!debouncedSearchTerm.trim()) return clientes;

    return clientes.filter((cliente) =>
      cliente.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      cliente.nomeCliente.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [clientes, debouncedSearchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleClientSelect = useCallback((clientCode: string) => {
    setSelectedClient(clientCode);
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedClient("");
    setSearchTerm("");
  }, []);

  return {
    searchTerm,
    selectedClient,
    isOpen,
    filteredClientes,
    setIsOpen,
    handleSearchChange,
    handleClientSelect,
    clearSearch,
    clearSelection,
    setSelectedClient
  };
}
