import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Search, Plus, Copy, Download, Settings, Info, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import NewLicenseModal from "@/components/modals/new-license-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define available columns
const AVAILABLE_COLUMNS = [
  { id: 'codCliente', label: 'Código Cliente', width: '120px', sticky: 'left' },
  { id: 'ativo', label: 'Status', width: '80px' },
  { id: 'nomeCliente', label: 'Nome do Cliente', width: '180px' },
  { id: 'dadosEmpresa', label: 'Dados Empresa', width: '150px' },
  { id: 'hardwareKey', label: 'Hardware Key', width: '160px' },
  { id: 'installNumber', label: 'Install Number', width: '120px' },
  { id: 'systemNumber', label: 'System Number', width: '120px' },
  { id: 'nomeDb', label: 'Nome DB', width: '120px' },
  { id: 'descDb', label: 'Desc. DB', width: '120px' },
  { id: 'endApi', label: 'End. API', width: '140px' },
  { id: 'listaCnpj', label: 'Lista CNPJ', width: '130px' },
  { id: 'qtLicencas', label: 'Qt.Lic.', width: '80px' },
  { id: 'qtLicencasAdicionais', label: 'Qt.Lic.Adicionais', width: '120px' },
  { id: 'versaoSap', label: 'Versão SAP', width: '100px' },
  { id: 'observacao', label: 'Observação', width: '120px' },
  { id: 'acoes', label: 'Ações', width: '100px', sticky: 'right' }
];

