CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  billingAddress TEXT NOT NULL,
  shippingAddress TEXT,
  location TEXT,
  taxId TEXT,
  taxExempt INTEGER NOT NULL DEFAULT 0,
  defaultCurrency TEXT NOT NULL,
  paymentTerms TEXT NOT NULL,
  contactName TEXT,
  contactEmail TEXT,
  contactPhone TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  category TEXT,
  make TEXT,
  model TEXT,
  unitCost REAL NOT NULL,
  unitPrice REAL NOT NULL,
  specifications TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  proposalNumber TEXT NOT NULL,
  clientId TEXT NOT NULL,
  createdBy TEXT,
  status TEXT NOT NULL,
  subtotal REAL NOT NULL,
  taxRate REAL NOT NULL,
  taxAmount REAL NOT NULL,
  totalAmount REAL NOT NULL,
  validUntil TEXT,
  notes TEXT,
  termsConditions TEXT,
  version INTEGER NOT NULL,
  parentId TEXT,
  isPreviewed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (clientId) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS proposal_items (
  id TEXT PRIMARY KEY,
  proposalId TEXT NOT NULL,
  inventoryItemId TEXT,
  snapshotName TEXT,
  snapshotMake TEXT,
  snapshotModel TEXT,
  snapshotPrice REAL,
  snapshotSpecs TEXT,
  quantity INTEGER NOT NULL,
  discount REAL,
  lineTotal REAL NOT NULL,
  FOREIGN KEY (proposalId) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  recordId TEXT NOT NULL,
  action TEXT NOT NULL,
  oldValues TEXT,
  newValues TEXT,
  userId TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proposal_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value INTEGER NOT NULL
);

INSERT INTO proposal_sequence (id, value)
VALUES (1, 1000)
ON CONFLICT (id) DO NOTHING;
