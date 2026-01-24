# PostgreSQL + Prisma Setup

## Quick Setup (3 Steps)

### Step 1: Create `.env.local` file

Create `.env.local` in project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/chatbase_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Replace `YOUR_PASSWORD` with your PostgreSQL password.**

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE chatbase_db;
\q
```

### Step 3: Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

**Done!** Your database tables are now created.

---

# Authentication Implementation Summary

## ✅ What Has Been Implemented

### 1. **Database Setup (Prisma + PostgreSQL)**
- ✅ Prisma schema created with User, Account, Session, VerificationToken, and Agent models
- ✅ Prisma client configured in `src/lib/prisma.ts`
- ✅ Database models support both OAuth and email/password authentication

### 2. **NextAuth.js Configuration**
- ✅ NextAuth API route created at `pages/api/auth/[...nextauth].ts`
- ✅ Google OAuth provider configured
- ✅ Credentials provider for email/password authentication
- ✅ JWT session strategy implemented
- ✅ Custom callbacks for user ID in session

### 3. **Authentication Context**
- ✅ `AuthContext` created in `src/contexts/AuthContext.tsx`
- ✅ `useAuth` hook for accessing authentication state
- ✅ Integrated with NextAuth SessionProvider
- ✅ Provides: `user`, `loading`, `signIn`, `signOut`, `isAuthenticated`

### 4. **Frontend Components**
- ✅ Login component updated with Google OAuth and credentials login
- ✅ Signup component updated with registration API integration
- ✅ Both components show loading states and error handling

### 5. **API Routes**
- ✅ Registration API at `pages/api/auth/register.ts`
- ✅ Password hashing with bcryptjs
- ✅ User validation and error handling

### 6. **Protected Routes**
- ✅ Middleware created at `middleware.ts`
- ✅ Protects dashboard, agents, profile, settings, and other authenticated routes
- ✅ Redirects unauthenticated users to login

### 7. **App Integration**
- ✅ `AuthProvider` added to `pages/_app.tsx`
- ✅ Wraps entire application for authentication state

## 📋 Next Steps for You

### Step 1: Install Dependencies
```bash
npm install @prisma/client next-auth@4.24.7 @next-auth/prisma-adapter bcryptjs
npm install -D prisma @types/bcryptjs
```

### Step 2: Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
1. Install PostgreSQL on your machine
2. Create a database: `createdb chatbase_db`

**Option B: Cloud Database (Recommended)**
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app (Free tier available)

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (replace with your actual database URL)
DATABASE_URL="postgresql://username:password@localhost:5432/chatbase_db?schema=public"

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Step 4: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env.local`

### Step 5: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Step 6: Test Authentication

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/login`
3. Test Google OAuth login
4. Test email/password registration and login
5. Verify protected routes redirect to login when not authenticated

## 🔧 Additional Configuration

### Update Sidebar to Show User Info

You may want to update the sidebar component to show the logged-in user's information and add a logout button. Example:

```typescript
import { useAuth } from '@/contexts/AuthContext'

// In your sidebar component
const { user, signOut } = useAuth()

// Add logout button
<Button onClick={signOut}>Logout</Button>
```

### Update AgentsContext to Use Database

Currently, agents are stored in memory. You'll want to:
1. Create API routes for CRUD operations on agents
2. Update `AgentsContext` to fetch from database
3. Link agents to users via `userId` field

## 📝 File Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prisma client
│   └── contexts/
│       └── AuthContext.tsx    # Auth context & hooks
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth].ts  # NextAuth config
│   │       └── register.ts        # Registration API
│   └── _app.tsx               # App with AuthProvider
└── middleware.ts              # Protected routes
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running (if local)
- Verify network access (if cloud database)

### Google OAuth Not Working
- Verify redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Check Client ID and Secret are correct
- Ensure Google+ API is enabled

### Prisma Errors
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply migrations
- Check database connection string format

## 🎉 You're All Set!

Once you've completed the setup steps above, your authentication system will be fully functional with:
- ✅ Google OAuth login
- ✅ Email/password registration and login
- ✅ Protected routes
- ✅ Session management
- ✅ User data stored in PostgreSQL
