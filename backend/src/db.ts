import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(rootDir, 'migrations');

// Load environment variables early so connectionString picks up .env
dotenv.config({ path: path.join(rootDir, '.env') });

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/PROPOSAL_MANAGEMENT_SYSTEM';

const pool = new Pool({ connectionString });

function redactedConnectionString() {
  try {
    const url = new URL(connectionString);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '[invalid DATABASE_URL]';
  }
}

// Map the column names PostgreSQL returns (all lower-case by default) to the
// camelCase names the rest of the codebase expects. We keep the original keys
// and add camelCase aliases so existing usages continue to work.
const columnAliasMap: Record<string, string> = {
  // Shared
  passwordhash: 'passwordHash',
  firstname: 'firstName',
  lastname: 'lastName',
  isactive: 'isActive',
  createdat: 'createdAt',
  updatedat: 'updatedAt',

  // Clients
  companyname: 'companyName',
  billingaddress: 'billingAddress',
  shippingaddress: 'shippingAddress',
  taxid: 'taxId',
  taxexempt: 'taxExempt',
  defaultcurrency: 'defaultCurrency',
  paymentterms: 'paymentTerms',
  contactname: 'contactName',
  contactemail: 'contactEmail',
  contactphone: 'contactPhone',

  // Devices
  unitcost: 'unitCost',
  unitprice: 'unitPrice',

  // Proposals
  proposalnumber: 'proposalNumber',
  clientid: 'clientId',
  createdby: 'createdBy',
  taxrate: 'taxRate',
  taxamount: 'taxAmount',
  totalamount: 'totalAmount',
  validuntil: 'validUntil',
  termsconditions: 'termsConditions',
  parentid: 'parentId',
  ispreviewed: 'isPreviewed',
  proposaltitle: 'proposalTitle',

  // Proposal items
  proposalid: 'proposalId',
  inventoryitemid: 'inventoryItemId',
  snapshotname: 'snapshotName',
  snapshotmake: 'snapshotMake',
  snapshotmodel: 'snapshotModel',
  snapshotprice: 'snapshotPrice',
  snapshotspecs: 'snapshotSpecs',
  linetotal: 'lineTotal',

  // Audit logs
  recordid: 'recordId',
  oldvalues: 'oldValues',
  newvalues: 'newValues',
  userid: 'userId',
  ipaddress: 'ipAddress',
  useragent: 'userAgent',
};

function addCamelCaseAliases<T extends Record<string, any>>(row: T | undefined): T | undefined {
  if (!row) return row;

  const mapped: Record<string, any> = { ...row };

  for (const [key, value] of Object.entries(row)) {
    const alias = columnAliasMap[key] || columnAliasMap[key.toLowerCase()];
    if (alias && mapped[alias] === undefined) {
      mapped[alias] = value;
    }
  }

  return mapped as T;
}

type DbClient = {
  all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
  run(sql: string, ...params: any[]): Promise<{ rowCount: number }>; // mirrors sqlite.run return
  exec(sql: string): Promise<void>;
  client: PoolClient;
};

let clientInstance: PoolClient | null = null;
let dbInstance: DbClient | null = null;

function mapPlaceholders(sql: string, params: any[]) {
  let idx = 0;
  const text = sql.replace(/\?/g, () => `$${++idx}`);

  // Flatten arrays so "IN (?, ?, ?)" style queries can pass an array and
  // still supply one value per placeholder.
  const values: any[] = [];
  for (const param of params) {
    if (Array.isArray(param)) {
      values.push(...param);
    } else {
      values.push(param);
    }
  }

  return { text, values };
}

async function getClient(): Promise<PoolClient> {
  if (clientInstance) return clientInstance;
  clientInstance = await pool.connect();
  return clientInstance;
}

function createDb(client: PoolClient): DbClient {
  return {
    client,
    async all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
      const { text, values } = mapPlaceholders(sql, params);
      const res = await client.query(text, values);
      const mappedRows = res.rows.map((row) => addCamelCaseAliases(row)) as T[];
      return mappedRows;
    },
    async get<T = any>(sql: string, ...params: any[]): Promise<T | undefined> {
      const rows = await this.all<T>(sql, ...params);
      return rows[0];
    },
    async run(sql: string, ...params: any[]): Promise<{ rowCount: number }> {
      const { text, values } = mapPlaceholders(sql, params);
      const res = await client.query(text, values);
      return { rowCount: res.rowCount ?? 0 };
    },
    async exec(sql: string): Promise<void> {
      await client.query(sql);
    },
  };
}

export async function getDb(): Promise<DbClient> {
  if (dbInstance) return dbInstance;
  const client = await getClient();
  dbInstance = createDb(client);
  return dbInstance;
}

export async function verifyDbConnection() {
  try {
    const db = await getDb();
    await db.get('SELECT 1');
    return { ok: true, connection: redactedConnectionString() };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { ok: false, connection: redactedConnectionString(), error };
  }
}

export async function runMigrations() {
  const db = await getDb();
  const client = db.client;

  await db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, filename TEXT NOT NULL UNIQUE, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());'
  );

  let files: string[] = [];
  try {
    files = await fs.readdir(migrationsDir);
  } catch {
    files = [];
  }

  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const existing = await db.get<{ filename: string }>(
      'SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1',
      file
    );

    if (existing) continue;

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');

    await client.query('BEGIN;');
    try {
      await db.exec(sql);
      await db.run(
        'INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)',
        file,
        new Date().toISOString()
      );
      await client.query('COMMIT;');
    } catch (error) {
      await client.query('ROLLBACK;');
      throw error;
    }
  }
}
