
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Calendar, User, Database, Hash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MensagemSistema {
  id: number;
  mensagem: string;
  base: string;
  emailUsuario: string;
  dataValidade: string;
  hardwareKey: string;
  createdAt: string;
  updatedAt: string;
}

export default function Mensagens() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMensagem, setEditingMensagem] = useState<MensagemSistema | null>(null);
  const [formData, setFormData] = useState({
    mensagem: "",
    base: "",
    emailUsuario: "",
    dataValidade: "",
    hardwareKey: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mensagens = [], isLoading, error } = useQuery({
    queryKey: ["/api/mensagens"],
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/mensagens", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mensagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Mensagem criada com sucesso!",
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; mensagem: any }) => {
      return await apiRequest("PUT", `/api/mensagens/${data.id}`, data.mensagem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mensagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Mensagem atualizada com sucesso!",
      });
      setIsEditModalOpen(false);
      setEditingMensagem(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/mensagens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mensagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Mensagem excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      mensagem: "",
      base: "",
      emailUsuario: "",
      dataValidade: "",
      hardwareKey: ""
    });
  }, []);

  const handleCreate = useCallback(() => {
    createMutation.mutate(formData);
  }, [formData, createMutation]);

  const handleEdit = useCallback((mensagem: MensagemSistema) => {
    setEditingMensagem(mensagem);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdate = useCallback(() => {
    if (editingMensagem) {
      updateMutation.mutate({
        id: editingMensagem.id,
        mensagem: editingMensagem
      });
    }
  }, [editingMensagem, updateMutation]);

  const handleDelete = useCallback((id: number) => {
    if (confirm("Tem certeza que deseja excluir esta mensagem?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditFieldChange = useCallback((field: string, value: any) => {
    setEditingMensagem(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const isExpired = (dataValidade: string) => {
    return new Date(dataValidade) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mensagens do Sistema</h1>
          <p className="text-slate-600 mt-1">Gerencie mensagens do sistema por base e hardware</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nova Mensagem</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Mensagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  value={formData.mensagem}
                  onChange={(e) => handleFieldChange('mensagem', e.target.value)}
                  placeholder="Digite a mensagem..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base">Base</Label>
                  <Input
                    id="base"
                    value={formData.base}
                    onChange={(e) => handleFieldChange('base', e.target.value)}
                    placeholder="Nome da base"
                  />
                </div>
                <div>
                  <Label htmlFor="emailUsuario">Email do Usuário</Label>
                  <Input
                    id="emailUsuario"
                    type="email"
                    value={formData.emailUsuario}
                    onChange={(e) => handleFieldChange('emailUsuario', e.target.value)}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataValidade">Data de Validade</Label>
                  <Input
                    id="dataValidade"
                    type="datetime-local"
                    value={formData.dataValidade}
                    onChange={(e) => handleFieldChange('dataValidade', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="hardwareKey">Hardware Key</Label>
                  <Input
                    id="hardwareKey"
                    value={formData.hardwareKey}
                    onChange={(e) => handleFieldChange('hardwareKey', e.target.value)}
                    placeholder="Hardware key"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Criando..." : "Criar Mensagem"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Todas as Mensagens</CardTitle>
          <p className="text-sm text-gray-500">
            {mensagens.length} mensagem(s) cadastrada(s)
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Erro ao carregar mensagens: {(error as Error).message}</p>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma mensagem cadastrada ainda.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {mensagens.map((mensagem: MensagemSistema) => (
                <div key={mensagem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={isExpired(mensagem.dataValidade) ? "destructive" : "default"}>
                          {isExpired(mensagem.dataValidade) ? "Expirada" : "Ativa"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(mensagem.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3">{mensagem.mensagem}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Database className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Base:</span>
                          <span className="font-medium">{mensagem.base}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Usuário:</span>
                          <span className="font-medium">{mensagem.emailUsuario}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Validade:</span>
                          <span className="font-medium">
                            {format(new Date(mensagem.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Hash className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Hardware:</span>
                          <span className="font-medium text-xs">{mensagem.hardwareKey}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(mensagem)}
                        className="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(mensagem.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
          </DialogHeader>
          {editingMensagem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-mensagem">Mensagem</Label>
                <Textarea
                  id="edit-mensagem"
                  value={editingMensagem.mensagem}
                  onChange={(e) => handleEditFieldChange('mensagem', e.target.value)}
                  placeholder="Digite a mensagem..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-base">Base</Label>
                  <Input
                    id="edit-base"
                    value={editingMensagem.base}
                    onChange={(e) => handleEditFieldChange('base', e.target.value)}
                    placeholder="Nome da base"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-emailUsuario">Email do Usuário</Label>
                  <Input
                    id="edit-emailUsuario"
                    type="email"
                    value={editingMensagem.emailUsuario}
                    onChange={(e) => handleEditFieldChange('emailUsuario', e.target.value)}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dataValidade">Data de Validade</Label>
                  <Input
                    id="edit-dataValidade"
                    type="datetime-local"
                    value={editingMensagem.dataValidade ? new Date(editingMensagem.dataValidade).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleEditFieldChange('dataValidade', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hardwareKey">Hardware Key</Label>
                  <Input
                    id="edit-hardwareKey"
                    value={editingMensagem.hardwareKey}
                    onChange={(e) => handleEditFieldChange('hardwareKey', e.target.value)}
                    placeholder="Hardware key"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
