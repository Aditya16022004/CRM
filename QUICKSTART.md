# Quick Start Guide

Get your Enterprise IT Proposal & Inventory Management System up and running in 5 minutes.

## ⚡ Prerequisites Checklist

- [ ] Node.js 20+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed and running (`psql --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed

## 🚀 Installation Steps

### Step 1: Clone and Install
```powershell
# Clone the repository
git clone <your-repo-url>
cd CRM

# Install all dependencies (frontend + backend)
npm install
```

### Step 2: Configure Database

#### Create PostgreSQL Database
```powershell
# Option A: Using psql command-line
psql -U postgres
CREATE DATABASE it_proposal_db;
\q

# Option B: Using createdb utility
createdb it_proposal_db
```

#### Set up environment files
```powershell
# Backend configuration
cp backend\.env.example backend\.env

# Frontend configuration
cp frontend\.env.example frontend\.env
```

**Edit `backend\.env`** and update the `DATABASE_URL`:
```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/it_proposal_db"
```

Replace `your_username` and `your_password` with your PostgreSQL credentials.

### Step 3: Initialize Database
```powershell
cd backend

# Run Prisma migrations (creates tables)
npm run db:migrate

# Seed demo data (creates users, clients, inventory)
npm run db:seed
```

### Step 4: Start the Application

#### Option A: Run both servers together (Recommended)
```powershell
# From the project root
npm run dev
```

#### Option B: Run separately
```powershell
# Terminal 1 - Backend server
cd backend
npm run dev

# Terminal 2 - Frontend dev server (in a new terminal)
cd frontend
npm run dev
```

### Step 5: Access the Application

Open your browser and navigate to:
**http://localhost:3000**

## 🔑 Demo Login Credentials

| Role  | Email                | Password   |
|-------|----------------------|------------|
| Admin | admin@example.com    | admin123   |
| Sales | sales@example.com    | sales123   |

## 📊 What's Included After Seeding

### Users
- 1 Admin user (full access)
- 1 Sales representative

### Clients
- Demo Client Corp (taxable)
- Tech Startup Inc (tax-exempt)

### Inventory (6 items)
- **Laptops**: Dell Latitude 7420, HP EliteBook 850 G8
- **Servers**: Dell PowerEdge R740
- **Networking**: Cisco Catalyst 9200L
- **Monitors**: Dell UltraSharp U2722DE

## ✅ Verify Installation

1. **Login**: Use admin credentials
2. **Check Inventory**: Navigate to "Master Inventory" - you should see 5+ items
3. **Create Test Proposal**:
   - Click "Create Proposal"
   - Select "Demo Client Corp"
   - Add a laptop using the device dropdown
   - Click "Preview PDF" (mandatory step)
   - Click "Download & Save"
4. **View Audit Logs**: Check that the proposal creation was logged

## 🛠️ Useful Development Commands

```powershell
# Backend
cd backend
npm run dev           # Start development server
npm run db:studio     # Open Prisma Studio (database GUI)
npm run db:migrate    # Create new migration
npm run db:seed       # Re-seed database
npm run db:reset      # Reset and re-seed database

# Frontend
cd frontend
npm run dev           # Start Vite dev server
npm run build         # Build for production
npm run preview       # Preview production build
```

## 🐛 Troubleshooting

### Issue: Database connection failed
**Solution**: Verify PostgreSQL is running
```powershell
# Windows: Check service
Get-Service -Name postgresql*

# Start if not running
Start-Service postgresql-x64-14
```

### Issue: Port 5000 or 3000 already in use
**Solution**: Change ports in environment files
```env
# backend/.env
PORT=5001

# frontend/.env
VITE_API_URL=http://localhost:5001/api
```

### Issue: `prisma` command not found
**Solution**: Install Prisma CLI globally
```powershell
npm install -g prisma
```

### Issue: JWT authentication errors
**Solution**: Ensure JWT secrets are set in `backend/.env`
```env
JWT_SECRET="your-unique-secret-here"
JWT_REFRESH_SECRET="another-unique-secret-here"
```

### Issue: Frontend can't connect to backend
**Solution**: Check CORS origin in `backend/.env`
```env
CORS_ORIGIN="http://localhost:3000"
```

## 📦 Tech Stack Reference

| Layer      | Technology     | Purpose                   |
|------------|----------------|---------------------------|
| Frontend   | React 18       | UI framework              |
| State      | Zustand        | Global state management   |
| Styling    | Tailwind CSS   | Utility-first CSS         |
| API Client | React Query    | Server state management   |
| Backend    | Express        | RESTful API               |
| ORM        | Prisma         | Type-safe database access |
| Database   | PostgreSQL     | Data persistence          |
| Auth       | JWT            | Stateless authentication  |

## 🎨 Color System Quick Reference

```css
/* Primary Actions */
--primary-600: #7C3AED  /* Buttons, CTAs */

/* Navigation & Headers */
--primary-900: #4C1D95  /* Sidebar, structural headers */

/* Backgrounds */
--slate-50: #F8FAFC     /* App backdrop */
--white: #FFFFFF        /* Cards, inputs */

/* Status Colors */
--emerald-500: #10B981  /* Success states */
--rose-500: #F43F5E     /* Errors, destructive actions */
--amber-500: #F59E0B    /* Warnings */
```

## 📖 Next Steps

1. **Explore the codebase**: Start with [README.md](README.md) for full documentation
2. **Customize branding**: Update colors in [tailwind.config.js](frontend/tailwind.config.js)
3. **Add more inventory**: Use Prisma Studio or the Inventory page
4. **Create bundles**: Implement bundle management (schema is ready)
5. **Deploy**: Follow deployment guide in main README

## 💡 Key Features to Test

- ✅ **PDF Preview-First Workflow**: Can't save without previewing
- ✅ **Specification Dialog**: Click 'i' icon in device dropdown
- ✅ **Quick Stock Edit**: Click stock level in inventory table
- ✅ **Audit Tracking**: All changes are logged automatically
- ✅ **Role-Based Access**: Try logging in as Sales vs Admin
- ✅ **Tax Calculation**: Create proposals for tax-exempt vs taxable clients

## 🆘 Getting Help

- Check [README.md](README.md) for detailed architecture documentation
- Review Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Inspect API routes: [backend/src/routes/index.ts](backend/src/routes/index.ts)
- Frontend components: [frontend/src/components/](frontend/src/components/)

---

**Happy Building! 🚀** If you encounter any issues, refer to the Troubleshooting section above.
