import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'mantlefrac.db');
export const db: Database.Database = new Database(dbPath);

// Initialize Tables
export function initDB() {
  console.log('Initializing SQLite database...');

  // Vaults Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaults (
      vault_id TEXT PRIMARY KEY,
      nft_contract TEXT,
      token_id TEXT,
      share_token TEXT,
      creator TEXT,
      custodian TEXT,
      policy TEXT,
      state INTEGER,
      max_supply TEXT,
      created_at INTEGER
    )
  `);

  // Listings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      listing_id TEXT PRIMARY KEY,
      vault_id TEXT,
      seller TEXT,
      share_amount TEXT,
      price_asset TEXT,
      price_amount TEXT,
      duration INTEGER,
      status INTEGER,
      created_at INTEGER
    )
  `);

  // App State (for sync progress)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  console.log('Database initialized.');
}
