# API Documentation

Complete reference for the Enterprise IT Proposal & Inventory Management System REST API.

**Base URL**: `http://localhost:5000/api`  
**Authentication**: JWT Bearer tokens (except login/register)

## 📋 Table of Contents
- [Authentication](#authentication)
- [Inventory](#inventory)
- [Clients](#clients)
- [Proposals](#proposals)
- [Audit Logs](#audit-logs)
- [Error Handling](#error-handling)

---

## 🔐 Authentication

### Login
Authenticate user and receive access/refresh tokens.

**Endpoint**: `POST /auth/login`  
**Auth Required**: No

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Set Refresh Token**: The response includes `Set-Cookie` header with HttpOnly refresh token.

---

### Refresh Token
Get new access token using refresh token.

**Endpoint**: `POST /auth/refresh`  
**Auth Required**: Refresh token (from cookie)

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Get Current User
Retrieve authenticated user information.

**Endpoint**: `GET /auth/me`  
**Auth Required**: Yes (Access Token)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Register User
Create new user account (Admin only).

**Endpoint**: `POST /auth/register`  
**Auth Required**: Yes (Admin role)

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "SALES"
}
```

**Roles**: `ADMIN`, `SALES`, `MANAGER`

**Response** (201 Created):
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "SALES"
}
```

---

### Logout
Invalidate refresh token.

**Endpoint**: `POST /auth/logout`  
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## 📦 Inventory

### List Inventory Items
Get paginated inventory with optional filters.

**Endpoint**: `GET /inventory`  
**Auth Required**: Yes

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `category` (string, optional): Filter by category
- `search` (string, optional): Search by SKU, make, or model
- `active` (boolean, default: true): Show active items only

**Example**: `/api/inventory?page=1&limit=20&category=Laptops&search=Dell`

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "sku": "DELL-LAT-7420",
      "make": "Dell",
      "model": "Latitude 7420",
      "category": "Laptops",
      "unitCost": 850.00,
      "unitPrice": 1299.99,
      "stockLevel": 25,
      "reorderPoint": 5,
      "specifications": {
        "cpu": "Intel Core i7-1185G7",
        "ram": "16GB DDR4",
        "storage": "512GB NVMe SSD"
      },
      "description": "Business-class laptop",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

### Get Single Inventory Item
Retrieve details of specific inventory item.

**Endpoint**: `GET /inventory/:id`  
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "id": "uuid",
  "sku": "DELL-LAT-7420",
  "make": "Dell",
  "model": "Latitude 7420",
  "category": "Laptops",
  "unitCost": 850.00,
  "unitPrice": 1299.99,
  "stockLevel": 25,
  "specifications": {...},
  "description": "Business-class laptop"
}
```

---

### Create Inventory Item
Add new device to inventory (Admin only).

**Endpoint**: `POST /inventory`  
**Auth Required**: Yes (Admin role)

**Request Body**:
```json
{
  "sku": "HP-ELITE-850",
  "make": "HP",
  "model": "EliteBook 850 G8",
  "category": "Laptops",
  "unitCost": 920.00,
  "unitPrice": 1399.99,
  "stockLevel": 15,
  "reorderPoint": 5,
  "specifications": {
    "cpu": "Intel Core i7-1165G7",
    "ram": "32GB DDR4",
    "storage": "1TB NVMe SSD"
  },
  "description": "Premium business laptop"
}
```

**Validation Rules**:
- `sku`: Required, unique, 3-50 characters
- `make`: Required, 1-100 characters
- `unitCost`, `unitPrice`: Required, positive numbers
- `specifications`: Optional JSONB object

**Response** (201 Created):
```json
{
  "id": "uuid",
  "sku": "HP-ELITE-850",
  "make": "HP",
  "model": "EliteBook 850 G8",
  ...
}
```

---

### Update Inventory Item
Modify existing inventory item (Admin only).

**Endpoint**: `PUT /inventory/:id`  
**Auth Required**: Yes (Admin role)

**Request Body**: Same as Create (all fields optional)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "sku": "HP-ELITE-850",
  "unitPrice": 1299.99,
  ...
}
```

---

### Quick Update Stock
Update only stock level (all authenticated users).

**Endpoint**: `PATCH /inventory/:id/stock`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "stockLevel": 30
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "sku": "DELL-LAT-7420",
  "stockLevel": 30
}
```

---

### Delete Inventory Item
Soft-delete item (sets `isActive` to false) (Admin only).

**Endpoint**: `DELETE /inventory/:id`  
**Auth Required**: Yes (Admin role)

**Response** (200 OK):
```json
{
  "message": "Item deleted successfully"
}
```

---

## 👥 Clients

### List Clients
Get all clients with pagination.

**Endpoint**: `GET /clients`  
**Auth Required**: Yes

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response** (200 OK):
```json
{
  "clients": [
    {
      "id": "uuid",
      "companyName": "Demo Client Corp",
      "billingAddress": "123 Business Ave, Suite 100, New York, NY 10001",
      "contactName": "Jane Smith",
      "contactEmail": "jane.smith@democlient.com",
      "contactPhone": "+1 (555) 123-4567",
      "taxExempt": false,
      "paymentTerms": "Net 30",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 50
}
```

---

### Get Single Client
Retrieve client details.

**Endpoint**: `GET /clients/:id`  
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "id": "uuid",
  "companyName": "Demo Client Corp",
  "billingAddress": "123 Business Ave, Suite 100, New York, NY 10001",
  "shippingAddress": "123 Business Ave, Suite 100, New York, NY 10001",
  "taxId": "TAX123456",
  "taxExempt": false,
  "defaultCurrency": "USD",
  "paymentTerms": "Net 30",
  "contactName": "Jane Smith",
  "contactEmail": "jane.smith@democlient.com",
  "contactPhone": "+1 (555) 123-4567"
}
```

---

### Create Client
Add new client to CRM.

**Endpoint**: `POST /clients`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "companyName": "Tech Startup Inc",
  "billingAddress": "456 Innovation Dr, San Francisco, CA 94105",
  "shippingAddress": "456 Innovation Dr, San Francisco, CA 94105",
  "taxId": "TAX789012",
  "taxExempt": true,
  "defaultCurrency": "USD",
  "paymentTerms": "Net 60",
  "contactName": "John Doe",
  "contactEmail": "john@techstartup.com",
  "contactPhone": "+1 (555) 987-6543"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "companyName": "Tech Startup Inc",
  ...
}
```

---

### Update Client
Modify client information.

**Endpoint**: `PUT /clients/:id`  
**Auth Required**: Yes

**Request Body**: Same as Create (all fields optional)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "companyName": "Tech Startup Inc",
  ...
}
```

---

## 📄 Proposals

### List Proposals
Get proposals with role-based filtering.

**Endpoint**: `GET /proposals`  
**Auth Required**: Yes

**Filtering Rules**:
- **Admin/Manager**: See all proposals
- **Sales**: Only own proposals

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `status` (string, optional): `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`

**Response** (200 OK):
```json
{
  "proposals": [
    {
      "id": "uuid",
      "proposalNumber": "PROP-0001",
      "client": {
        "id": "uuid",
        "companyName": "Demo Client Corp"
      },
      "subtotal": 2599.98,
      "taxRate": 8.5,
      "taxAmount": 221.00,
      "total": 2820.98,
      "status": "DRAFT",
      "isPreviewed": true,
      "createdBy": {
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2024-01-20T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50
}
```

---

### Get Single Proposal
Retrieve full proposal details including line items.

**Endpoint**: `GET /proposals/:id`  
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "id": "uuid",
  "proposalNumber": "PROP-0001",
  "client": {
    "id": "uuid",
    "companyName": "Demo Client Corp",
    "billingAddress": "..."
  },
  "items": [
    {
      "id": "uuid",
      "quantity": 2,
      "discountPercent": 5.00,
      "subtotal": 2469.98,
      "snapshotSku": "DELL-LAT-7420",
      "snapshotMake": "Dell",
      "snapshotModel": "Latitude 7420",
      "snapshotPrice": 1299.99,
      "snapshotSpecs": {
        "cpu": "Intel Core i7-1185G7",
        "ram": "16GB DDR4"
      }
    }
  ],
  "subtotal": 2469.98,
  "taxRate": 8.5,
  "taxAmount": 209.95,
  "total": 2679.93,
  "status": "DRAFT",
  "isPreviewed": true,
  "notes": "Q1 2024 hardware refresh",
  "termsAndConditions": "Payment due within 30 days...",
  "createdBy": {...},
  "createdAt": "2024-01-20T14:30:00Z"
}
```

---

### Create Proposal
Create new proposal with snapshot pricing.

**Endpoint**: `POST /proposals`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "clientId": "uuid",
  "items": [
    {
      "inventoryItemId": "uuid",
      "quantity": 2,
      "discountPercent": 5.00
    },
    {
      "inventoryItemId": "uuid",
      "quantity": 1,
      "discountPercent": 0
    }
  ],
  "notes": "Q1 2024 hardware refresh",
  "termsAndConditions": "Payment due within 30 days..."
}
```

**Snapshot Behavior**:
- System automatically captures current prices/specs from inventory
- Stored in `snapshotSku`, `snapshotPrice`, `snapshotSpecs` fields
- Future inventory changes don't affect historical proposals

**Response** (201 Created):
```json
{
  "id": "uuid",
  "proposalNumber": "PROP-0001",
  "client": {...},
  "items": [...],
  "subtotal": 2469.98,
  "total": 2679.93,
  "auditData": {
    "entity": "Proposal",
    "action": "CREATE",
    "recordId": "uuid"
  }
}
```

---

### Update Proposal Status
Change proposal status (e.g., DRAFT → SENT → ACCEPTED).

**Endpoint**: `PATCH /proposals/:id/status`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "status": "SENT"
}
```

**Valid Status Transitions**:
- `DRAFT` → `SENT`
- `SENT` → `ACCEPTED` or `REJECTED`

**Response** (200 OK):
```json
{
  "id": "uuid",
  "proposalNumber": "PROP-0001",
  "status": "SENT"
}
```

---

### Mark Proposal as Previewed
Set `isPreviewed` flag (enforces Preview-First workflow).

**Endpoint**: `PATCH /proposals/:id/previewed`  
**Auth Required**: Yes

**Response** (200 OK):
```json
{
  "id": "uuid",
  "isPreviewed": true
}
```

---

## 📋 Audit Logs

### List Audit Logs
Get audit trail (Admin/Manager only).

**Endpoint**: `GET /audit`  
**Auth Required**: Yes (Admin/Manager role)

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 100)
- `entity` (string, optional): `Proposal`, `InventoryItem`, `Client`
- `action` (string, optional): `CREATE`, `UPDATE`, `DELETE`
- `userId` (string, optional): Filter by user ID

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": "uuid",
      "entity": "Proposal",
      "action": "CREATE",
      "recordId": "uuid",
      "userId": "uuid",
      "user": {
        "firstName": "Admin",
        "lastName": "User"
      },
      "oldValues": null,
      "newValues": {
        "status": "DRAFT",
        "total": 2679.93
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-20T14:30:00Z"
    }
  ],
  "total": 234,
  "page": 1,
  "limit": 100
}
```

---

### Get Audit Logs for Specific Record
Retrieve history for a single entity.

**Endpoint**: `GET /audit/:entity/:recordId`  
**Auth Required**: Yes (Admin/Manager role)

**Example**: `/api/audit/Proposal/uuid-here`

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "UPDATE",
      "oldValues": {
        "status": "DRAFT"
      },
      "newValues": {
        "status": "SENT"
      },
      "timestamp": "2024-01-21T09:00:00Z"
    }
  ]
}
```

---

## ⚠️ Error Handling

### Error Response Format
All errors follow consistent structure:

```json
{
  "error": "Error message here",
  "details": ["Validation error 1", "Validation error 2"]
}
```

### HTTP Status Codes

| Code | Meaning           | Example                             |
|------|-------------------|-------------------------------------|
| 200  | OK                | Successful GET/PUT/PATCH            |
| 201  | Created           | Successful POST                     |
| 400  | Bad Request       | Validation errors, missing fields   |
| 401  | Unauthorized      | Missing/invalid access token        |
| 403  | Forbidden         | Insufficient role permissions       |
| 404  | Not Found         | Resource doesn't exist              |
| 409  | Conflict          | Duplicate SKU, unique constraint    |
| 500  | Internal Error    | Unexpected server error             |

### Common Error Examples

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "error": "Insufficient permissions. Required role: ADMIN"
}
```

