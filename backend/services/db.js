import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let SQL; // sql.js module
let db;  // SQL.Database instance
let dbFilePath;

function readFileUtf8(p) {
  return fs.readFileSync(p, 'utf-8');
}

export async function initDb() {
  SQL = await initSqlJs({ locateFile: (f) => path.join(__dirname, '../../node_modules/sql.js/dist', f) });
  const isTest = process.env.NODE_ENV === 'test';
  dbFilePath = isTest ? null : path.join(__dirname, '../../database/app.db');

  if (!isTest && fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    db = new SQL.Database();
  }
  // Always ensure schema exists (uses IF NOT EXISTS)
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schemaSql = readFileUtf8(schemaPath);
  db.exec(schemaSql);
}

export async function seedIfEmpty() {
  const countRow = get('SELECT COUNT(*) as c FROM profiles');
  const needsSeed = !countRow || countRow.c === 0;
  let placeholderDetected = false;
  if (!needsSeed) {
    const existing = get('SELECT email FROM profiles LIMIT 1');
    placeholderDetected = existing && existing.email === 'fusion@example.com';
  }
  if (needsSeed || placeholderDetected) {
    // clear tables before reseed
    db.exec(`DELETE FROM profile_projects;DELETE FROM profile_skills;DELETE FROM project_skills;DELETE FROM work_skills;DELETE FROM projects;DELETE FROM work;DELETE FROM profiles;`);
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    const seedSql = readFileUtf8(seedPath);
    db.exec(seedSql);
    await persist();
  }
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out = [];
  while (stmt.step()) out.push(stmt.getAsObject());
  stmt.free();
  return out;
}

export function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0];
}

export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  const idRow = get('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: idRow ? idRow.id : undefined };
}

export function begin() { db.exec('BEGIN'); }
export function commit() { db.exec('COMMIT'); }
export function rollback() { db.exec('ROLLBACK'); }

export async function persist() {
  if (!dbFilePath) return; // in-memory for tests
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

export function getDb() {
  return db;
}
