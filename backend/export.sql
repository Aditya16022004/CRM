PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL UNIQUE, appliedAt TEXT NOT NULL);
INSERT INTO schema_migrations VALUES(1,'001_init.sql','2026-02-10T07:53:31.185Z');
INSERT INTO schema_migrations VALUES(2,'002_auth_and_indexes.sql','2026-02-10T08:04:01.683Z');
INSERT INTO schema_migrations VALUES(3,'003_admins.sql','2026-02-10T09:27:25.918Z');
INSERT INTO schema_migrations VALUES(4,'004_normalize_roles.sql','2026-02-10T09:54:43.307Z');
INSERT INTO schema_migrations VALUES(5,'005_projects.sql','2026-02-10T12:07:42.012Z');
INSERT INTO schema_migrations VALUES(6,'006_drop_projects.sql','2026-02-10T12:20:38.384Z');
INSERT INTO schema_migrations VALUES(7,'005_add_proposal_title.sql','2026-02-12T22:08:43.188Z');
CREATE TABLE clients (
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
INSERT INTO clients VALUES('2ad81d4a-f1ca-4d3f-8690-4e19acfd981f','Muthoot Finance','Beverly Park, Mira Road (E)','B-204, Marigold-1','Beverly Park, Mira Road (E)','29AAAGM0289C1ZF',0,'INR','Net 30','Utkarsh Singh','utkarshsingh@gmail.com','+918356960438',1,'2026-02-10T09:18:51.871Z','2026-02-10T09:18:51.871Z');
INSERT INTO clients VALUES('9343ef1e-e5ef-4cf5-849b-1d705e342ba4','BuildINT','Saki Vihar Road, L&T Park, Powai','408-412, Shrishti Plaza','Saki Vihar Road, L&T Park, Powai','27AAACM3025E1ZZ',0,'INR','Net 100','Aditya Tripathi','tripathi@gmail.com','+918356960438',1,'2026-02-10T12:32:27.760Z','2026-02-10T12:32:27.760Z');
CREATE TABLE devices (
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
INSERT INTO devices VALUES('64e351c6-f5df-408e-a661-cf97e376ad88','Canon DSLR','CCTV camera for survelliance','Unit','Camera','Canon','DD-PP-555',25.0,55.0,'{"unit":"Unit"}',1,'2026-02-10T09:31:41.694Z','2026-02-10T11:15:11.365Z');
INSERT INTO devices VALUES('108fbfe7-ac6d-461e-928c-4d8ece865f13','NEON','AC DEVICE FOR ENERGY SAVING','Unit','AC Device','EURONET','DS-DP-PP-55',80.0,100.0,'{"unit":"Unit"}',1,'2026-02-10T12:33:45.797Z','2026-02-10T12:33:45.797Z');
INSERT INTO devices VALUES('5104a876-92ed-49c3-ad02-cd0485496045','LIBI','Light IOT Device for Energy Saving.','Unit','Light Device','BuildINT','DD-PP-CC-55',10.0,30.0,'{"unit":"Unit"}',1,'2026-02-12T18:41:47.575Z','2026-02-12T18:41:47.575Z');
CREATE TABLE proposal_items (
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
INSERT INTO proposal_items VALUES('5533fdc4-927f-4407-9dc3-507ed47b57df','04001c66-d5cb-4304-9fc5-e64e89daddc4',NULL,'Canon DSLR','Canon','DD-PP-555',55.0,'{"unit":"Unit"}',4,0.0,220.0);
INSERT INTO proposal_items VALUES('3b923313-70cc-4ab9-bd37-343d0247692b','3a439b39-64a4-4dc3-a816-ac746c6a8334',NULL,'Canon DSLR','Canon','DD-PP-555',55.0,'{"unit":"Unit"}',5,0.0,275.0);
CREATE TABLE audit_logs (
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
INSERT INTO audit_logs VALUES('audit-1770716274739-n9pcyfjrr','Proposal','25f4ab1b-1344-4707-8a62-b6e8db2a0160','CREATE',NULL,'{"proposalNumber":"PROP-1000","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","createdBy":"Lovlesh Dagar","status":"DRAFT","totalAmount":295,"itemCount":1}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T09:37:54.739Z');
INSERT INTO audit_logs VALUES('audit-1770716303527-mmk4rb5bi','Proposal','ea164577-79cb-4315-af9e-7edc271b52dd','CREATE',NULL,'{"proposalNumber":"PROP-1001","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","createdBy":"Lovlesh Dagar","status":"DRAFT","totalAmount":295,"itemCount":1}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T09:38:23.527Z');
INSERT INTO audit_logs VALUES('audit-1770716714520-j1yjkfzr8','Device','64e351c6-f5df-408e-a661-cf97e376ad88','UPDATE','{"name":"Canon DSLR","category":"Camera","make":"Canon","model":"DD-PP-555","unitPrice":50}','{"name":"Canon DSLR","category":"Camera","make":"Canon","model":"DD-PP-555","unitPrice":50}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T09:45:14.520Z');
INSERT INTO audit_logs VALUES('audit-1770716749643-ddgf7rpir','Device','64e351c6-f5df-408e-a661-cf97e376ad88','UPDATE','{"name":"Canon DSLR","category":"Camera","make":"Canon","model":"DD-PP-555","unitPrice":50}','{"name":"Canon DSLR","category":"Camera","make":"Canon","model":"DD-PP-555","unitPrice":55}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T09:45:49.643Z');
INSERT INTO audit_logs VALUES('audit-1770716819975-i0tv2xofb','Proposal','223724f2-c13f-4421-974d-f72cf7d43c5c','CREATE',NULL,'{"proposalNumber":"PROP-1002","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","createdBy":"Lovlesh Dagar","status":"DRAFT","totalAmount":64.9,"itemCount":1}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T09:46:59.976Z');
INSERT INTO audit_logs VALUES('audit-1770722111383-0ywyokc2o','Device','64e351c6-f5df-408e-a661-cf97e376ad88','UPDATE','{"name":"Canon DSLR","category":"Camera","make":"Canon","model":"DD-PP-555","unitPrice":55}','{"name":"Canon DSLR","category":"Camera","make":"Canon","model":"DD-PP-555","unitPrice":55}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T11:15:11.383Z');
INSERT INTO audit_logs VALUES('audit-1770722133126-1ywbyss7p','Proposal','223724f2-c13f-4421-974d-f72cf7d43c5c','DELETE','{"proposalNumber":"PROP-1002","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","status":"DRAFT","totalAmount":64.9}',NULL,'498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T11:15:33.126Z');
INSERT INTO audit_logs VALUES('audit-1770725455562-ev11cufqg','Project','f5646a4d-0be0-49c7-9faa-2b3db2626052','CREATE',NULL,'{"clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","name":"CCTV Upgrade Phase 1","status":"COMPLETED"}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T12:10:55.562Z');
INSERT INTO audit_logs VALUES('audit-1770726747786-4zet0sgu1','Client','9343ef1e-e5ef-4cf5-849b-1d705e342ba4','CREATE',NULL,'{"companyName":"BuildINT","billingAddress":"Saki Vihar Road, L&T Park, Powai","taxId":"27AAACM3025E1ZZ"}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T12:32:27.786Z');
INSERT INTO audit_logs VALUES('audit-1770726825815-v1ue5qm6k','Device','108fbfe7-ac6d-461e-928c-4d8ece865f13','CREATE',NULL,'{"name":"NEON","category":"AC Device","make":"EURONET","model":"DS-DP-PP-55","unitPrice":100}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T12:33:45.815Z');
INSERT INTO audit_logs VALUES('audit-1770726942956-t09l2m78x','Proposal','9cba4cc0-8c10-4531-992b-966caec8d4f2','CREATE',NULL,'{"proposalNumber":"PROP-1003","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","createdBy":"Aditya Tripathi","status":"DRAFT","totalAmount":118,"itemCount":1}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T12:35:42.956Z');
INSERT INTO audit_logs VALUES('audit-1770726962091-8mgng6a60','Proposal','2981e4de-d1e8-4d6d-ac8e-0fa902b1c687','CREATE',NULL,'{"proposalNumber":"PROP-1004","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","createdBy":"Aditya Tripathi","status":"DRAFT","totalAmount":236,"itemCount":1}','498f5270-6bbb-4d9f-8198-8f4c9385f0f1','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-10T12:36:02.091Z');
INSERT INTO audit_logs VALUES('audit-1770921707602-2uwma8xee','Device','5104a876-92ed-49c3-ad02-cd0485496045','CREATE',NULL,'{"name":"LIBI","category":"Light Device","make":"BuildINT","model":"DD-PP-CC-55","unitPrice":30}','19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T18:41:47.602Z');
INSERT INTO audit_logs VALUES('audit-1770921754599-x02yazdvi','Proposal','d498d76e-e7aa-4e46-8f35-29eed51e020a','CREATE',NULL,'{"proposalNumber":"PROP-1005","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","createdBy":"Mandar Gaitonde","status":"DRAFT","totalAmount":106.2,"itemCount":1}','19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T18:42:34.599Z');
INSERT INTO audit_logs VALUES('audit-1770923924422-raygu4ejr','Proposal','3258858f-5326-4f8f-aee4-0349e26b5ed4','CREATE',NULL,'{"proposalNumber":"PROP-1006","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","createdBy":"Yuvraj ","status":"DRAFT","totalAmount":469.64,"itemCount":1}','61c5ba72-3392-4e23-914c-3f84763f0d7a','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T19:18:44.422Z');
INSERT INTO audit_logs VALUES('audit-1770927546281-z5wwgbt9t','Proposal','9cba4cc0-8c10-4531-992b-966caec8d4f2','DELETE','{"proposalNumber":"PROP-1003","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","status":"DRAFT","totalAmount":118}',NULL,'19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T20:19:06.282Z');
INSERT INTO audit_logs VALUES('audit-1770934168341-etciimil4','Proposal','3258858f-5326-4f8f-aee4-0349e26b5ed4','DELETE','{"proposalNumber":"PROP-1006","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","status":"DRAFT","totalAmount":469.64}',NULL,'19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T22:09:28.341Z');
INSERT INTO audit_logs VALUES('audit-1770934171194-0izzi02ye','Proposal','d498d76e-e7aa-4e46-8f35-29eed51e020a','DELETE','{"proposalNumber":"PROP-1005","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","status":"DRAFT","totalAmount":106.2}',NULL,'19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T22:09:31.194Z');
INSERT INTO audit_logs VALUES('audit-1770934173800-dvq59qk3q','Proposal','2981e4de-d1e8-4d6d-ac8e-0fa902b1c687','DELETE','{"proposalNumber":"PROP-1004","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","status":"DRAFT","totalAmount":236}',NULL,'19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T22:09:33.800Z');
INSERT INTO audit_logs VALUES('audit-1770934176232-d6y1w0j4n','Proposal','25f4ab1b-1344-4707-8a62-b6e8db2a0160','DELETE','{"proposalNumber":"PROP-1000","clientId":"2ad81d4a-f1ca-4d3f-8690-4e19acfd981f","status":"DRAFT","totalAmount":295}',NULL,'19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T22:09:36.232Z');
INSERT INTO audit_logs VALUES('audit-1770934260832-e24f33x23','Proposal','04001c66-d5cb-4304-9fc5-e64e89daddc4','CREATE',NULL,'{"proposalNumber":"PROP-1007","proposalTitle":null,"clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","createdBy":"Lovlesh Dagar","status":"DRAFT","totalAmount":259.6,"itemCount":1}','19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T22:11:00.832Z');
INSERT INTO audit_logs VALUES('audit-1770935295726-w2oybnnqr','Proposal','3a439b39-64a4-4dc3-a816-ac746c6a8334','CREATE',NULL,'{"proposalNumber":"PROP-1008","proposalTitle":"Camera Installation - Lucknow","clientId":"9343ef1e-e5ef-4cf5-849b-1d705e342ba4","createdBy":"Mandar Gaitonde","status":"DRAFT","totalAmount":324.5,"itemCount":1}','19304fda-cbcf-4e2b-a09c-5b0a5685f211','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36','2026-02-12T22:28:15.726Z');
CREATE TABLE proposal_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value INTEGER NOT NULL
);
INSERT INTO proposal_sequence VALUES(1,1009);
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
INSERT INTO users VALUES('61c5ba72-3392-4e23-914c-3f84763f0d7a','shweta@gmail.com','$2a$10$/yiBanQ4APuCogxtLGqs5ugyLuCBQhQ/bJT52XPukERxaOPiNtG9C','USER','Shweta','Tripathi',1,'2026-02-12T18:13:21.173Z','2026-02-13T05:50:41.386Z');
CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
INSERT INTO admins VALUES('19304fda-cbcf-4e2b-a09c-5b0a5685f211','tripathiaditya149@gmail.com','$2a$10$moVyy4JkewtEuPK9monIh.3mdx6jgepyxILyMsEVuBCsTE3Cr3nzu','SUPERADMIN','Aditya','Tripathi',1,'2026-02-12T18:07:32.942Z','2026-02-12T20:47:20.210Z');
INSERT INTO admins VALUES('dd05c023-20e3-4d5b-8ed5-cf0a3950fbab','rishit@gmail.com','$2a$10$cgPiVUDqExgmx2wg67veMujwCoGRYoi3WZHK5HRVUxi86yBYLIVCq','ADMIN','Rishit','Manapure',1,'2026-02-12T20:52:47.501Z','2026-02-12T20:57:23.876Z');
CREATE TABLE IF NOT EXISTS "proposals" (
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
  updatedAt TEXT NOT NULL, proposalTitle TEXT,
  FOREIGN KEY (clientId) REFERENCES clients(id)
);
INSERT INTO proposals VALUES('04001c66-d5cb-4304-9fc5-e64e89daddc4','PROP-1007','9343ef1e-e5ef-4cf5-849b-1d705e342ba4','Lovlesh Dagar','DRAFT',220.0,18.0,39.60000000000000142,259.6000000000000227,'2026-03-14T22:09:38.808Z','CCTV Camera For Survelliance.','Payment due within 30 days. All prices are in INR.',1,NULL,0,'2026-02-12T22:11:00.808Z','2026-02-12T22:11:00.808Z',NULL);
INSERT INTO proposals VALUES('3a439b39-64a4-4dc3-a816-ac746c6a8334','PROP-1008','9343ef1e-e5ef-4cf5-849b-1d705e342ba4','Mandar Gaitonde','DRAFT',275.0,18.0,49.5,324.5,'2026-03-14T22:26:55.884Z','','Payment due within 30 days. All prices are in INR.',1,NULL,0,'2026-02-12T22:28:15.701Z','2026-02-12T22:28:15.701Z','Camera Installation - Lucknow');
INSERT INTO sqlite_sequence VALUES('schema_migrations',7);
CREATE INDEX idx_clients_isActive ON clients(isActive);
CREATE INDEX idx_devices_isActive ON devices(isActive);
CREATE INDEX idx_devices_name ON devices(name);
CREATE INDEX idx_proposal_items_proposalId ON proposal_items(proposalId);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX idx_audit_logs_recordId ON audit_logs(recordId);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_isActive ON admins(isActive);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_createdAt ON proposals(createdAt);
CREATE INDEX idx_proposals_clientId ON proposals(clientId);
COMMIT;
