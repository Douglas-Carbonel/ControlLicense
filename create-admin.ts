import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "./shared/schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);
const db = drizzle(sql);

async function createAdmin() {
  try {
    // Hash da senha padrão
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    // Criar usuário administrador
    const admin = await db.insert(users).values({
      username: "admin",
      email: "admin@empresa.com",
      passwordHash: hashedPassword,
      role: "admin",
      name: "Administrador",
      active: true
    }).returning();
    
    console.log("Usuário administrador criado com sucesso!");
    console.log("Login: admin");
    console.log("Senha: admin123");
    console.log("Role: admin");
    console.log("Por favor, altere a senha após o primeiro login.");
    
    // Criar usuário de suporte de exemplo
    const supportPassword = await bcrypt.hash("support123", 10);
    const support = await db.insert(users).values({
      username: "suporte",
      email: "suporte@empresa.com",
      passwordHash: supportPassword,
      role: "support",
      name: "Usuário de Suporte",
      active: true
    }).returning();
    
    console.log("\nUsuário de suporte criado com sucesso!");
    console.log("Login: suporte");
    console.log("Senha: support123");
    console.log("Role: support");
    console.log("Por favor, altere a senha após o primeiro login.");
    
  } catch (error) {
    console.error("Erro ao criar usuários:", error);
  }
}

createAdmin().catch(console.error);