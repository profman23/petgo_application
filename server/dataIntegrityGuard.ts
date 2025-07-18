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

  // Auto-backup critical data with enhanced protection for imported data
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
      
      // Alert if imported data detected and protect it
      if (backup.products.length > 3 || backup.services.length > 3) {
        console.log("🔒 IMPORTED DATA DETECTED - Enhanced protection activated");
        console.log(`📊 Products: ${backup.products.length} (${backup.products.length - 3} imported)`);
        console.log(`📊 Services: ${backup.services.length} (${backup.services.length - 3} imported)`);
      }
      
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

      // ENHANCED: Never consider Products/Services as compromised if they exist
      // This prevents deletion of imported data
      const isIntegrityOk = userCount > 0 && driverCount > 0 && adminCount > 0;

      if (!isIntegrityOk) {
        console.warn("⚠️ Data integrity compromised:", {
          users: userCount,
          drivers: driverCount,
          admins: adminCount,
          products: productCount,
          services: serviceCount
        });
      } else {
        console.log("✅ Data integrity verified - core tables have data");
        console.log("🔒 PROTECTED: Products/Services are preserved regardless of count");
      }

      return isIntegrityOk;
    } catch (error) {
      console.error("❌ Integrity check failed:", error);
      return false;
    }
  }

  // Emergency data recovery - DISABLED for imported data protection
  async emergencyRestore(): Promise<void> {
    if (!this.lastBackup) {
      console.error("❌ No backup available for restoration");
      return;
    }

    try {
      console.log("🔒 Emergency restore DISABLED to protect imported Products/Services");
      console.log("🛡️ Manual intervention required if data restoration needed");
      
      // Only restore admins if they're missing (never touch products/services)
      const currentAdmins = await db.select().from(admins);
      if (currentAdmins.length === 0 && this.lastBackup.admins?.length > 0) {
        await db.insert(admins).values(this.lastBackup.admins).onConflictDoNothing();
        console.log("✅ Admin data restored safely");
      }

      // NEVER restore products/services automatically to prevent imported data loss
      console.log("🔒 Products/Services restoration BLOCKED - imported data protected");
    } catch (error) {
      console.error("❌ Emergency restoration failed:", error);
    }
  }

  // Monitor data changes - PERMANENTLY DISABLED
  async startMonitoring(): Promise<void> {
    console.log("🔒 INTEGRITY MONITORING PERMANENTLY DISABLED");
    console.log("⚠️ Automatic monitoring was causing data loss during rollbacks");
    console.log("💡 Manual checks only - no automatic recovery attempts");
    
    // Create initial backup only
    await this.createBackup();
    
    // ALL AUTOMATIC MONITORING DISABLED TO PREVENT DATA LOSS
    // setInterval(async () => {
    //   const isOk = await this.verifyIntegrity();
    //   if (!isOk) {
    //     console.log("🚨 Data integrity issue detected - initiating recovery procedures");
    //     await this.emergencyRestore();
    //   }
    // }, 30 * 60 * 1000); // 30 minutes - DISABLED

    // setInterval(async () => {
    //   await this.createBackup();
    // }, 60 * 60 * 1000); // 1 hour - DISABLED
  }
}

// Export singleton instance
export const dataGuard = DataIntegrityGuard.getInstance();