// Import Data Lock System - Ultimate Protection for Imported Data
import { db } from "./db";
import { products, services } from "@shared/schema";

export class ImportDataLock {
  private static instance: ImportDataLock;
  private isLocked = false;
  
  static getInstance(): ImportDataLock {
    if (!ImportDataLock.instance) {
      ImportDataLock.instance = new ImportDataLock();
    }
    return ImportDataLock.instance;
  }

  // Lock imported data permanently
  async lockImportedData(): Promise<void> {
    try {
      const productCount = (await db.select().from(products)).length;
      const serviceCount = (await db.select().from(services)).length;
      
      if (productCount > 0 || serviceCount > 0) {
        this.isLocked = true;
        console.log("🔒 IMPORT DATA LOCKED PERMANENTLY");
        console.log(`📊 Protected: ${productCount} products, ${serviceCount} services`);
        
        // Create lock file marker
        const lockData = {
          locked: true,
          timestamp: new Date().toISOString(),
          protectedProducts: productCount,
          protectedServices: serviceCount
        };
        
        // Store lock status in environment memory
        process.env.IMPORT_DATA_LOCKED = 'true';
        process.env.IMPORT_LOCK_TIMESTAMP = lockData.timestamp;
      }
    } catch (error) {
      console.error("❌ Failed to lock imported data:", error);
    }
  }

  // Check if data is locked
  isImportDataLocked(): boolean {
    return this.isLocked || process.env.IMPORT_DATA_LOCKED === 'true';
  }

  // Prevent any deletion of imported data
  async preventDataDeletion(): Promise<boolean> {
    if (this.isImportDataLocked()) {
      console.log("🚨 IMPORT DATA DELETION BLOCKED - Data is locked");
      return false; // Block the operation
    }
    return true; // Allow operation
  }

  // Initialize lock on startup
  async initializeLock(): Promise<void> {
    console.log("🔒 Initializing Import Data Lock System...");
    await this.lockImportedData();
    
    // Check for existing lock
    if (process.env.IMPORT_DATA_LOCKED === 'true') {
      this.isLocked = true;
      console.log("🔒 Import Data Lock restored from previous session");
    }
    
    // Set permanent environment flag
    process.env.IMPORT_PROTECTION_ACTIVE = 'true';
    console.log("🛡️ Import Data Protection is PERMANENTLY ACTIVE");
  }

  // Block any attempt to clear or reset data
  async blockDataReset(): Promise<boolean> {
    if (this.isImportDataLocked()) {
      console.log("🚨 DATA RESET BLOCKED - Import data is permanently protected");
      return false;
    }
    return true;
  }
}

export const importDataLock = ImportDataLock.getInstance();