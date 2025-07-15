import { Pool } from '@neondatabase/serverless';

// Database Protection System - Prevents accidental DROP/DELETE operations
export class DatabaseProtection {
  private static instance: DatabaseProtection;
  private protectedOperations = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER TABLE'];
  private allowedExceptions = [
    'DELETE FROM sessions WHERE expire <',  // Allow session cleanup
    'DELETE FROM otp_verifications WHERE expires_at <',  // Allow OTP cleanup
  ];

  static getInstance(): DatabaseProtection {
    if (!DatabaseProtection.instance) {
      DatabaseProtection.instance = new DatabaseProtection();
    }
    return DatabaseProtection.instance;
  }

  /**
   * Validates SQL query to prevent dangerous operations
   */
  validateQuery(query: string | object): { allowed: boolean; reason?: string } {
    // Handle both string queries and Drizzle query objects
    const queryString = typeof query === 'string' ? query : query.toString();
    const upperQuery = queryString.trim().toUpperCase();
    
    // Enhanced protection for imported data
    if (upperQuery.includes('DELETE FROM PRODUCTS') || upperQuery.includes('DROP TABLE PRODUCTS') || upperQuery.includes('TRUNCATE PRODUCTS')) {
      return {
        allowed: false,
        reason: `🔒 IMPORT DATA PROTECTION: Products table contains imported data and cannot be deleted`
      };
    }
    
    if (upperQuery.includes('DELETE FROM SERVICES') || upperQuery.includes('DROP TABLE SERVICES') || upperQuery.includes('TRUNCATE SERVICES')) {
      return {
        allowed: false,
        reason: `🔒 IMPORT DATA PROTECTION: Services table contains imported data and cannot be deleted`
      };
    }
    
    // Check for protected operations
    for (const operation of this.protectedOperations) {
      if (upperQuery.startsWith(operation)) {
        // Check if it's an allowed exception
        const isException = this.allowedExceptions.some(exception => 
          upperQuery.startsWith(exception.toUpperCase())
        );
        
        if (!isException) {
          return {
            allowed: false,
            reason: `BLOCKED: ${operation} operations are not allowed for data protection`
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Protected query execution wrapper
   */
  async executeProtectedQuery(pool: Pool, query: string, params?: any[]): Promise<any> {
    const validation = this.validateQuery(query);
    
    if (!validation.allowed) {
      console.error(`🛡️ Database Protection: ${validation.reason}`);
      console.error(`🚫 Blocked Query: ${query}`);
      throw new Error(`Database Protection: ${validation.reason}`);
    }

    console.log(`✅ Database Protection: Query approved - ${query.substring(0, 50)}...`);
    return pool.query(query, params);
  }

  /**
   * Log protection status
   */
  logProtectionStatus(): void {
    console.log('🛡️ Database Protection System Active');
    console.log('📋 Protected Operations:', this.protectedOperations);
    console.log('✅ Allowed Exceptions:', this.allowedExceptions.length);
  }
}

export const dbProtection = DatabaseProtection.getInstance();