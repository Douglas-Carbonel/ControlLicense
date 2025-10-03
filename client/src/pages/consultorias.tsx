
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
import { Building2, Plus, Edit, Trash2, Users, Phone, Mail, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Consultoria {
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

export default function Consultorias() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConsultoria, setEditingConsultoria] = useState<Consultoria | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consultorias, isLoading } = useQuery({
    queryKey: ["/api/consultorias"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/consultorias", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultorias"] });
      toast({ title: "Sucesso", description: "Consultoria criada com sucesso!" });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; consultoria: any }) => {
      return await apiRequest("PUT", `/api/consultorias/${data.id}`, data.consultoria);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultorias"] });
      toast({ title: "Sucesso", description: "Consultoria atualizada com sucesso!" });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/consultorias/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultorias"] });
      toast({ title: "Sucesso", description: "Consultoria excluída com sucesso!" });
    },
  });

  const ConsultoriaForm = ({ isEdit = false, initialData = null, onSubmit }: any) => {
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
            <Label htmlFor="nome">Nome da Consultoria *</Label>
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
            <Label htmlFor="ativo">Consultoria Ativa</Label>
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
            {isEdit ? "Atualizar" : "Criar"} Consultoria
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
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Consultorias/Parceiros</h1>
            <p className="text-slate-600 mt-1">Gerencie as consultorias que vendem e dão suporte aos clientes</p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Consultoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Consultoria</DialogTitle>
            </DialogHeader>
            <ConsultoriaForm onSubmit={(data: any) => createMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Consultorias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultorias?.map((consultoria: Consultoria) => (
                  <TableRow key={consultoria.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{consultoria.nome}</div>
                        {consultoria.razaoSocial && (
                          <div className="text-sm text-slate-500">{consultoria.razaoSocial}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{consultoria.responsavel || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {consultoria.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1" />
                            {consultoria.email}
                          </div>
                        )}
                        {consultoria.whatsapp && (
                          <div className="flex items-center text-sm">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {consultoria.whatsapp}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={consultoria.ativo ? "default" : "secondary"}>
                        {consultoria.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingConsultoria(consultoria);
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
                              Tem certeza que deseja excluir esta consultoria?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(consultoria.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Consultoria</DialogTitle>
          </DialogHeader>
          {editingConsultoria && (
            <ConsultoriaForm
              isEdit={true}
              initialData={editingConsultoria}
              onSubmit={(data: any) => updateMutation.mutate({ id: editingConsultoria.id, consultoria: data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
