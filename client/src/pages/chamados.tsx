
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Ticket, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Chamado {
  id: number;
  categoria: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  usuarioAberturaId: number;
  clienteId: string;
  representanteId?: number;
  atendenteId?: number;
  dataAbertura: string;
  dataPrevisao?: string;
  dataFechamento?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Cliente {
  code: string;
  nomeCliente: string;
}

const CATEGORIAS = [
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'MELHORIA', label: 'Melhoria' },
  { value: 'BUG', label: 'Bug/Erros' },
  { value: 'ATENDIMENTO', label: 'Atendimento/Dúvidas' }
];

const PRIORIDADES = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' }
];

const STATUS = [
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'SOLUCIONADO', label: 'Solucionado' },
  { value: 'FECHADO', label: 'Fechado' }
];

const MOTIVOS_PENDENCIA = [
  { value: 'AGUARDANDO_REPRESENTANTE', label: 'Aguardando retorno do representante' },
  { value: 'AGUARDANDO_AGENDAMENTO', label: 'Aguardando confirmação de agendamento' },
  { value: 'AGUARDANDO_CLIENTE', label: 'Aguardando retorno do cliente' },
  { value: 'OUTROS', label: 'Outros motivos' }
];

export default function ChamadosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [newChamado, setNewChamado] = useState({
    categoria: '',
    titulo: '',
    descricao: '',
    prioridade: 'MEDIA',
    clienteId: '',
    representanteId: null as number | null,
    dataPrevisao: '',
    observacoes: ''
  });

  // Buscar chamados
  const { data: chamados = [], isLoading } = useQuery<Chamado[]>({
    queryKey: ["/api/chamados"],
  });

  // Buscar clientes para seleção
  const { data: clientesData } = useQuery<{ data: Cliente[] }>({
    queryKey: ["/api/licenses"],
    enabled: user?.role === 'representante',
  });

  const clientes = clientesData?.data || [];

  // Buscar dados do usuário atual
  const { data: userData } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin',
  });

  // Criar chamado
  const createChamadoMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/chamados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar chamado");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chamados"] });
      setIsCreateDialogOpen(false);
      setNewChamado({
        categoria: '',
        titulo: '',
        descricao: '',
        prioridade: 'MEDIA',
        clienteId: '',
        representanteId: null,
        dataPrevisao: '',
        observacoes: ''
      });
      toast({
        title: "Sucesso",
        description: "Chamado criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar chamado
  const updateChamadoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Chamado> }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chamados/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar chamado");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chamados"] });
      toast({
        title: "Sucesso",
        description: "Chamado atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateChamado = () => {
    if (!newChamado.categoria || !newChamado.titulo || !newChamado.descricao || !newChamado.clienteId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createChamadoMutation.mutate(newChamado);
  };

  const handleViewDetails = (chamado: Chamado) => {
    setSelectedChamado(chamado);
    setIsDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'ABERTO': { label: 'Aberto', variant: 'default' },
      'PENDENTE': { label: 'Pendente', variant: 'secondary' },
      'SOLUCIONADO': { label: 'Solucionado', variant: 'outline' },
      'FECHADO': { label: 'Fechado', variant: 'destructive' }
    };
    
    const config = statusMap[status] || statusMap['ABERTO'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, { color: string }> = {
      'BAIXA': { color: 'bg-green-100 text-green-800 border-green-200' },
      'MEDIA': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'ALTA': { color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'URGENTE': { color: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    const config = prioridadeMap[prioridade] || prioridadeMap['MEDIA'];
    return <Badge variant="outline" className={config.color}>{prioridade}</Badge>;
  };

  const getCategoriaIcon = (categoria: string) => {
    const iconMap: Record<string, any> = {
      'INSTALACAO': <Ticket className="h-4 w-4" />,
      'MELHORIA': <AlertTriangle className="h-4 w-4" />,
      'BUG': <XCircle className="h-4 w-4" />,
      'ATENDIMENTO': <MessageSquare className="h-4 w-4" />
    };
    
    return iconMap[categoria] || <Ticket className="h-4 w-4" />;
  };

  // Determinar clienteId baseado no tipo de usuário
  const getClienteIdForNewChamado = () => {
    if (user?.role === 'cliente_final' && userData) {
      // Se for cliente final, retorna o código do cliente do usuário
      const currentUser = Array.isArray(userData) 
        ? userData.find((u: any) => u.id === user.id)
        : userData;
      return currentUser?.clienteId || '';
    }
    return newChamado.clienteId;
  };

  const chamadosAbertos = chamados.filter(c => c.status === 'ABERTO');
  const chamadosPendentes = chamados.filter(c => c.status === 'PENDENTE');
  const chamadosSolucionados = chamados.filter(c => c.status === 'SOLUCIONADO');
  const chamadosFechados = chamados.filter(c => c.status === 'FECHADO');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chamados</h1>
          <p className="text-slate-600 mt-1">
            Gerencie seus chamados de suporte
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Chamado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={newChamado.categoria}
                  onValueChange={(value) => setNewChamado({ ...newChamado, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {user?.role === 'representante' && (
                <div className="space-y-2">
                  <Label htmlFor="clienteId">Cliente *</Label>
                  <Select
                    value={newChamado.clienteId}
                    onValueChange={(value) => setNewChamado({ ...newChamado, clienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.code} value={cliente.code}>
                          {cliente.code} - {cliente.nomeCliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={newChamado.titulo}
                  onChange={(e) => setNewChamado({ ...newChamado, titulo: e.target.value })}
                  placeholder="Digite um título descritivo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={newChamado.descricao}
                  onChange={(e) => setNewChamado({ ...newChamado, descricao: e.target.value })}
                  placeholder="Descreva detalhadamente o problema ou solicitação"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  value={newChamado.prioridade}
                  onValueChange={(value) => setNewChamado({ ...newChamado, prioridade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={newChamado.observacoes}
                  onChange={(e) => setNewChamado({ ...newChamado, observacoes: e.target.value })}
                  placeholder="Informações adicionais (opcional)"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreateChamado}
                  disabled={createChamadoMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-[#0095da] to-[#313d5a]"
                >
                  {createChamadoMutation.isPending ? "Criando..." : "Criar Chamado"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{chamadosAbertos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{chamadosPendentes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solucionados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{chamadosSolucionados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{chamadosFechados.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Chamados com Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Chamados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos">
            <TabsList>
              <TabsTrigger value="todos">Todos ({chamados.length})</TabsTrigger>
              <TabsTrigger value="abertos">Abertos ({chamadosAbertos.length})</TabsTrigger>
              <TabsTrigger value="pendentes">Pendentes ({chamadosPendentes.length})</TabsTrigger>
              <TabsTrigger value="solucionados">Solucionados ({chamadosSolucionados.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="space-y-4 mt-4">
              {chamados.map(chamado => (
                <ChamadoCard 
                  key={chamado.id} 
                  chamado={chamado}
                  onViewDetails={handleViewDetails}
                  getStatusBadge={getStatusBadge}
                  getPrioridadeBadge={getPrioridadeBadge}
                  getCategoriaIcon={getCategoriaIcon}
                />
              ))}
            </TabsContent>

            <TabsContent value="abertos" className="space-y-4 mt-4">
              {chamadosAbertos.map(chamado => (
                <ChamadoCard 
                  key={chamado.id} 
                  chamado={chamado}
                  onViewDetails={handleViewDetails}
                  getStatusBadge={getStatusBadge}
                  getPrioridadeBadge={getPrioridadeBadge}
                  getCategoriaIcon={getCategoriaIcon}
                />
              ))}
            </TabsContent>

            <TabsContent value="pendentes" className="space-y-4 mt-4">
              {chamadosPendentes.map(chamado => (
                <ChamadoCard 
                  key={chamado.id} 
                  chamado={chamado}
                  onViewDetails={handleViewDetails}
                  getStatusBadge={getStatusBadge}
                  getPrioridadeBadge={getPrioridadeBadge}
                  getCategoriaIcon={getCategoriaIcon}
                />
              ))}
            </TabsContent>

            <TabsContent value="solucionados" className="space-y-4 mt-4">
              {chamadosSolucionados.map(chamado => (
                <ChamadoCard 
                  key={chamado.id} 
                  chamado={chamado}
                  onViewDetails={handleViewDetails}
                  getStatusBadge={getStatusBadge}
                  getPrioridadeBadge={getPrioridadeBadge}
                  getCategoriaIcon={getCategoriaIcon}
                />
              ))}
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {!isLoading && chamados.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum chamado encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      {selectedChamado && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Chamado #{selectedChamado.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoriaIcon(selectedChamado.categoria)}
                  <span className="font-medium">{CATEGORIAS.find(c => c.value === selectedChamado.categoria)?.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(selectedChamado.status)}
                  {getPrioridadeBadge(selectedChamado.prioridade)}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{selectedChamado.titulo}</h3>
                <p className="text-sm text-slate-500">
                  Aberto em {format(new Date(selectedChamado.dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div>
                <Label className="text-slate-600">Descrição</Label>
                <p className="text-sm mt-1">{selectedChamado.descricao}</p>
              </div>

              {selectedChamado.observacoes && (
                <div>
                  <Label className="text-slate-600">Observações</Label>
                  <p className="text-sm mt-1">{selectedChamado.observacoes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-slate-600">Cliente</Label>
                  <p className="text-sm font-medium">{selectedChamado.clienteId}</p>
                </div>
                {selectedChamado.dataPrevisao && (
                  <div>
                    <Label className="text-slate-600">Previsão</Label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedChamado.dataPrevisao), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {(user?.role === 'admin' || user?.role === 'interno') && (
                <div className="pt-4 border-t">
                  <Label>Atualizar Status</Label>
                  <Select
                    value={selectedChamado.status}
                    onValueChange={(value) => {
                      updateChamadoMutation.mutate({
                        id: selectedChamado.id,
                        data: { status: value }
                      });
                      setSelectedChamado({ ...selectedChamado, status: value });
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface ChamadoCardProps {
  chamado: Chamado;
  onViewDetails: (chamado: Chamado) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPrioridadeBadge: (prioridade: string) => JSX.Element;
  getCategoriaIcon: (categoria: string) => JSX.Element;
}

function ChamadoCard({ 
  chamado, 
  onViewDetails, 
  getStatusBadge, 
  getPrioridadeBadge,
  getCategoriaIcon 
}: ChamadoCardProps) {
  return (
    <div 
      className="p-4 border border-slate-200 rounded-lg hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-white"
      onClick={() => onViewDetails(chamado)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getCategoriaIcon(chamado.categoria)}
            <h3 className="font-semibold text-slate-800">{chamado.titulo}</h3>
          </div>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{chamado.descricao}</p>
          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span>Cliente: {chamado.clienteId}</span>
            <span>•</span>
            <span>{format(new Date(chamado.dataAbertura), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge(chamado.status)}
          {getPrioridadeBadge(chamado.prioridade)}
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
