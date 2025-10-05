import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Building2, Plus, Edit, Trash2, Clock, AlertTriangle, CheckCircle, XCircle, Calendar as CalendarIcon, User, Database, History, Filter, Search, Paperclip, Upload, FileImage, CheckSquare, Eye, ChevronDown, ChevronUp, ExternalLink, Copy, Download, List, Grid3X3, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClientSearch } from "@/hooks/use-client-search";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  atendenteSuporteId?: string;
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
  numeroChamado?: string;
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHistorico, setEditingHistorico] = useState<ClienteHistorico | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterAtendente, setFilterAtendente] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedHistorico, setSelectedHistorico] = useState<ClienteHistorico | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar lista de clientes
  const { data: clientes } = useQuery({
    queryKey: ["/api/clientes/lista"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    searchTerm: clienteSearchTerm,
    selectedClient: selectedCliente,
    isOpen: isSelectOpen,
    filteredClientes,
    setIsOpen: setIsSelectOpen,
    handleSearchChange: handleClienteSearchChange,
    handleClientSelect,
    setSelectedClient: setSelectedCliente
  } = useClientSearch(clientes);

  // Efeito para buscar cliente via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codigoClienteParam = urlParams.get('search');
    if (codigoClienteParam && clientes) {
      const clienteEncontrado = clientes.find((c: Cliente) => c.code === codigoClienteParam);
      if (clienteEncontrado) {
        setSelectedCliente(clienteEncontrado.code);
        // Opcional: remover o parâmetro da URL para evitar re-execução
        // window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [clientes, setSelectedCliente]);


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

  // Buscar usuários para "Atendente Suporte"
  const { data: usuarios } = useQuery({
    queryKey: ["/api/usuarios"],
    staleTime: 5 * 60 * 1000,
  });

  // Buscar dados da licença do cliente para obter informações de representantes
  const { data: clienteLicenseData } = useQuery({
    queryKey: ["/api/licenses/by-code", selectedCliente],
    queryFn: async () => {
      if (!selectedCliente) return null;
      const allLicenses = await apiRequest("GET", "/api/licenses?limit=1000");
      const licenses = allLicenses?.data || [];
      return licenses.find((l: any) => l.code === selectedCliente) || null;
    },
    enabled: !!selectedCliente,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar representantes para exibir nos cadastros
  const { data: representantes } = useQuery({
    queryKey: ["/api/representantes"],
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
        const matchesAtendente = filterAtendente === "all" || String(item.atendenteSuporteId ?? "") === filterAtendente;
        const matchesSearch = !searchTerm ||
          item.ambiente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.versaoInstalada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesTipo && matchesAtendente && matchesSearch;
      });

      console.log("Filtered historico result:", filtered.length, "items");
      return filtered;
    } catch (error) {
      console.error("Error filtering historico:", error);
      return [];
    }
  }, [historico, filterStatus, filterTipo, filterAtendente, searchTerm]);

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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/licenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licenses/by-code", selectedCliente] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Representantes atualizados com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar representantes. Tente novamente.",
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
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 font-medium">Concluído</Badge>;
      case 'EM_ANDAMENTO':
        return <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-300 font-medium shadow-sm">Em Andamento</Badge>;
      case 'PENDENTE':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 font-bold shadow-md animate-pulse">⚠️ Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCardBackgroundColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'bg-green-50 border-green-200';
      case 'EM_ANDAMENTO':
        return 'bg-yellow-50 border-yellow-200';
      case 'PENDENTE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const getTipoAcaoLabel = (tipo: string) => {
    const tipoObj = TIPOS_ACAO.find(t => t.value === tipo);
    return tipoObj?.label || tipo;
  };

  const handleViewDetails = (historico: ClienteHistorico) => {
    setSelectedHistorico(historico);
    setIsDetailModalOpen(true);
  };

  const toggleCardExpansion = (historicoId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(historicoId)) {
      newExpanded.delete(historicoId);
    } else {
      newExpanded.add(historicoId);
    }
    setExpandedCards(newExpanded);
  };

  const toggleCardFlip = (historicoId: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(historicoId)) {
      newFlipped.delete(historicoId);
    } else {
      newFlipped.add(historicoId);
    }
    setFlippedCards(newFlipped);
  };

  const getFullTicketUrl = (numeroChamado: string | null) => {
    if (!numeroChamado) return null;
    // Se já for uma URL completa, retorna como está
    if (numeroChamado.startsWith('http')) return numeroChamado;
    // Caso contrário, concatena com a URL base
    return `https://portalsuporte.dwu.com.br/front/ticket.form.php?id=${numeroChamado}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  const generateReport = () => {
    if (!filteredHistorico || filteredHistorico.length === 0) {
      toast({
        title: "Nenhum dado para gerar relatório",
        description: "Não há registros com os filtros selecionados.",
        variant: "destructive",
      });
      return;
    }

    const clienteNome = Array.isArray(clientes) 
      ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente 
      : "";

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Função auxiliar para adicionar nova página se necessário
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Cabeçalho do Relatório
    doc.setFillColor(0, 149, 218);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE HISTÓRICO DO CLIENTE', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 25, { align: 'center' });

    yPos = 50;

    // Informações do Cliente
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPos, pageWidth - 20, 30, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DO CLIENTE', 15, yPos + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${clienteNome}`, 15, yPos + 16);
    doc.text(`Código: ${selectedCliente}`, 15, yPos + 23);
    doc.text(`Total de Registros: ${filteredHistorico.length}`, pageWidth - 15, yPos + 16, { align: 'right' });

    yPos += 40;

    // Filtros Aplicados
    if (filterStatus !== "all" || filterTipo !== "all" || filterAtendente !== "all" || searchTerm) {
      checkNewPage(40);

      doc.setFillColor(255, 243, 205);
      doc.rect(10, yPos, pageWidth - 20, 5, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS', 15, yPos + 3.5);

      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      if (filterStatus !== "all") {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === filterStatus)?.label;
        doc.text(`• Status: ${statusLabel}`, 15, yPos);
        yPos += 5;
      }
      if (filterTipo !== "all") {
        const tipoLabel = TIPOS_ACAO.find(t => t.value === filterTipo)?.label;
        doc.text(`• Tipo de Ação: ${tipoLabel}`, 15, yPos);
        yPos += 5;
      }
      if (filterAtendente !== "all") {
        const atendenteNome = Array.isArray(usuarios) 
          ? usuarios.find((u: any) => u.id.toString() === filterAtendente)?.name 
          : "";
        doc.text(`• Atendente: ${atendenteNome}`, 15, yPos);
        yPos += 5;
      }
      if (searchTerm) {
        doc.text(`• Busca: ${searchTerm}`, 15, yPos);
        yPos += 5;
      }

      yPos += 5;
    }

    // Histórico de Atendimentos
    filteredHistorico.forEach((item: ClienteHistorico, index: number) => {
      const atendenteNome = item.atendenteSuporteId && Array.isArray(usuarios)
        ? usuarios.find((u: any) => u.id.toString() === item.atendenteSuporteId)?.name || 'N/A'
        : 'N/A';

      const statusLabel = item.statusAtual === 'CONCLUIDO' ? 'Concluído' : 
                         item.statusAtual === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Pendente';

      // Calcular espaço necessário para este registro
      let recordHeight = 50;
      if (item.observacoes) recordHeight += 15;
      if (item.problemas) recordHeight += 15;
      if (item.solucoes) recordHeight += 15;

      checkNewPage(recordHeight);

      // Cabeçalho do Registro
      const headerColor = item.statusAtual === 'CONCLUIDO' ? [220, 252, 231] : 
                         item.statusAtual === 'EM_ANDAMENTO' ? [254, 243, 199] : [254, 226, 226];

      doc.setFillColor(...headerColor);
      doc.rect(10, yPos, pageWidth - 20, 8, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${getTipoAcaoLabel(item.tipoAtualizacao)}`, 15, yPos + 5.5);

      // Status e Data
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dataText = format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
      doc.text(`${statusLabel} | ${dataText}`, pageWidth - 15, yPos + 5.5, { align: 'right' });

      yPos += 10;

      // Informações Principais
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      const info: Array<[string, string]> = [
        ['Ambiente:', item.ambiente || '-'],
        ['Responsável:', item.responsavel || '-'],
        ['Atendente:', atendenteNome],
        ['Tempo Gasto:', item.tempoGasto ? `${item.tempoGasto} min` : '-'],
      ];

      if (item.versaoAnterior || item.versaoInstalada) {
        info.push(['Versão Anterior:', item.versaoAnterior || '-']);
        info.push(['Versão Instalada:', item.versaoInstalada || '-']);
      }

      if (item.numeroChamado) {
        info.push(['Nº Chamado:', item.numeroChamado]);
      }

      if (item.casoCritico) {
        info.push(['⚠️ CASO CRÍTICO', '']);
      }

      info.forEach(([label, value], idx) => {
        if (idx > 0 && idx % 2 === 0) yPos += 5;
        const xPos = idx % 2 === 0 ? 15 : pageWidth / 2 + 5;

        doc.setFont('helvetica', 'bold');
        doc.text(label, xPos, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, xPos + 35, yPos);
      });

      yPos += 8;

      // Observações, Problemas e Soluções
      if (item.observacoes) {
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Observações:', 15, yPos);
        yPos += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const obsLines = doc.splitTextToSize(item.observacoes, pageWidth - 30);
        doc.text(obsLines, 15, yPos);
        yPos += obsLines.length * 4 + 3;
      }

      if (item.problemas) {
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        doc.text('Problemas:', 15, yPos);
        yPos += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const probLines = doc.splitTextToSize(item.problemas, pageWidth - 30);
        doc.text(probLines, 15, yPos);
        yPos += probLines.length * 4 + 3;
      }

      if (item.solucoes) {
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(21, 128, 61);
        doc.text('Soluções:', 15, yPos);
        yPos += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const solLines = doc.splitTextToSize(item.solucoes, pageWidth - 30);
        doc.text(solLines, 15, yPos);
        yPos += solLines.length * 4 + 3;
      }

      // Linha divisória
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPos, pageWidth - 10, yPos);
      yPos += 8;
    });

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Salvar PDF
    doc.save(`relatorio_historico_${selectedCliente}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);

    toast({
      title: "Relatório PDF gerado com sucesso!",
      description: `${filteredHistorico.length} registro(s) exportado(s) em formato PDF.`,
    });
  };

  const formatChecklistData = (checklistString: string | null) => {
    if (!checklistString) return null;
    try {
      return JSON.parse(checklistString);
    } catch {
      return null;
    }
  };

  // Modal Form Component
  const HistoricoForm = ({ isEdit = false, initialData = null, onSubmit, ambientes = [], usuarios = [] }: any) => {
    const [formData, setFormData] = useState({
      codigoCliente: initialData?.codigoCliente || selectedCliente || "",
      nomeCliente: initialData?.nomeCliente || (Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente || "" : ""),
      ambiente: initialData?.ambiente || "",
      versaoInstalada: initialData?.versaoInstalada || "",
      versaoAnterior: initialData?.versaoAnterior || "",
      tipoAtualizacao: initialData?.tipoAtualizacao || "ATUALIZACAO_MOBILE",
      observacoes: initialData?.observacoes || "",
      responsavel: initialData?.responsavel || "",
      atendenteSuporteId: initialData?.atendenteSuporteId || "",
      dataUltimoAcesso: initialData?.dataUltimoAcesso || "",
      casoCritico: initialData?.casoCritico || false,
      statusAtual: initialData?.statusAtual || "CONCLUIDO",
      tempoGasto: initialData?.tempoGasto || "",
      problemas: initialData?.problemas || "",
      solucoes: initialData?.solucoes || "",
      anexos: initialData?.anexos || [],
      observacoesChecklist: initialData?.observacoesChecklist || "",
      numeroChamado: initialData?.numeroChamado || ""
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
          <TabsList className={`grid w-full bg-[#f4f4f4] border border-[#e0e0e0] rounded-lg p-1 ${showChecklistInstalacao || showChecklistAtualizacao ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger
              value="geral"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
            >
              <User className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger
              value="detalhes"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
            >
              <Database className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger
              value="anexos"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
            >
              <Paperclip className="h-4 w-4" />
              Anexos
            </TabsTrigger>
            {showChecklistInstalacao && (
              <TabsTrigger
                value="checklist-instalacao"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
              >
                <CheckSquare className="h-4 w-4" />
                Checklist Instalação
              </TabsTrigger>
            )}
            {showChecklistAtualizacao && (
              <TabsTrigger
                value="checklist-atualizacao"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
              >
                <CheckSquare className="h-4 w-4" />
                Checklist Atualização
              </TabsTrigger>
            )}
            <TabsTrigger
              value="problemas"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
            >
              <AlertTriangle className="h-4 w-4" />
              Problemas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <Card className="border border-[#e0e0e0] shadow-sm">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigoCliente" className="text-[#0c151f] font-medium">Código do Cliente</Label>
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
                      <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] bg-white border-[#e0e0e0]">
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

                  <div>
                    <Label htmlFor="atendenteSuporteId" className="text-[#0c151f] font-medium">Atendente Suporte</Label>
                    <Select
                      value={formData.atendenteSuporteId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, atendenteSuporteId: value }))}
                    >
                      <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                        <SelectValue placeholder="Selecione o atendente" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] bg-white border-[#e0e0e0]">
                        {Array.isArray(usuarios) ? usuarios.map((usuario: any) => (
                          <SelectItem key={usuario.id} value={usuario.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-[#0095da] to-[#313d5a] rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {usuario.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-medium">{usuario.name}</div>
                                <div className="text-xs text-slate-500">@{usuario.username} • {usuario.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="casoCritico" className="text-[#0c151f] font-medium mb-3 block">Configurações Especiais</Label>
                    <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Switch
                        id="casoCritico"
                        checked={formData.casoCritico}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, casoCritico: checked }))}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <div>
                        <Label htmlFor="casoCritico" className="text-sm font-medium text-red-700 cursor-pointer">
                          Caso Crítico
                        </Label>
                        <p className="text-xs text-red-600 mt-1">
                          Marcar como prioridade alta para atendimento urgente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="border border-[#e0e0e0] shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Exibir apenas para tipo de ação de atualização */}
                  {(formData.tipoAtualizacao === 'ATUALIZACAO_MOBILE' || formData.tipoAtualizacao === 'ATUALIZACAO_PORTAL') && (
                    <>
                      <div>
                        <Label htmlFor="versaoAnterior" className="text-[#0c151f] font-medium">Versão Anterior</Label>
                        <Input
                          id="versaoAnterior"
                          value={formData.versaoAnterior}
                          onChange={(e) => setFormData(prev => ({ ...prev, versaoAnterior: e.target.value }))}
                          placeholder="Ex: 1.0.0"
                          className="border-[#e0e0e0] focus:border-[#0095da]"
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
                    </>
                  )}
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
                  <Label htmlFor="numeroChamado" className="text-[#0c151f] font-medium">Número do Chamado</Label>
                  <div className="space-y-2">
                    <Input
                      id="numeroChamado"
                      value={formData.numeroChamado}
                      onChange={(e) => setFormData(prev => ({ ...prev, numeroChamado: e.target.value }))}
                      placeholder="Ex: 123"
                      className="border-[#e0e0e0] focus:border-[#0095da]"
                    />
                    {formData.numeroChamado && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="text-blue-600 font-medium">URL completa: </span>
                        <span className="text-blue-800">
                          https://portalsuporte.dwu.com.br/front/ticket.form.php?id={formData.numeroChamado}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes" className="text-[#0c151f] font-medium">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Descreva o que foi feito, configurações aplicadas, etc..."
                    rows={4}
                    className="border-[#e0e0e0] focus:border-[#0095da] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
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

        <div className="flex justify-end space-x-3 pt-6 border-t border-[#e0e0e0] mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false)}
            className="border-[#e0e0e0] text-[#3a3a3c] hover:bg-[#f4f4f4]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium shadow-md transition-all duration-200"
          >
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
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            {/* Campo de busca e seleção de cliente otimizado */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Popover open={isSelectOpen} onOpenChange={setIsSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSelectOpen}
                    className="w-full pl-12 h-14 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-200 text-left bg-white justify-start font-normal"
                  >
                    {selectedCliente ? (
                      <div className="flex items-center space-x-3 w-full">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-slate-800">
                            {Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente : ""}
                          </div>
                          <div className="text-sm text-slate-500">Código: {selectedCliente}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium">Selecionar cliente...</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[800px] p-0 bg-white border-slate-200 shadow-lg">
                  {/* Campo de busca */}
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <Input
                      placeholder="Digite o código ou nome do cliente..."
                      value={clienteSearchTerm}
                      onChange={(e) => handleClienteSearchChange(e.target.value)}
                      className="border-slate-300 h-10 bg-white"
                      autoFocus
                    />
                    {clienteSearchTerm && (
                      <p className="text-xs text-slate-600 mt-2">
                        {filteredClientes?.length || 0} resultado(s) encontrado(s)
                      </p>
                    )}
                  </div>

                  {/* Lista de Clientes */}
                  <div className="max-h-80 overflow-y-auto">
                    {filteredClientes?.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Database className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">Nenhum cliente encontrado</p>
                        {clienteSearchTerm && (
                          <p className="text-xs text-gray-400 mt-1">
                            Tente alterar o termo de busca
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-1">
                        {filteredClientes?.map((cliente: Cliente) => (
                          <Button
                            key={cliente.code}
                            variant="ghost"
                            className="w-full justify-start p-3 h-auto hover:bg-blue-50 focus:bg-blue-50 text-left"
                            onClick={() => handleClientSelect(cliente.code)}
                          >
                            <div className="flex items-center space-x-3 w-full">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-semibold text-slate-800">{cliente.code}</div>
                                <div className="text-sm text-slate-600 truncate">{cliente.nomeCliente}</div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Botão de Nova Ação - sempre visível */}
            <div className="flex-shrink-0">
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    disabled={!selectedCliente}
                    className="h-14 px-6 text-base font-semibold bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Histórico
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] border border-[#e0e0e0] shadow-xl">
                  <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white shadow-md">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-[#0c151f]">
                          Criar Novo Histórico
                        </DialogTitle>
                        <p className="text-sm text-[#3a3a3c] mt-1">
                          Registre um novo atendimento ou atividade do cliente
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                  <HistoricoForm
                    ambientes={ambientes}
                    usuarios={usuarios}
                    onSubmit={(data: any) => createMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs de Navegação do Cliente */}
          {selectedCliente && (
            <Tabs defaultValue="historico" className="mt-6">
              <TabsList className="grid w-full grid-cols-2 bg-[#f4f4f4] border border-[#e0e0e0] rounded-lg p-1">
                <TabsTrigger 
                  value="historico" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
                >
                  <History className="h-4 w-4" />
                  Histórico do Cliente
                </TabsTrigger>
                <TabsTrigger 
                  value="cadastros" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white transition-all duration-200"
                >
                  <Building2 className="h-4 w-4" />
                  Cadastros
                </TabsTrigger>
              </TabsList>

              {/* Tab: Histórico do Cliente */}
              <TabsContent value="historico" className="mt-0">
                {historico && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2 text-slate-700">
                          <History className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{historico.length} registros de histórico</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-700">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            Última atividade: {historico[0]?.createdAt ? format(new Date(historico[0].createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-700">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            Atendente Suporte: {historico[0]?.atendenteSuporteId 
                              ? usuarios?.find((u: any) => u.id.toString() === historico[0].atendenteSuporteId)?.name || 'N/A'
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Cadastros */}
              <TabsContent value="cadastros" className="mt-0">
                <div className="mt-4">
                  <Card className="border border-[#e0e0e0] shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span>Informações Cadastrais</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Informações Básicas do Cliente */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Dados do Cliente</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase font-medium mb-1">Código</p>
                            <p className="text-base font-semibold text-slate-800">{selectedCliente}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase font-medium mb-1">Nome</p>
                            <p className="text-base font-semibold text-slate-800">
                              {Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informações de Representantes - Editáveis */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center justify-between">
                          <span>Representantes</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await updateMutation.mutateAsync({
                                  id: clienteLicenseData?.id,
                                  data: {
                                    representantePrincipalId: clienteLicenseData?.representantePrincipalId || null,
                                    representanteSecundarioId: clienteLicenseData?.representanteSecundarioId || null,
                                  }
                                });
                              } catch (error) {
                                console.error("Erro ao salvar representantes:", error);
                              }
                            }}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Salvar Alterações
                          </Button>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="representante-principal" className="text-sm font-medium text-slate-700">
                              Representante Principal
                            </Label>
                            <Select
                              value={clienteLicenseData?.representantePrincipalId?.toString() || ""}
                              onValueChange={(value) => {
                                if (clienteLicenseData) {
                                  queryClient.setQueryData(
                                    ["/api/licenses/by-code", selectedCliente],
                                    {
                                      ...clienteLicenseData,
                                      representantePrincipalId: value ? parseInt(value) : null
                                    }
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="border-blue-200 focus:border-blue-500">
                                <SelectValue placeholder="Selecione um representante" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Nenhum</SelectItem>
                                {representantes?.filter((r: any) => r.ativo).map((rep: any) => (
                                  <SelectItem key={rep.id} value={rep.id.toString()}>
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="w-4 h-4 text-blue-600" />
                                      <span>{rep.nome}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {clienteLicenseData?.representantePrincipalId && (
                              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
                                <p className="text-sm font-bold text-blue-800">
                                  {representantes?.find((r: any) => r.id === clienteLicenseData.representantePrincipalId)?.nome || 'N/A'}
                                </p>
                                {representantes?.find((r: any) => r.id === clienteLicenseData.representantePrincipalId)?.email && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    {representantes.find((r: any) => r.id === clienteLicenseData.representantePrincipalId).email}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="representante-secundario" className="text-sm font-medium text-slate-700">
                              Representante Secundário
                            </Label>
                            <Select
                              value={clienteLicenseData?.representanteSecundarioId?.toString() || ""}
                              onValueChange={(value) => {
                                if (clienteLicenseData) {
                                  queryClient.setQueryData(
                                    ["/api/licenses/by-code", selectedCliente],
                                    {
                                      ...clienteLicenseData,
                                      representanteSecundarioId: value ? parseInt(value) : null
                                    }
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="border-indigo-200 focus:border-indigo-500">
                                <SelectValue placeholder="Selecione um representante" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Nenhum</SelectItem>
                                {representantes?.filter((r: any) => r.ativo).map((rep: any) => (
                                  <SelectItem key={rep.id} value={rep.id.toString()}>
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="w-4 h-4 text-indigo-600" />
                                      <span>{rep.nome}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {clienteLicenseData?.representanteSecundarioId && (
                              <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border-l-4 border-indigo-500">
                                <p className="text-sm font-bold text-indigo-800">
                                  {representantes?.find((r: any) => r.id === clienteLicenseData.representanteSecundarioId)?.nome || 'N/A'}
                                </p>
                                {representantes?.find((r: any) => r.id === clienteLicenseData.representanteSecundarioId)?.email && (
                                  <p className="text-xs text-indigo-600 mt-1">
                                    {representantes.find((r: any) => r.id === clienteLicenseData.representanteSecundarioId).email}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ambientes do Cliente */}
                      {ambientes && ambientes.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Ambientes/Bases</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {ambientes.map((ambiente: string, index: number) => (
                              <div key={index} className="p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                                <Database className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                <p className="text-sm font-medium text-green-800">{ambiente}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Histórico do Cliente */}
      {selectedCliente && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Histórico do Cliente</span>
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {Array.isArray(clientes) ? clientes.find((c: Cliente) => c.code === selectedCliente)?.nomeCliente : ""}
                </p>
              </div>
            </div>

            {/* Filtros e Controles de Visualização */}
            <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtros:</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar no histórico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {TIPOS_ACAO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAtendente} onValueChange={setFilterAtendente}>
                <SelectTrigger className="w-48" data-testid="select-atendente">
                  <SelectValue placeholder="Atendente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Atendentes</SelectItem>
                  {Array.isArray(usuarios) && usuarios.map((usuario: any) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || filterStatus !== "all" || filterTipo !== "all" || filterAtendente !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setFilterTipo("all");
                    setFilterAtendente("all");
                  }}
                  className="text-slate-600"
                  data-testid="button-limpar-filtros"
                >
                  Limpar Filtros
                </Button>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-sm font-medium text-slate-700">Visualização:</span>
                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`h-8 px-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                    title="Visualização em Lista"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className={`h-8 px-3 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                    title="Visualização em Cards"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>

                {filteredHistorico && filteredHistorico.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={generateReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-gerar-relatorio"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredHistorico?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico encontrado</h3>
                <p className="text-sm">
                  {searchTerm || filterStatus !== "all" || filterTipo !== "all" || filterAtendente !== "all"
                    ? "Tente ajustar os filtros para encontrar registros."
                    : "Este cliente não possui histórico de atendimentos ainda."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-600 flex items-center justify-between">
                  <span>Mostrando {filteredHistorico?.length} de {historico?.length || 0} registros</span>
                  <div className="text-xs text-slate-500">
                    Ordenado por data de criação (mais recente primeiro)
                  </div>
                </div>

                {/* Modo Lista */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredHistorico?.map((item: ClienteHistorico) => {
                      const isExpanded = expandedCards.has(item.id);
                      return (
                        <Card key={item.id} className={cn("border hover:shadow-lg transition-all duration-300 hover:border-blue-300", getCardBackgroundColor(item.statusAtual))}>
                          <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            {/* Cabeçalho do Card */}
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(item.statusAtual)}
                                {getStatusBadge(item.statusAtual)}
                                {item.casoCritico && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Crítico
                                  </Badge>
                                )}
                              </div>
                              <div className="h-6 border-l border-slate-300"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-slate-900 text-lg">
                                      {getTipoAcaoLabel(item.tipoAtualizacao)}
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                      {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewDetails(item)}
                                      className="h-8 px-3 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                                      title="Ver detalhes completos"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Detalhes
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCardExpansion(item.id)}
                                      className="h-8 w-8 p-0 hover:bg-slate-50"
                                      title={isExpanded ? "Recolher" : "Expandir"}
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                title={item.statusAtual === 'CONCLUIDO' ? "Não é possível editar históricos concluídos" : "Editar"}
                                disabled={item.statusAtual === 'CONCLUIDO'}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
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

                        {/* Informações Principais */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Database className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Ambiente</p>
                                <p className="text-sm font-medium text-slate-700">{item.ambiente || '-'}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Responsável</p>
                                <p className="text-sm font-medium text-slate-700">{item.responsavel}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Atendente</p>
                                <p className="text-sm font-medium text-slate-700">
                                  {item.atendenteSuporteId 
                                    ? usuarios?.find((u: any) => u.id.toString() === item.atendenteSuporteId)?.name || 'N/A'
                                    : '-'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Tempo Gasto</p>
                                <p className="text-sm font-medium text-slate-700">
                                  {item.tempoGasto ? `${item.tempoGasto} min` : '-'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Seção Expandida */}
                          {isExpanded && (
                            <div className="mt-6 pt-4 border-t border-slate-200 space-y-4">
                              {/* Informações Detalhadas */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.dataUltimoAcesso && (
                                  <div className="flex items-center space-x-2">
                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                    <div>
                                      <p className="text-xs text-slate-500 uppercase font-medium">Último Acesso</p>
                                      <p className="text-sm font-medium text-slate-700">
                                        {format(new Date(item.dataUltimoAcesso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {item.numeroChamado && (
                                  <div className="flex items-center space-x-2">
                                    <FileImage className="w-4 h-4 text-slate-400" />
                                    <div className="flex-1">
                                      <p className="text-xs text-slate-500 uppercase font-medium">Chamado</p>
                                      <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                          #{item.numeroChamado}
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-slate-100"
                                          onClick={() => copyToClipboard(getFullTicketUrl(item.numeroChamado) || item.numeroChamado, "URL do chamado")}
                                          title="Copiar URL"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-slate-100"
                                          onClick={() => window.open(getFullTicketUrl(item.numeroChamado) || item.numeroChamado, '_blank')}
                                          title="Abrir chamado"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Checklist Preview */}
                              {(item.checklistInstalacao || item.checklistAtualizacao) && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center space-x-2">
                                    <CheckSquare className="w-4 h-4" />
                                    <span>Checklist Executado</span>
                                  </h4>
                                  <div className="text-sm text-blue-600">
                                    {item.checklistInstalacao && (
                                      <span className="inline-block bg-blue-100 px-2 py-1 rounded text-xs mr-2">
                                        ✅ Checklist de Instalação
                                      </span>
                                    )}
                                    {item.checklistAtualizacao && (
                                      <span className="inline-block bg-blue-100 px-2 py-1 rounded text-xs">
                                        ✅ Checklist de Atualização
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Anexos Preview */}
                              {item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0 && (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center space-x-2">
                                    <Paperclip className="w-4 h-4" />
                                    <span>Anexos ({item.anexos.length})</span>
                                  </h4>
                                  <div className="space-y-1">
                                    {item.anexos.slice(0, 2).map((anexo: string, index: number) => (
                                      <div key={index} className="flex items-center space-x-2 text-sm">
                                        <FileImage className="w-3 h-3 text-green-600" />
                                        <span className="text-green-600 truncate flex-1">{anexo}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-green-100"
                                          onClick={() => window.open(anexo, '_blank')}
                                          title="Abrir anexo"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    {item.anexos.length > 2 && (
                                      <p className="text-xs text-green-600 font-medium">
                                        +{item.anexos.length - 2} anexos adicionais
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Observações Resumidas */}
                              {item.observacoes && (
                                <div className="p-3 bg-slate-50 rounded-lg">
                                  <h4 className="text-sm font-medium text-slate-700 mb-1">Observações</h4>
                                  <p className="text-sm text-slate-600 line-clamp-2">
                                    {item.observacoes.length > 150 
                                      ? `${item.observacoes.substring(0, 150)}...` 
                                      : item.observacoes
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Número do Chamado */}
                        {item.numeroChamado && (
                          <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h4 className="text-sm font-medium text-indigo-700 mb-2 flex items-center space-x-2">
                              <span>📋</span>
                              <span>Chamado de Suporte</span>
                            </h4>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="text-indigo-600 font-medium">Número: </span>
                                <span className="text-indigo-800 font-medium">#{item.numeroChamado}</span>
                              </div>
                              <div className="text-sm">
                                <a 
                                  href={getFullTicketUrl(item.numeroChamado) || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 underline font-medium break-all"
                                >
                                  {getFullTicketUrl(item.numeroChamado)}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Versões (se aplicável) */}
                        {(item.versaoAnterior || item.versaoInstalada) && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Informações de Versão</h4>
                            <div className="flex items-center space-x-4">
                              {item.versaoAnterior && (
                                <div>
                                  <p className="text-xs text-slate-500 uppercase font-medium">Versão Anterior</p>
                                  <p className="text-sm font-medium text-red-600">{item.versaoAnterior}</p>
                                </div>
                              )}
                              {item.versaoAnterior && item.versaoInstalada && (
                                <div className="text-slate-400">→</div>
                              )}
                              {item.versaoInstalada && (
                                <div>
                                  <p className="text-xs text-slate-500 uppercase font-medium">Versão Instalada</p>
                                  <p className="text-sm font-medium text-green-600">{item.versaoInstalada}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Detalhes */}
                        {(item.observacoes || item.problemas || item.solucoes) && (
                          <div className="space-y-3">
                            {item.observacoes && (
                              <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-1">Observações</h4>
                                <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200">
                                  {item.observacoes}
                                </p>
                              </div>
                            )}

                            {item.problemas && (
                              <div>
                                <h4 className="text-sm font-medium text-red-700 mb-1 flex items-center space-x-1">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Problemas Encontrados</span>
                                </h4>
                                <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-lg border-l-4 border-red-200">
                                  {item.problemas}
                                </p>
                              </div>
                            )}

                            {item.solucoes && (
                              <div>
                                <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center space-x-1">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Soluções Aplicadas</span>
                                </h4>
                                <p className="text-sm text-slate-600 bg-green-50 p-3 rounded-lg border-l-4 border-green-200">
                                  {item.solucoes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Modo Cards */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHistorico?.map((item: ClienteHistorico) => {
                      const isFlipped = flippedCards.has(item.id);
                      return (
                        <div key={item.id} className="relative h-80 perspective-1000">
                          {/* Card Container com Flip */}
                          <div className={cn(
                            "relative w-full h-full transition-transform duration-700 transform-style-preserve-3d",
                            isFlipped ? "rotate-y-180" : ""
                          )}>

                            {/* Frente do Card */}
                            <Card className={cn(
                              "absolute inset-0 w-full h-full backface-hidden border-2 hover:shadow-xl transition-all duration-300",
                              getCardBackgroundColor(item.statusAtual)
                            )}>
                              <CardContent className="p-4 h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(item.statusAtual)}
                                    {getStatusBadge(item.statusAtual)}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleCardFlip(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-slate-100"
                                    title="Virar card"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </div>

                                {/* Título */}
                                <div className="mb-3">
                                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">
                                    {getTipoAcaoLabel(item.tipoAtualizacao)}
                                  </h3>
                                  <p className="text-xs text-slate-600">
                                    {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>

                                {/* Informações Principais */}
                                <div className="space-y-2 flex-1 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <Database className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-600 truncate">{item.ambiente || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-600 truncate">{item.responsavel}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-600">
                                      {item.tempoGasto ? `${item.tempoGasto} min` : 'N/A'}
                                    </span>
                                  </div>
                                  {item.numeroChamado && (
                                    <div className="flex items-center space-x-2">
                                      <FileImage className="w-3 h-3 text-slate-400" />
                                      <span className="text-slate-600">#{item.numeroChamado}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {item.casoCritico && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="w-2 h-2 mr-1" />
                                      Crítico
                                    </Badge>
                                  )}
                                  {item.checklistInstalacao && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                      Checklist Instalação
                                    </Badge>
                                  )}
                                  {item.checklistAtualizacao && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                      Checklist Atualização
                                    </Badge>
                                  )}
                                </div>

                                {/* Ações na Frente */}
                                <div className="flex justify-end space-x-1 mt-3 pt-2 border-t border-slate-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDetails(item)}
                                    className="h-7 px-2 text-xs hover:bg-blue-50 text-blue-600"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="h-7 px-2 text-xs hover:bg-slate-50"
                                    disabled={item.statusAtual === 'CONCLUIDO'}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Verso do Card */}
                            <Card className={cn(
                              "absolute inset-0 w-full h-full backface-hidden rotate-y-180 border-2",
                              getCardBackgroundColor(item.statusAtual)
                            )}>
                              <CardContent className="p-4 h-full flex flex-col">
                                {/* Header do Verso */}
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-slate-700 text-sm">Detalhes</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleCardFlip(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-slate-100"
                                    title="Virar card"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </div>

                                {/* Conteúdo do Verso */}
                                <div className="space-y-3 flex-1 text-xs overflow-y-auto">
                                  {/* Atendente */}
                                  <div>
                                    <span className="font-medium text-slate-600">Atendente:</span>
                                    <p className="text-slate-800 mt-1">
                                      {item.atendenteSuporteId 
                                        ? usuarios?.find((u: any) => u.id.toString() === item.atendenteSuporteId)?.name || 'N/A'
                                        : 'N/A'
                                      }
                                    </p>
                                  </div>

                                  {/* Versões */}
                                  {(item.versaoAnterior || item.versaoInstalada) && (
                                    <div>
                                      <span className="font-medium text-slate-600">Versões:</span>
                                      <div className="mt-1 space-y-1">
                                        {item.versaoAnterior && (
                                          <p className="text-red-600">Anterior: {item.versaoAnterior}</p>
                                        )}
                                        {item.versaoInstalada && (
                                          <p className="text-green-600">Instalada: {item.versaoInstalada}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Observações */}
                                  {item.observacoes && (
                                    <div>
                                      <span className="font-medium text-slate-600">Observações:</span>
                                      <p className="text-slate-800 mt-1 text-xs leading-relaxed">
                                        {item.observacoes.length > 120 
                                          ? `${item.observacoes.substring(0, 120)}...` 
                                          : item.observacoes
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {/* Problemas */}
                                  {item.problemas && (
                                    <div>
                                      <span className="font-medium text-red-600">Problemas:</span>
                                      <p className="text-slate-800 mt-1 text-xs leading-relaxed">
                                        {item.problemas.length > 100 
                                          ? `${item.problemas.substring(0, 100)}...` 
                                          : item.problemas
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {/* Soluções */}
                                  {item.solucoes && (
                                    <div>
                                      <span className="font-medium text-green-600">Soluções:</span>
                                      <p className="text-slate-800 mt-1 text-xs leading-relaxed">
                                        {item.solucoes.length > 100 
                                          ? `${item.solucoes.substring(0, 100)}...` 
                                          : item.solucoes
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {/* Anexos */}
                                  {item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0 && (
                                    <div>
                                      <span className="font-medium text-purple-600">Anexos:</span>
                                      <p className="text-slate-800 mt-1">{item.anexos.length} arquivo(s)</p>
                                    </div>
                                  )}
                                </div>

                                {/* Ações no Verso */}
                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200">
                                  <div className="flex space-x-1">
                                    {item.numeroChamado && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(getFullTicketUrl(item.numeroChamado!) || item.numeroChamado!, '_blank')}
                                        className="h-7 px-2 text-xs hover:bg-indigo-50 text-indigo-600"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Chamado
                                      </Button>
                                    )}
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs hover:bg-red-50 text-red-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
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
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes Completos */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Detalhes do Histórico
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Visualização completa das informações do atendimento
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedHistorico && (
            <div className="space-y-6 mt-6">
              {/* Cabeçalho com Status */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(selectedHistorico.statusAtual)}
                  {getStatusBadge(selectedHistorico.statusAtual)}
                  {selectedHistorico.casoCritico && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Caso Crítico
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {getTipoAcaoLabel(selectedHistorico.tipoAtualizacao)}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {format(new Date(selectedHistorico.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase">Cliente</h4>
                  <p className="text-base font-semibold text-slate-800">{selectedHistorico.nomeCliente}</p>
                  <p className="text-sm text-slate-600">Código: {selectedHistorico.codigoCliente}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase">Ambiente</h4>
                  <p className="text-base font-semibold text-slate-800">{selectedHistorico.ambiente || 'N/A'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase">Responsável</h4>
                  <p className="text-base font-semibold text-slate-800">{selectedHistorico.responsavel}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase">Atendente Suporte</h4>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedHistorico.atendenteSuporteId 
                      ? usuarios?.find((u: any) => u.id.toString() === selectedHistorico.atendenteSuporteId)?.name || 'N/A'
                      : 'N/A'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase">Tempo Gasto</h4>
                  <p className="text-base font-semibold text-slate-800">
                    {selectedHistorico.tempoGasto ? `${selectedHistorico.tempoGasto} minutos` : 'N/A'}
                  </p>
                </div>

                {selectedHistorico.numeroChamado && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500 uppercase">Chamado de Suporte</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">Número:</span>
                        <p className="text-base font-semibold text-slate-800">
                          #{selectedHistorico.numeroChamado}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-slate-600 truncate flex-1">
                          {getFullTicketUrl(selectedHistorico.numeroChamado)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getFullTicketUrl(selectedHistorico.numeroChamado!) || selectedHistorico.numeroChamado!, "URL do chamado")}
                          className="h-7 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getFullTicketUrl(selectedHistorico.numeroChamado!) || selectedHistorico.numeroChamado!, '_blank')}
                          className="h-7 px-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Versões */}
              {(selectedHistorico.versaoAnterior || selectedHistorico.versaoInstalada) && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-slate-700 mb-3">Controle de Versões</h4>
                  <div className="flex items-center space-x-6">
                    {selectedHistorico.versaoAnterior && (
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase">Versão Anterior</p>
                        <p className="text-lg font-bold text-red-600">{selectedHistorico.versaoAnterior}</p>
                      </div>
                    )}
                    {selectedHistorico.versaoAnterior && selectedHistorico.versaoInstalada && (
                      <div className="text-slate-400 text-2xl">→</div>
                    )}
                    {selectedHistorico.versaoInstalada && (
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase">Versão Instalada</p>
                        <p className="text-lg font-bold text-green-600">{selectedHistorico.versaoInstalada}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checklists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedHistorico.checklistInstalacao && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-700 mb-3 flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5" />
                      <span>Checklist de Instalação</span>
                    </h4>
                    {(() => {
                      const checklist = formatChecklistData(selectedHistorico.checklistInstalacao);
                      if (!checklist) return <p className="text-blue-600">Dados do checklist não disponíveis</p>;

                      const completed = Object.values(checklist).filter(Boolean).length;
                      const total = Object.keys(checklist).length;

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-blue-600">Progresso:</span>
                            <span className="text-sm font-bold text-blue-700">{completed}/{total} concluídos</span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(checklist).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2 text-sm">
                                <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={value ? 'text-green-700' : 'text-gray-600'}>
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedHistorico.checklistAtualizacao && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5" />
                      <span>Checklist de Atualização</span>
                    </h4>
                    {(() => {
                      const checklist = formatChecklistData(selectedHistorico.checklistAtualizacao);
                      if (!checklist) return <p className="text-green-600">Dados do checklist não disponíveis</p>;

                      const completed = Object.values(checklist).filter(Boolean).length;
                      const total = Object.keys(checklist).length;

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-green-600">Progresso:</span>
                            <span className="text-sm font-bold text-green-700">{completed}/{total} concluídos</span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(checklist).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2 text-sm">
                                <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className={value ? 'text-green-700' : 'text-gray-600'}>
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Anexos */}
              {selectedHistorico.anexos && Array.isArray(selectedHistorico.anexos) && selectedHistorico.anexos.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-lg font-semibold text-purple-700 mb-3 flex items-center space-x-2">
                    <Paperclip className="w-5 h-5" />
                    <span>Anexos ({selectedHistorico.anexos.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedHistorico.anexos.map((anexo: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                        <div className="flex items-center space-x-2 flex-1">
                          <FileImage className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-purple-700 truncate">{anexo}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(anexo, "Link do anexo")}
                            className="h-7 w-7 p-0 hover:bg-purple-100"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(anexo, '_blank')}
                            className="h-7 w-7 p-0 hover:bg-purple-100"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrições Detalhadas */}
              <div className="space-y-4">
                {selectedHistorico.observacoes && (
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="text-lg font-semibold text-blue-700 mb-2">Observações</h4>
                    <p className="text-blue-800 whitespace-pre-wrap">{selectedHistorico.observacoes}</p>
                  </div>
                )}

                {selectedHistorico.problemas && (
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <h4 className="text-lg font-semibold text-red-700 mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Problemas Encontrados</span>
                    </h4>
                    <p className="text-red-800 whitespace-pre-wrap">{selectedHistorico.problemas}</p>
                  </div>
                )}

                {selectedHistorico.solucoes && (
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <h4 className="text-lg font-semibold text-green-700 mb-2 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Soluções Aplicadas</span>
                    </h4>
                    <p className="text-green-800 whitespace-pre-wrap">{selectedHistorico.solucoes}</p>
                  </div>
                )}

                {selectedHistorico.observacoesChecklist && (
                  <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-slate-400">
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">Observações do Checklist</h4>
                    <p className="text-slate-800 whitespace-pre-wrap">{selectedHistorico.observacoesChecklist}</p>
                  </div>
                )}
              </div>

              {/* Rodapé com Informações de Auditoria */}
              <div className="pt-4 border-t border-slate-200 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Criado em: {format(new Date(selectedHistorico.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  <span>Última atualização: {format(new Date(selectedHistorico.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] border border-[#e0e0e0] shadow-xl">
          <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white shadow-md">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#0c151f]">
                  Editar Histórico
                </DialogTitle>
                <p className="text-sm text-[#3a3a3c] mt-1">
                  Atualize as informações do histórico de atendimento
                </p>
              </div>
            </div>
          </DialogHeader>
          {editingHistorico && (
            <HistoricoForm
              isEdit={true}
              initialData={editingHistorico}
              ambientes={ambientes}
              usuarios={usuarios}
              onSubmit={(data: any) => updateMutation.mutate({ id: editingHistorico.id, historico: data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}