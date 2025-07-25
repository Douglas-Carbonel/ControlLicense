import dotenv from "dotenv";
// Carrega variáveis do arquivo .env
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { licenses, users, activities, mensagemSistema, type InsertLicense, type InsertUser, type InsertActivity, type InsertMensagemSistema, type License, type User, type Activity, type MensagemSistema, type HardwareLicenseQuery } from "@shared/schema";
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

  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Mensagem Sistema operations
  getMensagens(): Promise<any>;
  getMensagem(id: number): Promise<any>;
  createMensagem(data: InsertMensagemSistema): Promise<any>;
  updateMensagem(id: number, data: Partial<InsertMensagemSistema>): Promise<any>;
  deleteMensagem(id: number): Promise<void>;
  getMensagensByHardwareKey(hardwareKey: string): Promise<any>;
}

export class DbStorage implements IStorage {
  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.id));
  }

  async getPaginatedLicenses(offset: number, limit: number, search?: string): Promise<License[]> {
    let query = db.select().from(licenses);

    if (search) {
      const conditions = this.buildSearchConditions(search);
      if (conditions.length > 0) {
        query = query.where(or(...conditions));
      }
    }

    const result = await query
      .orderBy(desc(licenses.id))
      .offset(offset)
      .limit(limit);

    return result;
  }

  async getLicensesCount(search?: string): Promise<number> {
    let query = db.select({ count: count() }).from(licenses);

    if (search) {
      const conditions = this.buildSearchConditions(search);
      if (conditions.length > 0) {
        query = query.where(or(...conditions));
      }
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
            case 'qtLicencasAdicionais':
              const num = parseInt(value);
              if (!isNaN(num)) {
                conditions.push(eq(licenses[column as keyof typeof licenses], num));
              }
              break;
            default:
              // Para outras colunas, buscar como texto
              if (licenses[column as keyof typeof licenses]) {
                conditions.push(ilike(licenses[column as keyof typeof licenses], `%${value}%`));
              }
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
    const result = await db.insert(licenses).values(license).returning();
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
            const result = await db
                .selectDistinct({ nomeDb: licenses.nomeDb })
                .from(licenses)
                .where(and(not(isNull(licenses.nomeDb)), eq(licenses.ativo, true)))
                .orderBy(licenses.nomeDb);

            return result.map(row => row.nomeDb).filter(Boolean) as string[];
        } catch (error) {
            console.error("Erro ao buscar bases disponíveis:", error);
            return [];
        }
    }

    // Função para buscar hardware keys por base
    async getHardwareKeysByBase(base: string): Promise<string[]> {
        try {
            const result = await db
                .selectDistinct({ hardwareKey: licenses.hardwareKey })
                .from(licenses)
                .where(and(
                    eq(licenses.nomeDb, base),
                    not(isNull(licenses.hardwareKey)),
                    eq(licenses.ativo, true)
                ))
                .orderBy(licenses.hardwareKey);

            return result.map(row => row.hardwareKey).filter(Boolean) as string[];
        } catch (error) {
            console.error("Erro ao buscar hardware keys por base:", error);
            return [];
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
}

export const storage = new DbStorage();