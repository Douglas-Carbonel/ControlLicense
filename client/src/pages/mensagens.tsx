
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, Calendar, User, Database, Hash, CheckCircle, XCircle, MessageSquare, AlertTriangle } from "lucide-react";
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
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean | null;
    licenseInfo: any;
  }>({ valid: null, licenseInfo: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mensagens = [], isLoading, error } = useQuery({
    queryKey: ["/api/mensagens"],
    staleTime: 5 * 60 * 1000,
  });

  // Query para buscar bases disponíveis
  const { data: availableBases = [] } = useQuery({
    queryKey: ["/api/mensagens/bases"],
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
  });

  // Query para buscar hardware keys por base
  const { data: availableHardwareKeys = [] } = useQuery({
    queryKey: ["/api/mensagens/hardware-keys", formData.base],
    enabled: !!formData.base,
    staleTime: 10 * 60 * 1000,
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
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Erro ao criar mensagem. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
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
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Erro ao atualizar mensagem. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
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

  // Função para validar combinação base + hardware key em tempo real
  const validateBaseHardware = useCallback(async (base: string, hardwareKey: string) => {
    if (base && hardwareKey) {
      try {
        const response = await fetch(`/api/mensagens/validate/${encodeURIComponent(base)}/${encodeURIComponent(hardwareKey)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Validation response:", data); // Debug
          setValidationStatus({
            valid: data.valid,
            licenseInfo: data.licenseInfo
          });
        } else {
          setValidationStatus({ valid: false, licenseInfo: null });
        }
      } catch (error) {
        console.error("Validation error:", error); // Debug
        setValidationStatus({ valid: false, licenseInfo: null });
      }
    } else {
      setValidationStatus({ valid: null, licenseInfo: null });
    }
  }, []);

  // Efeito para validar automaticamente quando base ou hardwareKey mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateBaseHardware(formData.base, formData.hardwareKey);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.base, formData.hardwareKey, validateBaseHardware]);

  const resetForm = useCallback(() => {
    setFormData({
      mensagem: "",
      base: "",
      emailUsuario: "",
      dataValidade: "",
      hardwareKey: ""
    });
    setValidationStatus({ valid: null, licenseInfo: null });
  }, []);

  const handleCreate = useCallback(() => {
    console.log('Sending data:', formData); // Debug
    const dataToSend = {
      ...formData,
      emailUsuario: formData.emailUsuario || null, // Garantir que seja null se vazio
      // Manter como string, o schema vai transformar
    };
    console.log('Final data:', dataToSend); // Debug
    createMutation.mutate(dataToSend);
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
    deleteMutation.mutate(id);
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
          <DialogContent className="sm:max-w-[600px] border-blue-200 shadow-xl">
            <DialogHeader className="space-y-4 pb-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 p-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-blue-900">Nova Mensagem</DialogTitle>
                  <DialogDescription className="text-sm text-blue-700 mt-1">
                    Crie uma nova mensagem para envio aos clientes do sistema
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="mensagem" className="text-blue-900 font-medium">
                  Mensagem <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="mensagem"
                  value={formData.mensagem}
                  onChange={(e) => handleFieldChange('mensagem', e.target.value)}
                  placeholder="Digite a mensagem..."
                  rows={4}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base" className="text-blue-900 font-medium">
                    Base <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="base"
                    value={formData.base}
                    onChange={(e) => handleFieldChange('base', e.target.value)}
                    placeholder="Digite o nome da base (ex: SBO_DEMO)"
                    list="bases-list"
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                  />
                  <datalist id="bases-list">
                    {availableBases.map((base) => (
                      <option key={base} value={base} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailUsuario" className="text-blue-900 font-medium">
                    Email do Usuário
                  </Label>
                  <Input
                    id="emailUsuario"
                    type="email"
                    value={formData.emailUsuario}
                    onChange={(e) => handleFieldChange('emailUsuario', e.target.value)}
                    placeholder="usuario@exemplo.com (opcional)"
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataValidade" className="text-blue-900 font-medium">
                    Data de Validade <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dataValidade"
                    type="datetime-local"
                    value={formData.dataValidade}
                    onChange={(e) => handleFieldChange('dataValidade', e.target.value)}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hardwareKey" className="text-blue-900 font-medium">
                    Hardware Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hardwareKey"
                    value={formData.hardwareKey}
                    onChange={(e) => handleFieldChange('hardwareKey', e.target.value)}
                    placeholder="Digite o hardware key (ex: D0950733748)"
                    list="hardware-keys-list"
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                  />
                  <datalist id="hardware-keys-list">
                    {availableHardwareKeys.map((hwKey) => (
                      <option key={hwKey} value={hwKey} />
                    ))}
                  </datalist>
                </div>
              </div>
              
              {/* Validação visual */}
              {formData.base && formData.hardwareKey && (
                <Alert className={validationStatus.valid === true ? "border-green-200 bg-green-50" : validationStatus.valid === false ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
                  <div className="flex items-center space-x-2">
                    {validationStatus.valid === true && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {validationStatus.valid === false && <XCircle className="w-4 h-4 text-red-600" />}
                    <AlertDescription className={validationStatus.valid === true ? "text-green-800" : validationStatus.valid === false ? "text-red-800" : "text-yellow-800"}>
                      {validationStatus.valid === true ? (
                        <>
                          <strong>✓ Combinação válida!</strong>
                          {validationStatus.licenseInfo && (
                            <div className="mt-1 text-sm">
                              Cliente: {validationStatus.licenseInfo.nomeCliente} | Código: {validationStatus.licenseInfo.code}
                            </div>
                          )}
                        </>
                      ) : validationStatus.valid === false ? (
                        <strong>✗ Combinação inválida - Esta base e hardware key não existem nas licenças</strong>
                      ) : (
                        <strong>Validando combinação...</strong>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              

              <div className="flex justify-end space-x-3 pt-6 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -mb-6 px-6 pb-6 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createMutation.isPending || validationStatus.valid === false || !formData.mensagem || !formData.base || !formData.dataValidade || !formData.hardwareKey}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    "Criar Mensagem"
                  )}
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
            <div className="grid gap-6">
              {mensagens.map((mensagem: MensagemSistema) => (
                <Card key={mensagem.id} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isExpired(mensagem.dataValidade) 
                    ? 'border-red-200 bg-red-50/30' 
                    : 'border-green-200 bg-green-50/20 hover:bg-green-50/40'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isExpired(mensagem.dataValidade) 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <Badge 
                            variant={isExpired(mensagem.dataValidade) ? "destructive" : "default"}
                            className={isExpired(mensagem.dataValidade) 
                              ? "bg-red-500 hover:bg-red-600" 
                              : "bg-green-500 hover:bg-green-600"
                            }
                          >
                            {isExpired(mensagem.dataValidade) ? "🔴 Expirada" : "🟢 Ativa"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Criada em {format(new Date(mensagem.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Editar mensagem"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-orange-200 shadow-xl">
                            <AlertDialogHeader>
                              <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
                                  <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                  <AlertDialogTitle className="text-lg font-semibold text-orange-900">
                                    Atenção - Editar Mensagem
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm text-orange-700 mt-1">
                                    Esta ação pode impactar no portal do cliente
                                  </AlertDialogDescription>
                                </div>
                              </div>
                            </AlertDialogHeader>
                            <div className="py-4">
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-orange-800">
                                    <p className="font-medium mb-2">Impactos da edição:</p>
                                    <ul className="list-disc list-inside space-y-1 text-orange-700">
                                      <li>A mensagem será atualizada imediatamente no portal do cliente</li>
                                      <li>Usuários conectados verão a nova versão da mensagem</li>
                                      <li>Esta ação será registrada no log de atividades</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleEdit(mensagem)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
                              >
                                Continuar Edição
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteMutation.isPending}
                              className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                              title="Excluir mensagem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-red-200 shadow-xl">
                            <AlertDialogHeader>
                              <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                                  <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                  <AlertDialogTitle className="text-lg font-semibold text-red-900">
                                    Atenção - Excluir Mensagem
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm text-red-700 mt-1">
                                    Esta ação é irreversível e pode impactar no portal do cliente
                                  </AlertDialogDescription>
                                </div>
                              </div>
                            </AlertDialogHeader>
                            <div className="py-4">
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-red-800">
                                    <p className="font-medium mb-2">Impactos da exclusão:</p>
                                    <ul className="list-disc list-inside space-y-1 text-red-700">
                                      <li>A mensagem será removida permanentemente do sistema</li>
                                      <li>Não estará mais disponível no portal do cliente</li>
                                      <li>Esta ação não pode ser desfeita</li>
                                      <li>A exclusão será registrada no log de atividades</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(mensagem.id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium"
                              >
                                Confirmar Exclusão
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                          Conteúdo da Mensagem
                        </h4>
                        <p className="text-gray-800 leading-relaxed">{mensagem.mensagem}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <Database className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Base</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{mensagem.base}</span>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Usuário</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">
                          {mensagem.emailUsuario || "Não especificado"}
                        </span>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-orange-100 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Validade</span>
                        </div>
                        <span className={`font-semibold text-sm ${
                          isExpired(mensagem.dataValidade) ? 'text-red-600' : 'text-gray-800'
                        }`}>
                          {format(new Date(mensagem.dataValidade), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(mensagem.dataValidade), "HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <Hash className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Hardware</span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-800 break-all">
                          {mensagem.hardwareKey}
                        </span>
                      </div>
                    </div>

                    {isExpired(mensagem.dataValidade) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            Esta mensagem expirou em {format(new Date(mensagem.dataValidade), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-blue-200 shadow-xl">
          <DialogHeader className="space-y-4 pb-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 -m-6 p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-blue-900">Editar Mensagem</DialogTitle>
                <p className="text-sm text-blue-600 mt-1">Modifique os dados da mensagem do sistema</p>
              </div>
            </div>
          </DialogHeader>
          {editingMensagem && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="edit-mensagem" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Mensagem do Sistema</span>
                </Label>
                <Textarea
                  id="edit-mensagem"
                  value={editingMensagem.mensagem}
                  onChange={(e) => handleEditFieldChange('mensagem', e.target.value)}
                  placeholder="Digite a mensagem que será exibida..."
                  rows={4}
                  className="resize-none border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="edit-base" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Base de Dados</span>
                  </Label>
                  <Input
                    id="edit-base"
                    value={editingMensagem.base}
                    onChange={(e) => handleEditFieldChange('base', e.target.value)}
                    placeholder="Ex: SBODEMOPROD"
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="edit-emailUsuario" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Email do Usuário (Opcional)</span>
                  </Label>
                  <Input
                    id="edit-emailUsuario"
                    type="email"
                    value={editingMensagem.emailUsuario || ""}
                    onChange={(e) => handleEditFieldChange('emailUsuario', e.target.value)}
                    placeholder="usuario@exemplo.com"
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="edit-dataValidade" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Data de Validade</span>
                  </Label>
                  <Input
                    id="edit-dataValidade"
                    type="datetime-local"
                    value={editingMensagem.dataValidade ? new Date(editingMensagem.dataValidade).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleEditFieldChange('dataValidade', e.target.value)}
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="edit-hardwareKey" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span>Hardware Key</span>
                  </Label>
                  <Input
                    id="edit-hardwareKey"
                    value={editingMensagem.hardwareKey}
                    onChange={(e) => handleEditFieldChange('hardwareKey', e.target.value)}
                    placeholder="Ex: C0758938208"
                    className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
