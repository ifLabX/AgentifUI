# AgentifUI Project Full Deployment Guide

This document provides a step-by-step guide to deploy the AgentifUI project from scratch, including environment setup, Supabase configuration, environment variable settings, and administrator account creation.

## 📋 Environment Preparation Checklist

### 1. Required Software and Tools

Before starting, make sure the following tools are installed on your system:

| Tool             | Minimum Version | Recommended Version | Installation Method              | Verification Command |
| ---------------- | --------------- | ------------------- | -------------------------------- | -------------------- |
| **Node.js**      | 18.0.0+         | 22.15.0+            | [Download](https://nodejs.org/)  | `node --version`     |
| **pnpm**         | 9.0.0+          | 10.11.0+            | `npm install -g pnpm`            | `pnpm --version`     |
| **Git**          | 2.30.0+         | 2.39.5+             | [Download](https://git-scm.com/) | `git --version`      |
| **Supabase CLI** | 1.0.0+          | Latest              | `pnpm add -g supabase`           | `supabase --version` |

### 2. Installation Steps

#### Install Node.js

```bash
# Method 1: Download from the official website
# Visit https://nodejs.org/ and download the LTS version

# Method 2: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.15.0
nvm use 22.15.0
```

#### Install pnpm

```bash
npm install -g pnpm
```

#### Install Supabase CLI

```bash
pnpm add -g supabase
```

## 🚀 Project Clone and Dependency Installation

### 1. Clone the Project

```bash
# Clone the project repository
git clone https://github.com/ifLabX/AgentifUI.git

# Navigate into the project directory
cd AgentifUI

# Install project dependencies
pnpm install
```

### 2. Verify Installation

```bash
# Check versions of all tools
echo "=== Environment Check ==="
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Git: $(git --version)"
echo "Supabase CLI: $(supabase --version)"
echo "=========================="
```

## 🗄️ Supabase Project Creation and Configuration

### 1. Create a Supabase Account

1. Visit the [Supabase Sign Up Page](https://supabase.com/dashboard/sign-up)
2. Choose a registration method:
   - **Recommended**: Sign in with GitHub (click "Continue with GitHub")
   - Or register with email and password
3. If registering with email, confirm your email address

### 2. Create an Organization (if needed)

If you're new to Supabase:

1. Click "Create Organization" in the dashboard
2. Enter a name (e.g., "Your Company")
3. Choose "Personal" for individual use
4. Select the "Free - 0 USD/month" plan
5. Click "Create Organization"

### 3. Create a New Project

1. Click "New Project" in the Supabase dashboard
2. Fill in the project information:
   - **Project Name**: e.g., "AgentifUI"
   - **Database Password**: Choose a strong password and save it
   - **Region**: Choose one close to you (e.g., "Southeast Asia (Singapore)")
   - **Pricing Plan**: Select one that fits your needs
3. Click "Create new project"
4. Wait for 1–2 minutes for the project to initialize

### 4. Get API Keys and Config Info

After project creation:

1. Go to **"Settings"** (gear icon) in the left sidebar
2. Select the **"API"** tab
3. Record the following details:

| Config Key       | Location                        | Description                                         |
| ---------------- | ------------------------------- | --------------------------------------------------- |
| **Project URL**  | API Settings → URL              | Format like `https://xxx.supabase.co`               |
| **anon public**  | API Settings → Project API keys | Public anonymous key (starts with `eyJ...`)         |
| **service_role** | API Settings → Project API keys | Full access service role key (starts with `eyJ...`) |

⚠️ **Important Security Note**:

- `anon public` key can be used in frontend code
- `service_role` key has full DB access and should **only** be used server-side

## ⚙️ Environment Variable Configuration

### 1. Create Environment Variable File

In the project root directory:

```bash
cp .env.example .env.local 2>/dev/null || touch .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` and fill in:

```ini
# ===========================================
# Supabase Config (Required)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# API Encryption Config (Required)
# ===========================================
API_ENCRYPTION_KEY=your_random_32_byte_hex_string_here

# ===========================================
# App Config (Required)
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# SSO Config (Optional - if using CAS SSO)
# ===========================================
NEXT_PUBLIC_SSO_ONLY_MODE=false
```

### 3. Generate API Encryption Key

```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online
# Use https://www.random.org/strings/ to generate a 64-char hex string
```

## 🔗 Connect to Supabase Cloud

### 1. Log in to Supabase CLI

```bash
supabase login
# Follow browser prompt to authenticate
```

### 2. Link Project

```bash
supabase link --project-ref your-project-id
# Get project ID from the URL, e.g.:
# https://supabase.com/dashboard/project/abcdefghijklmnop
```

### 3. Run Database Migrations

```bash
supabase db push
supabase migration list
```

If you encounter issues:

```bash
supabase status
# Reset (if needed)
supabase db reset
supabase db push
```

## 👤 Create Admin Account

### 1. Register a Normal User

```bash
pnpm run dev
```

1. Visit http://localhost:3000
2. Click "Register" or go to http://localhost:3000/register
3. Sign up with email and password
4. Verify your email if required

### 2. Set Admin Role via Supabase Console

SQL Editor (Recommended)

```sql
-- Replace with your registered email
SELECT public.initialize_admin('your-email@example.com');
```

### 3. Verify Admin Access

1. Re-login
2. Visit http://localhost:3000/admin
3. If successful, you're an admin

## 🧪 Test Deployment

### 1. Start Dev Server

```bash
pnpm run dev
```

### 2. Test Checklist

Visit http://localhost:3000 and check:

- [ ] **User Registration/Login**
  - [ ] Email signup/login
- [ ] **Chat Features**
  - [ ] Start new chat
  - [ ] Send and receive messages
- [ ] **Admin Interface**
  - [ ] Access `/admin`
  - [ ] Manage API keys and users
- [ ] **Database Connectivity**
  - [ ] User data saved
  - [ ] Chat history saved

## 🚀 Production Deployment

### 1. Production Env Vars

```ini
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
API_ENCRYPTION_KEY=your-production-encryption-key
```

### 2. Build and Deploy

```bash
pnpm run deploy
# Or deploy to Vercel, Netlify, etc.
```

### 3. Security Checklist

- [ ] Sensitive vars set correctly
- [ ] `service_role` not exposed
- [ ] API key encrypted
- [ ] RLS enabled
- [ ] Strong admin passwords

## 📚 Related Docs

- [Setup Requirements](./SETUP-REQUIREMENTS.md)
- [Contribution Guide](../CONTRIBUTING.md)
- [API Key Management](./README-API-KEY-MANAGEMENT.md)
- [Database Design](./DATABASE-DESIGN.md)
- [Supabase Config](./supabase-docs.md)

## 🆘 Get Help

1. Open GitHub issues
2. Read related docs
3. Contact maintainers

---

**Good luck with your deployment!** 🎉
