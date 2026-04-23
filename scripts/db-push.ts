// Loads .env.<env> then runs drizzle-kit push.
// Usage: tsx scripts/db-push.ts <dev|staging|production>
import dotenv from "dotenv";
import path from "path";
import { spawn } from "child_process";
import readline from "readline";

const env = process.argv[2];
if (!env || !["dev", "staging", "production"].includes(env)) {
  console.error("Usage: tsx scripts/db-push.ts <dev|staging|production>");
  process.exit(1);
}

const envFile = `.env.${env}`;
const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });
if (result.error) {
  console.error(`❌ Could not load ${envFile}:`, result.error.message);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error(`❌ DATABASE_URL not set in ${envFile}`);
  process.exit(1);
}

const host = process.env.DATABASE_URL.match(/@([^/]+)/)?.[1] || "unknown";
console.log(`\n🔧 About to push schema to ${env.toUpperCase()} (${host})`);

const run = () => {
  const drizzle = spawn("npx", ["drizzle-kit", "push"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  drizzle.on("exit", (code) => process.exit(code ?? 0));
};

if (env === "production") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("⚠️  Production push! Type 'yes' to confirm: ", (answer) => {
    rl.close();
    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Aborted.");
      process.exit(1);
    }
    run();
  });
} else {
  run();
}
