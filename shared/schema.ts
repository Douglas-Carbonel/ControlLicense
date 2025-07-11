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
  versaoSap: text("versao_sap"), // Versão SAP
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

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
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

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
