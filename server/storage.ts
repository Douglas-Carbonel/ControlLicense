import dotenv from "dotenv";
// Carrega variáveis do arquivo .env
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { licenses, users, activities, mensagemSistema, clienteHistorico, permissionGroups, menuPermissions, fieldPermissions, type InsertLicense, type InsertUser, type InsertActivity, type InsertMensagemSistema, type InsertClienteHistorico, type License, type User, type Activity, type MensagemSistema, type ClienteHistorico, type HardwareLicenseQuery, type PermissionGroup, type InsertPermissionGroup, type MenuPermission, type InsertMenuPermission, type FieldPermission, type InsertFieldPermission } from "@shared/schema";
import { eq, ilike, or, desc, and, sql, asc, count, isNull, not } from "drizzle-orm";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // License operations
  getLicenses(): Promise<License[]>;
  getPaginatedLicenses(offset: number, limit: number, search?: string): Promise<License[]>;
  getLicensesCount(search?: string): Promise<number>;
  getLicense(id: number): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, license: Partial<InsertLicense>): Promise<License>;
  deleteLicense(id: number): Promise<void>;

  // Hardware license query
  getLicensesByHardware(query: HardwareLicenseQuery): Promise<License[]>;

  // License statistics
  getLicenseStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    uniqueClients: number;
  }>;

  // Activity operations
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getUnreadActivityCount(userId: string): Promise<number>;
  markActivitiesAsRead(userId: string): Promise<void>;

  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Permission operations
  getPermissionGroups(): Promise<PermissionGroup[]>;
  getPermissionGroup(id: number): Promise<PermissionGroup | undefined>;
  createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup>;
  updatePermissionGroup(id: number, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup>;
  deletePermissionGroup(id: number): Promise<void>;

  // Menu permissions
  getMenuPermissions(groupId: number): Promise<MenuPermission[]>;
  setMenuPermission(permission: InsertMenuPermission): Promise<MenuPermission>;
  getUserMenuPermissions(userId: number): Promise<MenuPermission[]>;

  // Field permissions
  getFieldPermissions(groupId: number): Promise<FieldPermission[]>;
  setFieldPermission(permission: InsertFieldPermission): Promise<FieldPermission>;
  getUserFieldPermissions(userId: number, tableName: string): Promise<FieldPermission[]>;

  // Mensagem Sistema operations
  getMensagens(): Promise<any>;
  getMensagem(id: number): Promise<any>;
  createMensagem(data: InsertMensagemSistema): Promise<any>;
  updateMensagem(id: number, data: Partial<InsertMensagemSistema>): Promise<any>;
  deleteMensagem(id: number): Promise<void>;
  getMensagensByHardwareKey(hardwareKey: string): Promise<any>;

  // Cliente Histórico operations
  getClienteHistorico(codigoCliente?: string): Promise<ClienteHistorico[]>;
  getClienteHistoricoById(id: number): Promise<ClienteHistorico | undefined>;
  createClienteHistorico(data: InsertClienteHistorico): Promise<ClienteHistorico>;
  updateClienteHistorico(id: number, data: Partial<InsertClienteHistorico>): Promise<ClienteHistorico>;
  deleteClienteHistorico(id: number): Promise<void>;
  getClientesList(): Promise<{code: string, nomeCliente: string}[]>;
  getAmbientesByCliente(codigoCliente: string): Promise<string[]>;
}

