
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
import { Building2, Plus, Edit, Trash2, Clock, AlertTriangle, CheckCircle, XCircle, Calendar as CalendarIcon, User, Database, History, Settings, Filter, Search, Paperclip, Upload, FileImage, CheckSquare } from "lucide-react";
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
  anexos?: string[];
  checklistInstalacao?: string;
  checklistAtualizacao?: string;
  observacoesChecklist?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistInstalacao {
  modulosWinServer: boolean;
  diServer: boolean;
  dcom: boolean;
  permissoesPastas: boolean;
  criacaoSitesProducaoHomologacao: boolean;
  criacaoServicos: boolean;
  criacaoGateways: boolean;
  usuarioAdminB1WS: boolean;
  instalacaoMotorEmail: boolean;
  instalacaoMobile: boolean;
  // Sessão Validação
  validacaoLogin: boolean;
  validacaoNavegacao: boolean;
  validacaoImpressao: boolean;
  validacaoAtualizacao: boolean;
}

interface ChecklistAtualizacao {
  backups: boolean;
  atualizacaoPastasApiSites: boolean;
  validacaoLogin: boolean;
  validacaoNavegacao: boolean;
  validacaoImpressaoLayouts: boolean;
  validacaoAtualizacao: boolean;
}

interface Cliente {
  code: string;
  nomeCliente: string;
}

const TIPOS_ACAO = [
  { value: 'ATUALIZACAO_MOBILE', label: 'Atualização Mobile/App' },
  { value: 'ATUALIZACAO_PORTAL', label: 'Atualização Portal' },
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'ACESSO_REMOTO', label: 'Acesso remoto - Padrão' },
  { value: 'ATENDIMENTO_WHATSAPP', label: 'Atendimento WhatsApp' },
  { value: 'REUNIAO_CLIENTE', label: 'Reunião com cliente' },
];

const CHECKLIST_INSTALACAO_DEFAULT: ChecklistInstalacao = {
  modulosWinServer: false,
  diServer: false,
  dcom: false,
  permissoesPastas: false,
  criacaoSitesProducaoHomologacao: false,
  criacaoServicos: false,
  criacaoGateways: false,
  usuarioAdminB1WS: false,
  instalacaoMotorEmail: false,
  instalacaoMobile: false,
  validacaoLogin: false,
  validacaoNavegacao: false,
  validacaoImpressao: false,
  validacaoAtualizacao: false,
};

const CHECKLIST_ATUALIZACAO_DEFAULT: ChecklistAtualizacao = {
  backups: false,
  atualizacaoPastasApiSites: false,
  validacaoLogin: false,
  validacaoNavegacao: false,
  validacaoImpressaoLayouts: false,
  validacaoAtualizacao: false,
};

const STATUS_OPTIONS = [
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'PENDENTE', label: 'Pendente' },
];

