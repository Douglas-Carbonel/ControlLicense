
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
import { Plus, Edit, Trash2, Users, Shield, Wrench, Building2, UserCog } from "lucide-react";
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
  tipoUsuario?: string | null;
  representanteId?: number | null;
  clienteId?: string | null;
  setor?: string | null;
  nivel?: string | null;
}

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
    tipoUsuario: null,
    representanteId: null,
    clienteId: null,
    setor: null,
    nivel: null,
  });

  // Buscar usuários
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: currentUser?.role === "admin",
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
        tipoUsuario: null,
        representanteId: null,
        clienteId: null,
        setor: null,
        nivel: null,
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

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <Shield className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;
  };

  const getRoleBadge = (user: User) => {
    let label = "";
    let colorClass = "";
    let icon = null;

    if (user.role === "admin") {
      label = "Administrador";
      colorClass = "bg-gradient-to-r from-[#0095da] to-[#313d5a] text-white";
      icon = <Shield className="h-4 w-4" />;
    } else if (user.role === "interno") {
      const setorLabels: Record<string, string> = {
        'desenvolvimento': 'Desenvolvimento',
        'suporte': 'Suporte',
        'implantacao': 'Implantação',
        'comercial': 'Comercial'
      };
      const nivelLabels: Record<string, string> = {
        'analista_n1': 'N1',
        'analista_n2': 'N2',
        'analista_n3': 'N3',
        'gerente': 'Gerente',
        'dev_web': 'Web',
        'dev_app': 'App',
        'analista': 'Analista'
      };
      label = `${setorLabels[user.setor || ''] || ''} ${nivelLabels[user.nivel || ''] || ''}`.trim();
      colorClass = "bg-blue-100 text-blue-800 border-blue-200";
      icon = <UserCog className="h-4 w-4" />;
    } else if (user.role === "representante") {
      label = `Representante ${user.tipoUsuario === 'gerente' ? '(Gerente)' : '(Analista)'}`;
      colorClass = "bg-purple-100 text-purple-800 border-purple-200";
      icon = <Building2 className="h-4 w-4" />;
    } else if (user.role === "cliente_final") {
      label = `Cliente ${user.tipoUsuario === 'gerente' ? '(Gerente)' : '(Analista)'}`;
      colorClass = "bg-green-100 text-green-800 border-green-200";
      icon = <Users className="h-4 w-4" />;
    } else {
      label = "Técnico";
      colorClass = "bg-gray-100 text-gray-700";
      icon = <Wrench className="h-4 w-4" />;
    }

    return (
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${colorClass}`}
      >
        {icon}
        {label}
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
                <Label htmlFor="role" className="text-[#0c151f] font-medium">Tipo de Usuário</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ 
                    ...newUser, 
                    role: value,
                    setor: null,
                    nivel: null,
                    tipoUsuario: null,
                    representanteId: null,
                    clienteId: null
                  })}
                >
                  <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e0e0e0]">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="interno">Usuário Interno</SelectItem>
                    <SelectItem value="representante">Representante</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos para Usuário Interno */}
              {newUser.role === 'interno' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="setor" className="text-[#0c151f] font-medium">Setor</Label>
                    <Select
                      value={newUser.setor || ''}
                      onValueChange={(value) => setNewUser({ ...newUser, setor: value, nivel: null })}
                    >
                      <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e0e0e0]">
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="implantacao">Implantação</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newUser.setor && (
                    <div className="space-y-2">
                      <Label htmlFor="nivel" className="text-[#0c151f] font-medium">Nível/Cargo</Label>
                      <Select
                        value={newUser.nivel || ''}
                        onValueChange={(value) => setNewUser({ ...newUser, nivel: value })}
                      >
                        <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#e0e0e0]">
                          {newUser.setor === 'suporte' && (
                            <>
                              <SelectItem value="analista_n1">Analista N1</SelectItem>
                              <SelectItem value="analista_n2">Analista N2</SelectItem>
                              <SelectItem value="analista_n3">Analista N3</SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                            </>
                          )}
                          {newUser.setor === 'desenvolvimento' && (
                            <>
                              <SelectItem value="dev_web">Desenvolvedor Web</SelectItem>
                              <SelectItem value="dev_app">Desenvolvedor App</SelectItem>
                            </>
                          )}
                          {(newUser.setor === 'implantacao' || newUser.setor === 'comercial') && (
                            <>
                              <SelectItem value="analista">Analista</SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* Campos para Representante/Cliente */}
              {(newUser.role === 'representante' || newUser.role === 'cliente_final') && (
                <div className="space-y-2">
                  <Label htmlFor="tipoUsuario" className="text-[#0c151f] font-medium">Tipo de Acesso</Label>
                  <Select
                    value={newUser.tipoUsuario || ''}
                    onValueChange={(value) => setNewUser({ ...newUser, tipoUsuario: value })}
                  >
                    <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e0e0e0]">
                      <SelectItem value="gerente">Gerente (vê todos)</SelectItem>
                      <SelectItem value="analista">Analista (vê apenas seus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                      <TableCell className="py-4">{getRoleBadge(user)}</TableCell>
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

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border border-[#e0e0e0] shadow-2xl max-w-md">
          <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
            <DialogTitle className="text-xl font-bold text-[#0c151f]">Editar Usuário</DialogTitle>
            <p className="text-sm text-[#3a3a3c] mt-2">Atualize as informações do usuário</p>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
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
                <Label htmlFor="edit-role" className="text-[#0c151f] font-medium">Tipo de Usuário</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ 
                    ...editingUser, 
                    role: value,
                    setor: value === 'interno' ? editingUser.setor : null,
                    nivel: value === 'interno' ? editingUser.nivel : null,
                    tipoUsuario: (value === 'representante' || value === 'cliente_final') ? editingUser.tipoUsuario : null,
                    representanteId: value === 'representante' ? editingUser.representanteId : null,
                    clienteId: value === 'cliente_final' ? editingUser.clienteId : null
                  })}
                >
                  <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e0e0e0]">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="interno">Usuário Interno</SelectItem>
                    <SelectItem value="representante">Representante</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                    <SelectItem value="support">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos para Usuário Interno */}
              {editingUser.role === 'interno' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-setor" className="text-[#0c151f] font-medium">Setor</Label>
                    <Select
                      value={editingUser.setor || ''}
                      onValueChange={(value) => setEditingUser({ ...editingUser, setor: value, nivel: null })}
                    >
                      <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e0e0e0]">
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="implantacao">Implantação</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editingUser.setor && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-nivel" className="text-[#0c151f] font-medium">Nível/Cargo</Label>
                      <Select
                        value={editingUser.nivel || ''}
                        onValueChange={(value) => setEditingUser({ ...editingUser, nivel: value })}
                      >
                        <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#e0e0e0]">
                          {editingUser.setor === 'suporte' && (
                            <>
                              <SelectItem value="analista_n1">Analista N1</SelectItem>
                              <SelectItem value="analista_n2">Analista N2</SelectItem>
                              <SelectItem value="analista_n3">Analista N3</SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                            </>
                          )}
                          {editingUser.setor === 'desenvolvimento' && (
                            <>
                              <SelectItem value="dev_web">Desenvolvedor Web</SelectItem>
                              <SelectItem value="dev_app">Desenvolvedor App</SelectItem>
                            </>
                          )}
                          {(editingUser.setor === 'implantacao' || editingUser.setor === 'comercial') && (
                            <>
                              <SelectItem value="analista">Analista</SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* Campos para Representante/Cliente */}
              {(editingUser.role === 'representante' || editingUser.role === 'cliente_final') && (
                <div className="space-y-2">
                  <Label htmlFor="edit-tipoUsuario" className="text-[#0c151f] font-medium">Tipo de Acesso</Label>
                  <Select
                    value={editingUser.tipoUsuario || ''}
                    onValueChange={(value) => setEditingUser({ ...editingUser, tipoUsuario: value })}
                  >
                    <SelectTrigger className="border-[#e0e0e0] focus:border-[#0095da]">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e0e0e0]">
                      <SelectItem value="gerente">Gerente (vê todos)</SelectItem>
                      <SelectItem value="analista">Analista (vê apenas seus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}</old_str>
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="edit-active"
                  checked={editingUser.active}
                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, active: checked })}
                  className="data-[state=checked]:bg-[#0095da]"
                />
                <Label htmlFor="edit-active" className="text-[#0c151f] font-medium">Usuário Ativo</Label>
              </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
