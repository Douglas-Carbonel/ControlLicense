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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [editData, setEditData] = useState({
    status: '',
    prioridade: '',
    atendenteId: null as number | null,
    observacoes: ''
  });

  // Cleanup de URLs de preview para evitar vazamento de memória
  useEffect(() => {
    // Criar URLs de preview para os arquivos anexados
    const urls = attachedFiles.map(file => URL.createObjectURL(file));
    setFilePreviewUrls(urls);

    // Cleanup: revogar URLs quando o componente desmontar ou arquivos mudarem
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [attachedFiles]);

  // Buscar detalhes do chamado com cache de 5 minutos e revalidação inteligente
  const { data: chamadoData, isLoading } = useQuery({
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
    staleTime: 30 * 1000, // Dados ficam "frescos" por 30 segundos
    gcTime: 5 * 60 * 1000, // Manter em cache por 5 minutos
    refetchOnWindowFocus: true, // ✅ Revalidar quando usuário volta para aba
    refetchOnMount: true, // ✅ Revalidar ao montar
    refetchInterval: 30 * 1000, // ✅ Revalidar a cada 30 segundos automaticamente
    retry: 1
  });

  // Extrair dados do chamado completo
  const chamado = chamadoData ? {
    id: chamadoData.id,
    categoria: chamadoData.categoria,
    produto: chamadoData.produto,
    titulo: chamadoData.titulo,
    descricao: chamadoData.descricao,
    status: chamadoData.status,
    prioridade: chamadoData.prioridade,
    clienteId: chamadoData.clienteId,
    solicitanteId: chamadoData.solicitanteId,
    solicitante: chamadoData.solicitante,
    atendenteId: chamadoData.atendenteId,
    representanteId: chamadoData.representanteId,
    observacoes: chamadoData.observacoes,
    dataAbertura: chamadoData.dataAbertura,
    dataUltimaInteracao: chamadoData.dataUltimaInteracao,
    lidoPorSolicitante: chamadoData.lidoPorSolicitante,
    lidoPorAtendente: chamadoData.lidoPorAtendente,
    createdAt: chamadoData.createdAt,
    updatedAt: chamadoData.updatedAt
  } : null;

  const interacoes = chamadoData?.interacoes || [];
  const pendencias = chamadoData?.pendencias || [];

  const isInternal = user?.role === 'admin' || user?.role === 'interno';

  // Marcar como lido quando os dados carregarem
  useEffect(() => {
    if (chamadoData && id) {
      const token = localStorage.getItem("token");
      fetch(`/api/chamados/${id}/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error('Erro ao marcar como lido:', err));
    }
  }, [chamadoData, id]);

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
      // ✅ Invalidar para todos os clientes verem a atualização
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
    mutationFn: async ({ mensagem, anexos }: { mensagem: string; anexos?: string[] }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/chamados/${id}/interacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensagem, tipo: 'COMENTARIO', anexos }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar comentário");
      }

      return response.json();
    },
    onSuccess: (newInteracao) => {
      // Atualizar cache diretamente para o usuário atual
      queryClient.setQueryData([`/api/chamados/${id}`], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          interacoes: [...(old.interacoes || []), newInteracao]
        };
      });

      // ✅ Invalidar para forçar outros clientes a recarregar
      queryClient.invalidateQueries({ queryKey: [`/api/chamados/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chamados"] });

      // Limpar campos
      setNewInteracao('');
      setAttachedFiles([]);

      toast({
        title: "Sucesso",
        description: "Comentário adicionado!",
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

  const [isUploading, setIsUploading] = useState(false);

  const handleAddInteracao = async () => {
    if (!newInteracao.trim() && attachedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem ou anexe um arquivo",
        variant: "destructive",
      });
      return;
    }

    let anexos: string[] = [];

    // Upload de arquivos primeiro, se houver
    if (attachedFiles.length > 0) {
      setIsUploading(true);
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        attachedFiles.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || 'Erro ao fazer upload dos arquivos');
        }

        const uploadData = await uploadResponse.json();
        anexos = uploadData.urls;
      } catch (error) {
        toast({
          title: "Erro no upload",
          description: error instanceof Error ? error.message : "Não foi possível enviar os arquivos",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    createInteracaoMutation.mutate({ mensagem: newInteracao, anexos });
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-4xl mx-auto p-6 space-y-4 break-words">

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
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words pl-11" data-testid="text-descricao">
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

                {/* Interações - Apenas últimas 15 */}
                {interacoes.slice(-15).map((interacao: any) => {
                  // Determinar se o usuário é interno (admin ou interno)
                  const isInterno = interacao.usuario?.role === 'admin' || interacao.usuario?.role === 'interno';
                  
                  // Obter iniciais do nome
                  const getInitials = (name: string) => {
                    if (!name) return 'U';
                    const parts = name.trim().split(' ');
                    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
                    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                  };

                  return (
                    <div
                      key={interacao.id}
                      className={`rounded-lg p-4 shadow-sm border ${
                        interacao.tipo === 'MUDANCA_STATUS' 
                          ? 'border-blue-200 bg-blue-50/30' 
                          : isInterno
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          interacao.tipo === 'MUDANCA_STATUS' 
                            ? 'bg-blue-500 text-white' 
                            : isInterno
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-400 text-white'
                        }`}>
                          {getInitials(interacao.usuario?.name || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className={`font-medium text-sm ${isInterno ? 'text-blue-900' : 'text-slate-900'}`}>
                              {interacao.usuario?.name || 'Usuário'}
                            </span>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {format(new Date(interacao.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">{interacao.mensagem}</p>

                          {interacao.anexos?.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {interacao.anexos.map((url: string, idx: number) => (
                                <img 
                                  key={idx}
                                  src={url}
                                  alt={`Anexo ${idx + 1}`}
                                  className="w-full rounded border cursor-pointer"
                                  onClick={() => window.open(url, '_blank')}
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nova Interação */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200" data-testid="card-nova-interacao">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Adicionar Comentário</h3>
              <div className="space-y-3">
                <Textarea
                  value={newInteracao}
                  onChange={(e) => setNewInteracao(e.target.value)}
                  placeholder="Digite seu comentário... (Ctrl+V para colar imagens)"
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
                          // Validar tamanho (50MB)
                          if (file.size > 50 * 1024 * 1024) {
                            toast({
                              title: "Arquivo muito grande",
                              description: `O arquivo ${file.name} excede 50MB`,
                              variant: "destructive",
                            });
                            return;
                          }
                          setAttachedFiles(prev => [...prev, file]);
                        }
                      }
                    }
                  }}
                />

                {/* Preview de arquivos anexados */}
                {attachedFiles.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2 font-medium">📎 Arquivos anexados ({attachedFiles.length}):</p>
                    <div className="grid grid-cols-3 gap-2">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={filePreviewUrls[idx]} 
                            alt={file.name} 
                            className="w-full h-20 object-cover rounded border border-blue-300"
                          />
                          <button
                            onClick={() => {
                              setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            title="Remover imagem"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;

                        // Validar tamanho de cada arquivo
                        const validFiles: File[] = [];
                        for (const file of Array.from(files)) {
                          if (file.size > 50 * 1024 * 1024) {
                            toast({
                              title: "Arquivo muito grande",
                              description: `${file.name} excede 50MB`,
                              variant: "destructive",
                            });
                          } else {
                            validFiles.push(file);
                          }
                        }

                        // Adicionar apenas arquivos válidos
                        if (validFiles.length > 0) {
                          setAttachedFiles(prev => [...prev, ...validFiles]);
                        }

                        // Limpar input para permitir selecionar o mesmo arquivo novamente
                        e.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      📎 Anexar Arquivo
                    </Button>
                    <p className="text-xs text-slate-500">
                      ou Ctrl+V para colar
                    </p>
                  </div>
                  <Button
                    onClick={handleAddInteracao}
                    disabled={createInteracaoMutation.isPending || isUploading || (!newInteracao.trim() && attachedFiles.length === 0)}
                    size="sm"
                    className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349]"
                    data-testid="button-adicionar-comentario"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Enviando arquivo{attachedFiles.length > 1 ? 's' : ''}...
                      </>
                    ) : createInteracaoMutation.isPending ? (
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