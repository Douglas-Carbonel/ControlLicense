
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ClipboardList, Clock, CheckCircle, AlertCircle, ChevronRight, TrendingUp, Target, Zap, Timer, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";

interface ClienteHistorico {
  id: number;
  codigoCliente: string;
  nomeCliente: string;
  ambiente: string | null;
  versaoInstalada: string | null;
  versaoAnterior: string | null;
  tipoAtualizacao: string;
  observacoes: string | null;
  responsavel: string;
  atendenteSuporteId: string | null;
  dataUltimoAcesso: string | null;
  casoCritico: boolean;
  statusAtual: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  tempoGasto: number | null;
  problemas: string | null;
  solucoes: string | null;
  numeroChamado: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SupportDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: historicos = [], isLoading } = useQuery<ClienteHistorico[]>({
    queryKey: ["/api/my-historico"],
    staleTime: 2 * 60 * 1000,
  });

  // Organizar históricos por status
  const pendentes = historicos.filter(h => h.statusAtual === 'PENDENTE');
  const emAndamento = historicos.filter(h => h.statusAtual === 'EM_ANDAMENTO');
  const concluidos = historicos.filter(h => h.statusAtual === 'CONCLUIDO');
  const criticos = historicos.filter(h => h.casoCritico && h.statusAtual !== 'CONCLUIDO');

  // Calcular métricas de desempenho
  const totalHorasTrabalhadas = historicos
    .filter(h => h.tempoGasto)
    .reduce((acc, h) => acc + (h.tempoGasto || 0), 0);
  
  const tempoMedioAtendimento = concluidos.length > 0
    ? Math.round(concluidos.filter(h => h.tempoGasto).reduce((acc, h) => acc + (h.tempoGasto || 0), 0) / concluidos.length)
    : 0;

  // Distribuição por tipo de atendimento
  const tiposDistribuicao = historicos.reduce((acc, h) => {
    acc[h.tipoAtualizacao] = (acc[h.tipoAtualizacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tipoMap: Record<string, string> = {
    'INSTALACAO': 'Instalação',
    'ATUALIZACAO_MOBILE': 'Atualização Mobile',
    'ATUALIZACAO_PORTAL': 'Atualização Portal',
    'ACESSO_REMOTO': 'Acesso Remoto',
    'ATENDIMENTO_WHATSAPP': 'Atendimento WhatsApp',
    'REUNIAO_CLIENTE': 'Reunião com Cliente'
  };

  const tipoColors: Record<string, string> = {
    'INSTALACAO': 'bg-purple-500',
    'ATUALIZACAO_MOBILE': 'bg-blue-500',
    'ATUALIZACAO_PORTAL': 'bg-green-500',
    'ACESSO_REMOTO': 'bg-yellow-500',
    'ATENDIMENTO_WHATSAPP': 'bg-pink-500',
    'REUNIAO_CLIENTE': 'bg-indigo-500'
  };

  const handleCardClick = (codigoCliente: string) => {
    setLocation(`/clientes?search=${codigoCliente}`);
  };

  const HistoricoCard = ({ historico }: { historico: ClienteHistorico }) => (
    <div 
      onClick={() => handleCardClick(historico.codigoCliente)}
      className="group p-4 border border-slate-200 rounded-lg hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-white hover:bg-slate-50"
      data-testid={`historico-card-${historico.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800 group-hover:text-primary transition-colors" data-testid={`text-cliente-${historico.id}`}>
              {historico.nomeCliente}
            </h4>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-slate-500" data-testid={`text-codigo-${historico.id}`}>
            {historico.codigoCliente}
          </p>
        </div>
        {historico.casoCritico && (
          <Badge variant="destructive" className="animate-pulse" data-testid={`badge-critico-${historico.id}`}>
            Crítico
          </Badge>
        )}
      </div>
      
      <div className="space-y-1 text-sm">
        <p className="text-slate-600">
          <span className="font-medium">Tipo:</span> {tipoMap[historico.tipoAtualizacao] || historico.tipoAtualizacao}
        </p>
        {historico.ambiente && (
          <p className="text-slate-600">
            <span className="font-medium">Ambiente:</span> {historico.ambiente}
          </p>
        )}
        {historico.numeroChamado && (
          <p className="text-slate-600">
            <span className="font-medium">Chamado:</span> {historico.numeroChamado}
          </p>
        )}
        {historico.dataUltimoAcesso && (
          <p className="text-slate-600">
            <span className="font-medium">Data:</span>{" "}
            {format(new Date(historico.dataUltimoAcesso), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        )}
        {historico.tempoGasto && (
          <p className="text-slate-600">
            <span className="font-medium">Tempo:</span> {historico.tempoGasto} min
          </p>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com saudação personalizada */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          Olá, {user?.name}!
        </h1>
        <p className="text-slate-600 mt-1">
          Aqui está um resumo da sua performance e atendimentos
        </p>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-pendentes" className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pendentes
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600" data-testid="count-pendentes">
              {pendentes.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Aguardando início
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-em-andamento" className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Em Andamento
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="count-em-andamento">
              {emAndamento.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Em execução
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-concluidos" className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Concluídos
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="count-concluidos">
              {concluidos.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Finalizados
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-criticos" className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Casos Críticos
            </CardTitle>
            <Zap className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {criticos.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Métricas de Tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Total de Horas Trabalhadas</span>
                <span className="text-lg font-bold text-primary">
                  {Math.floor(totalHorasTrabalhadas / 60)}h {totalHorasTrabalhadas % 60}min
                </span>
              </div>
              <Progress value={Math.min((totalHorasTrabalhadas / 2400) * 100, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Tempo Médio por Atendimento</span>
                <span className="text-lg font-bold text-primary">{tempoMedioAtendimento} min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(tiposDistribuicao).map(([tipo, count]) => (
                <div key={tipo} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{tipoMap[tipo] || tipo}</span>
                    <span className="font-semibold text-slate-800">{count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${tipoColors[tipo] || 'bg-slate-400'} transition-all duration-500`}
                        style={{ width: `${(count / historicos.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">
                      {Math.round((count / historicos.length) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta do Dia (exemplo de gamificação) */}
      {historicos.length > 0 && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Meta de Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Objetivo do dia: 10 atendimentos</span>
                <span className="text-lg font-bold text-primary">{historicos.length}/10</span>
              </div>
              <Progress value={(historicos.length / 10) * 100} className="h-3" />
              {historicos.length >= 10 && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-2">
                  <CheckCircle className="h-4 w-4" />
                  Parabéns! Meta alcançada! 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casos Críticos em Destaque */}
      {criticos.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-600 animate-pulse" />
            ⚠️ Casos Críticos Requerem Atenção Imediata ({criticos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticos.map(historico => (
              <HistoricoCard key={historico.id} historico={historico} />
            ))}
          </div>
        </div>
      )}

      {/* Lista de Pendentes */}
      {pendentes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Pendentes ({pendentes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendentes.map(historico => (
              <HistoricoCard key={historico.id} historico={historico} />
            ))}
          </div>
        </div>
      )}

      {/* Lista de Em Andamento */}
      {emAndamento.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Em Andamento ({emAndamento.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {emAndamento.map(historico => (
              <HistoricoCard key={historico.id} historico={historico} />
            ))}
          </div>
        </div>
      )}

      {/* Lista de Concluídos */}
      {concluidos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Concluídos Recentes ({concluidos.slice(0, 6).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {concluidos.slice(0, 6).map(historico => (
              <HistoricoCard key={historico.id} historico={historico} />
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há históricos */}
      {historicos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Nenhum atendimento encontrado
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Você ainda não tem atendimentos registrados no sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
