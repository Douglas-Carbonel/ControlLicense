
import { useState, useMemo, useCallback, memo, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Plus, Copy, Download, Settings, Info, GripVertical, FileDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Columns, Search, Bookmark, Save, Trash } from "lucide-react";
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

// Configuração de colunas visíveis (personalizável pelo usuário)
const DEFAULT_VISIBLE_COLUMNS = [
  'code', 'ativo', 'nomeCliente', 'dadosEmpresa', 'hardwareKey', 'qtLicencas', 'versaoSap', 'acoes'
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
  // Removido searchTerm - busca geral não agregava valor conforme feedback do usuário
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  // Estado para configuração de colunas
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [columnOrder, setColumnOrder] = useState(AVAILABLE_COLUMNS.map(col => col.id));
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<{name: string, config: any}[]>([]);
  const [configName, setConfigName] = useState('');
  const [isSaveConfigOpen, setIsSaveConfigOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25); // Reduzido para 25 para melhor performance
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ABORDAGEM PROFISSIONAL: Carregar todos os dados uma vez
  const { data: allLicensesResponse, isLoading: isLoadingAll, error } = useQuery({
    queryKey: ["/api/licenses?limit=1000"],
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 20 * 60 * 1000, // 20 minutos para garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const allLicenses = allLicensesResponse?.data || [];

  // Debounce para filtros de coluna (400ms - otimizado para evitar travadas)
  const debouncedColumnFilters = useDebounce(columnFilters, 400);

  // BUSCA E FILTRO LOCAL OTIMIZADO (com debounce para evitar travadas)
  const filteredLicenses = useMemo(() => {
    // Se não há dados ainda, retorna array vazio
    if (!allLicenses || allLicenses.length === 0) {
      return [];
    }

    let filtered = allLicenses;

    // Busca geral removida conforme solicitado - não agregava valor

    // Aplicar filtros de coluna (usando debounced)
    Object.entries(debouncedColumnFilters).forEach(([column, value]) => {
      if (value.trim()) {
        const filterLower = value.toLowerCase();
        filtered = filtered.filter(license => {
          const fieldValue = license[column];
          if (column === 'ativo') {
            const isActive = filterLower === 'ativo' || filterLower === 'true';
            return license.ativo === isActive;
          }
          return fieldValue?.toString().toLowerCase().includes(filterLower);
        });
      }
    });

    return filtered;
  }, [allLicenses, debouncedColumnFilters]);

  // PAGINAÇÃO LOCAL - Otimizada para performance
  const paginatedLicenses = useMemo(() => {
    // Evita processamento desnecessário se não há dados
    if (filteredLicenses.length === 0) return [];
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredLicenses.slice(startIndex, endIndex);
  }, [filteredLicenses, currentPage, pageSize]);

  // INFORMAÇÕES DE PAGINAÇÃO - Otimizada
  const pagination = useMemo(() => {
    const total = filteredLicenses.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }, [filteredLicenses.length, currentPage, pageSize]);

  const licenses = paginatedLicenses;



  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/licenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses?limit=1000"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/stats"] });
      // Invalidar atividades com atualização forçada
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.refetchQueries({ queryKey: ["/api/activities"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/licenses?limit=1000"] });
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/stats"] });
      // Invalidar atividades com atualização forçada
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.refetchQueries({ queryKey: ["/api/activities"] });
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
    setColumnFilters(prev => {
      const newFilters = { ...prev, [columnId]: value };
      return newFilters;
    });
    // Só resetar página se não estiver vazio
    if (value !== '') {
      setCurrentPage(1);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
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



  const getVisibleColumnsInOrder = useCallback(() => {
    return columnOrder
      .map(id => AVAILABLE_COLUMNS.find(col => col.id === id))
      .filter((col): col is NonNullable<typeof col> => col !== undefined && visibleColumns.includes(col.id));
  }, [visibleColumns, columnOrder]);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  }, []);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumnOrder(prev => {
      const fromColumnId = prev[fromIndex];
      const toColumnId = prev[toIndex];
      
      // Não permitir mover colunas fixas (código e ações)
      if (fromColumnId === 'code' || fromColumnId === 'acoes' || 
          toColumnId === 'code' || toColumnId === 'acoes') {
        return prev;
      }
      
      const newOrder = [...prev];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      return newOrder;
    });
  }, []);

  const resetColumnOrder = useCallback(() => {
    setColumnOrder(AVAILABLE_COLUMNS.map(col => col.id));
  }, []);

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('licenses-filter-configs');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações salvas:', error);
      }
    }
    
    // Carregar última configuração aplicada
    const lastConfig = localStorage.getItem('licenses-last-config');
    if (lastConfig) {
      try {
        const config = JSON.parse(lastConfig);
        setVisibleColumns(config.visibleColumns || DEFAULT_VISIBLE_COLUMNS);
        setColumnOrder(config.columnOrder || AVAILABLE_COLUMNS.map(col => col.id));
        setColumnFilters(config.columnFilters || {});
      } catch (error) {
        console.error('Erro ao carregar última configuração:', error);
      }
    }
  }, []);

  const saveCurrentConfig = useCallback(() => {
    if (!configName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a configuração",
        variant: "destructive",
      });
      return;
    }

    const config = {
      name: configName.trim(),
      config: {
        visibleColumns,
        columnOrder,
        columnFilters
      }
    };

    const newConfigs = [...savedConfigs.filter(c => c.name !== configName.trim()), config];
    setSavedConfigs(newConfigs);
    localStorage.setItem('licenses-filter-configs', JSON.stringify(newConfigs));
    
    setConfigName('');
    setIsSaveConfigOpen(false);
    
    toast({
      title: "Sucesso",
      description: `Configuração "${config.name}" salva com sucesso!`,
    });
  }, [configName, visibleColumns, columnOrder, columnFilters, savedConfigs, toast]);

  const loadConfig = useCallback((config: any) => {
    setVisibleColumns(config.visibleColumns || DEFAULT_VISIBLE_COLUMNS);
    setColumnOrder(config.columnOrder || AVAILABLE_COLUMNS.map(col => col.id));
    setColumnFilters(config.columnFilters || {});
    setCurrentPage(1);
    
    // Salvar como última configuração
    localStorage.setItem('licenses-last-config', JSON.stringify(config));
    
    toast({
      title: "Configuração carregada",
      description: "Filtros e colunas aplicados com sucesso!",
    });
  }, [toast]);

  const deleteConfig = useCallback((configName: string) => {
    if (confirm(`Tem certeza que deseja excluir a configuração "${configName}"?`)) {
      const newConfigs = savedConfigs.filter(c => c.name !== configName);
      setSavedConfigs(newConfigs);
      localStorage.setItem('licenses-filter-configs', JSON.stringify(newConfigs));
      
      toast({
        title: "Configuração excluída",
        description: `"${configName}" foi removida`,
      });
    }
  }, [savedConfigs, toast]);

  const exportToCSV = useCallback(() => {
    const visibleCols = getVisibleColumnsInOrder().filter(col => col.id !== 'acoes');
    const headers = visibleCols.map(col => col.label);
    
    let csvContent = headers.join(';') + '\n';
    
    filteredLicenses.forEach((license: any) => {
      const row = visibleCols.map(col => {
        let value = license[col.id];
        if (col.id === 'ativo') {
          value = value ? 'Ativo' : 'Inativo';
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csvContent += row.join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `licencas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado!",
      description: `${filteredLicenses.length} licenças exportadas para CSV`,
    });
  }, [filteredLicenses, getVisibleColumnsInOrder, toast]);

  const exportToExcel = useCallback(() => {
    const visibleCols = getVisibleColumnsInOrder().filter(col => col.id !== 'acoes');
    const headers = visibleCols.map(col => col.label);
    
    const data = [
      headers,
      ...filteredLicenses.map((license: any) => 
        visibleCols.map(col => {
          const value = license[col.id];
          if (col.id === 'ativo') {
            return value ? 'Ativo' : 'Inativo';
          }
          return value || '';
        })
      )
    ];

    const worksheet = data.map(row => row.join('\t')).join('\n');
    const blob = new Blob([worksheet], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `licencas_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado!",
      description: `${filteredLicenses.length} licenças exportadas para Excel`,
    });
  }, [filteredLicenses, getVisibleColumnsInOrder, toast]);

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
    <div className="space-y-4">
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
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Todas as Licenças</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Mostrando {licenses.length} de {pagination.total} licenças
                {(Object.values(columnFilters).some(filter => filter !== "")) && 
                  ` (página ${pagination.page} de ${pagination.totalPages})`
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isSaveConfigOpen} onOpenChange={setIsSaveConfigOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300 hover:border-blue-400 text-blue-700 hover:text-blue-900 font-medium shadow-sm hover:shadow-lg transition-all duration-300 rounded-md px-3 py-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-500 transform -translate-x-full"></div>
                    <Save className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                    <span className="text-sm font-medium relative z-10">Salvar Filtros</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Salvar Configuração de Filtros</DialogTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Salve a configuração atual de colunas visíveis, ordem e filtros aplicados
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="config-name">Nome da Configuração</Label>
                      <Input
                        id="config-name"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="Ex: Filtros para relatório mensal"
                        className="mt-1"
                      />
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                      <p><strong>Esta configuração salvará:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Colunas visíveis ({visibleColumns.length} de {AVAILABLE_COLUMNS.length})</li>
                        <li>Ordem das colunas</li>
                        <li>Filtros aplicados ({Object.values(columnFilters).filter(f => f !== '').length} ativos)</li>
                      </ul>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsSaveConfigOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={saveCurrentConfig}>
                        Salvar Configuração
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {savedConfigs.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-900 font-medium shadow-sm hover:shadow-lg transition-all duration-300 rounded-md px-3 py-2 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-500 transform -translate-x-full"></div>
                      <Bookmark className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                      <span className="text-sm font-medium relative z-10">Carregar Filtros</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Configurações Salvas</DialogTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        Carregue uma configuração salva ou gerencie suas configurações
                      </p>
                    </DialogHeader>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {savedConfigs.map((saved, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{saved.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {saved.config.visibleColumns?.length || 0} colunas visíveis • {Object.values(saved.config.columnFilters || {}).filter((f: any) => f !== '').length} filtros
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadConfig(saved.config)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Carregar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteConfig(saved.name)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-300 hover:border-green-400 text-green-700 hover:text-green-900 font-medium shadow-sm hover:shadow-lg transition-all duration-300 rounded-md px-3 py-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-500 transform -translate-x-full"></div>
                    <Download className="h-4 w-4 group-hover:translate-y-1 transition-transform duration-300 relative z-10" />
                    <span className="text-sm font-medium relative z-10">Exportar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Exportar Licenças</DialogTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Exportando {filteredLicenses.length} de {allLicenses.length} licenças
                      {Object.values(columnFilters).some(filter => filter !== "") && 
                        " (com filtros aplicados)"
                      }
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <Button
                        onClick={() => exportToCSV()}
                        className="flex items-center justify-start space-x-3 h-12"
                        variant="outline"
                      >
                        <FileDown className="h-5 w-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">Exportar para CSV</div>
                          <div className="text-xs text-gray-500">Arquivo separado por vírgulas</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => exportToExcel()}
                        className="flex items-center justify-start space-x-3 h-12"
                        variant="outline"
                      >
                        <FileDown className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">Exportar para Excel</div>
                          <div className="text-xs text-gray-500">Planilha do Microsoft Excel</div>
                        </div>
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 border-t pt-3">
                      <p><strong>Nota:</strong> Apenas as colunas visíveis serão exportadas. Use "Configurar Colunas" para ajustar quais campos incluir.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isColumnConfigOpen} onOpenChange={setIsColumnConfigOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-medium shadow-sm hover:shadow-lg transition-all duration-300 rounded-md px-3 py-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-500 transform -translate-x-full"></div>
                    <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                    <span className="text-sm font-medium relative z-10">Configurar Colunas</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Configurar Colunas</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="visibility" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="visibility">Visibilidade</TabsTrigger>
                      <TabsTrigger value="order">Ordem</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="visibility" className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Selecione quais colunas deseja visualizar na tabela:
                      </p>
                      <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                        {AVAILABLE_COLUMNS.map(column => (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={column.id}
                              checked={visibleColumns.includes(column.id)}
                              onCheckedChange={() => toggleColumnVisibility(column.id)}
                              disabled={column.id === 'code' || column.id === 'acoes'}
                            />
                            <Label htmlFor={column.id} className="text-sm font-medium">
                              {column.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setVisibleColumns(AVAILABLE_COLUMNS.map(col => col.id))}
                        >
                          Selecionar Todas
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
                        >
                          Restaurar Padrão
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="order" className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Arraste as colunas para reordenar (Código e Ações não podem ser movidas):
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {columnOrder.map((columnId, index) => {
                          const column = AVAILABLE_COLUMNS.find(col => col.id === columnId);
                          if (!column) return null;
                          
                          const isFixed = columnId === 'code' || columnId === 'acoes';
                          
                          return (
                            <div 
                              key={columnId}
                              className={`flex items-center space-x-2 p-2 border rounded-lg ${
                                isFixed 
                                  ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                                  : 'bg-gray-50 hover:bg-gray-100 cursor-move'
                              }`}
                              draggable={!isFixed}
                              onDragStart={(e) => {
                                if (isFixed) {
                                  e.preventDefault();
                                  return;
                                }
                                e.dataTransfer.setData('text/plain', index.toString());
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                if (isFixed) return;
                                e.preventDefault();
                                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                const fromColumnId = columnOrder[fromIndex];
                                // Não permitir mover colunas fixas
                                if (fromColumnId === 'code' || fromColumnId === 'acoes') return;
                                moveColumn(fromIndex, index);
                              }}
                            >
                              <GripVertical className={`h-4 w-4 ${isFixed ? 'text-gray-300' : 'text-gray-400'}`} />
                              <span className="text-sm font-medium flex-1">{column.label}</span>
                              {isFixed && (
                                <Badge variant="outline" className="text-xs">
                                  Posição Fixa
                                </Badge>
                              )}
                              <Badge variant={visibleColumns.includes(columnId) ? "default" : "secondary"}>
                                {visibleColumns.includes(columnId) ? "Visível" : "Oculta"}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={resetColumnOrder}
                        >
                          Restaurar Ordem
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              {(Object.values(columnFilters).some(filter => filter !== "")) && (
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
          {/* Loading apenas no primeiro carregamento */}
          {isLoadingAll ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Erro ao carregar licenças: {(error as Error).message}</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/licenses?limit=1000"] })} 
                variant="outline" 
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : !allLicensesResponse || allLicenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Carregando dados...</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/licenses?limit=1000"] })} 
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
                              <div className="relative search-container">
                                <Input
                                  placeholder="Digite para filtrar..."
                                  value={columnFilters[column.id] || ''}
                                  onChange={(e) => updateColumnFilter(column.id, e.target.value)}
                                  className="h-7 text-xs bg-white border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary filter-input"
                                  onClick={(e) => e.stopPropagation()}
                                  autoComplete="off"
                                />
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {licenses.map((license: any) => (
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
              {licenses.length === 0 && !isLoadingAll && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma licença encontrada.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Paginação */}
          {!isLoadingAll && pagination.totalPages > 1 && (
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
