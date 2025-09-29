import { pgTable, text, serial, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // Code
  linha: integer("linha"), // Linha
  ativo: boolean("ativo").notNull().default(true), // Ativo (Y/N)
  codCliente: text("cod_cliente").notNull(), // Cod. Cliente
  nomeCliente: text("nome_cliente").notNull(), // Nome Cliente
  dadosEmpresa: text("dados_empresa"), // Dados da empresa
  hardwareKey: text("hardware_key"), // Hardware key
  installNumber: text("install_number"), // Install number
  systemNumber: text("system_number"), // System number
  nomeDb: text("nome_db"), // Nome DB
  descDb: text("desc_db"), // Desc. DB
  endApi: text("end_api"), // End. API
  listaCnpj: text("lista_cnpj"), // Lista de CNPJ
  qtLicencas: integer("qt_licencas"), // Qt. Licenças
  qtLicencasAdicionais: integer("qt_licencas_adicionais").default(0), // Qt. Lic. Adicionais
  versaoSap: text("versao_sap"), // Versão SAP
  observacao: text("observacao").default(""), // Observação
  modulo1: boolean("modulo1").default(false), // Módulo 1
  modulo2: boolean("modulo2").default(false), // Módulo 2
  modulo3: boolean("modulo3").default(false), // Módulo 3
  modulo4: boolean("modulo4").default(false), // Módulo 4
  modulo5: boolean("modulo5").default(false), // Módulo 5
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCodeLinha: uniqueIndex("unique_code_linha").on(table.code, table.linha),
}));

// Tabela de usuários do sistema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("support"), // 'admin' ou 'support'
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const mensagemSistema = pgTable("mensagem_sistema", {
  id: serial("id").primaryKey(),
  mensagem: text("mensagem").notNull(),
  base: text("base").notNull(), // Referencias licenses.nome_db
  emailUsuario: text("email_usuario"),
  dataValidade: timestamp("data_validade").notNull(),
  hardwareKey: text("hardware_key").notNull(), // Referencias licenses.hardware_key
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Índice composto para relacionamento com licenses
  basehardwareIdx: uniqueIndex("idx_mensagem_base_hardware").on(table.base, table.hardwareKey),
}));

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  linha: true, // O campo linha será gerado automaticamente
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMensagemSistemaSchema = createInsertSchema(mensagemSistema).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataValidade: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  emailUsuario: z.string().optional().nullable().or(z.literal('')).transform((val) => {
    if (val === '' || val === undefined) return null;
    return val;
  }),
});

// Tabela de histórico de clientes
export const clienteHistorico = pgTable("cliente_historico", {
  id: serial("id").primaryKey(),
  codigoCliente: text("codigo_cliente").notNull(), // Referencia licenses.code
  nomeCliente: text("nome_cliente").notNull(), // Para facilitar buscas
  ambiente: text("ambiente"), // Nome do banco/ambiente atualizado
  versaoInstalada: text("versao_instalada"), // Versão que foi instalada
  versaoAnterior: text("versao_anterior"), // Versão que estava antes
  tipoAtualizacao: text("tipo_atualizacao").notNull(), // 'ATUALIZACAO_MOBILE', 'ATUALIZACAO_PORTAL', 'INSTALACAO', 'ACESSO_REMOTO', 'ATENDIMENTO_WHATSAPP', 'REUNIAO_CLIENTE'
  observacoes: text("observacoes"), // Observações detalhadas
  responsavel: text("responsavel").notNull(), // Quem fez a atualização/acesso
  dataUltimoAcesso: timestamp("data_ultimo_acesso"), // Último acesso ao sistema
  casoCritico: boolean("caso_critico").notNull().default(false), // Se é um caso crítico
  statusAtual: text("status_atual").notNull().default('CONCLUIDO'), // 'EM_ANDAMENTO', 'CONCLUIDO', 'PENDENTE'
  tempoGasto: integer("tempo_gasto"), // Tempo em minutos
  problemas: text("problemas"), // Problemas encontrados
  solucoes: text("solucoes"), // Soluções aplicadas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClienteHistoricoSchema = createInsertSchema(clienteHistorico).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataUltimoAcesso: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  tempoGasto: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    }
    return val;
  }),
});

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MensagemSistema = typeof mensagemSistema.$inferSelect;
export type InsertMensagemSistema = z.infer<typeof insertMensagemSistemaSchema>;
export type ClienteHistorico = typeof clienteHistorico.$inferSelect;
export type InsertClienteHistorico = z.infer<typeof insertClienteHistoricoSchema>;

export const licenseSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  linha: z.number(),
  ativo: z.boolean(),
  nomeCliente: z.string(),
  dadosEmpresa: z.string().optional(),
  hardwareKey: z.string().optional(),
  installNumber: z.string().optional(),
  systemNumber: z.string().optional(),
  nomeDb: z.string().optional(),
  descDb: z.string().optional(),
  endApi: z.string().optional(),
  listaCnpj: z.string().optional(),
  qtLicencas: z.number().optional(),
  qtLicencasAdicionais: z.number().optional(),
  versaoSap: z.string().optional(),
  observacao: z.string().optional(),
  modulo1: z.boolean().optional(),
  modulo2: z.boolean().optional(),
  modulo3: z.boolean().optional(),
  modulo4: z.boolean().optional(),
  modulo5: z.boolean().optional(),
  codCliente: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Schema para consulta de licenças por hardware
export const hardwareLicenseQuerySchema = z.object({
  hardwareKey: z.string().min(1, "Hardware key é obrigatório"),
  systemNumber: z.string().min(1, "System number é obrigatório"),
  installNumber: z.string().min(1, "Install number é obrigatório"),
  database: z.string(), // Permitir string vazia
});

export type HardwareLicenseQuery = z.infer<typeof hardwareLicenseQuerySchema>;

// Tipo de resposta para a consulta de licenças por hardware
export type HardwareLicenseResponse = {
  success: boolean;
  data?: {
    quantidadeLicencas: number;
    cnpjs: string; // CNPJs separados por asteriscos
  };
  message?: string;
};