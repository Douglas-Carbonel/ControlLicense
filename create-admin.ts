
import dotenv from "dotenv";
// Carrega variáveis do arquivo .env
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "./shared/schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL is not set");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function createAdmin() {
  try {
    console.log("Criando usuário administrador...");
    
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const newAdmin = await db.insert(users).values({
      username: "admin",
      email: "admin@sistema.com",
      passwordHash: hashedPassword,
      role: "admin",
      name: "Administrador do Sistema",
      active: true
    }).returning();
    
    console.log("Administrador criado com sucesso:");
    console.log("Usuário:", newAdmin[0].username);
    console.log("Email:", newAdmin[0].email);
    console.log("Senha: admin123");
    console.log("Role:", newAdmin[0].role);
    
    // Criar também um usuário técnico de exemplo
    const hashedTechPassword = await bcrypt.hash("tech123", 10);
    
    const newTech = await db.insert(users).values({
      username: "tecnico",
      email: "tecnico@sistema.com",
      passwordHash: hashedTechPassword,
      role: "support",
      name: "Técnico do Sistema",
      active: true
    }).returning();
    
    console.log("\nTécnico criado com sucesso:");
    console.log("Usuário:", newTech[0].username);
    console.log("Email:", newTech[0].email);
    console.log("Senha: tech123");
    console.log("Role:", newTech[0].role);
    
  } catch (error) {
    console.error("Erro ao criar usuários:", error);
  }
}

createAdmin();
