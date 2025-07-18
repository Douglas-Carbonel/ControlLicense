import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLicenseSchema, insertActivitySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { parse } from "csv-parse";
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
      const userData = req.body;

      // Se está alterando a senha, fazer hash
      if (userData.passwordHash) {
        userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
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



  // Activity routes (only for admins)
  app.get("/api/activities", authenticateToken, blockSupportUsers, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
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
            res.status(500).json({ message: "Failed to import data", error: error.message });
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
      res.status(500).json({ message: "Failed to process import", error: error.message });
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
        const qtLicencas = parseInt(record["Qt. Licen�as"] || record["Qt. Licenças"] || record["Qt. Licen?as"] || record.qtLicencas || record.qt_licencas || "1");
        
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
          versaoSap: (record["Vers�o SAP"] || record["Versão SAP"] || record["Vers?o SAP"] || record.versaoSap || record.versao_sap || "").toString(),
        };
        
        console.log(`Processing record ${importedCount + 1}:`, licenseData.code);
        
        const validatedData = insertLicenseSchema.parse(licenseData);
        await storage.createLicense(validatedData);
        importedCount++;
        
        if (importedCount % 50 === 0) {
          console.log(`Imported ${importedCount} records so far...`);
        }
        } catch (error) {
          console.error("Failed to import record:", record.Code || record.code || 'unknown', error.message);
        }
      }
    }
    
    return importedCount;
  }

  const httpServer = createServer(app);
  return httpServer;
}
