import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { dbProtection } from './dbProtection';
import { importProtection } from './importDataProtection';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Protected database pool with query validation
class ProtectedPool extends Pool {
  async query(text: string | object, params?: any[]): Promise<any> {
    // Validate query through protection system
    const validation = dbProtection.validateQuery(text);
    
    if (!validation.allowed) {
      console.error(`🛡️ Database Protection: ${validation.reason}`);
      console.error(`🚫 Blocked Query: ${typeof text === 'string' ? text : text.toString()}`);
      throw new Error(`Database Protection: ${validation.reason}`);
    }

    return super.query(text as string, params);
  }
}

export const pool = new ProtectedPool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Initialize database schema
export async function initDatabase() {
  console.log("🔧 Initializing database schema...");
  
  // Log protection status
  dbProtection.logProtectionStatus();
  
  try {
    // Create pet_attachments table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pet_attachments (
        id SERIAL PRIMARY KEY,
        pet_id INTEGER NOT NULL,
        booking_id INTEGER NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        file_url TEXT,
        description TEXT,
        uploaded_by VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create products table if it doesn't exist (preserve existing data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        description TEXT,
        description_ar TEXT,
        price NUMERIC(10,2) NOT NULL,
        category VARCHAR(100),
        category_ar VARCHAR(100),
        sku VARCHAR(50),
        unit VARCHAR(50),
        unit_ar VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create services table if it doesn't exist (preserve existing data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        description TEXT,
        description_ar TEXT,
        price NUMERIC(10,2) NOT NULL,
        category VARCHAR(100),
        category_ar VARCHAR(100),
        duration INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create import_history table if it doesn't exist (preserve existing data)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_history (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        records_imported INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_skipped INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'completed',
        error_message TEXT,
        imported_by VARCHAR(255),
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Database schema initialized successfully with protection enabled');
    
    // Initialize import data protection system
    await importProtection.initialize();
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}