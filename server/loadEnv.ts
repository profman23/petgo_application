// MUST be imported before any other module that reads process.env
// Loads .env.<APP_ENV> (defaults to .env.dev)
import dotenv from "dotenv";
import path from "path";

const APP_ENV = process.env.APP_ENV || "dev";
const envFile = `.env.${APP_ENV}`;
const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

if (result.error) {
  // Fallback to default .env
  const fallback = dotenv.config();
  if (fallback.error) {
    console.error(`❌ Could not load ${envFile} or .env:`, result.error.message);
  } else {
    console.warn(`⚠️  ${envFile} not found, fell back to .env`);
  }
} else {
  console.log(`🔧 Loaded environment from ${envFile} (APP_ENV=${APP_ENV})`);
}