export class DbStorage implements IStorage {
  private lastSeenActivityAt: Map<string, Date> = new Map();

  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.id));
  }

  async getPaginatedLicenses(offset: number, limit: number, search?: string): Promise<License[]> {
    const conditions = search ? this.buildSearchConditions(search) : [];
    
    let query = db.select().from(licenses);
    
    if (conditions.length > 0) {
      query = query.where(or(...conditions)) as any;
    }

    const result = await query
      .orderBy(desc(licenses.id))
      .offset(offset)
      .limit(limit);

    return result;
  }

  async getLicensesCount(search?: string): Promise<number> {
    const conditions = search ? this.buildSearchConditions(search) : [];
    
    let query = db.select({ count: count() }).from(licenses);
    
    if (conditions.length > 0) {
      query = query.where(or(...conditions)) as any;
    }

    const result = await query;
    return result[0].count;
  }

  private buildSearchConditions(search: string): any[] {
    const conditions: any[] = [];
    const parts = search.trim().split(' ');

    for (const part of parts) {
      if (part.includes(':')) {
        // Filtro específico de coluna (formato: coluna:valor)
        const [column, value] = part.split(':');
        if (value) {
          switch (column) {
            case 'codCliente':
              conditions.push(ilike(licenses.codCliente, `%${value}%`));
              break;
            case 'nomeCliente':
              conditions.push(ilike(licenses.nomeCliente, `%${value}%`));
              break;
            case 'code':
              conditions.push(ilike(licenses.code, `%${value}%`));
              break;
            case 'hardwareKey':
              conditions.push(ilike(licenses.hardwareKey, `%${value}%`));
              break;
            case 'ativo':
              const isActive = value.toLowerCase() === 'ativo' || value.toLowerCase() === 'true';
              conditions.push(eq(licenses.ativo, isActive));
              break;
            case 'qtLicencas':
              const numLic = parseInt(value);
              if (!isNaN(numLic)) {
                conditions.push(eq(licenses.qtLicencas, numLic));
              }
              break;
            case 'qtLicencasAdicionais':
              const numAd = parseInt(value);
              if (!isNaN(numAd)) {
                conditions.push(eq(licenses.qtLicencasAdicionais, numAd));
              }
              break;
            default:
              // Para outras colunas, buscar como texto - ignorar campos dinâmicos
              break;
          }
        }
      } else {
        // Busca global em múltiplas colunas
        conditions.push(
          or(
            ilike(licenses.nomeCliente, `%${part}%`),
            ilike(licenses.codCliente, `%${part}%`),
            ilike(licenses.code, `%${part}%`),
            ilike(licenses.hardwareKey, `%${part}%`),
            ilike(licenses.dadosEmpresa, `%${part}%`),
            ilike(licenses.listaCnpj, `%${part}%`)
          )
        );
      }
    }

    return conditions;
  }

  async getLicense(id: number): Promise<License | undefined> {
    const result = await db.select().from(licenses).where(eq(licenses.id, id));
    return result[0];
  }

  async createLicense(license: InsertLicense): Promise<License> {
    // Buscar o maior valor de linha existente e incrementar
    const maxLinha = await db
      .select({ maxLinha: sql<number>`MAX(${licenses.linha})` })
      .from(licenses);
    
    const nextLinha = (maxLinha[0]?.maxLinha || 0) + 1;
    
    // Adicionar o campo linha automaticamente
    const licenseWithLinha = {
      ...license,
      linha: nextLinha
    };
    
    const result = await db.insert(licenses).values(licenseWithLinha).returning();
    return result[0];
  }

  async updateLicense(id: number, license: Partial<InsertLicense>): Promise<License> {
    const result = await db
      .update(licenses)
      .set(license)
      .where(eq(licenses.id, id))
      .returning();
    return result[0];
  }

  async deleteLicense(id: number): Promise<void> {
    await db.delete(licenses).where(eq(licenses.id, id));
  }

  async getLicensesByHardware(query: HardwareLicenseQuery): Promise<License[]> {
    return await db
      .select({
        id: licenses.id,
        code: licenses.code,
        linha: licenses.linha,
        ativo: licenses.ativo,
        codCliente: licenses.codCliente,
        nomeCliente: licenses.nomeCliente,
        dadosEmpresa: licenses.dadosEmpresa,
        hardwareKey: licenses.hardwareKey,
        installNumber: licenses.installNumber,
        systemNumber: licenses.systemNumber,
        nomeDb: licenses.nomeDb,
        descDb: licenses.descDb,
        endApi: licenses.endApi,
        listaCnpj: licenses.listaCnpj,
        qtLicencas: licenses.qtLicencas,
        qtLicencasAdicionais: licenses.qtLicencasAdicionais,
        versaoSap: licenses.versaoSap,
        observacao: licenses.observacao,
        modulo1: licenses.modulo1,
        modulo2: licenses.modulo2,
        modulo3: licenses.modulo3,
        modulo4: licenses.modulo4,
        modulo5: licenses.modulo5,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
      })
      .from(licenses)
      .where(
        and(
          eq(licenses.hardwareKey, query.hardwareKey),
          eq(licenses.systemNumber, query.systemNumber),
          eq(licenses.installNumber, query.installNumber),
          eq(licenses.nomeDb, query.database),
          eq(licenses.ativo, true) // Apenas licenças ativas
        )
      )
      .orderBy(desc(licenses.id));
  }

  async getLicenseStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    uniqueClients: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(licenses);
    const [activeResult] = await db
      .select({ count: count() })
      .from(licenses)
      .where(eq(licenses.ativo, true));
    const [inactiveResult] = await db
      .select({ count: count() })
      .from(licenses)
      .where(eq(licenses.ativo, false));

    // Count unique client codes
    const uniqueClientCodes = await db.selectDistinct({
      code: licenses.code
    }).from(licenses);

    return {
      total: totalResult.count,
      active: activeResult.count,
      inactive: inactiveResult.count,
      uniqueClients: uniqueClientCodes.length,
    };
  }

  async getActivities(limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
    return result[0];
  }

  async getUnreadActivityCount(userId: string): Promise<number> {
    const lastSeen = this.lastSeenActivityAt.get(userId);
    
    console.log(`[UNREAD] Checking unread count for user ${userId}, lastSeen:`, lastSeen);
    
    if (!lastSeen) {
      const [result] = await db.select({ count: count() }).from(activities);
      console.log(`[UNREAD] No lastSeen for user ${userId}, total activities: ${result.count}`);
      return result.count;
    }

    const [result] = await db
      .select({ count: count() })
      .from(activities)
      .where(sql`${activities.timestamp} > ${lastSeen.toISOString()}`);
    
    console.log(`[UNREAD] User ${userId} has ${result.count} unread activities (since ${lastSeen.toISOString()})`);
    return result.count;
  }

  async markActivitiesAsRead(userId: string): Promise<void> {
    const now = new Date();
    this.lastSeenActivityAt.set(userId, now);
    console.log(`[MARK_READ] User ${userId} marked activities as read at ${now.toISOString()}`);
  }

  // Métodos para usuários
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(data: InsertUser): Promise<User> {
    const created = await db
      .insert(users)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created[0];
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const updated = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated[0]) {
      throw new Error("User not found");
    }

    return updated[0];
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Métodos de grupos de permissões
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    return await db.select().from(permissionGroups).orderBy(permissionGroups.name);
  }

  async getPermissionGroup(id: number): Promise<PermissionGroup | undefined> {
    const result = await db.select().from(permissionGroups).where(eq(permissionGroups.id, id));
    return result[0];
  }

  async createPermissionGroup(group: InsertPermissionGroup): Promise<PermissionGroup> {
    const result = await db.insert(permissionGroups).values(group).returning();
    return result[0];
  }

  async updatePermissionGroup(id: number, group: Partial<InsertPermissionGroup>): Promise<PermissionGroup> {
    const result = await db
      .update(permissionGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(permissionGroups.id, id))
      .returning();
    return result[0];
  }

  async deletePermissionGroup(id: number): Promise<void> {
    await db.delete(permissionGroups).where(eq(permissionGroups.id, id));
  }

  // Métodos de permissões de menu
  async getMenuPermissions(groupId: number): Promise<MenuPermission[]> {
    return await db
      .select()
      .from(menuPermissions)
      .where(eq(menuPermissions.permissionGroupId, groupId));
  }

  async setMenuPermission(permission: InsertMenuPermission): Promise<MenuPermission> {
    const existing = await db
      .select()
      .from(menuPermissions)
      .where(
        and(
          eq(menuPermissions.permissionGroupId, permission.permissionGroupId),
          eq(menuPermissions.menuId, permission.menuId)
        )
      );

    if (existing.length > 0) {
      const result = await db
        .update(menuPermissions)
        .set(permission)
        .where(eq(menuPermissions.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(menuPermissions).values(permission).returning();
      return result[0];
    }
  }

  async getUserMenuPermissions(userId: number): Promise<MenuPermission[]> {
    const user = await this.getUser(userId);
    if (!user || !user.permissionGroupId) {
      return [];
    }

    return await this.getMenuPermissions(user.permissionGroupId);
  }

  // Métodos de permissões de campos
  async getFieldPermissions(groupId: number): Promise<FieldPermission[]> {
    return await db
      .select()
      .from(fieldPermissions)
      .where(eq(fieldPermissions.permissionGroupId, groupId));
  }

  async setFieldPermission(permission: InsertFieldPermission): Promise<FieldPermission> {
    const existing = await db
      .select()
      .from(fieldPermissions)
      .where(
        and(
          eq(fieldPermissions.permissionGroupId, permission.permissionGroupId),
          eq(fieldPermissions.tableName, permission.tableName),
          eq(fieldPermissions.fieldName, permission.fieldName)
        )
      );

    if (existing.length > 0) {
      const result = await db
        .update(fieldPermissions)
        .set(permission)
        .where(eq(fieldPermissions.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(fieldPermissions).values(permission).returning();
      return result[0];
    }
  }

  async getUserFieldPermissions(userId: number, tableName: string): Promise<FieldPermission[]> {
    const user = await this.getUser(userId);
    if (!user || !user.permissionGroupId) {
      return [];
    }

    return await db
      .select()
      .from(fieldPermissions)
      .where(
        and(
          eq(fieldPermissions.permissionGroupId, user.permissionGroupId),
          eq(fieldPermissions.tableName, tableName)
        )
      );
  }

  // Mensagem Sistema methods
  async getMensagens() {
    return await db
      .select()
      .from(mensagemSistema)
      .orderBy(desc(mensagemSistema.createdAt));
  }

  async getMensagem(id: number) {
    const result = await db
      .select()
      .from(mensagemSistema)
      .where(eq(mensagemSistema.id, id))
      .limit(1);
    return result[0];
  }

  async createMensagem(data: InsertMensagemSistema) {
    const result = await db
      .insert(mensagemSistema)
      .values(data)
      .returning();
    return result[0];
  }

  async updateMensagem(id: number, data: Partial<InsertMensagemSistema>) {
    const result = await db
      .update(mensagemSistema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mensagemSistema.id, id))
      .returning();
    return result[0];
  }

  async deleteMensagem(id: number) {
    await db
      .delete(mensagemSistema)
      .where(eq(mensagemSistema.id, id));
  }

  async getMensagensByHardwareKey(hardwareKey: string) {
    return await db
      .select()
      .from(mensagemSistema)
      .where(eq(mensagemSistema.hardwareKey, hardwareKey))
      .orderBy(desc(mensagemSistema.createdAt));
  }

  async getMensagemByBaseAndHardware(base: string, hardwareKey: string) {
    const result = await db
      .select()
      .from(mensagemSistema)
      .where(and(
        eq(mensagemSistema.base, base),
        eq(mensagemSistema.hardwareKey, hardwareKey)
      ))
      .orderBy(desc(mensagemSistema.createdAt))
      .limit(1);

    return result[0];
  }
    // Função para buscar mensagens com dados da licença relacionada
    async getMensagensWithLicense() {
        try {
            const result = await db
                .select({
                    id: mensagemSistema.id,
                    mensagem: mensagemSistema.mensagem,
                    base: mensagemSistema.base,
                    emailUsuario: mensagemSistema.emailUsuario,
                    dataValidade: mensagemSistema.dataValidade,
                    hardwareKey: mensagemSistema.hardwareKey,
                    createdAt: mensagemSistema.createdAt,
                    updatedAt: mensagemSistema.updatedAt,
                    // Dados da licença relacionada
                    licenseId: licenses.id,
                    code: licenses.code,
                    linha: licenses.linha,
                    nomeCliente: licenses.nomeCliente,
                    ativo: licenses.ativo,
                })
                .from(mensagemSistema)
                .leftJoin(
                    licenses,
                    and(
                        eq(mensagemSistema.base, licenses.nomeDb),
                        eq(mensagemSistema.hardwareKey, licenses.hardwareKey)
                    )
                )
                .orderBy(desc(mensagemSistema.createdAt));

            return result;
        } catch (error) {
            console.error("Erro ao buscar mensagens com licenças:", error);
            throw error;
        }
    }

    // Função para validar se base e hardware_key existem em licenses
    async validateMensagemLicenseReference(base: string, hardwareKey: string): Promise<boolean> {
        try {
            const result = await db
                .select({ id: licenses.id })
                .from(licenses)
                .where(and(eq(licenses.nomeDb, base), eq(licenses.hardwareKey, hardwareKey)))
                .limit(1);

            return result.length > 0;
        } catch (error) {
            console.error("Erro ao validar referência de licença:", error);
            return false;
        }
    }

    // Função para buscar todas as bases disponíveis nas licenças
    async getAvailableBases(): Promise<string[]> {
        try {
            console.log("Fetching available bases...");
            const result = await db
                .selectDistinct({ nomeDb: licenses.nomeDb })
                .from(licenses)
                .where(and(
                    not(isNull(licenses.nomeDb)), 
                    eq(licenses.ativo, true)
                ))
                .orderBy(asc(licenses.nomeDb));

            console.log("Raw bases result:", result);
            const bases = result.map(row => row.nomeDb).filter(Boolean) as string[];
            console.log("Filtered bases:", bases);
            return bases;
        } catch (error) {
            console.error("Erro ao buscar bases disponíveis:", error);
            throw error; // Re-throw to see the actual error
        }
    }

    // Função para buscar hardware keys por base
    async getHardwareKeysByBase(base: string): Promise<string[]> {
        try {
            console.log("Fetching hardware keys for base:", base);
            const result = await db
                .selectDistinct({ hardwareKey: licenses.hardwareKey })
                .from(licenses)
                .where(and(
                    eq(licenses.nomeDb, base),
                    not(isNull(licenses.hardwareKey)),
                    eq(licenses.ativo, true)
                ))
                .orderBy(asc(licenses.hardwareKey));

            console.log("Raw hardware keys result:", result);
            const keys = result.map(row => row.hardwareKey).filter(Boolean) as string[];
            console.log("Filtered hardware keys:", keys);
            return keys;
        } catch (error) {
            console.error("Erro ao buscar hardware keys por base:", error);
            throw error; // Re-throw to see the actual error
        }
    }

    // Função para buscar informações completas de uma licença por base e hardware key
    async getLicenseInfoByBaseAndHardware(base: string, hardwareKey: string) {
        try {
            const result = await db
                .select({
                    id: licenses.id,
                    code: licenses.code,
                    nomeCliente: licenses.nomeCliente,
                    nomeDb: licenses.nomeDb,
                    hardwareKey: licenses.hardwareKey,
                    ativo: licenses.ativo
                })
                .from(licenses)
                .where(and(eq(licenses.nomeDb, base), eq(licenses.hardwareKey, hardwareKey)))
                .limit(1);

            return result[0];
        } catch (error) {
            console.error("Erro ao buscar informações da licença:", error);
            return null;
        }
    }

    // Cliente Histórico methods
    async getClienteHistorico(codigoCliente?: string): Promise<ClienteHistorico[]> {
        try {
            console.log(`Buscando histórico para cliente: ${codigoCliente}`);
            
            let query = db.select().from(clienteHistorico);
            
            if (codigoCliente) {
                query = query.where(eq(clienteHistorico.codigoCliente, codigoCliente)) as any;
            }
            
            const result = await query.orderBy(desc(clienteHistorico.createdAt));
            console.log(`Resultado da busca: ${result.length} registros encontrados`);
            console.log(`Dados do resultado:`, JSON.stringify(result, null, 2));
            
            // Garantir que sempre retorna um array
            const finalResult = Array.isArray(result) ? result : [];
            console.log(`Retornando array final:`, finalResult.length, 'items');
            return finalResult;
        } catch (error) {
            console.error("Erro ao buscar histórico de clientes:", error);
            // Em caso de erro, retornar array vazio em vez de lançar exceção
            return [];
        }
    }

    async getClienteHistoricoById(id: number): Promise<ClienteHistorico | undefined> {
        try {
            const result = await db
                .select()
                .from(clienteHistorico)
                .where(eq(clienteHistorico.id, id))
                .limit(1);
            return result[0];
        } catch (error) {
            console.error("Erro ao buscar histórico por ID:", error);
            throw error;
        }
    }

    async createClienteHistorico(data: InsertClienteHistorico): Promise<ClienteHistorico> {
        try {
            const result = await db
                .insert(clienteHistorico)
                .values(data)
                .returning();
            return result[0];
        } catch (error) {
            console.error("Erro ao criar histórico do cliente:", error);
            throw error;
        }
    }

    async updateClienteHistorico(id: number, data: Partial<InsertClienteHistorico>): Promise<ClienteHistorico> {
        try {
            const result = await db
                .update(clienteHistorico)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(clienteHistorico.id, id))
                .returning();
            return result[0];
        } catch (error) {
            console.error("Erro ao atualizar histórico do cliente:", error);
            throw error;
        }
    }

    async deleteClienteHistorico(id: number): Promise<void> {
        try {
            await db
                .delete(clienteHistorico)
                .where(eq(clienteHistorico.id, id));
        } catch (error) {
            console.error("Erro ao deletar histórico do cliente:", error);
            throw error;
        }
    }

    async getClientesList(): Promise<{code: string, nomeCliente: string}[]> {
        try {
            const result = await db
                .selectDistinct({
                    code: licenses.code,
                    nomeCliente: licenses.nomeCliente
                })
                .from(licenses)
                .where(and(
                    not(isNull(licenses.code)),
                    not(isNull(licenses.nomeCliente))
                ))
                .orderBy(asc(licenses.code));

            return result.filter(item => item.code && item.nomeCliente);
        } catch (error) {
            console.error("Erro ao buscar lista de clientes:", error);
            throw error;
        }
    }

    async getAmbientesByCliente(codigoCliente: string): Promise<string[]> {
        try {
            const result = await db
                .selectDistinct({ nomeDb: licenses.nomeDb })
                .from(licenses)
                .where(and(
                    eq(licenses.code, codigoCliente),
                    not(isNull(licenses.nomeDb))
                ))
                .orderBy(asc(licenses.nomeDb));

            return result.map(row => row.nomeDb).filter(Boolean) as string[];
        } catch (error) {
            console.error("Erro ao buscar ambientes do cliente:", error);
            throw error;
        }
    }
}

export const storage = new DbStorage();