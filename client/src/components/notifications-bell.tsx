
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Notificacao {
  id: number;
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  chamadoId?: number;
  lida: boolean;
  createdAt: string;
}

export default function NotificationsBell() {
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousUnreadCount = useRef<number>(0);

  // Estado para controlar se o áudio foi inicializado
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Criar elemento de áudio
  useEffect(() => {
    // Caminho correto para arquivos na pasta attached_assets
    const audio = new Audio('/attached_assets/message-notification-sound-in-the-help-chat-tech-support_1759956200595.mp3');
    audio.volume = 0.5; // Volume a 50%
    
    // Pré-carregar o áudio
    audio.load();
    
    audioRef.current = audio;
  }, []);

  // Função para habilitar áudio (necessária devido à política de autoplay)
  const enableAudio = async () => {
    if (audioRef.current && !audioEnabled) {
      try {
        // Tentar tocar e pausar imediatamente para "desbloquear" o áudio
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioEnabled(true);
        console.log('✅ Áudio habilitado com sucesso!');
      } catch (err) {
        console.warn('⚠️ Erro ao habilitar áudio:', err);
      }
    }
  };

  // Buscar contagem de não lidas
  const { data: unreadData, refetch: refetchUnreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notificacoes/unread-count"],
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  // Buscar notificações
  const { data: notificacoes = [] } = useQuery<Notificacao[]>({
    queryKey: ["/api/notificacoes"],
    enabled: isOpen,
  });

  const unreadCount = unreadData?.count || 0;

  // Tocar som quando houver novas notificações
  useEffect(() => {
    // Inicializar o contador na primeira vez
    if (previousUnreadCount.current === 0 && unreadCount > 0) {
      previousUnreadCount.current = unreadCount;
      return;
    }

    // Tocar som apenas quando há um aumento real no número de notificações E áudio está habilitado
    if (unreadCount > previousUnreadCount.current) {
      console.log(`🔔 Nova notificação detectada! De ${previousUnreadCount.current} para ${unreadCount}`);
      
      if (audioRef.current && audioEnabled) {
        // Resetar o áudio para o início caso esteja tocando
        audioRef.current.currentTime = 0;
        
        // Tentar tocar o áudio
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Som de notificação tocado com sucesso!');
            })
            .catch(err => {
              console.warn('⚠️ Erro ao tocar som de notificação:', err.message);
              setAudioEnabled(false); // Desabilitar se falhar
            });
        }
      } else if (!audioEnabled) {
        console.log('💡 Áudio desabilitado. Abra o menu de notificações para habilitar o som.');
      }
    }
    
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Marcar notificação como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notificacoes/${id}/mark-read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao marcar como lida");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notificacoes/unread-count"] });
    },
  });

  // Marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/notificacoes/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao marcar todas como lidas");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notificacoes/unread-count"] });
    },
  });

  const handleNotificationClick = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      markAsReadMutation.mutate(notificacao.id);
    }

    if (notificacao.chamadoId) {
      navigate(`/chamados/${notificacao.chamadoId}`);
      setIsOpen(false);
    }
  };

  // Atualizar quando houver mudanças nos chamados
  useEffect(() => {
    const handleActivityUpdate = () => {
      refetchUnreadCount();
    };

    window.addEventListener('activityUpdate', handleActivityUpdate as EventListener);

    return () => {
      window.removeEventListener('activityUpdate', handleActivityUpdate as EventListener);
    };
  }, [refetchUnreadCount]);

  // Habilitar áudio com interação do usuário (resolve restrição de autoplay)
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    
    // Ao abrir o dropdown pela primeira vez, habilitar o áudio
    if (open && !audioEnabled) {
      await enableAudio();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title={audioEnabled ? "Som habilitado ✓" : "Clique para habilitar o som"}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {!audioEnabled && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" title="Áudio desabilitado - clique no sino para habilitar" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {!audioEnabled && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <p className="text-xs text-yellow-800">
              🔇 <strong>Som desabilitado.</strong> Abra este menu novamente para habilitar notificações sonoras.
            </p>
          </div>
        )}
        
        {audioEnabled && (
          <div className="px-4 py-2 bg-green-50 border-b border-green-200">
            <p className="text-xs text-green-800">
              🔔 <strong>Som habilitado!</strong> Você receberá alertas sonoros para novas notificações.
            </p>
          </div>
        )}
        <ScrollArea className="h-96">
          {notificacoes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notificacoes.map((notificacao) => (
              <DropdownMenuItem
                key={notificacao.id}
                className={`flex flex-col items-start p-4 cursor-pointer ${
                  !notificacao.lida ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                }`}
                onClick={() => handleNotificationClick(notificacao)}
              >
                <div className="flex items-start justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm">{notificacao.titulo}</span>
                  </div>
                  {!notificacao.lida && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full mt-1"></div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{notificacao.mensagem}</p>
                <span className="text-xs text-slate-400">
                  {format(new Date(notificacao.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
