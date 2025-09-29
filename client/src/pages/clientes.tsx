
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Edit, Trash2, Clock, AlertTriangle, CheckCircle, XCircle, Calendar as CalendarIcon, User, Database, History, Settings, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClienteHistorico {
  id: number;
  codigoCliente: string;
  nomeCliente: string;
  ambiente?: string;
  versaoInstalada?: string;
  versaoAnterior?: string;
  tipoAtualizacao: string;
  observacoes?: string;
  responsavel: string;
  dataUltimoAcesso?: string;
  casoCritico: boolean;
  statusAtual: string;
  tempoGasto?: number;
  problemas?: string;
  solucoes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Cliente {
  code: string;
  nomeCliente: string;
}

const TIPOS_ATUALIZACAO = [
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'ATUALIZACAO', label: 'Atualização' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'ACESSO', label: 'Acesso/Suporte' },
];

const STATUS_OPTIONS = [
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'PENDENTE', label: 'Pendente' },
];

export default function Clientes() {
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHistorico, setEditingHistorico] = useState<ClienteHistorico | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar lista de clientes
  const { data: clientes } = useQuery({
    queryKey: ["/api/clientes/lista"],
    staleTime: 5 * 60 * 1000,
  });

  // Buscar histórico do cliente selecionado
  const { data: historico, isLoading } = useQuery({
    queryKey: ["/api/clientes-historico", selectedCliente],
    queryFn: () => apiRequest("GET", `/api/clientes-historico?codigoCliente=${selectedCliente}`),
    enabled: !!selectedCliente,
    staleTime: 30 * 1000,
  });

  // Buscar ambientes do cliente selecionado
  const { data: ambientes } = useQuery({
    queryKey: ["/api/clientes", selectedCliente, "ambientes"],
    enabled: !!selectedCliente,
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar histórico
  const filteredHistorico = useMemo(() => {
    if (!historico) return [];

    return historico.filter((item: ClienteHistorico) => {
      const matchesStatus = filterStatus === "all" || item.statusAtual === filterStatus;
      const matchesTipo = filterTipo === "all" || item.tipoAtualizacao === filterTipo;
      const matchesSearch = !searchTerm || 
        item.ambiente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.versaoInstalada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.responsavel.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesTipo && matchesSearch;
    });
  }, [historico, filterStatus, filterTipo, searchTerm]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/clientes-historico", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes-historico"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Histórico criado com sucesso!",
      });
      setIsCreateModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar histórico. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; historico: any }) => {
      return await apiRequest("PUT", `/api/clientes-historico/${data.id}`, data.historico);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes-historico"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Histórico atualizado com sucesso!",
      });
      setIsEditModalOpen(false);
      setEditingHistorico(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar histórico. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clientes-historico/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes-historico"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Histórico excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir histórico. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (historico: ClienteHistorico) => {
    setEditingHistorico(historico);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'EM_ANDAMENTO':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PENDENTE':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
      case 'EM_ANDAMENTO':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Andamento</Badge>;
      case 'PENDENTE':
        return <Badge variant="destructive">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoAtualizacaoLabel = (tipo: string) => {
    const tipoObj = TIPOS_ATUALIZACAO.find(t => t.value === tipo);
    return tipoObj?.label || tipo;
  };

  // Modal Form Component
  const HistoricoForm = ({ isEdit = false, initialData = null, onSubmit, ambientes = [] }: any) => {
    const [formData, setFormData] = useState({
      codigoCliente: initialData?.codigoCliente || selectedCliente || "",
      nomeCliente: initialData?.nomeCliente || (clientes?.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente || ""),
      ambiente: initialData?.ambiente || "",
      versaoInstalada: initialData?.versaoInstalada || "",
      versaoAnterior: initialData?.versaoAnterior || "",
      tipoAtualizacao: initialData?.tipoAtualizacao || "ATUALIZACAO",
      observacoes: initialData?.observacoes || "",
      responsavel: initialData?.responsavel || "",
      dataUltimoAcesso: initialData?.dataUltimoAcesso || "",
      casoCritico: initialData?.casoCritico || false,
      statusAtual: initialData?.statusAtual || "CONCLUIDO",
      tempoGasto: initialData?.tempoGasto || "",
      problemas: initialData?.problemas || "",
      solucoes: initialData?.solucoes || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="problemas">Problemas</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigoCliente">Código do Cliente</Label>
                <Select
                  value={formData.codigoCliente}
                  onValueChange={(value) => {
                    const cliente = clientes?.find((c: Cliente) => c.code === value);
                    setFormData(prev => ({
                      ...prev,
                      codigoCliente: value,
                      nomeCliente: cliente?.nomeCliente || ""
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((cliente: Cliente) => (
                      <SelectItem key={cliente.code} value={cliente.code}>
                        {cliente.code} - {cliente.nomeCliente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ambiente">Ambiente/Base</Label>
                <Select
                  value={formData.ambiente}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ambiente: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ambiente" />
                  </SelectTrigger>
                  <SelectContent>
                    {ambientes?.map((ambiente: string) => (
                      <SelectItem key={ambiente} value={ambiente}>
                        {ambiente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipoAtualizacao">Tipo de Atualização</Label>
                <Select
                  value={formData.tipoAtualizacao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipoAtualizacao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ATUALIZACAO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statusAtual">Status Atual</Label>
                <Select
                  value={formData.statusAtual}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, statusAtual: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tempoGasto">Tempo Gasto (minutos)</Label>
                <Input
                  id="tempoGasto"
                  type="number"
                  value={formData.tempoGasto}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempoGasto: e.target.value }))}
                  placeholder="Ex: 120"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="casoCritico"
                checked={formData.casoCritico}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, casoCritico: checked }))}
              />
              <Label htmlFor="casoCritico" className="text-sm font-medium">
                Caso Crítico
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="versaoAnterior">Versão Anterior</Label>
                <Input
                  id="versaoAnterior"
                  value={formData.versaoAnterior}
                  onChange={(e) => setFormData(prev => ({ ...prev, versaoAnterior: e.target.value }))}
                  placeholder="Ex: 1.0.0"
                />
              </div>

              <div>
                <Label htmlFor="versaoInstalada">Versão Instalada</Label>
                <Input
                  id="versaoInstalada"
                  value={formData.versaoInstalada}
                  onChange={(e) => setFormData(prev => ({ ...prev, versaoInstalada: e.target.value }))}
                  placeholder="Ex: 1.0.1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dataUltimoAcesso">Data do Último Acesso</Label>
              <Input
                id="dataUltimoAcesso"
                type="datetime-local"
                value={formData.dataUltimoAcesso ? new Date(formData.dataUltimoAcesso).toISOString().slice(0, 16) : ""}
                onChange={(e) => setFormData(prev => ({ ...prev, dataUltimoAcesso: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Descreva o que foi feito, configurações aplicadas, etc..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="problemas" className="space-y-4">
            <div>
              <Label htmlFor="problemas">Problemas Encontrados</Label>
              <Textarea
                id="problemas"
                value={formData.problemas}
                onChange={(e) => setFormData(prev => ({ ...prev, problemas: e.target.value }))}
                placeholder="Descreva os problemas encontrados durante a atualização/acesso..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="solucoes">Soluções Aplicadas</Label>
              <Textarea
                id="solucoes"
                value={formData.solucoes}
                onChange={(e) => setFormData(prev => ({ ...prev, solucoes: e.target.value }))}
                placeholder="Descreva as soluções aplicadas para resolver os problemas..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? "Atualizar" : "Criar"} Histórico
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Clientes</h1>
          <p className="text-slate-600 mt-1">Histórico de atualizações, acessos e suporte aos clientes</p>
        </div>
      </div>

      {/* Seleção de Cliente */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Selecionar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um cliente para ver seu histórico" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente: Cliente) => (
                    <SelectItem key={cliente.code} value={cliente.code}>
                      {cliente.code} - {cliente.nomeCliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCliente && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Novo Histórico</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Histórico</DialogTitle>
                  </DialogHeader>
                  <HistoricoForm
                    ambientes={ambientes}
                    onSubmit={(data: any) => createMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Histórico */}
      {selectedCliente && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Histórico - {clientes?.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    {TIPOS_ATUALIZACAO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredHistorico?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum histórico encontrado para este cliente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistorico?.map((item: ClienteHistorico) => (
                  <Card key={item.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {getStatusIcon(item.statusAtual)}
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {getTipoAtualizacaoLabel(item.tipoAtualizacao)}
                                {item.ambiente && ` - ${item.ambiente}`}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{item.responsavel}</span>
                                </span>
                                <span>{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                                {item.tempoGasto && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{item.tempoGasto} min</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.casoCritico && (
                              <Badge variant="destructive" className="flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Crítico</span>
                              </Badge>
                            )}
                            {getStatusBadge(item.statusAtual)}
                          </div>
                          
                          {(item.versaoAnterior || item.versaoInstalada) && (
                            <div className="mb-2 text-sm">
                              <span className="text-gray-600">Versão: </span>
                              {item.versaoAnterior && <span className="text-red-600">{item.versaoAnterior}</span>}
                              {item.versaoAnterior && item.versaoInstalada && <span className="mx-2">→</span>}
                              {item.versaoInstalada && <span className="text-green-600">{item.versaoInstalada}</span>}
                            </div>
                          )}
                          
                          {item.observacoes && (
                            <p className="text-sm text-gray-700 mb-2">{item.observacoes}</p>
                          )}
                          
                          {item.problemas && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-red-600">Problemas:</span>
                              <p className="text-sm text-gray-600 mt-1">{item.problemas}</p>
                            </div>
                          )}
                          
                          {item.solucoes && (
                            <div>
                              <span className="text-sm font-medium text-green-600">Soluções:</span>
                              <p className="text-sm text-gray-600 mt-1">{item.solucoes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="p-2 h-8 w-8"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O histórico será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Histórico</DialogTitle>
          </DialogHeader>
          {editingHistorico && (
            <HistoricoForm
              isEdit={true}
              initialData={editingHistorico}
              ambientes={ambientes}
              onSubmit={(data: any) => updateMutation.mutate({ id: editingHistorico.id, historico: data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
