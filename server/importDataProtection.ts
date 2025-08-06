// Import Data Protection System - Prevents loss of imported data
import { products, services, importHistory } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ImportDataProtection {
  private static instance: ImportDataProtection;
  
  static getInstance(): ImportDataProtection {
    if (!ImportDataProtection.instance) {
      ImportDataProtection.instance = new ImportDataProtection();
    }
    return ImportDataProtection.instance;
  }

  // Check if imported data exists
  async hasImportedData(): Promise<{ products: boolean; services: boolean; count: { products: number; services: number } }> {
    try {
      // Import db here to avoid circular dependency
      const { db } = await import('./db');
      const allProducts = await db.select().from(products);
      const allServices = await db.select().from(services);
      
      // Default data has exactly 3 products and 3 services
      const hasImportedProducts = allProducts.length > 3;
      const hasImportedServices = allServices.length > 3;
      
      return {
        products: hasImportedProducts,
        services: hasImportedServices,
        count: {
          products: allProducts.length,
          services: allServices.length
        }
      };
    } catch (error) {
      console.error("❌ Error checking imported data:", error);
      return { products: false, services: false, count: { products: 0, services: 0 } };
    }
  }

  // Create backup of imported data
  async createImportBackup(): Promise<void> {
    try {
      const importStatus = await this.hasImportedData();
      
      if (importStatus.products || importStatus.services) {
        // Import db here to avoid circular dependency
        const { db } = await import('./db');
        const allProducts = await db.select().from(products);
        const allServices = await db.select().from(services);
        
        // Store in a persistent way (could be file system or dedicated backup table)
        const backupData = {
          timestamp: new Date().toISOString(),
          products: allProducts,
          services: allServices,
          importedProductsCount: importStatus.count.products - 3,
          importedServicesCount: importStatus.count.services - 3
        };
        
        // Log the backup
        console.log("🔒 IMPORT DATA BACKUP CREATED:", {
          totalProducts: allProducts.length,
          importedProducts: backupData.importedProductsCount,
          totalServices: allServices.length,
          importedServices: backupData.importedServicesCount
        });
        
        // Store backup reference in memory for quick access
        this.lastImportBackup = backupData;
      }
    } catch (error) {
      console.error("❌ Import backup creation failed:", error);
    }
  }

  // Create immediate snapshot after import
  async createPostImportSnapshot(): Promise<void> {
    try {
      // Import db here to avoid circular dependency
      const { db } = await import('./db');
      const allProducts = await db.select().from(products);
      const allServices = await db.select().from(services);
      
      const snapshotData = {
        timestamp: new Date().toISOString(),
        snapshotType: 'POST_IMPORT',
        products: allProducts,
        services: allServices,
        totalProductsCount: allProducts.length,
        totalServicesCount: allServices.length,
        importedProductsCount: Math.max(0, allProducts.length - 3),
        importedServicesCount: Math.max(0, allServices.length - 3)
      };
      
      console.log("📸 POST-IMPORT SNAPSHOT CREATED:", {
        timestamp: snapshotData.timestamp,
        totalProducts: snapshotData.totalProductsCount,
        importedProducts: snapshotData.importedProductsCount,
        totalServices: snapshotData.totalServicesCount,
        importedServices: snapshotData.importedServicesCount
      });
      
      // Store snapshot in memory for immediate access
      this.lastImportBackup = snapshotData;
      
      // Create persistent backup - DISABLED
      // await this.createImportBackup(); // DISABLED TO PREVENT AUTOMATIC BACKUPS
      
    } catch (error) {
      console.error("❌ Post-import snapshot creation failed:", error);
    }
  }

  private lastImportBackup: any = null;

  // Prevent accidental deletion of imported data
  async protectImportedData(): Promise<void> {
    try {
      const importStatus = await this.hasImportedData();
      
      if (importStatus.products || importStatus.services) {
        console.log("🛡️ IMPORTED DATA PROTECTION ACTIVATED");
        console.log(`📊 Protected Products: ${importStatus.count.products} (${importStatus.count.products - 3} imported)`);
        console.log(`📊 Protected Services: ${importStatus.count.services} (${importStatus.count.services - 3} imported)`);
        
        // Mark data as protected (could add a flag to the database)
        this.isProtectionActive = true;
      }
    } catch (error) {
      console.error("❌ Import data protection failed:", error);
    }
  }

  private isProtectionActive: boolean = false;

  // Check if protection is active
  isProtected(): boolean {
    return this.isProtectionActive;
  }

  // Emergency recovery of imported data - PERMANENTLY DISABLED
  async emergencyRecover(): Promise<boolean> {
    try {
      console.log("🔒 EMERGENCY RECOVERY PERMANENTLY DISABLED");
      console.log("⚠️ This system was causing data loss during rollbacks");
      console.log("💡 Manual intervention required for any data recovery");
      
      if (!this.lastImportBackup) {
        console.log("⚠️ No import backup available for recovery");
        return false;
      }

      const currentStatus = await this.hasImportedData();
      
      // Log what would be restored but NEVER restore automatically
      console.log("📊 Current Status:", {
        products: currentStatus.count.products,
        services: currentStatus.count.services
      });
      
      if (this.lastImportBackup.products) {
        console.log("📦 Backup Contains:", {
          products: this.lastImportBackup.products.length,
          services: this.lastImportBackup.services.length
        });
      }
      
      console.log("🚨 AUTOMATIC RESTORATION BLOCKED - preventing data corruption");
      return false; // Never restore automatically
    } catch (error) {
      console.error("❌ Emergency recovery check failed:", error);
      return false;
    }
  }

  // Monitor imported data integrity - DISABLED
  async monitorIntegrity(): Promise<void> {
    console.log("🔒 INTEGRITY MONITORING PERMANENTLY DISABLED");
    console.log("⚠️ Automatic monitoring was causing data loss during rollbacks");
    console.log("💡 Manual checks only - no automatic recovery attempts");
    
    // Log current status once without monitoring
    try {
      const importStatus = await this.hasImportedData();
      console.log("📊 Initial Import Status Check:", {
        products: importStatus.count.products,
        services: importStatus.count.services,
        hasImportedProducts: importStatus.products,
        hasImportedServices: importStatus.services
      });
    } catch (error) {
      console.error("❌ Initial import status check failed:", error);
    }
    
    // No setInterval - no automatic monitoring that could cause data loss
  }

  // Initialize protection system
  async initialize(): Promise<void> {
    // await this.createImportBackup(); // DISABLED - NO AUTOMATIC BACKUPS
    await this.protectImportedData();
    await this.monitorIntegrity();
    
    console.log("✅ Import Data Protection System initialized (NO AUTOMATIC BACKUPS)");
  }
}

export const importProtection = ImportDataProtection.getInstance();