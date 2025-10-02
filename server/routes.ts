import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLicenseSchema, insertActivitySchema, insertUserSchema, insertMensagemSistemaSchema, insertClienteHistoricoSchema, hardwareLicenseQuerySchema, type HardwareLicenseResponse } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { parse } from "csv-parse";
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Extend Request interface to include multer file and user info
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    name: string;
  };
}

const upload = multer({ dest: "uploads/" });
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "32-character-secret-encryption-key!";

// Função de criptografia AES-256-CBC
function encryptData(data: string): { encryptedData: string; iv: string } {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
}

// Função de descriptografia AES-256-CBC
function decryptData(encryptedData: string, ivHex: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Middleware para verificar autenticação
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar se é admin
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
}

// Middleware para bloquear técnicos de certas rotas
function blockSupportUsers(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'support') {
    return res.status(403).json({ message: 'Acesso negado. Usuários técnicos não têm permissão.' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rotas de autenticação
  app.post("/api/auth/refresh", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Token inválido" });
      }

      // Buscar dados atualizados do usuário
      const user = await storage.getUser(req.user.id);
      if (!user || !user.active) {
        return res.status(401).json({ message: "Usuário inativo" });
      }

      // Gerar novo token
      const newToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Usuário ou senha incorretos" });
      }

      if (!user.active) {
        return res.status(401).json({ message: "Usuário inativo" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Usuário ou senha incorretos" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' } // Aumentar para 24 horas
      );

      // Log da atividade
      await storage.createActivity({
        userId: user.id.toString(),
        userName: user.name,
        action: "LOGIN",
        resourceType: "user",
        resourceId: user.id,
        description: `Usuário ${user.name} (${user.role}) fez login`,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user) {
        await storage.createActivity({
          userId: req.user.id.toString(),
          userName: req.user.name,
          action: "LOGOUT",
          resourceType: "user",
          resourceId: req.user.id,
          description: `Usuário ${req.user.name} fez logout`,
        });
      }
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rotas de gerenciamento de usuários (apenas admin)
  app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getUsers();
      // Não enviar hash da senha
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Verificar se usuário já existe
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(userData.passwordHash, 10);

      const newUser = await storage.createUser({
        ...userData,
        passwordHash: hashedPassword
      });

      // Log da atividade
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "CREATE",
        resourceType: "user",
        resourceId: newUser.id,
        description: `Usuário ${newUser.name} criado por ${req.user!.name}`,
      });

      // Não enviar hash da senha
      const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        active: newUser.active,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { username, email, name, role, active, passwordHash } = req.body;

      // Criar objeto apenas com campos válidos para atualização
      const userData: Partial<any> = {
        username,
        email,
        name,
        role,
        active
      };

      // Se está alterando a senha, fazer hash
      if (passwordHash) {
        userData.passwordHash = await bcrypt.hash(passwordHash, 10);
      }

      const updatedUser = await storage.updateUser(id, userData);

      // Log da atividade
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "UPDATE",
        resourceType: "user",
        resourceId: id,
        description: `Usuário ${updatedUser.name} atualizado por ${req.user!.name}`,
      });

      // Não enviar hash da senha
      const safeUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        active: updatedUser.active,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      if (req.user!.id === id) {
        return res.status(400).json({ message: "Não é possível excluir seu próprio usuário" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.deleteUser(id);

      // Log da atividade
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "DELETE",
        resourceType: "user",
        resourceId: id,
        description: `Usuário ${user.name} excluído por ${req.user!.name}`,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });
  // License routes (requer autenticação)
  app.get("/api/licenses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || '';

      const offset = (page - 1) * limit;

      // Get paginated licenses with search
      const licenses = await storage.getPaginatedLicenses(offset, limit, search);
      const total = await storage.getLicensesCount(search);

      res.json({
        data: licenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  // Statistics route - must come before parameterized routes (only for admins)
  app.get("/api/licenses/stats", authenticateToken, blockSupportUsers, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getLicenseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/licenses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      res.json(license);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch license" });
    }
  });

  app.post("/api/licenses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertLicenseSchema.parse(req.body);
      const license = await storage.createLicense(validatedData);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "CREATE",
        resourceType: "license",
        resourceId: license.id,
        description: `${req.user!.name} criou licença para ${license.nomeCliente}`,
      });

      res.status(201).json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create license" });
      }
    }
  });

  app.put("/api/licenses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLicenseSchema.partial().parse(req.body);
      const license = await storage.updateLicense(id, validatedData);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "UPDATE",
        resourceType: "license",
        resourceId: license.id,
        description: `${req.user!.name} atualizou licença para ${license.nomeCliente}`,
      });

      res.json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update license" });
      }
    }
  });

  app.delete("/api/licenses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }

      await storage.deleteLicense(id);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "DELETE",
        resourceType: "license",
        resourceId: id,
        description: `${req.user!.name} excluiu licença para ${license.nomeCliente}`,
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete license" });
    }
  });

  // Hardware license query endpoint com criptografia (endpoint público para sistemas externos)
  app.post("/api/licenses/hardware-query", async (req: Request, res: Response) => {
    try {
      // Validar dados recebidos
      const validatedQuery = hardwareLicenseQuerySchema.parse(req.body);

      // Buscar licenças que correspondem aos critérios
      const matchingLicenses = await storage.getLicensesByHardware(validatedQuery);

      if (matchingLicenses.length === 0) {
        // Log da consulta sem resultado com todos os parâmetros para monitoramento
        await storage.createActivity({
          userId: "system",
          userName: "Sistema Externo (Sem Resultado)",
          action: "QUERY_ENCRYPTED",
          resourceType: "license",
          resourceId: null,
          description: `Hardware: ${validatedQuery.hardwareKey} | System: ${validatedQuery.systemNumber} | Install: ${validatedQuery.installNumber} | Database: "${validatedQuery.database || 'vazio'}" | Resultado: 0 licenças encontradas (ERRO)`,
        });

        return res.status(404).json({
          message: "Nenhuma licença encontrada para os dados fornecidos",
          encrypted: false
        });
      }

      let totalLicenses = 0;
      const cnpjSet = new Set<string>();

      // Variáveis para controlar módulos (Y se pelo menos uma licença tiver o módulo ativo)
      let hasModulo1 = false;
      let hasModulo2 = false;
      let hasModulo3 = false;
      let hasModulo4 = false;
      let hasModulo5 = false;

      matchingLicenses.forEach(license => {
        // Somar licenças principais e adicionais
        const qtPrincipal = license.qtLicencas || 0;
        const qtAdicionais = license.qtLicencasAdicionais || 0;
        totalLicenses += qtPrincipal + qtAdicionais;

        // Verificar módulos ativos
        if (license.modulo1) hasModulo1 = true;
        if (license.modulo2) hasModulo2 = true;
        if (license.modulo3) hasModulo3 = true;
        if (license.modulo4) hasModulo4 = true;
        if (license.modulo5) hasModulo5 = true;

        // Extrair CNPJs da string e processar corretamente
        if (license.listaCnpj) {
          const cnpjs = license.listaCnpj
            .split('*') // Separar por asterisco (como no front)
            .map(cnpj => cnpj.trim())
            .filter(cnpj => cnpj.length > 0)
            .map(cnpj => cnpj.replace(/[^\d]/g, '')); // Remover máscara, manter apenas números

          cnpjs.forEach(cnpj => {
            if (cnpj.length === 14) { // Validar se tem 14 dígitos
              cnpjSet.add(cnpj);
            }
          });
        }
      });

      // Preparar dados para criptografia conforme documentação
      const originalData = {
        CNPJ: Array.from(cnpjSet).join(','), // Juntar CNPJs com vírgula
        QuantidadeLicenca: totalLicenses,
        Modulo1: hasModulo1 ? "Y" : "N",
        Modulo2: hasModulo2 ? "Y" : "N",
        Modulo3: hasModulo3 ? "Y" : "N",
        Modulo4: hasModulo4 ? "Y" : "N",
        Modulo5: hasModulo5 ? "Y" : "N"
      };

      // Criptografar os dados
      const dataToEncrypt = JSON.stringify(originalData);
      const { encryptedData, iv } = encryptData(dataToEncrypt);

      const response = {
        data: encryptedData,
        iv: iv
      };

      // Log da consulta criptografada com todos os parâmetros
      await storage.createActivity({
        userId: "system",
        userName: "Sistema Externo (Criptografado)",
        action: "QUERY_ENCRYPTED",
        resourceType: "license",
        resourceId: null,
        description: `Hardware: ${validatedQuery.hardwareKey} | System: ${validatedQuery.systemNumber} | Install: ${validatedQuery.installNumber} | Database: "${validatedQuery.database || 'vazio'}" | Resultado: ${matchingLicenses.length} licenças encontradas`,
      });

      res.json(response);

    } catch (error) {
      console.error("Erro na consulta criptografada de licenças:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inválidos: " + error.errors.map(e => e.message).join(", "),
          encrypted: false
        });
      }

      res.status(500).json({
        message: "Erro interno do servidor",
        encrypted: false
      });
    }
  });



  // Endpoint de descriptografia para testes
  app.post("/api/decrypt", async (req: Request, res: Response) => {
    try {
      const { encryptedData, iv } = req.body;

      if (!encryptedData || !iv) {
        return res.status(400).json({
          message: "encryptedData e iv são obrigatórios"
        });
      }

      const decryptedJson = decryptData(encryptedData, iv);
      const decryptedData = JSON.parse(decryptedJson);

      res.json(decryptedData);

    } catch (error) {
      console.error("Erro na descriptografia:", error);
      res.status(400).json({
        message: "Erro ao descriptografar dados. Verifique se encryptedData e iv estão corretos."
      });
    }
  });

  // Activity routes (only for admins)
  app.get("/api/activities", authenticateToken, blockSupportUsers, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/unread-count", authenticateToken, blockSupportUsers, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      const count = await storage.getUnreadActivityCount(req.user.id.toString());
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/activities/mark-read", authenticateToken, blockSupportUsers, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      await storage.markActivitiesAsRead(req.user.id.toString());
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking activities as read:", error);
      res.status(500).json({ message: "Failed to mark activities as read" });
    }
  });

  // Mensagem Sistema routes (requer autenticação)
  app.get("/api/mensagens", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mensagens = await storage.getMensagens();
      res.json(mensagens);
    } catch (error) {
      console.error("Error fetching mensagens:", error);
      res.status(500).json({ message: "Failed to fetch mensagens" });
    }
  });

  app.get("/api/mensagens/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const mensagem = await storage.getMensagem(id);
      if (!mensagem) {
        return res.status(404).json({ message: "Mensagem not found" });
      }
      res.json(mensagem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mensagem" });
    }
  });

  app.get("/api/mensagens/with-license", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mensagens = await storage.getMensagensWithLicense();
      res.json(mensagens);
    } catch (error) {
      console.error("Erro ao buscar mensagens com licenças:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/mensagens", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("Received data:", req.body);
      
      const validatedData = insertMensagemSistemaSchema.parse(req.body);
      console.log("Validated data:", validatedData);

      // Validar se base e hardware_key existem na tabela licenses
      const isValidReference = await storage.validateMensagemLicenseReference(
        validatedData.base, 
        validatedData.hardwareKey
      );

      if (!isValidReference) {
        return res.status(400).json({ 
          message: "A combinação de base e hardware_key não existe na tabela de licenças" 
        });
      }

      const mensagem = await storage.createMensagem(validatedData);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "CREATE",
        resourceType: "mensagem",
        resourceId: mensagem.id,
        description: `${req.user!.name} criou mensagem para base ${mensagem.base}`,
      });

      res.status(201).json(mensagem);
    } catch (error) {
      console.error("Error creating mensagem:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create mensagem" });
      }
    }
  });

  app.put("/api/mensagens/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMensagemSistemaSchema.partial().parse(req.body);
      
      // Se estão sendo atualizados base ou hardware_key, validar a combinação
      if (validatedData.base || validatedData.hardwareKey) {
        const mensagemExistente = await storage.getMensagem(id);
        if (!mensagemExistente) {
          return res.status(404).json({ message: "Mensagem not found" });
        }
        
        const baseToValidate = validatedData.base || mensagemExistente.base;
        const hardwareKeyToValidate = validatedData.hardwareKey || mensagemExistente.hardwareKey;
        
        const isValidReference = await storage.validateMensagemLicenseReference(
          baseToValidate, 
          hardwareKeyToValidate
        );

        if (!isValidReference) {
          return res.status(400).json({ 
            message: "A combinação de base e hardware_key não existe na tabela de licenças" 
          });
        }
      }
      
      const mensagem = await storage.updateMensagem(id, validatedData);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "UPDATE",
        resourceType: "mensagem",
        resourceId: mensagem.id,
        description: `${req.user!.name} atualizou mensagem para base ${mensagem.base}`,
      });

      res.json(mensagem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update mensagem" });
      }
    }
  });

  app.delete("/api/mensagens/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const mensagem = await storage.getMensagem(id);
      if (!mensagem) {
        return res.status(404).json({ message: "Mensagem not found" });
      }

      await storage.deleteMensagem(id);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "DELETE",
        resourceType: "mensagem",
        resourceId: id,
        description: `${req.user!.name} excluiu mensagem da base ${mensagem.base}`,
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mensagem" });
    }
  });

  // Novos endpoints para validação e autocompletar em mensagens
  app.get("/api/mensagens/validate/:base/:hardwareKey", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { base, hardwareKey } = req.params;
      
      const isValid = await storage.validateMensagemLicenseReference(base, hardwareKey);
      const licenseInfo = isValid ? await storage.getLicenseInfoByBaseAndHardware(base, hardwareKey) : null;

      res.json({
        valid: isValid,
        licenseInfo: licenseInfo
      });
    } catch (error) {
      console.error("Erro ao validar combinação base/hardware:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/mensagens/bases", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bases = await storage.getAvailableBases();
      res.json(bases);
    } catch (error) {
      console.error("Erro ao buscar bases:", error);
      res.status(500).json({ message: "Failed to fetch mensagem" });
    }
  });

  app.get("/api/mensagens/hardware-keys/:base", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { base } = req.params;
      const hardwareKeys = await storage.getHardwareKeysByBase(base);
      res.json(hardwareKeys);
    } catch (error) {
      console.error("Erro ao buscar hardware keys:", error);
      res.status(500).json({ message: "Failed to fetch mensagem" });
    }
  });

  // Endpoint público para verificar mensagem por nome_db e hardware_key
  app.post("/api/mensagens/verificaMensagem", async (req: Request, res: Response) => {
    try {
      const { nome_db, hardware_key } = req.body;

      if (!nome_db || !hardware_key) {
        return res.status(400).json({ 
          message: "nome_db e hardware_key são obrigatórios" 
        });
      }

      const mensagem = await storage.getMensagemByBaseAndHardware(nome_db, hardware_key);
      
      if (!mensagem) {
        return res.status(404).json({ 
          message: "Nenhuma mensagem encontrada para os dados fornecidos" 
        });
      }

      // Log da consulta para monitoramento
      await storage.createActivity({
        userId: "system",
        userName: "Sistema Externo (Consulta Mensagem)",
        action: "QUERY_MESSAGE",
        resourceType: "mensagem",
        resourceId: mensagem.id,
        description: `Consulta mensagem: Base ${nome_db} | Hardware ${hardware_key}`,
      });

      res.json({
        mensagem: mensagem.mensagem
      });

    } catch (error) {
      console.error("Erro na consulta de mensagem:", error);
      res.status(500).json({
        message: "Erro interno do servidor"
      });
    }
  });

  // Cliente Histórico routes (requer autenticação)
  app.get("/api/clientes-historico", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const codigoCliente = req.query.codigoCliente as string;
      
      if (!codigoCliente) {
        return res.status(400).json({ message: "codigoCliente é obrigatório" });
      }
      
      console.log(`Fetching historico for cliente: ${codigoCliente}`);
      const historico = await storage.getClienteHistorico(codigoCliente);
      
      // Garantir que sempre enviamos um array
      const result = Array.isArray(historico) ? historico : [];
      console.log(`Cliente histórico for ${codigoCliente}:`, result.length, 'records found');
      console.log(`Sending response:`, result);
      console.log(`Response stringified:`, JSON.stringify(result));
      
      // Fazer o set do header para garantir que é JSON
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching cliente histórico:", error);
      res.status(500).json({ message: "Failed to fetch cliente histórico" });
    }
  });

  app.get("/api/clientes-historico/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const historico = await storage.getClienteHistoricoById(id);
      if (!historico) {
        return res.status(404).json({ message: "Histórico not found" });
      }
      res.json(historico);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch histórico" });
    }
  });

  app.post("/api/clientes-historico", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertClienteHistoricoSchema.parse(req.body);
      const historico = await storage.createClienteHistorico(validatedData);

      // Criar descrição detalhada
      const tipoMap: Record<string, string> = {
        'INSTALACAO': 'Instalação',
        'ATUALIZACAO_MOBILE': 'Atualização Mobile',
        'ATUALIZACAO_PORTAL': 'Atualização Portal',
        'ACESSO_REMOTO': 'Acesso Remoto',
        'ATENDIMENTO_WHATSAPP': 'Atendimento WhatsApp',
        'REUNIAO_CLIENTE': 'Reunião com Cliente'
      };

      const tipoTexto = tipoMap[historico.tipoAtualizacao] || historico.tipoAtualizacao;
      const detalhes = [
        `Tipo: ${tipoTexto}`,
        historico.ambiente ? `Ambiente: ${historico.ambiente}` : null,
        historico.versaoInstalada ? `Versão: ${historico.versaoInstalada}` : null,
        historico.statusAtual ? `Status: ${historico.statusAtual}` : null,
        historico.casoCritico ? '⚠️ Caso Crítico' : null
      ].filter(Boolean).join(' | ');

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "CLIENT_HISTORY_CREATE",
        resourceType: "cliente_historico",
        resourceId: historico.id,
        description: `Novo registro para ${historico.nomeCliente} (${historico.codigoCliente}) - ${detalhes}`,
      });

      res.status(201).json(historico);
    } catch (error) {
      console.error("Error creating histórico:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create histórico" });
      }
    }
  });

  app.put("/api/clientes-historico/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Buscar dados antigos para comparação
      const oldData = await storage.getClienteHistoricoById(id);
      if (!oldData) {
        return res.status(404).json({ message: "Histórico not found" });
      }

      const validatedData = insertClienteHistoricoSchema.partial().parse(req.body);
      const historico = await storage.updateClienteHistorico(id, validatedData);

      // Detectar mudanças
      const changes: string[] = [];
      
      if (validatedData.statusAtual && validatedData.statusAtual !== oldData.statusAtual) {
        changes.push(`Status: ${oldData.statusAtual} → ${validatedData.statusAtual}`);
      }
      if (validatedData.versaoInstalada && validatedData.versaoInstalada !== oldData.versaoInstalada) {
        changes.push(`Versão: ${oldData.versaoInstalada || 'N/A'} → ${validatedData.versaoInstalada}`);
      }
      if (validatedData.ambiente && validatedData.ambiente !== oldData.ambiente) {
        changes.push(`Ambiente: ${oldData.ambiente || 'N/A'} → ${validatedData.ambiente}`);
      }
      if (validatedData.tempoGasto !== undefined && validatedData.tempoGasto !== oldData.tempoGasto) {
        changes.push(`Tempo: ${oldData.tempoGasto || 0}min → ${validatedData.tempoGasto}min`);
      }
      if (validatedData.casoCritico !== undefined && validatedData.casoCritico !== oldData.casoCritico) {
        changes.push(`Criticidade: ${oldData.casoCritico ? 'Sim' : 'Não'} → ${validatedData.casoCritico ? 'Sim' : 'Não'}`);
      }

      const changesText = changes.length > 0 ? ` - Alterações: ${changes.join(', ')}` : '';

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "CLIENT_HISTORY_UPDATE",
        resourceType: "cliente_historico",
        resourceId: historico.id,
        description: `Atualização em ${historico.nomeCliente} (${historico.codigoCliente})${changesText}`,
      });

      res.json(historico);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update histórico" });
      }
    }
  });

  app.delete("/api/clientes-historico/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const historico = await storage.getClienteHistoricoById(id);
      if (!historico) {
        return res.status(404).json({ message: "Histórico not found" });
      }

      const tipoMap: Record<string, string> = {
        'INSTALACAO': 'Instalação',
        'ATUALIZACAO_MOBILE': 'Atualização Mobile',
        'ATUALIZACAO_PORTAL': 'Atualização Portal',
        'ACESSO_REMOTO': 'Acesso Remoto',
        'ATENDIMENTO_WHATSAPP': 'Atendimento WhatsApp',
        'REUNIAO_CLIENTE': 'Reunião com Cliente'
      };

      await storage.deleteClienteHistorico(id);

      // Log activity
      await storage.createActivity({
        userId: req.user!.id.toString(),
        userName: req.user!.name,
        action: "CLIENT_HISTORY_DELETE",
        resourceType: "cliente_historico",
        resourceId: id,
        description: `Excluído registro de ${historico.nomeCliente} (${historico.codigoCliente}) - ${tipoMap[historico.tipoAtualizacao] || historico.tipoAtualizacao} do dia ${new Date(historico.createdAt).toLocaleDateString('pt-BR')}`,
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete histórico" });
    }
  });

  // Rota para listar usuários (para dropdowns)
  app.get("/api/usuarios", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getUsers();
      // Retornar apenas dados necessários para o dropdown
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        active: user.active
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      res.status(500).json({ message: "Failed to fetch usuarios" });
    }
  });

  // Rotas auxiliares para clientes
  app.get("/api/clientes/lista", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const clientes = await storage.getClientesList();
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching clientes list:", error);
      res.status(500).json({ message: "Failed to fetch clientes" });
    }
  });

  app.get("/api/clientes/:codigo/ambientes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const codigo = req.params.codigo;
      const ambientes = await storage.getAmbientesByCliente(codigo);
      res.json(ambientes);
    } catch (error) {
      console.error("Error fetching ambientes:", error);
      res.status(500).json({ message: "Failed to fetch ambientes" });
    }
  });

  // Import route (apenas admin)
  app.post("/api/import", authenticateToken, requireAdmin, upload.single("file"), async (req: MulterRequest & AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      let data: any[] = [];

      console.log('File info:', { 
        mimetype: file.mimetype, 
        originalname: file.originalname,
        size: file.size
      });

      if (file.mimetype === "text/csv" || file.originalname.endsWith('.csv') || file.mimetype === "application/octet-stream") {
        // Parse CSV
        const fileContent = readFileSync(file.path, "utf-8");

        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter: ';', // CSV uses semicolon as delimiter
        }, async (err, records) => {
          if (err) {
            console.error("CSV parse error:", err);
            return res.status(400).json({ message: "Failed to parse CSV file", error: err.message });
          }

          try {
            console.log(`Starting import of ${records.length} records`);
            const importedCount = await processImportData(records);

            // Log activity
            await storage.createActivity({
              userId: req.user!.id.toString(),
              userName: req.user!.name,
              action: "IMPORT",
              resourceType: "license",
              resourceId: null,
              description: `${req.user!.name} importou ${importedCount} licenças do arquivo CSV`,
            });

            res.json({ message: `Successfully imported ${importedCount} licenses` });
          } catch (error) {
            console.error("Import processing error:", error);
            res.status(500).json({ message: "Failed to import data", error: error instanceof Error ? error.message : String(error) });
          }
        });
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        // Parse Excel
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);

        const importedCount = await processImportData(data);

        // Log activity
        await storage.createActivity({
          userId: req.user!.id.toString(),
          userName: req.user!.name,
          action: "IMPORT",
          resourceType: "license",
          resourceId: null,
          description: `${req.user!.name} importou ${importedCount} licenças do arquivo Excel`,
        });

        res.json({ message: `Successfully imported ${importedCount} licenses` });
      } else {
        res.status(400).json({ message: "Unsupported file format" });
      }
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to process import", error: error instanceof Error ? error.message : String(error) });
    }
  });

  async function processImportData(records: any[]): Promise<number> {
    let importedCount = 0;
    const batchSize = 50; // Processar em lotes menores para melhor performance

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      for (const record of batch) {
        try {
          // Clean numeric values
        const linha = parseInt(record.Linha || record.linha || "1");
        const qtLicencas = parseInt(record["Qt. Licenas"] || record["Qt. Licenças"] || record["Qt. Licen?as"] || record.qtLicencas || record.qt_licencas || "1");

        const licenseData = {
          code: (record.Code || record.code || record.codigo || "").toString(),
          linha: isNaN(linha) ? 1 : linha,
          ativo: (record.Ativo || record.ativo || "Y") === "Y",
          codCliente: (record["Cod. Cliente"] || record.codCliente || record.cod_cliente || "").toString(),
          nomeCliente: (record["Nome Cliente"] || record.nomeCliente || record.nome_cliente || "").toString(),
          dadosEmpresa: (record["Dados da empresa"] || record.dadosEmpresa || record.dados_empresa || "").toString(),
          hardwareKey: (record["Hardware key"] || record.hardwareKey || record.hardware_key || "").toString(),
          installNumber: (record["Install number"] || record.installNumber || record.install_number || "").toString(),
          systemNumber: (record["System number"] || record.systemNumber || record.system_number || "").toString(),
          nomeDb: (record["Nome DB"] || record.nomeDb || record.nome_db || "").toString(),
          descDb: (record["Desc. DB"] || record.descDb || record.desc_db || "").toString(),
          endApi: (record["End. API"] || record.endApi || record.end_api || "").toString(),
          listaCnpj: (record["Lista de CNPJ"] || record.listaCnpj || record.lista_cnpj || "").toString(),
          qtLicencas: isNaN(qtLicencas) ? 1 : qtLicencas,
          versaoSap: (record["Verso SAP"] || record["Versão SAP"] || record["Vers?o SAP"] || record.versaoSap || record.versao_sap || "").toString(),
        };

        console.log(`Processing record ${importedCount + 1}:`, licenseData.code);

        const validatedData = insertLicenseSchema.parse(licenseData);
        await storage.createLicense(validatedData);
        importedCount++;

        if (importedCount % 50 === 0) {
          console.log(`Imported ${importedCount} records so far...`);
        }
        } catch (error) {
          console.error("Failed to import record:", record.Code || record.code || 'unknown', error instanceof Error ? error.message : String(error));
        }
      }
    }

    return importedCount;
  }

  const httpServer = createServer(app);
  return httpServer;
}