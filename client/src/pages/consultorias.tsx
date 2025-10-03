import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, Phone, Mail, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Representante {
  id: number;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  responsavel?: string;
  ativo: boolean;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Representantes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRepresentante, setEditingRepresentante] = useState<Representante | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: representantes, isLoading } = useQuery({
    queryKey: ["/api/representantes"],
  });

  const toggleRowExpansion = (representanteId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(representanteId)) {
        newSet.delete(representanteId);
      } else {
        newSet.add(representanteId);
      }
      return newSet;
    });
  };

  const ClientesVinculadosRow = ({ representanteId }: { representanteId: number }) => {
    const { data: clientesPrincipais } = useQuery({
      queryKey: ["/api/representantes", representanteId, "clientes", "principal"],
      queryFn: () => apiRequest("GET", `/api/representantes/${representanteId}/clientes?tipo=principal`),
      enabled: expandedRows.has(representanteId),
    });

    const { data: clientesSecundarios } = useQuery({
      queryKey: ["/api/representantes", representanteId, "clientes", "secundario"],
      queryFn: () => apiRequest("GET", `/api/representantes/${representanteId}/clientes?tipo=secundario`),
      enabled: expandedRows.has(representanteId),
    });

    if (!expandedRows.has(representanteId)) return null;

    const totalClientes = (clientesPrincipais?.length || 0) + (clientesSecundarios?.length || 0);

    return (
      <TableRow className="bg-slate-50 hover:bg-slate-50">
        <TableCell colSpan={5} className="p-0">
          <div className="p-4 border-l-4 border-purple-400">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-sm text-slate-700">
                Clientes Vinculados ({totalClientes})
              </span>
            </div>

            {clientesPrincipais && clientesPrincipais.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-purple-700 mb-2">Representante Principal ({clientesPrincipais.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                  {clientesPrincipais.map((cliente: any) => (
                    <div key={`principal-${cliente.code}`} className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                      <div className="text-sm">
                        <div className="font-medium text-purple-900">{cliente.code}</div>
                        <div className="text-xs text-purple-700">{cliente.nomeCliente}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientesSecundarios && clientesSecundarios.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Representante Secundário ({clientesSecundarios.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                  {clientesSecundarios.map((cliente: any) => (
                    <div key={`secundario-${cliente.code}`} className="flex items-center gap-2 p-2 bg-slate-100 rounded border border-slate-200">
                      <div className="text-sm">
                        <div className="font-medium text-slate-800">{cliente.code}</div>
                        <div className="text-xs text-slate-600">{cliente.nomeCliente}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalClientes === 0 && (
              <div className="text-sm text-slate-500 italic pl-6">
                Nenhum cliente vinculado a este representante
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const createMutation = useMutation({
    mutationFn: async (representante: any) => {
      return await apiRequest("POST", "/api/representantes", representante);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representantes"] });
      toast({ title: "Sucesso", description: "Representante criado com sucesso!" });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; representante: any }) => {
      return await apiRequest("PUT", `/api/representantes/${data.id}`, data.representante);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representantes"] });
      toast({ title: "Sucesso", description: "Representante atualizado com sucesso!" });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/representantes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representantes"] });
      toast({ title: "Sucesso", description: "Representante excluído com sucesso!" });
    },
  });

  const RepresentanteForm = ({ isEdit = false, initialData = null, onSubmit }: any) => {
    const [formData, setFormData] = useState({
      nome: initialData?.nome || "",
      razaoSocial: initialData?.razaoSocial || "",
      cnpj: initialData?.cnpj || "",
      email: initialData?.email || "",
      telefone: initialData?.telefone || "",
      whatsapp: initialData?.whatsapp || "",
      responsavel: initialData?.responsavel || "",
      ativo: initialData?.ativo ?? true,
      observacoes: initialData?.observacoes || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome do Representante *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="razaoSocial">Razão Social</Label>
            <Input
              id="razaoSocial"
              value={formData.razaoSocial}
              onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="responsavel">Responsável/Contato</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Representante Ativo</Label>
          </div>
        </div>
        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsCreateModalOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            {isEdit ? "Atualizar" : "Criar"} Representante
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Representantes</h1>
            <p className="text-slate-600 mt-1">Gerencie os representantes que vendem e dão suporte aos clientes</p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Representante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Representante</DialogTitle>
            </DialogHeader>
            <RepresentanteForm onSubmit={(representante: any) => createMutation.mutate(representante)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Representantes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {representantes?.map((representante: Representante) => (
                  <>
                    <TableRow key={representante.id}>
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(representante.id)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedRows.has(representante.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{representante.nome}</div>
                          {representante.razaoSocial && (
                            <div className="text-sm text-slate-500">{representante.razaoSocial}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{representante.responsavel || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {representante.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1" />
                              {representante.email}
                            </div>
                          )}
                          {representante.whatsapp && (
                            <div className="flex items-center text-sm">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {representante.whatsapp}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={representante.ativo ? "default" : "secondary"}>
                          {representante.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRepresentante(representante);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este representante?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(representante.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                    <ClientesVinculadosRow representanteId={representante.id} />
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Representante</DialogTitle>
          </DialogHeader>
          {editingRepresentante && (
            <RepresentanteForm
              isEdit={true}
              initialData={editingRepresentante}
              onSubmit={(data: any) => updateMutation.mutate({ id: editingRepresentante.id, representante: data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}