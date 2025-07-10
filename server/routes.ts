import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLicenseSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { parse } from "csv-parse";
import * as XLSX from "xlsx";

// Extend Request interface to include multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // License routes
  app.get("/api/licenses", async (req, res) => {
    try {
      const licenses = await storage.getLicenses();
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  // Statistics route - must come before parameterized routes
  app.get("/api/licenses/stats", async (req, res) => {
    try {
      const stats = await storage.getLicenseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/licenses/:id", async (req, res) => {
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

  app.post("/api/licenses", async (req, res) => {
    try {
      const validatedData = insertLicenseSchema.parse(req.body);
      const license = await storage.createLicense(validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: "current-user", // TODO: Get from session
        userName: "Current User", // TODO: Get from session
        action: "CREATE",
        resourceType: "license",
        resourceId: license.id,
        description: `Created license for ${license.nomeCliente}`,
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

  app.put("/api/licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLicenseSchema.partial().parse(req.body);
      const license = await storage.updateLicense(id, validatedData);
      
      // Log activity
      await storage.createActivity({
        userId: "current-user",
        userName: "Current User",
        action: "UPDATE",
        resourceType: "license",
        resourceId: license.id,
        description: `Updated license for ${license.nomeCliente}`,
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

  app.delete("/api/licenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      await storage.deleteLicense(id);
      
      // Log activity
      await storage.createActivity({
        userId: "current-user",
        userName: "Current User",
        action: "DELETE",
        resourceType: "license",
        resourceId: id,
        description: `Deleted license for ${license.nomeCliente}`,
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete license" });
    }
  });



  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Import route
  app.post("/api/import", upload.single("file"), async (req: MulterRequest, res) => {
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
        const fs = require("fs");
        const fileContent = fs.readFileSync(file.path, "utf-8");
        
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
              userId: "current-user",
              userName: "Current User",
              action: "IMPORT",
              resourceType: "license",
              resourceId: null,
              description: `Imported ${importedCount} licenses from CSV`,
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
          userId: "current-user",
          userName: "Current User",
          action: "IMPORT",
          resourceType: "license",
          resourceId: null,
          description: `Imported ${importedCount} licenses from Excel`,
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
    
    for (const record of records) {
      try {
        // Clean numeric values
        const linha = parseInt(record.Linha || record.linha || "1");
        const qtLicencas = parseInt(record["Qt. Licenças"] || record["Qt. Licen?as"] || record.qtLicencas || record.qt_licencas || "1");
        
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
          versaoSap: (record["Versão SAP"] || record["Vers?o SAP"] || record.versaoSap || record.versao_sap || "").toString(),
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
    
    return importedCount;
  }

  const httpServer = createServer(app);
  return httpServer;
}
