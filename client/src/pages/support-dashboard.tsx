import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ClipboardList, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const { data: historicos = [], isLoading } = useQuery<ClienteHistorico[]>({
    queryKey: ["/api/my-historico"],
    staleTime: 2 * 60 * 1000,
  });

  // Organizar históricos por status
  const pendentes = historicos.filter(h => h.statusAtual === 'PENDENTE');
  const emAndamento = historicos.filter(h => h.statusAtual === 'EM_ANDAMENTO');
  const concluidos = historicos.filter(h => h.statusAtual === 'CONCLUIDO');

  const tipoMap: Record<string, string> = {
    'INSTALACAO': 'Instalação',
    'ATUALIZACAO_MOBILE': 'Atualização Mobile',
    'ATUALIZACAO_PORTAL': 'Atualização Portal',
    'ACESSO_REMOTO': 'Acesso Remoto',
    'ATENDIMENTO_WHATSAPP': 'Atendimento WhatsApp',
    'REUNIAO_CLIENTE': 'Reunião com Cliente'
  };

  const HistoricoCard = ({ historico }: { historico: ClienteHistorico }) => (
    <div 
      className="p-4 border border-slate-200 rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
      data-testid={`historico-card-${historico.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800" data-testid={`text-cliente-${historico.id}`}>
            {historico.nomeCliente}
          </h4>
          <p className="text-sm text-slate-500" data-testid={`text-codigo-${historico.id}`}>
            {historico.codigoCliente}
          </p>
        </div>
        {historico.casoCritico && (
          <Badge variant="destructive" data-testid={`badge-critico-${historico.id}`}>
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Meus Atendimentos</h1>
        <p className="text-slate-600 mt-1">
          Olá, {user?.name}! Aqui estão seus históricos de atendimento organizados por status.
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-pendentes">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pendentes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="count-pendentes">
              {pendentes.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atendimentos aguardando início
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-em-andamento">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="count-em-andamento">
              {emAndamento.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atendimentos em execução
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-concluidos">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Concluídos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="count-concluidos">
              {concluidos.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atendimentos finalizados
            </p>
          </CardContent>
        </Card>
      </div>

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
