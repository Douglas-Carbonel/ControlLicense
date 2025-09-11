
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, Copy, Eye, Link, FileText, Clock, CheckCircle, XCircle, User, Building2, Calendar, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FormulariosCliente() {
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFormulario, setSelectedFormulario] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados do novo formulário
  const [newForm, setNewForm] = useState({
    titulo: "",
    descricao: "",
    codCliente: "",
    nomeCliente: "",
    premissas: "",
    campos: JSON.stringify([
      { id: "empresa", label: "Nome da Empresa", tipo: "text", obrigatorio: true },
      { id: "cnpj", label: "CNPJ", tipo: "text", obrigatorio: true },
      { id: "contato", label: "Pessoa de Contato", tipo: "text", obrigatorio: true },
      { id: "email", label: "Email", tipo: "email", obrigatorio: true },
      { id: "telefone", label: "Telefone", tipo: "tel", obrigatorio: false }
    ], null, 2),
    dataExpiracao: ""
  });

  const { data: formularios, isLoading } = useQuery({
    queryKey: ["/api/formularios-cliente"],
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/formularios-cliente", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formularios-cliente"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Formulário criado com sucesso!",
      });
      setIsNewFormModalOpen(false);
      setNewForm({
        titulo: "",
        descricao: "",
        codCliente: "",
        nomeCliente: "",
        premissas: "",
        campos: JSON.stringify([
          { id: "empresa", label: "Nome da Empresa", tipo: "text", obrigatorio: true },
          { id: "cnpj", label: "CNPJ", tipo: "text", obrigatorio: true },
          { id: "contato", label: "Pessoa de Contato", tipo: "text", obrigatorio: true },
          { id: "email", label: "Email", tipo: "email", obrigatorio: true },
          { id: "telefone", label: "Telefone", tipo: "tel", obrigatorio: false }
        ], null, 2),
        dataExpiracao: ""
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar formulário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/formularios-cliente/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formularios-cliente"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Sucesso",
        description: "Formulário excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir formulário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateForm = useCallback(() => {
    try {
      // Validar JSON dos campos
      JSON.parse(newForm.campos);
      
      const formData = {
        ...newForm,
        dataExpiracao: newForm.dataExpiracao ? new Date(newForm.dataExpiracao) : null
      };
      
      createMutation.mutate(formData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "JSON dos campos é inválido. Verifique a sintaxe.",
        variant: "destructive",
      });
    }
  }, [newForm, createMutation, toast]);

  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${type} copiado para a área de transferência`,
      });
    });
  }, [toast]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "preenchido":
        return "default";
      case "pendente":
        return "secondary";
      case "expirado":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "preenchido":
        return "Preenchido";
      case "pendente":
        return "Pendente";
      case "expirado":
        return "Expirado";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preenchido":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pendente":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "expirado":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleViewFormulario = useCallback(async (formulario: any) => {
    try {
      const respostas = await apiRequest("GET", `/api/formularios-cliente/${formulario.id}/respostas`);
      setSelectedFormulario({ ...formulario, respostas });
      setIsViewModalOpen(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do formulário",
        variant: "destructive",
      });
    }
  }, [toast]);

  const currentUrl = window.location.origin;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Formulários de Cliente</h1>
          <p className="text-slate-600 mt-1">Gerencie formulários de onboarding para novos clientes</p>
        </div>
        <Dialog open={isNewFormModalOpen} onOpenChange={setIsNewFormModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium shadow-md transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Novo Formulário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] border border-[#e0e0e0] shadow-xl">
            <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white shadow-md">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-[#0c151f]">
                    Novo Formulário de Cliente
                  </DialogTitle>
                  <p className="text-sm text-[#3a3a3c] mt-1">
                    Configure o formulário de onboarding para o cliente
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Título do Formulário</Label>
                  <Input
                    value={newForm.titulo}
                    onChange={(e) => setNewForm(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Formulário de Onboarding - SAP Business One"
                    className="border-[#e0e0e0] focus:border-[#0095da]"
                  />
                </div>
                <div>
                  <Label>Código do Cliente</Label>
                  <Input
                    value={newForm.codCliente}
                    onChange={(e) => setNewForm(prev => ({ ...prev, codCliente: e.target.value }))}
                    placeholder="Ex: C0001"
                    className="border-[#e0e0e0] focus:border-[#0095da]"
                  />
                </div>
              </div>
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  value={newForm.nomeCliente}
                  onChange={(e) => setNewForm(prev => ({ ...prev, nomeCliente: e.target.value }))}
                  placeholder="Ex: Empresa ABC Ltda"
                  className="border-[#e0e0e0] focus:border-[#0095da]"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newForm.descricao}
                  onChange={(e) => setNewForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do formulário..."
                  rows={2}
                  className="border-[#e0e0e0] focus:border-[#0095da] resize-none"
                />
              </div>
              <div>
                <Label>Premissas e Informações</Label>
                <Textarea
                  value={newForm.premissas}
                  onChange={(e) => setNewForm(prev => ({ ...prev, premissas: e.target.value }))}
                  placeholder="Premissas, informações importantes, instruções..."
                  rows={3}
                  className="border-[#e0e0e0] focus:border-[#0095da] resize-none"
                />
              </div>
              <div>
                <Label>Data de Expiração (Opcional)</Label>
                <Input
                  type="datetime-local"
                  value={newForm.dataExpiracao}
                  onChange={(e) => setNewForm(prev => ({ ...prev, dataExpiracao: e.target.value }))}
                  className="border-[#e0e0e0] focus:border-[#0095da]"
                />
              </div>
              <div>
                <Label>Campos do Formulário (JSON)</Label>
                <Textarea
                  value={newForm.campos}
                  onChange={(e) => setNewForm(prev => ({ ...prev, campos: e.target.value }))}
                  rows={8}
                  className="border-[#e0e0e0] focus:border-[#0095da] resize-none font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configure os campos que o cliente deve preencher (formato JSON)
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#e0e0e0]">
                <Button variant="outline" onClick={() => setIsNewFormModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateForm}
                  disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Formulário"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800">Todos os Formulários</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {formularios?.length || 0} formulários criados
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : !formularios || formularios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Nenhum formulário criado ainda.</p>
              <p className="text-sm">Clique em "Novo Formulário" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {formularios.map((formulario: any) => (
                <Card key={formulario.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold text-slate-800 truncate">
                            {formulario.titulo}
                          </CardTitle>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {formulario.nomeCliente}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(formulario.status)} className="text-xs">
                        {getStatusIcon(formulario.status)}
                        <span className="ml-1">{getStatusText(formulario.status)}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Cliente</p>
                          <p className="text-gray-600 truncate">{formulario.codCliente}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Criado</p>
                          <p className="text-gray-600">
                            {format(new Date(formulario.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      {formulario.dataExpiracao && (
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">Expira em</p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(formulario.dataExpiracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">URL Pública</p>
                        <div className="flex items-center space-x-1 bg-gray-50 p-2 rounded border">
                          <p className="text-xs text-gray-600 flex-1 truncate">
                            {currentUrl}/formulario/{formulario.urlPublica}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 hover:bg-gray-200"
                            onClick={() => copyToClipboard(`${currentUrl}/formulario/${formulario.urlPublica}`, "URL")}
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Por: {formulario.criadoPor}
                        </p>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewFormulario(formulario)}
                            className="p-1 h-7 w-7 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleteMutation.isPending}
                                className="p-1 h-7 w-7 hover:bg-red-50 text-gray-500 hover:text-red-600"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                                      Excluir Formulário
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm text-red-700 mt-1">
                                      Esta ação não pode ser desfeita
                                    </AlertDialogDescription>
                                  </div>
                                </div>
                              </AlertDialogHeader>
                              <div className="py-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <p className="text-sm text-red-800">
                                    <strong>Formulário:</strong> {formulario.titulo}<br />
                                    <strong>Cliente:</strong> {formulario.nomeCliente}
                                  </p>
                                </div>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(formulario.id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium"
                                >
                                  Confirmar Exclusão
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-[#f4f4f4] via-white to-[#f8f9fa] border border-[#e0e0e0] shadow-xl">
          <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white shadow-md">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#0c151f]">
                  {selectedFormulario?.titulo}
                </DialogTitle>
                <p className="text-sm text-[#3a3a3c] mt-1">
                  Cliente: {selectedFormulario?.nomeCliente}
                </p>
              </div>
            </div>
          </DialogHeader>
          {selectedFormulario && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#f4f4f4] border border-[#e0e0e0] rounded-lg p-1">
                <TabsTrigger value="info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white">
                  Informações
                </TabsTrigger>
                <TabsTrigger value="campos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white">
                  Campos
                </TabsTrigger>
                <TabsTrigger value="respostas" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0095da] data-[state=active]:to-[#313d5a] data-[state=active]:text-white">
                  Respostas ({selectedFormulario.respostas?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[#0c151f] font-medium">Status</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(selectedFormulario.status)}
                            <span className="text-sm">{getStatusText(selectedFormulario.status)}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[#0c151f] font-medium">Código do Cliente</Label>
                          <p className="text-sm text-gray-600 mt-1">{selectedFormulario.codCliente}</p>
                        </div>
                      </div>
                      {selectedFormulario.descricao && (
                        <div>
                          <Label className="text-[#0c151f] font-medium">Descrição</Label>
                          <p className="text-sm text-gray-600 mt-1">{selectedFormulario.descricao}</p>
                        </div>
                      )}
                      {selectedFormulario.premissas && (
                        <div>
                          <Label className="text-[#0c151f] font-medium">Premissas</Label>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-1">
                            <pre className="text-sm text-blue-800 whitespace-pre-wrap">{selectedFormulario.premissas}</pre>
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-[#0c151f] font-medium">URL Pública</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input 
                            value={`${currentUrl}/formulario/${selectedFormulario.urlPublica}`}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`${currentUrl}/formulario/${selectedFormulario.urlPublica}`, "URL")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[#0c151f] font-medium">Criado em</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(selectedFormulario.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        {selectedFormulario.dataExpiracao && (
                          <div>
                            <Label className="text-[#0c151f] font-medium">Expira em</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {format(new Date(selectedFormulario.dataExpiracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="campos" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {JSON.parse(selectedFormulario.campos || "[]").map((campo: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{campo.label}</p>
                            <p className="text-sm text-gray-500">
                              Tipo: {campo.tipo} • {campo.obrigatorio ? "Obrigatório" : "Opcional"}
                            </p>
                          </div>
                          <Badge variant={campo.obrigatorio ? "default" : "secondary"}>
                            {campo.obrigatorio ? "Obrigatório" : "Opcional"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="respostas" className="mt-6">
                <Card className="border border-[#e0e0e0] shadow-sm">
                  <CardContent className="pt-6">
                    {selectedFormulario.respostas && selectedFormulario.respostas.length > 0 ? (
                      <div className="space-y-4">
                        {selectedFormulario.respostas.map((resposta: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4 bg-green-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium">Resposta #{index + 1}</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {format(new Date(resposta.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <Label className="text-sm font-medium">Contato</Label>
                                <p className="text-sm">{resposta.nomeContato}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Email</Label>
                                <p className="text-sm">{resposta.emailContato}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Empresa</Label>
                                <p className="text-sm">{resposta.empresa}</p>
                              </div>
                              {resposta.telefoneContato && (
                                <div>
                                  <Label className="text-sm font-medium">Telefone</Label>
                                  <p className="text-sm">{resposta.telefoneContato}</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Respostas do Formulário</Label>
                              <div className="bg-white border rounded-lg p-3 mt-1">
                                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(JSON.parse(resposta.respostas), null, 2)}</pre>
                              </div>
                            </div>
                            {resposta.observacoes && (
                              <div className="mt-3">
                                <Label className="text-sm font-medium">Observações</Label>
                                <p className="text-sm text-gray-600 mt-1">{resposta.observacoes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>Nenhuma resposta recebida ainda.</p>
                        <p className="text-sm">O cliente ainda não preencheu o formulário.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
