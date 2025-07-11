
import { useState, useMemo, useCallback, memo, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Search, Plus, Copy, Download, Settings, Info, GripVertical, FileDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
const NewLicenseModal = lazy(() => import("@/components/modals/new-license-modal"));
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

const AVAILABLE_COLUMNS = [
  { id: 'code', label: 'Código', width: '120px', sticky: 'left' },
  { id: 'ativo', label: 'Status', width: '100px' },
  { id: 'codCliente', label: 'Cod.Cliente', width: '120px' },
  { id: 'nomeCliente', label: 'Cliente', width: '200px' },
  { id: 'dadosEmpresa', label: 'Dados Empresa', width: '150px' },
  { id: 'hardwareKey', label: 'Hardware Key', width: '120px' },
  { id: 'installNumber', label: 'Install Number', width: '130px' },
  { id: 'systemNumber', label: 'System Number', width: '150px' },
  { id: 'nomeDb', label: 'Nome DB', width: '120px' },
  { id: 'descDb', label: 'Desc. DB', width: '140px' },
  { id: 'endApi', label: 'End. API', width: '140px' },
  { id: 'listaCnpj', label: 'Lista CNPJ', width: '130px' },
  { id: 'qtLicencas', label: 'Qt.Lic.', width: '80px' },
  { id: 'qtLicencasAdicionais', label: 'Qt.Lic.Adicionais', width: '120px' },
  { id: 'versaoSap', label: 'Versão SAP', width: '100px' },
  { id: 'observacao', label: 'Observação', width: '120px' },
  { id: 'acoes', label: 'Ações', width: '100px', sticky: 'right' }
];

// Componente input otimizado para evitar travadas
const OptimizedInput = memo(({ value, onChange, placeholder, id, type = "text" }: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  type?: string;
}) => {
  return (
    <Input
      id={id}
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="transition-none"
      autoComplete="off"
      spellCheck={false}
    />
  );
});

// Componente de filtro específico para evitar re-renders
const FilterInput = memo(({ columnId, value, onChange }: {
  columnId: string;
  value: string;
  onChange: (columnId: string, value: string) => void;
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Sincronizar valor local com prop quando necessário
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Aplicar mudança com delay
    timeoutRef.current = setTimeout(() => {
      onChange(columnId, newValue);
    }, 300);
  }, [columnId, onChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      placeholder="Filtrar..."
      value={localValue}
      onChange={handleChange}
      className="h-7 text-xs bg-white border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary transition-none"
      onClick={(e) => e.stopPropagation()}
      autoComplete="off"
      spellCheck={false}
    />
  );
});

const OptimizedTextarea = memo(({ value, onChange, placeholder, id, rows }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  id?: string;
  rows?: number;
}) => {
  return (
    <Textarea
      id={id}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="transition-none resize-none"
    />
  );
});

