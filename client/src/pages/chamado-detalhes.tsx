import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, Clock, User2, Info } from "lucide-react";
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
  { value: 'BAIXA', label: 'Baixa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'MEDIA', label: 'Média', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'ALTA', label: 'Alta', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-50 text-red-700 border-red-200' }
];

const STATUS = [
  { value: 'ABERTO', label: 'Aberto', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'PENDENTE', label: 'Pendente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'SOLUCIONADO', label: 'Solucionado', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'FECHADO', label: 'Fechado', color: 'bg-slate-100 text-slate-700 border-slate-300' }
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
  const [editData, setEditData] = useState({
    status: '',
    prioridade: '',
    atendenteId: null as number | null,
    observacoes: ''
  });

  const { data: chamado, isLoading } = useQuery({
    queryKey: [`/api/chamados/${id}`],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chamados/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Chamado não encontrado");

      // Marcar como lido ao visualizar
      fetch(`/api/chamados/${id}/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error('Erro ao marcar como lido:', err));

      return response.json();
    },
    enabled: !!id,
  });

  const { data: interacoes = [], refetch: refetchInteracoes } = useQuery<any[]>({
    queryKey: [`/api/chamados/${id}/interacoes`],
    enabled: !!id,
  });

  const { data: pendencias = [] } = useQuery<any[]>({
    queryKey: [`/api/chamados/${id}/pendencias`],
    enabled: !!id,
  });

  const isInternal = user?.role === 'admin' || user?.role === 'interno';

  const { data: usuariosInternos = [] } = useQuery({
    queryKey: ["/api/users/internos"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      const data = await response.json();
      // Filtrar apenas usuários com role 'admin' ou 'interno' E que estejam ativos
      return data.filter((u: any) => 
        (u.role === 'admin' || u.role === 'interno') && u.active === true
      );
    },
    enabled: isInternal, // Só buscar se for interno/admin
  });

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

  const hasChanges = useMemo(() => {
    if (!chamado) return false;
    return (
      editData.status !== chamado.status ||
      editData.prioridade !== chamado.prioridade ||
      editData.atendenteId !== chamado.atendenteId ||
      editData.observacoes !== (chamado.observacoes || '')
    );
  }, [chamado, editData]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/chamados"] });
      queryClient.invalidateQueries({ queryKey: [`/api/chamados/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notificacoes/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chamados/unread-count"] });
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
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const getStatusConfig = (status: string) => {
    return STATUS.find(s => s.value === status) || STATUS[0];
  };

  const getPrioridadeConfig = (prioridade: string) => {
    return PRIORIDADES.find(p => p.value === prioridade) || PRIORIDADES[1];
  };

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
        <Button onClick={() => navigate('/chamados')} data-testid="button-voltar">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Chamados
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(chamado.status);
  const prioridadeConfig = getPrioridadeConfig(chamado.prioridade);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header Simplificado */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chamados')}
            className="text-slate-600 hover:text-slate-900 -ml-2"
            data-testid="button-voltar-header"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-xl font-semibold text-slate-900" data-testid="text-titulo-chamado">
                {chamado.titulo}
              </h1>
              <span className="text-sm text-slate-500" data-testid="badge-numero-chamado">#{chamado.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${statusConfig.color} border font-medium`} data-testid="badge-status-header">
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className={`${prioridadeConfig.color} border font-medium`} data-testid="badge-prioridade-header">
              {prioridadeConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-4">

            {/* Descrição Original */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200" data-testid="card-descricao">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Descrição do Problema</h3>
                  <p className="text-sm text-slate-500">
                    Aberto por {chamado.clienteId} • {format(new Date(chamado.dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap pl-11" data-testid="text-descricao">
                {chamado.descricao}
              </p>
            </div>

            {/* Timeline de Interações */}
            {(interacoes.length > 0 || pendencias.length > 0) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide px-1">
                  Histórico
                </h3>

                {/* Pendências */}
                {pendencias.map((pendencia: any) => (
                  <div key={pendencia.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200" data-testid={`card-pendencia-${pendencia.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-yellow-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-yellow-900 text-sm">
                            {MOTIVOS_PENDENCIA.find(m => m.value === pendencia.motivo)?.label}
                          </span>
                          <span className="text-xs text-yellow-600" data-testid={`text-data-pendencia-${pendencia.id}`}>
                            {format(new Date(pendencia.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-800">{pendencia.descricao}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Interações */}
                {interacoes.map((interacao: any, index: number) => (
                  <div
                    key={interacao.id}
                    className={`bg-white rounded-lg p-4 shadow-sm border ${
                      interacao.tipo === 'MUDANCA_STATUS' ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
                    }`}
                    data-testid={`card-interacao-${interacao.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        interacao.tipo === 'MUDANCA_STATUS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {interacao.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 text-sm">
                              {interacao.usuario?.name || 'Usuário'}
                            </span>
                            {interacao.tipo !== 'COMENTARIO' && (
                              <span className="text-xs text-slate-500">
                                {interacao.tipo === 'MUDANCA_STATUS' ? 'alterou o status' : 'atribuiu o chamado'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500" data-testid={`text-data-interacao-${interacao.id}`}>
                            {format(new Date(interacao.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed space-y-2" data-testid={`text-mensagem-interacao-${interacao.id}`}>
                          {(() => {
                            const mensagem = interacao.mensagem;
                            const parts = mensagem.split(/(\[IMAGEM: .*?\])/g);
                            
                            return parts.map((part, idx) => {
                              // Detectar imagens base64
                              if (part.startsWith('[IMAGEM:')) {
                                const base64 = part.replace('[IMAGEM: ', '').replace(']', '');
                                return (
                                  <div key={idx} className="my-2">
                                    <img 
                                      src={base64} 
                                      alt={`Anexo ${idx}`}
                                      className="max-w-md rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                                      onClick={() => window.open(base64, '_blank')}
                                    />
                                  </div>
                                );
                              }
                              
                              // Detectar URLs de imagens
                              const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
                              if (urlRegex.test(part)) {
                                return part.split(urlRegex).map((segment, segIdx) => {
                                  if (segment && segment.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                                    return (
                                      <div key={`${idx}-${segIdx}`} className="my-2">
                                        <img 
                                          src={segment}
                                          alt={`Imagem ${segIdx}`}
                                          className="max-w-md rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                                          onClick={() => window.open(segment, '_blank')}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    );
                                  }
                                  return <span key={`${idx}-${segIdx}`}>{segment}</span>;
                                });
                              }
                              
                              return <p key={idx}>{part}</p>;
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nova Interação */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200" data-testid="card-nova-interacao">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Adicionar Comentário</h3>
              <div className="space-y-3">
                <Textarea
                  value={newInteracao}
                  onChange={(e) => setNewInteracao(e.target.value)}
                  placeholder="Digite seu comentário... (Ctrl+V para colar imagens ou cole links de imagens)"
                  rows={5}
                  className="resize-none"
                  data-testid="input-nova-interacao"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleAddInteracao();
                    }
                  }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;

                    for (let i = 0; i < items.length; i++) {
                      const item = items[i];
                      
                      // Detectar imagem colada
                      if (item.type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            // Adicionar marcador de imagem no texto
                            const imageMarker = `\n[IMAGEM: ${base64}]\n`;
                            setNewInteracao(prev => prev + imageMarker);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }
                  }}
                />
                
                {/* Preview de imagens no texto */}
                {newInteracao.includes('[IMAGEM:') && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2 font-medium">Imagens anexadas:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {newInteracao.match(/\[IMAGEM: (.*?)\]/g)?.map((match, idx) => {
                        const base64 = match.replace('[IMAGEM: ', '').replace(']', '');
                        return (
                          <div key={idx} className="relative group">
                            <img 
                              src={base64} 
                              alt={`Anexo ${idx + 1}`} 
                              className="w-full h-24 object-cover rounded border border-blue-300"
                            />
                            <button
                              onClick={() => {
                                setNewInteracao(prev => prev.replace(match, '').trim());
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    💡 Dica: Cole imagens com Ctrl+V ou adicione links de imagens no texto
                  </p>
                  <Button
                    onClick={handleAddInteracao}
                    disabled={createInteracaoMutation.isPending || !newInteracao.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349]"
                    data-testid="button-adicionar-comentario"
                  >
                    {createInteracaoMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-2" />
                        Enviar (Ctrl+Enter)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar de Informações */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User2 className="w-4 h-4" />
                Informações do Chamado
              </h3>

              {/* Status */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Status</Label>
                {isInternal ? (
                  <Select
                    value={editData.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger className="w-full" data-testid="select-status">
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
                  <Badge variant="outline" className={`${statusConfig.color} border`} data-testid="display-status">
                    {statusConfig.label}
                  </Badge>
                )}
              </div>

              {/* Prioridade */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Prioridade</Label>
                {isInternal ? (
                  <Select
                    value={editData.prioridade}
                    onValueChange={(value) => handleFieldChange('prioridade', value)}
                  >
                    <SelectTrigger className="w-full" data-testid="select-prioridade">
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
                  <Badge variant="outline" className={`${prioridadeConfig.color} border`} data-testid="display-prioridade">
                    {prioridadeConfig.label}
                  </Badge>
                )}
              </div>

              <Separator className="my-4" />

              {/* Atendente - Sempre visível para facilitar atribuição */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Atendente</Label>
                {isInternal ? (
                  <Select
                    value={editData.atendenteId?.toString() || "0"}
                    onValueChange={(value) => handleFieldChange('atendenteId', value === "0" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="w-full" data-testid="select-atendente">
                      <SelectValue placeholder="Selecione um atendente" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="0">Não atribuído</SelectItem>
                      {usuariosInternos && usuariosInternos.length > 0 ? (
                        usuariosInternos.map((u: any) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name} ({u.role === 'admin' ? 'Admin' : 'Interno'})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="-1" disabled>Nenhum usuário disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="px-3 py-2 bg-slate-50 rounded-md text-sm text-slate-900" data-testid="text-atendente">
                    {chamado.atendenteId
                      ? usuariosInternos.find((u: any) => u.id === chamado.atendenteId)?.name || 'Não atribuído'
                      : 'Não atribuído'
                    }
                  </div>
                )}
              </div>

              {/* Cliente */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Cliente</Label>
                <div className="px-3 py-2 bg-slate-50 rounded-md text-sm text-slate-900" data-testid="text-cliente">
                  {chamado.clienteId}
                </div>
              </div>

              {/* Solicitante */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Solicitante</Label>
                <div className="px-3 py-2 bg-slate-50 rounded-md text-sm text-slate-900" data-testid="text-solicitante">
                  {chamado.solicitante?.name || 'Não informado'}
                </div>
              </div>

              {/* Categoria */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Categoria</Label>
                <div className="px-3 py-2 bg-slate-50 rounded-md text-sm text-slate-900" data-testid="text-categoria">
                  {CATEGORIAS.find(c => c.value === chamado.categoria)?.label}
                </div>
              </div>

              {/* Data de Abertura */}
              <div className="mb-4">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Aberto em</Label>
                <div className="px-3 py-2 bg-slate-50 rounded-md text-sm text-slate-900" data-testid="text-data-abertura-sidebar">
                  {format(new Date(chamado.dataAbertura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>

              {/* Observações Internas */}
              {isInternal && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Notas Internas</Label>
                    <Textarea
                      value={editData.observacoes}
                      onChange={(e) => handleFieldChange('observacoes', e.target.value)}
                      placeholder="Adicione notas visíveis apenas para a equipe..."
                      rows={4}
                      className="resize-none text-sm"
                      data-testid="input-observacoes"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer com Ações */}
      {isInternal && (
        <div className="bg-white border-t px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {hasChanges ? '✎ Você tem alterações não salvas' : 'Nenhuma alteração pendente'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={!hasChanges || updateChamadoMutation.isPending}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updateChamadoMutation.isPending}
                className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349]"
                data-testid="button-salvar"
              >
                {updateChamadoMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}