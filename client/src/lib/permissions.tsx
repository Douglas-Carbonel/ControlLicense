
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth';
import { apiRequest } from './queryClient';

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

interface PermissionsContextType {
  menuPermissions: MenuPermission[];
  fieldPermissions: FieldPermission[];
  canAccessMenu: (menuId: string) => boolean;
  canCreateIn: (menuId: string) => boolean;
  canEditIn: (menuId: string) => boolean;
  canDeleteIn: (menuId: string) => boolean;
  canExportFrom: (menuId: string) => boolean;
  canViewField: (tableName: string, fieldName: string) => boolean;
  canEditField: (tableName: string, fieldName: string) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([]);
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermission[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPermissions = async () => {
    if (!user) {
      setMenuPermissions([]);
      setFieldPermissions([]);
      return;
    }

    // Admins têm acesso total
    if (user.role === 'admin') {
      setMenuPermissions([
        { id: 0, menuId: 'dashboard', canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
        { id: 0, menuId: 'licenses', canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
        { id: 0, menuId: 'users', canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
        { id: 0, menuId: 'activities', canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
        { id: 0, menuId: 'mensagens', canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
        { id: 0, menuId: 'clientes', canAccess: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
      ]);
      setFieldPermissions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('GET', `/api/users/${user.id}/permissions?table=licenses`);
      setMenuPermissions(response.menuPermissions || []);
      setFieldPermissions(response.fieldPermissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Permissões padrão para usuários técnicos
      setMenuPermissions([
        { id: 0, menuId: 'licenses', canAccess: true, canCreate: true, canEdit: true, canDelete: false, canExport: false },
      ]);
      setFieldPermissions([
        { id: 0, tableName: 'licenses', fieldName: 'listaCnpj', canView: true, canEdit: false },
        { id: 0, tableName: 'licenses', fieldName: 'qtLicencas', canView: true, canEdit: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, [user]);

  const canAccessMenu = (menuId: string): boolean => {
    if (user?.role === 'admin') return true;
    const permission = menuPermissions.find(p => p.menuId === menuId);
    return permission?.canAccess ?? false;
  };

  const canCreateIn = (menuId: string): boolean => {
    if (user?.role === 'admin') return true;
    const permission = menuPermissions.find(p => p.menuId === menuId);
    return permission?.canCreate ?? false;
  };

  const canEditIn = (menuId: string): boolean => {
    if (user?.role === 'admin') return true;
    const permission = menuPermissions.find(p => p.menuId === menuId);
    return permission?.canEdit ?? false;
  };

  const canDeleteIn = (menuId: string): boolean => {
    if (user?.role === 'admin') return true;
    const permission = menuPermissions.find(p => p.menuId === menuId);
    return permission?.canDelete ?? false;
  };

  const canExportFrom = (menuId: string): boolean => {
    if (user?.role === 'admin') return true;
    const permission = menuPermissions.find(p => p.menuId === menuId);
    return permission?.canExport ?? false;
  };

  const canViewField = (tableName: string, fieldName: string): boolean => {
    if (user?.role === 'admin') return true;
    const permission = fieldPermissions.find(p => p.tableName === tableName && p.fieldName === fieldName);
    return permission?.canView ?? true; // Padrão: pode ver
  };

  const canEditField = (tableName: string, fieldName: string): boolean => {
    if (user?.role === 'admin') return true;
    
    // Campos restritos por padrão para usuários técnicos
    if ((fieldName === 'listaCnpj' || fieldName === 'qtLicencas') && user?.role === 'support') {
      const permission = fieldPermissions.find(p => p.tableName === tableName && p.fieldName === fieldName);
      return permission?.canEdit ?? false; // Padrão: não pode editar CNPJ e quantidade
    }
    
    const permission = fieldPermissions.find(p => p.tableName === tableName && p.fieldName === fieldName);
    return permission?.canEdit ?? true; // Padrão: pode editar outros campos
  };

  return (
    <PermissionsContext.Provider value={{
      menuPermissions,
      fieldPermissions,
      canAccessMenu,
      canCreateIn,
      canEditIn,
      canDeleteIn,
      canExportFrom,
      canViewField,
      canEditField,
      loading,
      refreshPermissions
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
