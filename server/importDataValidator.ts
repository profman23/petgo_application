// Import Data Validator - Prevents accidental deletion of imported data
import { db } from "./db";
import { products, services } from "@shared/schema";

export class ImportDataValidator {
  
  // Check if operation would affect imported data
  static async validateOperation(operation: string, table: string): Promise<{ allowed: boolean; warning?: string }> {
    try {
      if (operation.toUpperCase().includes('DELETE') || operation.toUpperCase().includes('DROP') || operation.toUpperCase().includes('TRUNCATE')) {
        
        if (table === 'products' || operation.includes('products')) {
          const productCount = (await db.select().from(products)).length;
          if (productCount > 3) {
            return {
              allowed: false,
              warning: `🚨 IMPORT DATA PROTECTION: Cannot delete products table - contains ${productCount} items including ${productCount - 3} imported products`
            };
          }
        }
        
        if (table === 'services' || operation.includes('services')) {
          const serviceCount = (await db.select().from(services)).length;
          if (serviceCount > 3) {
            return {
              allowed: false,
              warning: `🚨 IMPORT DATA PROTECTION: Cannot delete services table - contains ${serviceCount} items including ${serviceCount - 3} imported services`
            };
          }
        }
      }
      
      return { allowed: true };
    } catch (error) {
      console.error("❌ Import data validation error:", error);
      return { allowed: true }; // Allow operation if validation fails
    }
  }
  
  // Log protection status
  static async logProtectionStatus(): Promise<void> {
    try {
      const productCount = (await db.select().from(products)).length;
      const serviceCount = (await db.select().from(services)).length;
      
      if (productCount > 3 || serviceCount > 3) {
        console.log("🔒 IMPORT DATA PROTECTION ACTIVE");
        console.log(`📊 Protected Products: ${productCount} (${Math.max(0, productCount - 3)} imported)`);
        console.log(`📊 Protected Services: ${serviceCount} (${Math.max(0, serviceCount - 3)} imported)`);
      } else {
        console.log("🔓 Import Data Protection: Only default data present");
      }
    } catch (error) {
      console.error("❌ Protection status check failed:", error);
    }
  }
}

export const importValidator = ImportDataValidator;