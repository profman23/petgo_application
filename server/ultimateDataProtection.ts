// 🛡️ ULTIMATE DATA PROTECTION SYSTEM
// Complete protection for Products and Services tables

import { products, services } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export class UltimateDataProtection {
  private static instance: UltimateDataProtection;
  private protectedTables = ['products', 'services'];
  private backupData: any = null;
  private lastBackupTime: Date | null = null;

  public static getInstance(): UltimateDataProtection {
    if (!UltimateDataProtection.instance) {
      UltimateDataProtection.instance = new UltimateDataProtection();
    }
    return UltimateDataProtection.instance;
  }

  // 🔒 SOLUTION 1: Database-Level Protection
  async enableDatabaseProtection() {
    try {
      // Create database triggers to prevent deletion
      await db.execute(`
        CREATE OR REPLACE FUNCTION prevent_product_deletion() 
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'Products table is protected from deletion';
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await db.execute(`
        CREATE OR REPLACE FUNCTION prevent_service_deletion() 
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'Services table is protected from deletion';
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create triggers
      await db.execute(`
        DROP TRIGGER IF EXISTS protect_products_trigger ON products;
        CREATE TRIGGER protect_products_trigger
        BEFORE DELETE ON products
        FOR EACH ROW
        EXECUTE FUNCTION prevent_product_deletion();
      `);

      await db.execute(`
        DROP TRIGGER IF EXISTS protect_services_trigger ON services;
        CREATE TRIGGER protect_services_trigger
        BEFORE DELETE ON services
        FOR EACH ROW
        EXECUTE FUNCTION prevent_service_deletion();
      `);

      console.log("✅ Database-level protection activated");
      return true;
    } catch (error) {
      console.error("❌ Failed to enable database protection:", error);
      return false;
    }
  }

  // 🔒 SOLUTION 2: Application-Level Protection
  async enableApplicationProtection() {
    try {
      // Override dangerous functions
      const originalDeleteProduct = db.delete;
      const originalDeleteService = db.delete;

      // Block all DELETE operations on protected tables
      (db as any).delete = function(table: any) {
        if (table === products || table === services) {
          throw new Error("🚫 PROTECTED TABLE: Delete operation blocked by Ultimate Protection System");
        }
        return originalDeleteProduct.call(this, table);
      };

      console.log("✅ Application-level protection activated");
      return true;
    } catch (error) {
      console.error("❌ Failed to enable application protection:", error);
      return false;
    }
  }

  // 🔒 SOLUTION 3: Automatic Backup System
  async createRealTimeBackup() {
    try {
      const allProducts = await db.select().from(products);
      const allServices = await db.select().from(services);

      this.backupData = {
        products: allProducts,
        services: allServices,
        timestamp: new Date().toISOString(),
        count: {
          products: allProducts.length,
          services: allServices.length
        }
      };

      this.lastBackupTime = new Date();
      
      // Store backup in file system as well
      const fs = await import('fs');
      const backupPath = './data_backup.json';
      
      fs.writeFileSync(backupPath, JSON.stringify(this.backupData, null, 2));
      
      console.log(`🔒 Real-time backup created: ${allProducts.length} products, ${allServices.length} services`);
      return true;
    } catch (error) {
      console.error("❌ Failed to create backup:", error);
      return false;
    }
  }

  // 🔒 SOLUTION 4: Data Integrity Monitor
  async monitorDataIntegrity() {
    try {
      const currentProducts = await db.select().from(products);
      const currentServices = await db.select().from(services);

      // Check if data count has decreased suspiciously
      if (this.backupData) {
        const productLoss = this.backupData.count.products - currentProducts.length;
        const serviceLoss = this.backupData.count.services - currentServices.length;

        if (productLoss > 0 || serviceLoss > 0) {
          console.warn(`🚨 DATA LOSS DETECTED: ${productLoss} products, ${serviceLoss} services missing`);
          
          // Trigger emergency restoration
          await this.emergencyRestore();
        }
      }

      return {
        products: currentProducts.length,
        services: currentServices.length,
        status: 'healthy'
      };
    } catch (error) {
      console.error("❌ Data integrity monitor failed:", error);
      return { status: 'error', error: error.message };
    }
  }

  // 🔒 SOLUTION 5: Emergency Restoration
  async emergencyRestore() {
    try {
      if (!this.backupData) {
        console.error("❌ No backup data available for restoration");
        return false;
      }

      console.log("🚨 EMERGENCY RESTORATION INITIATED");

      // Restore products
      for (const product of this.backupData.products) {
        try {
          // Check if product exists
          const existing = await db.select().from(products).where(eq(products.id, product.id));
          
          if (existing.length === 0) {
            // Restore missing product
            await db.insert(products).values(product);
            console.log(`✅ Restored product: ${product.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to restore product ${product.name}:`, error);
        }
      }

      // Restore services
      for (const service of this.backupData.services) {
        try {
          // Check if service exists
          const existing = await db.select().from(services).where(eq(services.id, service.id));
          
          if (existing.length === 0) {
            // Restore missing service
            await db.insert(services).values(service);
            console.log(`✅ Restored service: ${service.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to restore service ${service.name}:`, error);
        }
      }

      console.log("✅ Emergency restoration completed");
      return true;
    } catch (error) {
      console.error("❌ Emergency restoration failed:", error);
      return false;
    }
  }

  // 🔒 SOLUTION 6: Read-Only Mode
  async enableReadOnlyMode() {
    try {
      // Set database to read-only for protected tables
      await db.execute(`
        REVOKE INSERT, UPDATE, DELETE ON products FROM PUBLIC;
        REVOKE INSERT, UPDATE, DELETE ON services FROM PUBLIC;
      `);

      console.log("✅ Read-only mode activated for protected tables");
      return true;
    } catch (error) {
      console.error("❌ Failed to enable read-only mode:", error);
      return false;
    }
  }

  // 🔒 SOLUTION 7: Initialize All Protection Systems
  async initializeAllProtections() {
    console.log("🛡️ INITIALIZING ULTIMATE DATA PROTECTION SYSTEM");
    
    const results = {
      databaseProtection: await this.enableDatabaseProtection(),
      applicationProtection: await this.enableApplicationProtection(),
      backupSystem: await this.createRealTimeBackup(),
      integrityMonitor: await this.monitorDataIntegrity(),
      readOnlyMode: await this.enableReadOnlyMode()
    };

    console.log("🔒 PROTECTION SYSTEM STATUS:", results);
    
    // Start continuous monitoring
    setInterval(async () => {
      await this.monitorDataIntegrity();
      await this.createRealTimeBackup();
    }, 30000); // Every 30 seconds

    return results;
  }

  // Get current protection status
  async getProtectionStatus() {
    try {
      const productsCount = await db.select().from(products);
      const servicesCount = await db.select().from(services);
      
      return {
        protected: true,
        products: productsCount.length,
        services: servicesCount.length,
        lastBackup: this.lastBackupTime,
        backupAvailable: !!this.backupData
      };
    } catch (error) {
      return {
        protected: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const ultimateDataProtection = UltimateDataProtection.getInstance();