export default function Clientes() {
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [clienteSearchTerm, setClienteSearchTerm] = useState<string>("");
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

  // Filtrar clientes baseado na busca
  const filteredClientes = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) return [];
    if (!clienteSearchTerm) return clientes;

    return clientes.filter((cliente: Cliente) => 
      cliente.code.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
      cliente.nomeCliente.toLowerCase().includes(clienteSearchTerm.toLowerCase())
    );
  }, [clientes, clienteSearchTerm]);

  // Buscar histórico do cliente selecionado
  const { data: historico, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/clientes-historico", selectedCliente],
    queryFn: async () => {
      try {
        console.log(`Making API request for cliente: ${selectedCliente}`);
        console.log(`Full URL: /api/clientes-historico?codigoCliente=${selectedCliente}`);
        
        const result = await apiRequest("GET", `/api/clientes-historico?codigoCliente=${selectedCliente}`);
        console.log("Raw API Response:", result);
        console.log("API Response type:", typeof result);
        console.log("API Response isArray:", Array.isArray(result));
        console.log("API Response stringified:", JSON.stringify(result));
        
        // Verificações múltiplas para garantir que sempre temos um array
        if (result === null || result === undefined) {
          console.log("Result is null/undefined, returning empty array");
          return [];
        }
        
        if (Array.isArray(result)) {
          console.log("Result is array with", result.length, "items");
          console.log("First item:", result[0]);
          return result;
        }
        
        // Se não for array, tentar extrair dados se for um wrapper
        if (typeof result === 'object' && result.data && Array.isArray(result.data)) {
          console.log("Result has data property, extracting array");
          return result.data;
        }
        
        // Se result for um objeto vazio, retornar array vazio
        if (typeof result === 'object' && Object.keys(result).length === 0) {
          console.log("Result is empty object, returning empty array");
          return [];
        }
        
        console.warn("Result is not an array, type:", typeof result, "value:", result);
        return [];
      } catch (error) {
        console.error("Error in queryFn:", error);
        return [];
      }
    },
    enabled: !!selectedCliente,
    staleTime: 30 * 1000,
    retry: 1,
  });

  // Buscar ambientes do cliente selecionado
  const { data: ambientes } = useQuery({
    queryKey: ["/api/clientes", selectedCliente, "ambientes"],
    enabled: !!selectedCliente,
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar histórico
  const filteredHistorico = useMemo(() => {
    console.log("Filtering historico:", { 
      historico, 
      isArray: Array.isArray(historico), 
      type: typeof historico,
      length: historico?.length 
    });
    
    // Verificações múltiplas de segurança
    if (!historico) {
      console.log("No historico data");
      return [];
    }
    
    if (!Array.isArray(historico)) {
      console.error("Historico is not an array:", historico);
      return [];
    }

    if (historico.length === 0) {
      console.log("Historico is empty array");
      return [];
    }

    try {
      const filtered = historico.filter((item: ClienteHistorico) => {
        if (!item || typeof item !== 'object') {
          console.warn("Invalid item in historico:", item);
          return false;
        }
        
        const matchesStatus = filterStatus === "all" || item.statusAtual === filterStatus;
        const matchesTipo = filterTipo === "all" || item.tipoAtualizacao === filterTipo;
        const matchesSearch = !searchTerm || 
          item.ambiente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.versaoInstalada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesTipo && matchesSearch;
      });

      console.log("Filtered historico result:", filtered.length, "items");
      return filtered;
    } catch (error) {
      console.error("Error filtering historico:", error);
      return [];
    }
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

  const getTipoAcaoLabel = (tipo: string) => {
    const tipoObj = TIPOS_ACAO.find(t => t.value === tipo);
    return tipoObj?.label || tipo;
  };

  // Modal Form Component
  const HistoricoForm = ({ isEdit = false, initialData = null, onSubmit, ambientes = [] }: any) => {
    const [formData, setFormData] = useState({
      codigoCliente: initialData?.codigoCliente || selectedCliente || "",
      nomeCliente: initialData?.nomeCliente || (Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente || "" : ""),
      ambiente: initialData?.ambiente || "",
      versaoInstalada: initialData?.versaoInstalada || "",
      versaoAnterior: initialData?.versaoAnterior || "",
      tipoAtualizacao: initialData?.tipoAtualizacao || "ATUALIZACAO_MOBILE",
      observacoes: initialData?.observacoes || "",
      responsavel: initialData?.responsavel || "",
      dataUltimoAcesso: initialData?.dataUltimoAcesso || "",
      casoCritico: initialData?.casoCritico || false,
      statusAtual: initialData?.statusAtual || "CONCLUIDO",
      tempoGasto: initialData?.tempoGasto || "",
      problemas: initialData?.problemas || "",
      solucoes: initialData?.solucoes || "",
      anexos: initialData?.anexos || [],
      observacoesChecklist: initialData?.observacoesChecklist || "",
    });

    const [checklistInstalacao, setChecklistInstalacao] = useState<ChecklistInstalacao>(() => {
      if (initialData?.checklistInstalacao) {
        try {
          return JSON.parse(initialData.checklistInstalacao);
        } catch {
          return CHECKLIST_INSTALACAO_DEFAULT;
        }
      }
      return CHECKLIST_INSTALACAO_DEFAULT;
    });

    const [checklistAtualizacao, setChecklistAtualizacao] = useState<ChecklistAtualizacao>(() => {
      if (initialData?.checklistAtualizacao) {
        try {
          return JSON.parse(initialData.checklistAtualizacao);
        } catch {
          return CHECKLIST_ATUALIZACAO_DEFAULT;
        }
      }
      return CHECKLIST_ATUALIZACAO_DEFAULT;
    });

    const [newAnexo, setNewAnexo] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        checklistInstalacao: formData.tipoAtualizacao === 'INSTALACAO' ? JSON.stringify(checklistInstalacao) : null,
        checklistAtualizacao: ['ATUALIZACAO_MOBILE', 'ATUALIZACAO_PORTAL'].includes(formData.tipoAtualizacao) ? JSON.stringify(checklistAtualizacao) : null,
      };
      onSubmit(submitData);
    };

    const addAnexo = () => {
      if (newAnexo.trim()) {
        setFormData(prev => ({
          ...prev,
          anexos: [...(prev.anexos || []), newAnexo.trim()]
        }));
        setNewAnexo("");
      }
    };

    const removeAnexo = (index: number) => {
      setFormData(prev => ({
        ...prev,
        anexos: (prev.anexos || []).filter((_: string, i: number) => i !== index)
      }));
    };

    const updateChecklistInstalacao = (field: keyof ChecklistInstalacao, value: boolean) => {
      setChecklistInstalacao(prev => ({ ...prev, [field]: value }));
    };

    const updateChecklistAtualizacao = (field: keyof ChecklistAtualizacao, value: boolean) => {
      setChecklistAtualizacao(prev => ({ ...prev, [field]: value }));
    };

    const showChecklistInstalacao = formData.tipoAtualizacao === 'INSTALACAO';
    const showChecklistAtualizacao = ['ATUALIZACAO_MOBILE', 'ATUALIZACAO_PORTAL'].includes(formData.tipoAtualizacao);

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className={`grid w-full ${showChecklistInstalacao || showChecklistAtualizacao ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
            {showChecklistInstalacao && (
              <TabsTrigger value="checklist-instalacao">Checklist Instalação</TabsTrigger>
            )}
            {showChecklistAtualizacao && (
              <TabsTrigger value="checklist-atualizacao">Checklist Atualização</TabsTrigger>
            )}
            <TabsTrigger value="problemas">Problemas</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigoCliente">Código do Cliente</Label>
                <Select
                  value={formData.codigoCliente}
                  onValueChange={(value) => {
                    const cliente = Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === value) : undefined;
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
                  <SelectContent className="max-h-[200px]">
                    {Array.isArray(clientes) ? clientes.map((cliente: Cliente) => (
                      <SelectItem key={cliente.code} value={cliente.code}>
                        {cliente.code} - {cliente.nomeCliente}
                      </SelectItem>
                    )) : null}
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
                <Label htmlFor="tipoAtualizacao">Tipo de Ação</Label>
                <Select
                  value={formData.tipoAtualizacao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipoAtualizacao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ACAO.map((tipo) => (
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

          <TabsContent value="anexos" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-slate-800">
                <Paperclip className="w-5 h-5" />
                <span>Anexos (Prints e Documentos)</span>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={newAnexo}
                  onChange={(e) => setNewAnexo(e.target.value)}
                  placeholder="Cole o link do print ou documento..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAnexo())}
                />
                <Button type="button" onClick={addAnexo} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.anexos && formData.anexos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Anexos Adicionados:</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.anexos.map((anexo: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg bg-slate-50">
                        <div className="flex items-center space-x-2 flex-1">
                          <FileImage className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-slate-700 truncate">{anexo}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnexo(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-blue-800">
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">Dica:</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Você pode adicionar links de prints hospedados em serviços como imgur, google drive, ou outros repositórios de imagens.
                </p>
              </div>
            </div>
          </TabsContent>

          {showChecklistInstalacao && (
            <TabsContent value="checklist-instalacao" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-lg font-semibold text-slate-800">
                  <CheckSquare className="w-5 h-5" />
                  <span>Checklist de Instalação</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-slate-700 mb-3">Módulos e Configurações</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="modulosWinServer"
                          checked={checklistInstalacao.modulosWinServer}
                          onChange={(e) => updateChecklistInstalacao('modulosWinServer', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="modulosWinServer" className="text-sm">Módulos do win server</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="diServer"
                          checked={checklistInstalacao.diServer}
                          onChange={(e) => updateChecklistInstalacao('diServer', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="diServer" className="text-sm">DI-Server</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="dcom"
                          checked={checklistInstalacao.dcom}
                          onChange={(e) => updateChecklistInstalacao('dcom', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="dcom" className="text-sm">Dcom</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="permissoesPastas"
                          checked={checklistInstalacao.permissoesPastas}
                          onChange={(e) => updateChecklistInstalacao('permissoesPastas', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="permissoesPastas" className="text-sm">Permissão das pastas e afins</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="criacaoSitesProducaoHomologacao"
                          checked={checklistInstalacao.criacaoSitesProducaoHomologacao}
                          onChange={(e) => updateChecklistInstalacao('criacaoSitesProducaoHomologacao', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="criacaoSitesProducaoHomologacao" className="text-sm">Criação dos sites PRODUÇÃO E HOMOLOGAÇÃO</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="criacaoServicos"
                          checked={checklistInstalacao.criacaoServicos}
                          onChange={(e) => updateChecklistInstalacao('criacaoServicos', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="criacaoServicos" className="text-sm">Criação dos serviços</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="criacaoGateways"
                          checked={checklistInstalacao.criacaoGateways}
                          onChange={(e) => updateChecklistInstalacao('criacaoGateways', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="criacaoGateways" className="text-sm">Criação dos gateways</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="usuarioAdminB1WS"
                          checked={checklistInstalacao.usuarioAdminB1WS}
                          onChange={(e) => updateChecklistInstalacao('usuarioAdminB1WS', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="usuarioAdminB1WS" className="text-sm">Usuário admin nos B1WS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="instalacaoMotorEmail"
                          checked={checklistInstalacao.instalacaoMotorEmail}
                          onChange={(e) => updateChecklistInstalacao('instalacaoMotorEmail', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="instalacaoMotorEmail" className="text-sm">Instalação motor de e-mail</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="instalacaoMobile"
                          checked={checklistInstalacao.instalacaoMobile}
                          onChange={(e) => updateChecklistInstalacao('instalacaoMobile', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="instalacaoMobile" className="text-sm">Instalação mobile</Label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-slate-700 mb-3">SESSÃO VALIDAÇÃO</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoLogin"
                          checked={checklistInstalacao.validacaoLogin}
                          onChange={(e) => updateChecklistInstalacao('validacaoLogin', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoLogin" className="text-sm">Login</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoNavegacao"
                          checked={checklistInstalacao.validacaoNavegacao}
                          onChange={(e) => updateChecklistInstalacao('validacaoNavegacao', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoNavegacao" className="text-sm">Navegação dos menus</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoImpressao"
                          checked={checklistInstalacao.validacaoImpressao}
                          onChange={(e) => updateChecklistInstalacao('validacaoImpressao', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoImpressao" className="text-sm">Impressão de layout</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoAtualizacao"
                          checked={checklistInstalacao.validacaoAtualizacao}
                          onChange={(e) => updateChecklistInstalacao('validacaoAtualizacao', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoAtualizacao" className="text-sm">Atualização de documentos (base homologação)</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacoesChecklistInstalacao">Observações do Checklist</Label>
                    <Textarea
                      id="observacoesChecklistInstalacao"
                      value={formData.observacoesChecklist}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoesChecklist: e.target.value }))}
                      placeholder="Observações gerais sobre o checklist de instalação..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {showChecklistAtualizacao && (
            <TabsContent value="checklist-atualizacao" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-lg font-semibold text-slate-800">
                  <CheckSquare className="w-5 h-5" />
                  <span>Checklist de Atualização</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-slate-700 mb-3">Itens de Verificação</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="backups"
                          checked={checklistAtualizacao.backups}
                          onChange={(e) => updateChecklistAtualizacao('backups', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="backups" className="text-sm">Backups</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="atualizacaoPastasApiSites"
                          checked={checklistAtualizacao.atualizacaoPastasApiSites}
                          onChange={(e) => updateChecklistAtualizacao('atualizacaoPastasApiSites', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="atualizacaoPastasApiSites" className="text-sm">Atualização das pastas (API e Sites)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoLoginAtualizacao"
                          checked={checklistAtualizacao.validacaoLogin}
                          onChange={(e) => updateChecklistAtualizacao('validacaoLogin', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoLoginAtualizacao" className="text-sm">Validação login</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoNavegacaoAtualizacao"
                          checked={checklistAtualizacao.validacaoNavegacao}
                          onChange={(e) => updateChecklistAtualizacao('validacaoNavegacao', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoNavegacaoAtualizacao" className="text-sm">Validação navegação</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoImpressaoLayouts"
                          checked={checklistAtualizacao.validacaoImpressaoLayouts}
                          onChange={(e) => updateChecklistAtualizacao('validacaoImpressaoLayouts', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoImpressaoLayouts" className="text-sm">Validação impressão de layouts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="validacaoAtualizacaoAtualizacao"
                          checked={checklistAtualizacao.validacaoAtualizacao}
                          onChange={(e) => updateChecklistAtualizacao('validacaoAtualizacao', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="validacaoAtualizacaoAtualizacao" className="text-sm">Validação de atualização</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacoesChecklistAtualizacao">Observações do Checklist</Label>
                    <Textarea
                      id="observacoesChecklistAtualizacao"
                      value={formData.observacoesChecklist}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoesChecklist: e.target.value }))}
                      placeholder="Observações gerais sobre o checklist de atualização..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

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

      {/* Seleção de Cliente - Layout Melhorado */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <span>Selecionar Cliente</span>
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Busque e selecione um cliente para visualizar e gerenciar seu histórico de atualizações
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Busca Aprimorada */}
            <div className="space-y-2">
              <Label htmlFor="clienteSearch" className="text-sm font-semibold text-slate-700">
                🔍 Buscar Cliente
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <Input
                  id="clienteSearch"
                  placeholder="Digite o código (ex: C001) ou nome do cliente..."
                  value={clienteSearchTerm}
                  onChange={(e) => setClienteSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-3 border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-white shadow-sm text-base"
                />
                {clienteSearchTerm && (
                  <button
                    onClick={() => setClienteSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              {clienteSearchTerm && (
                <p className="text-xs text-blue-600">
                  {filteredClientes?.length || 0} cliente(s) encontrado(s)
                </p>
              )}
            </div>
            
            {/* Seletor Melhorado */}
            <div className="space-y-2">
              <Label htmlFor="clienteSelect" className="text-sm font-semibold text-slate-700">
                📋 Cliente Selecionado
              </Label>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger className="w-full py-3 border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-white shadow-sm">
                  <SelectValue placeholder="👆 Selecione um cliente da lista abaixo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white border-blue-200 shadow-lg">
                  {filteredClientes?.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhum cliente encontrado</p>
                      {clienteSearchTerm && (
                        <p className="text-xs text-gray-400 mt-1">
                          Tente alterar o termo de busca
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredClientes?.map((cliente: Cliente) => (
                      <SelectItem 
                        key={cliente.code} 
                        value={cliente.code}
                        className="py-3 cursor-pointer hover:bg-blue-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">
                              {cliente.code.substring(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">{cliente.code}</div>
                            <div className="text-sm text-slate-600">{cliente.nomeCliente}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente Selecionado - Info Card */}
            {selectedCliente && (
              <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente : ""}
                      </h3>
                      <p className="text-sm text-slate-600">Código: {selectedCliente}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                      ✓ Selecionado
                    </Badge>
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
                  </div>
                </div>
                {historico && historico.length > 0 && (
                  <div className="mt-3 flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <History className="w-4 h-4" />
                      <span>{historico.length} registro(s) de histórico</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Último acesso: {historico[0]?.createdAt ? format(new Date(historico[0].createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>
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
                Histórico - {Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente : ""}
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
                    {TIPOS_ACAO.map((tipo) => (
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
                                {getTipoAcaoLabel(item.tipoAtualizacao)}
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