export default function Licenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(
    AVAILABLE_COLUMNS.map(col => col.id)
  );
  const [columnOrder, setColumnOrder] = useState(
    AVAILABLE_COLUMNS.map(col => col.id)
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: licenses, isLoading } = useQuery({
    queryKey: ["/api/licenses"],
  });

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

  const filteredLicenses = licenses?.filter((license: any) =>
    license.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.codCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.hardwareKey?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta licença?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (license: any) => {
    setEditingLicense({ ...license });
    setIsEditModalOpen(true);
  };

  const handleUpdateLicense = () => {
    if (editingLicense) {
      updateMutation.mutate({
        id: editingLicense.id,
        license: editingLicense
      });
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${field} copiado para a área de transferência`,
      });
    });
  };

  const copyFullRow = (license: any) => {
    const rowData = [
      license.codCliente || '',
      license.ativo ? 'Ativo' : 'Inativo',
      license.nomeCliente || '',
      license.dadosEmpresa || '',
      license.hardwareKey || '',
      license.installNumber || '',
      license.systemNumber || '',
      license.nomeDb || '',
      license.descDb || '',
      license.endApi || '',
      license.listaCnpj || '',
      license.qtLicencas || '',
      license.qtLicencasAdicionais || '',
      license.versaoSap || '',
      license.observacao || ''
    ].join('\t');

    navigator.clipboard.writeText(rowData).then(() => {
      toast({
        title: "Linha copiada!",
        description: "Todas as informações da licença foram copiadas",
      });
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    setColumnOrder(prev => {
      const currentIndex = prev.indexOf(columnId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newOrder = [...prev];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      return newOrder;
    });
  };

  const getVisibleColumnsInOrder = () => {
    return columnOrder
      .filter(colId => visibleColumns.includes(colId))
      .map(colId => AVAILABLE_COLUMNS.find(col => col.id === colId))
      .filter(Boolean);
  };

  const renderCellContent = (license: any, column: any) => {
    const value = license[column.id];
    
    switch (column.id) {
      case 'codCliente':
        return (
          <div className="flex items-center group">
            <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-semibold">
              {value || 'N/A'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-blue-100"
              onClick={() => copyToClipboard(value || '', 'Código do Cliente')}
            >
              <Copy className="w-3 h-3 text-blue-600" />
            </Button>
          </div>
        );
      
      case 'ativo':
        return (
          <div className="flex items-center group">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {value ? "Ativo" : "Inativo"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
              onClick={() => copyToClipboard(value ? 'Ativo' : 'Inativo', 'Status')}
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </Button>
          </div>
        );

      case 'hardwareKey':
        return (
          <div className="flex items-center group">
            <span className="font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded text-xs truncate max-w-[140px]" title={value || 'N/A'}>
              {value || 'N/A'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
              onClick={() => copyToClipboard(value || '', 'Hardware Key')}
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </Button>
          </div>
        );

      case 'qtLicencas':
      case 'qtLicencasAdicionais':
        return (
          <div className="flex items-center justify-center group">
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {value || '0'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
              onClick={() => copyToClipboard(value?.toString() || '0', column.label)}
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </Button>
          </div>
        );

      case 'observacao':
        return (
          <div className="flex items-center group">
            {value && value.trim() ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-help">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="ml-1 text-xs text-gray-500">Ver obs.</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="text-sm">{value}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-xs text-gray-400">Sem obs.</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 h-6 w-6 hover:bg-gray-100"
              onClick={() => copyToClipboard(value || '', 'Observação')}
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </Button>
          </div>
        );

      case 'installNumber':
      case 'systemNumber':
        return (
          <div className="flex items-center group">
            <span className="font-mono text-gray-600 text-xs">
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

      case 'acoes':
        return (
          <div className="flex items-center justify-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-7 w-7 hover:bg-blue-50 text-blue-600"
              onClick={() => copyFullRow(license)}
              title="Copiar linha completa"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-7 w-7 hover:bg-gray-100 text-gray-500"
              onClick={() => handleEdit(license)}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerenciamento de Licenças</h1>
          <p className="text-slate-600 mt-1">Gerencie todas as licenças e suas informações detalhadas</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Filtrar</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configurar Colunas</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Exibição de Colunas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-600">
                  Selecione as colunas que deseja exibir e organize a ordem:
                </p>
                {columnOrder.map((colId, index) => {
                  const column = AVAILABLE_COLUMNS.find(col => col.id === colId);
                  if (!column) return null;
                  
                  return (
                    <div key={colId} className="flex items-center space-x-3 p-2 border rounded-lg">
                      <Checkbox
                        checked={visibleColumns.includes(colId)}
                        onCheckedChange={() => toggleColumnVisibility(colId)}
                        disabled={column.sticky === 'left' || column.sticky === 'right'}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{column.label}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6"
                          onClick={() => moveColumn(colId, 'up')}
                          disabled={index === 0}
                        >
                          <GripVertical className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6"
                          onClick={() => moveColumn(colId, 'down')}
                          disabled={index === columnOrder.length - 1}
                        >
                          <GripVertical className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVisibleColumns(AVAILABLE_COLUMNS.map(col => col.id));
                      setColumnOrder(AVAILABLE_COLUMNS.map(col => col.id));
                    }}
                  >
                    Restaurar Padrão
                  </Button>
                  <Button onClick={() => setIsConfigOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <NewLicenseModal />
        </div>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Todas as Licenças</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Mostrando {filteredLicenses.length} de {licenses?.length || 0} licenças</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar licenças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
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
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredLicenses.map((license: any) => (
                      <tr key={license.id} className="hover:bg-gray-50 transition-colors duration-150">
                        {getVisibleColumnsInOrder().map((column) => (
                          <td
                            key={column.id}
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
        </CardContent>
      </Card>

      {/* Modal de Edição com Abas */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border border-[#e0e0e0] shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#3a3a3c]">Editar Licença</DialogTitle>
            <p className="text-sm text-[#3a3a3c] mt-2">Atualize as informações da licença</p>
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
                    <Input
                      id="edit-codCliente"
                      value={editingLicense.codCliente || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, codCliente: e.target.value})}
                      placeholder="C0001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nomeCliente">Nome do Cliente</Label>
                    <Input
                      id="edit-nomeCliente"
                      value={editingLicense.nomeCliente || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, nomeCliente: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-dadosEmpresa">Dados da Empresa</Label>
                  <Textarea
                    id="edit-dadosEmpresa"
                    value={editingLicense.dadosEmpresa || ''}
                    onChange={(e) => setEditingLicense({...editingLicense, dadosEmpresa: e.target.value})}
                    placeholder="Informações da empresa..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-listaCnpj">Lista de CNPJ</Label>
                  <Input
                    id="edit-listaCnpj"
                    value={editingLicense.listaCnpj || ''}
                    onChange={(e) => setEditingLicense({...editingLicense, listaCnpj: e.target.value})}
                    placeholder="12.345.678/0001-90"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="ambiente" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-hardwareKey">Hardware Key</Label>
                    <Input
                      id="edit-hardwareKey"
                      value={editingLicense.hardwareKey || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, hardwareKey: e.target.value})}
                      placeholder="ABC123XYZ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-installNumber">Install Number</Label>
                    <Input
                      id="edit-installNumber"
                      value={editingLicense.installNumber || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, installNumber: e.target.value})}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-systemNumber">System Number</Label>
                    <Input
                      id="edit-systemNumber"
                      value={editingLicense.systemNumber || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, systemNumber: e.target.value})}
                      placeholder="000000000312513489"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nomeDb">Nome do Database</Label>
                    <Input
                      id="edit-nomeDb"
                      value={editingLicense.nomeDb || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, nomeDb: e.target.value})}
                      placeholder="SBO_EMPRESA"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-descDb">Descrição do Database</Label>
                  <Textarea
                    id="edit-descDb"
                    value={editingLicense.descDb || ''}
                    onChange={(e) => setEditingLicense({...editingLicense, descDb: e.target.value})}
                    placeholder="Base de produção..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-endApi">Endereço da API</Label>
                    <Input
                      id="edit-endApi"
                      value={editingLicense.endApi || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, endApi: e.target.value})}
                      placeholder="http://servidor:8090/SBO_DB/DWUAPI"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-versaoSap">Versão SAP</Label>
                    <Input
                      id="edit-versaoSap"
                      value={editingLicense.versaoSap || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, versaoSap: e.target.value})}
                      placeholder="1000230"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="licenca" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-ativo"
                    checked={editingLicense.ativo}
                    onCheckedChange={(checked) => setEditingLicense({...editingLicense, ativo: checked})}
                  />
                  <Label htmlFor="edit-ativo">Licença Ativa</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-qtLicencas">Quantidade de Licenças</Label>
                    <Input
                      id="edit-qtLicencas"
                      type="number"
                      value={editingLicense.qtLicencas || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, qtLicencas: parseInt(e.target.value) || 0})}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-qtLicencasAdicionais">Licenças Adicionais</Label>
                    <Input
                      id="edit-qtLicencasAdicionais"
                      type="number"
                      value={editingLicense.qtLicencasAdicionais || ''}
                      onChange={(e) => setEditingLicense({...editingLicense, qtLicencasAdicionais: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-observacao">Observação</Label>
                  <Textarea
                    id="edit-observacao"
                    value={editingLicense.observacao || ''}
                    onChange={(e) => setEditingLicense({...editingLicense, observacao: e.target.value})}
                    placeholder="Observações adicionais..."
                    rows={4}
                  />
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