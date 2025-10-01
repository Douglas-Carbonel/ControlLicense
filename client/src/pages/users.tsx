
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Users, Shield, Wrench, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  permissionGroupId?: number;
  createdAt: string;
  updatedAt: string;
}

interface NewUser {
  username: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  active: boolean;
  permissionGroupId?: number;
}

interface PermissionGroup {
  id: number;
  name: string;
  description: string;
}

interface FieldPermission {
  id: number;
  tableName: string;
  fieldName: string;
  canView: boolean;
  canEdit: boolean;
}

const LICENSE_FIELDS = [
  { name: 'code', label: 'Código' },
  { name: 'codCliente', label: 'Código Cliente' },
  { name: 'nomeCliente', label: 'Nome Cliente' },
  { name: 'dadosEmpresa', label: 'Dados Empresa' },
  { name: 'hardwareKey', label: 'Hardware Key' },
  { name: 'installNumber', label: 'Install Number' },
  { name: 'systemNumber', label: 'System Number' },
  { name: 'nomeDb', label: 'Nome DB' },
  { name: 'descDb', label: 'Descrição DB' },
  { name: 'endApi', label: 'Endpoint API' },
  { name: 'listaCnpj', label: 'Lista CNPJ', restricted: true },
  { name: 'qtLicencas', label: 'Quantidade Licenças', restricted: true },
  { name: 'qtLicencasAdicionais', label: 'Licenças Adicionais' },
  { name: 'versaoSap', label: 'Versão SAP' },
  { name: 'observacao', label: 'Observação' },
  { name: 'ativo', label: 'Status' },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    username: "",
    email: "",
    name: "",
    role: "support",
    passwordHash: "",
    active: true,
  });

  // Buscar usuários
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: currentUser?.role === "admin",
  });

  // Buscar grupos de permissões
  const { data: permissionGroups } = useQuery({
    queryKey: ["/api/permission-groups"],
    enabled: currentUser?.role === "admin",
  });

  // Buscar permissões de campos para o usuário em edição
  const { data: fieldPermissions } = useQuery({
    queryKey: [`/api/permission-groups/${editingUser?.permissionGroupId}/field-permissions`],
    enabled: !!editingUser?.permissionGroupId,
  });

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar usuário");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      setNewUser({
        username: "",
        email: "",
        name: "",
        role: "support",
        passwordHash: "",
        active: true,
      });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<User> }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar usuário");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir usuário");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar permissão de campo
  const updateFieldPermissionMutation = useMutation({
    mutationFn: async ({ fieldName, permissions }: { fieldName: string; permissions: Partial<FieldPermission> }) => {
      if (!editingUser?.permissionGroupId) return;
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/permission-groups/${editingUser.permissionGroupId}/field-permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tableName: 'licenses', fieldName, ...permissions }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar permissão");
      }

      return response.json();
    },
    onSuccess: () => {
      if (editingUser?.permissionGroupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/permission-groups/${editingUser.permissionGroupId}/field-permissions`] });
      }
      toast({
        title: "Permissão atualizada",
        description: "Permissão de campo atualizada com sucesso!",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.name || !newUser.passwordHash) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.id,
      userData: editingUser,
    });
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const getFieldPermission = (fieldName: string): FieldPermission | undefined => {
    return fieldPermissions?.find((p: FieldPermission) => p.fieldName === fieldName);
  };

  const updateFieldPermission = (fieldName: string, field: keyof FieldPermission, value: boolean) => {
    const current = getFieldPermission(fieldName);
    const permissions = {
      canView: current?.canView ?? true,
      canEdit: current?.canEdit ?? true,
      [field]: value,
    };
    updateFieldPermissionMutation.mutate({ fieldName, permissions });
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <Shield className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge 
        variant={role === "admin" ? "default" : "secondary"} 
        className={`flex items-center gap-1 ${
          role === "admin" 
            ? "bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white" 
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {getRoleIcon(role)}
        {role === "admin" ? "Administrador" : "Técnico"}
      </Badge>
    );
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            Apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerenciar Usuários</h1>
          <p className="text-slate-600 mt-1">
            Administre usuários do sistema e suas permissões
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium shadow-md transition-all duration-200 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border border-[#e0e0e0] shadow-2xl max-w-md">
            <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
              <DialogTitle className="text-xl font-bold text-[#0c151f]">Criar Novo Usuário</DialogTitle>
              <p className="text-sm text-[#3a3a3c] mt-2">Preencha os dados para criar um novo usuário no sistema</p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#0c151f] font-medium">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Digite o nome de usuário"
                  className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#0c151f] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Digite o email"
                  className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#0c151f] font-medium">Nome Completo</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Digite o nome completo"
                  className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#0c151f] font-medium">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.passwordHash}
                  onChange={(e) => setNewUser({ ...newUser, passwordHash: e.target.value })}
                  placeholder="Digite a senha"
                  className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[#0c151f] font-medium">Função</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e0e0e0]">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="support">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="active"
                  checked={newUser.active}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, active: checked })}
                  className="data-[state=checked]:bg-[#0095da]"
                />
                <Label htmlFor="active" className="text-[#0c151f] font-medium">Usuário Ativo</Label>
              </div>
              <div className="flex gap-3 pt-6 border-t border-[#e0e0e0]">
                <Button 
                  onClick={handleCreateUser} 
                  disabled={createUserMutation.isPending}
                  className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium flex-1"
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-[#e0e0e0] text-[#3a3a3c] hover:bg-[#f4f4f4]"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users className="h-5 w-5 text-[#0095da]" />
            Lista de Usuários
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {users?.length || 0} usuários cadastrados no sistema
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-[#0095da] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Carregando usuários...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700 py-4">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Usuário</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Função</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4">Criado em</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: User) => (
                    <TableRow 
                      key={user.id} 
                      className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
                    >
                      <TableCell className="font-medium text-gray-900 py-4">{user.name}</TableCell>
                      <TableCell className="text-gray-700 py-4">{user.username}</TableCell>
                      <TableCell className="text-gray-700 py-4">{user.email}</TableCell>
                      <TableCell className="py-4">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={user.active ? "default" : "destructive"} 
                          className={user.active ? 
                            "bg-green-100 text-green-800 border-green-200" : 
                            "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 py-4">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {currentUser?.id !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição com Tabs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border border-[#e0e0e0] shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
            <DialogTitle className="text-xl font-bold text-[#0c151f]">Editar Usuário</DialogTitle>
            <p className="text-sm text-[#3a3a3c] mt-2">Atualize as informações e permissões do usuário</p>
          </DialogHeader>
          {editingUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="permissions">Permissões de Campos</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username" className="text-[#0c151f] font-medium">Nome de Usuário</Label>
                  <Input
                    id="edit-username"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-[#0c151f] font-medium">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-[#0c151f] font-medium">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="border-[#e0e0e0] focus:border-[#0095da] focus:ring-1 focus:ring-[#0095da]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-[#0c151f] font-medium">Função</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e0e0e0]">
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="support">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-permission-group" className="text-[#0c151f] font-medium">Grupo de Permissões</Label>
                  <Select
                    value={editingUser.permissionGroupId?.toString() || ""}
                    onValueChange={(value) => setEditingUser({ ...editingUser, permissionGroupId: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e0e0e0]">
                      {permissionGroups?.map((group: PermissionGroup) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="edit-active"
                    checked={editingUser.active}
                    onCheckedChange={(checked) => setEditingUser({ ...editingUser, active: checked })}
                    className="data-[state=checked]:bg-[#0095da]"
                  />
                  <Label htmlFor="edit-active" className="text-[#0c151f] font-medium">Usuário Ativo</Label>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="py-4">
                {!editingUser.permissionGroupId ? (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-yellow-700">
                      Selecione um grupo de permissões na aba "Informações" para configurar as permissões de campos.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Configure quais campos da tela de licenças este usuário pode visualizar e editar:
                    </p>
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">Campo</TableHead>
                            <TableHead className="text-center min-w-[120px]">Visualizar</TableHead>
                            <TableHead className="text-center min-w-[120px]">Editar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {LICENSE_FIELDS.map((field) => {
                          const permission = getFieldPermission(field.name);
                          return (
                            <TableRow key={field.name}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{field.label}</span>
                                  {field.restricted && (
                                    <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                      Restrito
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canView ?? true}
                                  onCheckedChange={(checked) => updateFieldPermission(field.name, 'canView', checked)}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canEdit ?? !field.restricted}
                                  onCheckedChange={(checked) => updateFieldPermission(field.name, 'canEdit', checked)}
                                  disabled={!permission?.canView}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              <div className="flex gap-3 pt-6 border-t border-[#e0e0e0]">
                <Button 
                  onClick={handleUpdateUser} 
                  disabled={updateUserMutation.isPending}
                  className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium flex-1"
                >
                  {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-[#e0e0e0] text-[#3a3a3c] hover:bg-[#f4f4f4]"
                >
                  Cancelar
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
