
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

  // Criar elemento de áudio
  useEffect(() => {
    audioRef.current = new Audio('/attached_assets/message-notification-sound-in-the-help-chat-tech-support_1759956200595.mp3');
    audioRef.current.volume = 0.5; // Volume a 50%
  }, []);

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
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      audioRef.current?.play().catch(err => {
        console.log('Erro ao tocar som de notificação:', err);
      });
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
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
