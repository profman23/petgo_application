// SQL Query Validator - Additional layer of protection
export class SQLValidator {
  private static dangerousPatterns = [
    /DROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX|FUNCTION|PROCEDURE)/i,
    /DELETE\s+FROM\s+(?!sessions|otp_verifications)/i,  // Allow only session/OTP cleanup
    /TRUNCATE\s+TABLE/i,
    /ALTER\s+TABLE\s+\w+\s+(DROP|RENAME)/i,
    /CREATE\s+OR\s+REPLACE/i,
    /EXEC\s*\(/i,
    /EXECUTE\s*\(/i
  ];

  private static protectedTables = [
    'users', 'drivers', 'rides', 'pets', 'bookings', 
    'services', 'products', 'pet_attachments', 'pet_vitals',
    'invoice_items', 'invoice_status', 'import_history'
  ];

  static validateQuery(query: string): { isValid: boolean; error?: string } {
    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(cleanQuery)) {
        return {
          isValid: false,
          error: `🚫 BLOCKED: Query contains dangerous operation - ${pattern.source}`
        };
      }
    }

    // Extra protection for DELETE operations on protected tables
    for (const table of this.protectedTables) {
      const deletePattern = new RegExp(`DELETE\\s+FROM\\s+${table}`, 'i');
      if (deletePattern.test(cleanQuery)) {
        return {
          isValid: false,
          error: `🛡️ PROTECTED: DELETE operations on '${table}' table are not allowed`
        };
      }
    }

    return { isValid: true };
  }

  static logProtectedTables(): void {
    console.log('🛡️ Protected Tables:', this.protectedTables.join(', '));
  }
}