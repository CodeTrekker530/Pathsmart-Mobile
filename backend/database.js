import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("pathsmart.db");

// Initialize tables
const initDatabase = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS stalls (
        stall_id TEXT PRIMARY KEY,
        stall_name TEXT,
        node_id TEXT,
        stall_endNode TEXT
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS listing (
        listing_id TEXT PRIMARY KEY,
        stall_id TEXT,
        pns_id TEXT
      );
    `);

    console.log("Database tables created successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

export { initDatabase };
export default db;
