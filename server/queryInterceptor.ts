// Query Interceptor - Final protection layer for all SQL operations
import { dbProtection } from './dbProtection';
import { SQLValidator } from './sqlValidator';

export class QueryInterceptor {
  /**
   * Intercepts and validates all SQL queries before execution
   */
  static interceptQuery(query: string, context?: string): void {
    console.log(`🔍 Intercepting SQL Query${context ? ` (${context})` : ''}:`, query.substring(0, 100) + '...');
    
    // First layer: Database Protection System
    const dbValidation = dbProtection.validateQuery(query);
    if (!dbValidation.allowed) {
      console.error(`🚫 BLOCKED by Database Protection: ${dbValidation.reason}`);
      throw new Error(`Database Protection: ${dbValidation.reason}`);
    }

    // Second layer: SQL Validator
    const sqlValidation = SQLValidator.validateQuery(query);
    if (!sqlValidation.isValid) {
      console.error(`🛡️ BLOCKED by SQL Validator: ${sqlValidation.error}`);
      throw new Error(`SQL Validator: ${sqlValidation.error}`);
    }

    console.log(`✅ Query validated and approved for execution`);
  }

  /**
   * Safe query execution with full protection
   */
  static safeExecute(query: string, params?: any[], context?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.interceptQuery(query, context);
        
        // If we reach here, query is safe to execute
        // Note: Actual execution would be handled by the calling code
        console.log(`🔒 Safe execution approved for query in context: ${context || 'unknown'}`);
        resolve({ approved: true, query, params });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export singleton instance
export const queryInterceptor = QueryInterceptor;