export default function Licenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState(
    AVAILABLE_COLUMNS.map(col => col.id)
  );
  const [columnOrder, setColumnOrder] = useState(
    AVAILABLE_COLUMNS.map(col => col.id)
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search with optimal delay for responsiveness
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  
  // Debounce column filters with longer delay to prevent excessive requests
  const debouncedColumnFilters = useDebounce(columnFilters, 500);

  // Memoize combined search to prevent re-computation
  const combinedSearch = useMemo(() => {
    const columnSearches = Object.entries(debouncedColumnFilters)
      .filter(([_, value]) => value !== "")
      .map(([column, value]) => `${column}:${value}`)
      .join(" ");
    
    return [debouncedSearchTerm, columnSearches].filter(Boolean).join(" ");
  }, [debouncedSearchTerm, debouncedColumnFilters]);

  // Query key memoization
  const queryKey = useMemo(() => 
    `/api/licenses?page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(combinedSearch)}`,
    [currentPage, pageSize, combinedSearch]
  );

  const { data: licensesResponse, isLoading, error, refetch } = useQuery({
    queryKey: [queryKey],
    staleTime: 30 * 1000, // Aumentar stale time para evitar requests desnecessários
    gcTime: 5 * 60 * 1000, // Aumentar garbage collection time
    retry: 0, // Sem retry para resposta mais rápida
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: true,
    keepPreviousData: true, // Manter dados anteriores durante carregamento
  });

  const licenses = licensesResponse?.data || [];
  const pagination = licensesResponse?.pagination || {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/licenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Licença excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir licença. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; license: any }) => {
      return await apiRequest("PUT", `/api/licenses/${data.id}`, data.license);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Licença atualizada com sucesso!",
      });
      setIsEditModalOpen(false);
      setEditingLicense(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar licença. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const getStatusVariant = (ativo: boolean) => {
    return ativo ? "default" : "secondary";
  };

  const getStatusText = (ativo: boolean) => {
    return ativo ? "Ativa" : "Inativa";
  };

  const filteredLicenses = licenses;

  const handleDelete = useCallback((id: number) => {
    if (confirm("Tem certeza que deseja excluir esta licença?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleEdit = useCallback((license: any) => {
    setEditingLicense({ ...license });
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateLicense = useCallback(() => {
    if (editingLicense) {
      updateMutation.mutate({
        id: editingLicense.id,
        license: editingLicense
      });
    }
  }, [editingLicense, updateMutation]);

  // Simplified field change handler to prevent re-renders
  const handleFieldChange = useCallback((field: string, value: any) => {
    setEditingLicense((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${field} copiado para a área de transferência`,
      });
    });
  }, [toast]);

  const updateColumnFilter = useCallback((columnId: string, value: string) => {
    // Usar requestIdleCallback para adiar atualizações não urgentes
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        setColumnFilters(prev => {
          if (prev[columnId] === value) return prev; // Evitar updates desnecessários
          return { ...prev, [columnId]: value };
        });
      });
    } else {
      // Fallback para navegadores que não suportam requestIdleCallback
      setTimeout(() => {
        setColumnFilters(prev => {
          if (prev[columnId] === value) return prev;
          return { ...prev, [columnId]: value };
        });
      }, 0);
    }
    
    // Só resetar página se tiver valor
    if (value.trim() !== '') {
      setCurrentPage(1);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setColumnFilters({});
    setCurrentPage(1);
  }, []);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(pagination.totalPages);
  }, [pagination.totalPages]);

  const goToNextPage = useCallback(() => {
    if (pagination.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination.hasNext]);

  const goToPrevPage = useCallback(() => {
    if (pagination.hasPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination.hasPrev]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const getVisibleColumnsInOrder = useCallback(() => {
    return columnOrder
      .filter(colId => visibleColumns.includes(colId))
      .map(colId => AVAILABLE_COLUMNS.find(col => col.id === colId))
      .filter(Boolean);
  }, [columnOrder, visibleColumns]);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  }, []);

  // Optimized cell content rendering
  const renderCellContent = useCallback((license: any, column: any) => {
    const value = license[column.id];

    switch (column.id) {
      case 'ativo':
        return (
          <Badge variant={getStatusVariant(value)} className="text-xs">
            {getStatusText(value)}
          </Badge>
        );

      case 'acoes':
        return (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(license)}
              className="p-1 h-7 w-7 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
              title="Editar"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(license.id)}
              disabled={deleteMutation.isPending}
              className="p-1 h-7 w-7 hover:bg-red-50 text-gray-500 hover:text-red-600"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex items-center group">
            <span className="text-gray-600 truncate" style={{ maxWidth: `calc(${column.width} - 40px)` }} title={value || 'N/A'}>
              {value || 'N/A'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
              onClick={() => copyToClipboard(value || '', column.label)}
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </Button>
          </div>
        );
    }
  }, [handleEdit, handleDelete, deleteMutation.isPending, copyToClipboard]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Licenças</h1>
          <p className="text-slate-600 mt-1">Gerencie todas as licenças e suas informações detalhadas</p>
        </div>
        <div className="flex space-x-3">
          <Suspense fallback={<div>Carregando...</div>}>
            <NewLicenseModal />
          </Suspense>
        </div>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Todas as Licenças</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Mostrando {filteredLicenses.length} de {pagination.total} licenças
                {(Object.values(columnFilters).some(filter => filter !== "") || searchTerm !== "") && 
                  ` (página ${pagination.page} de ${pagination.totalPages})`
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Busca geral..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-48 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {(Object.values(columnFilters).some(filter => filter !== "") || searchTerm !== "") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Erro ao carregar licenças: {(error as Error).message}</p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : !licensesResponse || Object.keys(licensesResponse).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Carregando dados...</p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="mt-2"
              >
                Recarregar
              </Button>
            </div>
          ) : (
            <div className="w-full relative">
              <div className="overflow-auto max-h-[70vh] border rounded-lg license-table-container" style={{ maxWidth: '100vw' }}>
                <table className="w-full" style={{ minWidth: `${getVisibleColumnsInOrder().reduce((acc, col) => acc + parseInt(col.width), 0)}px` }}>
                  <thead className="bg-gray-50">
                    <tr>
                      {getVisibleColumnsInOrder().map((column) => (
                        <th
                          key={column.id}
                          className={`px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 ${
                            column.sticky === 'left' 
                              ? 'sticky left-0 z-20 bg-gray-50 px-4' 
                              : column.sticky === 'right'
                              ? 'sticky right-0 z-20 bg-gray-50 border-l border-gray-200 text-center'
                              : ''
                          }`}
                          style={{ 
                            minWidth: column.width,
                            width: column.id === 'qtLicencas' || column.id === 'qtLicencasAdicionais' || column.id === 'acoes' ? column.width : undefined
                          }}
                        >
                          <div className="space-y-2">
                            <div>{column.label}</div>
                            {column.id !== 'acoes' && (
                              <FilterInput
                                columnId={column.id}
                                value={columnFilters[column.id] || ''}
                                onChange={updateColumnFilter}
                              />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredLicenses.map((license: any) => (
                      <tr key={license.id} className="hover:bg-gray-50 transition-none">
                        {getVisibleColumnsInOrder().map((column) => (
                          <td
                            key={`${license.id}-${column.id}`}
                            className={`px-3 py-3 text-sm border-r border-gray-200 ${
                              column.sticky === 'left'
                                ? 'sticky left-0 z-10 bg-white px-4 font-medium text-slate-800 hover:bg-slate-50'
                                : column.sticky === 'right'
                                ? 'sticky right-0 z-10 bg-white text-center border-l border-gray-200 hover:bg-gray-50'
                                : column.id === 'qtLicencas' || column.id === 'qtLicencasAdicionais'
                                ? 'text-center'
                                : ''
                            }`}
                          >
                            {renderCellContent(license, column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLicenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma licença encontrada.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Paginação */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Página {pagination.page} de {pagination.totalPages}</span>
                <span>({pagination.total} itens no total)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={!pagination.hasPrev}
                  className="p-2"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!pagination.hasPrev}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.totalPages - 4, 
                      pagination.page - 2
                    )) + i;
                    
                    if (pageNum <= pagination.totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!pagination.hasNext}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={!pagination.hasNext}
                  className="p-2"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição Otimizado */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border border-[#e0e0e0] shadow-lg"
          aria-describedby="edit-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#3a3a3c]">Editar Licença</DialogTitle>
            <p id="edit-dialog-description" className="text-sm text-[#3a3a3c] mt-2">Atualize as informações da licença</p>
          </DialogHeader>
          
          {editingLicense && (
            <Tabs defaultValue="cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#f4f4f4] border border-[#e0e0e0]">
                <TabsTrigger value="cliente" className="text-[#3a3a3c] data-[state=active]:bg-[#0095da] data-[state=active]:text-white">Dados do Cliente</TabsTrigger>
                <TabsTrigger value="ambiente" className="text-[#3a3a3c] data-[state=active]:bg-[#0095da] data-[state=active]:text-white">Dados do Ambiente</TabsTrigger>
                <TabsTrigger value="licenca" className="text-[#3a3a3c] data-[state=active]:bg-[#0095da] data-[state=active]:text-white">Dados da Licença</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cliente" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-codCliente">Código do Cliente</Label>
                    <OptimizedInput
                      id="edit-codCliente"
                      value={editingLicense.codCliente || ''}
                      onChange={(e) => handleFieldChange('codCliente', e.target.value)}
                      placeholder="C0001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nomeCliente">Nome do Cliente</Label>
                    <OptimizedInput
                      id="edit-nomeCliente"
                      value={editingLicense.nomeCliente || ''}
                      onChange={(e) => handleFieldChange('nomeCliente', e.target.value)}
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-dadosEmpresa">Dados da Empresa</Label>
                  <OptimizedTextarea
                    id="edit-dadosEmpresa"
                    value={editingLicense.dadosEmpresa || ''}
                    onChange={(e) => handleFieldChange('dadosEmpresa', e.target.value)}
                    placeholder="Informações da empresa..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-listaCnpj">Lista de CNPJ</Label>
                  <OptimizedInput
                    id="edit-listaCnpj"
                    value={editingLicense.listaCnpj || ''}
                    onChange={(e) => handleFieldChange('listaCnpj', e.target.value)}
                    placeholder="12.345.678/0001-90"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="ambiente" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nomeDb">Nome do Banco</Label>
                    <OptimizedInput
                      id="edit-nomeDb"
                      value={editingLicense.nomeDb || ''}
                      onChange={(e) => handleFieldChange('nomeDb', e.target.value)}
                      placeholder="SBODemo_BR"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-descDb">Descrição do Banco</Label>
                    <OptimizedInput
                      id="edit-descDb"
                      value={editingLicense.descDb || ''}
                      onChange={(e) => handleFieldChange('descDb', e.target.value)}
                      placeholder="Base de Teste"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-endApi">Endpoint da API</Label>
                  <OptimizedInput
                    id="edit-endApi"
                    value={editingLicense.endApi || ''}
                    onChange={(e) => handleFieldChange('endApi', e.target.value)}
                    placeholder="http://api.exemplo.com:8099/Database/API"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="licenca" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-hardwareKey">Hardware Key</Label>
                    <OptimizedInput
                      id="edit-hardwareKey"
                      value={editingLicense.hardwareKey || ''}
                      onChange={(e) => handleFieldChange('hardwareKey', e.target.value)}
                      placeholder="D0950733748"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-installNumber">Install Number</Label>
                    <OptimizedInput
                      id="edit-installNumber"
                      value={editingLicense.installNumber || ''}
                      onChange={(e) => handleFieldChange('installNumber', e.target.value)}
                      placeholder="0090289858"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-systemNumber">System Number</Label>
                    <OptimizedInput
                      id="edit-systemNumber"
                      value={editingLicense.systemNumber || ''}
                      onChange={(e) => handleFieldChange('systemNumber', e.target.value)}
                      placeholder="000000000850521388"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-versaoSap">Versão SAP</Label>
                    <OptimizedInput
                      id="edit-versaoSap"
                      value={editingLicense.versaoSap || ''}
                      onChange={(e) => handleFieldChange('versaoSap', e.target.value)}
                      placeholder="9.3"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-qtLicencas">Quantidade de Licenças</Label>
                    <OptimizedInput
                      id="edit-qtLicencas"
                      type="number"
                      value={editingLicense.qtLicencas || ''}
                      onChange={(e) => handleFieldChange('qtLicencas', parseInt(e.target.value) || 0)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-qtLicencasAdicionais">Licenças Adicionais</Label>
                    <OptimizedInput
                      id="edit-qtLicencasAdicionais"
                      type="number"
                      value={editingLicense.qtLicencasAdicionais || ''}
                      onChange={(e) => handleFieldChange('qtLicencasAdicionais', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-observacao">Observações</Label>
                  <OptimizedTextarea
                    id="edit-observacao"
                    value={editingLicense.observacao || ''}
                    onChange={(e) => handleFieldChange('observacao', e.target.value)}
                    placeholder="Observações sobre a licença..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-ativo"
                    checked={editingLicense.ativo || false}
                    onChange={(e) => handleFieldChange('ativo', e.target.checked)}
                    className="w-4 h-4 text-[#0095da] bg-gray-100 border-gray-300 rounded focus:ring-[#0095da] focus:ring-2"
                  />
                  <Label htmlFor="edit-ativo" className="text-sm font-medium text-[#3a3a3c]">
                    Licença Ativa
                  </Label>
                </div>
              </TabsContent>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-[#e0e0e0]">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateLicense}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
