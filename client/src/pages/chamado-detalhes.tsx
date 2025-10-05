
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, CheckCircle, AlertTriangle, Save, X, User, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function ChamadoDetalhesPage() {
  const [, params] = useRoute("/chamados/:id");
  const id = params?.id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newInteracao, setNewInteracao] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    prioridade: '',
    atendenteId: null as number | null,
    observacoes: ''
  });

  // Buscar chamado
  const { data: chamado, isLoading } = useQuery({
    queryKey: [`/api/chamados/${id}`],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chamados/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Chamado não encontrado");
      return response.json();
    },
    enabled: !!id,
  });

  // Buscar interações
  const { data: interacoes = [], refetch: refetchInteracoes } = useQuery({
    queryKey: [`/api/chamados/${id}/interacoes`],
    enabled: !!id,
  });

  // Buscar pendências
  const { data: pendencias = [] } = useQuery({
    queryKey: [`/api/chamados/${id}/pendencias`],
    enabled: !!id,
  });

  // Buscar usuários internos para atendente
  const { data: usuariosInternos = [] } = useQuery({
    queryKey: ["/api/users"],
    select: (data: any[]) => data.filter(u => u.role === 'admin' || u.role === 'interno')
  });

  // Atualizar editData quando chamado carregar
  useEffect(() => {
    if (chamado) {
      setEditData({
        status: chamado.status,
        prioridade: chamado.prioridade,
        atendenteId: chamado.atendenteId,
        observacoes: chamado.observacoes || ''
      });
    }
  }, [chamado]);

  // Mutation para atualizar chamado
  const updateChamadoMutation = useMutation({
    mutationFn: async (data: Partial<typeof editData>) => {
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
      queryClient.invalidateQueries({ queryKey: [`/api/chamados/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chamados"] });
      setHasChanges(false);
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

  // Criar interação
  const createInteracaoMutation = useMutation({
    mutationFn: async (mensagem: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chamados/${id}/interacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensagem, tipo: 'COMENTARIO' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar comentário");
      }

      return response.json();
    },
    onSuccess: () => {
      refetchInteracoes();
      setNewInteracao('');
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
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

  const handleAddInteracao = () => {
    if (!newInteracao.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive",
      });
      return;
    }
    createInteracaoMutation.mutate(newInteracao);
  };

  const handleSave = () => {
    updateChamadoMutation.mutate(editData);
  };

  const handleCancel = () => {
    if (chamado) {
      setEditData({
        status: chamado.status,
        prioridade: chamado.prioridade,
        atendenteId: chamado.atendenteId,
        observacoes: chamado.observacoes || ''
      });
      setHasChanges(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditData({ ...editData, [field]: value });
    setHasChanges(true);
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

  const isInternal = user?.role === 'admin' || user?.role === 'interno';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Chamado não encontrado</h2>
        <Button onClick={() => navigate('/chamados')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Chamados
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/chamados')}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-slate-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Chamado #{chamado.id}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-sm">
                  {CATEGORIAS.find(c => c.value === chamado.categoria)?.label}
                </Badge>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm text-slate-500">
                  Aberto em {format(new Date(chamado.dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Descrição do Chamado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{chamado.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{chamado.descricao}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Interações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Histórico do Chamado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pendências */}
              {pendencias.map((pendencia: any) => (
                <div key={pendencia.id} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-yellow-800 text-lg">
                          Pendência: {MOTIVOS_PENDENCIA.find(m => m.value === pendencia.motivo)?.label}
                        </span>
                        <span className="text-sm text-yellow-600">
                          {format(new Date(pendencia.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-yellow-700">{pendencia.descricao}</p>
                      {pendencia.resolvido && (
                        <div className="mt-3 flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolvida em {format(new Date(pendencia.dataResolucao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Interações */}
              {interacoes.map((interacao: any) => (
                <div key={interacao.id} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-lg">
                      {interacao.usuarioId === user?.id ? 'EU' : 'U'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`border rounded-lg p-6 ${
                      interacao.tipo === 'MUDANCA_STATUS' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-800 text-lg">
                          {interacao.tipo === 'MUDANCA_STATUS' && '🔄 '}
                          {interacao.tipo === 'ATRIBUICAO' && '👤 '}
                          {interacao.tipo === 'COMENTARIO' && '💬 '}
                          {interacao.tipo === 'MUDANCA_STATUS' ? 'Mudança de Status' : 
                           interacao.tipo === 'ATRIBUICAO' ? 'Atribuição' : 'Comentário'}
                        </span>
                        <span className="text-sm text-slate-500">
                          {format(new Date(interacao.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{interacao.mensagem}</p>
                    </div>
                  </div>
                </div>
              ))}

              {interacoes.length === 0 && pendencias.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma interação ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campo para adicionar nova interação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Comentário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={newInteracao}
                  onChange={(e) => setNewInteracao(e.target.value)}
                  placeholder="Digite seu comentário aqui..."
                  rows={4}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddInteracao();
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    Pressione Ctrl+Enter para enviar
                  </span>
                  <Button 
                    onClick={handleAddInteracao}
                    disabled={createInteracaoMutation.isPending || !newInteracao.trim()}
                    className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349]"
                  >
                    {createInteracaoMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Adicionar Comentário
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Direita - Informações do Chamado */}
        <div className="w-80 border-l bg-slate-50 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Informações do Chamado</h3>
            
            {/* Status */}
            <div className="space-y-2 mb-6">
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              {isInternal ? (
                <Select
                  value={editData.status}
                  onValueChange={(value) => handleFieldChange('status', value)}
                >
                  <SelectTrigger>
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
              ) : (
                <div className="p-3 bg-white rounded-md border">
                  {getStatusBadge(chamado.status)}
                </div>
              )}
            </div>

            {/* Prioridade */}
            <div className="space-y-2 mb-6">
              <Label className="text-sm font-medium text-slate-700">Prioridade</Label>
              {isInternal ? (
                <Select
                  value={editData.prioridade}
                  onValueChange={(value) => handleFieldChange('prioridade', value)}
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
              ) : (
                <div className="p-3 bg-white rounded-md border">
                  {getPrioridadeBadge(chamado.prioridade)}
                </div>
              )}
            </div>

            {/* Atendente */}
            {isInternal && (
              <div className="space-y-2 mb-6">
                <Label className="text-sm font-medium text-slate-700">Atendente</Label>
                <Select
                  value={editData.atendenteId?.toString() || "0"}
                  onValueChange={(value) => handleFieldChange('atendenteId', value === "0" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem atendente</SelectItem>
                    {usuariosInternos.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Solicitante */}
            <div className="space-y-2 mb-6">
              <Label className="text-sm font-medium text-slate-700">Solicitante</Label>
              <div className="p-3 bg-white rounded-md border">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-700">{chamado.clienteId}</span>
                </div>
              </div>
            </div>

            {/* Data de Previsão */}
            {chamado.dataPrevisao && (
              <div className="space-y-2 mb-6">
                <Label className="text-sm font-medium text-slate-700">Previsão de Conclusão</Label>
                <div className="p-3 bg-white rounded-md border">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700">
                      {format(new Date(chamado.dataPrevisao), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {isInternal && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Observações Internas</Label>
                <Textarea
                  value={editData.observacoes}
                  onChange={(e) => handleFieldChange('observacoes', e.target.value)}
                  placeholder="Adicione observações sobre o chamado..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Botões de Ação */}
      {isInternal && hasChanges && (
        <div className="border-t bg-white px-6 py-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateChamadoMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateChamadoMutation.isPending}
              className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349]"
            >
              {updateChamadoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
