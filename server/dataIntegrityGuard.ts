// Data Integrity Guard - Ultimate Protection System
import { db } from "./db";
import { users, drivers, admins, products, services, bookings, reviews } from "@shared/schema";

export class DataIntegrityGuard {
  private static instance: DataIntegrityGuard;
  private criticalTables = ['users', 'drivers', 'admins', 'products', 'services', 'bookings', 'reviews'];
  
  static getInstance(): DataIntegrityGuard {
    if (!DataIntegrityGuard.instance) {
      DataIntegrityGuard.instance = new DataIntegrityGuard();
    }
    return DataIntegrityGuard.instance;
  }

  // Auto-backup critical data
  async createBackup(): Promise<void> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        users: await db.select().from(users),
        drivers: await db.select().from(drivers),
        admins: await db.select().from(admins),
        products: await db.select().from(products),
        services: await db.select().from(services),
        bookings: await db.select().from(bookings),
        reviews: await db.select().from(reviews)
      };
      
      console.log("🛡️ Data backup created:", {
        users: backup.users.length,
        drivers: backup.drivers.length,
        admins: backup.admins.length,
        products: backup.products.length,
        services: backup.services.length,
        bookings: backup.bookings.length,
        reviews: backup.reviews.length
      });
      
      // Store backup in memory for quick recovery
      this.lastBackup = backup;
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
    }
  }

  private lastBackup: any = null;

  // Check data integrity
  async verifyIntegrity(): Promise<boolean> {
    try {
      const userCount = (await db.select().from(users)).length;
      const driverCount = (await db.select().from(drivers)).length;
      const adminCount = (await db.select().from(admins)).length;
      const productCount = (await db.select().from(products)).length;
      const serviceCount = (await db.select().from(services)).length;

      const isIntegrityOk = userCount > 0 && driverCount > 0 && adminCount > 0 && 
                           productCount > 0 && serviceCount > 0;

      if (!isIntegrityOk) {
        console.warn("⚠️ Data integrity compromised:", {
          users: userCount,
          drivers: driverCount,
          admins: adminCount,
          products: productCount,
          services: serviceCount
        });
      } else {
        console.log("✅ Data integrity verified - all critical tables have data");
      }

      return isIntegrityOk;
    } catch (error) {
      console.error("❌ Integrity check failed:", error);
      return false;
    }
  }

  // Emergency data recovery
  async emergencyRestore(): Promise<void> {
    if (!this.lastBackup) {
      console.error("❌ No backup available for restoration");
      return;
    }

    try {
      console.log("🚨 Starting emergency data restoration...");
      
      // Restore critical data
      if (this.lastBackup.admins?.length > 0) {
        await db.insert(admins).values(this.lastBackup.admins).onConflictDoNothing();
      }
      
      if (this.lastBackup.products?.length > 0) {
        await db.insert(products).values(this.lastBackup.products).onConflictDoNothing();
      }
      
      if (this.lastBackup.services?.length > 0) {
        await db.insert(services).values(this.lastBackup.services).onConflictDoNothing();
      }

      console.log("✅ Emergency restoration completed");
    } catch (error) {
      console.error("❌ Emergency restoration failed:", error);
    }
  }

  // Monitor data changes
  async startMonitoring(): Promise<void> {
    console.log("🔍 Data Integrity Guard monitoring started");
    
    // Create initial backup
    await this.createBackup();
    
    // Verify integrity every 30 minutes
    setInterval(async () => {
      const isOk = await this.verifyIntegrity();
      if (!isOk) {
        console.log("🚨 Data integrity issue detected - initiating recovery procedures");
        await this.emergencyRestore();
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Create backup every hour
    setInterval(async () => {
      await this.createBackup();
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Export singleton instance
export const dataGuard = DataIntegrityGuard.getInstance();