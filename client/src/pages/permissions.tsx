
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Shield, Settings, Users, FileText, MessageSquare, Building2, Activity, Home } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PermissionGroup {
  id: number;
  name: string;
  description: string;
  isDefault: boolean;
}

interface MenuPermission {
  id: number;
  menuId: string;
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface FieldPermission {
  id: number;
  tableName: string;
  fieldName: string;
  canView: boolean;
  canEdit: boolean;
}

const AVAILABLE_MENUS = [
  { id: 'dashboard', label: 'Painel', icon: Home },
  { id: 'licenses', label: 'Licenças', icon: FileText },
  { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
  { id: 'clientes', label: 'Clientes', icon: Building2 },
  { id: 'activities', label: 'Logs', icon: Activity },
  { id: 'users', label: 'Usuários', icon: Users },
];

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

export default function PermissionsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", isDefault: false });

  // Buscar grupos de permissões
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["/api/permission-groups"],
    enabled: currentUser?.role === "admin",
  });

  // Buscar permissões de menu para o grupo selecionado
  const { data: menuPermissions } = useQuery({
    queryKey: [`/api/permission-groups/${selectedGroup?.id}/menu-permissions`],
    enabled: !!selectedGroup?.id,
  });

  // Buscar permissões de campos para o grupo selecionado
  const { data: fieldPermissions } = useQuery({
    queryKey: [`/api/permission-groups/${selectedGroup?.id}/field-permissions`],
    enabled: !!selectedGroup?.id,
  });

  // Criar grupo
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroup) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/permission-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar grupo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permission-groups"] });
      setIsCreateDialogOpen(false);
      setNewGroup({ name: "", description: "", isDefault: false });
      toast({
        title: "Sucesso",
        description: "Grupo de permissões criado com sucesso!",
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

  // Atualizar permissão de menu
  const updateMenuPermissionMutation = useMutation({
    mutationFn: async ({ menuId, permissions }: { menuId: string; permissions: Partial<MenuPermission> }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/permission-groups/${selectedGroup!.id}/menu-permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuId, ...permissions }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar permissão");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/permission-groups/${selectedGroup?.id}/menu-permissions`] });
      toast({
        title: "Permissão atualizada",
        description: "Permissão de menu atualizada com sucesso!",
      });
    },
  });

  // Atualizar permissão de campo
  const updateFieldPermissionMutation = useMutation({
    mutationFn: async ({ fieldName, permissions }: { fieldName: string; permissions: Partial<FieldPermission> }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/permission-groups/${selectedGroup!.id}/field-permissions`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/permission-groups/${selectedGroup?.id}/field-permissions`] });
      toast({
        title: "Permissão atualizada",
        description: "Permissão de campo atualizada com sucesso!",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(newGroup);
  };

  const getMenuPermission = (menuId: string): MenuPermission | undefined => {
    return menuPermissions?.find((p: MenuPermission) => p.menuId === menuId);
  };

  const getFieldPermission = (fieldName: string): FieldPermission | undefined => {
    return fieldPermissions?.find((p: FieldPermission) => p.fieldName === fieldName);
  };

  const updateMenuPermission = (menuId: string, field: keyof MenuPermission, value: boolean) => {
    const current = getMenuPermission(menuId);
    const permissions = {
      canAccess: current?.canAccess ?? false,
      canCreate: current?.canCreate ?? false,
      canEdit: current?.canEdit ?? false,
      canDelete: current?.canDelete ?? false,
      canExport: current?.canExport ?? false,
      [field]: value,
    };
    updateMenuPermissionMutation.mutate({ menuId, permissions });
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
          <h1 className="text-2xl font-bold text-slate-800">Gerenciar Permissões</h1>
          <p className="text-slate-600 mt-1">
            Configure grupos de permissões e controle o acesso a menus e campos
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium shadow-md transition-all duration-200 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border border-[#e0e0e0] shadow-2xl max-w-md">
            <DialogHeader className="pb-4 border-b border-[#e0e0e0]">
              <DialogTitle className="text-xl font-bold text-[#0c151f]">Criar Grupo de Permissões</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Nome do Grupo</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Ex: Técnicos, Supervisores..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Descrição</Label>
                <Input
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Descrição do grupo..."
                />
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="is-default"
                  checked={newGroup.isDefault}
                  onCheckedChange={(checked) => setNewGroup({ ...newGroup, isDefault: checked })}
                />
                <Label htmlFor="is-default">Grupo Padrão</Label>
              </div>
              <div className="flex gap-3 pt-6 border-t border-[#e0e0e0]">
                <Button 
                  onClick={handleCreateGroup} 
                  disabled={createGroupMutation.isPending}
                  className="bg-gradient-to-r from-[#0095da] to-[#313d5a] hover:from-[#007ab8] hover:to-[#2a3349] text-white font-medium flex-1"
                >
                  {createGroupMutation.isPending ? "Criando..." : "Criar Grupo"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Grupos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Grupos de Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingGroups ? (
              <div className="p-6 text-center">Carregando...</div>
            ) : (
              <div className="space-y-1 p-4">
                {groups?.map((group: PermissionGroup) => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{group.name}</h3>
                        {group.description && (
                          <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                        )}
                      </div>
                      {group.isDefault && (
                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuração de Permissões */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {selectedGroup ? `Permissões: ${selectedGroup.name}` : 'Selecione um Grupo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <div className="text-center py-8 text-gray-500">
                Selecione um grupo de permissões para configurar
              </div>
            ) : (
              <Tabs defaultValue="menus" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="menus">Permissões de Menu</TabsTrigger>
                  <TabsTrigger value="fields">Permissões de Campos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="menus" className="mt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Configure quais menus e ações este grupo pode acessar:
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Menu</TableHead>
                          <TableHead className="text-center">Acessar</TableHead>
                          <TableHead className="text-center">Criar</TableHead>
                          <TableHead className="text-center">Editar</TableHead>
                          <TableHead className="text-center">Excluir</TableHead>
                          <TableHead className="text-center">Exportar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {AVAILABLE_MENUS.map((menu) => {
                          const permission = getMenuPermission(menu.id);
                          const Icon = menu.icon;
                          return (
                            <TableRow key={menu.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-gray-500" />
                                  {menu.label}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canAccess ?? false}
                                  onCheckedChange={(checked) => updateMenuPermission(menu.id, 'canAccess', checked)}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canCreate ?? false}
                                  onCheckedChange={(checked) => updateMenuPermission(menu.id, 'canCreate', checked)}
                                  disabled={!permission?.canAccess}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canEdit ?? false}
                                  onCheckedChange={(checked) => updateMenuPermission(menu.id, 'canEdit', checked)}
                                  disabled={!permission?.canAccess}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canDelete ?? false}
                                  onCheckedChange={(checked) => updateMenuPermission(menu.id, 'canDelete', checked)}
                                  disabled={!permission?.canAccess}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={permission?.canExport ?? false}
                                  onCheckedChange={(checked) => updateMenuPermission(menu.id, 'canExport', checked)}
                                  disabled={!permission?.canAccess}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="fields" className="mt-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Configure quais campos da tela de licenças este grupo pode visualizar e editar:
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campo</TableHead>
                          <TableHead className="text-center">Visualizar</TableHead>
                          <TableHead className="text-center">Editar</TableHead>
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
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
