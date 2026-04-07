import { openDatabase } from "expo-sqlite";

const db = openDatabase("pathsmart.db");

// Initialize tables
db.transaction(tx => {
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT
    );`
  );
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS stalls (
      id TEXT PRIMARY KEY,
      name TEXT,
      nodes TEXT,
      products TEXT,
      stall_endNode TEXT
    );`
  );
  // Log success
  console.log("Database tables created successfully.");
});

export default db;
