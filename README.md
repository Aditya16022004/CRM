# Enterprise IT Proposal & Inventory Management System

A comprehensive web-based CPQ (Configure, Price, Quote) system for IT hardware and services sales, featuring a clean professional purple/white aesthetic, robust inventory management, dynamic proposal generation, and comprehensive audit logging.

## 🎨 Design Philosophy

This system implements a "clean, professional, purple/white" aesthetic specifically adapted for IT sales contexts:

- **Primary Brand Color**: Violet-600 (#7C3AED) - Used for primary actions and CTAs
- **Deep Anchor**: Violet-900 (#4C1D95) - Navigation sidebar and structural headers
- **Canvas White**: #FFFFFF - Data cards and input fields
- **Global Background**: Slate-50 (#F8FAFC) - Application backdrop
- **Typography**: Inter/Plus Jakarta Sans - High legibility for technical data

## 🚀 Features

### Master Inventory Module
- ✅ CRUD operations for IT devices (laptops, servers, networking equipment, etc.)
- ✅ Flexible JSONB specifications storage (CPU, RAM, Storage, etc.)
- ✅ Real-time stock level management with quick-edit capability
- ✅ 'i' icon specification preview dialog
- ✅ Advanced filtering and search (by SKU, Make, Model, Category)
- ✅ Stock status indicators (In Stock / Low Stock / Out of Stock)

### Proposal Builder (CPQ Engine)
- ✅ Custom searchable device dropdown with inline specification preview
- ✅ Dynamic pricing calculator with real-time totals
- ✅ **"Preview-First" Workflow**: Must preview PDF before saving
- ✅ Line-item discounts and quantity adjustments
- ✅ Tax calculation (with tax-exempt client support)
- ✅ Snapshot pricing pattern (historical proposals preserve original prices)

### PDF Generation
- ✅ Professional branded PDF with purple/white theme
- ✅ @react-pdf/renderer implementation
- ✅ Zebra-striped tables for readability
- ✅ Client information, line items, and terms & conditions
- ✅ Downloadable with automatic filename generation

### Audit Logging & Compliance
- ✅ Automatic tracking of all CREATE/UPDATE/DELETE operations
- ✅ JSONB diff storage (only changed fields)
- ✅ Side-by-side diff viewer with red/green highlighting
- ✅ Timeline view with expandable log details
- ✅ IP address and user agent capture
- ✅ RBAC: Admin/Manager access only

### Security & Authentication
- ✅ JWT access tokens (15min expiry)
- ✅ HttpOnly refresh tokens (7 days)
- ✅ Role-Based Access Control (ADMIN, SALES, MANAGER)
- ✅ Request validation with Zod schemas
- ✅ Rate limiting and Helmet security headers

## 📦 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **Tailwind CSS** for utility-first styling
- **Shadcn UI** (Radix primitives) for accessible components
- **TanStack Table** for high-performance data grids
- **Zustand** for global state management
- **React Query** for server state
- **@react-pdf/renderer** for PDF generation
- **React Hook Form + Zod** for form validation

### Backend
- **Node.js 20+** with TypeScript
- **Express** for RESTful API
- **Prisma ORM** for type-safe database access
- **PostgreSQL 14+** with JSONB support
- **JWT** (jsonwebtoken) for authentication
- **Bcrypt** for password hashing
- **Winston** for logging

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 14+ installed and running
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourcompany/it-proposal-crm.git
cd it-proposal-crm
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# This automatically installs frontend and backend via workspaces
```

### 3. Database Setup

#### Create PostgreSQL Database
```bash
createdb it_proposal_db
```

#### Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/it_proposal_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

#### Run Prisma Migrations
```bash
cd backend
npm run db:migrate
npm run db:seed  # Seeds demo data
```

### 4. Start Development Servers

#### Option A: Start Both Servers Simultaneously (Recommended)
```bash
# From project root
npm run dev
```

#### Option B: Start Servers Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Prisma Studio** (Database GUI): `npm run db:studio` in backend folder

### Default Login Credentials
```
Email: admin@example.com
Password: admin123
```

## 📁 Project Structure

```
it-proposal-crm/
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Base Shadcn UI components
│   │   │   ├── inventory/       # Inventory module components
│   │   │   ├── proposal/        # Proposal builder components
│   │   │   ├── audit/           # Audit log components
│   │   │   └── layout/          # App layout (sidebar, header)
│   │   ├── pages/               # Route pages
│   │   ├── store/               # Zustand stores
│   │   ├── lib/                 # Utilities and API client
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.tsx              # Main application component
│   ├── tailwind.config.js       # Tailwind theme configuration
│   └── package.json
├── backend/                      # Node.js backend application
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic (Auth, Audit)
│   │   ├── middleware/          # Express middleware (auth, validation)
│   │   ├── routes/              # API route definitions
│   │   └── index.ts             # Express server entry point
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── package.json
└── package.json                  # Root workspace configuration
```

## 🔑 Key Architectural Patterns

### 1. The Snapshot Pattern (Proposal Historical Integrity)
When a proposal is saved, the system **snapshots** the current inventory data into the `proposal_items` table. This ensures that if the master inventory price changes later (e.g., Dell Laptop goes from $1000 to $1200), historical proposals still show the original $1000.

**Implementation**: See [ProposalController.create()](backend/src/controllers/proposalController.ts)

### 2. The "Preview-First" Workflow (Quality Gate)
The proposal builder enforces a strict state machine:
1. User adds items → **"Download & Save" button is DISABLED**
2. User clicks "Preview PDF" → PDF renders in modal
3. PDF successfully generated → **"Download & Save" button becomes ENABLED**
4. User can now download AND save to database

This prevents accidental submission of unverified proposals.

**Implementation**: See [PDFPreviewModal.tsx](frontend/src/components/proposal/PDFPreviewModal.tsx) and [useProposalStore.ts](frontend/src/store/useProposalStore.ts)

### 3. Audit Middleware Pattern (Automatic Logging)
Controllers return special `auditData` in responses. The [auditMiddleware](backend/src/middleware/audit.ts) intercepts these responses and asynchronously logs them to the `audit_logs` table, ensuring audit trails without blocking the main operation.

### 4. Custom Combobox with stopPropagation
The device dropdown has an 'i' icon inside each option. Clicking the icon must **NOT** select the row. This is achieved by:
```tsx
onClick={(e) => {
  e.stopPropagation(); // Prevents row selection
  openSpecs(item);
}}
```
**Implementation**: See [DeviceCombobox.tsx](frontend/src/components/proposal/DeviceCombobox.tsx)

## 📊 Database Schema Highlights

### JSONB Columns for Flexibility
- `inventory_items.specifications` stores dynamic device specs (CPU, RAM, etc.)
- `audit_logs.old_values` and `new_values` store diffs

### Referential Integrity
- `proposals.client_id` → `clients.id` (Foreign Key)
- `proposal_items.inventory_item_id` → `inventory_items.id` (For lookup)

### Indexes for Performance
- `inventory_items`: Indexed on `category`, `make`, `isActive`
- `proposals`: Indexed on `proposal_number`, `status`, `client_id`
- `audit_logs`: Indexed on `entity`, `record_id`, `timestamp`

## 🔐 Role-Based Permissions

| Action                     | ADMIN | SALES | MANAGER |
|----------------------------|-------|-------|---------|
| View Inventory             | ✅     | ✅     | ✅       |
| Edit Inventory             | ✅     | ❌     | ❌       |
| Create Proposal            | ✅     | ✅     | ✅       |
| View All Proposals         | ✅     | Own    | ✅       |
| Access Audit Logs          | ✅     | ❌     | ✅       |
| Create Users               | ✅     | ❌     | ❌       |

## 🧪 Testing the System

### Manual Testing Flow
1. **Login**: Use `admin@example.com / admin123`
2. **View Inventory**: Navigate to "Master Inventory" to see demo devices
3. **Create Proposal**:
   - Click "Create Proposal" from Dashboard
   - Select a client (Demo Client Corp)
   - Add devices using the combobox
   - Adjust quantities and discounts
   - Click "Preview PDF" (mandatory)
   - Click "Download & Save" to persist
4. **Check Audit Logs**: Navigate to "Audit Logs" to see tracked changes

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the `dist` folder
```

### Backend (Railway/Render/Heroku)
```bash
cd backend
npm run build
# Start with: node dist/index.js
```

### Environment Variables (Production)
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure CORS_ORIGIN to your frontend domain
- Use managed PostgreSQL (e.g., Railway, Supabase)

## 📝 API Documentation

### Auth Endpoints
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Inventory Endpoints
- `GET /api/inventory` - List inventory (with pagination)
- `POST /api/inventory` - Create item (Admin only)
- `PUT /api/inventory/:id` - Update item (Admin only)
- `PATCH /api/inventory/:id/stock` - Quick stock update

### Proposal Endpoints
- `GET /api/proposals` - List proposals (filtered by role)
- `POST /api/proposals` - Create proposal with snapshot
- `PATCH /api/proposals/:id/status` - Update status
- `PATCH /api/proposals/:id/previewed` - Mark as previewed

### Audit Endpoints
- `GET /api/audit` - List all audit logs (Admin/Manager)
- `GET /api/audit/:entity/:recordId` - Get logs for specific record

## 🎯 Future Enhancements

- [ ] **Bundling & Kitting**: Pre-defined device packages (e.g., "New Hire Kit")
- [ ] **Approval Workflows**: Margin-based proposal approvals
- [ ] **Version Control**: PROP-1001-v2 for proposal revisions
- [ ] **Multi-Currency**: Support EUR, GBP in proposals
- [ ] **Email Integration**: Send proposals directly to clients
- [ ] **Advanced Reporting**: Sales analytics dashboard
- [ ] **Real-time Collaboration**: WebSocket for multi-user editing

## 📄 License

Proprietary - All Rights Reserved

## 👥 Support

For support, email support@yourcompany.com or join our Slack channel.

---

**Built with** ❤️ **using React, Node.js, PostgreSQL, and the Purple/White Design System**