#### 400 Bad Request (Validation)
```json
{
  "error": "Validation failed",
  "details": [
    "sku: String must contain at least 3 character(s)",
    "unitPrice: Number must be greater than 0"
  ]
}
```

#### 404 Not Found
```json
{
  "error": "Inventory item not found"
}
```

---

## 🔒 Authentication Flow

### Initial Login
1. `POST /api/auth/login` with credentials
2. Receive `accessToken` (store in memory) and `refreshToken` (HttpOnly cookie)
3. Include `Authorization: Bearer <accessToken>` in subsequent requests

### Token Refresh (when access token expires)
1. `POST /api/auth/refresh` (refresh token sent automatically via cookie)
2. Receive new `accessToken`
3. Update in-memory token and retry original request

### Logout
1. `POST /api/auth/logout`
2. Server clears refresh token cookie
3. Client discards access token

---

## 📊 Rate Limiting

- **Global limit**: 100 requests per 15 minutes per IP
- **Login endpoint**: 5 requests per 15 minutes per IP
- Exceeding limit returns `429 Too Many Requests`

---

## 🧪 Example: Creating a Proposal (Full Flow)

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Save the `accessToken` from response**

### 2. Get Clients
```bash
curl -X GET http://localhost:5000/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note the `clientId` you want to use**

### 3. Get Inventory
```bash
curl -X GET http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note the `inventoryItemId` values**

### 4. Create Proposal
```bash
curl -X POST http://localhost:5000/api/proposals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-uuid-here",
    "items": [
      {
        "inventoryItemId": "item-uuid-1",
        "quantity": 2,
        "discountPercent": 5.00
      }
    ],
    "notes": "Q1 2024 hardware refresh"
  }'
```

---

## 🔗 Related Documentation

- [README.md](README.md): Full architecture overview
- [QUICKSTART.md](QUICKSTART.md): Setup instructions
- [Database Schema](backend/prisma/schema.prisma): Entity relationships

---

**Generated for**: Enterprise IT Proposal & Inventory Management System  
**API Version**: 1.0.0  
**Last Updated**: 2024
