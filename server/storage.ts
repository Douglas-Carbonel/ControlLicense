import dotenv from "dotenv";
// Carrega variáveis do arquivo .env
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  licenses,
  activities,
  users,
  mensagemSistema,
  clienteHistorico,
  representantes,
  chamados,
  chamadoPendencias,
  chamadoInteracoes,
  notificacoes,
  type License,
  type Activity,
  type User,
  type InsertActivity,
  type MensagemSistema,
  type InsertMensagemSistema,
  type ClienteHistorico,
  type InsertClienteHistorico,
  type Representante,
  type InsertRepresentante,
  type Chamado,
  type InsertChamado,
  type ChamadoPendencia,
  type InsertChamadoPendencia,
  type ChamadoInteracao,
  type InsertChamadoInteracao,
  type Notificacao,
  type InsertNotificacao,
  type HardwareLicenseQuery
} from "@shared/schema";
import { eq, ilike, or, desc, and, sql, asc, count, isNull, not, inArray } from "drizzle-orm";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export { db };

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

  // Representantes operations
  getRepresentantes(): Promise<Representante[]>;
  getRepresentante(id: number): Promise<Representante | undefined>;
  createRepresentante(data: InsertRepresentante): Promise<Representante>;
  updateRepresentante(id: number, data: Partial<InsertRepresentante>): Promise<Representante>;
  deleteRepresentante(id: number): Promise<void>;

  // Chamados operations
  getChamados(): Promise<Chamado[]>;
  getChamadosByUsuario(usuarioId: number, role: string, representanteId?: number, clienteId?: string, tipoUsuario?: string): Promise<Chamado[]>;
  getChamado(id: number): Promise<Chamado | undefined>;
  createChamado(data: InsertChamado): Promise<Chamado>;
  updateChamado(id: number, data: Partial<InsertChamado>): Promise<Chamado>;
  deleteChamado(id: number): Promise<void>;

  // Chamado Pendências operations
  getChamadoPendencias(chamadoId: number): Promise<ChamadoPendencia[]>;
  createChamadoPendencia(data: InsertChamadoPendencia): Promise<ChamadoPendencia>;
  updateChamadoPendencia(id: number, data: Partial<InsertChamadoPendencia>): Promise<ChamadoPendencia>;

  // Chamado Interações operations
  getChamadoInteracoes(chamadoId: number): Promise<ChamadoInteracao[]>;
  createChamadoInteracao(data: InsertChamadoInteracao): Promise<ChamadoInteracao>;

  // Chamado Notificações operations
  getChamadosUnreadCount(usuarioId: number, role: string, representanteId?: number, clienteId?: string): Promise<number>;
  markChamadoAsRead(chamadoId: number, usuarioId: number): Promise<void>;

  // Notificações operations
  getNotificacoes(usuarioId: number): Promise<Notificacao[]>;
  createNotificacao(data: InsertNotificacao): Promise<Notificacao>;
  markNotificacaoAsRead(notificacaoId: number): Promise<void>;
  markAllNotificacoesAsRead(usuarioId: number): Promise<void>;
  deleteNotificacao(notificacaoId: number, usuarioId: number): Promise<void>;
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
    // Se os representantes foram modificados, atualizar todas as linhas do mesmo cliente
    if (license.representantePrincipalId !== undefined || license.representanteSecundarioId !== undefined) {
      console.log('🔍 Atualizando representantes - ID:', id);
      console.log('🔍 Novos valores:', {
        representantePrincipalId: license.representantePrincipalId,
        representanteSecundarioId: license.representanteSecundarioId
      });

      // Primeiro, buscar o code da licença atual
      const currentLicense = await this.getLicense(id);
      console.log('🔍 Licença atual:', currentLicense);

      if (currentLicense?.code) {
        console.log(`🔍 Atualizando TODAS as licenças com code: ${currentLicense.code}`);

        // Atualizar TODAS as licenças com o mesmo code
        const updateResult = await db
          .update(licenses)
          .set({
            representantePrincipalId: license.representantePrincipalId,
            representanteSecundarioId: license.representanteSecundarioId
          })
          .where(eq(licenses.code, currentLicense.code))
          .returning();

        console.log(`✅ ${updateResult.length} licença(s) atualizada(s) com code ${currentLicense.code}`);
      }
    }

    // Atualizar a licença específica com todos os campos
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
        representantePrincipalId: licenses.representantePrincipalId,
        representanteSecundarioId: licenses.representanteSecundarioId,
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
                    not(isNull(licenses.nomeCliente)),
                    eq(licenses.ativo, true) // Apenas clientes ativos
                ))
                .orderBy(asc(licenses.code));

            // Garantir unicidade pelo código
            const uniqueClientes = Array.from(
                new Map(result.map(item => [item.code, item])).values()
            );

            console.log('Lista de clientes única:', uniqueClientes.length, 'clientes');

            return uniqueClientes.filter(item => item.code && item.nomeCliente);
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

    // Representantes methods
    async getRepresentantes(): Promise<Representante[]> {
        try {
            return await db
                .select()
                .from(representantes)
                .orderBy(asc(representantes.nome));
        } catch (error) {
            console.error("Erro ao buscar representantes:", error);
            throw error;
        }
    }

    async getRepresentante(id: number): Promise<Representante | undefined> {
        try {
            const result = await db
                .select()
                .from(representantes)
                .where(eq(representantes.id, id))
                .limit(1);
            return result[0];
        } catch (error) {
            console.error("Erro ao buscar representante:", error);
            throw error;
        }
    }

    async createRepresentante(data: InsertRepresentante): Promise<Representante> {
        try {
            const result = await db
                .insert(representantes)
                .values(data)
                .returning();
            return result[0];
        } catch (error) {
            console.error("Erro ao criar representante:", error);
            throw error;
        }
    }

    async updateRepresentante(id: number, data: Partial<InsertRepresentante>): Promise<Representante> {
        try {
            const result = await db
                .update(representantes)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(representantes.id, id))
                .returning();

            if (!result[0]) {
                throw new Error("Representante não encontrado");
            }

            return result[0];
        } catch (error) {
            console.error("Erro ao atualizar representante:", error);
            throw error;
        }
    }

    async deleteRepresentante(id: number): Promise<void> {
        try {
            await db.delete(representantes).where(eq(representantes.id, id));
        } catch (error) {
            console.error("Erro ao deletar representante:", error);
            throw error;
        }
    }

    // Métodos para Chamados
    async getChamados(): Promise<Chamado[]> {
        return db.select().from(chamados).orderBy(desc(chamados.dataAbertura));
    }

    async getChamadosByUsuario(
        usuarioId: number,
        role: string,
        representanteId?: number,
        clienteId?: string,
        tipoUsuario?: string
    ): Promise<(Chamado & { totalInteracoes?: number })[]> {
        // Query otimizada com subquery para contar interações em uma única consulta
        const interacoesSubquery = db
            .select({
                chamadoId: chamadoInteracoes.chamadoId,
                total: count().as('total')
            })
            .from(chamadoInteracoes)
            .groupBy(chamadoInteracoes.chamadoId)
            .as('interacoes_count');

        // Admin e interno veem todos
        if (role === 'admin' || role === 'interno') {
            const result = await db
                .select({
                    ...chamados,
                    totalInteracoes: sql<number>`COALESCE(${interacoesSubquery.total}, 0)`
                })
                .from(chamados)
                .leftJoin(interacoesSubquery, eq(chamados.id, interacoesSubquery.chamadoId))
                .orderBy(desc(chamados.dataAbertura));

            return result;
        }

        // Representante analista
        if (role === 'representante' && tipoUsuario === 'analista') {
            const result = await db
                .select({
                    ...chamados,
                    totalInteracoes: sql<number>`COALESCE(${interacoesSubquery.total}, 0)`
                })
                .from(chamados)
                .leftJoin(interacoesSubquery, eq(chamados.id, interacoesSubquery.chamadoId))
                .where(
                    or(
                        eq(chamados.solicitanteId, usuarioId),
                        representanteId ? eq(chamados.representanteId, representanteId) : undefined
                    )
                )
                .orderBy(desc(chamados.dataAbertura));

            return result;
        }

        // Cliente final
        if (role === 'cliente_final' && clienteId) {
            const result = await db
                .select({
                    ...chamados,
                    totalInteracoes: sql<number>`COALESCE(${interacoesSubquery.total}, 0)`
                })
                .from(chamados)
                .leftJoin(interacoesSubquery, eq(chamados.id, interacoesSubquery.chamadoId))
                .where(
                    and(
                        eq(chamados.clienteId, clienteId),
                        eq(chamados.solicitanteId, usuarioId)
                    )
                )
                .orderBy(desc(chamados.dataAbertura));

            return result;
        }

        return [];
    }

    async getChamado(id: number): Promise<Chamado | undefined> {
        const t1 = Date.now();
        const result = await db.select().from(chamados).where(eq(chamados.id, id));
        console.log(`[PERF] getChamado query: ${Date.now() - t1}ms`);
        return result[0];
    }

    async createChamado(data: InsertChamado): Promise<Chamado> {
        const result = await db.insert(chamados).values(data).returning();
        return result[0];
    }

    async updateChamado(id: number, data: Partial<InsertChamado>): Promise<Chamado> {
        const result = await db.update(chamados)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(chamados.id, id))
            .returning();
        return result[0];
    }

    async deleteChamado(id: number): Promise<void> {
        await db.delete(chamados).where(eq(chamados.id, id));
    }

    // Métodos para Pendências
    async getChamadoPendencias(chamadoId: number): Promise<ChamadoPendencia[]> {
        const t1 = Date.now();
        const result = await db.select().from(chamadoPendencias)
            .where(eq(chamadoPendencias.chamadoId, chamadoId))
            .orderBy(desc(chamadoPendencias.createdAt))
            .limit(50); // Limitar pendências
        console.log(`[PERF] getChamadoPendencias: ${Date.now() - t1}ms, found ${result.length} records`);
        return result;
    }

    async createChamadoPendencia(data: InsertChamadoPendencia): Promise<ChamadoPendencia> {
        const result = await db.insert(chamadoPendencias).values(data).returning();
        return result[0];
    }

    async updateChamadoPendencia(id: number, data: Partial<InsertChamadoPendencia>): Promise<ChamadoPendencia> {
        const result = await db.update(chamadoPendencias)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(chamadoPendencias.id, id))
            .returning();
        return result[0];
    }

    // Métodos para Interações
    async getChamadoInteracoes(chamadoId: number): Promise<any[]> {
        const t1 = Date.now();
        // Buscar interações
        const interacoesData = await db.select()
            .from(chamadoInteracoes)
            .where(eq(chamadoInteracoes.chamadoId, chamadoId))
            .orderBy(asc(chamadoInteracoes.createdAt))
            .limit(100);
        console.log(`[PERF] getChamadoInteracoes - fetch interacoes: ${Date.now() - t1}ms, found ${interacoesData.length} records`);

        if (interacoesData.length === 0) return [];

        // Extrair IDs únicos dos usuários das interações
        const usuarioIds = Array.from(new Set(interacoesData.map(i => i.usuarioId)));

        const t2 = Date.now();
        // Buscar apenas os usuários que aparecem nas interações
        const usuariosMap = await db.select({
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            role: users.role
        })
        .from(users)
        .where(inArray(users.id, usuarioIds));
        console.log(`[PERF] getChamadoInteracoes - fetch users: ${Date.now() - t2}ms, found ${usuariosMap.length} users`);

        // Mapear usuários por ID
        const usersById = new Map(usuariosMap.map(u => [u.id, u]));

        // Combinar dados
        return interacoesData.map(interacao => ({
            ...interacao,
            usuario: usersById.get(interacao.usuarioId) || null
        }));
    }

    async createChamadoInteracao(data: InsertChamadoInteracao): Promise<ChamadoInteracao> {
        const result = await db.insert(chamadoInteracoes).values(data).returning();

        // Buscar informações do chamado e do usuário que está interagindo
        const chamado = await this.getChamado(data.chamadoId);
        const usuario = await this.getUser(data.usuarioId);

        if (!chamado || !usuario) {
            return result[0];
        }

        // Determinar quem deve marcar como não lido
        const isInterno = usuario.role === 'admin' || usuario.role === 'interno';
        const isSolicitante = chamado.solicitanteId === data.usuarioId;

        await db.update(chamados)
            .set({
                dataUltimaInteracao: new Date(),
                // Se quem interagiu é o solicitante, marca como lido para ele; senão marca como não lido
                lidoPorSolicitante: isSolicitante ? true : false,
                // Se quem interagiu é interno/atendente, marca como lido para atendente; senão marca como não lido
                lidoPorAtendente: isInterno ? true : false
            })
            .where(eq(chamados.id, data.chamadoId));

        return result[0];
    }

    async getChamadosUnreadCount(usuarioId: number, role: string, representanteId?: number, clienteId?: string): Promise<number> {
        try {
            let conditions: any[] = [];

            if (role === 'admin' || role === 'interno') {
                // Admins/Internos: chamados não lidos por atendentes (novos ou com respostas não lidas)
                conditions.push(eq(chamados.lidoPorAtendente, false));
            } else if (role === 'representante' && representanteId) {
                // Representantes: chamados do seu grupo não lidos pelo solicitante
                conditions.push(
                    eq(chamados.representanteId, representanteId),
                    eq(chamados.solicitanteId, usuarioId),
                    eq(chamados.lidoPorSolicitante, false)
                );
            } else if (role === 'cliente_final' && clienteId) {
                // Cliente final: seus chamados não lidos
                conditions.push(
                    eq(chamados.clienteId, clienteId),
                    eq(chamados.solicitanteId, usuarioId),
                    eq(chamados.lidoPorSolicitante, false)
                );
            }

            if (conditions.length === 0) {
                return 0;
            }

            const result = await db
                .select({ count: count() })
                .from(chamados)
                .where(and(...conditions));

            return result[0]?.count || 0;
        } catch (error) {
            console.error("Erro ao buscar contagem de chamados não lidos:", error);
            return 0;
        }
    }

    async markChamadoAsRead(chamadoId: number, usuarioId: number): Promise<void> {
        try {
            // Buscar o chamado e o usuário para determinar qual campo atualizar
            const chamado = await this.getChamado(chamadoId);
            const user = await this.getUser(usuarioId);

            if (!chamado || !user) {
                return;
            }

            // Se é interno/admin, marca como lido pelo atendente
            if (user.role === 'admin' || user.role === 'interno') {
                await db.update(chamados)
                    .set({ lidoPorAtendente: true })
                    .where(eq(chamados.id, chamadoId));
            }
            // Se é o solicitante, marca como lido por ele
            else if (chamado.solicitanteId === usuarioId) {
                await db.update(chamados)
                    .set({ lidoPorSolicitante: true })
                    .where(eq(chamados.id, chamadoId));
            }
        } catch (error) {
            console.error("Erro ao marcar chamado como lido:", error);
        }
    }

    // Notificações operations
    async getNotificacoes(usuarioId: number): Promise<Notificacao[]> {
        return db.select().from(notificacoes)
            .where(eq(notificacoes.usuarioId, usuarioId))
            .orderBy(desc(notificacoes.createdAt));
    }

    async getNotificacoesByUsuario(usuarioId: number): Promise<Notificacao[]> {
        return this.getNotificacoes(usuarioId);
    }

    async getNotificacoesNaoLidasCount(usuarioId: number): Promise<number> {
        const result = await db.select({ count: count() })
            .from(notificacoes)
            .where(and(
                eq(notificacoes.usuarioId, usuarioId),
                eq(notificacoes.lida, false)
            ));
        return result[0]?.count || 0;
    }

    async createNotificacao(data: InsertNotificacao): Promise<Notificacao> {
        const result = await db.insert(notificacoes).values(data).returning();
        return result[0];
    }

    async markNotificacaoAsRead(notificacaoId: number): Promise<void> {
        await db.update(notificacoes)
            .set({ lida: true })
            .where(eq(notificacoes.id, notificacaoId));
    }

    async markAllNotificacoesAsRead(usuarioId: number): Promise<void> {
        await db.update(notificacoes)
            .set({ lida: true })
            .where(eq(notificacoes.usuarioId, usuarioId));
    }

    async deleteNotificacao(notificacaoId: number, usuarioId: number): Promise<void> {
        await db.delete(notificacoes)
            .where(and(
                eq(notificacoes.id, notificacaoId),
                eq(notificacoes.usuarioId, usuarioId)
            ));
    }
}

export const storage = new DbStorage();